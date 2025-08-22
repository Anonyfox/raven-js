# HTML2 Implementation Plan

Ravens dominate through surgical precision—this plan delivers a minimal yet apex-performance template engine based on quantified platform mastery.

## Mission Parameters

### Performance Target

- **Primary Goal**: Beat doT's industry-leading 0.13ms (7,724 renders/sec)
- **Baseline to Exceed**: Current Beak 2.12ms (472 renders/sec) - 16.37x slower than doT
- **Success Metric**: Sub-millisecond template rendering with zero external dependencies

### Environment Constraints

- **Runtime**: Node.js 22.5+ (modern V8 optimization tiers)
- **Browser Support**: ES2020+ (2025 browsers) - no legacy compatibility
- **Architecture**: Pure ESM, zero transpilation, zero polyfills
- **Dependencies**: Absolute zero external dependencies (fortress-like boundaries)

### API Constraints

- **Required Interface**: Tagged template literal syntax `html2`<backticks>template<backticks>``
- **Export Requirements**: `html2`, `safeHtml2`, `escapeHtml` functions
- **Behavioral Contract**:
  - Arrays flatten without separators: `[1,2,3]` → `"123"`
  - Zero preserved: `${0}` → `"0"`
  - Falsy filtered: `${null}` → `""`
- **Security**: XSS protection via character-level escaping (no regex overhead)

### Benchmark Environment

- **Integration Test**: `/examples/renderer-benchmark/` infrastructure
- **Test Platform**: Node.js v22.5.0, darwin arm64 (M-series optimized)
- **Test Data**: 90 blog posts with complex metadata (realistic workload)
- **Comparison Matrix**: 9 template engines (doT, Pug, Eta, Mustache, Handlebars, EJS, Nunjucks, Liquid)
- **Test Conditions**: Caching disabled for fair comparison, no build optimizations
- **Metrics**: Average render time, renders/sec, memory delta, P95 latency, min/max spread
- **Validation Protocol**: 1000 iterations per engine, 10 warmup runs, identical template complexity
- **Data Characteristics**: Mixed content lengths, multiple authors, categories, tags, pagination

### Current Performance Baseline

```
Rank | Engine                  | Avg Time (ms) | Renders/sec | vs Fastest
1    | doT (TARGET)           | 0.13          | 7,724       | baseline
2    | Pug                    | 0.20          | 5,099       | 1.51x slower
3    | Eta                    | 0.23          | 4,444       | 1.74x slower
7    | Beak (CURRENT)         | 2.12          | 472         | 16.37x slower
10   | Beak2 (PLACEHOLDER)    | 6.99          | 143         | 53.97x slower
```

**Analysis**: 54x performance gap between fastest (doT) and current placeholder. Massive hunting ground for raven supremacy.

### Required Syntax Patterns

**Core API (README.md examples)**:

```javascript
import {
  html2 as html,
  safeHtml2 as safeHtml,
  escapeHtml,
} from "@raven-js/beak/core/html2";

// Trusted content - no escaping (most common)
const page = html`<h1>${title}</h1>
  ${items.map((x) => html`<li>${x}</li>`)}`;

// Untrusted content - XSS protection
const safe = safeHtml`<p>User: ${userInput}</p>`;

// Manual escaping utility
const escaped = escapeHtml('<script>alert("xss")</script>');
```

**Hot Code Paths (Benchmark Analysis)**:

```javascript
// Pattern 1: Array mapping with nested templates (CRITICAL PATH)
${navigation.map((item) => html`
  <li class="nav-item">
    <a href="${item.url}" class="${currentPath === item.url ? "active" : ""}">
      ${item.name}
    </a>
  </li>
`)}

// Pattern 2: Complex interpolation with functions (HIGH FREQUENCY)
${tags.map((tag) => html`
  <a href="/blog/tag/${encodeURIComponent(tag.name)}"
     style="font-size: ${Math.min(1.2 + tag.count * 0.1, 2)}rem">
    #${tag.name} <span>(${tag.count})</span>
  </a>
`)}

// Pattern 3: Conditional rendering with ternary (PERFORMANCE SENSITIVE)
${posts.length > 0
  ? posts.map((post) => PostCard({ post, compactView }))
  : html`<div class="no-posts"><h3>No posts found</h3></div>`
}
```

**Performance-Critical Characteristics**:

