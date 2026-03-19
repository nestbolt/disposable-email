import { describe, it, expect } from "vitest";
import { Test } from "@nestjs/testing";
import { DisposableEmailModule } from "../src/disposable-email.module";
import { DisposableEmailService } from "../src/disposable-email.service";
import { IsNotDisposableEmailConstraint } from "../src/validators";

describe("DisposableEmailModule", () => {
  describe("forRoot", () => {
    it("should create a module with default options", async () => {
      const module = await Test.createTestingModule({
        imports: [DisposableEmailModule.forRoot()],
      }).compile();

      const service = module.get(DisposableEmailService);
      const constraint = module.get(IsNotDisposableEmailConstraint);

      expect(service).toBeDefined();
      expect(constraint).toBeDefined();
    });

    it("should create a module with custom options", async () => {
      const module = await Test.createTestingModule({
        imports: [
          DisposableEmailModule.forRoot({
            whitelist: ["mailinator.com"],
            includeSubdomains: true,
          }),
        ],
      }).compile();

      const service = module.get(DisposableEmailService);
      service.bootstrap();

      expect(service.isDisposable("user@mailinator.com")).toBe(false);
    });

    it("should return a global dynamic module", () => {
      const result = DisposableEmailModule.forRoot();

      expect(result.global).toBe(true);
      expect(result.module).toBe(DisposableEmailModule);
      expect(result.exports).toContain(DisposableEmailService);
      expect(result.exports).toContain(IsNotDisposableEmailConstraint);
    });
  });

  describe("forRootAsync", () => {
    it("should create a module with async factory", async () => {
      const module = await Test.createTestingModule({
        imports: [
          DisposableEmailModule.forRootAsync({
            useFactory: () => ({
              whitelist: ["mailinator.com"],
            }),
          }),
        ],
      }).compile();

      const service = module.get(DisposableEmailService);
      service.bootstrap();

      expect(service).toBeDefined();
      expect(service.isDisposable("user@mailinator.com")).toBe(false);
    });

    it("should support inject and imports options", () => {
      const result = DisposableEmailModule.forRootAsync({
        imports: [],
        inject: ["CONFIG"],
        useFactory: () => ({}),
      });

      expect(result.global).toBe(true);
      expect(result.module).toBe(DisposableEmailModule);
      expect(result.exports).toContain(DisposableEmailService);
    });

    it("should default imports and inject to empty arrays", () => {
      const result = DisposableEmailModule.forRootAsync({
        useFactory: () => ({}),
      });

      expect(result.imports).toEqual([]);
    });
  });
});
