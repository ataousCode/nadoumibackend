import { jest } from "@jest/globals";

// Step 1: Mock Prisma
const mockPrisma = {
  application: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  scholarship: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  university: {
    findUnique: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: "audit_123" }),
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
    findById: jest.fn().mockImplementation((id) => {
      if (id === "st_123")
        return Promise.resolve({
          id: "st_123",
          role: "student",
          email: "test@nadoumi.com",
        });
      return Promise.resolve(null);
    }),
  },
}));

jest.unstable_mockModule("../../repositories/admin.repository.js", () => ({
  __esModule: true,
  default: {
    findByIdWithoutPassword: jest.fn().mockResolvedValue({
      id: "admin_123",
      role: "admin",
      email: "admin@test.com",
    }),
  },
}));

// Mock Email Service internally to avoid NotificationRepository issues
jest.unstable_mockModule("../../services/email.service.js", () => ({
  __esModule: true,
  default: {
    sendNewApplicationNotificationToAdmin: jest.fn().mockResolvedValue({}),
    sendInterviewNotification: jest.fn().mockResolvedValue({}),
    sendInterviewPassedNotification: jest.fn().mockResolvedValue({}),
    sendInterviewFailedNotification: jest.fn().mockResolvedValue({}),
    sendRevokedNotification: jest.fn().mockResolvedValue({}),
    sendDocumentUploadedNotification: jest.fn().mockResolvedValue({}),
  },
}));

// Dynamic imports
const request = (await import("supertest")).default;
const app = (await import("../../index.js")).default;
const { generateToken } = await import("../../utils/jwt.js");
const { mockApplication, mockInterviewApplication, mockAcceptedApplication } =
  await import("../fixtures/application.fixture.js");
const { mockScholarship } = await import("../fixtures/scholarship.fixture.js");
const emailService = (await import("../../services/email.service.js")).default;

// Silence logs
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Helpers for fire-and-forget
const flushPromises = () => new Promise(setImmediate);

describe("Application Workflow Integration Tests", () => {
  const studentToken = generateToken({ id: "st_123", type: "student" });
  const adminToken = generateToken({ id: "admin_123", type: "admin" });

  beforeEach(async () => {
    jest.resetAllMocks();

    const studentRepo = (
      await import("../../repositories/student.repository.js")
    ).default;
    studentRepo.findById.mockResolvedValue({
      id: "st_123",
      role: "student",
      email: "test@nadoumi.com",
    });

    const adminRepo = (await import("../../repositories/admin.repository.js"))
      .default;
    adminRepo.findByIdWithoutPassword.mockResolvedValue({
      id: "admin_123",
      role: "admin",
      email: "admin@test.com",
    });

    // Default mock behavior for Prisma
    mockPrisma.application.findFirst.mockResolvedValue(mockApplication);
    mockPrisma.application.create.mockResolvedValue(mockApplication);
    mockPrisma.application.update.mockResolvedValue(mockApplication);
    mockPrisma.application.delete.mockResolvedValue(mockApplication);
    mockPrisma.application.findMany.mockResolvedValue([mockApplication]);
    mockPrisma.application.count.mockResolvedValue(1);

    mockPrisma.scholarship.findFirst.mockResolvedValue(mockScholarship);

    // Ensure email service methods are mocked
    jest
      .spyOn(emailService, "sendNewApplicationNotificationToAdmin")
      .mockResolvedValue({});
    jest.spyOn(emailService, "sendInterviewNotification").mockResolvedValue({});
    jest
      .spyOn(emailService, "sendInterviewPassedNotification")
      .mockResolvedValue({});
    jest
      .spyOn(emailService, "sendInterviewFailedNotification")
      .mockResolvedValue({});
    jest.spyOn(emailService, "sendRevokedNotification").mockResolvedValue({});
    jest
      .spyOn(emailService, "sendDocumentUploadedNotification")
      .mockResolvedValue({});

    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit_123" });
  });

  describe("Student Functionality", () => {
    it("should allow a student to submit an application", async () => {
      mockPrisma.scholarship.findFirst.mockResolvedValue({
        ...mockScholarship,
        status: "published",
      });
      mockPrisma.application.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockApplication);
      // Ensure create is mocked for this specific test, though it's also in beforeEach
      mockPrisma.application.create.mockResolvedValue(mockApplication);

      const response = await request(app)
        .post("/api/applications/student/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ scholarshipId: mockScholarship.id });

      expect(response.status).toBe(201);
      await flushPromises();
      expect(
        emailService.sendNewApplicationNotificationToAdmin,
      ).toHaveBeenCalled();
    });

    it("should block duplicate applications", async () => {
      mockPrisma.scholarship.findFirst.mockResolvedValue({
        ...mockScholarship,
        status: "published",
      });
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication);

      const response = await request(app)
        .post("/api/applications/student/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ scholarshipId: mockScholarship.id });

      expect(response.status).toBe(400);
    });

    it("should allow student to view their applications", async () => {
      mockPrisma.application.findMany.mockResolvedValue([mockApplication]);
      const response = await request(app)
        .get("/api/applications/student/me")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe("Admin Functionality", () => {
    it("should allow admin to update status to interview", async () => {
      mockPrisma.application.findFirst.mockResolvedValue(mockApplication);
      mockPrisma.application.update.mockResolvedValue({
        ...mockApplication,
        status: "interview",
      });

      const response = await request(app)
        .put(`/api/applications/${mockApplication.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "interview",
          note: "Talk soon",
          metadata: { interviewDate: "2024-10-10" },
        });

      expect(response.status).toBe(200);
      await flushPromises();
      expect(emailService.sendInterviewNotification).toHaveBeenCalled();
    });

    it("should allow admin to update status to interview_passed", async () => {
      mockPrisma.application.findFirst.mockResolvedValue(
        mockInterviewApplication,
      );
      mockPrisma.application.update.mockResolvedValue({
        ...mockApplication,
        status: "interview_passed",
      });

      const response = await request(app)
        .put(`/api/applications/${mockInterviewApplication.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "interview_passed" });

      expect(response.status).toBe(200);
      await flushPromises();
      expect(emailService.sendInterviewPassedNotification).toHaveBeenCalled();
    });

    it("should allow admin to upload admission letter", async () => {
      mockPrisma.application.findFirst.mockResolvedValue(
        mockAcceptedApplication,
      );
      mockPrisma.application.update.mockResolvedValue(mockAcceptedApplication);

      const response = await request(app)
        .put(`/api/applications/${mockAcceptedApplication.id}/admin-documents`)
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from("pdf content"), "letter.pdf")
        .field("documentType", "admission");

      expect(response.status).toBe(200);
      await flushPromises();
      expect(emailService.sendDocumentUploadedNotification).toHaveBeenCalled();
    });
  });
});
