import { buildLogMessage, defaultOptions, parseLogMessage } from "./core.js";
import { validateOptions } from "./util.js";

/** @typedef {import("./types.d.ts").Options} Options */
/** @typedef {import("./types.d.ts").ParsedMessage} ParsedMessage */
/** @typedef {import("./types.d.ts").Logger} Logger */
/** @typedef {import("./types.d.ts").LoggerFunction} LoggerFunction */
/** @typedef {import("./types.d.ts").StructuredDataElement} StructuredDataElement */

/**
 * Creates a logger function with persistent default options.
 *
 * The returned function accepts an optional message and optional per-call
 * options. Per-call options override the logger defaults. Supports three
 * calling patterns:
 * - `logger("foo")` — uses default severity from logger options
 * - `logger.debug("foo")` — forces debug severity
 * - `logger("foo", { severity: "info" })` — per-call options override
 *
 * @param {Options} [options] Logger default options.
 * @returns {Logger} Logger function with attached severity methods.
 */
export function createLogger(options = defaultOptions) {
  const loggerDefaults = { ...defaultOptions, ...validateOptions(options) };
  buildLogMessage(undefined, loggerDefaults);

  /** @type {Logger} */
  const log = (msg, callOptions) => {
    const mergedCallOptions = {
      ...loggerDefaults,
      ...validateOptions(callOptions),
    };
    return buildLogMessage(msg, mergedCallOptions);
  };

  // Attach severity methods
  log.emergency = (msg, callOptions) =>
    emergency(msg, { ...loggerDefaults, ...validateOptions(callOptions) });
  log.alert = (msg, callOptions) =>
    alert(msg, { ...loggerDefaults, ...validateOptions(callOptions) });
  log.critical = (msg, callOptions) =>
    critical(msg, { ...loggerDefaults, ...validateOptions(callOptions) });
  log.error = (msg, callOptions) =>
    error(msg, { ...loggerDefaults, ...validateOptions(callOptions) });
  log.warning = (msg, callOptions) =>
    warning(msg, { ...loggerDefaults, ...validateOptions(callOptions) });
  log.notice = (msg, callOptions) =>
    notice(msg, { ...loggerDefaults, ...validateOptions(callOptions) });
  log.info = (msg, callOptions) =>
    info(msg, { ...loggerDefaults, ...validateOptions(callOptions) });
  log.debug = (msg, callOptions) =>
    debug(msg, { ...loggerDefaults, ...validateOptions(callOptions) });

  return log;
}

/**
 * Builds a syslog message at emergency severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function emergency(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 0 });
}

/**
 * Builds a syslog message at alert severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function alert(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 1 });
}

/**
 * Builds a syslog message at critical severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function critical(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 2 });
}

/**
 * Builds a syslog message at error severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function error(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 3 });
}

/**
 * Builds a syslog message at warning severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function warning(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 4 });
}

/**
 * Builds a syslog message at notice severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function notice(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 5 });
}

/**
 * Builds a syslog message at informational severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function info(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 6 });
}

/**
 * Builds a syslog message at debug severity.
 *
 * The message is normalized and validated before serialization. Invalid option
 * values throw `TypeError`s with field-specific messages.
 *
 * The return value is a string in RFC 5424 format: `PRI VERSION TIMESTAMP
 * HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]`
 *
 * When `msg` is `""`, `null`, or `undefined`, the `MSG` trailing free-text
 * message portion is omitted entirely.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Header and structured data overrides.
 * @returns {string} Serialized RFC 5424 syslog message.
 * @throws {TypeError} Thrown when any option is invalid.
 */
export function debug(msg, options = defaultOptions) {
  return buildLogMessage(msg, { ...validateOptions(options), severity: 7 });
}

/**
 * Parses a message emitted by this library into normalized fields.
 *
 * @param {string} input Serialized message.
 * @returns {ParsedMessage} Parsed message fields.
 */
export function parse(input) {
  return parseLogMessage(input);
}
