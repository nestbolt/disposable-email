import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsNotDisposableEmailConstraint } from '../validators';

/**
 * Validates that an email address does not belong to a disposable email service.
 *
 * @example
 * class CreateUserDto {
 *   @IsEmail()
 *   @IsNotDisposableEmail()
 *   email: string;
 * }
 */
export function IsNotDisposableEmail(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: {
        message: 'Disposable email addresses are not allowed.',
        ...validationOptions,
      },
      validator: IsNotDisposableEmailConstraint,
    });
  };
}
