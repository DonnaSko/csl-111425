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

// Separate multer instance for email sending endpoint - uses memoryStorage to get buffer directly
// This is more efficient and reliable than reading from disk
const uploadForEmail = multer({
  storage: multer.memoryStorage(),
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
        if (file.path && fs.existsSync(file.path)) {
          exists = true;
          actualPath = file.path;
        } else {
          // Try alternative paths
          const possiblePaths = [
            path.join(emailFilesDir, file.filename),
            path.join(emailFilesDir, file.originalName),
            path.join(uploadDir, file.filename),
            path.join(uploadDir, file.originalName),
            file.path ? path.resolve(file.path) : '',
            file.path ? path.resolve(emailFilesDir, path.basename(file.path)) : ''
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

    // Read file content into buffer to store in database
    const fileContent = fs.readFileSync(req.file.path);
    const absolutePath = path.isAbsolute(req.file.path) ? req.file.path : path.resolve(req.file.path);
    
    console.log(`[Email Files] Uploaded file: ${req.file.originalname}, size: ${fileContent.length} bytes`);
    console.log(`[Email Files] Storing file content in database (not on disk)`);

    // Store file content in database (not just path)
    const file = await prisma.emailFile.create({
      data: {
        companyId: req.companyId!,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content: fileContent,  // NEW: Store file content in database
        path: absolutePath,    // Keep path for backward compatibility
        description: description || null
      }
    });

    // Delete temporary file after storing in database
    try {
      fs.unlinkSync(req.file.path);
      console.log(`[Email Files] Deleted temporary file: ${req.file.path}`);
    } catch (err) {
      console.warn(`[Email Files] Could not delete temporary file: ${req.file.path}`);
    }

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
    // #region agent log
    debugLog('emailFiles.ts:186', 'Download endpoint called', {
      fileId: req.params.id,
      companyId: req.companyId,
      emailFilesDir: emailFilesDir,
      uploadDir: uploadDir
    }, 'DOWNLOAD_1');
    // #endregion
    
    const file = await prisma.emailFile.findFirst({
      where: {
        id: req.params.id,
        companyId: req.companyId!
      }
    });

    if (!file) {
      // #region agent log
      debugLog('emailFiles.ts:195', 'File not found in database', {
        fileId: req.params.id,
        companyId: req.companyId
      }, 'DOWNLOAD_2');
      // #endregion
      return res.status(404).json({ error: 'File not found' });
    }

    // #region agent log
    debugLog('emailFiles.ts:200', 'File found in database', {
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalName,
      storedPath: file.path,
      storedPathExists: file.path ? fs.existsSync(file.path) : false,
      emailFilesDir: emailFilesDir,
      uploadDir: uploadDir
    }, 'DOWNLOAD_3');
    // #endregion

    // Try multiple path resolution strategies
    let filePath = file.path || '';
    const triedPaths: string[] = filePath ? [filePath] : [];
    
    if (!filePath || !fs.existsSync(filePath)) {
      // Try alternative paths
      const possiblePaths = [
        path.resolve(emailFilesDir, file.filename),
        path.resolve(emailFilesDir, file.originalName),
        path.resolve(uploadDir, file.filename),
        path.resolve(uploadDir, file.originalName),
        path.join(emailFilesDir, file.filename),
        path.join(emailFilesDir, file.originalName),
        path.join(uploadDir, file.filename),
        path.join(uploadDir, file.originalName)
      ];
      
      for (const possiblePath of possiblePaths) {
        triedPaths.push(possiblePath);
        if (fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          break;
        }
      }
    }

    // #region agent log
    debugLog('emailFiles.ts:218', 'Path resolution result', {
      fileId: file.id,
      originalName: file.originalName,
      finalPath: filePath,
      finalPathExists: fs.existsSync(filePath),
      triedPaths: triedPaths,
      allTriedPathsExist: triedPaths.map(p => ({ path: p, exists: fs.existsSync(p) }))
    }, 'DOWNLOAD_4');
    // #endregion

    if (!filePath || !fs.existsSync(filePath)) {
      console.error(`[Email Files] File not found on disk: ${file.originalName}`);
      console.error(`[Email Files] Tried paths:`, triedPaths);
      return res.status(404).json({ 
        error: 'File not found on disk',
        triedPaths: triedPaths.filter(p => p).map(p => ({ path: p, exists: fs.existsSync(p) }))
      });
    }

    // Read and return file
    const fileContent = fs.readFileSync(filePath);
    
    // #region agent log
    debugLog('emailFiles.ts:228', 'File read successfully', {
      fileId: file.id,
      originalName: file.originalName,
      fileSize: fileContent.length,
      path: filePath
    }, 'DOWNLOAD_5');
    // #endregion
    
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.send(fileContent);
  } catch (error: any) {
    console.error('Download email file error:', error);
    // #region agent log
    debugLog('emailFiles.ts:238', 'Download endpoint error', {
      fileId: req.params.id,
      error: error.message,
      stack: error.stack
    }, 'DOWNLOAD_6');
    // #endregion
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

    // Delete physical file (if it exists on disk)
    if (file.path && fs.existsSync(file.path)) {
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

// Send email with attachments - accepts EITHER:
// 1. fileIds in JSON body (PREFERRED - backend reads files directly from disk)
// 2. multipart/form-data with files (FALLBACK - for when files need to be uploaded fresh)
// Multer middleware is optional - will only process if Content-Type is multipart/form-data
router.post('/send', uploadForEmail.array('files'), async (req: AuthRequest, res) => {
  // Handle multer errors gracefully (e.g., when JSON is sent instead of FormData)
  if (req.headers['content-type']?.includes('application/json')) {
    // JSON request - multer won't process files, which is fine
    // We'll handle fileIds from req.body instead
  }
  try {
    // #region agent log
    debugLog('emailFiles.ts:331', 'Email send endpoint entry', {
      hasFiles: !!(req.files && Array.isArray(req.files) && req.files.length > 0),
      filesCount: req.files ? (req.files as Express.Multer.File[]).length : 0,
      bodyKeys: Object.keys(req.body),
      contentType: req.headers['content-type'] || 'not set',
      hasContentType: !!req.headers['content-type'],
      contentTypeIncludesBoundary: req.headers['content-type']?.includes('boundary') || false,
      reqFilesType: typeof req.files,
      reqFilesIsArray: Array.isArray(req.files),
      hasFileIds: 'fileIds' in req.body,
      fileIds: req.body.fileIds,
      companyId: req.companyId
    }, 'HYP_1');
    // #endregion

    // Get form fields (to, cc, subject, body, fileIds, dealerId)
    // For JSON requests, req.body is already parsed by express.json()
    // For FormData requests, multer parses the body fields
    let to, cc, subject, body, fileIds, dealerId;
    
    if (req.headers['content-type']?.includes('application/json')) {
      // JSON request - body already parsed by express.json()
      ({ to, cc, subject, body, fileIds, dealerId } = req.body);
    } else {
      // FormData request - parsed by multer
      ({ to, cc, subject, body, dealerId } = req.body);
      fileIds = undefined; // FormData won't have fileIds
    }
    
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
    debugLog('emailFiles.ts:399', 'Processing attachments - checking source', {
      filesCount: uploadedFiles.length,
      hasFileIds: !!fileIds,
      fileIdsType: typeof fileIds,
      fileIdsIsArray: Array.isArray(fileIds),
      fileIdsCount: Array.isArray(fileIds) ? fileIds.length : 0
    }, 'ATTACH_SOURCE');
    // #endregion

    const attachments = [];
    
    // APPROACH 1: Use fileIds if provided (PREFERRED - backend reads files directly)
    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      console.log(`[Email] ===== PROCESSING FILE IDs =====`);
      console.log(`[Email] File IDs provided: ${fileIds.length}`);
      
      for (const fileId of fileIds) {
        if (!fileId || typeof fileId !== 'string') {
          console.warn(`[Email] Invalid fileId: ${fileId}`);
          continue;
        }
        
        try {
          // #region agent log
          debugLog('emailFiles.ts:415', 'Processing fileId', {
            fileId: fileId,
            companyId: req.companyId
          }, 'FILEID_1');
          // #endregion
          
          // Get file metadata from database
          const file = await prisma.emailFile.findFirst({
            where: {
              id: fileId,
              companyId: req.companyId!
            }
          });

          if (!file) {
            console.error(`[Email] ✗ File not found in database: ${fileId}`);
            // #region agent log
            debugLog('emailFiles.ts:427', 'File not found in database', {
              fileId: fileId
            }, 'FILEID_2');
            // #endregion
            continue;
          }

          // #region agent log
          debugLog('emailFiles.ts:434', 'File found in database', {
            fileId: file.id,
            filename: file.filename,
            originalName: file.originalName,
            hasContent: !!file.content,
            contentSize: file.content ? file.content.length : 0,
            storedPath: file.path
          }, 'FILEID_3');
          // #endregion

          // NEW APPROACH: Read from database content (not disk)
          let fileContent: Buffer;
          
          if (file.content) {
            // Read from database (PREFERRED)
            fileContent = Buffer.from(file.content);
            console.log(`[Email] ✓ Using file content from database: ${file.originalName} (${Math.round(fileContent.length / 1024)} KB)`);
            
            // #region agent log
            debugLog('emailFiles.ts:450', 'File content from database', {
              fileId: file.id,
              originalName: file.originalName,
              fileSize: fileContent.length,
              source: 'database'
            }, 'FILEID_DB');
            // #endregion
          } else if (file.path && typeof file.path === 'string' && fs.existsSync(file.path)) {
            // FALLBACK: Try to read from disk (for old files uploaded before database storage)
            fileContent = fs.readFileSync(file.path);
            console.log(`[Email] ⚠️  Using file content from disk (legacy): ${file.originalName} (${Math.round(fileContent.length / 1024)} KB)`);
            console.log(`[Email] Note: This file was uploaded before database storage. Re-upload to store in database.`);
            
            // #region agent log
            debugLog('emailFiles.ts:462', 'File content from disk (legacy)', {
              fileId: file.id,
              originalName: file.originalName,
              fileSize: fileContent.length,
              path: file.path,
              source: 'disk-fallback'
            }, 'FILEID_DISK');
            // #endregion
          } else {
            console.error(`[Email] ✗ File not found in database or disk: ${file.originalName}`);
            console.error(`[Email] File has no content in database and path doesn't exist: ${file.path}`);
            
            // #region agent log
            debugLog('emailFiles.ts:473', 'File not found anywhere', {
              fileId: file.id,
              originalName: file.originalName,
              hasContent: !!file.content,
              hasPath: !!file.path,
              pathExists: file.path ? fs.existsSync(file.path) : false
            }, 'FILEID_NOTFOUND');
            // #endregion
            continue;
          }

          // Determine content type
          const ext = path.extname(file.originalName).toLowerCase();
          let contentType = file.mimeType;
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

          // Create attachment object
          const attachmentObj = {
            filename: file.originalName,
            content: fileContent,
            contentType: contentType
          };

          attachments.push(attachmentObj);
          console.log(`[Email] ✓ Added attachment from fileId: ${file.originalName} (${Math.round(fileContent.length / 1024)} KB)`);
          
          // #region agent log
          debugLog('emailFiles.ts:501', 'Attachment created from fileId', {
            fileId: file.id,
            filename: attachmentObj.filename,
            contentLength: attachmentObj.content.length,
            contentType: attachmentObj.contentType
          }, 'FILEID_7');
          // #endregion
        } catch (error: any) {
          console.error(`[Email] ✗ Error processing fileId ${fileId}:`, error.message);
          // #region agent log
          debugLog('emailFiles.ts:508', 'Error processing fileId', {
            fileId: fileId,
            error: error.message
          }, 'FILEID_8');
          // #endregion
        }
      }
      
      console.log(`[Email] ===== FILE ID PROCESSING COMPLETE =====`);
      console.log(`[Email] Total attachments from fileIds: ${attachments.length}`);
    }
    
    // APPROACH 2: Process files from FormData (if no fileIds or as fallback)
    if (uploadedFiles.length > 0) {
      console.log(`[Email] ===== PROCESSING FORMDATA FILES =====`);
      console.log(`[Email] Files received in FormData: ${uploadedFiles.length}`);
      
      // #region agent log
      debugLog('emailFiles.ts:522', 'Processing FormData files', {
        filesCount: uploadedFiles.length,
        fileNames: uploadedFiles.map(f => f.originalname),
        fileSizes: uploadedFiles.map(f => f.size)
      }, 'FORMDATA_B');
      // #endregion
    
    for (const uploadedFile of uploadedFiles) {
      console.log(`[Email] Processing file: ${uploadedFile.originalname}`);
      console.log(`[Email]   Size: ${Math.round(uploadedFile.size / 1024)} KB`);
      console.log(`[Email]   MIME type: ${uploadedFile.mimetype}`);
      console.log(`[Email]   Has buffer: ${!!uploadedFile.buffer}`);
      console.log(`[Email]   Buffer size: ${uploadedFile.buffer ? uploadedFile.buffer.length : 0} bytes`);
      
      // #region agent log
      debugLog('emailFiles.ts:330', 'Processing uploaded file', {
        filename: uploadedFile.originalname,
        hasBuffer: !!uploadedFile.buffer,
        bufferLength: uploadedFile.buffer ? uploadedFile.buffer.length : 0,
        bufferIsBuffer: uploadedFile.buffer ? Buffer.isBuffer(uploadedFile.buffer) : false,
        size: uploadedFile.size
      }, 'HYP_A');
      // #endregion
      
      try {
        // CRITICAL FIX: Use buffer directly from multer memoryStorage (more reliable)
        // With memoryStorage, multer provides the buffer directly in req.file.buffer
        let fileContent: Buffer;
        
        if (uploadedFile.buffer && Buffer.isBuffer(uploadedFile.buffer)) {
          // Use buffer directly from multer (memoryStorage)
          fileContent = uploadedFile.buffer;
          console.log(`[Email]   ✓ Using buffer directly from multer (${fileContent.length} bytes)`);
        } else if (uploadedFile.path && fs.existsSync(uploadedFile.path)) {
          // Fallback: Read from disk if buffer not available (shouldn't happen with memoryStorage)
          fileContent = fs.readFileSync(uploadedFile.path);
          console.log(`[Email]   ✓ File read from disk (${fileContent.length} bytes) - fallback path`);
        } else {
          console.error(`[Email] ✗ No buffer or valid path available for file: ${uploadedFile.originalname}`);
          console.error(`[Email] Has buffer: ${!!uploadedFile.buffer}, Has path: ${!!uploadedFile.path}`);
          // #region agent log
          debugLog('emailFiles.ts:338', 'File buffer/path not available', {
            filename: uploadedFile.originalname,
            hasBuffer: !!uploadedFile.buffer,
            hasPath: !!uploadedFile.path,
            pathExists: uploadedFile.path ? fs.existsSync(uploadedFile.path) : false
          }, 'HYP_B');
          // #endregion
          continue;
        }
        
        // CRITICAL FIX: Ensure we have a valid Buffer
        if (!Buffer.isBuffer(fileContent) || fileContent.length === 0) {
          console.error(`[Email] ✗ Invalid file content - not a Buffer or empty`);
          console.error(`[Email] Content type: ${typeof fileContent}, Length: ${fileContent.length}`);
          continue;
        }
        
        // #region agent log
        debugLog('emailFiles.ts:348', 'File buffer ready', {
          filename: uploadedFile.originalname,
          contentLength: fileContent.length,
          contentIsBuffer: Buffer.isBuffer(fileContent),
          bufferType: typeof fileContent,
          bufferSource: uploadedFile.buffer ? 'multer-buffer' : 'disk-read'
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
        // Create a fresh Buffer copy to ensure nodemailer gets a clean reference
        const attachmentObj = {
          filename: uploadedFile.originalname,
          content: Buffer.from(fileContent), // Fresh Buffer copy for nodemailer
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
    }

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
    
    // Save email history to dealer change history if dealerId provided
    if (dealerId) {
      try {
        const attachmentNames = attachments.map(a => a.filename).join(', ');
        const historyValue = attachments.length > 0 
          ? `Email sent: "${subject}" with ${attachments.length} attachment(s): ${attachmentNames}`
          : `Email sent: "${subject}"`;
        
        await prisma.dealerChangeHistory.create({
          data: {
            dealerId,
            fieldName: 'email_sent',
            oldValue: null,
            newValue: historyValue,
            changeType: 'updated'
          }
        });
        console.log(`[Email] Saved email history for dealer ${dealerId}`);
      } catch (historyError) {
        console.error('[Email] Failed to save email history:', historyError);
        // Don't fail the email send if history save fails
      }
    }
    
    // No cleanup needed with memoryStorage - files are in memory only, not on disk
    
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


