import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Get all todos
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { completed, dealerId } = req.query;

    const where: any = {
      companyId: req.companyId!
    };

    if (completed !== undefined) {
      where.completed = completed === 'true';
    }

    if (dealerId) {
      where.dealerId = dealerId;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' }
      ],
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            contactName: true
          }
        }
      }
    });

    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Create todo
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { 
      title, 
      description, 
      dueDate, 
      dealerId, 
      type, 
      emailContent, 
      followUp, 
      followUpDate 
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Verify dealer belongs to company if provided
    if (dealerId) {
      const dealer = await prisma.dealer.findFirst({
        where: {
          id: dealerId,
          companyId: req.companyId!
        }
      });

      if (!dealer) {
        return res.status(404).json({ error: 'Dealer not found' });
      }
    }

    const todo = await prisma.todo.create({
      data: {
        companyId: req.companyId!,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        dealerId: dealerId || null,
        type: type || 'general',
        emailContent: emailContent || null,
        followUp: followUp || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const todo = await prisma.todo.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updateData: any = {
      ...req.body,
      updatedAt: new Date()
    };

    // Handle date fields
    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.followUpDate !== undefined) {
      updateData.followUpDate = req.body.followUpDate ? new Date(req.body.followUpDate) : null;
    }
    if (req.body.emailSentDate !== undefined) {
      updateData.emailSentDate = req.body.emailSentDate ? new Date(req.body.emailSentDate) : null;
    }

    // If marking email as sent, set emailSentDate if not provided
    if (req.body.emailSent === true && !updateData.emailSentDate) {
      updateData.emailSentDate = new Date();
    }

    // If marking as completed, set completedAt timestamp
    if (req.body.completed === true && !todo.completed) {
      updateData.completedAt = new Date();
      
      // Log task completion to dealer change history if associated with a dealer
      if (todo.dealerId) {
        await prisma.dealerChangeHistory.create({
          data: {
            dealerId: todo.dealerId,
            fieldName: 'task_completed',
            oldValue: null,
            newValue: `Task completed: ${todo.title}`,
            changeType: 'updated',
          }
        });
      }
    }
    // If marking as incomplete, clear completedAt
    if (req.body.completed === false && todo.completed) {
      updateData.completedAt = null;
      
      // Log task reopened to dealer change history if associated with a dealer
      if (todo.dealerId) {
        await prisma.dealerChangeHistory.create({
          data: {
            dealerId: todo.dealerId,
            fieldName: 'task_reopened',
            oldValue: null,
            newValue: `Task reopened: ${todo.title}`,
            changeType: 'updated',
          }
        });
      }
    }

    const updated = await prisma.todo.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const todo = await prisma.todo.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await prisma.todo.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;

