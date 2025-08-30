# beak/sh

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)

**Shell command assembly without surprises** - Array joining with transparent whitespace normalization.

## Install

```bash
npm install @raven-js/beak
```

## Usage

```js
import { sh } from "@raven-js/beak";

// Array flag handling
const flags = ["-la", "--color=always"];
const files = ["src/", "test/"];
const cmd = sh`ls ${flags} ${files}`;
// → "ls -la --color=always src/ test/"

// Conditional flags with automatic filtering
const verbose = true;
const quiet = false;
const flags = ["-v", verbose && "--debug", quiet && "--quiet"];
const cmd = sh`npm install ${flags}`;
// → "npm install -v --debug"
```

## Functions

### `sh(strings, ...values)`

Minimal shell command builder focused on array-to-arguments conversion and clean formatting.

```js
const dockerFlags = ["-it", "--rm", "--name", "myapp"];
const volumes = ["-v", "/host:/container"];
const cmd = sh`docker run ${dockerFlags} ${volumes} nginx:alpine`;
// → "docker run -it --rm --name myapp -v /host:/container nginx:alpine"
```

**What it does:**

- Arrays become space-separated values
- Filters `null`, `undefined`, `false`, and `""` from arrays
- Collapses multiple spaces to single space
- Trims leading/trailing whitespace
- Template formatting cleanup

**What it doesn't do:**

- Any security escaping (developer's responsibility)
- Command validation or existence checking
- Cross-platform shell compatibility
- Execution or process management

## Value Processing

| Input Type                         | Output                | Notes                     |
| ---------------------------------- | --------------------- | ------------------------- |
| Arrays                             | Space-separated       | Falsy values filtered     |
| Strings                            | Direct pass-through   | No escaping applied       |
| Numbers                            | String conversion     | `3000` → `"3000"`         |
| `null`, `undefined`, `false`, `""` | Empty string          | Filtered out              |
| `true`                             | `"true"`              | Literal string            |
| Objects                            | `String()` conversion | Uses `.toString()` method |

## Real-World Examples

### Docker Commands

```js
const env = ["NODE_ENV=production", "PORT=3000"];
const mounts = ["-v", "/data:/app/data", "-v", "/logs:/app/logs"];
const cmd = sh`docker run ${env} ${mounts} -p 3000:3000 myapp:latest`;
// → "docker run NODE_ENV=production PORT=3000 -v /data:/app/data -v /logs:/app/logs -p 3000:3000 myapp:latest"
```

### Git Operations

```js
const files = ["src/", "test/", "*.md"];
const message = "feat: add new functionality";
const commitCmd = sh`git add ${files} && git commit -m "${message}"`;
// → `git add src/ test/ *.md && git commit -m "feat: add new functionality"`
```

### Build Scripts

```js
const nodeFlags = ["--max-old-space-size=4096", "--enable-source-maps"];
const production = process.env.NODE_ENV === "production";
const flags = [production && "--minify", "--bundle"];
const cmd = sh`node ${nodeFlags} build.js ${flags}`;
// → "node --max-old-space-size=4096 --enable-source-maps build.js --minify --bundle"
```

### SSH and Remote Commands

```js
const sshFlags = ["-o", "StrictHostKeyChecking=no", "-i", keyFile];
const remoteCmd = "systemctl restart nginx";
const cmd = sh`ssh ${sshFlags} user@server "${remoteCmd}"`;
// → `ssh -o StrictHostKeyChecking=no -i /path/to/key user@server "systemctl restart nginx"`
```

## Security Notice

⚠️ **No escaping is performed.** This is a convenience tool for command assembly, not a security tool.

For shell command security:

- Use dedicated escaping libraries for user input
- Validate all dynamic values before using
- Consider using `child_process` with array arguments instead of shell strings

```js
// ❌ Dangerous with user input
const userFile = getUserInput(); // Could be "; rm -rf /"
const bad = sh`cat ${userFile}`;

// ✅ Safe approach
import { spawn } from "child_process";
const safe = spawn("cat", [userFile]); // Array arguments are safe
```

## Performance

- **Template caching:** Identical templates compile once via WeakMap
- **Whitespace optimization:** Single regex pass for normalization
- **Fast path:** Static templates (no interpolations) optimized
- **Memory efficient:** No intermediate string allocations

## Requirements

- **Node.js:** 22.5+ (leverages modern JavaScript features)
- **Import:** ESM only, no CommonJS support
- **Types:** JSDoc annotations for TypeScript intellisense

## License

MIT
