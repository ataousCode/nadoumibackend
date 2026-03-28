import { jest } from "@jest/globals";

// Step 1: Mock dependencies
const mockStudentRepository = {
  findByEmailOrNull: jest.fn(),
  findByPassportNumber: jest.fn(),
  create: jest.fn(),
  updateEmailVerification: jest.fn(),
  saveOTP: jest.fn(),
  verifyOTP: jest.fn(),
  clearOTP: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  savePasswordResetToken: jest.fn(),
  findByPasswordResetToken: jest.fn(),
  clearPasswordResetToken: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

const mockOTPService = {
  generateOTP: jest.fn().mockReturnValue("123456"),
  generateOTPExpiration: jest.fn().mockReturnValue(new Date()),
};

const mockEmailService = {
  sendVerificationOTP: jest.fn().mockResolvedValue({}),
  sendWelcomeEmail: jest.fn().mockResolvedValue({}),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
};

jest.unstable_mockModule("../../repositories/student.repository.js", () => ({
  __esModule: true,
  default: mockStudentRepository,
}));

jest.unstable_mockModule("../../services/otp.service.js", () => ({
  __esModule: true,
  default: mockOTPService,
}));

jest.unstable_mockModule("../../services/email.service.js", () => ({
  __esModule: true,
  default: mockEmailService,
}));

jest.unstable_mockModule("../../utils/jwt.js", () => ({
  __esModule: true,
  generateToken: jest.fn().mockReturnValue("mock_token"),
}));

jest.unstable_mockModule("../../utils/password.js", () => ({
  __esModule: true,
  hashPassword: jest.fn().mockResolvedValue("hashed_password"),
  comparePassword: jest.fn(),
}));

jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { default: studentService } =
  await import("../../services/student.service.js");
const { comparePassword } = await import("../../utils/password.js");
const { AuthenticationError, ConflictError, NotFoundError } =
  await import("../../utils/errors.js");

describe("StudentService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const validData = {
      email: "student@test.com",
      password: "password123",
      passportNumber: "G12345678",
      firstName: "John",
      lastName: "Doe",
    };

    it("should register successfully without email service (auto-verify)", async () => {
      process.env.SMTP_USER = "";
      mockStudentRepository.findByEmailOrNull.mockResolvedValue(null);
      mockStudentRepository.findByPassportNumber.mockResolvedValue(null);
      mockStudentRepository.create.mockResolvedValue({
        ...validData,
        id: "uuid-123",
        email: validData.email.toLowerCase(),
      });

      const result = await studentService.register(validData);

      expect(result.token).toBe("mock_token");
      expect(
        mockStudentRepository.updateEmailVerification,
      ).toHaveBeenCalledWith("uuid-123", true);
    });

    it("should throw ConflictError if email exists", async () => {
      mockStudentRepository.findByEmailOrNull.mockResolvedValue({ id: "1" });
      await expect(studentService.register(validData)).rejects.toThrow(
        ConflictError,
      );
    });

    it("should register successfully with email service and send OTP", async () => {
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";
      mockStudentRepository.findByEmailOrNull.mockResolvedValue(null);
      mockStudentRepository.findByPassportNumber.mockResolvedValue(null);
      mockStudentRepository.create.mockResolvedValue({
        ...validData,
        id: "uuid-123",
      });

      const result = await studentService.register(validData);

      expect(result.message).toContain("verification code");
      expect(mockStudentRepository.saveOTP).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationOTP).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login successfully if verified", async () => {
      const mockStudent = {
        id: "1",
        email: "s@t.com",
        password: "hash",
        isEmailVerified: true,
      };
      mockStudentRepository.findByEmailOrNull.mockResolvedValue(mockStudent);
      comparePassword.mockResolvedValue(true);

      const result = await studentService.login("s@t.com", "pass");

      expect(result.token).toBe("mock_token");
    });

    it("should throw AuthenticationError if not verified", async () => {
      mockStudentRepository.findByEmailOrNull.mockResolvedValue({
        isEmailVerified: false,
        password: "hash",
      });
      comparePassword.mockResolvedValue(true);
      await expect(studentService.login("s@t.com", "pass")).rejects.toThrow(
        AuthenticationError,
      );
    });
  });

  describe("forgotPassword", () => {
    it("should send reset link if student exists", async () => {
      mockStudentRepository.findByEmailOrNull.mockResolvedValue({
        id: "1",
        email: "test@test.com",
      });
      const result = await studentService.forgotPassword("test@test.com");
      expect(mockStudentRepository.savePasswordResetToken).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });
});
