import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DisposableEmailService } from '../src/disposable-email.service';
import { DISPOSABLE_EMAIL_OPTIONS } from '../src/disposable-email.constants';
import { DisposableEmailOptions } from '../src/interfaces';

describe('DisposableEmailService', () => {
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

  describe('isDisposable', () => {
    it('should detect a known disposable domain', () => {
      expect(service.isDisposable('user@mailinator.com')).toBe(true);
    });

    it('should detect disposable domains case-insensitively', () => {
      expect(service.isDisposable('user@MAILINATOR.COM')).toBe(true);
    });

    it('should allow a legitimate email domain', () => {
      expect(service.isDisposable('user@gmail.com')).toBe(false);
    });

    it('should return false for invalid email (no @)', () => {
      expect(service.isDisposable('not-an-email')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.isDisposable('')).toBe(false);
    });
  });

  describe('isNotDisposable', () => {
    it('should return true for legitimate emails', () => {
      expect(service.isNotDisposable('user@gmail.com')).toBe(true);
    });

    it('should return false for disposable emails', () => {
      expect(service.isNotDisposable('user@mailinator.com')).toBe(false);
    });
  });

  describe('whitelist', () => {
    it('should allow whitelisted domains even if they are in the disposable list', async () => {
      const svc = await createService({
        whitelist: ['mailinator.com'],
      });

      expect(svc.isDisposable('user@mailinator.com')).toBe(false);
    });
  });

  describe('includeSubdomains', () => {
    it('should not match subdomains by default', async () => {
      const svc = await createService({ includeSubdomains: false });
      expect(svc.isDisposable('user@sub.mailinator.com')).toBe(false);
    });

    it('should match subdomains when enabled', async () => {
      const svc = await createService({ includeSubdomains: true });
      expect(svc.isDisposable('user@sub.mailinator.com')).toBe(true);
    });
  });

  describe('getDomains', () => {
    it('should return a non-empty array of domains', () => {
      const domains = service.getDomains();
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});
