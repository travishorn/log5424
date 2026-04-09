import { expect, test, vi, beforeAll, afterAll } from "vitest";
import {
  normalizeStructuredData,
  resolveFacility,
  resolveSeverity,
  validateOptions,
  validateProcId,
  validateStructuredData,
  validateTimestamp,
  validateToken,
} from "../src/util.js";

const mockDate = new Date("2026-04-01T00:00:00.000Z");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
});

afterAll(() => {
  vi.useRealTimers();
});

test("validateOptions accepts undefined", () => {
  expect(validateOptions(undefined)).toEqual({});
});

test("validateOptions accepts object", () => {
  expect(validateOptions({ facility: 4 })).toEqual({ facility: 4 });
});

test("validateOptions throws on invalid value", () => {
  expect(() => validateOptions(null)).toThrow("options must be an object");
});

test("validateToken accepts token", () => {
  expect(validateToken("my-app", "appName")).toBe("my-app");
});

test("validateToken throws on whitespace", () => {
  expect(() => validateToken("bad app", "appName")).toThrow(
    "appName must be a non-empty string without whitespace",
  );
});

test("resolveFacility accepts numeric facility", () => {
  expect(resolveFacility(4)).toBe(4);
});

test("resolveFacility accepts facility name", () => {
  expect(resolveFacility("local4")).toBe(20);
});

test("resolveFacility returns default for undefined", () => {
  expect(resolveFacility(undefined)).toBe(16);
});

test("resolveFacility throws on invalid facility", () => {
  expect(() => resolveFacility(24)).toThrow(
    "facility must be an integer between 0 and 23 or valid facility name",
  );
});

test("resolveFacility throws on invalid facility name", () => {
  expect(() => resolveFacility("unknown-facility")).toThrow(
    "facility must be an integer between 0 and 23 or valid facility name",
  );
});

test("resolveSeverity accepts numeric severity", () => {
  expect(resolveSeverity(6)).toBe(6);
});

test("resolveSeverity accepts severity name", () => {
  expect(resolveSeverity("informational")).toBe(6);
});

test("resolveSeverity returns default for undefined", () => {
  expect(resolveSeverity(undefined)).toBe(7);
});

test("resolveSeverity throws on invalid severity", () => {
  expect(() => resolveSeverity("loud")).toThrow(
    "severity must be an integer between 0 and 7 or valid severity name",
  );
});

test("validateTimestamp returns now for undefined", () => {
  expect(validateTimestamp(undefined)).toBe(mockDate.toISOString());
});

test("validateTimestamp accepts Date", () => {
  const date = new Date("2027-01-01T00:00:00.000Z");
  expect(validateTimestamp(date)).toBe("2027-01-01T00:00:00.000Z");
});

test("validateTimestamp accepts string", () => {
  expect(validateTimestamp("2027-01-01T00:00:00.000Z")).toBe(
    "2027-01-01T00:00:00.000Z",
  );
});

test("validateTimestamp throws on invalid string", () => {
  expect(() => validateTimestamp("not-a-timestamp")).toThrow(
    "timestamp must be a valid RFC 3339 date-time string",
  );
});

test("validateTimestamp throws on invalid type", () => {
  expect(() => validateTimestamp(/** @type {any} */ (1234))).toThrow(
    "timestamp must be a string, Date, or undefined",
  );
});

test("validateProcId accepts number", () => {
  expect(validateProcId(1234)).toBe("1234");
});

test("validateProcId accepts string", () => {
  expect(validateProcId("abc-123")).toBe("abc-123");
});

test("validateProcId throws on invalid string", () => {
  expect(() => validateProcId("bad pid")).toThrow(
    "procId must be a non-empty string or number without whitespace",
  );
});

test("validateStructuredData accepts nil value", () => {
  expect(() => validateStructuredData("-")).not.toThrow();
});

test("validateStructuredData accepts sd-elements", () => {
  expect(() =>
    validateStructuredData('[meta@12345 method="GET"][trace@12345 id="1"]'),
  ).not.toThrow();
});

test("validateStructuredData throws on non-string", () => {
  expect(() => validateStructuredData(/** @type {any} */ ({}))).toThrow(
    "structured data must be a string",
  );
});

test("validateStructuredData throws when missing opening bracket", () => {
  expect(() => validateStructuredData('meta@12345 method="GET"')).toThrow(
    "structured data must be either `-` (nil) or start with `[`",
  );
});

test("validateStructuredData throws on invalid structured data", () => {
  expect(() => validateStructuredData("[]")).toThrow(
    "invalid structured data at position 0",
  );
});

test("normalizeStructuredData returns nil for undefined", () => {
  expect(normalizeStructuredData(undefined)).toBe("-");
});

test("normalizeStructuredData accepts raw string", () => {
  expect(normalizeStructuredData('[meta@12345 method="GET"]')).toBe(
    '[meta@12345 method="GET"]',
  );
});

test("normalizeStructuredData serializes object", () => {
  expect(
    normalizeStructuredData({ sdId: "meta@12345", method: "GET", path: "/" }),
  ).toBe('[meta@12345 method="GET" path="/"]');
});

test("normalizeStructuredData serializes object params property", () => {
  expect(
    normalizeStructuredData({
      sdId: "meta@12345",
      params: { method: "GET", path: "/" },
    }),
  ).toBe('[meta@12345 method="GET" path="/"]');
});

test("normalizeStructuredData serializes sdId-only object", () => {
  expect(normalizeStructuredData({ sdId: "meta@12345" })).toBe("[meta@12345]");
});

test("normalizeStructuredData throws when params is not an object", () => {
  expect(() =>
    normalizeStructuredData({
      sdId: "meta@12345",
      params: /** @type {any} */ ("bad"),
    }),
  ).toThrow("structured data params must be an object if provided");
});

test("normalizeStructuredData throws on invalid param name", () => {
  expect(() =>
    normalizeStructuredData({ sdId: "meta@12345", "bad key": "value" }),
  ).toThrow("invalid structured data param name: bad key");
});

test("normalizeStructuredData throws on undefined param value", () => {
  expect(() =>
    normalizeStructuredData({
      sdId: "meta@12345",
      key: undefined,
    }),
  ).toThrow("structured data param key cannot be undefined");
});

test("normalizeStructuredData serializes array", () => {
  expect(
    normalizeStructuredData([
      { sdId: "meta@12345", method: "GET" },
      { sdId: "trace@12345", requestId: "abc-123" },
    ]),
  ).toBe('[meta@12345 method="GET"][trace@12345 requestId="abc-123"]');
});

test("normalizeStructuredData throws on empty array", () => {
  expect(() => normalizeStructuredData([])).toThrow(
    "structured data array cannot be empty",
  );
});

test("normalizeStructuredData throws when array has non-object", () => {
  expect(() => normalizeStructuredData([/** @type {any} */ ("bad")])).toThrow(
    "structured data array must contain only objects",
  );
});

test("normalizeStructuredData throws on invalid object", () => {
  expect(() => normalizeStructuredData({ method: "GET" })).toThrow(
    "structured data object must include a non-empty sdId",
  );
});

test("normalizeStructuredData throws on unsupported input type", () => {
  expect(() => normalizeStructuredData(/** @type {any} */ (42))).toThrow(
    "structured data must be a string, object, array of objects, or undefined",
  );
});
