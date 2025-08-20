# 🔍 Glean Roadmap - Documentation Archaeology for Modern JavaScript

## Vision

Glean transforms scattered JSDoc comments and package documentation into beautiful, comprehensive docs through surgical precision analysis. Three core operations: **analyze** (validate), **extract** (graph), **render** (static docs).

## Architecture Philosophy

**Multi-pass pipeline** processing with zero external dependencies (except RavenJS packages). Each pass builds upon previous results, enabling incremental processing and surgical precision.

**Graph-first approach** - Everything becomes nodes in a serializable graph with labeled references instead of circular pointers. Assets collected and base64-encoded for self-contained output.

## Core Subcommands

### `glean analyze <path>`

Validation and compliance reporting for documentation quality.

**Input:** Package directory
**Output:** Terminal report with per-file findings
**Purpose:** Help developers identify missing/malformed docs

### `glean extract <path> [--output file.json]`

Parse package into comprehensive graph structure.

**Input:** Package directory
**Output:** JSON graph of all code entities + docs + assets
**Purpose:** Create machine-readable documentation database

### `glean render <input.json> <output-dir>`

Generate beautiful static documentation from extracted graph.

**Input:** JSON graph file
**Output:** Static HTML documentation site
**Purpose:** Publish-ready documentation

### `glean build <path> <output-dir>` _(convenience)_

Extract + render in single operation for common workflow.

## Processing Pipeline

### Phase 1: Discovery

**Goal:** Map the package landscape

**Operations:**

- Parse `package.json` exports to identify entry points
- Recursively scan for `.js` files following export patterns
- Locate `README.md` files in directories
- Build file dependency tree from import/export statements

**Output:** File registry with entry points, dependencies, README locations

**Technical approach:**

- Use `fs.readdir` with recursive scanning
- Parse package.json exports using JSON + path resolution
- Simple import/export extraction via targeted regex patterns
- Build dependency graph for processing order

### Phase 2: Entity Extraction

**Goal:** Parse code structures and documentation

**Operations:**

- Extract JavaScript entities (functions, classes, variables, types)
- Parse JSDoc comments with full tag support
- Process README.md content using Beak markdown parser
- Identify asset references in docs (images, files)

**Output:** Raw entity collection with unparsed relationships

**Technical approach:**

- **AST-light parsing:** Custom parser targeting specific patterns instead of full AST
- **JSDoc extraction:** Multi-line comment regex + structured tag parsing
- **Entity detection:** Function/class/const declarations via targeted patterns
- **Asset discovery:** Markdown link parsing + file existence validation

### Phase 3: Relationship Mapping

**Goal:** Connect entities and resolve references

**Operations:**

- Link JSDoc `@param`, `@returns`, `@see` references
- Map export/import relationships between modules
- Resolve type references and inheritance chains
- Connect README content to relevant code sections

**Output:** Connected graph with labeled references

**Technical approach:**

- **Reference resolution:** Symbol table + scope-aware linking
- **Export mapping:** Match package.json exports to actual code entities
- **Type linking:** JSDoc type annotation parsing and cross-referencing
- **Bi-directional indexing:** Entities know their references and dependents

### Phase 4: Asset Collection

**Goal:** Gather and encode referenced assets

**Operations:**

- Collect images/files referenced in docs
- Base64 encode asset content
- Validate asset paths and handle missing files
- Build asset registry with metadata

**Output:** Self-contained asset database

**Technical approach:**

- **Path resolution:** Relative path handling from README/JSDoc locations
- **File reading:** `fs.readFile` with binary handling
- **Encoding:** Base64 conversion for embeddable assets
- **Validation:** Missing asset warnings with graceful degradation

### Phase 5: Graph Serialization

**Goal:** Create JSON-serializable documentation database

**Operations:**

- Convert object references to labeled IDs
- Serialize entity relationships as reference arrays
- Embed asset data and README content
- Generate package-level metadata

**Output:** Single JSON file containing complete package documentation

**Technical approach:**

- **ID generation:** Deterministic unique identifiers for entities
- **Circular reference elimination:** Replace pointers with ID strings
- **Compression strategies:** Efficient JSON structure for large packages
- **Validation:** Schema adherence and reference integrity checks

### Phase 6: Static Generation _(render subcommand)_

