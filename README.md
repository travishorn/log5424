# log5424

A lightweight RFC 5424 syslog message builder and parser for JavaScript and
Node.js.

This library focuses on generating valid, structured syslog messages with
practical defaults, strict validation, and a simple API that works well for both
one-off logs and reusable logger instances.

## Installation

```bash
npm install log5424
```

## Quick Start

```js
import { debug } from "log5424";

const line = debug("service started");

console.log(line);
// <135>1 2026-04-08T12:00:00.000Z my-host worker 1234 - - service started
```

## Usage Patterns

### 1) Direct severity functions

```js
import { error, info } from "5424";

console.log(info("ready"));
console.log(error("database connection failed", { appName: "api" }));
```

### 2) Reusable logger with custom options

```js
import { createLogger } from "log5424";

const logger = createLogger({ facility: "local4", appName: "checkout" });

console.log(logger.debug("cache hit"));
console.log(logger.error("payment declined", { msgId: "payment-error" }));
console.log(logger("app started")); // defaults to "debug" or custom severity you set when creating the logger
```

## Structured Data

Structured data can be provided in multiple forms:

- Raw RFC 5424 string
- Single object with `sdId`
- Array of objects with `sdId`

```js
import { info } from "log5424";

const line = info("request complete", {
  structuredData: [
    { sdId: "http@32473", method: "GET", path: "/health" },
    { sdId: "trace@32473", requestId: "abc-123" },
  ],
});
```

## Parsing

Use `parse()` to parse syslog messages.

```js
import { parse } from "log5424";

const parsed = parse(
  "<128>1 2026-01-01T00:00:00.000Z host app 42 event - hello",
);

console.log(parsed.priority); // 128
console.log(parsed.facility); // 16
console.log(parsed.severity); // 0
```

## Validation and Error Behavior

Inputs are validated aggressively and throw descriptive `TypeError`/`Error`
messages for invalid values.

Examples of validations include:

- Facility range/name correctness
- Severity range/name correctness
- RFC 3339 timestamp validity
- Token whitespace constraints for hostname/appName/msgId
- Structured data shape and formatting

## Development

Fork and clone the repository.

Install dependencies:

```bash
npm install
```

Check formatting:

```bash
npm run check:format
```

Check types:

```bash
npm run check:types
```

Lint code:

```bash
npm run check:lint
```

Run tests:

```bash
npm test
```

### Ideas for Further Development

- Support for RFC 3164
- Transports (std, file, udp, tcp)
- Relay/collector architecture roles

## License

The MIT License

Copyright 2026 Travis Horn

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
