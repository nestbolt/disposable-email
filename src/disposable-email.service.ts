import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { isAbsolute, resolve } from "path";
import {
  BUNDLED_DOMAINS_PATH,
  DEFAULT_SOURCE_URL,
  DISPOSABLE_EMAIL_OPTIONS,
} from "./disposable-email.constants";
import { DefaultFetcher } from "./fetchers";
import { DisposableEmailOptions, Fetcher } from "./interfaces";

@Injectable()
export class DisposableEmailService implements OnModuleInit {
  private readonly logger = new Logger(DisposableEmailService.name);
  private domains: Set<string> = new Set();

  private readonly sources: string[];
  private readonly storagePath: string;
  private readonly whitelist: string[];
  private readonly includeSubdomains: boolean;
  private readonly fetcher: Fetcher;

  constructor(
    @Inject(DISPOSABLE_EMAIL_OPTIONS)
    options: DisposableEmailOptions,
  ) {
    this.sources = options.sources ?? [DEFAULT_SOURCE_URL];
    this.storagePath = this.validateStoragePath(options.storagePath);
    this.whitelist = (options.whitelist ?? []).map((d) => d.toLowerCase());
    this.includeSubdomains = options.includeSubdomains ?? false;
    this.fetcher = options.fetcher ?? new DefaultFetcher();
  }

  onModuleInit() {
    this.bootstrap();
  }

  /**
   * Loads domains from local storage (if available) or the bundled list.
   */
  bootstrap(): void {
    let domainsPath: string;

    if (this.storagePath && existsSync(this.storagePath)) {
      domainsPath = this.storagePath;
    } else {
      domainsPath = BUNDLED_DOMAINS_PATH;
    }

    try {
      const raw = readFileSync(domainsPath, "utf-8");
      const data: string[] = JSON.parse(raw);
      const whiteSet = new Set(this.whitelist);
      this.domains = new Set(data.filter((d) => !whiteSet.has(d)));
      this.logger.log(`Loaded ${this.domains.size} disposable domains`);
    } catch (error) {
      this.logger.error("Failed to load disposable domains", error);
    }
  }

  /**
   * Checks whether the email's domain is disposable.
   */
  isDisposable(email: string): boolean {
    const domain = this.extractDomain(email);
    if (!domain) return false;

    if (this.domains.has(domain)) {
      return true;
    }

    if (this.includeSubdomains) {
      for (const root of this.domains) {
        if (domain.endsWith("." + root)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks whether the email's domain is NOT disposable.
   */
  isNotDisposable(email: string): boolean {
    return !this.isDisposable(email);
  }

  /**
   * Returns the loaded disposable domains.
   */
  getDomains(): string[] {
    return Array.from(this.domains);
  }

  /**
   * Fetches fresh domains from configured sources and updates storage.
   */
  async updateDomains(): Promise<void> {
    this.logger.log("Fetching disposable domains from sources...");

    let allDomains: string[] = [];

    for (const source of this.sources) {
      try {
        const domains = await this.fetcher.fetch(source);
        allDomains = [...allDomains, ...domains];
      } catch (error) {
        this.logger.error(`Failed to fetch from ${source}`, error);
      }
    }

    allDomains = [...new Set(allDomains)];

    const whiteSet = new Set(this.whitelist);
    this.domains = new Set(allDomains.filter((d) => !whiteSet.has(d)));
    this.logger.log(`Disposable domains updated: ${this.domains.size} entries`);

    if (this.storagePath) {
      try {
        writeFileSync(this.storagePath, JSON.stringify(allDomains));
        this.logger.log(`Saved ${allDomains.length} domains to ${this.storagePath}`);
      } catch (error) {
        this.logger.error(`Failed to write to ${this.storagePath}`, error);
      }
    }
  }

  private extractDomain(email: string): string | null {
    const parts = email.split("@");
    if (parts.length !== 2 || !parts[1]) return null;
    return parts[1].toLowerCase();
  }

  private validateStoragePath(raw?: string): string {
    if (!raw) return "";

    const resolved = isAbsolute(raw) ? raw : resolve(raw);

    if (!resolved.endsWith(".json")) {
      throw new Error(`Invalid storagePath "${resolved}": must end with .json`);
    }

    return resolved;
  }
}
