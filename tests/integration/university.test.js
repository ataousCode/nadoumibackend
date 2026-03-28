import { jest } from "@jest/globals";

// Step 1: Mock Prisma
const mockPrisma = {
  university: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: "audit_123" }),
  },
};

jest.unstable_mockModule("../../config/prisma.js", () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Mock Admin check for Auth
jest.unstable_mockModule("../../repositories/admin.repository.js", () => ({
  __esModule: true,
  default: {
    findByIdWithoutPassword: jest
      .fn()
      .mockResolvedValue({ id: "admin_123", role: "admin" }),
  },
}));

// Dynamic imports
const request = (await import("supertest")).default;
const app = (await import("../../index.js")).default;
const { generateToken } = await import("../../utils/jwt.js");
const { mockUniversity } = await import("../fixtures/university.fixture.js");

// Silence logs
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("University Management Integration Tests", () => {
  const adminToken = generateToken({ id: "admin_123", type: "admin" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/universities", () => {
    it("should return a list of universities", async () => {
      mockPrisma.university.findMany.mockResolvedValue([mockUniversity]);
      mockPrisma.university.count.mockResolvedValue(1);

      const response = await request(app).get("/api/universities");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.universities).toHaveLength(1);
    });
  });

  describe("POST /api/universities", () => {
    it("should allow admin to create a university", async () => {
      mockPrisma.university.create.mockResolvedValue(mockUniversity);

      const response = await request(app)
        .post("/api/universities")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New University",
          country: "China",
          city: "Shanghai",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(mockUniversity.name);
    });

    it("should block unauthorized users from creating a university", async () => {
      const response = await request(app)
        .post("/api/universities")
        .send({ name: "Hack" });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/universities/:id", () => {
    it("should return a single university", async () => {
      mockPrisma.university.findFirst.mockResolvedValue(mockUniversity);

      const response = await request(app).get(
        `/api/universities/${mockUniversity.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(mockUniversity.name);
    });

    it("should return 404 if university not found", async () => {
      mockPrisma.university.findFirst.mockResolvedValue(null);

      const response = await request(app).get(
        "/api/universities/non-existent-id",
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/universities/:id", () => {
    it("should allow admin to update a university", async () => {
      mockPrisma.university.findFirst.mockResolvedValue(mockUniversity);
      mockPrisma.university.update.mockResolvedValue({
        ...mockUniversity,
        name: "Updated Name",
      });

      const response = await request(app)
        .put(`/api/universities/${mockUniversity.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Updated Name");
    });
  });

  describe("DELETE /api/universities/:id", () => {
    it("should allow admin to delete a university", async () => {
      mockPrisma.university.findFirst.mockResolvedValue(mockUniversity);
      mockPrisma.university.delete.mockResolvedValue(mockUniversity);

      const response = await request(app)
        .delete(`/api/universities/${mockUniversity.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
