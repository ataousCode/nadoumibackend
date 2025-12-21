import emailConfig from '../config/email.js'
import otpService from './otp.service.js'
import studentRepository from '../repositories/student.repository.js'
import { NotFoundError, AppError } from '../utils/errors.js'

/**
 * Email Service
 * Handles all email-related operations
 */
class EmailService {
  /**
   * Send OTP email for email verification
   */
  async sendVerificationOTP(email, otp) {
    try {
      const html = await emailConfig.renderTemplate('verify-email', {
        otp,
        email,
      })

      await emailConfig.sendEmail({
        to: email,
        subject: 'Verify Your Email Address - Nadoumi',
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending verification OTP:', error)
      throw new AppError('Failed to send verification email', 500)
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`

      const html = await emailConfig.renderTemplate('reset-password', {
        resetUrl,
        email,
      })

      await emailConfig.sendEmail({
        to: email,
        subject: 'Reset Your Password - Nadoumi',
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw new AppError('Failed to send password reset email', 500)
    }
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(email, firstName) {
    try {
      const html = await emailConfig.renderTemplate('welcome', {
        firstName,
        email,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      })

      await emailConfig.sendEmail({
        to: email,
        subject: 'Welcome to Nadoumi!',
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending welcome email:', error)
      // Don't throw error for welcome email - it's not critical
    }
  }

  /**
   * Send interview notification email to student
   */
  async sendInterviewNotification(email, firstName, interviewData) {
    try {
      const html = await emailConfig.renderTemplate('interview-notification', {
        firstName,
        email,
        applicationId: interviewData.applicationId,
        scholarshipTitle: interviewData.scholarshipTitle,
        interviewDate: interviewData.interviewDate,
        interviewTime: interviewData.interviewTime,
        videoCallPlatform: interviewData.videoCallPlatform,
        videoCallLink: interviewData.videoCallLink,
        notes: interviewData.notes,
        adminNote: interviewData.adminNote,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      })

      await emailConfig.sendEmail({
        to: email,
        subject: `Interview Scheduled - Application ${interviewData.applicationId} - Nadoumi`,
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending interview notification email:', error)
      throw new AppError('Failed to send interview notification email', 500)
    }
  }

  /**
   * Send interview passed notification email to student
   */
  async sendInterviewPassedNotification(email, firstName, data) {
    try {
      const html = await emailConfig.renderTemplate('interview-passed', {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        adminNote: data.adminNote,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      })

      await emailConfig.sendEmail({
        to: email,
        subject: `Interview Completed - Application ${data.applicationId} - Nadoumi`,
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending interview passed notification email:', error)
      throw new AppError('Failed to send interview passed notification email', 500)
    }
  }

  /**
   * Send interview failed notification email to student
   */
  async sendInterviewFailedNotification(email, firstName, data) {
    try {
      const html = await emailConfig.renderTemplate('interview-failed', {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        failureReason: data.failureReason,
        adminNote: data.adminNote,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      })

      await emailConfig.sendEmail({
        to: email,
        subject: `Application Update - Application ${data.applicationId} - Nadoumi`,
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending interview failed notification email:', error)
      throw new AppError('Failed to send interview failed notification email', 500)
    }
  }

  /**
   * Send revoked notification email to student
   */
  async sendRevokedNotification(email, firstName, data) {
    try {
      const html = await emailConfig.renderTemplate('application-revoked', {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        revocationReason: data.revocationReason,
        revocationDetails: data.revocationDetails,
        adminNote: data.adminNote,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      })

      await emailConfig.sendEmail({
        to: email,
        subject: `Application Revoked - Action Required - Application ${data.applicationId} - Nadoumi`,
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending revoked notification email:', error)
      throw new AppError('Failed to send revoked notification email', 500)
    }
  }

  /**
   * Send document uploaded notification email to student
   */
  async sendDocumentUploadedNotification(email, firstName, data) {
    try {
      const html = await emailConfig.renderTemplate('document-uploaded', {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        documentType: data.documentType,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      })

      await emailConfig.sendEmail({
        to: email,
        subject: `${data.documentType} Available - Application ${data.applicationId} - Nadoumi`,
        html,
      })

      return true
    } catch (error) {
      console.error('Error sending document uploaded notification email:', error)
      throw new AppError('Failed to send document uploaded notification email', 500)
    }
  }

  /**
   * Send new application notification email to admin
   */
  async sendNewApplicationNotificationToAdmin(applicationData) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'almouslecka@gmail.com'
      const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/applications/${applicationData.applicationId || applicationData.id || applicationData._id}`
      
      const html = await emailConfig.renderTemplate('new-application-admin', {
        applicationId: applicationData.applicationId || applicationData.id || applicationData._id,
        studentName: applicationData.studentName || `${applicationData.student?.firstName || ''} ${applicationData.student?.lastName || ''}`.trim() || 'N/A',
        studentEmail: applicationData.studentEmail || applicationData.student?.email || 'N/A',
        studentPhone: applicationData.studentPhone || applicationData.student?.phone || null,
        studentNationality: applicationData.studentNationality || applicationData.student?.nationality || null,
        scholarshipTitle: applicationData.scholarshipTitle || applicationData.scholarship?.title || 'N/A',
        universityName: applicationData.universityName || applicationData.scholarship?.university?.name || applicationData.scholarship?.university || null,
        submittedAt: applicationData.submittedAt ? new Date(applicationData.submittedAt).toLocaleString() : new Date().toLocaleString(),
        adminUrl: adminUrl,
      })

      await emailConfig.sendEmail({
        to: adminEmail,
        subject: `New Application Received - ${applicationData.applicationId || applicationData.id || 'N/A'} - Nadoumi`,
        html,
      })

      console.log(`📧 Admin notification sent to ${adminEmail} for application ${applicationData.applicationId || applicationData.id}`)
      return true
    } catch (error) {
      console.error('Error sending admin notification email:', error)
      // Don't throw error - admin notification failure shouldn't block application submission
      return false
    }
  }
}

export default new EmailService()

