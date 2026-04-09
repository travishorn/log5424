/**
 * Maps facility names to their numeric codes.
 *
 * These values are used to compute the message priority as: `priority =
 * facility * 8 + severity`.
 *
 * @type {Record<string, number>}
 */
/** @type {Record<string, number>} */
const facilityMap = {
  kernel: 0,
  user: 1,
  mail: 2,
  daemon: 3,
  auth: 4,
  syslog: 5,
  lpr: 6,
  news: 7,
  uucp: 8,
  cron: 9,
  authpriv: 10,
  ftp: 11,
  ntp: 12,
  audit: 13,
  alert: 14,
  clock: 15,
  local0: 16,
  local1: 17,
  local2: 18,
  local3: 19,
  local4: 20,
  local5: 21,
  local6: 22,
  local7: 23,
};

/**
 * Maps severity names to their numeric codes.
 *
 * These values are used to compute the message priority as: `priority =
 * facility * 8 + severity`.
 *
 * @type {Record<string, number>}
 */
/** @type {Record<string, number>} */
const severityMap = {
  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  informational: 6,
  debug: 7,
};

/**
 * Returns whether a value is a plain object suitable for options or structured
 * data normalization.
 *
 * Arrays and `null` are explicitly excluded.
 *
 * @param {unknown} value Value to test.
 * @returns {value is Record<string, unknown>} Whether the value is a plain
 * object.
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates the top-level options argument passed to a logger function.
 *
 * `undefined` is normalized to an empty object so callers can omit the second
 * argument entirely.
 *
 * @param {unknown} options Candidate options value.
 * @returns {Record<string, unknown>} Validated options object.
 * @throws {TypeError} Thrown when `options` is not an object.
 */
export function validateOptions(options) {
  if (typeof options === "undefined") {
    return {};
  }

  if (!isPlainObject(options)) {
    throw new TypeError("options must be an object");
  }

  return options;
}

/**
 * Validates a token-like header field.
 *
 * This helper is used for fields that must be emitted as a single token in the
 * header and therefore cannot contain whitespace.
 *
 * @param {unknown} value Candidate token value.
 * @param {string} name Field name used in the error message.
 * @returns {string} Validated token.
 * @throws {TypeError} Thrown when the token is empty, non-string, or contains
 * whitespace.
 */
export function validateToken(value, name) {
  if (typeof value !== "string" || value.trim() === "" || /\s/.test(value)) {
    throw new TypeError(
      `${name} must be a non-empty string without whitespace`,
    );
  }

  return value;
}

/**
 * Resolves a facility value into its numeric facility code.
 *
 * Accepts either a known facility name such as `"local4"` or a numeric code
 * between `0` and `23`.
 *
 * @param {number | string | undefined} facility Facility code or facility name.
 * @returns {number} Numeric facility code.
 * @throws {TypeError} Thrown when the facility is outside the valid range or
 * unknown.
 */
export function resolveFacility(facility) {
  if (typeof facility === "number") {
    if (Number.isInteger(facility) && facility >= 0 && facility <= 23) {
      return facility;
    }
  }

  if (typeof facility === "string") {
    const normalized = facility.trim().toLowerCase();
    const mapped = facilityMap[normalized];

    if (mapped !== undefined) {
      return mapped;
    }
  }

  if (typeof facility === "undefined") {
    return 16;
  }

  throw new TypeError(
    "facility must be an integer between 0 and 23 or valid facility name",
  );
}

/**
 * Resolves a severity value into a numeric severity code.
 *
 * Accepts either a known severity name such as `"error"` or a numeric code
 * between `0` and `7`.
 *
 * @param {number | string | undefined} severity Severity code or severity name.
 * @returns {number} Numeric severity code.
 * @throws {TypeError} Thrown when severity is outside `0` through `7`.
 */
export function resolveSeverity(severity) {
  if (typeof severity === "undefined") {
    return 7;
  }

  if (
    typeof severity === "number" &&
    Number.isInteger(severity) &&
    severity >= 0 &&
    severity <= 7
  ) {
    return severity;
  }

  if (typeof severity === "string") {
    const normalized = severity.trim().toLowerCase();
    const mapped = severityMap[normalized];

    if (mapped !== undefined) {
      return mapped;
    }
  }

  throw new TypeError(
    "severity must be an integer between 0 and 7 or valid severity name",
  );
}

/**
 * Validates and normalizes a timestamp.
 *
 * - `undefined` becomes the current time in ISO format
 * - `Date` becomes `toISOString()`
 * - `string` must be a valid RFC 3339 date-time string
 *
 * @param {string | Date | undefined} timestamp Candidate timestamp.
 * @returns {string} Normalized RFC 3339 timestamp string.
 * @throws {TypeError} Thrown when the timestamp is invalid or unsupported.
 */
export function validateTimestamp(timestamp) {
  if (typeof timestamp === "undefined") {
    return new Date().toISOString();
  }

  if (timestamp instanceof Date) {
    if (Number.isNaN(timestamp.getTime())) {
      throw new TypeError("timestamp Date must be valid");
    }

    return timestamp.toISOString();
  }

  if (typeof timestamp === "string") {
    const rfc3339Pattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

    if (
      !rfc3339Pattern.test(timestamp) ||
      Number.isNaN(Date.parse(timestamp))
    ) {
      throw new TypeError(
        "timestamp must be a valid RFC 3339 date-time string",
      );
    }

    return timestamp;
  }

  throw new TypeError("timestamp must be a string, Date, or undefined");
}

/**
 * Validates and normalizes a process identifier (PROCID) value.
 *
 * Numeric values are stringified. String values must be non-empty and cannot
 * contain whitespace so they remain valid single-token header values.
 *
 * @param {unknown} procId Candidate process identifier.
 * @returns {string} Normalized process identifier.
 * @throws {TypeError} Thrown when the value cannot be serialized as a valid PROCID token.
 */
