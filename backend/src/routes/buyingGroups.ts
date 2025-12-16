import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All buying group routes require authentication and active subscription
router.use(authenticate);
router.use(requireActiveSubscription);

// Get all buying groups for user's company
router.get('/', async (req: AuthRequest, res) => {
  try {
    const buyingGroups = await prisma.buyingGroup.findMany({
      where: {
        companyId: req.companyId!,
        deletedAt: null // Only show active buying groups
      },
      include: {
        _count: {
          select: {
            history: {
              where: {
                endDate: null // Currently active associations
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(buyingGroups);
  } catch (error) {
    console.error('Get buying groups error:', error);
    res.status(500).json({ error: 'Failed to fetch buying groups' });
  }
});

// Get a single buying group by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const buyingGroup = await prisma.buyingGroup.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!,
        deletedAt: null
      },
      include: {
        history: {
          where: {
            endDate: null // Currently active
          },
          include: {
            dealer: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!buyingGroup) {
      return res.status(404).json({ error: 'Buying group not found' });
    }

    res.json(buyingGroup);
  } catch (error) {
    console.error('Get buying group error:', error);
    res.status(500).json({ error: 'Failed to fetch buying group' });
  }
});

// Create a new buying group
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Buying group name is required' });
    }

    const trimmedName = name.trim();

    // Check if buying group with same name already exists (including deleted ones)
    const existingGroup = await prisma.buyingGroup.findFirst({
      where: {
        companyId: req.companyId!,
        name: trimmedName
      }
    });

    if (existingGroup) {
      if (existingGroup.deletedAt) {
        // Restore deleted buying group
        const restored = await prisma.buyingGroup.update({
          where: { id: existingGroup.id },
          data: { deletedAt: null }
        });
        return res.status(201).json(restored);
      }
      return res.status(400).json({ error: 'A buying group with this name already exists' });
    }

    const buyingGroup = await prisma.buyingGroup.create({
      data: {
        companyId: req.companyId!,
        name: trimmedName
      }
    });

    res.status(201).json(buyingGroup);
  } catch (error: any) {
    console.error('Create buying group error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A buying group with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create buying group' });
  }
});

// Update a buying group
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Buying group name is required' });
    }

    const trimmedName = name.trim();

    // Check if buying group exists and belongs to user's company
    const existingGroup = await prisma.buyingGroup.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!,
        deletedAt: null
      }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Buying group not found' });
    }

    // Check if another buying group with same name already exists
    const duplicateGroup = await prisma.buyingGroup.findFirst({
      where: {
        companyId: req.companyId!,
        name: trimmedName,
        id: { not: req.params.id },
        deletedAt: null
      }
    });

    if (duplicateGroup) {
      return res.status(400).json({ error: 'A buying group with this name already exists' });
    }

    const buyingGroup = await prisma.buyingGroup.update({
      where: {
        id: req.params.id
      },
      data: {
        name: trimmedName
      }
    });

    res.json(buyingGroup);
  } catch (error: any) {
    console.error('Update buying group error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Buying group not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A buying group with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update buying group' });
  }
});

// Delete a buying group (soft delete - move associations to history)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Check if buying group exists and belongs to user's company
    const existingGroup = await prisma.buyingGroup.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!,
        deletedAt: null
      },
      include: {
        history: {
          where: {
            endDate: null // Currently active
          }
        }
      }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Buying group not found' });
    }

    // Move all active associations to history (set endDate)
    const now = new Date();
    await prisma.dealerBuyingGroupHistory.updateMany({
      where: {
        buyingGroupId: req.params.id,
        endDate: null
      },
      data: {
        endDate: now
      }
    });

    // Update dealers' buyingGroup field to null if they had this buying group
    const activeDealerIds = existingGroup.history.map(h => h.dealerId);
    if (activeDealerIds.length > 0) {
      await prisma.dealer.updateMany({
        where: {
          id: { in: activeDealerIds },
          buyingGroup: existingGroup.name
        },
        data: {
          buyingGroup: null
        }
      });
    }

    // Soft delete the buying group
    await prisma.buyingGroup.update({
      where: {
        id: req.params.id
      },
      data: {
        deletedAt: now
      }
    });

    res.json({ 
      message: 'Buying group deleted successfully',
      movedToHistory: activeDealerIds.length
    });
  } catch (error: any) {
    console.error('Delete buying group error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Buying group not found' });
    }
    res.status(500).json({ error: 'Failed to delete buying group' });
  }
});

// Assign dealer to buying group
router.post('/:id/assign', async (req: AuthRequest, res) => {
  try {
    const { dealerId, startDate } = req.body;

    if (!dealerId) {
      return res.status(400).json({ error: 'dealerId is required' });
    }

    // Check if buying group exists and belongs to user's company
    const buyingGroup = await prisma.buyingGroup.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!,
        deletedAt: null
      }
    });

    if (!buyingGroup) {
      return res.status(404).json({ error: 'Buying group not found' });
    }

    // Verify dealer belongs to user's company
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: dealerId,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    // Check if dealer already has an active association with this buying group
    const existingHistory = await prisma.dealerBuyingGroupHistory.findFirst({
      where: {
        dealerId,
        buyingGroupId: req.params.id,
        endDate: null
      }
    });

    if (existingHistory) {
      return res.status(400).json({ error: 'Dealer is already assigned to this buying group' });
    }

    // End any previous active buying group associations for this dealer
    await prisma.dealerBuyingGroupHistory.updateMany({
      where: {
        dealerId,
        endDate: null
      },
      data: {
        endDate: startDate ? new Date(startDate) : new Date()
      }
    });

    // Create new history record
    const history = await prisma.dealerBuyingGroupHistory.create({
      data: {
        dealerId,
        buyingGroupId: req.params.id,
        startDate: startDate ? new Date(startDate) : new Date()
      }
    });

    // Update dealer's buyingGroup field
    await prisma.dealer.update({
      where: { id: dealerId },
      data: { buyingGroup: buyingGroup.name }
    });

    res.json({ message: 'Dealer assigned to buying group successfully', history });
  } catch (error: any) {
    console.error('Assign dealer to buying group error:', error);
    res.status(500).json({ error: 'Failed to assign dealer to buying group' });
  }
});

