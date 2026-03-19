import { validate } from "class-validator";
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IsNotDisposableEmail } from "../src/decorators";
import { DisposableEmailService } from "../src/disposable-email.service";
import { IsNotDisposableEmailConstraint } from "../src/validators";

class TestDto {
  @IsNotDisposableEmail()
  email!: string;
}

describe("IsNotDisposableEmail decorator", () => {
  beforeEach(() => {
    (IsNotDisposableEmailConstraint as any).fallbackDomains = null;
  });

  it("should pass for a legitimate email", async () => {
    const dto = new TestDto();
    dto.email = "user@gmail.com";

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("should fail for a disposable email", async () => {
    const dto = new TestDto();
    dto.email = "user@mailinator.com";

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty("isNotDisposableEmail");
  });

  it("should fail for a guerrillamail address", async () => {
    const dto = new TestDto();
    dto.email = "user@guerrillamail.com";

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it("should pass for non-disposable business email", async () => {
    const dto = new TestDto();
    dto.email = "info@microsoft.com";

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("should include the default error message", async () => {
    const dto = new TestDto();
    dto.email = "test@mailinator.com";

    const errors = await validate(dto);
    expect(errors[0].constraints?.isNotDisposableEmail).toBe(
      "Disposable email addresses are not allowed.",
    );
  });
});

describe("IsNotDisposableEmailConstraint", () => {
  beforeEach(() => {
    (IsNotDisposableEmailConstraint as any).fallbackDomains = null;
  });

  describe("validate with service", () => {
    it("should delegate to service.isNotDisposable when service is available", () => {
      const mockService = {
        isNotDisposable: vi.fn().mockReturnValue(true),
      } as unknown as DisposableEmailService;

      const constraint = new IsNotDisposableEmailConstraint(mockService);
      const result = constraint.validate("user@gmail.com");

      expect(result).toBe(true);
      expect(mockService.isNotDisposable).toHaveBeenCalledWith("user@gmail.com");
    });

    it("should return false via service for disposable email", () => {
      const mockService = {
        isNotDisposable: vi.fn().mockReturnValue(false),
      } as unknown as DisposableEmailService;

      const constraint = new IsNotDisposableEmailConstraint(mockService);
      const result = constraint.validate("user@mailinator.com");

      expect(result).toBe(false);
    });
  });

  describe("validate without service (fallback)", () => {
    it("should return false for non-string values", () => {
      const constraint = new IsNotDisposableEmailConstraint();
      expect(constraint.validate(123)).toBe(false);
      expect(constraint.validate(null)).toBe(false);
      expect(constraint.validate(undefined)).toBe(false);
    });

    it("should return true for invalid email format in fallback (not disposable)", () => {
      const constraint = new IsNotDisposableEmailConstraint();
      // Invalid emails are not considered disposable, so validate returns true
      expect(constraint.validate("no-at-sign")).toBe(true);
    });

    it("should use cached fallback domains on subsequent calls", () => {
      const constraint = new IsNotDisposableEmailConstraint();

      // First call loads domains from file
      const first = constraint.validate("user@mailinator.com");
      expect(first).toBe(false);

      // Second call uses the cached Set (no file read)
      const second = constraint.validate("user@gmail.com");
      expect(second).toBe(true);
    });

    // Fallback loading failure is tested in constraint-fallback-error.spec.ts
    // because mocking 'fs' requires vi.mock at the module level.
  });

  describe("defaultMessage", () => {
    it("should return the correct default message", () => {
      const constraint = new IsNotDisposableEmailConstraint();
      expect(constraint.defaultMessage()).toBe("Disposable email addresses are not allowed.");
    });
  });
});
