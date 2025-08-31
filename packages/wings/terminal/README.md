# @raven-js/wings/terminal

[![Website](https://img.shields.io/badge/website-ravenjs.dev-black?style=flat-square)](https://ravenjs.dev)
[![NPM Version](https://img.shields.io/npm/v/@raven-js/wings?style=flat-square)](https://www.npmjs.com/package/@raven-js/wings)
[![License](https://img.shields.io/npm/l/@raven-js/wings?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/node/v/@raven-js/wings?style=flat-square)](package.json)

**CLI command execution through Wings routing system.** Same routes handle HTTP requests and terminal commands.

```bash
npm install @raven-js/wings
```

```javascript
import { Router } from "@raven-js/wings/core";
import { Terminal, ask, success } from "@raven-js/wings/terminal";

const router = new Router();

// Same route handles web requests AND CLI commands
router.cmd("/deploy", async (ctx) => {
  const target = ctx.queryParams.get("env") || (await ask("Environment: "));

  // Deploy logic here...
  success(`Deployed to ${target}`);
});

// Execute: myapp deploy --env production
const terminal = new Terminal(router);
await terminal.run(process.argv.slice(2));
```

## API

**Terminal** - CLI execution runtime using Wings router
**ArgsToUrl/UrlToArgs** - bidirectional CLI↔URL transformation
**Actions** - input gathering, output formatting, table display

## Runtime

```javascript
const terminal = new Terminal(router);
await terminal.run(["deploy", "--env", "staging"]);

// CLI args → URL transformation
ArgsToUrl(["git", "commit", "--message", "fix"]);
// Returns: "/git/commit?message=fix"

UrlToArgs("/git/commit?message=fix&amend=true");
// Returns: ["git", "commit", "--message", "fix", "--amend"]
```

## Actions

```javascript
// Input gathering
const name = await ask("Project name: ");
const deploy = await confirm("Deploy now? ", true);

// Output formatting
success("Build completed");
error("Deploy failed");
warning("API deprecated");
info("Processing files");

// Text styling
print(bold("Important") + " " + dim("(details)"));
print(underline("https://example.com"));

// Tabular data
table([
  { name: "user1", role: "admin", active: true },
  { name: "user2", role: "user", active: false },
]);
```

## Integration

**HTTP + CLI Routes**: Use COMMAND method for CLI-specific routes or reuse GET/POST routes.

```javascript
// Shared route
router.get("/status", (ctx) => ctx.json({ status: "healthy" }));

// CLI-specific route
router.cmd("/deploy", deployHandler);

// Method detection
if (ctx.method === "COMMAND") {
  // CLI execution
} else {
  // HTTP request
}
```

**Context Mapping**: CLI args become URL paths/query params, responseBody becomes stdout, HTTP status codes become exit codes.

**Performance**: Direct Node.js I/O primitives, async stdin support, efficient route matching.

**TypeScript**: Full intellisense via JSDoc annotations. Works with TypeScript projects without additional setup.

**Node.js** 22.5.0+ **|** **Zero Dependencies**

MIT © [Anonyfox](https://anonyfox.com)
