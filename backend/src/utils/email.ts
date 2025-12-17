import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

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
  const transporter = getTransporter();
  if (!transporter) {
    // Email not configured; fail silently to avoid blocking primary flow
    return { accepted: false, disabled: true };
  }

  // Prepare attachments - read file content as buffers for reliability in production
  const emailAttachments = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      const absolutePath = path.isAbsolute(att.path) ? att.path : path.resolve(att.path);
      try {
        if (fs.existsSync(absolutePath)) {
          const stats = fs.statSync(absolutePath);
          const fileContent = fs.readFileSync(absolutePath);
          console.log(`[Email] Attaching file: ${att.filename} (${Math.round(stats.size / 1024)} KB) from ${absolutePath}`);
          
          // Use content instead of path for better reliability in production
          emailAttachments.push({
            filename: att.filename,
            content: fileContent
          });
        } else {
          console.warn(`[Email] Attachment file not found: ${absolutePath} (original path: ${att.path})`);
        }
      } catch (error: any) {
        console.error(`[Email] Error reading attachment file ${att.filename} from ${absolutePath}:`, error.message);
      }
    }
  }

  console.log(`[Email] Sending email to ${to} with ${emailAttachments.length} attachment(s)`);

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM!,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
    subject,
    text,
    html,
    attachments: emailAttachments.length > 0 ? emailAttachments : undefined
  };

  const info = await transporter.sendMail(mailOptions);
  
  console.log(`[Email] Email sent successfully. Message ID: ${info.messageId}, Attachments: ${emailAttachments.length}`);

  return info;
}

