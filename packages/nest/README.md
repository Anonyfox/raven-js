# @raven-js/nest 🦅

> **Raven's development nest** - CLI tools and build automation for the RavenJS ecosystem

_This is a private package for internal development tooling. It's not published to npm and is only used within the RavenJS monorepo._

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Private Package](https://img.shields.io/badge/Private-Package-red.svg)](https://github.com/Anonyfox/raven-js)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

## Overview

Nest is Raven's command center - the place where all the development tools and automation scripts come together. Like a raven's nest, it's where everything is built, maintained, and prepared for flight.

## Purpose

Nest provides a unified CLI interface for all RavenJS development tasks:

- **Building packages** with esbuild
- **Publishing workflows**
- **Documentation generation**
- **Version management**
- **Development automation**

## Usage

```bash
# From the root of the monorepo
npx @raven-js/nest validate
npx @raven-js/nest build
npx @raven-js/nest publish
npx @raven-js/nest docs
npx @raven-js/nest version

# Or from individual packages
npx @raven-js/nest validate packages/beak
npx @raven-js/nest build --package beak
```

## Commands

### `validate` - Package Validation

The `validate` command intelligently detects whether you're in a workspace or single package and validates accordingly.

**Workspace Mode:**
When run in a directory with a `package.json` containing a `workspaces` field, it validates:

- The workspace root package
- All packages found in the workspace directories

**Single Package Mode:**
When run in a regular package directory, it validates just that package.

**Usage Examples:**

```bash
# Validate current directory (auto-detects workspace vs package)
nest validate

# Validate specific package
nest validate packages/beak

# Validate workspace at specific path
nest validate /path/to/workspace

# Use check alias
nest check packages/nest
```

**What Gets Validated:**

- Package name format and validity
- Version format (semver compliance)
- Author information (required fields)
- License field and LICENSE file presence
- Package structure (README.md, main entry point)
- Required scripts (test, test:code, test:style)

**Output:**

- Clear progress indicators for each package
- Detailed error messages with error codes
- Overall validation status
- Proper exit codes (0 for success, 1 for failure)

## Architecture

```
nest/
├── bin/nest.js          # CLI entry point
├── src/
│   ├── commands/        # Individual command implementations
│   ├── utils/          # Shared utilities
│   └── index.js        # Main module exports
└── README.md
```

## Development

This package is private and only used internally. To work on it:

1. Make changes in the `src/` directory
2. Test with `npm test`
3. Use `npm run lint` and `npm run format` for code quality

## Philosophy

Nest embodies Raven's development philosophy:

- **Zero bloat**: Only includes what's actually needed
- **Modern JavaScript**: Uses ESNext features without transpilation
- **Efficient tooling**: Fast, reliable automation that gets out of your way
- **Clear purpose**: Each command does one thing well

---

_"In Raven's nest, every tool has its place, and every automation serves a purpose."_

---

<div align="center">

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

</div>
