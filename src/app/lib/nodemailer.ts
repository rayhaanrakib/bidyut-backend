import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import config from '@app/config';


export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});


export async function sendEmail(to: string, subject: string, template: string, data: Record<string, unknown>) {
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn(`SMTP not configured — skipped email "${subject}" to ${to}`);
    return;
  }
  const file = path.join(process.cwd(), 'src', 'app', 'templates', `${template}.ejs`);
  const html = await ejs.renderFile(file, data);
  await transporter.sendMail({ from: `"BIDYUT" <${config.smtp.sender}>`, to, subject, html });
}