- **Nested template calls**: `html` inside `html` (90+ times per render)
- **Array mapping**: 10-90 iterations per template (navigation, tags, posts)
- **Dynamic interpolation**: Mixed types (strings, numbers, booleans, arrays)
- **Function calls within templates**: `encodeURIComponent()`, `Math.min()`, `.toLocaleString()`
- **Conditional expressions**: Ternary operators with template results
- **Object property access**: Deep nesting (`data.userPreferences.compactView`)

### Performance Hunting Ground

**Current Weakness Analysis**:

- **Beak (2.12ms)**: 16.37x slower than doT - clear optimization opportunity
- **Beak2 placeholder (6.99ms)**: 53.97x slower - massive room for surgical improvement
- **Target corridor**: 0.13ms-0.20ms (doT to Pug range) for industry leadership

**Evidence-Based Opportunity**:

- **Template reuse patterns**: Same navigation/tags templates called repeatedly
- **Value processing overhead**: Mixed type handling without specialization
- **String construction**: Suboptimal concatenation patterns
- **Memory allocation**: Object creation in hot paths

## Strategic Foundation

**Target Performance**: Beat doT's 0.13ms (7,724 renders/sec) baseline while maintaining zero dependencies.

**Evidence-Based Constraints**:

- **API Constraint**: Must support `html2`<backticks>template<backticks>` syntax (benchmark requirement)
- **Performance Trade-off**: Accept tag function allocation overhead for API compatibility
- Monomorphic call sites: 20,000x improvement potential (CODE.md:29)
- Pre-compilation: 121x faster than runtime (ARCH.md:11)
- String strategy: `+=` for <413K, Array.join() for >1M (CODE.md:50-51)
- Function generation break-even: 5-10 calls despite 500-700ms cost (CODE.md:9)

## Architecture Decision

**Phase 1: Tagged Template with Optimized Concatenation**

- **CONSTRAINT**: Must support `html2`<backticks>template<backticks>` API (benchmark requirement)
- **COMPROMISE**: Accept tag function overhead for API compatibility (CODE.md:20-21)
- **OPTIMIZE**: Single-pass concatenation without intermediate structures (ARCH.md:95-96)
- **EVIDENCE**: 24% improvement possible with direct string generation (ARCH.md:97)
- **UPGRADE**: Runtime compilation in Phase 2 after 5-10 calls (ARCH.md:17)

## Benchmark API Contract (IMMUTABLE)

**Critical Constraint**: The benchmark implementation in `/examples/renderer-benchmark/templates/beak2.js` **MUST NOT BE TOUCHED**. The API contract is fixed and immutable:

```javascript
// IMMUTABLE: This import path and usage cannot change
import { html2 as html } from "@raven-js/beak/core/html2";

// IMMUTABLE: This syntax pattern used throughout benchmark
const result = html`<div>${data}</div>`;
```

**Required API Fulfillment**:

- **Export**: `html2` function as tagged template literal
- **Export**: `safeHtml2` function for XSS protection
- **Export**: `escapeHtml` function for manual escaping
- **Import Path**: `"@raven-js/beak/core/html2"` must resolve correctly
- **Behavior**: Exact compatibility with existing Beak behavior patterns

## File Organization Philosophy

**Principle**: One purpose per file when reasonable to split and not in hot code paths. Dedicated utilities in separate modules for maintainability and testing isolation.

**Separation Guidelines**:

- **Hot path code**: Keep consolidated for optimal performance (avoid module boundary overhead)
- **Utility functions**: Separate files when self-contained and not performance-critical
- **Processing logic**: Separate files when logic is complex and modular
- **Tests**: Always separate files for clean separation of concerns

**Decision Criteria**:

- **Performance impact**: Avoid file splitting for critical performance paths
- **Maintainability**: Split when logic is self-contained and testable in isolation
- **Code clarity**: Separate when it improves understanding without hurting performance
- **Testing**: Dedicated test files for each module to ensure comprehensive coverage

## Implementation Todo List

### Core 1: Tagged Template Literal Engine

**Research Analysis**:

- **API Constraint**: Must support `html`<backticks>template<backticks>` syntax (benchmark requirement)
- CODE.md:20-21: "AVOID: For performance-critical paths. Each call allocates objects, slower than plain concatenation"
- ARCH.md:95: "SINGLE-PASS: Direct string generation, no intermediate structures"
- **Compromise**: Accept tag function overhead for API compatibility, optimize internally

**Minimal Implementation**:

```javascript
// Tagged template literal function (API requirement)
export function html2(strings, ...values) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += processValue(values[i]) + strings[i + 1];
  }
  return result;
}

