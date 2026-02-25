import nodemailer from 'nodemailer'
import ejs from 'ejs'
import { getTemplatePath } from '../utils/paths.js'
import { SMTP_DEFAULTS } from './constants.js'
import logger from '../utils/logger.js'

class EmailConfig {
  constructor() {
    this.transporter = null
  }

  initialize() {
    if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        host: SMTP_DEFAULTS.MAILDEV_HOST,
        port: SMTP_DEFAULTS.MAILDEV_PORT,
        secure: false,
        auth: null,
      })
      logger.debug('Email service configured for MailDev (development)')
      return
    }

    // Production: Use port 465 with SSL (works better on cloud platforms like Render)
    const smtpHost = SMTP_DEFAULTS.HOST
    const smtpPort = SMTP_DEFAULTS.PORT
    const smtpSecure = process.env.SMTP_SECURE === 'false' ? false : (smtpPort === 465)
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('SMTP credentials not configured. Email service disabled.')
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
    logger.info('Email service configured', { host: smtpHost, port: smtpPort, secure: smtpSecure })
  }

  async renderTemplate(templateName, data = {}) {
    try {
      const templatePath = getTemplatePath(templateName)
      return await ejs.renderFile(templatePath, data)
    } catch (error) {
      logger.error(`Error rendering template`, { template: templateName, error: error.message })
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
        from: SMTP_DEFAULTS.FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      }

      const info = await this.transporter.sendMail(mailOptions)
      logger.info('Email sent', { to, messageId: info.messageId })
      return info
    } catch (error) {
      logger.error('Error sending email', { to, error: error.message })
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
