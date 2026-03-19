import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { DisposableEmailService } from "../src/disposable-email.service";
import { DISPOSABLE_EMAIL_OPTIONS } from "../src/disposable-email.constants";
import { DisposableEmailOptions } from "../src/interfaces";
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { Fetcher } from "../src/interfaces/fetcher.interface";

describe("DisposableEmailService", () => {
  let service: DisposableEmailService;

  async function createService(
    options: DisposableEmailOptions = {},
  ): Promise<DisposableEmailService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DISPOSABLE_EMAIL_OPTIONS,
          useValue: options,
        },
        DisposableEmailService,
      ],
    }).compile();

    const svc = module.get<DisposableEmailService>(DisposableEmailService);
    svc.bootstrap();
    return svc;
  }

  beforeEach(async () => {
    service = await createService();
  });

  describe("isDisposable", () => {
    it("should detect a known disposable domain", () => {
      expect(service.isDisposable("user@mailinator.com")).toBe(true);
    });

    it("should detect disposable domains case-insensitively", () => {
      expect(service.isDisposable("user@MAILINATOR.COM")).toBe(true);
    });

    it("should allow a legitimate email domain", () => {
      expect(service.isDisposable("user@gmail.com")).toBe(false);
    });

    it("should return false for invalid email (no @)", () => {
      expect(service.isDisposable("not-an-email")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(service.isDisposable("")).toBe(false);
    });
  });

  describe("isNotDisposable", () => {
    it("should return true for legitimate emails", () => {
      expect(service.isNotDisposable("user@gmail.com")).toBe(true);
    });

    it("should return false for disposable emails", () => {
      expect(service.isNotDisposable("user@mailinator.com")).toBe(false);
    });
  });

  describe("whitelist", () => {
    it("should allow whitelisted domains even if they are in the disposable list", async () => {
      const svc = await createService({
        whitelist: ["mailinator.com"],
      });

      expect(svc.isDisposable("user@mailinator.com")).toBe(false);
    });

    it("should normalize whitelist entries to lowercase", async () => {
      const svc = await createService({
        whitelist: ["MAILINATOR.COM", "Guerrillamail.Com"],
      });

      expect(svc.isDisposable("user@mailinator.com")).toBe(false);
      expect(svc.isDisposable("user@guerrillamail.com")).toBe(false);
    });
  });

  describe("includeSubdomains", () => {
    it("should not match subdomains by default", async () => {
      const svc = await createService({ includeSubdomains: false });
      expect(svc.isDisposable("user@sub.mailinator.com")).toBe(false);
    });

    it("should match subdomains when enabled", async () => {
      const svc = await createService({ includeSubdomains: true });
      expect(svc.isDisposable("user@sub.mailinator.com")).toBe(true);
    });
  });

  describe("getDomains", () => {
    it("should return a non-empty array of domains", () => {
      const domains = service.getDomains();
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
    });
  });

  describe("onModuleInit", () => {
    it("should call bootstrap on module init", async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: DISPOSABLE_EMAIL_OPTIONS,
            useValue: {},
          },
          DisposableEmailService,
        ],
      }).compile();

      const svc = module.get<DisposableEmailService>(DisposableEmailService);
      const bootstrapSpy = vi.spyOn(svc, "bootstrap");

      svc.onModuleInit();

      expect(bootstrapSpy).toHaveBeenCalled();
    });
  });

  describe("storagePath validation", () => {
    it("should accept a valid .json path", async () => {
      const svc = await createService({
        storagePath: "/tmp/domains.json",
      });
      expect(svc).toBeDefined();
    });

    it("should reject a path that does not end with .json", () => {
      expect(createService({ storagePath: "/etc/passwd" })).rejects.toThrow(
        'Invalid storagePath "/etc/passwd": must end with .json',
      );
    });

    it("should reject a path ending with other extensions", () => {
      expect(createService({ storagePath: "/tmp/domains.txt" })).rejects.toThrow(
        "must end with .json",
      );
    });

    it("should resolve relative paths", async () => {
      const svc = await createService({
        storagePath: "./data/domains.json",
      });
      expect(svc).toBeDefined();
    });

    it("should allow empty/undefined storagePath", async () => {
      const svc = await createService({});
      expect(svc).toBeDefined();
    });
  });

  describe("bootstrap with storagePath", () => {
    const tmpDir = join(__dirname, "__tmp__");
    const tmpFile = join(tmpDir, "test-domains.json");

    beforeEach(() => {
      if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
    });

    it("should load domains from storagePath when file exists", async () => {
      writeFileSync(tmpFile, JSON.stringify(["custom.com", "test.org"]));

      const svc = await createService({ storagePath: tmpFile });

      expect(svc.isDisposable("user@custom.com")).toBe(true);
      expect(svc.isDisposable("user@test.org")).toBe(true);
      expect(svc.getDomains()).toHaveLength(2);
    });

    it("should fall back to bundled domains when storagePath does not exist", async () => {
      const svc = await createService({
        storagePath: "/nonexistent/path/domains.json",
      });

      expect(svc.getDomains().length).toBeGreaterThan(0);
      expect(svc.isDisposable("user@mailinator.com")).toBe(true);
    });
  });

  describe("bootstrap error handling", () => {
    it("should handle corrupt JSON gracefully", async () => {
      vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

      const tmpDir = join(__dirname, "__tmp__");
      const tmpFile = join(tmpDir, "bad-domains.json");

      if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
      writeFileSync(tmpFile, "not valid json{{{");

      const svc = await createService({ storagePath: tmpFile });

      expect(svc.getDomains()).toHaveLength(0);

      rmSync(tmpDir, { recursive: true });
      vi.restoreAllMocks();
    });
  });

  describe("updateDomains", () => {
    const tmpDir = join(__dirname, "__tmp__");
    const tmpFile = join(tmpDir, "update-domains.json");

    afterEach(() => {
      if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
    });

    it("should fetch domains from sources and update the internal set", async () => {
      const mockFetcher: Fetcher = {
        fetch: vi.fn().mockResolvedValue(["fetched1.com", "fetched2.com"]),
      };

      const svc = await createService({
        fetcher: mockFetcher,
        sources: ["https://example.com/domains.json"],
      });

      await svc.updateDomains();

      expect(svc.isDisposable("user@fetched1.com")).toBe(true);
      expect(svc.isDisposable("user@fetched2.com")).toBe(true);
      expect(mockFetcher.fetch).toHaveBeenCalledWith("https://example.com/domains.json");
    });

    it("should deduplicate domains from multiple sources", async () => {
      const mockFetcher: Fetcher = {
        fetch: vi
          .fn()
          .mockResolvedValueOnce(["dup.com", "unique1.com"])
          .mockResolvedValueOnce(["dup.com", "unique2.com"]),
      };

      const svc = await createService({
        fetcher: mockFetcher,
        sources: ["https://source1.com", "https://source2.com"],
      });

      await svc.updateDomains();

      expect(svc.getDomains()).toHaveLength(3);
    });

    it("should apply whitelist when updating domains", async () => {
      const mockFetcher: Fetcher = {
        fetch: vi.fn().mockResolvedValue(["blocked.com", "allowed.com"]),
      };

      const svc = await createService({
        fetcher: mockFetcher,
        whitelist: ["allowed.com"],
        sources: ["https://example.com"],
      });

      await svc.updateDomains();

      expect(svc.isDisposable("user@blocked.com")).toBe(true);
      expect(svc.isDisposable("user@allowed.com")).toBe(false);
    });

    it("should save domains to storagePath when configured", async () => {
      if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

      const mockFetcher: Fetcher = {
        fetch: vi.fn().mockResolvedValue(["saved.com"]),
      };

      const svc = await createService({
        fetcher: mockFetcher,
        storagePath: tmpFile,
        sources: ["https://example.com"],
      });

      await svc.updateDomains();

      expect(existsSync(tmpFile)).toBe(true);
      const saved = JSON.parse(readFileSync(tmpFile, "utf-8"));
      expect(saved).toEqual(["saved.com"]);
    });

    it("should not write to disk when storagePath is not set", async () => {
      const mockFetcher: Fetcher = {
        fetch: vi.fn().mockResolvedValue(["nodisk.com"]),
      };

      const svc = await createService({
        fetcher: mockFetcher,
        sources: ["https://example.com"],
      });

      await svc.updateDomains();

      expect(svc.isDisposable("user@nodisk.com")).toBe(true);
    });

    it("should handle fetch errors gracefully and continue", async () => {
      vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

      const mockFetcher: Fetcher = {
        fetch: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce(["good.com"]),
      };

      const svc = await createService({
        fetcher: mockFetcher,
        sources: ["https://bad.com", "https://good.com"],
      });

      await svc.updateDomains();

      expect(svc.isDisposable("user@good.com")).toBe(true);
      vi.restoreAllMocks();
    });

    it("should handle write errors gracefully and still update memory", async () => {
      vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

      const mockFetcher: Fetcher = {
        fetch: vi.fn().mockResolvedValue(["domain.com"]),
      };

      const svc = await createService({
        fetcher: mockFetcher,
        storagePath: "/nonexistent/dir/file.json",
        sources: ["https://example.com"],
      });

      // Should not throw - error is logged
      await svc.updateDomains();

      // Domains SHOULD be updated in memory even when write fails
      expect(svc.isDisposable("user@domain.com")).toBe(true);
      vi.restoreAllMocks();
    });
  });
});
