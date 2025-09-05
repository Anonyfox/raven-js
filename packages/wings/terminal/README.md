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

// Quick usage: handler function
router.cmd("/deploy", async (ctx) => {
  const target = ctx.queryParams.get("env") || (await ask("Environment: "));

  // Deploy logic here...
  success(`Deployed to ${target}`);
});

// Execute: myapp deploy --env production
const terminal = new Terminal(router);
await terminal.run(process.argv.slice(2));
```

## Advanced Usage

For complex commands with validation, lifecycle hooks, and rich metadata:

```javascript
import {
  CommandRoute,
  ValidationError,
  info,
  success,
  error,
  confirm,
} from "@raven-js/wings/terminal";

class DeployCommand extends CommandRoute {
  constructor() {
    super("/deploy/:environment", "Deploy to target environment");

    // Declare flags with validation
    this.flag("config", { type: "string", required: true });
    this.flag("verbose", { type: "boolean" });
    this.flag("tags", { type: "string", multiple: true });
    this.flag("timeout", { type: "number", default: 300 });
  }

  async beforeExecute(ctx) {
    info("🚀 Initializing deployment...");
    ctx.deployConfig = await this.loadConfig(ctx.queryParams.get("config"));
  }

  async execute(ctx) {
    const environment = ctx.pathParams.environment;
    const verbose = ctx.queryParams.get("verbose") === "true";
    const tags = ctx.queryParams.getAll("tags");
    const files = this.getPositionalArgs(ctx);

    // Access stdin data
    const configOverrides = ctx.requestBody();

    await deployArtifacts(ctx.deployConfig, environment, files, {
      verbose,
      tags,
      configOverrides,
    });
  }

  async afterExecute(ctx) {
    success("✅ Deployment completed successfully");
  }

  async onError(error, ctx) {
    error(`❌ Deployment failed: ${error.message}`);
    if (await confirm("Rollback changes?")) {
      await this.rollback(ctx);
    }
  }
}

// Register command class
router.addRoute(new DeployCommand());
```

## API

**Terminal** - CLI execution runtime using Wings router
**CommandRoute** - advanced command class with validation and lifecycle hooks
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

## Command Features

**Flag Validation**: Automatic type checking, required flags, choices, multiple values
**Lifecycle Hooks**: `beforeExecute` → `execute` → `afterExecute` → `onError` (on failure)
**Stdin Support**: `ctx.requestBody()` provides piped input data
**Positional Args**: `this.getPositionalArgs(ctx)` returns non-flag arguments
**Path Parameters**: `ctx.pathParams` from route patterns like `/deploy/:env`

```javascript
// Usage examples
// myapp deploy staging --config deploy.json --verbose --tag v1.0 --tag stable file1.js file2.js < config.json

// In execute method:
const env = ctx.pathParams.environment; // "staging"
const config = ctx.queryParams.get("config"); // "deploy.json"
const verbose = ctx.queryParams.get("verbose") === "true"; // true
const tags = ctx.queryParams.getAll("tag"); // ["v1.0", "stable"]
const files = this.getPositionalArgs(ctx); // ["file1.js", "file2.js"]
const stdin = ctx.requestBody(); // Buffer from piped input
```

## Integration

**Progressive Enhancement**: Start with simple handlers, upgrade to CommandRoute classes when needed.

```javascript
// Quick: handler function
router.cmd("/status", (ctx) => success("System healthy"));

// Advanced: command class with validation
router.addRoute(new StatusCommand());
```

**Context Mapping**: CLI args become URL paths/query params, responseBody becomes stdout, HTTP status codes become exit codes.

**Performance**: Direct Node.js I/O primitives, async stdin support, efficient route matching.

**TypeScript**: Full intellisense via JSDoc annotations. Works with TypeScript projects without additional setup.

**Node.js** 22.5.0+ **|** **Zero Dependencies**

MIT © [Anonyfox](https://anonyfox.com)
