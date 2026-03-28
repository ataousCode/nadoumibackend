import { jest } from "@jest/globals";

// Mock Prisma
const mockPrisma = {
  notification: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.unstable_mockModule("../../config/prisma.js", () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Dynamic import of the repository
const notificationRepository = (
  await import("../../repositories/notification.repository.js")
).default;

describe("NotificationRepository Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a notification record", async () => {
    const data = {
      type: "email",
      recipient: "test@example.com",
      subject: "Audit Test",
      template: "welcome",
      content: { name: "Test" },
      status: "pending",
    };

    mockPrisma.notification.create.mockResolvedValue({
      id: "notif_1",
      ...data,
    });

    const result = await notificationRepository.create(data);

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({ data });
    expect(result.id).toBe("notif_1");
  });

  it("should update notification status", async () => {
    mockPrisma.notification.update.mockResolvedValue({
      id: "notif_1",
      status: "sent",
    });

    const result = await notificationRepository.update("notif_1", {
      status: "sent",
    });

    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "notif_1" },
      data: { status: "sent" },
    });
    // Actually looking at repository, it passes data directly
  });

  it("should find by recipient", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([{ id: "notif_1" }]);

    const result =
      await notificationRepository.findByRecipient("test@example.com");

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { recipient: "test@example.com" },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toHaveLength(1);
  });
});
