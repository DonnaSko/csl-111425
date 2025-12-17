import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const emailFilesDir = path.join(uploadDir, 'email-files');
if (!fs.existsSync(emailFilesDir)) {
  fs.mkdirSync(emailFilesDir, { recursive: true });
}

// Configure multer for email files (PDFs, catalogs, etc.)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, emailFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Allow PDFs, images, and common document formats
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'application/octet-stream'
];

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported. Allowed: PDF, Word, Excel, Images, Text. Received: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

router.use(authenticate);
router.use(requireActiveSubscription);

// Get all email files for company
router.get('/', async (req: AuthRequest, res) => {
  try {
    const files = await prisma.emailFile.findMany({
      where: { companyId: req.companyId! },
      orderBy: { createdAt: 'desc' }
    });

    res.json(files);
  } catch (error) {
    console.error('Get email files error:', error);
    res.status(500).json({ error: 'Failed to fetch email files' });
  }
});

// Upload email file
router.post('/', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { description } = req.body;

    const file = await prisma.emailFile.create({
      data: {
        companyId: req.companyId!,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        description: description || null
      }
    });

    res.status(201).json(file);
  } catch (error: any) {
    console.error('Upload email file error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// Delete email file
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const file = await prisma.emailFile.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete database record
    await prisma.emailFile.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete email file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Send email with attachments
router.post('/send', async (req: AuthRequest, res) => {
  try {
    const { to, cc, subject, body, fileIds } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'To and subject are required' });
    }

    // Get file paths for attachments
    const files = await prisma.emailFile.findMany({
      where: {
        id: { in: fileIds || [] },
        companyId: req.companyId!
      }
    });

    const attachments = files.map(file => ({
      filename: file.originalName,
      path: file.path
    }));

    // Import sendEmail dynamically to avoid circular dependencies
    const { sendEmail } = await import('../utils/email');
    
    const result = await sendEmail({
      to,
      cc,
      subject,
      html: body || '',
      attachments
    });

    if (result && 'disabled' in result && result.disabled) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const messageId = result && 'messageId' in result ? result.messageId : undefined;
    res.json({ success: true, messageId });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

export default router;

