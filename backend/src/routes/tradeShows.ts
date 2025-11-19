import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

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
        tradeShowId: req.params.id
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

export default router;

