/**
 * Type definitions for syslog library.
 */

/**
 * A single structured data element.
 *
 * `sdId` becomes the SD-ID and the remaining properties become PARAM-NAME /
 * PARAM-VALUE pairs. If `sdId` is omitted, message generation falls back to
 * `defaultSdId` and then `appName`. If `params` is provided, it is used as the
 * parameter source instead of the remaining top-level properties.
 *
 * Example: `{ sdId: "meta@12345", method: "GET", path: "/users" }` serializes
 * to `[meta@12345 method="GET" path="/users"]`
 */
export interface StructuredDataElement {
  sdId?: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Options for message generation.
 *
 * All properties are optional. When omitted, RFC 5424-friendly defaults or
 * values from the current runtime environment are used.
 */
export interface Options {
  /**
   * Severity where `0` is emergency, `1` is alert, and so on. Accepts either
   * numeric severity codes (`0` through `7`) or severity names such as
   * `"error"` and `"warning"`. @default 7
   */
  severity?: number | string;

  /**
   * Syslog facility. Accepts an integer in the range `0` through `23` or a
   * facility name such as `"local4"`. @default 16
   */
  facility?: number | string;

  /**
   * Message timestamp. Accepts an RFC 3339 date-time string (e.g.,
   * `2026-04-01T00:00:00.000Z`) or a JavaScript `Date` instance. When
   * omitted, the current time is used.
   */
  timestamp?: string | Date;

  /**
   * Hostname token placed in the message header. Defaults to
   * `os.hostname()`.
   */
  hostname?: string;

  /**
   * Application name token placed in the message header. @default "-"
   */
  appName?: string;

  /**
   * Default SD-ID used when structured data objects omit `sdId`. When omitted,
   * the effective default falls back to `appName`.
   */
  defaultSdId?: string;

  /**
   * Process identifier token placed in the message header. Defaults to
   * `process.pid`.
   */
  procId?: number | string;

  /**
   * Message identifier token placed in the message header. @default "-"
   */
  msgId?: string;

  /**
   * Structured data as a raw string, a single structured data object, or an
   * array of structured data objects. @default "-"
   */
  structuredData?: string | StructuredDataElement | StructuredDataElement[];
}

/**
 * Logger function signature.
 */
export type LoggerFunction = (msg?: string | null, options?: Options) => string;

/**
 * Logger function with attached severity methods.
 */
export type Logger = LoggerFunction & {
  emergency: (msg?: string | null, options?: Options) => string;
  alert: (msg?: string | null, options?: Options) => string;
  critical: (msg?: string | null, options?: Options) => string;
  error: (msg?: string | null, options?: Options) => string;
  warning: (msg?: string | null, options?: Options) => string;
  notice: (msg?: string | null, options?: Options) => string;
  info: (msg?: string | null, options?: Options) => string;
  debug: (msg?: string | null, options?: Options) => string;
};

/**
 * Parsed shape for messages emitted by this library.
 */
export interface ParsedMessage {
  /** Priority value from `<PRI>`. */
  priority: number;

  /** RFC 5424 version value. */
  version: number;

  /** Facility derived from priority. */
  facility: number;

  /** Severity derived from priority. */
  severity: number;

  /** TIMESTAMP token. */
  timestamp: string;

  /** HOSTNAME token. */
  hostname: string;

  /** APP-NAME token. */
  appName: string;

  /** PROCID token. */
  procId: string;

  /** MSGID token. */
  msgId: string;

  /** STRUCTURED-DATA field. */
  structuredData: string;

  /** Optional MSG field. */
  msg?: string;
}
