import nodemailer from 'nodemailer';

type SendEmailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
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

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const transporter = getTransporter();
  if (!transporter) {
    // Email not configured; fail silently to avoid blocking primary flow
    return { accepted: false, disabled: true };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject,
    text,
    html
  });

  return info;
}

