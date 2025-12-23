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

    // DIAGNOSTIC: Add file existence check to response
    const filesWithExistence = files.map(file => {
      let exists = false;
      let actualPath = file.path;
      let error = null;
      
      try {
        // Try the stored path
        if (fs.existsSync(file.path)) {
          exists = true;
          actualPath = file.path;
        } else {
          // Try alternative paths
          const possiblePaths = [
            path.join(emailFilesDir, file.filename),
            path.join(emailFilesDir, file.originalName),
            path.join(uploadDir, file.filename),
            path.join(uploadDir, file.originalName),
            path.resolve(file.path),
            path.resolve(emailFilesDir, path.basename(file.path))
          ];
          
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              exists = true;
              actualPath = possiblePath;
              break;
            }
          }
        }
      } catch (err: any) {
        error = err.message;
      }
      
      return {
        ...file,
        existsOnDisk: exists,
        actualPath: actualPath,
        pathError: error,
        emailFilesDir: emailFilesDir,
        uploadDir: uploadDir
      };
    });

    res.json(filesWithExistence);
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

// Get email file content by ID (for downloading files to send as attachments)
router.get('/:id/download', async (req: AuthRequest, res) => {
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

    // Try multiple path resolution strategies
    let filePath = file.path;
    if (!fs.existsSync(filePath)) {
      // Try alternative paths
      const possiblePaths = [
        path.resolve(emailFilesDir, file.filename),
        path.resolve(emailFilesDir, file.originalName),
        path.resolve(uploadDir, file.filename),
        path.resolve(uploadDir, file.originalName)
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          break;
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Read and return file
    const fileContent = fs.readFileSync(filePath);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.send(fileContent);
  } catch (error: any) {
    console.error('Download email file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
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

// Send email with attachments - accepts multipart/form-data with files
// NEW APPROACH: Files are sent directly in FormData, not fileIds
router.post('/send', upload.array('files'), async (req: AuthRequest, res) => {
  try {
    // #region agent log
    debugLog('emailFiles.ts:254', 'Email send request received', {
      hasFiles: !!(req.files && Array.isArray(req.files) && req.files.length > 0),
      filesCount: req.files ? (req.files as Express.Multer.File[]).length : 0,
      bodyKeys: Object.keys(req.body),
      companyId: req.companyId
    }, 'FORMDATA_A');
    // #endregion

    // Get form fields (to, cc, subject, body)
    const { to, cc, subject, body } = req.body;
    
    // Get uploaded files from FormData
    // CRITICAL: Check req.files and req.file (multer can use either)
    let uploadedFiles: Express.Multer.File[] = [];
    if (req.files) {
      if (Array.isArray(req.files)) {
        uploadedFiles = req.files;
      } else if (typeof req.files === 'object') {
        // Multer sometimes returns an object with field names as keys
        uploadedFiles = Object.values(req.files).flat();
      }
    } else if (req.file) {
      // Single file upload
      uploadedFiles = [req.file];
    }
    
    console.log(`[Email] ===== MULTER FILES CHECK =====`);
    console.log(`[Email] req.files type:`, typeof req.files, Array.isArray(req.files) ? 'array' : 'not array');
    console.log(`[Email] req.files value:`, req.files);
    console.log(`[Email] req.file:`, req.file);
    console.log(`[Email] uploadedFiles.length:`, uploadedFiles.length);
    console.log(`[Email] =============================`);
    
    console.log(`[Email] ===== EMAIL SEND REQUEST START (FormData) =====`);
    console.log(`[Email] Content-Type header: ${req.headers['content-type'] || 'not set'}`);
    
    // #region agent log
    debugLog('emailFiles.ts:273', 'FormData request received', {
      contentType: req.headers['content-type'] || 'not set',
      hasBoundary: req.headers['content-type']?.includes('boundary') || false,
      filesCount: uploadedFiles.length,
      bodyFields: { to, cc: cc || null, subject, bodyLength: body?.length || 0 }
    }, 'FORMDATA_L');
    // #endregion
    console.log(`[Email] Received email send request:`, {
      to,
      cc,
      subject,
      bodyLength: body?.length || 0,
      filesReceived: uploadedFiles.length,
      fileNames: uploadedFiles.map(f => f.originalname)
    });

    if (!to || !subject) {
      return res.status(400).json({ error: 'To and subject are required' });
    }

    // #region agent log
    debugLog('emailFiles.ts:275', 'Processing FormData files', {
      filesCount: uploadedFiles.length,
      fileNames: uploadedFiles.map(f => f.originalname),
      fileSizes: uploadedFiles.map(f => f.size)
    }, 'FORMDATA_B');
    // #endregion

    // NEW APPROACH: Process files directly from FormData
    // Convert uploaded files to email attachments (buffers)
    const attachments = [];
    console.log(`[Email] ===== PROCESSING FORMDATA FILES =====`);
    console.log(`[Email] Files received in FormData: ${uploadedFiles.length}`);
    
    for (const uploadedFile of uploadedFiles) {
      console.log(`[Email] Processing file: ${uploadedFile.originalname}`);
      console.log(`[Email]   Size: ${Math.round(uploadedFile.size / 1024)} KB`);
      console.log(`[Email]   MIME type: ${uploadedFile.mimetype}`);
      console.log(`[Email]   Path: ${uploadedFile.path}`);
      
      // #region agent log
      debugLog('emailFiles.ts:330', 'Before reading file from disk', {
        filename: uploadedFile.originalname,
        path: uploadedFile.path,
        pathExists: fs.existsSync(uploadedFile.path),
        size: uploadedFile.size
      }, 'HYP_A');
      // #endregion
      
      try {
        // CRITICAL: Verify file exists before reading
        if (!fs.existsSync(uploadedFile.path)) {
          console.error(`[Email] ✗ File does not exist at path: ${uploadedFile.path}`);
          // #region agent log
          debugLog('emailFiles.ts:338', 'File not found on disk', {
            filename: uploadedFile.originalname,
            path: uploadedFile.path,
            pathExists: false
          }, 'HYP_B');
          // #endregion
          continue;
        }
        
        // Read file content as buffer
        const fileContent = fs.readFileSync(uploadedFile.path);
        
        // CRITICAL FIX: Ensure we have a valid Buffer
        if (!Buffer.isBuffer(fileContent) || fileContent.length === 0) {
          console.error(`[Email] ✗ Invalid file content - not a Buffer or empty`);
          console.error(`[Email] Content type: ${typeof fileContent}, Length: ${fileContent.length}`);
          continue;
        }
        
        console.log(`[Email]   ✓ File read successfully (${fileContent.length} bytes)`);
        
        // #region agent log
        debugLog('emailFiles.ts:348', 'File read from disk', {
          filename: uploadedFile.originalname,
          contentLength: fileContent.length,
          contentIsBuffer: Buffer.isBuffer(fileContent),
          bufferType: typeof fileContent
        }, 'HYP_B');
        // #endregion
        
        // Determine content type from MIME type or extension
        const ext = path.extname(uploadedFile.originalname).toLowerCase();
        let contentType = uploadedFile.mimetype;
        
        // Fallback MIME types if not provided
        if (!contentType || contentType === 'application/octet-stream') {
          const mimeTypes: { [key: string]: string } = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
          };
          contentType = mimeTypes[ext] || 'application/octet-stream';
        }
        
        // Create attachment object with buffer content
        // Format expected by nodemailer: { filename, content: Buffer, contentType? }
        // CRITICAL FIX: DO NOT set contentDisposition - nodemailer handles this automatically for Buffer content
        // Manually setting contentDisposition can cause nodemailer to ignore attachments
        const attachmentObj = {
          filename: uploadedFile.originalname,
          content: fileContent, // Buffer from file read
          contentType: contentType
        };
        
        // #region agent log
        debugLog('emailFiles.ts:359', 'Attachment object created', {
          filename: attachmentObj.filename,
          contentLength: attachmentObj.content.length,
          contentType: attachmentObj.contentType,
          contentIsBuffer: Buffer.isBuffer(attachmentObj.content),
          attachmentObjKeys: Object.keys(attachmentObj)
        }, 'HYP_C');
        // #endregion
        
        attachments.push(attachmentObj);
        
        console.log(`[Email] ✓ Added attachment: ${uploadedFile.originalname} (${Math.round(fileContent.length / 1024)} KB, ${contentType})`);
        
        // #region agent log
        debugLog('emailFiles.ts:310', 'File processed from FormData', {
          filename: uploadedFile.originalname,
          size: fileContent.length,
          contentType: contentType,
          attachmentsCount: attachments.length
        }, 'FORMDATA_C');
        // #endregion
      } catch (error: any) {
        console.error(`[Email] ✗ Error reading file ${uploadedFile.originalname}:`, error.message);
        // #region agent log
        debugLog('emailFiles.ts:320', 'Error processing file', {
          filename: uploadedFile.originalname,
          error: error.message
        }, 'FORMDATA_D');
        // #endregion
      }
    }
    
    console.log(`[Email] ===== FORMDATA PROCESSING COMPLETE =====`);
    console.log(`[Email] Total attachments prepared: ${attachments.length}`);

    console.log(`[Email] ===== ATTACHMENT SUMMARY =====`);
    console.log(`[Email] Files received in FormData: ${uploadedFiles.length}`);
    console.log(`[Email] Attachments prepared: ${attachments.length}`);
    if (attachments.length > 0) {
      console.log(`[Email] Attachment details:`, attachments.map(att => ({ 
        filename: att.filename, 
        hasContent: !!att.content,
        contentLength: att.content ? att.content.length : 0,
        contentType: att.contentType || 'not set'
      })));
    }
    if (uploadedFiles.length > 0 && attachments.length === 0) {
      console.error(`[Email] ⚠️  CRITICAL: ${uploadedFiles.length} file(s) received but 0 attachments prepared!`);
      console.error(`[Email] This means files were sent but couldn't be processed`);
    }
    console.log(`[Email] =============================`);
    
    // #region agent log
    debugLog('emailFiles.ts:330', 'Attachments prepared from FormData', {
      attachmentsCount: attachments.length,
      attachments: attachments.map(a => ({
        filename: a.filename,
        hasContent: !!a.content,
        contentLength: a.content ? a.content.length : 0,
        contentType: a.contentType
      })),
      filesReceived: uploadedFiles.length
    }, 'FORMDATA_E');
    // #endregion

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
      attachments: attachments.length > 0 ? attachments.map(a => ({ 
        filename: a.filename, 
        hasContent: !!a.content,
        contentLength: a.content ? a.content.length : 0,
        contentType: a.contentType || 'not set'
      })) : undefined
    });
    
    // #region agent log
    debugLog('emailFiles.ts:360', 'About to call sendEmail', {
      attachmentsCount: attachments.length,
      attachments: attachments.map(a => ({
        filename: a.filename,
        hasContent: !!a.content,
        contentLength: a.content ? a.content.length : 0,
        contentType: a.contentType
      })),
      willPassAttachments: attachments.length > 0
    }, 'FORMDATA_F');
    // #endregion
    
    // CRITICAL FIX: Always pass attachments array (never undefined) - nodemailer expects array
    // Attachments now have content as Buffer (from FormData), not paths
    const emailParams: any = {
      to,
      cc: ccArray && ccArray.length > 0 ? ccArray : undefined,
      subject,
      html: htmlBody || '<p>No message body provided.</p>',
      // Always pass attachments as array - even if empty
      // Attachments have format: { filename, content: Buffer, contentType }
      attachments: attachments.length > 0 ? attachments : []
    };
    
    console.log(`[Email] Preparing to call sendEmail with ${attachments.length} attachment(s)`);
    if (attachments.length > 0) {
      console.log(`[Email] ✓ Including ${attachments.length} attachment(s) in email`);
      console.log(`[Email] Attachment list:`, attachments.map(a => ({ 
        filename: a.filename, 
        size: a.content ? `${Math.round(a.content.length / 1024)} KB` : 'unknown',
        contentType: a.contentType || 'not set'
      })));
    } else if (uploadedFiles.length > 0) {
      console.error(`[Email] ✗ ERROR: ${uploadedFiles.length} file(s) received but 0 attachments prepared!`);
      console.error(`[Email] This means files were sent but couldn't be processed`);
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
    console.log(`[Email] Email sent with ${attachments.length} attachment(s) out of ${uploadedFiles.length} file(s) received`);
    
    // Clean up temporary uploaded files
    for (const uploadedFile of uploadedFiles) {
      try {
        if (fs.existsSync(uploadedFile.path)) {
          fs.unlinkSync(uploadedFile.path);
          console.log(`[Email] Cleaned up temporary file: ${uploadedFile.path}`);
        }
      } catch (error: any) {
        console.warn(`[Email] Could not delete temporary file ${uploadedFile.path}:`, error.message);
      }
    }
    
    // Return detailed response including attachment info for debugging
    res.json({ 
      success: true, 
      messageId,
      attachmentsSent: attachments.length,
      attachmentsRequested: uploadedFiles.length,
      attachmentDetails: attachments.length > 0 ? attachments.map(a => ({ filename: a.filename })) : []
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

export default router;