export function validateProcId(procId) {
  if (typeof procId === "number") {
    return String(procId);
  }

  if (
    typeof procId === "string" &&
    procId.trim() !== "" &&
    !/\s/.test(procId)
  ) {
    return procId;
  }

  throw new TypeError(
    "procId must be a non-empty string or number without whitespace",
  );
}

/**
 * Validates RFC 5424 structured data format.
 *
 * Structured data must be either:
 * - A nil value: `-`
 * - One or more SD-ELEMENT blocks: `[SD-ID key="value" ...][SD-ID key="value"]`
 *
 * This validator assumes the caller is supplying a raw RFC 5424 string. For
 * object or array inputs, use `normalizeStructuredData()` instead.
 *
 * @param {string | undefined} structuredData Raw structured data string.
 * @returns {void}
 * @throws {TypeError} Thrown when the value is not a string.
 * @throws {Error} Thrown when the string is not valid RFC 5424 structured data.
 */
export function validateStructuredData(structuredData) {
  if (typeof structuredData !== "string") {
    throw new TypeError("structured data must be a string");
  }

  // Nil value is valid
  if (structuredData === "-") {
    return;
  }

  // Must start with `[` if not nil
  if (!structuredData.startsWith("[")) {
    throw new Error(
      "structured data must be either `-` (nil) or start with `[`",
    );
  }

  // Pattern for a single SD-ELEMENT: [SD-ID key="value" key="value" ...]
  // SD-ID: alphanumerics, hyphens, dots, @ (enterprise numbering)
  // Keys: alphanumerics, hyphens
  // Values: anything in double quotes (we don't validate escape sequences here)
  const sdElementPattern =
    /^\[([A-Za-z0-9\-.@]+)(?:\s+[A-Za-z0-9-]+="[^"]*")*\]/;

  let position = 0;
  while (position < structuredData.length) {
    const remaining = structuredData.slice(position);
    const match = remaining.match(sdElementPattern);

    if (!match) {
      throw new Error(
        `invalid structured data at position ${position}: expected SD-ELEMENT in format [SD-ID key="value" ...]`,
      );
    }

    position += match[0].length;
  }
}

/**
 * Escapes a structured data parameter value for serialization.
 *
 * The characters `\`, `"`, and `]` are escaped before the value is quoted.
 *
 * @param {string} value Raw parameter value.
 * @returns {string} Escaped parameter value.
 */
function escapeStructuredDataParamValue(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("]", "\\]");
}

/**
 * Serializes a single structured data element object into RFC 5424 text.
 *
 * The object must include `sdId`. Parameter values come from `params` when it
 * is present; otherwise all remaining top-level properties are used.
 *
 * @param {Record<string, unknown>} element Structured data element object.
 * @returns {string} Serialized SD-ELEMENT.
 * @throws {TypeError} Thrown when the element shape is invalid.
 */
function serializeStructuredDataElement(element) {
  const { sdId, params, ...inlineParams } = element;

  if (typeof sdId !== "string" || sdId.trim() === "") {
    throw new TypeError("structured data object must include a non-empty sdId");
  }

  const paramSource =
    typeof params === "undefined"
      ? inlineParams
      : isPlainObject(params)
        ? params
        : null;

  if (paramSource === null) {
    throw new TypeError("structured data params must be an object if provided");
  }

  const serializedParams = Object.entries(paramSource).map(([key, value]) => {
    if (!/^[A-Za-z0-9-]+$/.test(key)) {
      throw new TypeError(`invalid structured data param name: ${key}`);
    }

    if (typeof value === "undefined") {
      throw new TypeError(`structured data param ${key} cannot be undefined`);
    }

    const escapedValue = escapeStructuredDataParamValue(String(value));
    return `${key}="${escapedValue}"`;
  });

  return serializedParams.length > 0
    ? `[${sdId} ${serializedParams.join(" ")}]`
    : `[${sdId}]`;
}

/**
 * Normalizes supported structured data inputs into a validated RFC 5424 string.
 *
 * Accepted input forms:
 * - `undefined`, which becomes the nil value `-`
 * - a raw structured data string
 * - a single structured data object with `sdId`
 * - an array of structured data objects
 *
 * Arrays are serialized as adjacent SD-ELEMENT blocks with no spaces between
 * them, matching RFC 5424 formatting.
 *
 * @param {string | Record<string, unknown> | Array<Record<string, unknown>> |
 * undefined} structuredData Structured data input.
 * @returns {string} Validated structured data string.
 * @throws {TypeError} Thrown when the input shape is unsupported or invalid.
 * @throws {Error} Thrown when the final serialized form is not valid structured
 * data.
 */
export function normalizeStructuredData(structuredData) {
  if (typeof structuredData === "undefined") {
    return "-";
  }

  if (typeof structuredData === "string") {
    validateStructuredData(structuredData);
    return structuredData;
  }

  if (Array.isArray(structuredData)) {
    if (structuredData.length === 0) {
      throw new TypeError("structured data array cannot be empty");
    }

    const normalized = structuredData
      .map((element) => {
        if (!isPlainObject(element)) {
          throw new TypeError(
            "structured data array must contain only objects",
          );
        }

        return serializeStructuredDataElement(element);
      })
      .join("");

    validateStructuredData(normalized);
    return normalized;
  }

  if (isPlainObject(structuredData)) {
    const normalized = serializeStructuredDataElement(structuredData);
    validateStructuredData(normalized);
    return normalized;
  }

  throw new TypeError(
    "structured data must be a string, object, array of objects, or undefined",
  );
}
