import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Email service configuration
 * Uses MailDev in development and SMTP in production
 */
class EmailConfig {
  constructor() {
    this.transporter = null
    this.templatesPath = path.join(__dirname, '../templates/email')
  }

  initialize() {
    // Use Gmail SMTP if credentials are provided, otherwise use MailDev for development
    const useGmail = process.env.SMTP_USER && process.env.SMTP_PASS
    
    if (useGmail) {
      // Gmail SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || false, // false for 587, true for 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      console.log('📧 Email service configured for Gmail SMTP')
    } else if (process.env.NODE_ENV === 'development') {
      // MailDev configuration for development (if no Gmail credentials)
      this.transporter = nodemailer.createTransport({
        host: process.env.MAILDEV_HOST || 'localhost',
        port: parseInt(process.env.MAILDEV_PORT || '1025'),
        secure: false,
        auth: null,
      })
      console.log('📧 Email service configured for MailDev (development)')
    } else {
      // Fallback SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      console.log('📧 Email service configured for SMTP')
    }
  }

  /**
   * Render email template with EJS
   */
  async renderTemplate(templateName, data = {}) {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.ejs`)
      return await ejs.renderFile(templatePath, data)
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error)
      throw new Error(`Failed to render email template: ${templateName}`)
    }
  }

  /**
   * Send email
   */
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
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log(`📧 Email sent to ${to}:`, info.messageId)
      return info
    } catch (error) {
      console.error('Error sending email:', error)
      throw new Error('Failed to send email')
    }
  }

  /**
   * Verify email connection
   */
  async verify() {
    if (!this.transporter) {
      this.initialize()
    }
    return this.transporter.verify()
  }
}

export default new EmailConfig()

