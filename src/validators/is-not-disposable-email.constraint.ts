import { Injectable, Optional } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { readFileSync } from 'fs';
import { BUNDLED_DOMAINS_PATH } from '../disposable-email.constants';
import { DisposableEmailService } from '../disposable-email.service';

@ValidatorConstraint({ name: 'isNotDisposableEmail', async: false })
@Injectable()
export class IsNotDisposableEmailConstraint
  implements ValidatorConstraintInterface
{
  /**
   * Fallback domain set for standalone usage (without NestJS module).
   */
  private static fallbackDomains: Set<string> | null = null;

  constructor(
    @Optional() private readonly service?: DisposableEmailService,
  ) {}

  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;

    if (this.service) {
      return this.service.isNotDisposable(value);
    }

    // Fallback: load bundled domains directly (no NestJS module required)
    return !this.isDisposableFallback(value);
  }

  defaultMessage(): string {
    return 'Disposable email addresses are not allowed.';
  }

  private isDisposableFallback(email: string): boolean {
    if (!IsNotDisposableEmailConstraint.fallbackDomains) {
      try {
        const raw = readFileSync(BUNDLED_DOMAINS_PATH, 'utf-8');
        IsNotDisposableEmailConstraint.fallbackDomains = new Set(
          JSON.parse(raw),
        );
      } catch {
        return false;
      }
    }

    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1]) return false;
    const domain = parts[1].toLowerCase();

    return IsNotDisposableEmailConstraint.fallbackDomains!.has(domain);
  }
}