**Goal:** Transform JSON graph into beautiful static docs

**Operations:**

- Generate HTML pages using Beak templating
- Create navigation structure from package exports
- Render code examples with syntax highlighting
- Build search index and cross-references

**Output:** Static documentation website

**Technical approach:**

- **Template-driven:** Beak HTML templates for consistent styling
- **Progressive generation:** File-by-file output for memory efficiency
- **Asset embedding:** Inline base64 assets or extract to files
- **Navigation:** Hierarchical menu from package structure

## Data Structures

### Entity Graph Node

```javascript
{
  id: "package/module/functionName",
  type: "function|class|variable|type|module",
  name: "functionName",
  location: { file: "path/to/file.js", line: 42, column: 8 },
  exports: ["default", "named"], // How this entity is exported
  jsdoc: {
    description: "Function description",
    tags: {
      param: [{ name: "arg1", type: "string", description: "..." }],
      returns: { type: "boolean", description: "..." },
      see: ["reference1", "reference2"],
      since: "1.0.0"
    }
  },
  references: ["id1", "id2"], // IDs of entities this references
  referencedBy: ["id3", "id4"], // IDs of entities referencing this
  source: "function code snippet"
}
```

### Package Graph

```javascript
{
  package: {
    name: "@raven-js/example",
    version: "1.0.0",
    exports: { /* parsed package.json exports */ }
  },
  modules: {
    "module-id": { /* module entity */ }
  },
  entities: {
    "entity-id": { /* entity node */ }
  },
  readmes: {
    "path/to/folder": { content: "markdown", assets: ["asset1"] }
  },
  assets: {
    "asset-id": { path: "images/logo.png", content: "base64...", type: "image/png" }
  }
}
```

## Implementation Strategy

### Core Modules

**`lib/discovery.js`** - Package scanning and file discovery
**`lib/extraction.js`** - Entity and JSDoc parsing
**`lib/linking.js`** - Reference resolution and graph building
**`lib/assets.js`** - Asset collection and encoding
**`lib/serialization.js`** - JSON graph generation
**`lib/rendering.js`** - Static site generation
**`lib/validation.js`** - Documentation quality analysis

### Performance Optimizations

**Streaming processing** for large packages - process files individually rather than loading everything into memory.

**Targeted parsing** instead of full AST - Use surgical regex patterns for common JavaScript constructs to avoid parser overhead.

**Incremental builds** - Cache extraction results and only reprocess changed files during development.

**Lazy asset loading** - Only encode assets when actually referenced to avoid unnecessary file I/O.

### Error Handling

**Graceful degradation** - Continue processing when encountering malformed JSDoc or missing assets.

**Detailed error reporting** - Line-level error messages for debugging documentation issues.

**Validation modes** - Strict mode (fail on errors) vs. lenient mode (warn and continue).

## Technology Choices

### Core Dependencies

- **Node.js 22+ built-ins** - `fs`, `path`, `url` for file operations
- **@raven-js/beak** - Markdown processing and HTML templating
- **Zero external packages** - Pure JavaScript implementation

### Parsing Strategy

- **Custom JavaScript parser** - Lightweight, targeted at JSDoc extraction
- **Regex-based JSDoc parsing** - Efficient for comment extraction
- **Manual export resolution** - Handle complex package.json export maps

### Output Formats

- **JSON graph** - Primary interchange format
- **Static HTML** - Beautiful documentation sites
- **Terminal reports** - Developer-friendly validation output

## Success Metrics

**Performance:** Process packages like `@raven-js/wings` (88 files) in under 2 seconds
**Accuracy:** 100% JSDoc tag extraction for common tags (`@param`, `@returns`, `@see`)
**Completeness:** Handle complex export maps without missing entry points
**Usability:** Clear, actionable validation reports that guide developers to issues

## Future Extensions

**Documentation coverage metrics** - Percentage of functions with complete docs
**API diff detection** - Compare documentation between versions
**Integration hooks** - Generate docs as part of build pipelines
**Custom rendering themes** - Pluggable templates for different documentation styles

---

_This roadmap prioritizes surgical precision over feature bloat - each component serves a specific purpose in the documentation archaeology workflow, building toward comprehensive yet maintainable documentation tooling._
