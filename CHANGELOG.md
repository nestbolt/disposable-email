# Changelog

All notable changes to `@nestbolt/disposable-email` will be documented in this file.

## 0.2.0 — Documentation

### Added

- **LICENSE.md** — MIT license file
- **CONTRIBUTING.md** — Contribution guidelines
- **CHANGELOG.md** — Project changelog

## 0.1.0 — Initial Release

### Features

- **`@IsNotDisposableEmail()` decorator** — Block disposable email addresses in DTOs with a single decorator
- **`DisposableEmailService`** — Use the service directly for programmatic email validation
- **Subdomain matching** — Catches subdomains of known disposable domains (e.g. `abc.tempmail.com`)
- **Domain whitelisting** — Allow specific domains even if they appear on the blocklist
- **Static & async module configuration** — Supports both `forRoot()` and `forRootAsync()` registration
- **Custom fetcher support** — Bring your own domain list source
- **Built-in domains list** — Ships with a comprehensive list from [disposable/disposable](https://github.com/disposable/disposable), auto-updated monthly

### Compatibility

- NestJS 10 & 11
- Node.js 20+
- class-validator ^0.14.0
