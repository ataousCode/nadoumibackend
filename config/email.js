import nodemailer from 'nodemailer'
import ejs from 'ejs'
import { getTemplatePath } from '../utils/paths.js'

class EmailConfig {
  constructor() {
    this.transporter = null
  }

  initialize() {
    if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAILDEV_HOST || 'localhost',
        port: parseInt(process.env.MAILDEV_PORT || '1025'),
        secure: false,
        auth: null,
      })
      console.log('Email service configured for MailDev (development)')
      return
    }

    // Production: Use port 465 with SSL (works better on cloud platforms like Render)
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '465')
    const smtpSecure = process.env.SMTP_SECURE === 'false' ? false : (smtpPort === 465)
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  SMTP credentials not configured. Email service disabled.')
      return
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    })
    console.log(`📧 Email service configured: ${smtpHost}:${smtpPort} (secure: ${smtpSecure})`)
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

    if (!this.transporter) {
      throw new Error('Email service not configured')
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
      console.log(`✅ Email sent to ${to}:`, info.messageId)
      return info
    } catch (error) {
      console.error('❌ Error sending email:', error.message)
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Email service timeout. Please check SMTP port configuration.')
      }
      throw new Error(`Failed to send email: ${error.message}`)
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
