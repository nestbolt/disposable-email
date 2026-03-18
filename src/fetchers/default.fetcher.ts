import { Fetcher } from '../interfaces';

export class DefaultFetcher implements Fetcher {
  async fetch(url: string): Promise<string[]> {
    if (!url) {
      throw new Error('Source URL is empty');
    }

    const response = await globalThis.fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from ${url}: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        `Source did not return a JSON array (got ${typeof data})`,
      );
    }

    return data;
  }
}
