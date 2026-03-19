import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'reflect-metadata';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: vi.fn().mockImplementation(() => {
      throw new Error('File not found');
    }),
  };
});

import { IsNotDisposableEmailConstraint } from '../src/validators';

describe('IsNotDisposableEmailConstraint fallback error', () => {
  beforeEach(() => {
    (IsNotDisposableEmailConstraint as any).fallbackDomains = null;
  });

  it('should return true (not disposable) when bundled domains fail to load', () => {
    const constraint = new IsNotDisposableEmailConstraint();
    const result = constraint.validate('user@mailinator.com');

    // When file loading fails, isDisposableFallback returns false (not disposable)
    // so validate returns !false = true
    expect(result).toBe(true);
  });
});
