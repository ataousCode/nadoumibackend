import dotenv from "dotenv";
import { jest } from "@jest/globals";
dotenv.config({ path: ".env.test" });

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-standard";

// Aliyun OSS Mocks for tests
process.env.ALIBABA_CLOUD_ACCESS_KEY_ID = "mock-key-id";
process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET = "mock-key-secret";
process.env.OSS_REGION = "oss-cn-hangzhou";
process.env.OSS_BUCKET = "mock-bucket";

// Silence console logs during tests unless explicitly debugging
if (!process.env.DEBUG_TESTS) {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "debug").mockImplementation(() => {});
}
