import os from "node:os";
import { expect, test, vi, beforeAll, afterAll, describe } from "vitest";
import {
  alert,
  createLogger,
  critical,
  debug,
  emergency,
  error,
  info,
  notice,
  parse,
  warning,
} from "../src/index.js";

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

describe("createLogger()", () => {
  test("throws on invalid options", () => {
    expect(() => createLogger(/** @type {any} */ (null))).toThrow(
      "options must be an object",
    );
  });

  test("reuses default options", () => {
    const logger = createLogger({ facility: 4 });

    const output = logger("foo");
    const output2 = logger("bar");
    const match = output.match(SYSLOG_PATTERN);
    const match2 = output2.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match2).not.toBeNull();
    expect(match?.groups?.priority).toBe("39");
    expect(match2?.groups?.priority).toBe("39");
  });

  test("allows per-call options override", () => {
    const logger = createLogger({ facility: 4 });

    const output = logger("foo");
    const output2 = logger("bar", { facility: "local4" });
    const match = output.match(SYSLOG_PATTERN);
    const match2 = output2.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match2).not.toBeNull();
    expect(match?.groups?.priority).toBe("39");
    expect(match2?.groups?.priority).toBe("167");
  });

  test("uses logger defaultSdId for structured data objects missing sdId", () => {
    const logger = createLogger({
      appName: "checkout",
      defaultSdId: "meta@32473",
    });

    const output = logger("foo", {
      structuredData: { method: "GET", path: "/checkout" },
    });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.structuredData).toBe(
      '[meta@32473 method="GET" path="/checkout"]',
    );
  });

  test("allows per-call defaultSdId to override logger default", () => {
    const logger = createLogger({
      appName: "checkout",
      defaultSdId: "meta@32473",
    });

    const output = logger("foo", {
      defaultSdId: "trace@32473",
      structuredData: { requestId: "abc-123" },
    });
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.structuredData).toBe(
      '[trace@32473 requestId="abc-123"]',
    );
  });

  test("logger.emergency() forces emergency severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.emergency("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("32");
  });

  test("logger.alert() forces alert severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.alert("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("33");
  });

  test("logger.critical() forces critical severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.critical("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("34");
  });

  test("logger.error() forces error severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.error("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("35");
  });

  test("logger.warning() forces warning severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.warning("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("36");
  });

  test("logger.notice() forces notice severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.notice("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("37");
  });

  test("logger.info() forces informational severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.info("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("38");
  });

  test("logger.debug() forces debug severity", () => {
    const logger = createLogger({ facility: 4 });
    const output = logger.debug("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("39");
  });

  test("logger methods respect logger defaults", () => {
    const logger = createLogger({ facility: "local4" });
    const output = logger.error("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("163");
  });

  test("accepts severity", () => {
    const logger = createLogger({ facility: 4, severity: 6 });
    const output = logger("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("38");
  });

  test("accepts severity name", () => {
    const logger = createLogger({ facility: 4, severity: "informational" });
    const output = logger("foo");
    const match = output.match(SYSLOG_PATTERN);

    expect(match).not.toBeNull();
    expect(match?.groups?.priority).toBe("38");
  });

  test("throws on invalid severity", () => {
    expect(() => createLogger({ severity: 8 })).toThrow(
      "severity must be an integer between 0 and 7 or valid severity name",
    );
  });

  test("throws on invalid severity name", () => {
    expect(() => createLogger({ severity: "loud" })).toThrow(
      "severity must be an integer between 0 and 7 or valid severity name",
    );
  });
});

test("emergency() returns the correct priority", () => {
  const output = emergency("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("128");
});

test("emergency() forces emergency severity", () => {
  const output = emergency("foo", { severity: "debug" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("128");
});

test("alert() returns the correct priority", () => {
  const output = alert("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("129");
});

test("alert() forces alert severity", () => {
  const output = alert("foo", { severity: "debug" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("129");
});

test("critical() returns the correct priority", () => {
  const output = critical("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("130");
});

test("critical() forces critical severity", () => {
  const output = critical("foo", { severity: "debug" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("130");
});

test("error() returns the correct priority", () => {
  const output = error("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("131");
});

test("error() forces error severity", () => {
  const output = error("foo", { severity: "debug" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("131");
});

test("warning() returns the correct priority", () => {
  const output = warning("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("132");
});

test("warning() forces warning severity", () => {
  const output = warning("foo", { severity: "debug" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("132");
});

test("notice() returns the correct priority", () => {
  const output = notice("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("133");
});

test("notice() forces notice severity", () => {
  const output = notice("foo", { severity: "debug" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("133");
});

test("info() returns the correct priority", () => {
  const output = info("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("134");
});

test("info() forces informational severity", () => {
  const output = info("foo", { severity: "debug" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("134");
});

test("debug() returns the correct priority", () => {
  const output = debug("foo");
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("135");
});

test("debug() forces debug severity", () => {
  const output = debug("foo", { severity: "informational" });
  const match = output.match(SYSLOG_PATTERN);

  expect(match).not.toBeNull();
  expect(match?.groups?.priority).toBe("135");
});

describe("parse()", () => {
  test("parses a well-formed message", () => {
    const parsed = parse("<128>1 2026-01-01T00:00:00.000Z host app 42 - -");

    expect(parsed.priority).toBe(128);
    expect(parsed.facility).toBe(16);
    expect(parsed.severity).toBe(0);
    expect(parsed.structuredData).toBe("-");
    expect(parsed.msg).toBeUndefined();
  });
});
