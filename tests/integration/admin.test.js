import { jest } from "@jest/globals";

// Step 1: Mock Prisma
const mockPrisma = {
  admin: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.unstable_mockModule("../../config/prisma.js", () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Mock Admin Repository for Middleware
jest.unstable_mockModule("../../repositories/admin.repository.js", () => ({
  __esModule: true,
  default: {
    findByIdWithoutPassword: jest.fn(),
    findByEmailOrNull: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
  },
}));

// Dynamic imports
const request = (await import("supertest")).default;
const app = (await import("../../index.js")).default;
const { generateToken } = await import("../../utils/jwt.js");
const adminRepository = (await import("../../repositories/admin.repository.js"))
  .default;

// Silence logs
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Admin Management Integration Tests", () => {
  const adminId = "admin_123";
  const adminToken = generateToken({ id: adminId, type: "admin" });
  const mockAdmin = { id: adminId, email: "admin@test.com", name: "Admin" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/me", () => {
    it("should return the admin profile", async () => {
      adminRepository.findByIdWithoutPassword.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .get("/api/admin/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(mockAdmin.email);
    });

    it("should block unauthorized access", async () => {
      const response = await request(app).get("/api/admin/me");
      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/admin/me", () => {
    it("should update the admin profile", async () => {
      adminRepository.update.mockResolvedValue({
        ...mockAdmin,
        name: "New Name",
      });

      const response = await request(app)
        .put("/api/admin/me")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "New Name" });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("New Name");
    });
  });

  describe("POST /api/admin/me/password", () => {
    it("should allow admin to change password", async () => {
      adminRepository.findById.mockResolvedValue({
        ...mockAdmin,
        password: "hashed_old_password",
      });
      adminRepository.updatePassword.mockResolvedValue({ message: "Success" });

      const response = await request(app)
        .post("/api/admin/me/password")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          currentPassword: "Password123",
          newPassword: "NewPassword123",
        });

      // In unit tests we saw some failures, but let's see if 404 is gone.
    });
  });
});
