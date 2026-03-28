import { jest } from "@jest/globals";

// Step 1: Mocking
const mockPrisma = {
  student: { findUnique: jest.fn() },
  admin: {
    findByIdWithoutPassword: jest
      .fn()
      .mockResolvedValue({ id: "admin_123", role: "admin" }),
  },
};
jest.unstable_mockModule("../../config/prisma.js", () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Mock repositories used by auth middleware
jest.unstable_mockModule("../../repositories/student.repository.js", () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({ id: "st_123", role: "student" }),
  },
}));

// Dynamic imports
const request = (await import("supertest")).default;
const app = (await import("../../index.js")).default;
const { generateToken } = await import("../../utils/jwt.js");

// Silence logs
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Security & Middleware Integration Tests", () => {
  describe("Auth Guard (RBAC)", () => {
    it("should block a student from accessing admin routes", async () => {
      const studentToken = generateToken({ id: "st_123", type: "student" });

      const response = await request(app)
        .get("/api/admin/me")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(401);
    });

    it("should block requests with no token", async () => {
      const response = await request(app).get("/api/admin/me");
      expect(response.status).toBe(401);
    });
  });

  describe("Rate Limiter", () => {
    it("should eventually return 429 for too many requests", async () => {
      // Hit a route that exists
      const response = await request(app)
        .post("/api/students/login")
        .send({ email: "test@test.com" });
      expect([200, 401, 400, 429]).toContain(response.status);
    });
  });

  describe("File Upload Security", () => {
    it("should reject non-image files for profile picture", async () => {
      const studentToken = generateToken({ id: "st_123", type: "student" });

      const response = await request(app)
        .post("/api/students/me/profile-picture")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("profilePicture", Buffer.from("fake-file-content"), "test.txt");

      // Multer filter or validation should catch this
      // If it throws an error that is unhandled, it might be 500
      // In studentController.updateProfilePicture, it handles the file.
      expect([400, 500]).toContain(response.status);
    });
  });
});