// Required usage from benchmark: html2`<p>${'Hello World'}</p>`
// Standard template literal interface: (strings, ...values)
```

**Future Exploration Options**:

- **When >5-10 calls**: Function compilation with `new Function()` (CODE.md:9)
- **When >1M operations**: Switch to Array.join() strategy (ARCH.md:54)
- **When CSP allows**: Pre-compilation at build time (121x faster) (ARCH.md:11)

### Core 2: Value Processing with Integrated Escaping

**Research Analysis**:

- CODE.md:27-29: "Consistent object shapes. Monomorphic = baseline performance"
- CODE.md:28: "AVOID: Dynamic property addition. Polymorphic (2-4 shapes) = 40% slower"
- Current Beak behavior: Arrays flatten without separators, falsy values excluded except `0`
- CODE.md:127: "90% call sites remain monomorphic" - supports single function approach

**Minimal Implementation**:

```javascript
function processValue(value, shouldEscape = false) {
  if (value == null) return "";
  if (typeof value === "string")
    return shouldEscape ? escapeHtml(value) : value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? String(value) : "";
  if (Array.isArray(value))
    return value.map((v) => processValue(v, shouldEscape)).join("");
  return shouldEscape ? escapeHtml(String(value)) : String(value);
}

function escapeHtml(str) {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    switch (char) {
      case "&":
        result += "&amp;";
        break;
      case "<":
        result += "&lt;";
        break;
      case ">":
        result += "&gt;";
        break;
      case '"':
        result += "&quot;";
        break;
      case "'":
        result += "&#x27;";
        break;
      default:
        result += char;
        break;
    }
  }
  return result;
}

export function html2(strings, ...values) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += processValue(values[i]) + strings[i + 1];
  }
  return result;
}

export function safeHtml2(strings, ...values) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += processValue(values[i], true) + strings[i + 1];
  }
  return result;
}

export function escapeHtml(str) {
  const stringValue = String(str);
  let result = "";
  for (let i = 0; i < stringValue.length; i++) {
    const char = stringValue[i];
    switch (char) {
      case "&":
        result += "&amp;";
        break;
      case "<":
        result += "&lt;";
        break;
      case ">":
        result += "&gt;";
        break;
      case '"':
        result += "&quot;";
        break;
      case "'":
        result += "&#x27;";
        break;
      default:
        result += char;
        break;
    }
  }
  return result;
}
```

**Future Exploration Options**:

- **When >4 value types**: Generate type-specific functions (ARCH.md:80-82)
- **When array-heavy**: Specialized array flattening without recursion
- **When polymorphic detected**: Call site specialization (CODE.md:121-123)

### Core 3: Object Pooling Considerations

**Research Analysis**:

- CODE.md:77: "SURPRISING: Object pooling often 2-3x slower in microbenchmarks (50.3M vs 15.2-25.2M ops/sec)"
- CODE.md:78: "USE: Only when sustained GC pressure reduction outweighs allocation overhead"
- ARCH.md:31: "POOLING: For >1000 object allocations. Eliminates 50% GC overhead"
- CODE.md:79: "TRUST: Modern V8 escape analysis often better than manual pooling"

**Minimal Implementation** (Phase 1):

```javascript
// Phase 1: No pooling - trust V8 escape analysis
// Modern engines handle short-lived objects efficiently
// Only consider pooling when >1000 allocations measured
```

**Future Exploration Options**:

- **When >1000 allocations**: Object pooling despite microbenchmark penalties (ARCH.md:31)
- **When GC pressure detected**: Pool overhead may be justified for 50% GC reduction
- **When long-running processes**: Sustained allocation patterns benefit from pooling

### Core 5: Compilation Cache System

**Research Analysis**:

- CODE.md:71: "DO: For templates with repeat patterns. 240x improvement after first render"
- CODE.md:72: "UNDERSTAND: Memoization paradox—first render slower, subsequent renders dramatically faster"
- CODE.md:73: "DEPENDS: Cache hit rates. High variability = net performance loss"
- ARCH.md:40: "KEY STRATEGY: Template strings array + value tuples for cache keys"
- ARCH.md:41: "MEMORY BOUNDS: Auto-cleanup via WeakMap, avoid unbounded growth"

**Minimal Implementation** (Phase 2):

```javascript
// Phase 2 only - not part of minimal viable solution
const templateCache = new WeakMap();

