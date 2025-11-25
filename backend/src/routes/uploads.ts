import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

router.use(authenticate);
router.use(requireActiveSubscription);

// Upload photo
router.post('/photo/:dealerId', upload.single('photo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify dealer belongs to company
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.dealerId,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const photo = await prisma.photo.create({
      data: {
        dealerId: req.params.dealerId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        type: req.body.type || 'business_card'
      }
    });

    res.status(201).json(photo);
  } catch (error) {
    console.error('Upload photo error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get photo
router.get('/photo/:id', async (req: AuthRequest, res) => {
  try {
    const photo = await prisma.photo.findFirst({
      where: {
        id: req.params.id,
        dealer: {
          companyId: req.companyId!
        }
      }
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.sendFile(path.resolve(photo.path));
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to get photo' });
  }
});

// Delete photo
router.delete('/photo/:id', async (req: AuthRequest, res) => {
  try {
    const photo = await prisma.photo.findFirst({
      where: {
        id: req.params.id,
        dealer: {
          companyId: req.companyId!
        }
      }
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete file
    if (fs.existsSync(photo.path)) {
      fs.unlinkSync(photo.path);
    }

    await prisma.photo.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Upload voice recording
router.post('/recording/:dealerId', upload.single('recording'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify dealer belongs to company
    const dealer = await prisma.dealer.findFirst({
      where: {
        id: req.params.dealerId,
        companyId: req.companyId!
      }
    });

    if (!dealer) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const recording = await prisma.voiceRecording.create({
      data: {
        dealerId: req.params.dealerId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        duration: req.body.duration ? parseInt(req.body.duration) : null
      }
    });

    res.status(201).json(recording);
  } catch (error) {
    console.error('Upload recording error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload recording' });
  }
});

// Get recording
router.get('/recording/:id', async (req: AuthRequest, res) => {
  try {
    const recording = await prisma.voiceRecording.findFirst({
      where: {
        id: req.params.id,
        dealer: {
          companyId: req.companyId!
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.sendFile(path.resolve(recording.path));
  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({ error: 'Failed to get recording' });
  }
});

// Delete recording
router.delete('/recording/:id', async (req: AuthRequest, res) => {
  try {
    const recording = await prisma.voiceRecording.findFirst({
      where: {
        id: req.params.id,
        dealer: {
          companyId: req.companyId!
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    if (fs.existsSync(recording.path)) {
      fs.unlinkSync(recording.path);
    }

    await prisma.voiceRecording.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

export default router;

