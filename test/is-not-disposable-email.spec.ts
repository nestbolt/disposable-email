import { describe, it, expect, beforeEach } from 'vitest';
import 'reflect-metadata';
import { validate } from 'class-validator';
import { IsNotDisposableEmail } from '../src/decorators';
import { IsNotDisposableEmailConstraint } from '../src/validators';

class TestDto {
  @IsNotDisposableEmail()
  email!: string;
}

describe('IsNotDisposableEmail decorator', () => {
  beforeEach(() => {
    (IsNotDisposableEmailConstraint as any).fallbackDomains = null;
  });

  it('should pass for a legitimate email', async () => {
    const dto = new TestDto();
    dto.email = 'user@gmail.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail for a disposable email', async () => {
    const dto = new TestDto();
    dto.email = 'user@mailinator.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNotDisposableEmail');
  });

  it('should fail for a guerrillamail address', async () => {
    const dto = new TestDto();
    dto.email = 'user@guerrillamail.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should pass for non-disposable business email', async () => {
    const dto = new TestDto();
    dto.email = 'info@microsoft.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should include the default error message', async () => {
    const dto = new TestDto();
    dto.email = 'test@mailinator.com';

    const errors = await validate(dto);
    expect(errors[0].constraints?.isNotDisposableEmail).toBe(
      'Disposable email addresses are not allowed.',
    );
  });
});
