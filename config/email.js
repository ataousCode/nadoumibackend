import nodemailer from "nodemailer";
import ejs from "ejs";
import { getTemplatePath } from "../utils/paths.js";
import { SMTP_DEFAULTS } from "./constants.js";
import logger from "../utils/logger.js";

class EmailConfig {
  constructor() {
    this.transporter = null;
  }

  initialize() {
    const isDev = process.env.NODE_ENV === "development";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Use MailDev ONLY if in dev AND no SMTP credentials provided
    if (isDev && !smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_DEFAULTS.MAILDEV_HOST,
        port: SMTP_DEFAULTS.MAILDEV_PORT,
        secure: false,
        auth: null,
      });
      logger.debug("Email service configured for MailDev (development mode)");
      return;
    }

    // Gmail / Aliyun / Standard SMTP
    const smtpHost = process.env.SMTP_HOST || SMTP_DEFAULTS.HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT) || SMTP_DEFAULTS.PORT;
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    if (!smtpUser || !smtpPass) {
      logger.warn("Email service disabled: Missing SMTP_USER or SMTP_PASS");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15000,
      tls: {
        rejectUnauthorized: smtpHost !== 'localhost'
      },
    });

    logger.info("Email service initialized", {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser
    });
  }

  async renderTemplate(templateName, data = {}) {
    try {
      const templatePath = getTemplatePath(templateName);
      return await ejs.renderFile(templatePath, data);
    } catch (error) {
      logger.error(`Error rendering template`, {
        template: templateName,
        error: error.message,
      });
      throw new Error(`Failed to render email template: ${templateName}`);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      this.initialize();
    }

    if (!this.transporter) {
      throw new Error("Email service not configured");
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || SMTP_DEFAULTS.FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent", { to, messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error("Error sending email", { to, error: error.message });
      if (error.code === "ETIMEDOUT") {
        throw new Error(
          "Email service timeout. Please check SMTP port configuration.",
        );
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async verify() {
    if (!this.transporter) {
      this.initialize();
    }
    return this.transporter.verify();
  }
}

export default new EmailConfig();