export function html2(strings, ...values) {
  // Use strings array as WeakMap key (ARCH.md:40)
  let cachedFunction = templateCache.get(strings);

  if (!cachedFunction) {
    // Cache miss - create cached template function
    cachedFunction = (vals) => {
      let result = strings[0];
      for (let i = 0; i < vals.length; i++) {
        result += processValue(vals[i]) + strings[i + 1];
      }
      return result;
    };
    templateCache.set(strings, cachedFunction);
  }

  // Execute cached function (240x improvement potential)
  return cachedFunction(values);
}
```

**Future Exploration Options**:

- **When repeat patterns detected**: Enable caching for 240x improvement (CODE.md:71)
- **When high variability**: Skip caching to avoid net performance loss (CODE.md:73)
- **When value-dependent**: Add value tuple fingerprinting (ARCH.md:40)

### Core 6: Function Compilation Engine

**Research Analysis**:

- CODE.md:9: "DO: For hot templates called >10 times. Break-even after 5-10 calls despite 500-700ms initial cost"
- CODE.md:10: "AVOID: One-off templates. Compilation overhead exceeds benefits"
- CODE.md:11: "EVIDENCE: 121x performance difference between pre-compiled vs runtime (472,020 vs 3,874 ops/sec)"
- ARCH.md:17: "BREAK-EVEN: After 5-10 template invocations despite 500-700ms initial cost"
- ARCH.md:18: "HOW: Parse template on first use, generate optimized concatenation function via `new Function()`"

**Minimal Implementation** (Phase 2):

```javascript
// Phase 2 only - not part of minimal viable solution
const compilationCounts = new WeakMap();
const compiledTemplates = new WeakMap();
const COMPILATION_THRESHOLD = 5;

