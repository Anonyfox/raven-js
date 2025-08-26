# Documentation Web Application Concept

## Overview

A lean, dynamic web server that renders documentation pages on-demand from lib2 extract package data. Each entity gets its own intelligently cross-linked page, leveraging beak for HTML rendering and SEO optimization.

## Data Source & Server Architecture

**Single Source of Truth:** The lib2 `Package` instance loaded once in memory
**Server Stack:** Wings server holding the Package instance, rendering pages dynamically with beak templates
**No Database:** Pure in-memory data structure, fast response times
**Static Assets:** Bootstrap dependencies from `glean/static/` served from memory
**Unit Testing:** Wings router easily testable without server boot - 100% data assertion coverage

## Route Architecture & Data Extraction

### Package Overview Page (`/`)

**Purpose**: Main landing page introducing the entire package

**Step-by-Step Data Extraction:**

```javascript
// STEP 1: Basic package information
const name = package.name; // String: package name
const version = package.version; // String: package version
const description = package.description; // String: package description

// STEP 2: README content for main content area
const readmeMarkdown = package.readme; // String: raw markdown content
// Process with: beak's md processor → HTML

// STEP 3: Module navigation data
const modules = package.modules.map((module) => ({
  name: module.importPath, // String: "beak/html"
  isDefault: module.isDefault, // Boolean: is main module
  publicEntityCount: module.publicEntityCount, // Number: public entities
  availableTypes: module.availableEntityTypes, // Array: ["function", "class"]
}));

// STEP 4: Package statistics
const stats = {
  moduleCount: package.moduleCount, // Number: total modules
  entityCount: package.entityCount, // Number: total entities
  publicEntityCount: package.modules.reduce(
    (sum, m) => sum + m.publicEntityCount,
    0
  ),
};
```

**Content Rendered:**

- Package header: `name`, `version`, `description`
- Rendered README: `readmeMarkdown` → processed through beak's `md` processor
- Module grid: Loop through `modules` array
- Statistics: Display `stats` object

### Module Directory (`/modules/`)

**Purpose**: Overview of all available modules

**Step-by-Step Data Extraction:**

```javascript
// STEP 1: Module list with metadata
const moduleList = package.modules.map((module) => {
  return {
    // Basic module info
    importPath: module.importPath, // String: "beak/html"
    isDefault: module.isDefault, // Boolean: main module flag

    // Content preview
    hasReadme: Boolean(module.readme), // Boolean: has documentation
    readmePreview: module.readme.slice(0, 200), // String: first 200 chars

    // Entity statistics
    entityCount: module.entityCount, // Number: all entities
    publicEntityCount: module.publicEntityCount, // Number: public only
    entityTypes: module.availableEntityTypes, // Array: types present

    // Sample entities for preview cards
    sampleEntities: module.publicEntities.slice(0, 3).map((entity) => ({
      name: entity.name, // String: entity name
      type: entity.entityType, // String: "function"
      description: entity.description.slice(0, 100), // String: preview
    })),
  };
});

// STEP 2: Directory statistics
const directoryStats = {
  totalModules: package.moduleCount,
  totalPublicEntities: package.modules.reduce(
    (sum, m) => sum + m.publicEntityCount,
    0
  ),
  entityTypeDistribution: getEntityTypeDistribution(package),
};

function getEntityTypeDistribution(package) {
  const types = {};
  package.allEntities.forEach((entity) => {
    const type = entity.entityType;
    types[type] = (types[type] || 0) + 1;
  });
  return types; // Returns: { "function": 45, "class": 12, "typedef": 8 }
}
```

### Module Overview (`/modules/{moduleName}/`)

**Purpose**: Introduction to a specific module and its capabilities

**Step-by-Step Data Extraction:**

