import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { fuzzyMatchDealer } from '../utils/fuzzySearch';

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
      orderBy: { createdAt: 'desc' }
    });

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
      'Created At'
    ];

    const rows = dealers.map(dealer => [
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
      dealer.createdAt.toISOString()
    ]);

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

    const baseWhere: any = {
      companyId: req.companyId!,
      status: status
    };

    let dealers: any[] = [];

    if (search) {
      const searchTerm = (search as string).trim();
      
      // First try exact/contains match
      const exactWhere: any = {
        ...baseWhere,
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };

      const exactDealers = await prisma.dealer.findMany({
        where: exactWhere,
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

      if (exactDealers.length > 0) {
        dealers = exactDealers;
      } else {
        // No exact matches, try fuzzy search
        const allDealers = await prisma.dealer.findMany({
          where: baseWhere,
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            status: true,
            buyingGroup: true
          },
          take: 500 // Get more for fuzzy matching
        });

        const fuzzyMatches = allDealers.filter(dealer =>
          fuzzyMatchDealer(searchTerm, {
            companyName: dealer.companyName,
            contactName: dealer.contactName,
            email: dealer.email,
            phone: dealer.phone,
            buyingGroup: dealer.buyingGroup
          }, 0.5)
        );

        dealers = fuzzyMatches.slice(0, 100); // Limit results
      }
    } else {
      // No search, just get all dealers for this status
      dealers = await prisma.dealer.findMany({
        where: baseWhere,
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

    const baseWhere: any = {
      companyId: req.companyId!,
      rating: rating
    };

    let dealers: any[] = [];

    if (search) {
      const searchTerm = (search as string).trim();
      
      // First try exact/contains match
      const exactWhere: any = {
        ...baseWhere,
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };

      const exactDealers = await prisma.dealer.findMany({
        where: exactWhere,
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

      if (exactDealers.length > 0) {
        dealers = exactDealers;
      } else {
        // No exact matches, try fuzzy search
        const allDealers = await prisma.dealer.findMany({
          where: baseWhere,
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            rating: true,
            buyingGroup: true
          },
          take: 500 // Get more for fuzzy matching
        });

        const fuzzyMatches = allDealers.filter(dealer =>
          fuzzyMatchDealer(searchTerm, {
            companyName: dealer.companyName,
            contactName: dealer.contactName,
            email: dealer.email,
            phone: dealer.phone,
            buyingGroup: dealer.buyingGroup
          }, 0.5)
        );

        dealers = fuzzyMatches.slice(0, 100); // Limit results
      }
    } else {
      // No search, just get all dealers for this rating
      dealers = await prisma.dealer.findMany({
        where: baseWhere,
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

    const baseWhere: any = {
      companyId: req.companyId!
    };

    let dealers: any[] = [];

    if (search) {
      const searchTerm = (search as string).trim();
      
      // First try exact/contains match
      const exactWhere: any = {
        ...baseWhere,
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { buyingGroup: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };

      const exactDealers = await prisma.dealer.findMany({
        where: exactWhere,
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

      if (exactDealers.length > 0) {
        dealers = exactDealers;
      } else {
        // No exact matches, try fuzzy search
        const allDealers = await prisma.dealer.findMany({
          where: baseWhere,
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            status: true,
            buyingGroup: true
          },
          take: 500 // Get more for fuzzy matching
        });

        const fuzzyMatches = allDealers.filter(dealer =>
          fuzzyMatchDealer(searchTerm, {
            companyName: dealer.companyName,
            contactName: dealer.contactName,
            email: dealer.email,
            phone: dealer.phone,
            buyingGroup: dealer.buyingGroup
          }, 0.5)
        );

        dealers = fuzzyMatches.slice(0, 100); // Limit results
      }
    } else {
      // No search, just get all dealers
      dealers = await prisma.dealer.findMany({
        where: baseWhere,
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

    const baseWhere: any = {
      companyId: req.companyId!,
      dealerNotes: {
        some: {}
      }
    };

    let dealers: any[] = [];

    if (search) {
      const searchTerm = (search as string).trim();
      
      const exactWhere: any = {
        ...baseWhere,
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { buyingGroup: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };

      const exactDealers = await prisma.dealer.findMany({
        where: exactWhere,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        distinct: ['id'],
        take: 100
      });

      if (exactDealers.length > 0) {
        dealers = exactDealers;
      } else {
        const allDealers = await prisma.dealer.findMany({
          where: baseWhere,
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            status: true,
            buyingGroup: true
          },
          distinct: ['id'],
          take: 500
        });

        const fuzzyMatches = allDealers.filter(dealer =>
          fuzzyMatchDealer(searchTerm, {
            companyName: dealer.companyName,
            contactName: dealer.contactName,
            email: dealer.email,
            phone: dealer.phone,
            buyingGroup: dealer.buyingGroup
          }, 0.5)
        );

        dealers = fuzzyMatches.slice(0, 100);
      }
    } else {
      dealers = await prisma.dealer.findMany({
        where: baseWhere,
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

    const baseWhere: any = {
      companyId: req.companyId!,
      photos: {
        some: {}
      }
    };

    let dealers: any[] = [];

    if (search) {
      const searchTerm = (search as string).trim();
      
      const exactWhere: any = {
        ...baseWhere,
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { buyingGroup: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };

      const exactDealers = await prisma.dealer.findMany({
        where: exactWhere,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        distinct: ['id'],
        take: 100
      });

      if (exactDealers.length > 0) {
        dealers = exactDealers;
      } else {
        const allDealers = await prisma.dealer.findMany({
          where: baseWhere,
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            status: true,
            buyingGroup: true
          },
          distinct: ['id'],
          take: 500
        });

        const fuzzyMatches = allDealers.filter(dealer =>
          fuzzyMatchDealer(searchTerm, {
            companyName: dealer.companyName,
            contactName: dealer.contactName,
            email: dealer.email,
            phone: dealer.phone,
            buyingGroup: dealer.buyingGroup
          }, 0.5)
        );

        dealers = fuzzyMatches.slice(0, 100);
      }
    } else {
      dealers = await prisma.dealer.findMany({
        where: baseWhere,
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

// Get dealers with recordings for dashboard
router.get('/dashboard/dealers-with-recordings', async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;

    const baseWhere: any = {
      companyId: req.companyId!,
      voiceRecordings: {
        some: {}
      }
    };

    let dealers: any[] = [];

    if (search) {
      const searchTerm = (search as string).trim();
      
      const exactWhere: any = {
        ...baseWhere,
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { buyingGroup: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };

      const exactDealers = await prisma.dealer.findMany({
        where: exactWhere,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          status: true
        },
        distinct: ['id'],
        take: 100
      });

      if (exactDealers.length > 0) {
        dealers = exactDealers;
      } else {
        const allDealers = await prisma.dealer.findMany({
          where: baseWhere,
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            status: true,
            buyingGroup: true
          },
          distinct: ['id'],
          take: 500
        });

        const fuzzyMatches = allDealers.filter(dealer =>
          fuzzyMatchDealer(searchTerm, {
            companyName: dealer.companyName,
            contactName: dealer.contactName,
            email: dealer.email,
            phone: dealer.phone,
            buyingGroup: dealer.buyingGroup
          }, 0.5)
        );

        dealers = fuzzyMatches.slice(0, 100);
      }
    } else {
      dealers = await prisma.dealer.findMany({
        where: baseWhere,
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

