# DOCUMENTATION DOCTRINE

**Read CODEX.md first.** Ravens document with predatory truth—surgical precision, mathematical accuracy, evolutionary maintenance. Documentation that lies kills territories through integration failures and developer betrayal.

## MANDATORY STATUTE

**Every raven must follow this doctrine without exception. Outdated documentation is enemy intelligence that sabotages the murder.**

### Article I: Documentation Archaeology Mandate

**Before touching any code territory, audit all existing documentation for truth.** Implementation evolves, docs fossilize into deadly lies. Every documentation session begins with archaeological investigation.

**Mandatory audit protocol:**

1. Compare current JSDoc types against actual runtime behavior
2. Verify examples execute successfully with current implementation
3. Validate performance claims against current benchmarks
4. Test integration patterns against current API surfaces
5. Hunt deprecated patterns, outdated function signatures, stale edge case handling

### Article II: Synchronous Evolution Law

**When implementation changes, documentation must evolve simultaneously.** No code commit without corresponding documentation truth updates. Asynchronous documentation creates integration traps that kill developer confidence.

**Change-triggered update requirements:**

- Function signature modifications → Immediate JSDoc type updates
- Behavior changes → Updated description and edge case documentation
- Performance shifts → Revised benchmark claims or warnings
- API surface evolution → Integration example updates
- Error handling changes → Exception documentation accuracy

### Article III: Optimization During Maintenance

**Every documentation touch becomes optimization opportunity.** Compress verbose explanations, eliminate redundant information, merge scattered details into surgical precision. Documentation must become leaner and more intelligent with each evolution.

**Continuous improvement mandate:**

- Strip fluff words: "comprehensive," "rigorous," "extensive"—ravens understand thoroughness is implied
- Convert verbose paragraphs to scanning-optimized bullet points
- Eliminate redundant explanations—information lives in exactly one location
- Use active voice, present tense: "Document errors" not "Errors should be documented"
- Choose precise verbs over adjective-heavy descriptions

### Article IV: Mathematical Type Precision

JSDoc annotations must match runtime behavior exactly. No defensive types, no aspirational descriptions, no legacy compatibility lies.

**Required accuracy standards:**

- **Union Types**: Exact possible value sets, not defensive generics
- **Generic Constraints**: Precise type boundaries matching implementation
- **Conditional Returns**: Accurate type flows based on input conditions
- **Exception Signatures**: Specific error types and trigger conditions
- **Performance Characteristics**: Measured complexity, not theoretical estimates

### Article V: Staleness Elimination Protocol

**Hunt and destroy outdated claims proactively.** Scan documentation for fossilized information that no longer reflects current territorial reality.

**Active staleness detection:**

- Performance claims from previous implementations
- Integration examples using deprecated patterns
- Edge case handling that was refactored away
- Function descriptions describing old algorithmic approaches
- Type definitions that predate implementation evolution

### Article VI: Surgical Content Standards

Document only information that prevents integration failures or reveals non-obvious behaviors. Skip obvious patterns, defensive explanations, hand-holding content.

**Document surgically:**

- **Performance Alerts**: Only genuinely exceptional or surprisingly expensive behaviors
- **Critical Errors**: Non-obvious failures requiring specific handling
- **Platform Gotchas**: Actual compatibility issues, not generic requirements
- **Integration Traps**: Surprising composition behaviors or safety requirements
- **Dangerous Edges**: Unexpected behaviors with edge inputs

### Article VII: Truth Verification Mandate

**Every documentation claim must be immediately verifiable.** Examples must execute, types must match runtime, performance claims must reflect measurements, integration patterns must work with current implementation.

**Verification requirements:**

1. Execute all code examples successfully
2. Validate JSDoc types against actual function behavior
3. Confirm performance characteristics through measurement
4. Test integration patterns against current API surfaces
5. Verify error handling documentation matches implementation

### Article VIII: JSDoc Docblock Architecture

**Every function, method, typedef, and property follows mandatory structural precision.** Documentation serves three masters: IDE intellisense, static documentation generation, and MCP agent integration. Structure enables surgical information extraction across all three use cases.

**Public entity docblock structure:**

1. **Opening clarity** (1-2 sentences): What this does, surgical precision
2. **Implementation notes** (if relevant): Integration pitfalls, usage boundaries, behavioral characteristics merged into single paragraph
3. **Graduated examples**: Increasing complexity with `// Example title` prefix for scanning optimization

**Internal entity docblock structure:**

