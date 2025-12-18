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
    path: string;
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

  // Prepare attachments - read file content as buffers for reliability in production
  const emailAttachments = [];
  if (attachments && attachments.length > 0) {
    console.log(`[Email] Processing ${attachments.length} attachment(s)...`);
    for (const att of attachments) {
      const absolutePath = path.isAbsolute(att.path) ? att.path : path.resolve(att.path);
      console.log(`[Email] Processing attachment:`, {
        filename: att.filename,
        originalPath: att.path,
        absolutePath: absolutePath,
        pathExists: fs.existsSync(absolutePath)
      });
      
      try {
        if (fs.existsSync(absolutePath)) {
          const stats = fs.statSync(absolutePath);
          const fileContent = fs.readFileSync(absolutePath);
          console.log(`[Email] Successfully read file: ${att.filename} (${Math.round(stats.size / 1024)} KB) from ${absolutePath}`);
          
          // Determine content type from filename extension
          const ext = path.extname(att.filename).toLowerCase();
          let contentType: string | undefined;
          
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
          
          contentType = mimeTypes[ext];
          
          // Use content instead of path for better reliability in production
          const attachmentObj: any = {
            filename: att.filename,
            content: fileContent
          };
          
          // Add content type if we determined it
          if (contentType) {
            attachmentObj.contentType = contentType;
            console.log(`[Email] Detected content type: ${contentType} for ${att.filename}`);
          }
          
          emailAttachments.push(attachmentObj);
          console.log(`[Email] Added attachment to emailAttachments array. Total: ${emailAttachments.length}`);
        } else {
          console.warn(`[Email] Attachment file not found: ${absolutePath} (original path: ${att.path})`);
        }
      } catch (error: any) {
        console.error(`[Email] Error reading attachment file ${att.filename} from ${absolutePath}:`, error.message);
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

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM!,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
    subject,
    text,
    html,
    attachments: emailAttachments.length > 0 ? emailAttachments : undefined
  };
  
  // #region agent log
  debugLog('email.ts:119', 'mailOptions created', {attachmentsInMailOptions:mailOptions.attachments?.length||0,willSendAttachments:!!mailOptions.attachments,attachmentsDetails:mailOptions.attachments?.map((a:any)=>({filename:a.filename,hasContent:!!a.content}))}, 'G');
  // #endregion

  console.log(`[Email] Mail options prepared:`, {
    from: mailOptions.from,
    to: mailOptions.to,
    cc: mailOptions.cc,
    subject: mailOptions.subject,
    hasText: !!mailOptions.text,
    hasHtml: !!mailOptions.html,
    attachmentsCount: mailOptions.attachments?.length || 0,
    attachments: mailOptions.attachments ? mailOptions.attachments.map((a: any) => ({
      filename: a.filename,
      hasContent: !!a.content,
      contentLength: a.content ? a.content.length : 0
    })) : undefined
  });

  const info = await transporter.sendMail(mailOptions);
  
  // #region agent log
  debugLog('email.ts:130', 'nodemailer sendMail completed', {messageId:info.messageId,accepted:info.accepted,rejected:info.rejected,emailAttachmentsCount:emailAttachments.length}, 'G');
  // #endregion
  
  console.log(`[Email] Email sent successfully. Message ID: ${info.messageId}, Attachments: ${emailAttachments.length}`);
  if (emailAttachments.length > 0) {
    console.log(`[Email] Attached files:`, emailAttachments.map(a => a.filename));
  }

  return info;
}

