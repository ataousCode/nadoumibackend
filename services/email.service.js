import emailConfig from '../config/email.js'
import { FRONTEND_URL } from '../config/constants.js'
import notificationRepository from '../repositories/notification.repository.js'
import queueService from './queue.service.js'
import logger from '../utils/logger.js'

class EmailService {
  // Internal method to actually send the email (called by Worker)
  async _performSend(recipient, subject, template, content) {
    const html = await emailConfig.renderTemplate(template, content)
    return await emailConfig.sendEmail({
      to: recipient,
      subject,
      html,
    })
  }

  // Base method to audit and queue a notification
  async _queueNotification(type, recipient, subject, template, content) {
    try {
      const notification = await notificationRepository.create({
        type,
        recipient,
        subject,
        template,
        content,
        status: 'pending'
      })

      // Fire and forget: don't await the background job addition.
      // This ensures the main request (like register/login) is NOT blocked by Redis latency.
      queueService
        .addNotificationJob({
          notificationId: notification.id,
          type,
          recipient,
          subject,
          template,
          content,
        })
        .catch(async (err) => {
          logger.error("Background queue addition failed, attempting DIRECT send as fallback:", {
            error: err.message,
            notificationId: notification.id,
          });
          
          // Emergency DIRECT send if Redis queue is failing
          try {
            await this._performSend(recipient, subject, template, content);
            await notificationRepository.update(notificationId, {
              status: 'sent',
              sentAt: new Date()
            });
            logger.info("Direct fallback send SUCCESS", { notificationId: notification.id });
          } catch (sendErr) {
            logger.error("Direct fallback send FAILED", { error: sendErr.message, notificationId: notification.id });
          }
        });

      return notification
    } catch (error) {
      logger.error('Error queuing notification', { error: error.message, recipient, template })
      return null
    }
  }

  async sendVerificationOTP(email, otp) {
    return this._queueNotification(
      'email',
      email,
      'Verify Your Email Address - Nadoumi',
      'verify-email',
      { otp, email }
    )
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`
    return this._queueNotification(
      'email',
      email,
      'Reset Your Password - Nadoumi',
      'reset-password',
      { resetUrl, email }
    )
  }

  async sendWelcomeEmail(email, firstName) {
    return this._queueNotification(
      'email',
      email,
      'Welcome to Nadoumi!',
      'welcome',
      { firstName, email, frontendUrl: FRONTEND_URL }
    )
  }

  async sendInterviewNotification(email, firstName, interviewData) {
    return this._queueNotification(
      'email',
      email,
      `Interview Scheduled - Application ${interviewData.applicationId} - Nadoumi`,
      'interview-notification',
      {
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
        frontendUrl: FRONTEND_URL,
      }
    )
  }

  async sendInterviewPassedNotification(email, firstName, data) {
    return this._queueNotification(
      'email',
      email,
      `Interview Completed - Application ${data.applicationId} - Nadoumi`,
      'interview-passed',
      {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        adminNote: data.adminNote,
        frontendUrl: FRONTEND_URL,
      }
    )
  }

  async sendInterviewFailedNotification(email, firstName, data) {
    return this._queueNotification(
      'email',
      email,
      `Application Update - Application ${data.applicationId} - Nadoumi`,
      'interview-failed',
      {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        failureReason: data.failureReason,
        adminNote: data.adminNote,
        frontendUrl: FRONTEND_URL,
      }
    )
  }

  async sendRevokedNotification(email, firstName, data) {
    return this._queueNotification(
      'email',
      email,
      `Application Revoked - Action Required - Application ${data.applicationId} - Nadoumi`,
      'application-revoked',
      {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        revocationReason: data.revocationReason,
        revocationDetails: data.revocationDetails,
        adminNote: data.adminNote,
        frontendUrl: FRONTEND_URL,
      }
    )
  }

  async sendDocumentUploadedNotification(email, firstName, data) {
    return this._queueNotification(
      'email',
      email,
      `${data.documentType} Available - Application ${data.applicationId} - Nadoumi`,
      'document-uploaded',
      {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        documentType: data.documentType,
        frontendUrl: FRONTEND_URL,
      }
    )
  }

  async sendAdmissionNotification(email, firstName, data) {
    return this._queueNotification(
      'email',
      email,
      `Congratulations! Admission Result for Application ${data.applicationId} - Nadoumi`,
      'admission-result',
      {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        adminNote: data.adminNote,
        frontendUrl: FRONTEND_URL,
      }
    )
  }

  async sendApplicationReviewNotification(email, firstName, data) {
    return this._queueNotification(
      'email',
      email,
      `Application Update - Application ${data.applicationId} - Nadoumi`,
      'application-under-review',
      {
        firstName,
        email,
        applicationId: data.applicationId,
        scholarshipTitle: data.scholarshipTitle,
        adminNote: data.adminNote,
        frontendUrl: FRONTEND_URL,
      }
    )
  }

  async sendNewApplicationNotificationToAdmin(applicationData) {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminUrl = `${FRONTEND_URL}/admin/applications/${applicationData.applicationId || applicationData.id || applicationData._id}`

    return this._queueNotification(
      'email',
      adminEmail,
      `New Application Received - ${applicationData.applicationId || applicationData.id || 'N/A'} - Nadoumi`,
      'new-application-admin',
      {
        applicationId: applicationData.applicationId || applicationData.id || applicationData._id,
        studentName: applicationData.studentName || `${applicationData.student?.firstName || ''} ${applicationData.student?.lastName || ''}`.trim() || 'N/A',
        studentEmail: applicationData.studentEmail || applicationData.student?.email || 'N/A',
        studentPhone: applicationData.studentPhone || applicationData.student?.phone || null,
        studentNationality: applicationData.studentNationality || applicationData.student?.nationality || null,
        scholarshipTitle: applicationData.scholarshipTitle || applicationData.scholarship?.title || 'N/A',
        universityName: applicationData.universityName || applicationData.scholarship?.university?.name || applicationData.scholarship?.university || null,
        submittedAt: applicationData.submittedAt ? new Date(applicationData.submittedAt).toLocaleString() : new Date().toLocaleString(),
        adminUrl,
      }
    )
  }
}

export default new EmailService()
