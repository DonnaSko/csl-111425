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

// Audio file filter for voice recordings
const audioFileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const allowedAudioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.aac'];
  const allowedAudioMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/mp4',
    'audio/m4a',
    'audio/webm',
    'audio/aac',
    'audio/x-m4a',
    'application/octet-stream' // Some browsers send this
  ];
  
  if (allowedAudioExtensions.includes(fileExt)) {
    if (file.mimetype && 
        !allowedAudioMimeTypes.includes(file.mimetype) && 
        file.mimetype !== 'application/octet-stream') {
      console.warn(`Warning: Audio file ${file.originalname} has unexpected MIME type: ${file.mimetype}, but extension is valid: ${fileExt}`);
    }
    cb(null, true);
  } else {
    cb(new Error(`Audio file type not supported. Allowed types: ${allowedAudioExtensions.join(', ').toUpperCase()}. Received: ${fileExt || 'unknown'}`));
  }
};

// Multer instance for audio files
const audioUpload = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for audio files
  }
});

// Image file filter for photos (badges, business cards, etc.)
const imageFileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  const allowedImageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/octet-stream' // Some browsers send this for images
  ];
  
  if (allowedImageExtensions.includes(fileExt)) {
    if (file.mimetype && 
        !allowedImageMimeTypes.includes(file.mimetype) && 
        file.mimetype !== 'application/octet-stream') {
      console.warn(`Warning: Image file ${file.originalname} has unexpected MIME type: ${file.mimetype}, but extension is valid: ${fileExt}`);
    }
    cb(null, true);
  } else {
    cb(new Error(`Image file type not supported. Allowed types: ${allowedImageExtensions.join(', ').toUpperCase()}. Received: ${fileExt || 'unknown'}`));
  }
};

// Multer instance for image files (photos)
const photoUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for photos
  }
});

router.use(authenticate);
router.use(requireActiveSubscription);

// Upload photo
router.post('/photo/:dealerId', photoUpload.single('photo'), async (req: AuthRequest, res) => {
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

    const photoType = req.body.type || 'business_card';
    const tradeshowName = req.body.tradeshowName || null;
    const tradeshowId = req.body.tradeshowId || null;

    // Read file content into buffer for database storage
    const fileContent = fs.readFileSync(req.file.path);

    const photo = await prisma.photo.create({
      data: {
        dealerId: req.params.dealerId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: null, // Don't store path - using content instead
        content: fileContent, // Store in database
        type: photoType,
        tradeshowName: tradeshowName,
        tradeshowId: tradeshowId
      }
    });

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    // Log badge scans to change history
    if (photoType === 'badge') {
      await prisma.dealerChangeHistory.create({
        data: {
          dealerId: req.params.dealerId,
          fieldName: 'badge_scanned',
          oldValue: null,
          newValue: tradeshowName ? `Badge scanned at ${tradeshowName}` : 'Badge scanned',
          changeType: 'added',
        }
      });
    }

    res.status(201).json(photo);
  } catch (error) {
    console.error('Upload photo error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
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

    // Try to get content from database first (new method)
    if (photo.content) {
      const buffer = Buffer.from(photo.content);
      const mimeType = photo.mimeType || 'image/jpeg';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(photo.originalName)}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      return res.send(buffer);
    }

    // Fallback to file system (for old photos uploaded before this fix)
    if (photo.path) {
      const filePath = path.resolve(photo.path);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    // If we get here, photo exists in database but file content is not available
    console.error(`Photo ${req.params.id} has no content in database or disk`);
    return res.status(404).json({ error: 'Photo file content not available' });
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

    // Delete file from disk if it exists (for old photos)
    if (photo.path && fs.existsSync(photo.path)) {
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
router.post('/recording/:dealerId', audioUpload.single('recording'), async (req: AuthRequest, res) => {
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

    // Read file content into buffer for database storage
    const fileContent = fs.readFileSync(req.file.path);

    // Parse date properly - if date is provided, use it; otherwise default to today
    let recordingDate: Date | null = null;
    if (req.body.date) {
      // Parse the date string (YYYY-MM-DD) and set to noon UTC to avoid TZ rollover issues
      const dateParts = req.body.date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        recordingDate = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
      } else {
        // Fallback to parsing as-is if format is unexpected
        const parsed = new Date(req.body.date);
        recordingDate = isNaN(parsed.getTime()) ? new Date() : parsed;
      }
    } else {
      // Default to today's date (noon UTC) if no date provided
      const today = new Date();
      recordingDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0, 0));
    }

    const recording = await prisma.voiceRecording.create({
      data: {
        dealerId: req.params.dealerId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        content: fileContent, // Store in database
        duration: req.body.duration ? parseInt(req.body.duration) : null,
        date: recordingDate,
        tradeshowName: req.body.tradeshowName || null
      }
    });

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    res.status(201).json(recording);
  } catch (error) {
    console.error('Upload recording error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
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

    // Try to get content from database first (new method)
    if (recording.content) {
      const mimeType = recording.mimeType || 'audio/webm';
      const buffer = Buffer.from(recording.content);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(recording.originalName)}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      return res.send(buffer);
    }

    // Fallback to file system (for old recordings uploaded before this fix)
    if (recording.path) {
      const filePath = path.resolve(recording.path);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          const mimeType = recording.mimeType || 'audio/webm';
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Length', stats.size);
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(recording.originalName)}"`);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'public, max-age=3600');

          const fileStream = fs.createReadStream(filePath);
          
          fileStream.on('error', (err) => {
            console.error('Error reading recording file:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to read recording file' });
            } else {
              res.end();
            }
          });

          return fileStream.pipe(res);
        }
      }
    }

    // If we get here, recording exists in database but file content is not available
    console.error(`Recording ${req.params.id} has no content in database or disk`);
    return res.status(404).json({ error: 'Recording file content not available' });
  } catch (error) {
    console.error('Get recording error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to get recording' });
    }
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

    // Delete file from disk if it exists (for old recordings)
    if (recording.path && fs.existsSync(recording.path)) {
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

