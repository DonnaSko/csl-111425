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

// Trade show attendance report - trade shows attended with associated dealers
router.get('/trade-shows/attendance', async (req: AuthRequest, res) => {
  try {
    const tradeShows = await prisma.tradeShow.findMany({
      where: {
        companyId: req.companyId!,
        dealers: {
          some: {}
        }
      },
      orderBy: {
        startDate: 'desc'
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
          },
          orderBy: {
            associationDate: 'desc'
          }
        }
      }
    });

    const result = tradeShows.map(ts => ({
      id: ts.id,
      name: ts.name,
      location: ts.location,
      startDate: ts.startDate,
      endDate: ts.endDate,
      dealers: ts.dealers.map(dts => ({
        id: dts.dealer.id,
        companyName: dts.dealer.companyName,
        contactName: dts.dealer.contactName,
        email: dts.dealer.email,
        phone: dts.dealer.phone,
        status: dts.dealer.status,
        associationDate: dts.associationDate
      }))
    }));

    res.json({ tradeShows: result });
  } catch (error) {
    console.error('Trade show attendance report error:', error);
    res.status(500).json({ error: 'Failed to fetch trade show attendance report' });
  }
});

// Trade show To-Dos & Follow-Ups report
router.get('/trade-shows/todos', async (req: AuthRequest, res) => {
  try {
    const tradeShows = await prisma.tradeShow.findMany({
      where: { companyId: req.companyId! },
      orderBy: { startDate: 'desc' },
      include: {
        dealers: {
          include: {
            dealer: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                todos: {
                  orderBy: [
                    { completed: 'asc' },
                    { followUpDate: 'desc' },
                    { dueDate: 'desc' },
                    { createdAt: 'desc' }
                  ]
                }
              }
            }
          }
        }
      }
    });

    const shaped = tradeShows
      .map(ts => ({
        id: ts.id,
        name: ts.name,
        startDate: ts.startDate,
        endDate: ts.endDate,
        dealers: ts.dealers
          .map(dts => ({
            id: dts.dealer.id,
            companyName: dts.dealer.companyName,
            contactName: dts.dealer.contactName,
            todos: dts.dealer.todos
          }))
          .filter(d => d.todos.length > 0)
      }))
      .filter(ts => ts.dealers.length > 0);

    res.json({ tradeShows: shaped });
  } catch (error) {
    console.error('Trade show todos report error:', error);
    res.status(500).json({ error: 'Failed to fetch trade show todos report' });
  }
});

