import { jest } from "@jest/globals";

// Step 1: Mock Prisma
const mockPrisma = {
  scholarship: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  university: {
    findUnique: jest.fn(),
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
const { mockScholarship } = await import("../fixtures/scholarship.fixture.js");
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

describe("Scholarship Management Integration Tests", () => {
  const adminToken = generateToken({ id: "admin_123", type: "admin" });

  beforeEach(() => {
    mockPrisma.scholarship.create.mockReset();
    mockPrisma.scholarship.findMany.mockReset();
    mockPrisma.scholarship.count.mockReset();
    mockPrisma.scholarship.findFirst.mockReset();
    mockPrisma.scholarship.update.mockReset();
    mockPrisma.scholarship.delete.mockReset();
    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit_123" });
  });

  describe("GET /api/scholarships", () => {
    it("should return a list of scholarships", async () => {
      mockPrisma.scholarship.findMany.mockResolvedValue([mockScholarship]);
      mockPrisma.scholarship.count.mockResolvedValue(1);

      const response = await request(app).get("/api/scholarships");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarships).toHaveLength(1);
    });
  });

  describe("POST /api/scholarships", () => {
    const validData = {
      title: "New Scholarship",
      description: "Description",
      universityId: mockUniversity.id,
      programCategory: "Bachelor",
      scholarshipCategory: "Partial",
      applicationDeadline: "2025-12-31",
    };

    it("should allow admin to create a scholarship", async () => {
      mockPrisma.scholarship.findFirst.mockResolvedValue(mockScholarship);
      mockPrisma.scholarship.create.mockResolvedValue(mockScholarship);

      const response = await request(app)
        .post("/api/scholarships")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should block non-admin users", async () => {
      const response = await request(app)
        .post("/api/scholarships")
        .send(validData);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/scholarships/:id", () => {
    it("should return a scholarship by ID", async () => {
      mockPrisma.scholarship.findFirst.mockResolvedValue(mockScholarship);

      const response = await request(app).get(
        `/api/scholarships/${mockScholarship.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(mockScholarship.id);
    });

    it("should return 404 if not found", async () => {
      mockPrisma.scholarship.findFirst.mockResolvedValue(null);

      const response = await request(app).get("/api/scholarships/missing");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/scholarships/:id", () => {
    it("should allow admin to update a scholarship", async () => {
      mockPrisma.scholarship.findFirst.mockResolvedValue(mockScholarship);
      const updatedScholarship = { ...mockScholarship, title: "Updated Title" };
      mockPrisma.scholarship.update.mockResolvedValue(updatedScholarship);

      // Reset and re-mock for precise control
      mockPrisma.scholarship.findFirst
        .mockResolvedValueOnce(mockScholarship) // used by repository.update
        .mockResolvedValueOnce(updatedScholarship); // returned by service

      const response = await request(app)
        .put(`/api/scholarships/${mockScholarship.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/scholarships/:id", () => {
    it("should allow admin to delete a scholarship", async () => {
      mockPrisma.scholarship.findFirst.mockResolvedValue(mockScholarship);
      mockPrisma.scholarship.delete.mockResolvedValue(mockScholarship);

      const response = await request(app)
        .delete(`/api/scholarships/${mockScholarship.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
