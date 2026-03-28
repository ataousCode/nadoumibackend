import { jest } from "@jest/globals";
import otpService from "../../services/otp.service.js";

describe("OTPService Unit Tests", () => {
  describe("generateOTP", () => {
    it("should generate a 6-digit string", () => {
      const otp = otpService.generateOTP();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });
  });

  describe("generateOTPExpiration", () => {
    it("should return a future date", () => {
      const expiration = otpService.generateOTPExpiration(10);
      expect(expiration.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("verifyOTP", () => {
    it("should return true for matching OTP and valid expiration", () => {
      const expiration = new Date(Date.now() + 5 * 60 * 1000);
      expect(otpService.verifyOTP("123456", "123456", expiration)).toBe(true);
    });

    it("should return false for mismatched OTP", () => {
      expect(
        otpService.verifyOTP(
          "123456",
          "654321",
          new Date(Date.now() + 5 * 60 * 1000),
        ),
      ).toBe(false);
    });

    it("should return false for expired OTP", () => {
      const expiration = new Date(Date.now() - 5 * 60 * 1000);
      expect(otpService.verifyOTP("123456", "123456", expiration)).toBe(false);
    });
  });

  describe("isOTPExpired", () => {
    it("should return true for past date", () => {
      expect(otpService.isOTPExpired(new Date(Date.now() - 1000))).toBe(true);
    });

    it("should return false for future date", () => {
      expect(otpService.isOTPExpired(new Date(Date.now() + 10000))).toBe(false);
    });
  });
});
