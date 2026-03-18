import { DynamicModule, Module } from '@nestjs/common';
import { DISPOSABLE_EMAIL_OPTIONS } from './disposable-email.constants';
import { DisposableEmailService } from './disposable-email.service';
import {
  DisposableEmailAsyncOptions,
  DisposableEmailOptions,
} from './interfaces';
import { IsNotDisposableEmailConstraint } from './validators';

@Module({})
export class DisposableEmailModule {
  /**
   * Register the module with static options.
   *
   * @example
   * DisposableEmailModule.forRoot({
   *   whitelist: ['example.com'],
   *   includeSubdomains: true,
   * })
   */
  static forRoot(options: DisposableEmailOptions = {}): DynamicModule {
    return {
      module: DisposableEmailModule,
      global: true,
      providers: [
        {
          provide: DISPOSABLE_EMAIL_OPTIONS,
          useValue: options,
        },
        DisposableEmailService,
        IsNotDisposableEmailConstraint,
      ],
      exports: [DisposableEmailService, IsNotDisposableEmailConstraint],
    };
  }

  /**
   * Register the module with async/dynamic options (e.g. from ConfigService).
   *
   * @example
   * DisposableEmailModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     whitelist: config.get('DISPOSABLE_WHITELIST', '').split(','),
   *   }),
   * })
   */
  static forRootAsync(options: DisposableEmailAsyncOptions): DynamicModule {
    return {
      module: DisposableEmailModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DISPOSABLE_EMAIL_OPTIONS,
          useFactory: options.useFactory!,
          inject: options.inject ?? [],
        },
        DisposableEmailService,
        IsNotDisposableEmailConstraint,
      ],
      exports: [DisposableEmailService, IsNotDisposableEmailConstraint],
    };
  }
}
