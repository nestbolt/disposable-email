import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultFetcher } from '../src/fetchers/default.fetcher';

describe('DefaultFetcher', () => {
  let fetcher: DefaultFetcher;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    fetcher = new DefaultFetcher();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch and return a domain array', async () => {
    const mockDomains = ['mailinator.com', 'tempmail.com'];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDomains),
    });

    const result = await fetcher.fetch('https://example.com/domains.json');

    expect(result).toEqual(mockDomains);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com/domains.json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should throw if url is empty', async () => {
    await expect(fetcher.fetch('')).rejects.toThrow('Source URL is empty');
  });

  it('should throw if response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      fetcher.fetch('https://example.com/missing.json'),
    ).rejects.toThrow('Failed to fetch from https://example.com/missing.json: 404 Not Found');
  });

  it('should throw if response is not a JSON array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ not: 'an array' }),
    });

    await expect(
      fetcher.fetch('https://example.com/bad.json'),
    ).rejects.toThrow('Source did not return a JSON array (got object)');
  });

  it('should use default timeout of 30s', () => {
    const f = new DefaultFetcher();
    expect((f as any).timeoutMs).toBe(30_000);
  });

  it('should accept a custom timeout', () => {
    const f = new DefaultFetcher(5000);
    expect((f as any).timeoutMs).toBe(5000);
  });

  it('should throw a timeout error when request exceeds timeout', async () => {
    const fastFetcher = new DefaultFetcher(1);

    globalThis.fetch = vi.fn().mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );

    await expect(
      fastFetcher.fetch('https://example.com/slow'),
    ).rejects.toThrow('Request to https://example.com/slow timed out after 1ms');
  });

  it('should re-throw non-abort errors as-is', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('DNS failure'));

    await expect(
      fetcher.fetch('https://example.com/fail'),
    ).rejects.toThrow('DNS failure');
  });
});
