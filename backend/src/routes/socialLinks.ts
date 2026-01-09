import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Protected routes require authentication
router.use(authenticate);
router.use(requireActiveSubscription);

/**
 * GET /api/social-links
 * Get the current user's social media links
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        socialTwitter: true,
        socialFacebook: true,
        socialLinkedIn: true,
        socialInstagram: true,
        socialTikTok: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      twitter: user.socialTwitter || '',
      facebook: user.socialFacebook || '',
      linkedIn: user.socialLinkedIn || '',
      instagram: user.socialInstagram || '',
      tikTok: user.socialTikTok || '',
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    res.status(500).json({ error: 'Failed to fetch social links' });
  }
});

/**
 * PUT /api/social-links
 * Update the current user's social media links
 */
router.put('/', async (req: AuthRequest, res) => {
  try {
    const { twitter, facebook, linkedIn, instagram, tikTok } = req.body;

    // Update user's social links
    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        socialTwitter: twitter || null,
        socialFacebook: facebook || null,
        socialLinkedIn: linkedIn || null,
        socialInstagram: instagram || null,
        socialTikTok: tikTok || null,
      },
      select: {
        socialTwitter: true,
        socialFacebook: true,
        socialLinkedIn: true,
        socialInstagram: true,
        socialTikTok: true,
      },
    });

    res.json({
      success: true,
      message: 'Social links updated successfully',
      socialLinks: {
        twitter: updatedUser.socialTwitter || '',
        facebook: updatedUser.socialFacebook || '',
        linkedIn: updatedUser.socialLinkedIn || '',
        instagram: updatedUser.socialInstagram || '',
        tikTok: updatedUser.socialTikTok || '',
      },
    });
  } catch (error) {
    console.error('Error updating social links:', error);
    res.status(500).json({ error: 'Failed to update social links' });
  }
});

export default router;
