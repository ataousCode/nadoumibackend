import { jest } from "@jest/globals";

// Step 1: Mock Prisma and other services
const mockPrisma = {
  student: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.unstable_mockModule("../../config/prisma.js", () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Step 2: Dynamic imports
const request = (await import("supertest")).default;
const bcrypt = (await import("bcryptjs")).default;
const app = (await import("../../index.js")).default;
const { mockStudent } = await import("../fixtures/user.fixture.js");

// Silence logs
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Email Service entirely to prevent background errors
jest.unstable_mockModule("../../services/email.service.js", () => ({
  default: {
    sendVerificationOTP: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  },
}));

describe("Auth & Registration Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for hashPassword
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed_password");
  });

  describe("POST /api/students/login", () => {
    it("should return 401 for an incorrect email", async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      const response = await request(app).post("/api/students/login").send({
        email: "notfound@test.com",
        password: "AnyPassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Invalid email or password");
    });

    it("should return 200 and a token for valid credentials", async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      const response = await request(app).post("/api/students/login").send({
        email: "test@nadoumi.com",
        password: "CorrectPassword123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
    });
  });

  describe("POST /api/students/register", () => {
    const regData = {
      email: "new@test.com",
      password: "Password123",
      firstName: "New",
      lastName: "User",
      country: "France",
      passportNumber: "FR1234567",
    };

    it("should register a new student and return 201", async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null); // No existing email/passport
      mockPrisma.student.create.mockResolvedValue({
        ...mockStudent,
        email: regData.email,
      });

      const response = await request(app)
        .post("/api/students/register")
        .send(regData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockPrisma.student.create).toHaveBeenCalled();
    });

    it("should return 409 if email already exists", async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent); // Existing email

      const response = await request(app)
        .post("/api/students/register")
        .send(regData);

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain("already registered");
    });
  });

  describe("POST /api/students/verify-email", () => {
    it("should verify OTP and return 200", async () => {
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent); // OTP matches
      mockPrisma.student.update.mockResolvedValue({
        ...mockStudent,
        isEmailVerified: true,
      });

      const response = await request(app)
        .post("/api/students/verify-email")
        .send({ email: mockStudent.email, otp: "123456" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student.isEmailVerified).toBe(true);
    });

    it("should return 401 for invalid OTP", async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null); // No match

      const response = await request(app)
        .post("/api/students/verify-email")
        .send({ email: "test@nadoumi.com", otp: "000000" }); // Explicitly use valid format

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
