import os from "node:os";
import { expect, test, vi, beforeAll, afterAll, describe } from "vitest";
import { buildLogMessage, parseLogMessage } from "../src/core.js";

const mockDate = new Date("2026-04-01T00:00:00.000Z");
const mockHostname = "mock-hostname";
const mockPid = 42;

/** @type {import("vitest").MockInstance} */
let hostnameSpy;

/** @type {import("vitest").MockInstance} */
let pidSpy;

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);

  hostnameSpy = vi.spyOn(os, "hostname").mockReturnValue(mockHostname);
  pidSpy = vi.spyOn(process, "pid", "get").mockReturnValue(mockPid);
});

afterAll(() => {
  vi.useRealTimers();
  hostnameSpy.mockRestore();
  pidSpy.mockRestore();
});

const SYSLOG_PATTERN =
  /<(?<priority>\d+)>(?<version>\d+) (?<timestamp>\S+) (?<hostname>\S+) (?<appName>\S+) (?<procId>\S+) (?<msgId>\S+) (?<structuredData>-|(?:\[[^\]]+\])+)(?: (?<msg>.+))?/;

describe("buildLogMessage()", () => {
  test("accepts numeric facility", () => {
    const output = buildLogMessage("foo", { facility: 4 });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("39");
  });

  test("accepts string facility", () => {
    const output = buildLogMessage("foo", { facility: "local4" });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("167");
  });

  test("throws on invalid facility", () => {
    expect(() => buildLogMessage("foo", { facility: 24 })).toThrow(
      "facility must be an integer between 0 and 23 or valid facility name",
    );
  });

  test("returns the correct version", () => {
    const output = buildLogMessage("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.version).toBe("1");
  });

  test("returns the correct time", () => {
    const output = buildLogMessage("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.timestamp).toBe(mockDate.toISOString());
  });

  test("accepts timestamp", () => {
    const output = buildLogMessage("foo", {
      timestamp: "2027-01-01T00:00:00.000Z",
    });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.timestamp).toBe("2027-01-01T00:00:00.000Z");
  });

  test("accepts timestamp as Date", () => {
    const timestamp = new Date("2027-01-01T00:00:00.000Z");
    const output = buildLogMessage("foo", { timestamp });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.timestamp).toBe("2027-01-01T00:00:00.000Z");
  });

  test("throws on invalid timestamp string", () => {
    expect(() =>
      buildLogMessage("foo", { timestamp: "not-a-timestamp" }),
    ).toThrow("timestamp must be a valid RFC 3339 date-time string");
  });

  test("throws on invalid timestamp Date", () => {
    expect(() =>
      buildLogMessage("foo", { timestamp: new Date("bad") }),
    ).toThrow("timestamp Date must be valid");
  });

  test("returns the correct hostname", () => {
    const output = buildLogMessage("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.hostname).toBe(mockHostname);
  });

  test("accepts hostname", () => {
    const output = buildLogMessage("foo", { hostname: "custom-host" });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.hostname).toBe("custom-host");
  });

  test("throws on invalid hostname", () => {
    expect(() => buildLogMessage("foo", { hostname: "bad host" })).toThrow(
      "hostname must be a non-empty string without whitespace",
    );
  });

  test("returns the correct app name", () => {
    const output = buildLogMessage("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.appName).toBe("-");
  });

  test("accepts app name", () => {
    const output = buildLogMessage("foo", { appName: "test-app" });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.appName).toBe("test-app");
  });

  test("throws on invalid app name", () => {
    expect(() => buildLogMessage("foo", { appName: "bad app" })).toThrow(
      "appName must be a non-empty string without whitespace",
    );
  });

  test("returns the correct process identifier", () => {
    const output = buildLogMessage("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.procId).toBe(mockPid.toString());
  });

  test("accepts process identifier", () => {
    const output = buildLogMessage("foo", { procId: 1234 });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.procId).toBe("1234");
  });

  test("throws on invalid process identifier", () => {
    expect(() => buildLogMessage("foo", { procId: "bad pid" })).toThrow(
      "procId must be a non-empty string or number without whitespace",
    );
  });

  test("returns the default message identifier", () => {
    const output = buildLogMessage("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.msgId).toBe("-");
  });

  test("accepts message identifier", () => {
    const output = buildLogMessage("foo", { msgId: "event-123" });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.msgId).toBe("event-123");
  });

  test("throws on invalid message identifier", () => {
    expect(() => buildLogMessage("foo", { msgId: "bad msg id" })).toThrow(
      "msgId must be a non-empty string without whitespace",
    );
  });

  test("returns default structured data as nil value", () => {
    const output = buildLogMessage("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.structuredData).toBe("-");
  });

  test("accepts a single structured data element", () => {
    const structuredData = '[meta@12345 method="GET" path="/users"]';
    const output = buildLogMessage("foo", { structuredData });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.structuredData).toBe(structuredData);
  });

  test("accepts multiple structured data elements", () => {
    const structuredData =
      '[meta@12345 method="GET"][trace@12345 requestId="abc-123"]';
    const output = buildLogMessage("foo", { structuredData });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.structuredData).toBe(structuredData);
  });

  test("accepts structured data object", () => {
    const structuredData = {
      sdId: "meta@12345",
      method: "GET",
      path: "/users",
    };
    const output = buildLogMessage("foo", { structuredData });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.structuredData).toBe(
      '[meta@12345 method="GET" path="/users"]',
    );
  });

  test("accepts structured data array of objects", () => {
    const structuredData = [
      { sdId: "meta@12345", method: "GET" },
      { sdId: "trace@12345", requestId: "abc-123" },
    ];
    const output = buildLogMessage("foo", { structuredData });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.structuredData).toBe(
      '[meta@12345 method="GET"][trace@12345 requestId="abc-123"]',
    );
  });

  test("throws on invalid structured data object", () => {
    expect(() =>
      // @ts-expect-error intentionally invalid shape for runtime validation check
      buildLogMessage("foo", { structuredData: { method: "GET" } }),
    ).toThrow("structured data object must include a non-empty sdId");
  });

  test("allows an empty message", () => {
    const output = buildLogMessage("");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.msg).toBeUndefined();
  });

  test("allows an undefined message", () => {
    const output = buildLogMessage();
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.msg).toBeUndefined();
  });

  test("allows a null message", () => {
    const output = buildLogMessage(null);
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.msg).toBeUndefined();
  });

  test("allows options with an undefined message", () => {
    const output = buildLogMessage(undefined, { facility: 4 });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("39");
    expect(match?.groups?.msg).toBeUndefined();
  });

  test("allows options with a null message", () => {
    const output = buildLogMessage(null, { facility: 4 });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("39");
    expect(match?.groups?.msg).toBeUndefined();
  });
});

