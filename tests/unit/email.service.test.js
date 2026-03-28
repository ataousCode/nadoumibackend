import { jest } from "@jest/globals";

// Mock internal dependencies
const mockNotificationRepo = {
  create: jest.fn().mockResolvedValue({ id: "notif_123" }),
};

const mockQueueService = {
  addNotificationJob: jest.fn().mockResolvedValue({}),
};

const mockEmailConfig = {
  renderTemplate: jest.fn().mockResolvedValue("<html>Template</html>"),
  sendEmail: jest.fn().mockResolvedValue({ messageId: "msg_123" }),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule(
  "../../repositories/notification.repository.js",
  () => ({
    __esModule: true,
    default: mockNotificationRepo,
  }),
);

jest.unstable_mockModule("../../services/queue.service.js", () => ({
  __esModule: true,
  default: mockQueueService,
}));

jest.unstable_mockModule("../../config/email.js", () => ({
  __esModule: true,
  default: mockEmailConfig,
}));

jest.unstable_mockModule("../../utils/logger.js", () => ({
  __esModule: true,
  default: mockLogger,
}));

// Dynamic import of the service under test
const emailService = (await import("../../services/email.service.js")).default;

describe("EmailService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("_queueNotification", () => {
    it("should create a notification record and add a job to the queue", async () => {
      const recipient = "test@example.com";
      const subject = "Test Subject";
      const template = "test-template";
      const content = { key: "value" };

      const result = await emailService._queueNotification(
        "email",
        recipient,
        subject,
        template,
        content,
      );

      expect(mockNotificationRepo.create).toHaveBeenCalledWith({
        type: "email",
        recipient,
        subject,
        template,
        content,
        status: "pending",
      });

      expect(mockQueueService.addNotificationJob).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient,
          subject,
          template,
          content,
        }),
      );

      expect(result).toEqual({ id: "notif_123" });
    });

    it("should log error and return null if repository fails", async () => {
      mockNotificationRepo.create.mockRejectedValue(new Error("DB Error"));

      const result = await emailService._queueNotification(
        "email",
        "test@test.com",
        "Sub",
        "tmp",
        {},
      );

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error queuing notification",
        expect.any(Object),
      );
    });
  });

  describe("Specific Email Methods", () => {
    it("should queue verification email with OTP", async () => {
      await emailService.sendVerificationOTP("user@test.com", "123456");
      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "verify-email",
          content: { otp: "123456", email: "user@test.com" },
        }),
      );
    });

    it("should queue interview notification with correct data", async () => {
      const interviewData = {
        applicationId: "APP123",
        scholarshipTitle: "Scholarship X",
        interviewDate: "2024-05-05",
      };
      await emailService.sendInterviewNotification(
        "student@test.com",
        "John",
        interviewData,
      );

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "interview-notification",
          content: expect.objectContaining({
            firstName: "John",
            applicationId: "APP123",
            interviewDate: "2024-05-05",
          }),
        }),
      );
    });

    it("should queue admin notification with correct mapping", async () => {
      const applicationData = {
        applicationId: "APP123",
        student: { firstName: "Jane", email: "jane@test.com" },
        scholarship: { title: "Super Scholarship" },
      };
      await emailService.sendNewApplicationNotificationToAdmin(applicationData);

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "new-application-admin",
          content: expect.objectContaining({
            studentName: "Jane",
            scholarshipTitle: "Super Scholarship",
          }),
        }),
      );
    });
  });

  describe("_performSend", () => {
    it("should render template and send email via config", async () => {
      await emailService._performSend("to@test.com", "Sub", "tpl", { data: 1 });

      expect(mockEmailConfig.renderTemplate).toHaveBeenCalledWith("tpl", {
        data: 1,
      });
      expect(mockEmailConfig.sendEmail).toHaveBeenCalledWith({
        to: "to@test.com",
        subject: "Sub",
        html: "<html>Template</html>",
      });
    });
  });
});
