export interface Fetcher {
  fetch(url: string): Promise<string[]>;
}
