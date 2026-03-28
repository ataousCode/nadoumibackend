import { jest } from "@jest/globals";

// Mock dependencies
const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
};

const mockRedis = {
  ping: jest.fn().mockResolvedValue("PONG"),
};

jest.unstable_mockModule("../../config/prisma.js", () => ({
  default: mockPrisma,
}));

jest.unstable_mockModule("../../config/redis.js", () => ({
  default: mockRedis,
}));

// Dynamic imports
const request = (await import("supertest")).default;
const app = (await import("../../index.js")).default;

describe("Health Check Integration Test", () => {
  it("should return 200 OK and status ok when all services are up", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body.services.database).toBe("up");
    expect(response.body.services.redis).toBe("up");
  });

  it("should return 503 Service Unavailable when a service is down", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("DB Down"));

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty("status", "error");
    expect(response.body.services.database).toBe("down");
  });
});
