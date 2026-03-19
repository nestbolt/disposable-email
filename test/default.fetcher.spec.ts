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
});
