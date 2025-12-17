import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { searchDealers } from '../utils/dealerSearch';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Get dashboard stats
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const [
      totalDealers,
      totalNotes,
      totalPhotos,
      totalRecordings,
      activeTodos,
      dealersByStatus,
      dealersByRating
    ] = await Promise.all([
      prisma.dealer.count({
        where: { companyId: req.companyId! }
      }),
      prisma.dealerNote.count({
        where: {
          dealer: { companyId: req.companyId! }
        }
      }),
      prisma.photo.count({
        where: {
          dealer: { companyId: req.companyId! }
        }
      }),
      prisma.voiceRecording.count({
        where: {
          dealer: { companyId: req.companyId! }
        }
      }),
      prisma.todo.count({
        where: {
          companyId: req.companyId!,
          completed: false
        }
      }),
      prisma.dealer.groupBy({
        by: ['status'],
        where: { companyId: req.companyId! },
        _count: true
      }),
      prisma.dealer.groupBy({
        by: ['rating'],
        where: {
          companyId: req.companyId!,
          rating: { not: null }
        },
        _count: true
      })
    ]);

    res.json({
      totalDealers,
      totalNotes,
      totalPhotos,
      totalRecordings,
      activeTodos,
      dealersByStatus,
      dealersByRating
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Export dealers to CSV format
router.get('/export/dealers', async (req: AuthRequest, res) => {
  try {
    const dealers = await prisma.dealer.findMany({
      where: { companyId: req.companyId! },
      orderBy: { createdAt: 'desc' },
      include: {
        dealerNotes: {
          orderBy: { createdAt: 'desc' },
          take: 1 // latest note
        },
        todos: true
      }
    });

    // Convert to CSV - include ALL dealer fields plus summary of notes & follow-ups
    const headers = [
      'Dealer ID',
      'Company ID',
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
      'Notes (Dealer.notes)',
      'Latest Note (from Notes tab)',
      'Total Notes Count',
      'Total Tasks (To-Dos)',
      'Open Tasks',
      'Open Follow-Ups',
      'Next Follow-Up Date',
      'Custom Fields (JSON)',
      'Created At',
      'Updated At'
    ];

    const rows = dealers.map(dealer => {
      const latestNote = dealer.dealerNotes[0]?.content || '';
      const totalNotes = dealer.dealerNotes.length;

      const totalTodos = dealer.todos.length;
      const openTodos = dealer.todos.filter(t => !t.completed).length;
      const openFollowUps = dealer.todos.filter(
        t => !t.completed && t.followUp
      ).length;

      // Compute next follow-up date (earliest future/incomplete followUpDate)
      const nextFollowUp = dealer.todos
        .filter(t => !t.completed && t.followUp && t.followUpDate)
        .sort(
          (a, b) =>
            (a.followUpDate as Date).getTime() -
            (b.followUpDate as Date).getTime()
        )[0]?.followUpDate;

      return [
        dealer.id,
        dealer.companyId,
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
        dealer.rating != null ? dealer.rating : '',
        dealer.notes || '',
        latestNote,
        totalNotes,
        totalTodos,
        openTodos,
        openFollowUps,
        nextFollowUp ? (nextFollowUp as Date).toISOString() : '',
        dealer.customFields ? JSON.stringify(dealer.customFields) : '',
        dealer.createdAt.toISOString(),
        dealer.updatedAt.toISOString()
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dealers-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export dealers error:', error);
    res.status(500).json({ error: 'Failed to export dealers' });
  }
});

// Get dealers by status for dashboard
router.get('/dashboard/dealers-by-status/:status', async (req: AuthRequest, res) => {
  try {
    const { status } = req.params;
    const { search } = req.query;

    let dealers: any[] = [];

    if (search) {
      dealers = await searchDealers({
        prisma,
        companyId: req.companyId!,
        baseWhere: { status },
        searchTerm: search as string,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        take: 100
      });
    } else {
      // No search, just get all dealers for this status
      dealers = await prisma.dealer.findMany({
        where: {
          companyId: req.companyId!,
          status
        },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    res.json({ dealers });
  } catch (error) {
    console.error('Get dealers by status error:', error);
    res.status(500).json({ error: 'Failed to fetch dealers by status' });
  }
});

// Get dealers by rating for dashboard
router.get('/dashboard/dealers-by-rating/:rating', async (req: AuthRequest, res) => {
  try {
    const rating = parseInt(req.params.rating);
    const { search } = req.query;

    if (isNaN(rating)) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    let dealers: any[] = [];

    if (search) {
      dealers = await searchDealers({
        prisma,
        companyId: req.companyId!,
        baseWhere: { rating },
        searchTerm: search as string,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          rating: true
        },
        take: 100
      });
    } else {
      // No search, just get all dealers for this rating
      dealers = await prisma.dealer.findMany({
        where: {
          companyId: req.companyId!,
          rating
        },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          rating: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    res.json({ dealers });
  } catch (error) {
    console.error('Get dealers by rating error:', error);
    res.status(500).json({ error: 'Failed to fetch dealers by rating' });
  }
});

// Get all dealers for dashboard (with search)
router.get('/dashboard/all-dealers', async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;

    let dealers: any[] = [];

    if (search) {
      dealers = await searchDealers({
        prisma,
        companyId: req.companyId!,
        searchTerm: search as string,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        take: 100
      });
    } else {
      // No search, just get all dealers
      dealers = await prisma.dealer.findMany({
        where: { companyId: req.companyId! },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    res.json({ dealers });
  } catch (error) {
    console.error('Get all dealers error:', error);
    res.status(500).json({ error: 'Failed to fetch dealers' });
  }
});

// Get dealers with notes for dashboard
router.get('/dashboard/dealers-with-notes', async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;

    let dealers: any[] = [];

    if (search) {
      dealers = await searchDealers({
        prisma,
        companyId: req.companyId!,
        baseWhere: {
          dealerNotes: {
            some: {}
          }
        },
        searchTerm: search as string,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        take: 100
      });
      // Remove duplicates
      const uniqueDealers = dealers.filter((dealer, index, self) =>
        index === self.findIndex(d => d.id === dealer.id)
      );
      dealers = uniqueDealers;
    } else {
      dealers = await prisma.dealer.findMany({
        where: {
          companyId: req.companyId!,
          dealerNotes: {
            some: {}
          }
        },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        distinct: ['id'],
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    res.json({ dealers });
  } catch (error) {
    console.error('Get dealers with notes error:', error);
    res.status(500).json({ error: 'Failed to fetch dealers with notes' });
  }
});

// Get dealers with photos for dashboard
router.get('/dashboard/dealers-with-photos', async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;

    let dealers: any[] = [];

    if (search) {
      dealers = await searchDealers({
        prisma,
        companyId: req.companyId!,
        baseWhere: {
          photos: {
            some: {}
          }
        },
        searchTerm: search as string,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        take: 100
      });
      // Remove duplicates
      const uniqueDealers = dealers.filter((dealer, index, self) =>
        index === self.findIndex(d => d.id === dealer.id)
      );
      dealers = uniqueDealers;
    } else {
      dealers = await prisma.dealer.findMany({
        where: {
          companyId: req.companyId!,
          photos: {
            some: {}
          }
        },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        distinct: ['id'],
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    res.json({ dealers });
  } catch (error) {
    console.error('Get dealers with photos error:', error);
    res.status(500).json({ error: 'Failed to fetch dealers with photos' });
  }
});

// Get all incomplete todos for dashboard
router.get('/dashboard/todos', async (req: AuthRequest, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: {
        companyId: req.companyId!,
        completed: false
      },
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            contactName: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { followUpDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ todos });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Export all data (comprehensive export)
router.get('/export/all-data', async (req: AuthRequest, res) => {
  try {
    // Fetch all user data
    const [dealers, tradeShows, todos, groups, buyingGroups, products] = await Promise.all([
      prisma.dealer.findMany({
        where: { companyId: req.companyId! },
        include: {
          dealerNotes: true,
          photos: { select: { id: true, filename: true, type: true, createdAt: true } },
          voiceRecordings: { select: { id: true, filename: true, duration: true, date: true, tradeshowName: true, createdAt: true } },
          groups: { include: { group: { select: { name: true } } } },
          products: { include: { product: { select: { name: true } } } },
          privacyPermissions: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tradeShow.findMany({
        where: { companyId: req.companyId! },
        include: {
          dealers: {
            include: {
              dealer: { select: { id: true, companyName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.todo.findMany({
        where: { companyId: req.companyId! },
        include: {
          dealer: { select: { id: true, companyName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.group.findMany({
        where: { companyId: req.companyId! },
        orderBy: { name: 'asc' }
      }),
      prisma.buyingGroup.findMany({
        where: { companyId: req.companyId! },
        orderBy: { name: 'asc' }
      }),
      prisma.product.findMany({
        where: { companyId: req.companyId! },
        orderBy: { name: 'asc' }
      })
    ]);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { company: true }
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      account: {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        company: user?.company.name
      },
      summary: {
        totalDealers: dealers.length,
        totalTradeShows: tradeShows.length,
        totalTodos: todos.length,
        totalGroups: groups.length,
        totalBuyingGroups: buyingGroups.length,
        totalProducts: products.length
      },
      dealers: dealers.map(d => ({
        ...d,
        groups: d.groups.map(g => g.group.name),
        products: d.products.map(p => p.product.name)
      })),
      tradeShows: tradeShows.map(ts => ({
        ...ts,
        dealers: ts.dealers.map(d => d.dealer)
      })),
      todos,
      groups,
      buyingGroups,
      products
    };

    // Return as JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=capture-show-leads-export.json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Export all data error:', error);
    res.status(500).json({ error: 'Failed to export all data' });
  }
});

// Get dealers with recordings for dashboard
router.get('/dashboard/dealers-with-recordings', async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;

    let dealers: any[] = [];

    if (search) {
      dealers = await searchDealers({
        prisma,
        companyId: req.companyId!,
        baseWhere: {
          voiceRecordings: {
            some: {}
          }
        },
        searchTerm: search as string,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        take: 100
      });
      // Remove duplicates
      const uniqueDealers = dealers.filter((dealer, index, self) =>
        index === self.findIndex(d => d.id === dealer.id)
      );
      dealers = uniqueDealers;
    } else {
      dealers = await prisma.dealer.findMany({
        where: {
          companyId: req.companyId!,
          voiceRecordings: {
            some: {}
          }
        },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        distinct: ['id'],
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    res.json({ dealers });
  } catch (error) {
    console.error('Get dealers with recordings error:', error);
    res.status(500).json({ error: 'Failed to fetch dealers with recordings' });
  }
});

export default router;

