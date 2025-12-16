import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getSubscriptionStatus } from '../utils/subscription';
import { sendEmail } from '../utils/email';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    let { email, password, firstName, lastName, companyName } = req.body;

    // Trim and sanitize inputs
    email = email?.trim().toLowerCase();
    firstName = firstName?.trim();
    lastName = lastName?.trim();
    companyName = companyName?.trim();

    if (!email || !password || !firstName || !lastName || !companyName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company and user
    const company = await prisma.company.create({
      data: {
        name: companyName,
        users: {
          create: {
            email,
            password: hashedPassword,
            firstName,
            lastName
          }
        }
      },
      include: {
        users: true
      }
    });

    const user = company.users[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') } as any
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Trim and lowercase email
    email = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') } as any
    );

    // Get subscription status
    const subscriptionStatus = await getSubscriptionStatus(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId
      },
      subscription: subscriptionStatus
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptionStatus = await getSubscriptionStatus(user.id);

    res.json({
      user,
      subscription: subscriptionStatus
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user preferences
router.get('/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { dailyEmailReminders: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      dailyEmailReminders: user.dailyEmailReminders ?? true // Default to true
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    // Return defaults if the field doesn't exist yet
    res.json({ dailyEmailReminders: true });
  }
});

// Update user preferences
router.put('/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const { dailyEmailReminders } = req.body;

    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        dailyEmailReminders: dailyEmailReminders === true
      }
    });

    res.json({ 
      success: true,
      dailyEmailReminders: dailyEmailReminders === true
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Request account deletion
router.post('/request-deletion', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send notification email to support
    try {
      await sendEmail({
        to: 'support@captureshowleads.com',
        subject: `Account Deletion Request - ${user.email}`,
        text: `Account deletion requested:\n\nUser: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nCompany: ${user.company.name}\nUser ID: ${user.id}\nCompany ID: ${user.companyId}\n\nPlease process this deletion request within 48 hours.`,
        html: `
          <h2>Account Deletion Request</h2>
          <p><strong>User:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Company:</strong> ${user.company.name}</p>
          <p><strong>User ID:</strong> ${user.id}</p>
          <p><strong>Company ID:</strong> ${user.companyId}</p>
          <p><em>Please process this deletion request within 48 hours.</em></p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send deletion notification email:', emailError);
    }

    // Send confirmation email to user
    try {
      await sendEmail({
        to: user.email,
        subject: 'Account Deletion Request Received - Capture Show Leads',
        text: `Hi ${user.firstName},\n\nWe've received your request to delete your Capture Show Leads account.\n\nWe will process your request within 48 hours. You will receive a confirmation email once your account and all associated data have been deleted.\n\nIf you did not request this, please contact us immediately at support@captureshowleads.com\n\nThank you,\nCapture Show Leads Team`,
        html: `
          <h2>Account Deletion Request Received</h2>
          <p>Hi ${user.firstName},</p>
          <p>We've received your request to delete your Capture Show Leads account.</p>
          <p>We will process your request within <strong>48 hours</strong>. You will receive a confirmation email once your account and all associated data have been deleted.</p>
          <p>If you did not request this, please contact us immediately at <a href="mailto:support@captureshowleads.com">support@captureshowleads.com</a></p>
          <p>Thank you,<br>Capture Show Leads Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send user confirmation email:', emailError);
    }

    res.json({ 
      success: true,
      message: 'Account deletion request submitted. You will receive a confirmation email.'
    });
  } catch (error) {
    console.error('Request deletion error:', error);
    res.status(500).json({ error: 'Failed to submit deletion request' });
  }
});

export default router;

