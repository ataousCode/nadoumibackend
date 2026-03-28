import { jest } from "@jest/globals";

// Step 1: Mock dependencies
const mockAdminRepository = {
  findByEmailOrNull: jest.fn(),
  findByIdWithoutPassword: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  updateProfilePicture: jest.fn(),
};

jest.unstable_mockModule("../../repositories/admin.repository.js", () => ({
  __esModule: true,
  default: mockAdminRepository,
}));

jest.unstable_mockModule("../../utils/jwt.js", () => ({
  __esModule: true,
  generateToken: jest.fn().mockReturnValue("mock_token"),
  verifyToken: jest.fn(),
}));

jest.unstable_mockModule("../../utils/password.js", () => ({
  __esModule: true,
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

const { default: adminService } =
  await import("../../services/admin.service.js");
const { comparePassword } = await import("../../utils/password.js");
const { AuthenticationError, ValidationError } =
  await import("../../utils/errors.js");

describe("AdminService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockAdmin = {
        id: "1",
        email: "admin@test.com",
        password: "hashed_password",
        name: "Admin",
      };
      mockAdminRepository.findByEmailOrNull.mockResolvedValue(mockAdmin);
      comparePassword.mockResolvedValue(true);

      const result = await adminService.login("admin@test.com", "password123");

      expect(result.token).toBe("mock_token");
      expect(result.admin.email).toBe(mockAdmin.email);
      expect(mockAdminRepository.findByEmailOrNull).toHaveBeenCalledWith(
        "admin@test.com",
      );
    });

    it("should throw ValidationError if email or password missing", async () => {
      await expect(adminService.login("", "password")).rejects.toThrow(
        ValidationError,
      );
    });

    it("should throw AuthenticationError if admin not found", async () => {
      mockAdminRepository.findByEmailOrNull.mockResolvedValue(null);
      await expect(
        adminService.login("wrong@test.com", "password"),
      ).rejects.toThrow(AuthenticationError);
    });

    it("should throw AuthenticationError if password incorrect", async () => {
      mockAdminRepository.findByEmailOrNull.mockResolvedValue({
        password: "hash",
      });
      comparePassword.mockResolvedValue(false);
      await expect(
        adminService.login("admin@test.com", "wrong"),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe("getProfile", () => {
    it("should return admin profile", async () => {
      const mockAdmin = { id: "1", email: "admin@test.com", name: "Admin" };
      mockAdminRepository.findByIdWithoutPassword.mockResolvedValue(mockAdmin);

      const result = await adminService.getProfile("1");
      expect(result.email).toBe(mockAdmin.email);
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      const mockAdmin = { id: "1", password: "old_hash" };
      mockAdminRepository.findById.mockResolvedValue(mockAdmin);
      comparePassword.mockResolvedValue(true);

      const result = await adminService.changePassword(
        "1",
        "old_pass",
        "new_password123",
      );
      expect(result.message).toBe("Password updated successfully");
      expect(mockAdminRepository.updatePassword).toHaveBeenCalled();
    });

    it("should throw error if new password too short", async () => {
      mockAdminRepository.findById.mockResolvedValue({ password: "hash" });
      comparePassword.mockResolvedValue(true);
      await expect(
        adminService.changePassword("1", "old", "short"),
      ).rejects.toThrow(ValidationError);
    });
  });
});