describe("parseLogMessage()", () => {
  test("throws on non-string input", () => {
    expect(() => parseLogMessage(/** @type {any} */ (123))).toThrow(TypeError);
  });

  test("throws on invalid PRI/VERSION prefix", () => {
    expect(() => parseLogMessage("not a syslog message")).toThrow(
      "invalid message: expected <PRI>VERSION prefix",
    );
  });

  test("throws on missing token", () => {
    expect(() => parseLogMessage("<128>1 2026-01-01T00:00:00.000Z")).toThrow(
      "invalid message: unexpected end of message",
    );
  });

  test("throws on empty token", () => {
    expect(() =>
      parseLogMessage("<128>1 2026-01-01T00:00:00.000Z  app 42 - -"),
    ).toThrow("invalid message: empty hostname");
  });

  test("round-trips output", () => {
    const output = buildLogMessage("hello world", {
      severity: "warning",
      facility: "local4",
      timestamp: "2027-01-01T00:00:00.000Z",
      hostname: "api-1",
      appName: "worker",
      procId: 123,
      msgId: "event-1",
      structuredData: { sdId: "meta@12345", params: { method: "GET" } },
    });

    const parsed = parseLogMessage(output);

    expect(parsed).toEqual({
      priority: 164,
      version: 1,
      facility: 20,
      severity: 4,
      timestamp: "2027-01-01T00:00:00.000Z",
      hostname: "api-1",
      appName: "worker",
      procId: "123",
      msgId: "event-1",
      structuredData: '[meta@12345 method="GET"]',
      msg: "hello world",
    });
  });

  test("parses message with no msg body", () => {
    const parsed = parseLogMessage(
      "<128>1 2026-01-01T00:00:00.000Z host app 42 - -",
    );

    expect(parsed.structuredData).toBe("-");
    expect(parsed.msg).toBeUndefined();
  });

  test("parses structured data with escaped quote", () => {
    const parsed = parseLogMessage(
      '<128>1 2026-01-01T00:00:00.000Z host app 42 - [sd@1 k="v\\""]',
    );

    expect(parsed.structuredData).toBe('[sd@1 k="v\\""]');
    expect(parsed.msg).toBeUndefined();
  });

  test("throws on unclosed structured data bracket", () => {
    expect(() =>
      parseLogMessage(
        "<128>1 2026-01-01T00:00:00.000Z host app 42 - [unclosed",
      ),
    ).toThrow("invalid message: malformed structured data");
  });

  test("throws on invalid structured data prefix", () => {
    expect(() =>
      parseLogMessage("<128>1 2026-01-01T00:00:00.000Z host app 42 - xyz"),
    ).toThrow("invalid message: expected structured data");
  });

  test("throws on non-space character after structured data", () => {
    expect(() =>
      parseLogMessage("<128>1 2026-01-01T00:00:00.000Z host app 42 - -X"),
    ).toThrow("invalid message: expected space before msg");
  });
});
