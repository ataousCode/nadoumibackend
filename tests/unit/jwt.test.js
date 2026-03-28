import { jest } from "@jest/globals";
import { generateToken, verifyToken } from "../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../../utils/errors.js";

describe("JWT Utility Unit Tests", () => {
  const payload = { id: "123", email: "test@example.com", type: "student" };

  test("should generate a valid token", () => {
    const token = generateToken(payload);
    expect(typeof token).toBe("string");
    const decoded = jwt.decode(token);
    expect(decoded).toMatchObject(payload);
  });

  test("should verify a valid token", () => {
    const token = generateToken(payload);
    const result = verifyToken(token);
    expect(result).toMatchObject(payload);
  });

  test("should throw AuthenticationError for invalid token", () => {
    expect(() => verifyToken("invalid-token")).toThrow(AuthenticationError);
    expect(() => verifyToken("invalid-token")).toThrow("Invalid token");
  });

  test("should throw AuthenticationError for expired token", () => {
    // Generate a token that is already expired
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "-1h",
    });
    expect(() => verifyToken(token)).toThrow(AuthenticationError);
    expect(() => verifyToken(token)).toThrow("Token expired");
  });
});
