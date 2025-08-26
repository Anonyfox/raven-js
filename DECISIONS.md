# Architectural Decisions

This document explains the key technical and strategic decisions made in RavenJS, including their tradeoffs and the specific advantages they provide for our target use cases.

## 1. Toolkit Architecture Over Framework Monolith

**Decision:** RavenJS provides standalone packages that can be used independently rather than a single framework that must be adopted wholesale.

**Tradeoffs:**

- **Cost:** No "getting started in 5 minutes" experience; developers must understand and configure multiple packages
- **Complexity:** Requires more initial decisions about which packages to use and how to integrate them

**Advantages:**

- **Migration flexibility:** Applications can adopt individual packages without rewriting existing architecture
- **Vendor independence:** No single point of failure if one package becomes unmaintained or changes direction
- **Bundle optimization:** Applications only include functionality they actually use
- **Technology diversity:** Different packages can be used with different frameworks, backends, or deployment targets

**Why this matters:** Teams that have experienced framework migrations understand the cost of monolithic coupling. This approach prioritizes long-term adaptability over short-term convenience.

## 2. Zero Dependencies Policy (Capabilities)

**Decision:** Runtime packages (Capabilities) have absolutely zero external dependencies, while CLI tools (Activities) may include necessary dependencies.

**Tradeoffs:**

- **Development overhead:** Must reimplement common utilities instead of importing proven libraries
- **Potential bugs:** Risk of edge cases that established libraries have already solved
- **Code duplication:** Similar functionality may be implemented multiple times across packages

**Advantages:**

- **Security:** Eliminates supply chain attack vectors and transitive dependency vulnerabilities
- **Stability:** No breakage from external dependency updates or maintainer abandonment
- **Bundle size:** Packages only include code they actually use, not entire utility libraries
- **Audit simplicity:** Security audits only need to review first-party code

**Validation:** Supply chain attacks through npm dependencies have increased 650% since 2021. Event-stream, ua-parser-js, and node-ipc compromises affected millions of applications through transitive dependencies.

## 3. Modern ECMAScript Target (Node 22.5+, ES2020+)

**Decision:** Support only recent Node.js versions and modern browsers, excluding legacy environments.

**Tradeoffs:**

- **Market exclusion:** Cannot be used in environments with older Node.js or browsers
- **Enterprise limitations:** Some organizations have slower upgrade cycles
- **Immediate adoption barriers:** Teams on older infrastructure must upgrade to use RavenJS

**Advantages:**

- **Performance:** Access to native language features that are faster than polyfilled equivalents
- **Developer experience:** Can use optional chaining, nullish coalescing, top-level await, and other modern syntax
- **Testing simplicity:** Smaller matrix of environments to test and support
- **Bundle efficiency:** No polyfills or legacy compatibility shims needed

**Target alignment:** This decision explicitly targets teams that prioritize development velocity and are willing to maintain modern infrastructure.

## 4. ESM-Only Module System

**Decision:** All packages use ECMAScript modules exclusively, with no CommonJS support or interoperability layers.

**Tradeoffs:**

- **Ecosystem friction:** Cannot directly import CommonJS-only packages
- **Tooling compatibility:** Some development tools still expect or work better with CommonJS
- **Learning curve:** Teams familiar with `require()` syntax must learn `import/export`

**Advantages:**

- **Tree-shaking:** Bundlers can perform static analysis to eliminate unused code paths
- **Browser compatibility:** Native browser module loading without transformation
- **Future alignment:** All modern JavaScript runtimes (Node.js, Deno, Bun) default to ESM
- **Static analysis:** Better IDE support for imports, refactoring, and dependency tracking

**Industry direction:** Node.js has supported ESM since version 12, and package.json `"type": "module"` is now widely supported across the ecosystem.

## 5. Source-as-Runtime (No Transpilation)

**Decision:** JavaScript source code runs directly without TypeScript, Babel, or other compilation steps.

**Tradeoffs:**

- **Feature availability:** Cannot use proposed language features until they reach official specification
- **Type safety:** No compile-time type checking (mitigated by JSDoc strategy below)
- **Developer familiarity:** Many developers expect TypeScript in modern projects

**Advantages:**

- **Development speed:** Instant feedback with no compilation delay
- **Debugging accuracy:** Stack traces and breakpoints map directly to source code
- **Deployment simplicity:** Repository contains exactly what runs in production
- **Platform optimization:** V8 engine optimizations apply directly to source code

**Performance impact:** Eliminates 1-5 second compilation delays during development, compounding to significant time savings over full development cycles.

## 6. JSDoc-as-TypeScript Strategy

**Decision:** Use JSDoc comments for type annotations that modern IDEs recognize as TypeScript types, rather than actual TypeScript files.

**Tradeoffs:**

