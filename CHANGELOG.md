# Changelog

All notable changes to `@nestbolt/disposable-email` will be documented in this file.

## 1.0.0 — Stable Release

### Fixed

- **`storagePath` validation** — Must end with `.json`. Relative paths are resolved to absolute. Invalid paths throw immediately at construction time.

### Performance

- **Subdomain matching is now O(k) instead of O(n)** — Previously looped through all 72K domains per validation. Now walks up the input domain's parent labels with Set lookups (2-4 checks vs 72,000).
- **Async bootstrap** — `bootstrap()` now uses async file I/O (`fs/promises`) instead of `readFileSync`, no longer blocking the event loop during startup.

### Added

- **ESLint & Prettier** — Full linting and formatting with `typescript-eslint` and Prettier integration. New scripts: `lint`, `lint:fix`, `format`.
- **`.npmignore`** — Explicit control over published package contents. Only `dist/`, `domains.json`, and documentation files ship to npm.
- **`package.json` metadata** — Added `exports`, `homepage`, `bugs`, `author`, and `engines` fields.

### Reliability

- **Update-domains workflow validation** — Downloaded `domains.json` is now verified (valid JSON, array with 50K+ entries, file size 500KB+) before committing.
- **Release workflow package verification** — Checks that `domains.json`, `dist/index.js`, and `dist/index.d.ts` are included before publishing.

### Changed

- TypeScript target bumped from ES2021 to ES2022 (required for `Error` cause option, safe for Node 20+).

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