```javascript
// STEP 1: Find the target module
const moduleName = req.params.moduleName; // From URL: "html"
const fullImportPath = `${package.name}/${moduleName}`; // "beak/html"
const module = package.findModuleByImportPath(fullImportPath);
// OR manual find: package.modules.find(m => m.importPath === fullImportPath)

// STEP 2: Module metadata
const moduleData = {
  importPath: module.importPath, // String: "beak/html"
  isDefault: module.isDefault, // Boolean: false
  name: moduleName, // String: "html" (for display)

  // Documentation content
  readme: module.readme, // String: module README markdown
  hasReadme: Boolean(module.readme), // Boolean: documentation exists

  // Entity organization
  publicEntityGroups: module.publicEntityGroups, // Object: grouped by type
  entityCount: module.publicEntityCount, // Number: public entity count
  availableTypes: module.availableEntityTypes, // Array: ["function", "variable"]
};

// STEP 3: Entity listings organized by type
const organizedEntities = {};
Object.entries(module.publicEntityGroups).forEach(([type, entities]) => {
  organizedEntities[type] = entities.map((entity) => ({
    name: entity.name, // String: entity name
    description: entity.description, // String: description
    location: entity.location, // Object: {file, line, column}

    // Quick metadata for listing
    hasParams: entity.hasJSDocTag("param"), // Boolean: has parameters
    hasReturns: entity.hasJSDocTag("returns"), // Boolean: has return value
    hasExamples: entity.hasJSDocTag("example"), // Boolean: has examples
    isDeprecated: entity.hasJSDocTag("deprecated"), // Boolean: deprecated

    // Direct link generation
    link: `/modules/${moduleName}/${entity.name}/`, // String: relative URL
  }));
});

// STEP 4: Navigation context
const navigationContext = {
  packageName: package.name, // String: "beak"
  allModules: package.modules.map((m) => ({
    // Array: sibling modules
    name: m.importPath.split("/").pop(), // String: "html", "css"
    isCurrent: m.importPath === module.importPath, // Boolean: current page
    link: `/modules/${m.importPath.split("/").pop()}/`, // String: relative URL
  })),
};
```

### Entity Pages (`/modules/{moduleName}/{entityName}/`)

**Purpose**: Complete documentation for individual functions, classes, etc.

**Step-by-Step Data Extraction:**