- **Verbosity:** Type annotations require more characters than TypeScript syntax
- **Learning curve:** JSDoc type syntax differs from TypeScript
- **Limited features:** Cannot use advanced TypeScript features like mapped types or conditional types

**Advantages:**

- **Runtime accuracy:** Type annotations are documentation that stays adjacent to actual code behavior
- **IDE support:** Modern editors provide identical IntelliSense and type checking for JSDoc
- **LLM compatibility:** AI code assistants excel at generating JSDoc annotations
- **No compilation:** Type information available without build steps

**Technical validation:** VS Code, WebStorm, and other modern IDEs provide equivalent type checking and autocomplete for properly formatted JSDoc as they do for TypeScript.

## 7. Surgical Package Focus

**Decision:** Each package solves one problem exceptionally well rather than providing broad functionality.

**Tradeoffs:**

- **Integration overhead:** Multiple packages require more setup than monolithic solutions
- **Version management:** More packages means more version numbers to track
- **Documentation complexity:** Each package needs its own documentation and examples

**Advantages:**

- **Maintenance clarity:** Smaller, focused codebases are easier to understand and modify
- **Testing completeness:** Comprehensive test coverage is achievable for well-defined scope
- **Replacement flexibility:** Individual packages can be swapped without affecting others
- **Bundle optimization:** Applications include only the specific functionality they need

**Principle:** Unix philosophy applied to JavaScript packages—do one thing and do it well.

## 8. Platform Primitive Preference

**Decision:** Use built-in JavaScript and Node.js APIs rather than external libraries when possible.

**Tradeoffs:**

- **Development time:** Writing utilities from scratch takes longer than importing existing solutions
- **Feature gaps:** Platform APIs may lack convenience methods found in libraries
- **Edge case handling:** Established libraries may handle more edge cases than custom implementations

**Advantages:**

- **Performance:** Native APIs benefit from engine-level optimizations
- **Longevity:** Platform APIs evolve with the language rather than depending on maintainer decisions
- **Knowledge transfer:** Understanding platform APIs applies across all JavaScript environments
- **Debugging clarity:** Fewer abstraction layers between application code and runtime behavior

**Evolution benefit:** As JavaScript and Node.js add new capabilities, packages automatically benefit without dependency updates.

## 9. Official npm Package Manager

**Decision:** Support only the official npm client, not Yarn, pnpm, or other package managers.

**Tradeoffs:**

- **Performance:** npm is slower than pnpm for large dependency trees
- **Features:** Missing advanced workspace features from Yarn or stricter resolution from pnpm
- **Team preferences:** Some developers prefer alternative package managers

**Advantages:**

- **Universal compatibility:** Every Node.js environment includes npm by default
- **CI/CD simplicity:** All continuous integration platforms have built-in npm support
- **Reduced complexity:** One package manager to configure, document, and troubleshoot
- **Stability:** Fewer variables in dependency resolution and installation process

**Practical impact:** Since zero-dependency packages install quickly regardless of package manager, npm's performance disadvantage is negligible for RavenJS use cases.

## 10. Capabilities vs Activities Architecture

**Decision:** Distinguish between runtime libraries (Capabilities) and development tools (Activities) with different dependency policies.

**Capabilities:** Zero dependencies, installed via `npm install`, become part of application runtime
**Activities:** May have dependencies, used via `npx`, operate on applications from outside

**Advantages:**

- **Security separation:** Application runtime remains free of external dependencies while tooling can use necessary libraries
- **Use case optimization:** Each category optimized for its specific purpose and usage pattern
- **Bundle protection:** Development tool dependencies never contaminate application bundles
- **Flexibility:** Can use appropriate tools for each domain without compromising core principles

**Example distinction:** Beak (templating capability) has zero dependencies because string manipulation is native to JavaScript. Soar (deployment activity) can depend on cloud SDKs because implementing OAuth2 and API protocols manually would be impractical.

## 11. Activity Distribution Strategy

**Decision:** CLI tools ship as both minified bundles for performance and clean source for debugging.

**Tradeoffs:**

- **Package size:** Doubles the file count and storage requirements for Activity packages
- **Complexity:** Requires build process for Activities while maintaining source-as-runtime for Capabilities

**Advantages:**

- **Cold start performance:** Minified bundles reduce npx execution time from 2+ seconds to <500ms
- **Debugging experience:** Clean source available when investigating errors or unexpected behavior
- **CI/CD efficiency:** Faster tool execution reduces compute costs in automated environments

**Impact:** In cloud environments where execution time directly correlates to cost, faster CLI tools provide measurable economic benefits.

## Summary

These decisions prioritize long-term maintainability, security, and performance over short-term convenience. They explicitly target experienced developers and teams willing to adopt modern infrastructure in exchange for reduced complexity and increased reliability.

The architecture acknowledges that different use cases have different requirements—runtime code must be fortress-secure and dependency-free, while development tooling can make practical compromises to provide professional capabilities.
