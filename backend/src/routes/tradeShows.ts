import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Get all trade shows
router.get('/', async (req: AuthRequest, res) => {
  try {
    const tradeShows = await prisma.tradeShow.findMany({
      where: { companyId: req.companyId! },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { dealers: true }
        }
      }
    });

    res.json(tradeShows);
  } catch (error) {
    console.error('Get trade shows error:', error);
    res.status(500).json({ error: 'Failed to fetch trade shows' });
  }
});

// Get single trade show
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const tradeShow = await prisma.tradeShow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      },
      include: {
        dealers: {
          include: {
            dealer: true
          }
        }
      }
    });

    if (!tradeShow) {
      return res.status(404).json({ error: 'Trade show not found' });
    }

    res.json(tradeShow);
  } catch (error) {
    console.error('Get trade show error:', error);
    res.status(500).json({ error: 'Failed to fetch trade show' });
  }
});

// Create trade show
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, location, startDate, endDate, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const tradeShow = await prisma.tradeShow.create({
      data: {
        companyId: req.companyId!,
        name,
        location,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description
      }
    });

    res.status(201).json(tradeShow);
  } catch (error) {
    console.error('Create trade show error:', error);
    res.status(500).json({ error: 'Failed to create trade show' });
  }
});

// Update trade show
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const tradeShow = await prisma.tradeShow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!tradeShow) {
      return res.status(404).json({ error: 'Trade show not found' });
    }

    const updated = await prisma.tradeShow.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        updatedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update trade show error:', error);
    res.status(500).json({ error: 'Failed to update trade show' });
  }
});

// Associate dealer with trade show
router.post('/:id/dealers/:dealerId', async (req: AuthRequest, res) => {
  try {
    const { associationDate, notes } = req.body;

    // Verify trade show belongs to company
    const tradeShow = await prisma.tradeShow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!tradeShow) {
      return res.status(404).json({ error: 'Trade show not found' });
    }

    // Verify dealer belongs to company
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.dealerId,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const association = await prisma.dealerTradeShow.create({
      data: {
        dealerId: req.params.dealerId,
        tradeShowId: req.params.id,
        associationDate: associationDate ? new Date(associationDate) : new Date(),
        notes: notes || null
      }
    });

    // Log the association to dealer change history
    await prisma.dealerChangeHistory.create({
      data: {
        dealerId: req.params.dealerId,
        fieldName: 'tradeshow_associated',
        oldValue: null,
        newValue: `${tradeShow.name} (${associationDate ? new Date(associationDate).toLocaleDateString() : new Date().toLocaleDateString()})`,
        changeType: 'added',
      }
    });

    res.status(201).json(association);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Dealer already associated with this trade show' });
    }
    console.error('Associate dealer error:', error);
    res.status(500).json({ error: 'Failed to associate dealer' });
  }
});

// Export trade show leads to CSV
router.get('/:id/export', async (req: AuthRequest, res) => {
  try {
    const tradeShow = await prisma.tradeShow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      },
      include: {
        dealers: {
          include: {
            dealer: {
              include: {
                dealerNotes: {
                  orderBy: { createdAt: 'desc' },
                  take: 1 // Get most recent note
                },
                photos: {
                  take: 1 // Get first photo info
                }
              }
            }
          }
        }
      }
    });

    if (!tradeShow) {
      return res.status(404).json({ error: 'Trade show not found' });
    }

    // Convert to CSV
    const headers = [
      'Company Name',
      'Contact Name',
      'Email',
      'Phone',
      'City',
      'State',
      'Zip',
      'Country',
      'Address',
      'Buying Group',
      'Status',
      'Rating',
      'Most Recent Note',
      'Photo Count',
      'Captured At'
    ];

    const rows = tradeShow.dealers.map(dts => {
      const dealer = dts.dealer;
      return [
        dealer.companyName,
        dealer.contactName || '',
        dealer.email || '',
        dealer.phone || '',
        dealer.city || '',
        dealer.state || '',
        dealer.zip || '',
        dealer.country || '',
        dealer.address || '',
        dealer.buyingGroup || '',
        dealer.status,
        dealer.rating || '',
        dealer.dealerNotes[0]?.content || '',
        dealer.photos.length.toString(),
        dts.createdAt.toISOString()
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const filename = `trade-show-${tradeShow.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (error) {
    console.error('Export trade show error:', error);
    res.status(500).json({ error: 'Failed to export trade show leads' });
  }
});

export default router;

