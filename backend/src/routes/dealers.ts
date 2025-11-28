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
    const {
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

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const dealer = await prisma.dealer.create({
      data: {
        companyId: req.companyId!,
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
        status: status || 'Prospect'
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
  try {
    const { dealers, skipDuplicates = false } = req.body; // Array of dealer objects

    if (!Array.isArray(dealers) || dealers.length === 0) {
      return res.status(400).json({ error: 'Invalid dealers data' });
    }

    // Get existing dealers to check for duplicates
    const existingDealers = await prisma.dealer.findMany({
      where: { companyId: req.companyId! },
      select: {
        companyName: true,
        email: true,
        phone: true
      }
    });

    // Create a set of existing identifiers for quick lookup
    const existingIdentifiers = new Set(
      existingDealers.map(d => 
        `${(d.companyName || '').toLowerCase().trim()}|${(d.email || '').toLowerCase().trim()}|${(d.phone || '').replace(/\D/g, '')}`
      )
    );

    // Process dealers and identify duplicates
    const dealersToImport: any[] = [];
    const duplicates: any[] = [];
    const errors: any[] = [];

    for (const dealer of dealers) {
      const companyName = (dealer.companyName || '').trim();
      if (!companyName) {
        errors.push({ dealer, error: 'Company name is required' });
        continue;
      }

      const email = (dealer.email || '').toLowerCase().trim();
      const phone = (dealer.phone || '').replace(/\D/g, '');
      const identifier = `${companyName.toLowerCase()}|${email}|${phone}`;

      if (existingIdentifiers.has(identifier)) {
        duplicates.push(dealer);
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

    // Import dealers
    let createdCount = 0;
    if (dealersToImport.length > 0) {
      const result = await prisma.dealer.createMany({
        data: dealersToImport,
        skipDuplicates: true
      });
      createdCount = result.count;
    }

    res.json({ 
      message: `Successfully imported ${createdCount} dealers`,
      count: createdCount,
      duplicates: duplicates.length,
      errors: errors.length,
      duplicateList: duplicates,
      errorList: errors
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import dealers' });
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
      existingDealers.map(d => 
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
        const existing = existingDealers.find(d => {
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

    res.json(buyingGroups.map(bg => bg.buyingGroup).filter(Boolean));
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

