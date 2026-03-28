import { jest } from "@jest/globals";

// Step 1: Mock Prisma and Repository (Must be before imports)
const mockPrisma = {
  application: {
    findUnique: jest.fn().mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      documents: [{ name: "file1.pdf", path: "test.pdf" }],
    }),
    update: jest.fn().mockResolvedValue({}),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: "audit_123" }),
  },
};

jest.unstable_mockModule("../../config/prisma.js", () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.unstable_mockModule("../../repositories/admin.repository.js", () => ({
  __esModule: true,
  default: {
    findByIdWithoutPassword: jest
      .fn()
      .mockResolvedValue({ id: "admin_123", role: "admin" }),
  },
}));

jest.unstable_mockModule("../../utils/upload.js", () => {
  const mockMulter = {
    single: jest.fn().mockReturnValue((req, res, next) => next()),
    array: jest.fn().mockReturnValue((req, res, next) => next()),
    fields: jest.fn().mockReturnValue((req, res, next) => next()),
  };
  return {
    __esModule: true,
    createStudentDocumentUpload: jest.fn().mockReturnValue({
      single: jest.fn().mockReturnValue((req, res, next) => {
        req.file = {
          filename: "test.pdf",
          originalname: "test.pdf",
          size: 1024,
          mimetype: "application/pdf",
          buffer: Buffer.from("dummy"),
        };
        next();
      }),
    }),
    createApplicationDocumentUpload: jest.fn().mockReturnValue(mockMulter),
    createProfilePictureUpload: jest.fn().mockReturnValue(mockMulter),
  };
});

// Mock fs
jest.unstable_mockModule("fs", () => ({
  __esModule: true,
  default: {
    existsSync: jest.fn().mockReturnValue(true),
    readdirSync: jest.fn().mockReturnValue([{ name: "file1.pdf", isDirectory: () => false }]),
    statSync: jest.fn().mockReturnValue({ size: 1024 }),
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

describe("Document Management Integration Tests", () => {
  const adminToken = generateToken({ id: "admin_123", type: "admin" });
  const appId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/documents/:applicationId", () => {
    it("should allow uploading a file", async () => {
      const response = await request(app)
        .post(`/api/documents/${appId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from("dummy content"), "test.pdf");

      expect(response.status).toBe(200);
      expect(response.body.data.path).toContain(appId);
    });
  });

  describe("GET /api/documents/:applicationId", () => {
    it("should allow admin to list documents", async () => {
      const response = await request(app)
        .get(`/api/documents/${appId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("file1.pdf");
    });

    it("should block non-admin from listing documents", async () => {
      const response = await request(app).get(`/api/documents/${appId}`);
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/documents/file/:path", () => {
    it("should serve a file", async () => {
      const response = await request(app).get(
        "/api/documents/file/applications/abc/file.pdf",
      );
      expect(response.status).not.toBe(404);
    });
  });
});