// Remove dealer from buying group (move to history)
router.delete('/:id/assign/:dealerId', async (req: AuthRequest, res) => {
  try {
    const { id, dealerId } = req.params;

    // Check if buying group exists and belongs to user's company
    const buyingGroup = await prisma.buyingGroup.findFirst({
      where: {
        id,
        companyId: req.companyId!,
        deletedAt: null
      }
    });

    if (!buyingGroup) {
      return res.status(404).json({ error: 'Buying group not found' });
    }

    // Verify dealer belongs to user's company
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: dealerId,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    // End the active association (move to history)
    const now = new Date();
    const updated = await prisma.dealerBuyingGroupHistory.updateMany({
      where: {
        dealerId,
        buyingGroupId: id,
        endDate: null
      },
      data: {
        endDate: now
      }
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Dealer is not currently assigned to this buying group' });
    }

    // Update dealer's buyingGroup field to null
    await prisma.dealer.update({
      where: { id: dealerId },
      data: { buyingGroup: null }
    });

    res.json({ message: 'Dealer removed from buying group successfully' });
  } catch (error: any) {
    console.error('Remove dealer from buying group error:', error);
    res.status(500).json({ error: 'Failed to remove dealer from buying group' });
  }
});

// Bulk assign dealers to buying group
router.post('/:id/bulk-assign', async (req: AuthRequest, res) => {
  try {
    const { dealerIds, startDate } = req.body;

    if (!Array.isArray(dealerIds) || dealerIds.length === 0) {
      return res.status(400).json({ error: 'dealerIds array is required' });
    }

    // Check if buying group exists and belongs to user's company
    const buyingGroup = await prisma.buyingGroup.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!,
        deletedAt: null
      }
    });

    if (!buyingGroup) {
      return res.status(404).json({ error: 'Buying group not found' });
    }

    // Verify all dealers belong to user's company
    const dealers = await prisma.dealer.findMany({
      where: {
        id: { in: dealerIds },
        companyId: req.companyId!
      },
      select: {
        id: true
      }
    });

    if (dealers.length !== dealerIds.length) {
      return res.status(400).json({ error: 'Some dealers not found or do not belong to your company' });
    }

    const now = startDate ? new Date(startDate) : new Date();
    let assignedCount = 0;

    // Process each dealer
    for (const dealerId of dealerIds) {
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

      // Check if already assigned to this buying group
      const existing = await prisma.dealerBuyingGroupHistory.findFirst({
        where: {
          dealerId,
          buyingGroupId: req.params.id,
          endDate: null
        }
      });

      if (!existing) {
        // Create new history record
        await prisma.dealerBuyingGroupHistory.create({
          data: {
            dealerId,
            buyingGroupId: req.params.id,
            startDate: now
          }
        });

        // Update dealer's buyingGroup field
        await prisma.dealer.update({
          where: { id: dealerId },
          data: { buyingGroup: buyingGroup.name }
        });

        assignedCount++;
      }
    }

    res.json({ message: `Successfully assigned ${assignedCount} dealers to buying group` });
  } catch (error: any) {
    console.error('Bulk assign dealers to buying group error:', error);
    res.status(500).json({ error: 'Failed to bulk assign dealers to buying group' });
  }
});

// Bulk create buying groups from CSV/array
router.post('/bulk-create', async (req: AuthRequest, res) => {
  try {
    const { buyingGroups } = req.body; // Array of buying group names

    if (!Array.isArray(buyingGroups) || buyingGroups.length === 0) {
      return res.status(400).json({ error: 'buyingGroups array is required' });
    }

    const validGroups = buyingGroups
      .map((name: any) => {
        if (typeof name === 'string') {
          return name.trim();
        }
        return null;
      })
      .filter((name: string | null): name is string => name !== null && name !== '');

    if (validGroups.length === 0) {
      return res.status(400).json({ error: 'No valid buying group names provided' });
    }

    // Get existing buying groups for this company
    const existingGroups = await prisma.buyingGroup.findMany({
      where: {
        companyId: req.companyId!
      },
      select: {
        name: true
      }
    });

    const existingNames = new Set(existingGroups.map(g => g.name.toLowerCase()));

    // Create only new buying groups (skip duplicates)
    const groupsToCreate = validGroups
      .filter(name => !existingNames.has(name.toLowerCase()))
      .map(name => ({
        companyId: req.companyId!,
        name
      }));

    let createdCount = 0;
    if (groupsToCreate.length > 0) {
      // Use createMany for better performance
      await prisma.buyingGroup.createMany({
        data: groupsToCreate,
        skipDuplicates: true
      });
      createdCount = groupsToCreate.length;
    }

    res.json({
      message: `Successfully created ${createdCount} new buying groups`,
      created: createdCount,
      skipped: validGroups.length - createdCount
    });
  } catch (error) {
    console.error('Bulk create buying groups error:', error);
    res.status(500).json({ error: 'Failed to bulk create buying groups' });
  }
});

export default router;




