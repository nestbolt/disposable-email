import { Fetcher } from './fetcher.interface';

export interface DisposableEmailOptions {
  /**
   * Source URLs yielding JSON arrays of disposable domains.
   * Defaults to the disposable/disposable-email-domains repository via jsDelivr.
   */
  sources?: string[];

  /**
   * Local file path to store fetched domains.
   * When set, updateDomains() saves here and bootstrap() reads from here first.
   */
  storagePath?: string;

  /**
   * Domains to exclude from the disposable list (allow through validation).
   */
  whitelist?: string[];

  /**
   * When true, subdomains of disposable domains are also rejected.
   * e.g. "sub.mailinator.com" is disposable if "mailinator.com" is listed.
   * @default false
   */
  includeSubdomains?: boolean;

  /**
   * Custom fetcher implementation. Defaults to native fetch().
   */
  fetcher?: Fetcher;
}

export interface DisposableEmailAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory?: (
    ...args: any[]
  ) => Promise<DisposableEmailOptions> | DisposableEmailOptions;
}
