import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';

// Debug logging helper
const debugLog = (location: string, message: string, data: any, hypothesisId: string) => {
  const logPath = '/Users/donnaskolnick/Desktop/CSL- 11-14-25/.cursor/debug.log';
  const logEntry = JSON.stringify({
    location,
    message,
    data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId
  }) + '\n';
  try {
    fs.appendFileSync(logPath, logEntry);
  } catch (err) {
    // Silently fail if log file can't be written
  }
};

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

    // Store absolute path to ensure it works in production
    const absolutePath = path.isAbsolute(req.file.path) ? req.file.path : path.resolve(req.file.path);
    
    console.log(`[Email Files] Uploaded file: ${req.file.originalname}, saved to: ${absolutePath}`);

    const file = await prisma.emailFile.create({
      data: {
        companyId: req.companyId!,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: absolutePath, // Store absolute path
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

    // #region agent log
    debugLog('emailFiles.ts:146', 'Backend received request', {fileIds:fileIds,fileIdsType:typeof fileIds,fileIdsIsArray:Array.isArray(fileIds),fileIdsLength:Array.isArray(fileIds)?fileIds.length:'not array',companyId:req.companyId,fullBody:req.body}, 'C');
    // #endregion

    // Comprehensive logging of incoming request
    console.log(`[Email] Received email send request:`, {
      to,
      cc,
      subject,
      bodyLength: body?.length || 0,
      fileIds: fileIds,
      fileIdsType: typeof fileIds,
      fileIdsIsArray: Array.isArray(fileIds),
      fileIdsLength: Array.isArray(fileIds) ? fileIds.length : 'not an array',
      companyId: req.companyId,
      requestBody: JSON.stringify(req.body)
    });

    if (!to || !subject) {
      return res.status(400).json({ error: 'To and subject are required' });
    }

    // Normalize fileIds - ensure it's an array
    // Handle all cases: undefined, null, empty array, array with values, or single string
    let normalizedFileIds: string[] = [];
    if (fileIds !== undefined && fileIds !== null) {
      if (Array.isArray(fileIds)) {
        normalizedFileIds = fileIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
      } else if (typeof fileIds === 'string') {
        // Handle case where fileIds might be sent as a single string
        normalizedFileIds = [fileIds].filter(id => id && id.trim().length > 0);
      }
    }
    // If fileIds is undefined/null/empty, normalizedFileIds remains []

    console.log(`[Email] Normalized fileIds:`, normalizedFileIds);

    // #region agent log
    debugLog('emailFiles.ts:177', 'Before database query', {normalizedFileIds:normalizedFileIds,normalizedFileIdsLength:normalizedFileIds.length,companyId:req.companyId}, 'D');
    // #endregion

    // Get file paths for attachments
    const files = normalizedFileIds.length > 0 ? await prisma.emailFile.findMany({
      where: {
        id: { in: normalizedFileIds },
        companyId: req.companyId!
      }
    }) : [];

    // #region agent log
    debugLog('emailFiles.ts:186', 'After database query', {filesFound:files.length,requestedIds:normalizedFileIds.length,fileDetails:files.map(f=>({id:f.id,originalName:f.originalName,path:f.path}))}, 'D');
    // #endregion

    console.log(`[Email] Found ${files.length} files to attach from ${normalizedFileIds.length} requested IDs`);
    if (normalizedFileIds.length > 0 && files.length === 0) {
      console.warn(`[Email] WARNING: No files found in database for requested IDs:`, normalizedFileIds);
    }

    // Prepare attachments with absolute paths and verify they exist
    const attachments = [];
    for (const file of files) {
      let absolutePath: string;
      
      // Handle path resolution - try multiple strategies
      if (path.isAbsolute(file.path)) {
        // Already absolute path
        absolutePath = file.path;
      } else {
        // Relative path - resolve relative to upload directory
        // First try resolving from current working directory
        absolutePath = path.resolve(file.path);
        
        // If that doesn't exist, try resolving relative to emailFilesDir
        if (!fs.existsSync(absolutePath)) {
          const relativeToUploadDir = path.resolve(emailFilesDir, path.basename(file.path));
          if (fs.existsSync(relativeToUploadDir)) {
            absolutePath = relativeToUploadDir;
          }
        }
        
        // If still not found, try using just the filename in emailFilesDir
        if (!fs.existsSync(absolutePath)) {
          const filenameOnly = path.resolve(emailFilesDir, file.filename);
          if (fs.existsSync(filenameOnly)) {
            absolutePath = filenameOnly;
          }
        }
      }
      
      const fileExists = fs.existsSync(absolutePath);
      
      console.log(`[Email] File: ${file.originalName}`);
      console.log(`[Email]   Database path: ${file.path}`);
      console.log(`[Email]   Resolved path: ${absolutePath}`);
      console.log(`[Email]   Exists: ${fileExists}`);
      
      if (fileExists) {
        // Verify it's actually a file and readable
        try {
          const stats = fs.statSync(absolutePath);
          if (!stats.isFile()) {
            console.error(`[Email] ✗ Path exists but is not a file: ${absolutePath}`);
            continue;
          }
          
          // Verify file size matches database (sanity check)
          if (file.size && stats.size !== file.size) {
            console.warn(`[Email] ⚠️  File size mismatch: DB=${file.size}, Disk=${stats.size}`);
          }
          
          attachments.push({
            filename: file.originalName,
            path: absolutePath
          });
          console.log(`[Email] ✓ Added attachment: ${file.originalName} (${Math.round(stats.size / 1024)} KB)`);
        } catch (error: any) {
          console.error(`[Email] ✗ Error accessing file ${file.originalName}:`, error.message);
        }
      } else {
        console.error(`[Email] ✗ File not found on disk: ${absolutePath}`);
        console.error(`[Email]   Original DB path: ${file.path}`);
        console.error(`[Email]   Email files directory: ${emailFilesDir}`);
        console.error(`[Email]   Upload directory: ${uploadDir}`);
        
        // Try to find the file by filename in emailFilesDir
        const possiblePaths = [
          path.join(emailFilesDir, file.filename),
          path.join(emailFilesDir, file.originalName),
          path.join(uploadDir, file.filename),
          path.join(uploadDir, file.originalName)
        ];
        
        let found = false;
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            console.log(`[Email]   Found file at alternative path: ${possiblePath}`);
            try {
              const stats = fs.statSync(possiblePath);
              attachments.push({
                filename: file.originalName,
                path: possiblePath
              });
              console.log(`[Email] ✓ Added attachment from alternative path: ${file.originalName}`);
              found = true;
              break;
            } catch (error: any) {
              console.error(`[Email]   Error accessing alternative path:`, error.message);
            }
          }
        }
        
        if (!found) {
          console.error(`[Email] This file exists in database but not on disk - attachment will be skipped`);
        }
      }
    }

    console.log(`[Email] ===== ATTACHMENT SUMMARY =====`);
    console.log(`[Email] Requested file IDs: ${normalizedFileIds.length}`);
    console.log(`[Email] Files found in database: ${files.length}`);
    console.log(`[Email] Attachments prepared: ${attachments.length}`);
    if (attachments.length > 0) {
      console.log(`[Email] Attachment details:`, attachments.map(att => ({ filename: att.filename, path: att.path })));
    }
    if (normalizedFileIds.length > 0 && attachments.length === 0) {
      console.error(`[Email] ⚠️  CRITICAL: ${normalizedFileIds.length} file ID(s) requested but 0 attachments prepared!`);
      console.error(`[Email] This means files were requested but either not found in database or not found on disk`);
    }
    console.log(`[Email] =============================`);
    
    // #region agent log
    debugLog('emailFiles.ts:210', 'Attachments prepared', {attachmentsCount:attachments.length,attachments:attachments.map(a=>({filename:a.filename,path:a.path})),filesProcessed:files.length}, 'E');
    // #endregion
    
    if (attachments.length === 0 && normalizedFileIds.length > 0) {
      console.warn(`[Email] WARNING: No attachments prepared but ${normalizedFileIds.length} file IDs were requested!`);
      console.warn(`[Email] Requested file IDs:`, normalizedFileIds);
      console.warn(`[Email] Found files from database:`, files.map(f => ({ id: f.id, originalName: f.originalName, path: f.path })));
      console.warn(`[Email] Files that exist:`, files.map(f => {
        const absPath = path.isAbsolute(f.path) ? f.path : path.resolve(f.path);
        return { id: f.id, originalName: f.originalName, path: f.path, absolutePath: absPath, exists: fs.existsSync(absPath) };
      }));
    }

    // Convert body to HTML (preserve line breaks)
    const htmlBody = body ? body.replace(/\n/g, '<br>') : '';

    // Import sendEmail dynamically to avoid circular dependencies
    const { sendEmail } = await import('../utils/email');
    
    // Handle CC - convert comma-separated string to array if needed
    let ccArray: string[] | undefined;
    if (cc) {
      if (typeof cc === 'string') {
        ccArray = cc.split(',').map(email => email.trim()).filter(email => email.length > 0);
      } else if (Array.isArray(cc)) {
        ccArray = cc;
      }
    }
    
    console.log(`[Email] Calling sendEmail with ${attachments.length} attachments`);
    console.log(`[Email] SendEmail params:`, {
      to,
      cc: ccArray,
      subject,
      htmlLength: htmlBody?.length || 0,
      attachmentsCount: attachments.length,
      attachments: attachments.length > 0 ? attachments.map(a => ({ filename: a.filename, path: a.path })) : undefined
    });
    
    // #region agent log
    debugLog('emailFiles.ts:241', 'About to call sendEmail', {attachmentsCount:attachments.length,attachments:attachments.map(a=>({filename:a.filename,path:a.path})),willPassAttachments:attachments.length>0}, 'F');
    // #endregion
    
    // CRITICAL FIX: Always pass attachments array (never undefined) - nodemailer expects array
    // This ensures sendEmail receives the attachments parameter correctly
    const emailParams: any = {
      to,
      cc: ccArray && ccArray.length > 0 ? ccArray : undefined,
      subject,
      html: htmlBody || '<p>No message body provided.</p>',
      // Always pass attachments as array - even if empty
      attachments: attachments.length > 0 ? attachments : []
    };
    
    console.log(`[Email] Preparing to call sendEmail with ${attachments.length} attachment(s)`);
    if (attachments.length > 0) {
      console.log(`[Email] ✓ Including ${attachments.length} attachment(s) in email`);
      console.log(`[Email] Attachment list:`, attachments.map(a => ({ filename: a.filename, path: a.path })));
    } else if (normalizedFileIds.length > 0) {
      // File IDs were requested but no attachments prepared - log warning but don't fail
      console.error(`[Email] ✗ ERROR: ${normalizedFileIds.length} file ID(s) requested but 0 attachments prepared!`);
      console.error(`[Email] This means files exist in database but not on disk, or paths are incorrect`);
    } else {
      console.log(`[Email] No attachments requested - sending email without attachments`);
    }
    
    const result = await sendEmail(emailParams);
    
    // #region agent log
    debugLog('emailFiles.ts:250', 'sendEmail returned', {result:result,hasMessageId:!!(result&&'messageId'in result),messageId:result&&'messageId'in result?result.messageId:'none'}, 'F');
    // #endregion

    if (result && 'disabled' in result && result.disabled) {
      return res.status(503).json({ error: 'Email service not configured. Please check SMTP settings.' });
    }

    if (!result) {
      return res.status(500).json({ error: 'Failed to send email - no result from email service' });
    }

    const messageId = result && 'messageId' in result ? result.messageId : undefined;
    console.log(`[Email] Sent email to ${to}${ccArray ? `, CC: ${ccArray.join(', ')}` : ''} - Message ID: ${messageId || 'N/A'}`);
    console.log(`[Email] Email sent with ${attachments.length} attachment(s) out of ${normalizedFileIds.length} requested file ID(s)`);
    
    // Return detailed response including attachment info for debugging
    res.json({ 
      success: true, 
      messageId,
      attachmentsSent: attachments.length,
      attachmentsRequested: normalizedFileIds.length,
      attachmentDetails: attachments.length > 0 ? attachments.map(a => ({ filename: a.filename })) : []
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

export default router;


