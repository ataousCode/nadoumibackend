import nodemailer from 'nodemailer'
import ejs from 'ejs'
import { getTemplatePath } from '../utils/paths.js'

class EmailConfig {
  constructor() {
    this.transporter = null
  }

  initialize() {
    const useGmail = process.env.SMTP_USER && process.env.SMTP_PASS
    
    if (useGmail) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      console.log('Email service configured for Gmail SMTP')
    } else if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAILDEV_HOST || 'localhost',
        port: parseInt(process.env.MAILDEV_PORT || '1025'),
        secure: false,
        auth: null,
      })
      console.log('Email service configured for MailDev (development)')
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      console.log('Email service configured for SMTP')
    }
  }

  async renderTemplate(templateName, data = {}) {
    try {
      const templatePath = getTemplatePath(templateName)
      return await ejs.renderFile(templatePath, data)
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error)
      throw new Error(`Failed to render email template: ${templateName}`)
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      this.initialize()
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'Nadoumi <noreply@nadoumi.com>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`Email sent to ${to}:`, info.messageId)
      return info
    } catch (error) {
      console.error('Error sending email:', error)
      throw new Error('Failed to send email')
    }
  }

  async verify() {
    if (!this.transporter) {
      this.initialize()
    }
    return this.transporter.verify()
  }
}

export default new EmailConfig()
