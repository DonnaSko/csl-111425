import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All group routes require authentication and active subscription
router.use(authenticate);
router.use(requireActiveSubscription);

// Get all groups for user's company
router.get('/', async (req: AuthRequest, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        companyId: req.companyId!
      },
      include: {
        _count: {
          select: {
            dealers: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get a single group by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const group = await prisma.group.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      },
      include: {
        dealers: {
          include: {
            dealer: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                email: true,
                phone: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create a new group
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const trimmedName = name.trim();

    // Check if group with same name already exists for this company
    const existingGroup = await prisma.group.findFirst({
      where: {
        companyId: req.companyId!,
        name: trimmedName
      }
    });

    if (existingGroup) {
      return res.status(400).json({ error: 'A group with this name already exists' });
    }

    const group = await prisma.group.create({
      data: {
        companyId: req.companyId!,
        name: trimmedName
      }
    });

    res.status(201).json(group);
  } catch (error: any) {
    console.error('Create group error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A group with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update a group
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const trimmedName = name.trim();

    // Check if group exists and belongs to user's company
    const existingGroup = await prisma.group.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if another group with same name already exists
    const duplicateGroup = await prisma.group.findFirst({
      where: {
        companyId: req.companyId!,
        name: trimmedName,
        id: { not: req.params.id }
      }
    });

    if (duplicateGroup) {
      return res.status(400).json({ error: 'A group with this name already exists' });
    }

    const group = await prisma.group.update({
      where: {
        id: req.params.id
      },
      data: {
        name: trimmedName
      }
    });

    res.json(group);
  } catch (error: any) {
    console.error('Update group error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A group with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete a group
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Check if group exists and belongs to user's company
    const existingGroup = await prisma.group.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Delete the group (cascade will remove DealerGroup relationships)
    await prisma.group.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Delete group error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Assign dealers to a group (bulk assignment)
router.post('/:id/dealers', async (req: AuthRequest, res) => {
  try {
    const { dealerIds } = req.body;

    if (!Array.isArray(dealerIds) || dealerIds.length === 0) {
      return res.status(400).json({ error: 'dealerIds array is required' });
    }

    // Check if group exists and belongs to user's company
    const group = await prisma.group.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
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

    // Create DealerGroup relationships (skip duplicates)
    const createPromises = dealerIds.map((dealerId: string) =>
      prisma.dealerGroup.upsert({
        where: {
          dealerId_groupId: {
            dealerId,
            groupId: req.params.id
          }
        },
        create: {
          dealerId,
          groupId: req.params.id
        },
        update: {}
      })
    );

    await Promise.all(createPromises);

    res.json({ message: `Successfully assigned ${dealerIds.length} dealers to group` });
  } catch (error: any) {
    console.error('Assign dealers to group error:', error);
    res.status(500).json({ error: 'Failed to assign dealers to group' });
  }
});

// Remove dealers from a group
router.delete('/:id/dealers', async (req: AuthRequest, res) => {
  try {
    const { dealerIds } = req.body;

    if (!Array.isArray(dealerIds) || dealerIds.length === 0) {
      return res.status(400).json({ error: 'dealerIds array is required' });
    }

    // Check if group exists and belongs to user's company
    const group = await prisma.group.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Remove DealerGroup relationships
    await prisma.dealerGroup.deleteMany({
      where: {
        groupId: req.params.id,
        dealerId: { in: dealerIds }
      }
    });

    res.json({ message: `Successfully removed ${dealerIds.length} dealers from group` });
  } catch (error: any) {
    console.error('Remove dealers from group error:', error);
    res.status(500).json({ error: 'Failed to remove dealers from group' });
  }
});

// Bulk create groups from CSV/array
router.post('/bulk-create', async (req: AuthRequest, res) => {
  try {
    const { groups } = req.body; // Array of group names

    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({ error: 'groups array is required' });
    }

    const validGroups = groups
      .map((name: any) => {
        if (typeof name === 'string') {
          return name.trim();
        }
        return null;
      })
      .filter((name: string | null): name is string => name !== null && name !== '');

    if (validGroups.length === 0) {
      return res.status(400).json({ error: 'No valid group names provided' });
    }

    // Get existing groups for this company
    const existingGroups = await prisma.group.findMany({
      where: {
        companyId: req.companyId!
      },
      select: {
        name: true
      }
    });

    const existingNames = new Set(existingGroups.map(g => g.name.toLowerCase()));

    // Create only new groups (skip duplicates)
    const groupsToCreate = validGroups
      .filter(name => !existingNames.has(name.toLowerCase()))
      .map(name => ({
        companyId: req.companyId!,
        name
      }));

    let createdCount = 0;
    if (groupsToCreate.length > 0) {
      // Use createMany for better performance
      await prisma.group.createMany({
        data: groupsToCreate,
        skipDuplicates: true
      });
      createdCount = groupsToCreate.length;
    }

    res.json({
      message: `Successfully created ${createdCount} new groups`,
      created: createdCount,
      skipped: validGroups.length - createdCount
    });
  } catch (error) {
    console.error('Bulk create groups error:', error);
    res.status(500).json({ error: 'Failed to bulk create groups' });
  }
});

export default router;

