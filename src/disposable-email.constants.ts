import { join } from "path";

export const DISPOSABLE_EMAIL_OPTIONS = "DISPOSABLE_EMAIL_OPTIONS";

export const DEFAULT_SOURCE_URL =
  "https://cdn.jsdelivr.net/gh/disposable/disposable-email-domains@master/domains.json";

export const BUNDLED_DOMAINS_PATH = join(__dirname, "..", "domains.json");