// Trade show Emails Sent report
router.get('/trade-shows/emails', async (req: AuthRequest, res) => {
  try {
    const tradeShows = await prisma.tradeShow.findMany({
      where: { companyId: req.companyId! },
      orderBy: { startDate: 'desc' },
      include: {
        dealers: {
          include: {
            dealer: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                email: true,
                changeHistory: {
                  where: {
                    fieldName: 'email_sent'
                  },
                  orderBy: {
                    createdAt: 'desc'
                  },
                  select: {
                    id: true,
                    newValue: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const shaped = tradeShows
      .map((ts: any) => ({
        id: ts.id,
        name: ts.name,
        startDate: ts.startDate,
        endDate: ts.endDate,
        dealers: ts.dealers
          .map((dts: any) => ({
            id: dts.dealer.id,
            companyName: dts.dealer.companyName,
            contactName: dts.dealer.contactName,
            email: dts.dealer.email,
            emails: dts.dealer.changeHistory.map((ch: any) => ({
              id: ch.id,
              subject: ch.newValue, // Full history text: "Email sent: [subject] with X attachments..."
              sentDate: ch.createdAt
            }))
          }))
          .filter((d: any) => d.emails.length > 0) // Only dealers with emails
      }))
      .filter((ts: any) => ts.dealers.length > 0); // Only trade shows with dealers who have emails

    res.json({ tradeShows: shaped });
  } catch (error) {
    console.error('Trade show emails report error:', error);
    res.status(500).json({ error: 'Failed to fetch trade show emails report' });
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

// 🎮 COMMUNITY BENCHMARKS - Anonymous comparison with all CSL users
// Shows how you're doing vs. the entire CSL community (NO company names revealed)
router.get('/community-benchmarks', async (req: AuthRequest, res) => {
  try {
    console.log('[Community Benchmarks] Calculating anonymous benchmarks...');

    // Helper function to calculate lead quality score
    const calculateQualityScore = (dealer: any): number => {
      let score = 0;
      if (dealer.companyName) score += 1;
      if (dealer.contactName) score += 2;
      if (dealer.email) score += 2;
      if (dealer.phone) score += 2;
      if (dealer.notes && dealer.notes.length > 20) score += 2;
      else if (dealer.notes && dealer.notes.length > 0) score += 1;
      
      const hasNextStep = dealer.todos && dealer.todos.some((t: any) => !t.completed);
      if (hasNextStep) score += 6;
      else if (dealer.todos && dealer.todos.length > 0) score += 3;
      
      return score;
    };

    // 1. Fetch ALL companies' aggregate data (anonymous) - EXCLUDING the current user
    const allCompanies = await prisma.company.findMany({
      where: {
        id: { not: req.companyId } // Exclude current user for true comparison
      },
      select: { id: true }
    });

    const communityMetrics: any[] = [];

    // Calculate metrics for each company (anonymously)
    for (const company of allCompanies) {
      const dealers = await prisma.dealer.findMany({
        where: { companyId: company.id },
        select: {
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          notes: true,
          createdAt: true,
          todos: {
            select: {
              completed: true,
              createdAt: true
            }
          },
          changeHistory: {
            where: { fieldName: 'email_sent' },
            select: { id: true }
          }
        }
      });

      if (dealers.length === 0) continue; // Skip companies with no dealers

      // Calculate metrics for this company
      const qualityScores = dealers.map(calculateQualityScore);
      const avgQuality = qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length;

      const totalTodos = dealers.flatMap(d => d.todos);
      const completedTodos = totalTodos.filter(t => t.completed);
      const taskCompletionRate = totalTodos.length > 0 ? (completedTodos.length / totalTodos.length) * 100 : 0;

      const totalEmails = dealers.reduce((sum, d) => sum + d.changeHistory.length, 0);
      const emailsPerLead = dealers.length > 0 ? totalEmails / dealers.length : 0;

      const dealsWithNextStep = dealers.filter(d => d.todos.some(t => !t.completed)).length;
      const leadCoverageRate = dealers.length > 0 ? (dealsWithNextStep / dealers.length) * 100 : 0;

      // Calculate speed to follow-up (todos created within 24h of dealer creation)
      const todosWithin24h = dealers.filter(d => {
        const firstTodo = d.todos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        if (!firstTodo) return false;
        const hoursDiff = (firstTodo.createdAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff <= 24;
      }).length;
      const speedToFollowUp = dealers.length > 0 ? (todosWithin24h / dealers.length) * 100 : 0;

      communityMetrics.push({
        avgQuality,
        taskCompletionRate,
        emailsPerLead,
        leadCoverageRate,
        speedToFollowUp
      });
    }

    // 2. Calculate current user's metrics
    const myDealers = await prisma.dealer.findMany({
      where: { companyId: req.companyId! },
      select: {
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        notes: true,
        createdAt: true,
        todos: {
          select: {
            completed: true,
            createdAt: true
          }
        },
        changeHistory: {
          where: { fieldName: 'email_sent' },
          select: { id: true }
        }
      }
    });

    const myQualityScores = myDealers.map(calculateQualityScore);
    const myAvgQuality = myQualityScores.length > 0 ? myQualityScores.reduce((sum, s) => sum + s, 0) / myQualityScores.length : 0;

    const myTotalTodos = myDealers.flatMap(d => d.todos);
    const myCompletedTodos = myTotalTodos.filter(t => t.completed);
    const myTaskCompletionRate = myTotalTodos.length > 0 ? (myCompletedTodos.length / myTotalTodos.length) * 100 : 0;

    const myTotalEmails = myDealers.reduce((sum, d) => sum + d.changeHistory.length, 0);
    const myEmailsPerLead = myDealers.length > 0 ? myTotalEmails / myDealers.length : 0;

    const myDealsWithNextStep = myDealers.filter(d => d.todos.some(t => !t.completed)).length;
    const myLeadCoverageRate = myDealers.length > 0 ? (myDealsWithNextStep / myDealers.length) * 100 : 0;

    const myTodosWithin24h = myDealers.filter(d => {
      const firstTodo = d.todos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (!firstTodo) return false;
      const hoursDiff = (firstTodo.createdAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }).length;
    const mySpeedToFollowUp = myDealers.length > 0 ? (myTodosWithin24h / myDealers.length) * 100 : 0;

    // 3. Calculate percentiles (where you rank vs. everyone ELSE)
    const calculatePercentile = (myValue: number, allValues: number[]): number => {
      console.log('[Percentile] Calculating for myValue:', myValue, 'against', allValues.length, 'other companies');
      
      // If no other companies, you're at 100% (top of the league!)
      if (allValues.length === 0) {
        console.log('[Percentile] No other companies, returning 100%');
        return 100;
      }
      
      // If your value is 0 and you have no activity, you're at the bottom
      if (myValue === 0) {
        console.log('[Percentile] User has 0 value, returning 0%');
        return 0;
      }
      
      const sorted = allValues.sort((a, b) => a - b);
      console.log('[Percentile] Sorted community values:', sorted.slice(0, 5), '...');
      
      // Count how many are STRICTLY LESS than your value
      const rank = sorted.filter(v => v < myValue).length;
      console.log('[Percentile] Rank (companies below you):', rank, 'out of', sorted.length);
      
      // If everyone has the same value as you, you're in the middle
      if (sorted.every(v => v === myValue)) {
        console.log('[Percentile] Everyone has same value, returning 50%');
        return 50;
      }
      
      // Normal percentile calculation
      // Add 1 to ensure at least 1% if you're above any company
      const percentile = Math.max(1, Math.round((rank / sorted.length) * 100));
      console.log('[Percentile] Final percentile:', percentile + '%');
      return percentile;
    };

    const qualityPercentile = calculatePercentile(myAvgQuality, communityMetrics.map(m => m.avgQuality));
    const taskPercentile = calculatePercentile(myTaskCompletionRate, communityMetrics.map(m => m.taskCompletionRate));
    const emailPercentile = calculatePercentile(myEmailsPerLead, communityMetrics.map(m => m.emailsPerLead));
    const coveragePercentile = calculatePercentile(myLeadCoverageRate, communityMetrics.map(m => m.leadCoverageRate));
    const speedPercentile = calculatePercentile(mySpeedToFollowUp, communityMetrics.map(m => m.speedToFollowUp));

    // 4. Calculate community averages
    const communityAvgQuality = communityMetrics.length > 0 
      ? communityMetrics.reduce((sum, m) => sum + m.avgQuality, 0) / communityMetrics.length 
      : 0;
    const communityAvgTaskCompletion = communityMetrics.length > 0
      ? communityMetrics.reduce((sum, m) => sum + m.taskCompletionRate, 0) / communityMetrics.length
      : 0;
    const communityAvgEmailsPerLead = communityMetrics.length > 0
      ? communityMetrics.reduce((sum, m) => sum + m.emailsPerLead, 0) / communityMetrics.length
      : 0;
    const communityAvgCoverage = communityMetrics.length > 0
      ? communityMetrics.reduce((sum, m) => sum + m.leadCoverageRate, 0) / communityMetrics.length
      : 0;
    const communityAvgSpeed = communityMetrics.length > 0
      ? communityMetrics.reduce((sum, m) => sum + m.speedToFollowUp, 0) / communityMetrics.length
      : 0;

    console.log('[Community Benchmarks] Calculated for', communityMetrics.length, 'companies');

    res.json({
      totalCompanies: communityMetrics.length,
      yourMetrics: {
        avgQuality: parseFloat(myAvgQuality.toFixed(1)),
        taskCompletionRate: parseFloat(myTaskCompletionRate.toFixed(1)),
        emailsPerLead: parseFloat(myEmailsPerLead.toFixed(2)),
        leadCoverageRate: parseFloat(myLeadCoverageRate.toFixed(1)),
        speedToFollowUp: parseFloat(mySpeedToFollowUp.toFixed(1))
      },
      communityAverages: {
        avgQuality: parseFloat(communityAvgQuality.toFixed(1)),
        taskCompletionRate: parseFloat(communityAvgTaskCompletion.toFixed(1)),
        emailsPerLead: parseFloat(communityAvgEmailsPerLead.toFixed(2)),
        leadCoverageRate: parseFloat(communityAvgCoverage.toFixed(1)),
        speedToFollowUp: parseFloat(communityAvgSpeed.toFixed(1))
      },
      yourPercentiles: {
        quality: qualityPercentile,
        taskCompletion: taskPercentile,
        emails: emailPercentile,
        coverage: coveragePercentile,
        speed: speedPercentile
      }
    });
  } catch (error) {
    console.error('[Community Benchmarks] Error:', error);
    res.status(500).json({ error: 'Failed to fetch community benchmarks' });
  }
});

export default router;

