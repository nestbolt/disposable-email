# Changelog

All notable changes to `@nestbolt/disposable-email` will be documented in this file.

## 0.3.0 — Bug Fixes & Reliability

### Fixed

- **`updateDomains()` now updates memory before writing to disk** — Previously, a disk write failure would discard fetched domains entirely. Domains are now loaded into memory first, so a storage error no longer breaks the update.
- **Whitelist entries are now case-insensitive** — Whitelist values like `MAILINATOR.COM` now correctly match `mailinator.com`.
- **`useFactory` is now required in `forRootAsync()`** — Previously optional with a non-null assertion (`!`), which would crash at runtime if omitted. Now enforced at compile time.

### Improved

- **Fetch timeout** — `DefaultFetcher` now uses `AbortController` with a configurable timeout (default 30s). Requests that hang no longer block the application indefinitely.
- **Test coverage** — Added comprehensive tests for module registration, fetcher, service error paths, and constraint fallback. 49 tests with 100% coverage across all metrics.

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
