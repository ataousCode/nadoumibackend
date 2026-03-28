import { jest } from "@jest/globals";

// Mock BullMQ
const mockQueueAdd = jest.fn().mockResolvedValue({ id: "job_123" });
const mockQueueClose = jest.fn().mockResolvedValue({});
const mockWorkerClose = jest.fn().mockResolvedValue({});

jest.unstable_mockModule("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: mockQueueClose,
  })),
  Worker: jest.fn().mockImplementation((name, processor, opts) => {
    // Store processor to manually trigger it in tests
    globalThis.__lastWorkerProcessor = processor;
    return {
      on: jest.fn(),
      close: mockWorkerClose,
    };
  }),
}));

const mockEmailService = {
  _performSend: jest.fn().mockResolvedValue({}),
};

const mockNotificationRepo = {
  update: jest.fn().mockResolvedValue({}),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.unstable_mockModule("../../services/email.service.js", () => ({
  __esModule: true,
  default: mockEmailService,
}));

jest.unstable_mockModule(
  "../../repositories/notification.repository.js",
  () => ({
    __esModule: true,
    default: mockNotificationRepo,
  }),
);

jest.unstable_mockModule("../../utils/logger.js", () => ({
  __esModule: true,
  default: mockLogger,
}));

// Dynamic import of the service
const queueService = (await import("../../services/queue.service.js")).default;

describe("QueueService Unit Tests", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Simulate non-test environment behavior if needed,
    // but the constructor already handles NODE_ENV !== 'test'
    // To test job addition, we need a queue object
    const { Queue } = await import("bullmq");
    queueService.notificationQueue = new Queue("notifications");
  });

  it("should add a notification job with correct retry policy", async () => {
    const data = { notificationId: "notif_1", recipient: "test@test.com" };
    await queueService.addNotificationJob(data);

    expect(mockQueueAdd).toHaveBeenCalledWith("send-email", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  });

  describe("Worker Logic", () => {
    it("should process an email job successfully", async () => {
      // Initialize worker to capture processor
      queueService.initializeWorker();
      const processor = globalThis.__lastWorkerProcessor;

      const job = {
        id: "job_1",
        data: {
          notificationId: "notif_1",
          type: "email",
          recipient: "test@test.com",
          subject: "Test",
          template: "tpl",
          content: {},
        },
      };

      await processor(job);

      expect(mockEmailService._performSend).toHaveBeenCalled();
      expect(mockNotificationRepo.update).toHaveBeenCalledWith(
        "notif_1",
        expect.objectContaining({
          status: "sent",
        }),
      );
    });

    it("should update status to failed and rethrow if processing crashes", async () => {
      queueService.initializeWorker();
      const processor = globalThis.__lastWorkerProcessor;

      mockEmailService._performSend.mockRejectedValue(new Error("SMTP down"));

      const job = {
        id: "job_1",
        data: { notificationId: "notif_1", type: "email" },
      };

      await expect(processor(job)).rejects.toThrow("SMTP down");

      expect(mockNotificationRepo.update).toHaveBeenCalledWith(
        "notif_1",
        expect.objectContaining({
          status: "failed",
          error: "SMTP down",
        }),
      );
    });
  });
});
