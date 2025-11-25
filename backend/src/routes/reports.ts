import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

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

export default router;