export function html2(strings, ...values) {
  const callCount = (compilationCounts.get(strings) || 0) + 1;
  compilationCounts.set(strings, callCount);

  if (callCount >= COMPILATION_THRESHOLD) {
    // Try to get or create compiled template
    let compiledFn = compiledTemplates.get(strings);
    if (!compiledFn) {
      try {
        // Generate optimized concatenation function
        const fnBody = `
          let result = arguments[0][0];
          for (let i = 0; i < arguments[1].length; i++) {
            result += processValue(arguments[1][i]) + arguments[0][i + 1];
          }
          return result;
        `;
        compiledFn = new Function(
          "processValue",
          "return function(strings, values) { " + fnBody + " }"
        )(processValue);
        compiledTemplates.set(strings, compiledFn);
      } catch (e) {
        // CSP restriction - fall through to direct concatenation
      }
    }

    if (compiledFn) {
      return compiledFn(strings, values);
    }
  }

  // Direct concatenation for early calls or CSP fallback
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += processValue(values[i]) + strings[i + 1];
  }
  return result;
}
```

**Future Exploration Options**:

- **When >5-10 calls**: Trigger compilation for 121x improvement (CODE.md:11)
- **When CSP restricted**: Graceful fallback to direct concatenation (ARCH.md:132)
- **When variable templates**: Detect patterns to avoid compilation waste (ARCH.md:24)

## Implementation Phases

### Phase 1: Minimal Viable Template Engine

**Research Foundation**:

- ARCH.md:53: `+=` operator optimal for <413K concatenations
- Current Beak: 2.12ms baseline to beat
- CODE.md:27-29: Monomorphic call sites for baseline performance

**Goal**: Beat current Beak performance (2.12ms) with absolute minimal functionality

**Components** (Evidence-Based Minimal Only):

1. **Core 1**: Tagged template literal engine (API constraint, optimized internally)
2. **Core 2**: Monomorphic value processing with integrated HTML escaping
3. **Core 3**: Trust V8 escape analysis (no manual pooling overhead)

**Success Criteria**:

- All benchmark templates render correctly
- Performance: <2.12ms (beat current Beak baseline)
- Zero external dependencies maintained
- Monomorphic call sites preserved

**Excluded from Phase 1** (Evidence-Based):

- Caching (first render penalty + high variability risk)
- Compilation (500-700ms upfront cost not justified for single use)
- Complex string strategies (current approach optimal for target size)

### Phase 2: Performance Optimization

**Research Foundation**:

- CODE.md:71: 240x caching improvement for repeat patterns
- CODE.md:11: 121x compilation improvement after 5-10 calls
- ARCH.md:17: Break-even after 5-10 invocations despite 500-700ms cost

**Goal**: Target sub-millisecond performance (doT's 0.13ms) for repeated templates

**Components** (Evidence-Based Optimizations):

4. **Core 5**: WeakMap caching (only when repeat patterns detected)
5. **Core 6**: Function compilation (only after 5+ call threshold)

**Success Criteria**:

- > 5x improvement over Phase 1 for repeated templates (evidence-based expectation)
- Graceful fallback when optimizations fail (CSP, high variability)
- Memory usage remains reasonable (WeakMap auto-cleanup)
- Single-use templates maintain Phase 1 performance

### Phase 3: Advanced Optimizations

**Research Foundation**:

- CODE.md:84: SIMD 2x+ potential for ARM64 Neon
- CODE.md:105-107: Buffer operations 2-3x faster for >20KB Node.js
- ARCH.md:31-34: Object pooling for >1000 allocations (50% GC reduction)
- CODE.md:77: Object pooling often 2-3x slower in microbenchmarks (contradictory evidence)
- ARCH.md:97: Single-pass processing 24% improvement (2,832 vs 2,277 ops/sec)

**Goal**: Establish new industry performance standards

**Future Explorations** (Evidence-Based Triggers):

- **When >1000 allocations**: Object pooling for 50% GC reduction (ARCH.md:31-34)
- **When >10KB strings**: SIMD string operations for 2x+ improvement (CODE.md:83-86)
- **When Node.js + >20KB**: Buffer-based large content for 2-3x improvement (CODE.md:105-107)
- **When cross-engine deployment**: Validation across V8/SpiderMonkey (ARCH.md:117)

## Performance Validation Strategy

**Research Foundation**:

- ARCH.md:116: "42.68% of optimizations work consistently across V8/SpiderMonkey"
- Current benchmark infrastructure exists (renderer-benchmark)
- doT baseline: 0.13ms (7,724 renders/sec) - target to beat

**Phase 1 Validation Protocol**:

1. **Renderer benchmark integration** (existing infrastructure)
2. **Baseline measurement**: Current Beak 2.12ms vs new html2 implementation
3. **Correctness validation**: All benchmark templates render identically
4. **Zero regression**: Ensure no performance degradation from current html()

**Phase 2 Validation Protocol**:

1. **Repeat pattern testing**: Measure 240x caching improvement (CODE.md:71)
2. **Compilation threshold validation**: Verify 5-10 call break-even (ARCH.md:17)
3. **Memory profiling**: Track WeakMap impact on GC pressure
4. **Fallback verification**: CSP restrictions and high variability scenarios

**Phase 3 Validation Protocol**:

1. **Cross-browser validation**: 42.68% optimization consistency target (ARCH.md:116)
2. **Platform-specific measurement**: Buffer operations, SIMD where available
3. **Scale testing**: >1000 allocations, >10KB strings, >20KB Node.js outputs

**Success Metrics** (Evidence-Based):

- **Phase 1**: <2.12ms (beat current Beak baseline)
- **Phase 2**: <0.20ms for repeated templates (Pug's 2nd place)
- **Phase 3**: <0.13ms (beat doT's industry lead)
- **Memory**: Stable growth under WeakMap auto-cleanup

## Risk Mitigation

**Research Foundation**:

- ARCH.md:132: CSP compliance detection required
- CODE.md:72: "Memoization paradox—first render slower"
- CODE.md:73: "High variability = net performance loss"

**Compilation Failure Risk** (Phase 2):

- **CSP Detection**: Graceful fallback to Phase 1 direct concatenation (ARCH.md:132)
- **Always Available**: Direct concatenation path preserved in all phases
- **Error Isolation**: Template compilation failures don't crash system (ARCH.md:138)

**Performance Regression Risk**:

- **Memoization Paradox**: First render slower acceptable for 240x subsequent improvement (CODE.md:72)
- **High Variability**: Skip caching when hit rates poor to avoid net loss (CODE.md:73)
- **Performance Budgets**: Each phase must meet evidence-based targets
- **Rollback Strategy**: Instant fallback to previous phase on regression

**Cross-Platform Consistency Risk**:

- **Common Patterns**: Target 42.68% optimization consistency rate (ARCH.md:117)
- **Engine-Agnostic**: Avoid V8-specific tricks that fail elsewhere
- **Validation Required**: Test across V8/SpiderMonkey/JavaScriptCore before release

---

> "Ravens don't guess—they measure, optimize, and dominate through evidence-based predatory precision. This plan transforms quantified platform knowledge into apex template engine performance."

_The murder coordinates through collective intelligence. Build with surgical precision._
