import crypto from 'crypto'

/**
 * OTP Service
 * Handles OTP generation and validation
 */
class OTPService {
  /**
   * Generate a 6-digit OTP
   */
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString()
  }

  /**
   * Generate OTP expiration time (default: 10 minutes)
   */
  generateOTPExpiration(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000)
  }

  /**
   * Verify OTP
   */
  verifyOTP(storedOTP, providedOTP, expiresAt) {
    if (!storedOTP || !providedOTP) {
      return false
    }

    if (expiresAt && expiresAt < Date.now()) {
      return false
    }

    return storedOTP === providedOTP
  }

  /**
   * Check if OTP is expired
   */
  isOTPExpired(expiresAt) {
    if (!expiresAt) {
      return true
    }
    return expiresAt < Date.now()
  }
}

export default new OTPService()