```javascript
// STEP 1: Find the target entity
const moduleName = req.params.moduleName; // From URL: "html"
const entityName = req.params.entityName; // From URL: "html"
const module = package.findModuleByImportPath(`${package.name}/${moduleName}`);
const entity = module.findEntityByName(entityName);

// STEP 2: Core entity information
const entityData = {
  name: entity.name, // String: "html"
  type: entity.entityType, // String: "function"
  description: entity.description, // String: main description
  source: entity.source, // String: raw source code
  location: entity.location, // Object: {file, line, column}
  moduleId: entity.moduleId, // String: module identifier

  // Import statement generation
  importPath: module.importPath, // String: "beak/html"
  importStatement: `import { ${entity.name} } from '${module.importPath}';`,
};

// STEP 3: JSDoc documentation extraction
const documentation = {
  // Parameters
  parameters: entity.getJSDocTagsByType("param").map((paramTag) => ({
    name: paramTag.name, // String: parameter name
    type: paramTag.type, // String: parameter type
    description: paramTag.description, // String: parameter description
    optional: paramTag.optional, // Boolean: is optional
    defaultValue: paramTag.defaultValue, // String: default value if any
  })),

  // Return value
  returns: entity.getJSDocTag("returns"), // Object: {type, description} or null

  // Code examples
  examples: entity.getJSDocTagsByType("example").map((exampleTag) => ({
    description: exampleTag.description, // String: example description
    code: exampleTag.code, // String: example code
    language: "javascript", // String: syntax highlighting
  })),

  // Error conditions
  throws: entity.getJSDocTagsByType("throws").map((throwsTag) => ({
    type: throwsTag.type, // String: error type
    description: throwsTag.description, // String: when it throws
  })),

  // Cross-references
  seeReferences: entity.getJSDocTagsByType("see").map((seeTag) => ({
    reference: seeTag.reference, // String: reference text
    description: seeTag.description, // String: optional description
    isInternal: isInternalReference(seeTag.reference, package), // Boolean: internal link
  })),

  // Metadata
  deprecated: entity.getJSDocTag("deprecated"), // Object: {description} or null
  since: entity.getJSDocTag("since"), // Object: {version} or null
  author: entity.getJSDocTag("author"), // Object: {name, email} or null
};

// STEP 4: Cross-linking and related entities
const relatedEntities = {
  // Same module entities (siblings)
  sameModule: module.publicEntities
    .filter((e) => e.name !== entity.name) // Exclude current entity
    .map((e) => ({
      name: e.name, // String: entity name
      type: e.entityType, // String: entity type
      description: e.description.slice(0, 100), // String: short description
      link: `/modules/${moduleName}/${e.name}/`, // String: relative URL
    }))
    .slice(0, 5), // Limit to 5 related entities

  // Type dependencies (entities that use this entity's type)
  typeDependencies: findTypeDependencies(entity, package),

  // See also references (from @see tags)
  seeAlso: documentation.seeReferences
    .filter((ref) => ref.isInternal) // Only internal references
    .map((ref) => findEntityByReference(ref.reference, package))
    .filter(Boolean), // Remove null results
};

// STEP 5: Navigation context
const navigationContext = {
  // Breadcrumb data
  breadcrumbs: [
    { name: package.name, link: "/" },
    { name: "Modules", link: "/modules/" },
    { name: moduleName, link: `/modules/${moduleName}/` },
    { name: entityName, link: null }, // Current page
  ],

  // Sibling navigation (previous/next in module)
  siblings: getSiblingNavigation(entity, module),

  // Jump-to dropdown
  allEntitiesInModule: module.publicEntities.map((e) => ({
    name: e.name,
    type: e.entityType,
    isCurrent: e.name === entity.name,
    link: `/modules/${moduleName}/${e.name}/`,
  })),
};

// Helper functions for complex data extraction
function findTypeDependencies(entity, package) {
  return package.allEntities
    .filter((otherEntity) => {
      // Check if other entity's parameters reference this entity
      const paramReferences = otherEntity
        .getJSDocTagsByType("param")
        .some((param) => param.type && param.type.includes(entity.name));

      // Check if other entity's return type references this entity
      const returnReference = otherEntity
        .getJSDocTag("returns")
        ?.type?.includes(entity.name);

      return paramReferences || returnReference;
    })
    .slice(0, 3); // Limit results
}

function getSiblingNavigation(currentEntity, module) {
  const entities = module.publicEntities;
  const currentIndex = entities.findIndex((e) => e.name === currentEntity.name);

  return {
    previous:
      currentIndex > 0
        ? {
            name: entities[currentIndex - 1].name,
            link: `/modules/${module.importPath.split("/").pop()}/${
              entities[currentIndex - 1].name
            }/`,
          }
        : null,

    next:
      currentIndex < entities.length - 1
        ? {
            name: entities[currentIndex + 1].name,
            link: `/modules/${module.importPath.split("/").pop()}/${
              entities[currentIndex + 1].name
            }/`,
          }
        : null,
  };
}
```

### API Reference (`/api/`)

**Purpose**: Comprehensive searchable API reference

**Step-by-Step Data Extraction:**

