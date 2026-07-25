// src/core/utils/mailer.ts
//
// Central email delivery — every feature that needs to send an email
// (admin OTP today, notifications/alerts later) goes through this one
// Gmail SMTP transporter instead of each spinning up its own. This file
// only knows how to deliver; subject/HTML content stays with the caller.

import nodemailer from 'nodemailer';
import { env } from '@/config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.gmailUser,
        pass: env.gmailAppPassword,
      },
    });
  }
  return transporter;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  await getTransporter().sendMail({
    from: `"TimesAuto Admin" <${env.gmailUser}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
