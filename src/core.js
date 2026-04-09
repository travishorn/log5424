import os from "node:os";
import {
  normalizeStructuredData,
  resolveFacility,
  resolveSeverity,
  validateOptions,
  validateProcId,
  validateToken,
  validateTimestamp,
} from "./util.js";

/** @typedef {import("./types.d.ts").StructuredDataElement} StructuredDataElement */
/** @typedef {import("./types.d.ts").Options} Options */
/** @typedef {import("./types.d.ts").ParsedMessage} ParsedMessage */

/** @type {Options} */
export const defaultOptions = {
  severity: 7,
  facility: 16,
  appName: "-",
  msgId: "-",
  structuredData: "-",
};

/**
 * Builds a syslog message from validated and normalized options.
 *
 * @param {string | null} [msg] Optional free-text syslog message body.
 * @param {Options} [options] Message options.
 * @returns {string} Serialized RFC 5424 syslog message.
 */
export function buildLogMessage(msg, options) {
  const mergedOptions = { ...defaultOptions, ...validateOptions(options) };

  const facility = resolveFacility(mergedOptions.facility);
  const severity = resolveSeverity(mergedOptions.severity);
  const priority = facility * 8 + severity;
  const timestamp = validateTimestamp(mergedOptions.timestamp);
  const hostname = validateToken(
    mergedOptions.hostname ?? os.hostname(),
    "hostname",
  );
  const appName = validateToken(mergedOptions.appName, "appName");
  const defaultSdId = validateToken(
    mergedOptions.defaultSdId ?? appName,
    "defaultSdId",
  );
  const structuredData = normalizeStructuredData(
    mergedOptions.structuredData,
    defaultSdId,
  );
  const procId = validateProcId(mergedOptions.procId ?? process.pid);
  const msgId = validateToken(mergedOptions.msgId, "msgId");
  const msgPart = msg ? ` ${msg}` : "";

  return `<${priority}>1 ${timestamp} ${hostname} ${appName} ${procId} ${msgId} ${structuredData}${msgPart}`;
}

/**
 * Parses syslog messages into normalized fields.
 *
 * This parser targets this library's own emitted format, which matches RFC
 * 5424, but may not match **all** RFC 5424-formatted messages (yet).
 *
 * @param {string} input Serialized message.
 * @returns {ParsedMessage} Parsed message fields.
 * @throws {TypeError} Thrown when input is not a string.
 * @throws {Error} Thrown when input does not match the emitted format.
 */
export function parseLogMessage(input) {
  if (typeof input !== "string") {
    throw new TypeError("message must be a string");
  }

  const priVersionMatch = input.match(/^<(?<priority>\d+)>(?<version>\d+) /);
  if (!priVersionMatch?.groups) {
    throw new Error("invalid message: expected <PRI>VERSION prefix");
  }

  const priority = Number(priVersionMatch.groups.priority);
  const version = Number(priVersionMatch.groups.version);
  let rest = input.slice(priVersionMatch[0].length);

  /** @type {(label: string) => string} */
  const readToken = (label) => {
    const separator = rest.indexOf(" ");
    if (separator === -1) {
      throw new Error("invalid message: unexpected end of message");
    }

    const token = rest.slice(0, separator);
    if (token.length === 0) {
      throw new Error(`invalid message: empty ${label}`);
    }

    rest = rest.slice(separator + 1);
    return token;
  };

  const timestamp = readToken("timestamp");
  const hostname = readToken("hostname");
  const appName = readToken("appName");
  const procId = readToken("procId");
  const msgId = readToken("msgId");

  /** @type {string} */
  let structuredData;

  if (rest.startsWith("-")) {
    structuredData = "-";
    rest = rest.slice(1);
  } else if (rest.startsWith("[")) {
    let i = 0;
    while (i < rest.length && rest[i] === "[") {
      let inQuotes = false;
      let escaped = false;
      let closed = false;
      i += 1;

      for (; i < rest.length; i += 1) {
        const char = rest[i];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === "\\") {
          escaped = true;
          continue;
        }

        if (char === '"') {
          inQuotes = !inQuotes;
          continue;
        }

        if (char === "]" && !inQuotes) {
          i += 1;
          closed = true;
          break;
        }
      }

      if (!closed) {
        throw new Error("invalid message: malformed structured data");
      }
    }

    structuredData = rest.slice(0, i);
    rest = rest.slice(i);
  } else {
    throw new Error("invalid message: expected structured data");
  }

  /** @type {string | undefined} */
  let msg;
  if (rest.length === 0) {
    msg = undefined;
  } else if (rest.startsWith(" ")) {
    msg = rest.slice(1);
  } else {
    throw new Error("invalid message: expected space before msg");
  }

  return {
    priority,
    version,
    facility: Math.floor(priority / 8),
    severity: priority % 8,
    timestamp,
    hostname,
    appName,
    procId,
    msgId,
    structuredData,
    msg,
  };
}