```javascript
// STEP 1: Flatten all entities with module context
const allEntitiesData = package.allEntities.map((entity) => {
  // Find parent module for context
  const parentModule = package.modules.find((module) =>
    module.entities.includes(entity)
  );

  return {
    // Core identification
    name: entity.name, // String: entity name
    type: entity.entityType, // String: "function", "class", etc.
    description: entity.description, // String: description

    // Module context
    moduleName: parentModule?.importPath?.split("/").pop() || "unknown",
    moduleImportPath: parentModule?.importPath, // String: full import path

    // Location information
    location: entity.location, // Object: {file, line, column}

    // Quick metadata for filtering/searching
    hasParams: entity.hasJSDocTag("param"), // Boolean: searchable
    hasReturns: entity.hasJSDocTag("returns"), // Boolean: searchable
    hasExamples: entity.hasJSDocTag("example"), // Boolean: searchable
    isDeprecated: entity.hasJSDocTag("deprecated"), // Boolean: filterable
    isPrivate: entity.hasJSDocTag("private"), // Boolean: filterable

    // Generated links
    link: `/modules/${parentModule?.importPath?.split("/").pop()}/${
      entity.name
    }/`,

    // Search-optimized content
    searchableContent: [
      entity.name,
      entity.description,
      ...entity.getJSDocTagsByType("param").map((p) => p.name),
      entity.getJSDocTag("returns")?.type || "",
    ]
      .join(" ")
      .toLowerCase(),
  };
});

// STEP 2: API statistics and breakdowns
const apiStats = {
  totalEntities: package.entityCount,
  totalModules: package.moduleCount,

  // Entity type breakdown
  entityTypeBreakdown: getEntityTypeBreakdown(package.allEntities),

  // Module breakdown
  moduleBreakdown: package.modules.map((module) => ({
    name: module.importPath.split("/").pop(),
    entityCount: module.publicEntityCount,
    types: module.availableEntityTypes,
  })),

  // Coverage statistics
  documentationCoverage: {
    withDescription: package.allEntities.filter((e) => e.description).length,
    withParams: package.allEntities.filter((e) => e.hasJSDocTag("param"))
      .length,
    withReturns: package.allEntities.filter((e) => e.hasJSDocTag("returns"))
      .length,
    withExamples: package.allEntities.filter((e) => e.hasJSDocTag("example"))
      .length,
  },
};

// STEP 3: Search and filter data structures
const searchFilters = {
  // Available types for filtering
  availableTypes: [...new Set(package.allEntities.map((e) => e.entityType))],

  // Available modules for filtering
  availableModules: package.modules.map((m) => ({
    name: m.importPath.split("/").pop(),
    importPath: m.importPath,
    entityCount: m.publicEntityCount,
  })),

  // Quick access categories
  categories: {
    functions: allEntitiesData.filter((e) => e.type === "function"),
    classes: allEntitiesData.filter((e) => e.type === "class"),
    types: allEntitiesData.filter((e) => e.type === "typedef"),
    variables: allEntitiesData.filter((e) => e.type === "variable"),
    deprecated: allEntitiesData.filter((e) => e.isDeprecated),
  },
};

function getEntityTypeBreakdown(entities) {
  const types = {};
  entities.forEach((entity) => {
    const type = entity.entityType;
    types[type] = (types[type] || 0) + 1;
  });
  return types; // Returns: { "function": 45, "class": 12, "typedef": 8 }
}
```

## Cross-linking & Related Entity Logic

### Related Entity Detection

**Type-Based Relationships:**

```javascript
function findRelatedEntities(currentEntity, package) {
  const related = [];

  // 1. Same module entities
  const sameModule = package
    .findModuleByImportPath(currentEntity.moduleId)
    .publicEntities.filter((e) => e.name !== currentEntity.name);

  // 2. Type dependencies - entities that reference this entity's types
  const typeDependencies = package.allEntities.filter((entity) => {
    return (
      entity
        .getJSDocTagsByType("param")
        .some(
          (param) => param.type && param.type.includes(currentEntity.name)
        ) || entity.getJSDocTag("returns")?.type?.includes(currentEntity.name)
    );
  });

  // 3. @see tag references
  const seeReferences = currentEntity
    .getJSDocTagsByType("see")
    .map((see) =>
      package.allEntities.find((e) => see.reference.includes(e.name))
    )
    .filter(Boolean);

  return {
    sameModule: sameModule.slice(0, 5),
    typeDependencies: typeDependencies.slice(0, 3),
    seeReferences: seeReferences,
  };
}
```

