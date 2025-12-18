import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

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

type SendEmailParams = {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;  // Legacy: path to file on disk
    content?: Buffer;  // NEW: file content as Buffer (from FormData)
    contentType?: string;  // MIME type
  }>;
};

let cachedTransporter: nodemailer.Transporter | null | undefined;

function createTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.SMTP_FROM
  ) {
    console.warn('[Email] SMTP environment variables are not fully set; email sending disabled.');
    return null;
  }

  const port = Number(process.env.SMTP_PORT);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // use TLS when on 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function getTransporter() {
  if (cachedTransporter === undefined) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

export async function sendEmail({ to, cc, subject, text, html, attachments }: SendEmailParams) {
  // #region agent log
  debugLog('email.ts:51', 'sendEmail function entry', {attachmentsParam:attachments,attachmentsCount:attachments?.length||0,attachmentsIsArray:Array.isArray(attachments),attachmentsType:typeof attachments}, 'G');
  // #endregion
  
  const transporter = getTransporter();
  if (!transporter) {
    // Email not configured; fail silently to avoid blocking primary flow
    console.warn(`[Email] Transporter not available - email sending disabled`);
    return { accepted: false, disabled: true };
  }

  // Log incoming attachments parameter
  console.log(`[Email] ===== sendEmail FUNCTION CALLED =====`);
  console.log(`[Email] sendEmail called with:`, {
    to,
    cc,
    subject,
    textLength: text?.length || 0,
    htmlLength: html?.length || 0,
    attachmentsParam: attachments,
    attachmentsCount: attachments?.length || 0,
    attachmentsIsArray: Array.isArray(attachments),
    attachmentsType: typeof attachments,
    attachmentsIsUndefined: attachments === undefined,
    attachmentsIsNull: attachments === null
  });
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    console.log(`[Email] Attachments received:`, attachments.map(a => ({ filename: a.filename, path: a.path })));
  } else {
    console.log(`[Email] No attachments received (attachments is ${attachments === undefined ? 'undefined' : attachments === null ? 'null' : 'empty or invalid'})`);
  }

  // Prepare attachments - handle both FormData (content as Buffer) and legacy (path) formats
  const emailAttachments = [];
  if (attachments && attachments.length > 0) {
    console.log(`[Email] Processing ${attachments.length} attachment(s)...`);
    for (const att of attachments) {
      console.log(`[Email] Processing attachment:`, {
        filename: att.filename,
        hasContent: !!att.content,
        hasPath: !!att.path,
        contentType: att.contentType || 'not set'
      });
      
      try {
        let fileContent: Buffer;
        let contentType: string | undefined = att.contentType;
        
        // NEW: If attachment already has content (from FormData), use it directly
        if (att.content && Buffer.isBuffer(att.content)) {
          fileContent = att.content;
          console.log(`[Email] Using file content from FormData: ${att.filename} (${Math.round(fileContent.length / 1024)} KB)`);
          
          // Content type should already be set, but verify
          if (!contentType) {
            const ext = path.extname(att.filename).toLowerCase();
            const mimeTypes: { [key: string]: string } = {
              '.pdf': 'application/pdf',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif'
            };
            contentType = mimeTypes[ext];
          }
        }
        // LEGACY: If attachment has path, read from disk
        else if (att.path) {
          const absolutePath = path.isAbsolute(att.path) ? att.path : path.resolve(att.path);
          console.log(`[Email] Reading file from path: ${absolutePath}`);
          
          if (fs.existsSync(absolutePath)) {
            const stats = fs.statSync(absolutePath);
            fileContent = fs.readFileSync(absolutePath);
            console.log(`[Email] Successfully read file: ${att.filename} (${Math.round(stats.size / 1024)} KB) from ${absolutePath}`);
            
            // Determine content type from filename extension
            const ext = path.extname(att.filename).toLowerCase();
            const mimeTypes: { [key: string]: string } = {
              '.pdf': 'application/pdf',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.doc': 'application/msword',
              '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              '.xls': 'application/vnd.ms-excel',
              '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              '.txt': 'text/plain'
            };
            contentType = mimeTypes[ext] || contentType;
          } else {
            console.warn(`[Email] Attachment file not found: ${absolutePath}`);
            continue;
          }
        } else {
          console.error(`[Email] ✗ Invalid attachment - missing both content and path`);
          continue;
        }
        
        // Create attachment object with content as Buffer
        const attachmentObj: any = {
          filename: att.filename,
          content: fileContent,
          contentDisposition: 'attachment' // Explicitly set as attachment
        };
        
        // Add content type if we determined it
        if (contentType) {
          attachmentObj.contentType = contentType;
          console.log(`[Email] Content type: ${contentType} for ${att.filename}`);
        }
        
        // Validate attachment object before adding
        if (!attachmentObj.filename || !attachmentObj.content) {
          console.error(`[Email] ✗ Invalid attachment object - missing filename or content`);
          continue;
        }
        
        emailAttachments.push(attachmentObj);
        console.log(`[Email] ✓ Added attachment: ${att.filename} (${Math.round(fileContent.length / 1024)} KB)`);
        console.log(`[Email]   Total attachments in array: ${emailAttachments.length}`);
      } catch (error: any) {
        console.error(`[Email] Error processing attachment ${att.filename}:`, error.message);
        console.error(`[Email] Error stack:`, error.stack);
      }
    }
  } else {
    console.log(`[Email] No attachments provided or attachments array is empty`);
  }

  console.log(`[Email] ===== ATTACHMENT PROCESSING COMPLETE =====`);
  console.log(`[Email] Final emailAttachments array has ${emailAttachments.length} item(s)`);
  if (emailAttachments.length > 0) {
    console.log(`[Email] ✓ Successfully processed attachments:`, emailAttachments.map(a => a.filename));
  } else if (attachments && attachments.length > 0) {
    console.error(`[Email] ✗ ERROR: ${attachments.length} attachment(s) were provided but 0 were successfully processed!`);
    console.error(`[Email] This means files were provided but couldn't be read from disk`);
  }
  console.log(`[Email] Sending email to ${to} with ${emailAttachments.length} attachment(s)`);

  // #region agent log
  debugLog('email.ts:108', 'Before creating mailOptions', {emailAttachmentsCount:emailAttachments.length,emailAttachments:emailAttachments.map(a=>({filename:a.filename,hasContent:!!a.content,contentLength:a.content?a.content.length:0}))}, 'G');
  // #endregion

  // CRITICAL FIX: Always pass attachments array (even if empty) - never undefined
  // Nodemailer expects an array, not undefined
  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM!,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
    subject,
    text,
    html,
    // Always pass array - nodemailer handles empty arrays correctly
    attachments: emailAttachments.length > 0 ? emailAttachments : []
  };
  
  // #region agent log
  debugLog('email.ts:119', 'mailOptions created', {attachmentsInMailOptions:mailOptions.attachments?.length||0,willSendAttachments:!!mailOptions.attachments,attachmentsDetails:mailOptions.attachments?.map((a:any)=>({filename:a.filename,hasContent:!!a.content}))}, 'G');
  // #endregion
  
  // CRITICAL: Validate mailOptions.attachments before sending
  console.log(`[Email] ===== FINAL MAIL OPTIONS VALIDATION =====`);
  console.log(`[Email] Mail options prepared:`, {
    from: mailOptions.from,
    to: mailOptions.to,
    cc: mailOptions.cc,
    subject: mailOptions.subject,
    hasText: !!mailOptions.text,
    hasHtml: !!mailOptions.html,
    attachmentsIsArray: Array.isArray(mailOptions.attachments),
    attachmentsIsUndefined: mailOptions.attachments === undefined,
    attachmentsIsNull: mailOptions.attachments === null,
    attachmentsCount: Array.isArray(mailOptions.attachments) ? mailOptions.attachments.length : 'NOT AN ARRAY',
    attachments: Array.isArray(mailOptions.attachments) ? mailOptions.attachments.map((a: any) => ({
      filename: a.filename,
      hasContent: !!a.content,
      contentLength: a.content ? a.content.length : 0,
      contentType: a.contentType || 'not set',
      contentDisposition: a.contentDisposition || 'not set'
    })) : `INVALID: ${typeof mailOptions.attachments}`
  });
  console.log(`[Email] ==========================================`);
  
  // Final validation - ensure attachments is an array
  if (!Array.isArray(mailOptions.attachments)) {
    console.error(`[Email] ✗ CRITICAL ERROR: mailOptions.attachments is not an array!`);
    console.error(`[Email] Type: ${typeof mailOptions.attachments}, Value:`, mailOptions.attachments);
    // Force it to be an array
    mailOptions.attachments = emailAttachments.length > 0 ? emailAttachments : [];
    console.log(`[Email] Fixed: Set attachments to array with ${mailOptions.attachments.length} items`);
  }

  // FINAL CHECK: Verify attachments are in mailOptions before sending
  console.log(`[Email] ===== PRE-SEND FINAL CHECK =====`);
  console.log(`[Email] About to call transporter.sendMail()`);
  console.log(`[Email] mailOptions.attachments type:`, typeof mailOptions.attachments);
  console.log(`[Email] mailOptions.attachments is array:`, Array.isArray(mailOptions.attachments));
  console.log(`[Email] mailOptions.attachments length:`, Array.isArray(mailOptions.attachments) ? mailOptions.attachments.length : 'N/A');
  if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
    console.log(`[Email] ✓ Attachments in mailOptions:`, mailOptions.attachments.map((a: any) => ({
      filename: a.filename,
      hasContent: !!a.content,
      contentLength: a.content ? a.content.length : 0,
      contentType: a.contentType || 'not set',
      contentDisposition: a.contentDisposition || 'not set'
    })));
  } else {
    console.error(`[Email] ✗ NO ATTACHMENTS IN mailOptions!`);
    console.error(`[Email] emailAttachments array had ${emailAttachments.length} items`);
    console.error(`[Email] mailOptions.attachments:`, mailOptions.attachments);
  }
  console.log(`[Email] =================================`);
  
  const info = await transporter.sendMail(mailOptions);
  
  // #region agent log
  debugLog('email.ts:130', 'nodemailer sendMail completed', {messageId:info.messageId,accepted:info.accepted,rejected:info.rejected,emailAttachmentsCount:emailAttachments.length}, 'G');
  // #endregion
  
  console.log(`[Email] ===== EMAIL SEND COMPLETE =====`);
  console.log(`[Email] Email sent successfully. Message ID: ${info.messageId}`);
  console.log(`[Email] Attachments processed: ${emailAttachments.length}`);
  console.log(`[Email] Attachments in mailOptions: ${Array.isArray(mailOptions.attachments) ? mailOptions.attachments.length : 'NOT AN ARRAY'}`);
  if (emailAttachments.length > 0) {
    console.log(`[Email] ✓ Attached files:`, emailAttachments.map(a => a.filename));
  } else {
    console.error(`[Email] ✗ WARNING: No attachments were processed!`);
  }
  console.log(`[Email] ================================`);

  return info;
}

