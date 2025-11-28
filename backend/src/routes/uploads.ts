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

// Allowed file extensions and their corresponding MIME types
const allowedExtensions = ['.csv', '.pdf', '.xls', '.xlsx', '.doc', '.docx', '.pages', '.txt', '.rtf'];
const allowedMimeTypes = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.apple.pages',
  'application/rtf',
  'text/rtf',
  'application/octet-stream' // Some browsers send this for unknown types
];

// File filter function
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Check extension first (more reliable than MIME type)
  if (allowedExtensions.includes(fileExt)) {
    // Also check MIME type if provided, but don't reject if it's application/octet-stream
    // (some browsers send this for valid files)
    if (file.mimetype && 
        !allowedMimeTypes.includes(file.mimetype) && 
        file.mimetype !== 'application/octet-stream') {
      console.warn(`Warning: File ${file.originalname} has unexpected MIME type: ${file.mimetype}, but extension is valid: ${fileExt}`);
    }
    cb(null, true);
  } else {
    cb(new Error(`File type not supported. Allowed types: ${allowedExtensions.join(', ').toUpperCase()}. Received: ${fileExt || 'unknown'}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB default (increased for large CSV files)
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

// Upload general document (CSV, PDF, Excel, Word, etc.)
router.post('/document', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a file and try again.' });
    }

    console.log('File upload received:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      extension: path.extname(req.file.originalname)
    });

    // File validation is already done by multer fileFilter, but double-check
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      // Delete uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        error: `File type not supported. Allowed types: ${allowedExtensions.join(', ').toUpperCase()}. Received: ${fileExt || 'unknown'}` 
      });
    }

    // Store file info
    // Note: In the future, you might want to create a Document model in Prisma
    // For now, we return the file info and store it on disk
    const fileInfo = {
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      path: req.file.path,
      uploadedAt: new Date().toISOString()
    };

    console.log('File uploaded successfully:', fileInfo);
    res.status(201).json(fileInfo);
  } catch (error: any) {
    console.error('Upload document error:', error);
    
    // Handle multer errors specifically
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE || '104857600') / 1024 / 1024;
        return res.status(400).json({ 
          error: `File too large. Maximum size is ${maxSizeMB}MB. Your file exceeds this limit.` 
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected file field. Please use "file" as the field name.' });
      }
    }
    
    // Handle "request entity too large" errors from Express/nginx
    if (error.message && error.message.includes('request entity too large')) {
      return res.status(413).json({ 
        error: 'File too large. Maximum file size is 100MB. Please try a smaller file or split your CSV into multiple files.' 
      });
    }
    
    // Handle 413 status code (Payload Too Large)
    if (error.status === 413 || error.statusCode === 413) {
      return res.status(413).json({ 
        error: 'File too large. Maximum file size is 100MB. Please try a smaller file or split your CSV into multiple files.' 
      });
    }
    
    // Clean up file if it was uploaded
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file after error:', unlinkError);
      }
    }
    
    const errorMessage = error.message || 'Failed to upload document. Please try again.';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;