### Type Link Generation

**Automatic Link Detection:**

```javascript
function generateTypeLinks(typeString, package) {
  // Find entity names in type strings like "Array<EntityName>" or "EntityName|null"
  const entityPattern = /\b([A-Z][a-zA-Z0-9]*)\b/g;

  return typeString.replace(entityPattern, (match) => {
    const entity = package.allEntities.find((e) => e.name === match);
    if (entity) {
      return `<a href="/modules/${entity.moduleId}/${entity.name}/">${match}</a>`;
    }
    return match;
  });
}
```

## SEO Data Generation

### Page-Level SEO

**Meta Tags from Entity Data:**

```javascript
function generateSEOData(entity, module, package) {
  return {
    title: `${entity.name}() - ${module.importPath} - ${package.name}`,
    description: entity.description.slice(0, 155), // Meta description limit
    keywords: [
      entity.name,
      entity.entityType,
      module.importPath.split("/").pop(),
      package.name,
      "javascript",
      "documentation",
    ].join(", "),

    openGraph: {
      title: `${entity.name}() function`,
      description: entity.description,
      type: "article",
      url: `/modules/${module.importPath}/${entity.name}/`,

      // Code preview as image-like content
      codePreview: entity.source.split("\n").slice(0, 10).join("\n"),
    },

    jsonLD: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      name: `${entity.name} Documentation`,
      description: entity.description,
      programmingLanguage: "JavaScript",
      codeRepository: `https://github.com/owner/${package.name}`,
    },
  };
}
```

### Sitemap Generation

**Dynamic Sitemap from Package Data:**

```javascript
function generateSitemap(package) {
  const urls = [
    { loc: "/", priority: 1.0, changefreq: "weekly" },
    { loc: "/modules/", priority: 0.8, changefreq: "weekly" },
    { loc: "/api/", priority: 0.7, changefreq: "weekly" },
  ];

  // Add module pages
  package.modules.forEach((module) => {
    urls.push({
      loc: `/modules/${module.importPath}/`,
      priority: 0.6,
      changefreq: "monthly",
    });

    // Add entity pages
    module.publicEntities.forEach((entity) => {
      urls.push({
        loc: `/modules/${module.importPath}/${entity.name}/`,
        priority: 0.5,
        changefreq: "monthly",
      });
    });
  });

  return urls;
}
```

## Configuration Options

**Configurable Parameters** (CLI flags and defaults):

- **domain**: Base domain for SEO/links (default: `anonyfox.com`)
- **port**: Server port (default: `3000`)
- **packagePath**: Target package to document (CLI argument)

**Static Asset Management:**

- **Source**: `glean/static/` folder (included in npm publish)
- **Contents**: Bootstrap dependencies for modern UI composition
- **Serving**: Loaded into server memory, served as static paths
- **Purpose**: Clean, idiomatic styling without external CDN dependencies

## Server Implementation Approach

### Wings Server Module Structure

```javascript
import { wings } from "@raven-js/wings/server";
import { readFileSync } from "fs";
import { join } from "path";
import { discover } from "./discover/index.js";
import { extract } from "./extract/index.js";

/**
 * Creates documentation server instance (does not start server)
 * @param {string} packagePath - Path to package to document
 * @param {Object} options - Configuration options
 * @param {string} options.domain - Base domain for links (default: anonyfox.com)
 * @returns {Object} Wings server instance
 */