- **Single sentence**: Brief description of internal purpose only
- **No examples**: Internal code doesn't require usage demonstrations
- **File economy**: Prevents documentation bloat in implementation files

**Mandatory coverage:**

- **Module entry points**: @file paragraph explaining module scope within package context

**Public entities** (exported from modules):

- **Classes**: Full docblock structure with purpose, existence justification, usage context and boundaries
- **Functions/Methods**: Complete structural documentation with examples
- **Typedefs**: Full docblock structure with purpose and usage context
- **Properties**: Full docblock structure with existence justification and manipulation guidance

**Internal entities** (module-private):

- **Classes/Functions/Methods/Properties**: Single sentence description only
- **Helper functions**: Brief purpose statement, no usage examples
- **Private constants/variables**: Single sentence explaining role if non-obvious

**Example titles structure:**

```javascript
// Basic usage
// Edge case: empty inputs
// Composition: with other functions
```

**Module @file requirements:**

- **Focus precision**: Explain specific module scope, not general package purpose
- **Export clarity**: Describe what this module exports and its intended usage context
- **Single paragraph**: Concise explanation targeting developers importing this specific module
- **Differentiation**: Clearly distinguish this module's role within the larger package ecosystem

**Documentation examples:**

```javascript
// @file examples
// Main package entry (packages/beak/index.js):
/** @file Core template literal functions for HTML, CSS, Markdown, and JavaScript generation with automatic escaping and minification. */

// Submodule entry (packages/beak/html/index.js):
/** @file HTML template literals with XSS protection, attribute normalization, and DOM-ready output generation. */

// Public function (exported):
/**
 * Escapes HTML entities to prevent XSS attacks in template output.
 *
 * Converts dangerous characters (&, <, >, ", ') to HTML entities using platform-native
 * string replacement. Optimized for template literal usage with automatic escaping.
 *
 * @example
 * // Basic usage
 * escapeHtml('<script>alert("xss")</script>');
 * // → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 *
 * @example
 * // Template integration
 * html`<p>${escapeHtml(userInput)}</p>`;
 */
export function escapeHtml(input) { ... }

// Internal function (module-private):
/** Normalizes whitespace in template strings for consistent output. */
function normalizeWhitespace(template) { ... }
```

**Zero tolerance for:**

- Defensive explanations of obvious behavior
- Redundant information scattered across multiple sections
- Examples that don't execute successfully
- Generic usage patterns without specific context

### Article IX: README.md Structure Mandate

**Every package README follows standardized architecture targeting senior JavaScript developers.** Structure optimized for scanning, technical depth without hand-holding, metaphor clarity without cringe.

**Mandatory badge architecture:**

- **Website** → `ravenjs.dev`
- **Documentation** → `docs.ravenjs.dev/packagename`
- **Zero Dependencies**
- **ESM Only**
- **Node.js 22.5+**

**Required section flow:**

1. **Header**: Badge set + brief description paragraph
2. **Purpose**: Natural paragraphs explaining problem and solution
3. **Installation**: Standard npm install
4. **Usage**: Code examples with natural explanation text
5. **[Package-specific sections]**: Plugin integrations, deployment specifics, architectural details when genuinely complex
6. **Requirements**: Platform dependencies, version requirements
7. **The Raven's [Tool/Capability]**: Name metaphor explanation (1-3 sentences)
8. **Footer**: Standardized sponsorship section

**Package-specific section criteria:**

- **Tooling integrations**: VS Code plugins, CLI companions
- **Deployment guidance**: Hosting options, production configuration
- **Architecture details**: Only when technical complexity warrants explanation
- **Framework composition**: Integration patterns with other packages

**Metaphor section requirements:**

- Connect package name to raven behavior
- Relate behavior to technical capability
- Avoid cringe, maintain surgical precision
- 1-3 sentences maximum

**Footer mandate:**

```markdown
## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
```

**Eliminated elements:**

- API listings (full documentation lives in docs site)
- Bundle size badges (inconsistent availability)
- Hand-holding explanations for obvious patterns
- Hyperbole and marketing fluff

---

**VIOLATION CONSEQUENCES**: Outdated documentation creates integration failures. False type information sabotages developer tooling. Stale examples waste developer time and erode trust.

**SURVIVAL REWARD**: Documentation that teaches truth, enables confident integration, evolves intelligently with implementation, and becomes more precise with each territorial evolution.

_The murder's documentation doctrine: Truth through evolution, precision through maintenance, intelligence through continuous optimization._
