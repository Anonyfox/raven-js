# Glean Library Architecture

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/Documentation-docs.ravenjs.dev/glean-blue.svg)](https://docs.ravenjs.dev/glean)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)

Internal architecture documentation for Glean library developers and contributors.

## What is Glean Lib?

**Glean Lib** provides the core functionality behind the Glean CLI - JSDoc parsing, validation, static site generation, and documentation server capabilities as reusable library components.

This is the internal API for developers extending Glean or integrating its capabilities into custom tooling.

## Architecture Overview

Glean follows a clean 4-layer architecture:

```
CLI Layer (bin/glean.js)
├── Command Layer (index.js)
├── Processing Layer (lib/)
│   ├── discover/     - File system scanning and package discovery
│   ├── extract/      - JSDoc parsing and entity modeling
│   ├── server/       - Documentation server with routes and templates
│   └── Core modules  - validate.js, static-generate.js, analyze.js
└── Foundation Layer
    ├── Models        - JSDoc tags, entities, packages
    └── Utilities     - File system, parsing, rendering
```

## Module System

### Discover Module (`lib/discover/`)

Discovers and maps package structure for documentation processing:

```javascript
import { discover } from "./lib/discover/index.js";

const packageMetadata = discover("./my-package");
// Returns package structure with files, modules, entry points
```

**Sub-modules:**

- `fsutils/` - File system operations (glob, listing, entry point resolution)
- `models/` - File, identifier, module, package abstractions
- `parser/` - Entry point parsing and identifier extraction

### Extract Module (`lib/extract/`)

Transforms discovered package data into structured documentation:

```javascript
import { extract } from "./lib/extract/index.js";

const packageInstance = extract(packageMetadata);
// Returns rich documentation structure with JSDoc entities
```

**Sub-modules:**

- `models/jsdoc/` - 23+ JSDoc tag implementations (@param, @returns, etc.)
- `models/entities/` - JavaScript entity models (function, class, variable, etc.)
- `models/` - Attribution, module, package documentation containers
- `parse-source.js` - Core JSDoc parsing engine

### Server Module (`lib/server/`)

Complete documentation website generation and serving:

```javascript
import { createDocumentationServer } from "./lib/server/index.js";

const server = createDocumentationServer("./my-package", {
  domain: "docs.myproject.com",
  enableLogging: true,
});
server.listen(3000);
```

**Sub-modules:**

- `components/` - 10+ reusable UI components (alerts, navigation, etc.)
- `data/` - Data extraction for different page types
- `routes/` - HTTP route handlers for all documentation pages
- `templates/` - HTML template generation with Bootstrap 5

### Core Modules (`lib/`)

High-level processing functions:

- `validate.js` - JSDoc validation and quality analysis
- `static-generate.js` - Static site generation orchestration
- `analyze.js` - CLI-compatible validation interface

## Integration Examples

### Custom Validation

```javascript
import { runValidation } from "./lib/validate.js";

const results = await runValidation("./src", {
  verbose: true,
  rules: ["completeness", "syntax", "types"],
});

console.log(`${results.errorCount} errors, ${results.warningCount} warnings`);
```

### Static Site Generation

```javascript
import { generateStaticSite } from "./lib/static-generate.js";

await generateStaticSite("./src", "./docs", {
  domain: "docs.myproject.com",
  verbose: true,
});
// Generates complete documentation site in ./docs
```

### Custom Documentation Server

```javascript
import { createDocumentationServer } from "./lib/server/index.js";

const server = createDocumentationServer("./my-package");

// Access package data
const pkg = server.packageInstance;
console.log(`Documenting ${pkg.name} with ${pkg.allEntities.length} entities`);

// Start with custom configuration
server.listen(8080, "0.0.0.0");
```

## Model System

### JSDoc Tag Models

Each JSDoc tag is implemented as a dedicated class:

```javascript
import {
  ParamTag,
  ReturnsTag,
  ExampleTag,
} from "./lib/extract/models/jsdoc/index.js";

// Parse @param tag
const paramTag = new ParamTag();
paramTag.parseContent("{string} name - User name");
console.log(paramTag.type, paramTag.name, paramTag.description);
```

Available tag models: `@param`, `@returns`, `@example`, `@deprecated`, `@since`, `@throws`, `@author`, `@see`, and 15+ more.

### Entity Models

JavaScript constructs are modeled as entities:

```javascript
import {
  FunctionEntity,
  ClassEntity,
} from "./lib/extract/models/entities/index.js";

// Create function documentation
const func = new FunctionEntity("myFunction", "function", source);
func.addJSDocTag(paramTag);
func.addJSDocTag(returnsTag);
```

Available entity models: `function`, `class`, `variable`, `typedef`, `callback`, `enum`, `constant`, `interface`.

### Package Organization

```javascript
import { Package } from "./lib/extract/models/package.js";
import { Module } from "./lib/extract/models/module.js";

const pkg = new Package(packageJson, files);
const module = new Module(pkg, "./src/utils.js", "my-package/utils");

pkg.addModule(module);
module.addEntity(functionEntity);
```

## Testing Integration

```javascript
// Test custom validation
import { runValidation } from "./lib/validate.js";
import assert from "node:assert";

const results = await runValidation("./test-fixtures");
assert.equal(results.errorCount, 0);
```

## Extension Points

### Custom JSDoc Tags

```javascript
import { JSDocTagBase } from "./lib/extract/models/jsdoc/base.js";

class CustomTag extends JSDocTagBase {
  constructor() {
    super("custom", "Custom tag description");
  }

  parseContent(content) {
    // Custom parsing logic
    this.customValue = content.trim();
  }
}
```

### Custom Entity Types

```javascript
import { EntityBase } from "./lib/extract/models/entities/base.js";

class CustomEntity extends EntityBase {
  constructor(name, source) {
    super(name, "custom", source);
  }

  // Custom entity processing
}
```

### Custom UI Components

```javascript
import { html } from "@raven-js/beak";

export function customComponent(options) {
  return html`<div class="custom">${options.content}</div>`;
}
```

## Performance Considerations

- **Single-pass processing** - Files are read once during discovery
- **Lazy evaluation** - Documentation generated on-demand
- **Memory optimization** - Large packages processed in chunks
- **Caching** - Server responses cached with appropriate headers

## Zero Dependencies Philosophy

Glean uses only:

- Node.js built-in modules (`fs`, `path`, `url`, etc.)
- `@raven-js/beak` - HTML templating and utilities
- `@raven-js/wings` - HTTP server framework

No external parsing libraries, CSS frameworks, or build tools required.

## Development Workflow

```bash
# Validate library code
npm test

# Test with actual package
node bin/glean.js validate ./test-fixtures

# Start development server
node bin/glean.js server ./test-fixtures

# Generate test documentation
node bin/glean.js ssg ./test-fixtures ./test-docs
```

## Requirements

- Node.js 22.5+
- ESM-compatible JavaScript codebase
- JSDoc comments in source files

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
