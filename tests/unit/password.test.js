import { hashPassword, comparePassword } from "../../utils/password.js";

describe("Password Utility Unit Tests", () => {
  const password = "Password@123";

  test("should hash a password correctly", async () => {
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2a$")).toBe(true); // Default bcrypt prefix
  });

  test("should return true for the correct password", async () => {
    const hash = await hashPassword(password);
    const result = await comparePassword(password, hash);
    expect(result).toBe(true);
  });

  test("should return false for the incorrect password", async () => {
    const hash = await hashPassword(password);
    const result = await comparePassword("WrongPassword", hash);
    expect(result).toBe(false);
  });
});
