import crypto from 'crypto'
import { OTP_EXPIRATION_MINUTES } from '../config/constants.js'

class OTPService {
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString()
  }

  generateOTPExpiration(minutes = OTP_EXPIRATION_MINUTES) {
    return new Date(Date.now() + minutes * 60 * 1000)
  }

  verifyOTP(storedOTP, providedOTP, expiresAt) {
    if (!storedOTP || !providedOTP) {
      return false
    }
    if (expiresAt && expiresAt < Date.now()) {
      return false
    }
    return storedOTP === providedOTP
  }

  isOTPExpired(expiresAt) {
    if (!expiresAt) {
      return true
    }
    return expiresAt < Date.now()
  }
}

export default new OTPService()
