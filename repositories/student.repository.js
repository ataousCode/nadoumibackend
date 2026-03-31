import BaseRepository from "./base.repository.js";

class StudentRepository extends BaseRepository {
  constructor() {
    super("Student");
  }

  async findByEmail(email) {
    return await this.model.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByEmailOrNull(email) {
    return await this.model.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByPassportNumber(passportNumber) {
    return await this.model.findUnique({
      where: { passportNumber: passportNumber.toUpperCase() },
    });
  }

  async updateEmailVerification(id, isVerified) {
    return await this.update(id, { isEmailVerified: isVerified });
  }

  async updatePassword(id, hashedPassword) {
    return await this.model.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async savePasswordResetToken(id, token, expiresAt) {
    return await this.model.update({
      where: { id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });
  }

  async findByPasswordResetToken(token) {
    return await this.model.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
  }

  async clearPasswordResetToken(id) {
    return await this.model.update({
      where: { id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  async saveOTP(id, otp, expiresAt) {
    return await this.model.update({
      where: { id },
      data: {
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: expiresAt,
      },
    });
  }

  async verifyOTP(email, otp) {
    return await this.model.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: { gt: new Date() },
      },
    });
  }

  async clearOTP(id) {
    return await this.model.update({
      where: { id },
      data: {
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null,
      },
    });
  }

  async findByIdWithoutPassword(id) {
    return await this.model.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        phone: true,
        country: true,
        city: true,
        passportNumber: true,
        profilePicture: true,
        isEmailVerified: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password and tokens
      },
    });
  }
}

export default new StudentRepository();