export function createDocumentationServer(packagePath, options = {}) {
  const { domain = "anonyfox.com" } = options;

  // Load package data once at initialization
  const packageData = extract(discover(packagePath));

  // Load static assets into memory
  const staticAssets = loadStaticAssets();

  const server = wings();

  // Static asset routes (served from memory)
  server.get("/static/*", (req, res) => {
    const assetPath = req.params[0]; // Captures everything after /static/
    const asset = staticAssets[assetPath];
    if (asset) {
      res.setHeader("Content-Type", asset.mimeType);
      res.send(asset.content);
    } else {
      res.status(404).send("Asset not found");
    }
  });

  // Package overview route
  server.get("/", (req, res) => {
    const data = extractPackageOverviewData(packageData, domain);
    const html = renderPackageOverview(data); // Beak template
    res.html(html);
  });

  // Module directory route
  server.get("/modules/", (req, res) => {
    const data = extractModuleDirectoryData(packageData, domain);
    const html = renderModuleDirectory(data); // Beak template
    res.html(html);
  });

  // Module overview route
  server.get("/modules/:moduleName/", (req, res) => {
    const module = findModuleByName(packageData, req.params.moduleName);
    const data = extractModuleOverviewData(module, packageData, domain);
    const html = renderModuleOverview(data); // Beak template
    res.html(html);
  });

  // Entity documentation route
  server.get("/modules/:moduleName/:entityName/", (req, res) => {
    const entity = findEntity(
      packageData,
      req.params.moduleName,
      req.params.entityName
    );
    const data = extractEntityPageData(entity, packageData, domain);
    const html = renderEntityPage(data); // Beak template
    res.html(html);
  });

  // API reference route
  server.get("/api/", (req, res) => {
    const data = extractAPIReferenceData(packageData, domain);
    const html = renderAPIReference(data); // Beak template
    res.html(html);
  });

  // Sitemap route
  server.get("/sitemap.xml", (req, res) => {
    const sitemap = generateSitemap(packageData, domain); // Using beak sitemap helper
    res.xml(sitemap);
  });

  return server; // Return server instance, don't start it
}

/**
 * Load static assets from glean/static into memory
 * @returns {Object} Asset map with content and mime types
 */
function loadStaticAssets() {
  const staticDir = join(import.meta.dirname, "../static");
  const assets = {};

  // Load CSS files
  assets["bootstrap.min.css"] = {
    content: readFileSync(join(staticDir, "bootstrap.min.css")),
    mimeType: "text/css",
  };

  // Load JS files
  assets["bootstrap.bundle.min.js"] = {
    content: readFileSync(join(staticDir, "bootstrap.bundle.min.js")),
    mimeType: "application/javascript",
  };

  return assets;
}
```

### Unit Testing Capabilities

**Wings Testing Advantages:**

- **No Server Boot**: Test routes directly without starting HTTP server
- **100% Data Assertion**: Verify exact data extraction for every page
- **Fast Execution**: Pure function testing of route handlers
- **Complete Coverage**: Test all route combinations and edge cases

**Example Test Structure:**

```javascript
// server.test.js
import { createDocumentationServer } from "./server.js";
import { test, describe } from "node:test";
import assert from "node:assert";

describe("Documentation Server Routes", () => {
  test("Package overview extracts correct data", () => {
    const server = createDocumentationServer("./test-package");
    const mockReq = { params: {}, url: "/" };
    const mockRes = { html: (content) => content };

    // Test route handler directly (no HTTP)
    const handler = server.getRouteHandler("GET", "/");
    const result = handler(mockReq, mockRes);

    // Assert exact data structure
    assert(result.includes(packageData.name));
    assert(result.includes(packageData.description));
    // ... more assertions
  });
});
```

**CLI Integration:**
The CLI tool starts the server using the exported function:

```javascript
// In CLI tool
const server = createDocumentationServer(packagePath, { domain, port });
server.listen(port, () => {
  console.log(`📚 Documentation server running on http://localhost:${port}`);
});
```

This approach provides precise data extraction methods for each page type, enabling efficient server-side rendering with complete SEO optimization using the beak package capabilities and Wings' lean server architecture.
