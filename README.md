<p align="center">
    <h1 align="center">@nestbolt/disposable-email</h1>
    <p align="center">Block disposable email addresses in your NestJS application with a single decorator.</p>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@nestbolt/disposable-email"><img src="https://img.shields.io/npm/v/@nestbolt/disposable-email.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@nestbolt/disposable-email"><img src="https://img.shields.io/npm/dt/@nestbolt/disposable-email.svg?style=flat-square" alt="npm downloads"></a>
    <a href="https://github.com/nestbolt/disposable-email/actions"><img src="https://img.shields.io/github/actions/workflow/status/nestbolt/disposable-email/tests.yml?branch=main&style=flat-square&label=tests" alt="tests"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="license"></a>
</p>

<hr>

This package provides a **class-validator** decorator for [NestJS](https://nestjs.com) that validates email addresses against a comprehensive list of known disposable email services such as `Mailinator`, `Guerrillamail`, `Tempmail`, and thousands more.

Once installed, blocking disposable emails is as simple as adding a decorator to your DTO:

```typescript
import { IsNotDisposableEmail } from '@nestbolt/disposable-email';

class CreateUserDto {
  @IsEmail()
  @IsNotDisposableEmail()
  email: string;
}
```

Uses the disposable domains list from [disposable/disposable](https://github.com/disposable/disposable) by default — the same trusted source used by many other packages across different ecosystems.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Module Configuration](#module-configuration)
  - [Static Configuration (forRoot)](#static-configuration-forroot)
  - [Async Configuration (forRootAsync)](#async-configuration-forrootasync)
- [Using the Decorator](#using-the-decorator)
- [Using the Service Directly](#using-the-service-directly)
- [Configuration Options](#configuration-options)
- [Features](#features)
  - [Subdomain Matching](#subdomain-matching)
  - [Whitelisting Domains](#whitelisting-domains)
  - [Custom Fetcher](#custom-fetcher)
  - [Updating the Domains List](#updating-the-domains-list)
- [Standalone Usage](#standalone-usage)
- [Testing](#testing)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [Security](#security)
- [Credits](#credits)
- [License](#license)

## Installation

Install the package via npm:

```bash
npm install @nestbolt/disposable-email
```

Or via yarn:

```bash
yarn add @nestbolt/disposable-email
```

Or via pnpm:

```bash
pnpm add @nestbolt/disposable-email
```

### Peer Dependencies

This package requires the following peer dependencies, which you likely already have in a NestJS project:

```
@nestjs/common ^10.0.0 || ^11.0.0
@nestjs/core   ^10.0.0 || ^11.0.0
class-validator ^0.14.0
class-transformer ^0.5.0
reflect-metadata ^0.1.13 || ^0.2.0
```

## Quick Start

**1.** Register the module in your `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { DisposableEmailModule } from '@nestbolt/disposable-email';

@Module({
  imports: [
    DisposableEmailModule.forRoot(),
  ],
})
export class AppModule {}
```

**2.** Enable class-validator's DI container in `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable class-validator to use NestJS DI container
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(3000);
}
bootstrap();
```

**3.** Use the `@IsNotDisposableEmail()` decorator in your DTOs:

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';
import { IsNotDisposableEmail } from '@nestbolt/disposable-email';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @IsNotDisposableEmail()
  email: string;

  @IsNotEmpty()
  name: string;
}
```

That's it! Any request with a disposable email will now receive a `400 Bad Request` response with the validation error:

```json
{
  "statusCode": 400,
  "message": ["Disposable email addresses are not allowed."],
  "error": "Bad Request"
}
```

## Module Configuration

### Static Configuration (forRoot)

Pass options directly to `forRoot()`:

```typescript
import { Module } from '@nestjs/common';
import { DisposableEmailModule } from '@nestbolt/disposable-email';

@Module({
  imports: [
    DisposableEmailModule.forRoot({
      whitelist: ['example.com', 'mycompany.com'],
      includeSubdomains: true,
      storagePath: './storage/disposable_domains.json',
      sources: [
        'https://cdn.jsdelivr.net/gh/disposable/disposable-email-domains@master/domains.json',
      ],
    }),
  ],
})
export class AppModule {}
```

### Async Configuration (forRootAsync)

Use `forRootAsync()` when your configuration depends on other services, such as `ConfigService`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DisposableEmailModule } from '@nestbolt/disposable-email';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DisposableEmailModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        whitelist: config.get<string>('DISPOSABLE_WHITELIST', '').split(',').filter(Boolean),
        includeSubdomains: config.get<boolean>('DISPOSABLE_INCLUDE_SUBDOMAINS', false),
        storagePath: config.get<string>('DISPOSABLE_STORAGE_PATH', ''),
      }),
    }),
  ],
})
export class AppModule {}
```

> **Note:** The module is registered as **global** by default, so you only need to import it once in your root module. The `DisposableEmailService` and the decorator will be available throughout your entire application.

## Using the Decorator

The `@IsNotDisposableEmail()` decorator works just like any other **class-validator** decorator. You can combine it with other validators and customize the error message:

```typescript
import { IsEmail } from 'class-validator';
import { IsNotDisposableEmail } from '@nestbolt/disposable-email';

export class RegisterDto {
  @IsEmail()
  @IsNotDisposableEmail({
    message: 'Please use a permanent email address to register.',
  })
  email: string;
}
```

### With Validation Groups

```typescript
export class UpdateProfileDto {
  @IsEmail()
  @IsNotDisposableEmail({ groups: ['registration'] })
  email: string;
}
```

## Using the Service Directly

You can also inject `DisposableEmailService` anywhere in your application for programmatic checks:

```typescript
import { Injectable } from '@nestjs/common';
import { DisposableEmailService } from '@nestbolt/disposable-email';

@Injectable()
export class UsersService {
  constructor(private readonly disposableEmail: DisposableEmailService) {}

  async createUser(email: string) {
    if (this.disposableEmail.isDisposable(email)) {
      throw new BadRequestException('Disposable emails are not allowed');
    }

    // ... create the user
  }
}
```

### Available Service Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `isDisposable(email)` | `boolean` | Returns `true` if the email's domain is disposable |
| `isNotDisposable(email)` | `boolean` | Returns `true` if the email's domain is **not** disposable |
| `getDomains()` | `string[]` | Returns the full list of loaded disposable domains |
| `updateDomains()` | `Promise<void>` | Fetches fresh domains from the configured sources |
| `bootstrap()` | `void` | Reloads domains from local storage or the bundled list |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sources` | `string[]` | jsDelivr CDN URL | Source URLs returning JSON arrays of disposable domains |
| `storagePath` | `string` | `''` | Local file path to persist fetched domains. When empty, only the bundled list is used |
| `whitelist` | `string[]` | `[]` | Domains to exclude from the disposable list (allow through validation) |
| `includeSubdomains` | `boolean` | `false` | When `true`, subdomains of disposable domains are also rejected |
| `fetcher` | `Fetcher` | `DefaultFetcher` | Custom fetcher implementation for retrieving domain lists |

## Features

### Subdomain Matching

By default, only exact domain matches are checked. Enable `includeSubdomains` to also catch subdomains of known disposable domains:

```typescript
DisposableEmailModule.forRoot({
  includeSubdomains: true,
})
```

With this enabled:
- `user@mailinator.com` → **blocked** (exact match)
- `user@sub.mailinator.com` → **blocked** (subdomain match)
- `user@gmail.com` → **allowed**

### Whitelisting Domains

If a domain appears in the disposable list but you want to allow it, add it to the whitelist:

```typescript
DisposableEmailModule.forRoot({
  whitelist: ['example.com', 'legitimate-service.com'],
})
```

Whitelisted domains are removed from the disposable set at load time, so there is no per-validation overhead.

### Custom Fetcher

By default, the package uses the native `fetch()` API to retrieve domain lists. If your application runs behind a proxy or needs custom headers, implement the `Fetcher` interface:

```typescript
import { Fetcher } from '@nestbolt/disposable-email';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class ProxyFetcher implements Fetcher {
  async fetch(url: string): Promise<string[]> {
    const response = await fetch(url, {
      agent: new HttpsProxyAgent('http://your-proxy:8080'),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    return response.json();
  }
}
```

Then pass it in the module configuration:

```typescript
DisposableEmailModule.forRoot({
  fetcher: new ProxyFetcher(),
})
```

### Updating the Domains List

The package ships with a bundled `domains.json` containing thousands of known disposable domains. To keep this list fresh, call `updateDomains()` on a schedule.

#### With a Cron Job (using `@nestjs/schedule`)

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DisposableEmailService } from '@nestbolt/disposable-email';

@Injectable()
export class DomainsUpdateTask {
  constructor(private readonly disposableEmail: DisposableEmailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    await this.disposableEmail.updateDomains();
  }
}
```

#### From a Controller / Admin Endpoint

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { DisposableEmailService } from '@nestbolt/disposable-email';

@Controller('admin')
export class AdminController {
  constructor(private readonly disposableEmail: DisposableEmailService) {}

  @Post('update-disposable-domains')
  @UseGuards(AdminGuard)
  async updateDomains() {
    await this.disposableEmail.updateDomains();
    return { message: 'Disposable domains list updated successfully' };
  }
}
```

> **Tip:** Set a `storagePath` in your configuration so that fetched domains are persisted to disk. This way your application will use the updated list even after a restart, without needing to re-fetch.

## Standalone Usage

The `@IsNotDisposableEmail()` decorator also works **without** registering the NestJS module. In this mode, it falls back to the bundled `domains.json` list directly:

```typescript
import { validate } from 'class-validator';
import { IsNotDisposableEmail } from '@nestbolt/disposable-email';

class EmailDto {
  @IsNotDisposableEmail()
  email: string;
}

const dto = new EmailDto();
dto.email = 'user@mailinator.com';

const errors = await validate(dto);
// errors[0].constraints.isNotDisposableEmail === 'Disposable email addresses are not allowed.'
```

> **Note:** Standalone mode does not support whitelist, subdomain matching, or custom fetchers. For the full feature set, register the `DisposableEmailModule`.

## Testing

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:cov
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security

If you discover any security-related issues, please report them via [GitHub Issues](https://github.com/nestbolt/disposable-email/issues) with the **security** label instead of using the public issue tracker.

## Credits

- Disposable domains list from [disposable/disposable](https://github.com/disposable/disposable)
- Inspired by [Laravel Disposable Email](https://github.com/Propaganistas/Laravel-Disposable-Email) by [Propaganistas](https://github.com/Propaganistas)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
