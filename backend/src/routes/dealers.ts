import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { fuzzyMatchDealer } from '../utils/fuzzySearch';

const router = express.Router();

// All dealer routes require authentication and active subscription
router.use(authenticate);
router.use(requireActiveSubscription);

// Get all dealers for user's company
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, status, buyingGroup, groupId, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      companyId: req.companyId!
    };

    // Apply status and buyingGroup filters first
    if (status && status !== 'All Statuses') {
      where.status = status;
    }

    if (buyingGroup && buyingGroup !== 'All Buying Groups') {
      where.buyingGroup = buyingGroup;
    }

    // Apply group filter (many-to-many relationship)
    if (groupId && groupId !== 'All Groups') {
      where.groups = {
        some: {
          groupId: groupId as string
        }
      };
    }

    let dealers: any[] = [];
    let total = 0;
    let useFuzzySearch = false;

    if (search) {
      const searchTerm = (search as string).trim();
      
      // Special handling for single character searches - use startsWith for company name, first name, and last name
      const isSingleChar = searchTerm.length === 1;
      
      // First, try exact/contains match (faster, more precise)
      // For single character, use startsWith for companyName and contactName to get all matches starting with that letter
      if (isSingleChar) {
        // For single character, use startsWith for company name and contact name (matches first name)
        // Also check if contactName contains a word starting with that letter (matches last name)
        // ONLY match company name, first name, or last name - exclude email, phone, buyingGroup
        const exactWhere: any = {
          ...where,
          OR: [
            { companyName: { startsWith: searchTerm, mode: 'insensitive' } },
            { contactName: { startsWith: searchTerm, mode: 'insensitive' } },
            // Match last names by checking if contactName contains a space followed by the letter
            { contactName: { contains: ` ${searchTerm}`, mode: 'insensitive' } }
          ]
        };

        const exactTotal = await prisma.dealer.count({ where: exactWhere });

        // If we found results with exact match, use those (with pagination)
        if (exactTotal > 0) {
          const [paginatedDealers] = await Promise.all([
            prisma.dealer.findMany({
              where: exactWhere,
              skip,
              take: limitNum,
              orderBy: { createdAt: 'desc' },
              include: {
                _count: {
                  select: {
                    dealerNotes: true,
                    photos: true,
                    voiceRecordings: true,
                    todos: true
                  }
                },
                groups: {
                  include: {
                    group: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            })
          ]);
          dealers = paginatedDealers;
          total = exactTotal;
        } else {
          // No exact matches, try fuzzy search
          useFuzzySearch = true;
          // Fetch all dealers for the company (with filters applied)
          const allDealers = await prisma.dealer.findMany({
            where,
            include: {
              _count: {
                select: {
                  dealerNotes: true,
                  photos: true,
                  voiceRecordings: true,
                  todos: true
                }
              },
              groups: {
                include: {
                  group: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              },
              buyingGroupHistory: {
                where: {
                  endDate: null // Only active buying group associations
                },
                include: {
                  buyingGroup: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          });

          // Apply fuzzy matching with improved word-by-word matching
          const fuzzyMatches = allDealers.filter(dealer => {
            const groupNames = dealer.groups?.map((dg: any) => dg.group.name).join(' ') || '';
            const buyingGroupNames = dealer.buyingGroupHistory?.map((h: any) => h.buyingGroup.name).join(' ') || '';
            
            // First try exact contains match with word-by-word for contact names
            const searchLower = searchTerm.toLowerCase().trim();
            if (dealer.companyName?.toLowerCase().includes(searchLower)) return true;
            if (dealer.contactName) {
              const contactLower = dealer.contactName.toLowerCase();
              if (contactLower.includes(searchLower)) return true;
              // Word-by-word check for last names
              const words = contactLower.split(/\s+/);
              for (const word of words) {
                if (word === searchLower || word.includes(searchLower) || searchLower.includes(word)) {
                  return true;
                }
              }
            }
            if (dealer.email?.toLowerCase().includes(searchLower)) return true;
            if (dealer.phone?.includes(searchTerm)) return true;
            if (dealer.buyingGroup?.toLowerCase().includes(searchLower)) return true;
            if (groupNames.toLowerCase().includes(searchLower)) return true;
            if (buyingGroupNames.toLowerCase().includes(searchLower)) return true;
            
            // Then try fuzzy matching
            return fuzzyMatchDealer(searchTerm, {
              companyName: dealer.companyName,
              contactName: dealer.contactName,
              email: dealer.email,
              phone: dealer.phone,
              buyingGroup: dealer.buyingGroup || buyingGroupNames,
              groups: groupNames
            }, 0.4) // 40% similarity threshold for better semantic matching
          });
          
          console.log(`Fuzzy search: "${searchTerm}" found ${fuzzyMatches.length} matches`);

          // Sort fuzzy matches by creation date (newest first)
          fuzzyMatches.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          // Apply pagination to fuzzy matches
          dealers = fuzzyMatches.slice(skip, skip + limitNum);
          total = fuzzyMatches.length;
        }
      } else {
        // Multi-character search - use semantic/fuzzy search for better matching
        // This handles typos, partial matches, and word-by-word matching (e.g., "Skolnick" matches "Donna Skolnick")
        useFuzzySearch = true;
        
        // Fetch all dealers for the company (with filters applied)
        const allDealers = await prisma.dealer.findMany({
          where,
          include: {
            _count: {
              select: {
                dealerNotes: true,
                photos: true,
                voiceRecordings: true,
                todos: true
              }
            },
            groups: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            buyingGroupHistory: {
              where: {
                endDate: null // Only active buying group associations
              },
              include: {
                buyingGroup: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        });

        // Apply semantic/fuzzy matching with improved word-by-word matching
        const fuzzyMatches = allDealers.filter(dealer => {
          const groupNames = dealer.groups?.map((dg: any) => dg.group.name).join(' ') || '';
          const buyingGroupNames = dealer.buyingGroupHistory?.map((h: any) => h.buyingGroup.name).join(' ') || '';
          
          // First try exact contains match (faster for exact matches)
          const searchLower = searchTerm.toLowerCase().trim();
          
          // Check company name
          if (dealer.companyName?.toLowerCase().includes(searchLower)) return true;
          
          // Check contact name - both full match and word-by-word (for last names like "Skolnick")
          if (dealer.contactName) {
            const contactLower = dealer.contactName.toLowerCase();
            if (contactLower.includes(searchLower)) return true;
            // Word-by-word check for last names (e.g., "Skolnick" in "Donna Skolnick")
            const words = contactLower.split(/\s+/);
            for (const word of words) {
              if (word === searchLower || word.includes(searchLower) || searchLower.includes(word)) {
                return true;
              }
            }
          }
          
          // Check other fields
          if (dealer.email?.toLowerCase().includes(searchLower)) return true;
          if (dealer.phone?.includes(searchTerm)) return true;
          if (dealer.buyingGroup?.toLowerCase().includes(searchLower)) return true;
          if (groupNames.toLowerCase().includes(searchLower)) return true;
          if (buyingGroupNames.toLowerCase().includes(searchLower)) return true;
          
          // Then try fuzzy/semantic matching for typos and partial matches
          return fuzzyMatchDealer(searchTerm, {
            companyName: dealer.companyName,
            contactName: dealer.contactName,
            email: dealer.email,
            phone: dealer.phone,
            buyingGroup: dealer.buyingGroup || buyingGroupNames,
            groups: groupNames
          }, 0.4) // 40% similarity threshold for better semantic matching
        });
        
        console.log(`Semantic search: "${searchTerm}" found ${fuzzyMatches.length} matches out of ${allDealers.length} dealers`);

        // Sort fuzzy matches by relevance (exact matches first, then by similarity)
        fuzzyMatches.sort((a, b) => {
          const aExact = 
            (a.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             a.contactName?.toLowerCase().includes(searchTerm.toLowerCase())) ? 1 : 0;
          const bExact = 
            (b.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             b.contactName?.toLowerCase().includes(searchTerm.toLowerCase())) ? 1 : 0;
          
          if (aExact !== bExact) return bExact - aExact;
          
          // Then by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Apply pagination to fuzzy matches
        dealers = fuzzyMatches.slice(skip, skip + limitNum);
        total = fuzzyMatches.length;
      }
    } else {
      // No search term, just get all dealers with filters
      const [allDealers, allTotal] = await Promise.all([
        prisma.dealer.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                dealerNotes: true,
                photos: true,
                voiceRecordings: true,
                todos: true
              }
            },
            groups: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.dealer.count({ where })
      ]);

      dealers = allDealers;
      total = allTotal;
    }

    // Dealers are already paginated (either by Prisma for exact matches or by slice for fuzzy matches)
    res.json({
      dealers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get dealers error:', error);
    res.status(500).json({ error: 'Failed to fetch dealers' });
  }
});

// Get unique buying groups (MUST be before /:id route to avoid route conflicts)
router.get('/buying-groups/list', async (req: AuthRequest, res) => {
  try {
    const buyingGroups = await prisma.dealer.findMany({
      where: {
        companyId: req.companyId!,
        buyingGroup: { not: null }
      },
      select: {
        buyingGroup: true
      },
      distinct: ['buyingGroup']
    });

    res.json(buyingGroups.map((bg: { buyingGroup: string | null }) => bg.buyingGroup).filter(Boolean));
  } catch (error) {
    console.error('Get buying groups list error:', error);
    res.status(500).json({ error: 'Failed to fetch buying groups' });
  }
});

// Get single dealer
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const dealerId = req.params.id?.trim();
    const companyId = req.companyId!;
    
    // Validate dealer ID
    if (!dealerId || dealerId.length === 0) {
      console.error('Invalid dealer ID provided:', dealerId);
      return res.status(400).json({ error: 'Invalid dealer ID' });
    }
    
    // Validate companyId is set
    if (!companyId) {
      console.error('Company ID not set in request');
      return res.status(401).json({ error: 'Authentication error: Company ID not found' });
    }
    
    console.log(`[DEALER LOOKUP] Fetching dealer: id="${dealerId}" (length: ${dealerId.length}), companyId="${companyId}"`);
    
    // First, try to find dealer with companyId check
    let dealer = await prisma.dealer.findFirst({
      where: {
        id: dealerId,
        companyId: companyId // Ensure data isolation
      },
      include: {
        dealerNotes: {
          orderBy: { createdAt: 'desc' }
        },
        photos: {
          orderBy: { createdAt: 'desc' }
        },
        voiceRecordings: {
          orderBy: { createdAt: 'desc' }
        },
        todos: {
          where: { completed: false },
          orderBy: { dueDate: 'asc' }
        },
        tradeShows: {
          include: {
            tradeShow: true
          }
        },
        quickActions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        buyingGroupHistory: {
          include: {
            buyingGroup: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      }
    });

    if (!dealer) {
      console.error(`[DEALER LOOKUP FAILED] Dealer not found: id="${dealerId}", companyId="${companyId}"`);
      
      // Check if dealer exists but belongs to different company
      const dealerExists = await prisma.dealer.findFirst({
        where: { id: dealerId },
        select: { id: true, companyId: true, companyName: true }
      });
      
      if (dealerExists) {
        console.error(`[DEALER LOOKUP] Dealer exists but belongs to different company: dealerCompanyId="${dealerExists.companyId}" vs requestCompanyId="${companyId}"`);
        console.error(`[DEALER LOOKUP] Dealer details: name="${dealerExists.companyName}", id="${dealerExists.id}"`);
        return res.status(403).json({ 
          error: 'Dealer not found',
          details: 'This dealer belongs to a different company'
        });
      } else {
        console.error(`[DEALER LOOKUP] Dealer ID does not exist in database: "${dealerId}"`);
        // Check if there are any dealers with similar IDs (for debugging)
        const similarDealers = await prisma.dealer.findMany({
          where: {
            companyId: companyId,
            id: { startsWith: dealerId.substring(0, 10) }
          },
          select: { id: true, companyName: true },
          take: 5
        });
        if (similarDealers.length > 0) {
          console.error(`[DEALER LOOKUP] Found similar dealer IDs:`, similarDealers.map(d => d.id));
        }
      }
      
      return res.status(404).json({ error: 'Dealer not found' });
    }

    console.log(`[DEALER LOOKUP SUCCESS] Dealer found: "${dealer.companyName}" (id: "${dealer.id}")`);
    res.json(dealer);
  } catch (error) {
    console.error('Get dealer error:', error);
    res.status(500).json({ error: 'Failed to fetch dealer' });
  }
});

// Create dealer
router.post('/', async (req: AuthRequest, res) => {
  try {
    let {
      companyName,
      contactName,
      email,
      phone,
      city,
      state,
      zip,
      country,
      address,
      buyingGroup,
      status
    } = req.body;

    // Trim and sanitize inputs
    companyName = companyName?.trim();
    contactName = contactName?.trim();
    email = email?.trim().toLowerCase() || null;
    phone = phone?.trim() || null;
    city = city?.trim() || null;
    state = state?.trim() || null;
    zip = zip?.trim() || null;
    country = country?.trim() || null;
    address = address?.trim() || null;
    buyingGroup = buyingGroup?.trim() || null;
    status = status?.trim() || 'Prospect';

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const dealer = await prisma.dealer.create({
      data: {
        companyId: req.companyId!,
        companyName,
        contactName: contactName || null,
        email,
        phone,
        city,
        state,
        zip,
        country,
        address,
        buyingGroup,
        status
      }
    });

    res.status(201).json(dealer);
  } catch (error) {
    console.error('Create dealer error:', error);
    res.status(500).json({ error: 'Failed to create dealer' });
  }
});

// Update dealer
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const updated = await prisma.dealer.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update dealer error:', error);
    res.status(500).json({ error: 'Failed to update dealer' });
  }
});

// Delete dealer
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    await prisma.dealer.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Delete dealer error:', error);
    res.status(500).json({ error: 'Failed to delete dealer' });
  }
});

// Bulk import from CSV
router.post('/bulk-import', async (req: AuthRequest, res) => {
  const startTime = Date.now();
  try {
    const { dealers, skipDuplicates = false } = req.body; // Array of dealer objects

    console.log(`Bulk import started: ${dealers?.length || 0} dealers, skipDuplicates: ${skipDuplicates}`);

    if (!Array.isArray(dealers) || dealers.length === 0) {
      return res.status(400).json({ error: 'Invalid dealers data' });
    }

    // Get existing dealers to check for duplicates
    console.log('Fetching existing dealers for duplicate check...');
    const existingDealers = await prisma.dealer.findMany({
      where: { companyId: req.companyId! },
      select: {
        companyName: true,
        email: true,
        phone: true
      }
    });
    console.log(`Found ${existingDealers.length} existing dealers`);

    // Create a set of existing identifiers for quick lookup
    const existingIdentifiers = new Set(
      existingDealers.map((d: { companyName: string | null; email: string | null; phone: string | null }) => 
        `${(d.companyName || '').toLowerCase().trim()}|${(d.email || '').toLowerCase().trim()}|${(d.phone || '').replace(/\D/g, '')}`
      )
    );

    // Process dealers and identify duplicates
    const dealersToImport: any[] = [];
    let duplicatesCount = 0;
    let errorsCount = 0;

    console.log('Processing dealers...');
    for (const dealer of dealers) {
      const companyName = (dealer.companyName || '').trim();
      if (!companyName) {
        errorsCount++;
        continue;
      }

      const email = (dealer.email || '').toLowerCase().trim();
      const phone = (dealer.phone || '').replace(/\D/g, '');
      const identifier = `${companyName.toLowerCase()}|${email}|${phone}`;

      if (existingIdentifiers.has(identifier)) {
        duplicatesCount++;
        if (skipDuplicates) {
          continue; // Skip this dealer
        }
      }

      dealersToImport.push({
        companyId: req.companyId!,
        companyName,
        contactName: dealer.contactName?.trim() || null,
        email: email || null,
        phone: dealer.phone?.trim() || null,
        city: dealer.city?.trim() || null,
        state: dealer.state?.trim() || null,
        zip: dealer.zip?.trim() || null,
        country: dealer.country?.trim() || null,
        address: dealer.address?.trim() || null,
        buyingGroup: dealer.buyingGroup?.trim() || null,
        status: dealer.status || 'Prospect',
        groupNames: dealer.groupNames || undefined, // Support comma-separated group names
        customFields: dealer.customFields || undefined // Store custom CSV fields as JSON
      });

      // Add to existing set to prevent duplicates within the same import
      existingIdentifiers.add(identifier);
    }

    console.log(`Processed: ${dealersToImport.length} to import, ${duplicatesCount} duplicates, ${errorsCount} errors`);

    // Collect all group names from dealers
    const allGroupNames = new Set<string>();
    dealersToImport.forEach((dealer: any) => {
      if (dealer.groupNames) {
        const names = typeof dealer.groupNames === 'string' 
          ? dealer.groupNames.split(',').map((n: string) => n.trim()).filter(Boolean)
          : Array.isArray(dealer.groupNames) ? dealer.groupNames.map((n: string) => n.trim()).filter(Boolean) : [];
        names.forEach((name: string) => allGroupNames.add(name));
      }
    });

    // Create groups if they don't exist
    if (allGroupNames.size > 0) {
      console.log(`Creating/ensuring ${allGroupNames.size} groups exist...`);
      const groupNamesArray = Array.from(allGroupNames);
      const groupsToCreate = groupNamesArray.map(name => ({
        companyId: req.companyId!,
        name
      }));

      await prisma.group.createMany({
        data: groupsToCreate,
        skipDuplicates: true
      });
    }

    // Collect all buying group names from dealers
    const allBuyingGroupNames = new Set<string>();
    dealersToImport.forEach((dealer: any) => {
      if (dealer.buyingGroup && typeof dealer.buyingGroup === 'string') {
        allBuyingGroupNames.add(dealer.buyingGroup.trim());
      }
    });

    // Create buying groups if they don't exist
    if (allBuyingGroupNames.size > 0) {
      console.log(`Creating/ensuring ${allBuyingGroupNames.size} buying groups exist...`);
      const buyingGroupNamesArray = Array.from(allBuyingGroupNames);
      const buyingGroupsToCreate = buyingGroupNamesArray.map(name => ({
        companyId: req.companyId!,
        name,
        deletedAt: null
      }));

      // Check for existing buying groups (including deleted ones)
      const existingBuyingGroups = await prisma.buyingGroup.findMany({
        where: {
          companyId: req.companyId!,
          name: { in: buyingGroupNamesArray }
        },
        select: { id: true, name: true, deletedAt: true }
      });

      const existingNames = new Set(existingBuyingGroups.map((bg: { name: string }) => bg.name.toLowerCase()));
      const toCreate = buyingGroupsToCreate.filter(bg => !existingNames.has(bg.name.toLowerCase()));

      if (toCreate.length > 0) {
        await prisma.buyingGroup.createMany({
          data: toCreate,
          skipDuplicates: true
        });
      }

      // Restore deleted buying groups
      const deletedToRestore = existingBuyingGroups.filter((bg: { deletedAt: Date | null }) => bg.deletedAt !== null);
      for (const bg of deletedToRestore) {
        await prisma.buyingGroup.update({
          where: { id: bg.id },
          data: { deletedAt: null }
        });
      }
    }

    // Get all groups for this company to map names to IDs
    const companyGroups = await prisma.group.findMany({
      where: { companyId: req.companyId! },
      select: { id: true, name: true }
    });
    const groupNameToId = new Map(companyGroups.map((g: { id: string; name: string }) => [g.name.toLowerCase(), g.id]));

    // Get all buying groups for this company to map names to IDs
    const companyBuyingGroups = await prisma.buyingGroup.findMany({
      where: { companyId: req.companyId!, deletedAt: null },
      select: { id: true, name: true }
    });
    const buyingGroupNameToId = new Map(companyBuyingGroups.map((bg: { id: string; name: string }) => [bg.name.toLowerCase(), bg.id]));

    // Import dealers in batches to avoid overwhelming the database
    let createdCount = 0;
    const dealerGroupAssignments: Array<{ dealerId: string; groupIds: string[] }> = [];

    if (dealersToImport.length > 0) {
      console.log(`Importing ${dealersToImport.length} dealers...`);
      
      // For large imports, use batch processing
      const BATCH_SIZE = 500;
      if (dealersToImport.length > BATCH_SIZE) {
        console.log(`Large import detected (${dealersToImport.length} dealers), using batch processing...`);
        for (let i = 0; i < dealersToImport.length; i += BATCH_SIZE) {
          const batch = dealersToImport.slice(i, i + BATCH_SIZE);
          
          // Extract group names and customFields before creating dealers
          const batchWithGroups = batch.map((dealer: any) => {
            const groupNames = dealer.groupNames 
              ? (typeof dealer.groupNames === 'string' 
                  ? dealer.groupNames.split(',').map((n: string) => n.trim()).filter(Boolean)
                  : Array.isArray(dealer.groupNames) ? dealer.groupNames.map((n: string) => n.trim()).filter(Boolean) : [])
              : [];
            
            // Extract customFields and groupNames, keep the rest for dealer creation
            const { groupNames: _, customFields, ...dealerData } = dealer;
            return { dealerData: { ...dealerData, customFields: customFields || null }, groupNames };
          });

          // Create dealers
          const dealerDataBatch = batchWithGroups.map((item: any) => item.dealerData);
          const result = await prisma.dealer.createMany({
            data: dealerDataBatch,
            skipDuplicates: true
          });
          createdCount += result.count;

          // Get created dealer IDs (need to fetch them to match with group assignments)
          const createdDealers = await prisma.dealer.findMany({
            where: {
              companyId: req.companyId!,
              companyName: { in: batchWithGroups.map((item: any) => item.dealerData.companyName) }
            },
            select: { id: true, companyName: true, email: true, phone: true }
          });

          // Map dealers to their group assignments
          batchWithGroups.forEach((item: any, idx: number) => {
            const dealer = createdDealers.find(d => 
              d.companyName === item.dealerData.companyName &&
              (!item.dealerData.email || d.email === item.dealerData.email) &&
              (!item.dealerData.phone || d.phone === item.dealerData.phone)
            );
            if (dealer && item.groupNames.length > 0) {
              const groupIds = item.groupNames
                .map((name: string) => groupNameToId.get(name.toLowerCase()))
                .filter((id: string | undefined): id is string => id !== undefined);
              if (groupIds.length > 0) {
                dealerGroupAssignments.push({ dealerId: dealer.id, groupIds });
              }
            }
          });

          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} complete: ${result.count} dealers imported`);
        }
      } else {
        // Extract group names and customFields before creating dealers
        const dealersWithGroups = dealersToImport.map((dealer: any) => {
          const groupNames = dealer.groupNames 
            ? (typeof dealer.groupNames === 'string' 
                ? dealer.groupNames.split(',').map((n: string) => n.trim()).filter(Boolean)
                : Array.isArray(dealer.groupNames) ? dealer.groupNames.map((n: string) => n.trim()).filter(Boolean) : [])
            : [];
          
          // Extract customFields and groupNames, keep the rest for dealer creation
          const { groupNames: _, customFields, ...dealerData } = dealer;
          return { dealerData: { ...dealerData, customFields: customFields || null }, groupNames };
        });

        const dealerDataBatch = dealersWithGroups.map((item: any) => item.dealerData);
        const result = await prisma.dealer.createMany({
          data: dealerDataBatch,
          skipDuplicates: true
        });
        createdCount = result.count;

        // Get created dealer IDs
        const createdDealers = await prisma.dealer.findMany({
          where: {
            companyId: req.companyId!,
            companyName: { in: dealersWithGroups.map((item: any) => item.dealerData.companyName) }
          },
          select: { id: true, companyName: true, email: true, phone: true }
        });

        // Map dealers to their group assignments
        dealersWithGroups.forEach((item: any) => {
          const dealer = createdDealers.find(d => 
            d.companyName === item.dealerData.companyName &&
            (!item.dealerData.email || d.email === item.dealerData.email) &&
            (!item.dealerData.phone || d.phone === item.dealerData.phone)
          );
          if (dealer && item.groupNames.length > 0) {
            const groupIds = item.groupNames
              .map((name: string) => groupNameToId.get(name.toLowerCase()))
              .filter((id: string | undefined): id is string => id !== undefined);
            if (groupIds.length > 0) {
              dealerGroupAssignments.push({ dealerId: dealer.id, groupIds });
            }
          }
        });

        // Assign dealers to buying groups (non-batch path)
        const buyingGroupAssignments: Array<{ dealerId: string; buyingGroupId: string }> = [];
        for (const item of dealersWithGroups) {
          const dealer = createdDealers.find((d: { companyName: string; email: string | null; phone: string | null }) => 
            d.companyName === item.dealerData.companyName &&
            (!item.dealerData.email || d.email === item.dealerData.email) &&
            (!item.dealerData.phone || d.phone === item.dealerData.phone)
          );
          if (dealer && item.dealerData.buyingGroup) {
            const buyingGroupId = buyingGroupNameToId.get(item.dealerData.buyingGroup.toLowerCase());
            if (buyingGroupId) {
              buyingGroupAssignments.push({ dealerId: dealer.id, buyingGroupId });
            }
          }
        }

        if (buyingGroupAssignments.length > 0) {
          console.log(`Assigning ${buyingGroupAssignments.length} dealers to buying groups...`);
          const now = new Date();
          for (const { dealerId, buyingGroupId } of buyingGroupAssignments) {
            // End any previous active buying group associations
            await prisma.dealerBuyingGroupHistory.updateMany({
              where: {
                dealerId,
                endDate: null
              },
              data: {
                endDate: now
              }
            });

            // Create new history record
            await prisma.dealerBuyingGroupHistory.create({
              data: {
                dealerId,
                buyingGroupId,
                startDate: now
              }
            });
          }
          console.log(`Assigned dealers to buying groups`);
        }
      }
      
      // Assign dealers to groups
      if (dealerGroupAssignments.length > 0) {
        console.log(`Assigning ${dealerGroupAssignments.length} dealers to groups...`);
        const groupAssignments = dealerGroupAssignments.flatMap(({ dealerId, groupIds }) =>
          groupIds.map(groupId => ({ dealerId, groupId }))
        );

        await prisma.dealerGroup.createMany({
          data: groupAssignments,
          skipDuplicates: true
        });
        console.log(`Assigned dealers to groups`);
      }
      
      console.log(`Import complete: ${createdCount} dealers created`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Bulk import completed in ${duration} seconds`);

    // Don't send full lists for large imports to avoid response size issues
    // Only send summary counts
    res.json({ 
      message: `Successfully imported ${createdCount} dealers`,
      count: createdCount,
      duplicates: duplicatesCount,
      errors: errorsCount,
      total: dealers.length,
      duration: `${duration}s`
    });
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('Bulk import error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to import dealers';
    if (error.code === 'P2002') {
      errorMessage = 'Database constraint violation. Some dealers may already exist.';
    } else if (error.message) {
      errorMessage = `Import failed: ${error.message}`;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      duration: `${duration}s`
    });
  }
});

// Check for duplicates before import
router.post('/check-duplicates', authenticate, async (req: AuthRequest, res) => {
  try {
    const { dealers } = req.body;

    if (!Array.isArray(dealers) || dealers.length === 0) {
      return res.status(400).json({ error: 'Invalid dealers data' });
    }

    // For very large datasets, skip duplicate check to prevent timeouts
    if (dealers.length > 1000) {
      return res.json({
        total: dealers.length,
        duplicates: 0,
        new: dealers.length,
        duplicateList: [],
        newList: dealers
      });
    }

    // Get existing dealers - limit to prevent memory issues
    // Only get essential fields for duplicate checking
    const existingDealers = await prisma.dealer.findMany({
      where: { companyId: req.companyId! },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        contactName: true
      },
      take: 10000 // Limit to 10k existing dealers to prevent memory issues
    });

    const existingIdentifiers = new Set(
      existingDealers.map((d: { companyName: string | null; email: string | null; phone: string | null }) => 
        `${(d.companyName || '').toLowerCase().trim()}|${(d.email || '').toLowerCase().trim()}|${(d.phone || '').replace(/\D/g, '')}`
      )
    );

    const duplicates: any[] = [];
    const newDealers: any[] = [];

    for (const dealer of dealers) {
      const companyName = (dealer.companyName || '').trim();
      if (!companyName) continue;

      const email = (dealer.email || '').toLowerCase().trim();
      const phone = (dealer.phone || '').replace(/\D/g, '');
      const identifier = `${companyName.toLowerCase()}|${email}|${phone}`;

      if (existingIdentifiers.has(identifier)) {
        const existing = existingDealers.find((d: { id: string; companyName: string | null; email: string | null; phone: string | null; contactName: string | null }) => {
          const dEmail = (d.email || '').toLowerCase().trim();
          const dPhone = (d.phone || '').replace(/\D/g, '');
          return `${(d.companyName || '').toLowerCase().trim()}|${dEmail}|${dPhone}` === identifier;
        });
        duplicates.push({
          ...dealer,
          existingId: existing?.id,
          existing: existing
        });
      } else {
        newDealers.push(dealer);
      }
    }

    res.json({
      total: dealers.length,
      duplicates: duplicates.length,
      new: newDealers.length,
      duplicateList: duplicates,
      newList: newDealers
    });
  } catch (error) {
    console.error('Check duplicates error:', error);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

// REMOVED DUPLICATE ROUTE - This route is defined later in the file at line 1021

// Add note to dealer
router.post('/:id/notes', async (req: AuthRequest, res) => {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const note = await prisma.dealerNote.create({
      data: {
        dealerId: req.params.id,
        content: req.body.content
      }
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Update dealer rating
router.put('/:id/rating', async (req: AuthRequest, res) => {
  try {
    const { rating } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const updated = await prisma.dealer.update({
      where: { id: req.params.id },
      data: { rating }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

export default router;

