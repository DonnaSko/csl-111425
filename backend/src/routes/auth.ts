import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getSubscriptionStatus } from '../utils/subscription';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    if (!email || !password || !firstName || !lastName || !companyName) {
      return res.status(400).json({ error: 'All fields are required' });
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
    const jwtOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      jwtOptions
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

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
    const jwtOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      jwtOptions
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

export default router;

