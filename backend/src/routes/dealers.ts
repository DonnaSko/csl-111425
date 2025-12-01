import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All dealer routes require authentication and active subscription
router.use(authenticate);
router.use(requireActiveSubscription);

// Get all dealers for user's company
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, status, buyingGroup, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      companyId: req.companyId!
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { contactName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { buyingGroup: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'All Statuses') {
      where.status = status;
    }

    if (buyingGroup && buyingGroup !== 'All Buying Groups') {
      where.buyingGroup = buyingGroup;
    }

    const [dealers, total] = await Promise.all([
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
          }
        }
      }),
      prisma.dealer.count({ where })
    ]);

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

// Get single dealer
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId! // Ensure data isolation
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
        }
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

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
        status: dealer.status || 'Prospect'
      });

      // Add to existing set to prevent duplicates within the same import
      existingIdentifiers.add(identifier);
    }

    console.log(`Processed: ${dealersToImport.length} to import, ${duplicatesCount} duplicates, ${errorsCount} errors`);

    // Import dealers in batches to avoid overwhelming the database
    let createdCount = 0;
    if (dealersToImport.length > 0) {
      console.log(`Importing ${dealersToImport.length} dealers...`);
      
      // For large imports, use batch processing
      const BATCH_SIZE = 500;
      if (dealersToImport.length > BATCH_SIZE) {
        console.log(`Large import detected (${dealersToImport.length} dealers), using batch processing...`);
        for (let i = 0; i < dealersToImport.length; i += BATCH_SIZE) {
          const batch = dealersToImport.slice(i, i + BATCH_SIZE);
          const result = await prisma.dealer.createMany({
            data: batch,
            skipDuplicates: true
          });
          createdCount += result.count;
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} complete: ${result.count} dealers imported`);
        }
      } else {
        const result = await prisma.dealer.createMany({
          data: dealersToImport,
          skipDuplicates: true
        });
        createdCount = result.count;
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

    // Get existing dealers
    const existingDealers = await prisma.dealer.findMany({
      where: { companyId: req.companyId! },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        contactName: true
      }
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

// Get unique buying groups
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
    console.error('Get buying groups error:', error);
    res.status(500).json({ error: 'Failed to fetch buying groups' });
  }
});

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

