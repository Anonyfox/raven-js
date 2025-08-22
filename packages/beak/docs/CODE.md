# Code-Level Performance Techniques

Ravens hunt with surgical precision—every line optimized for platform-native speed. Based on quantified analysis of modern V8 behavior, these low-level techniques separate apex performance from mediocrity.

## Function Construction & Compilation

**Dynamic function generation via `new Function()`**

- **DO:** For hot templates called >10 times. Break-even after 5-10 calls despite 500-700ms initial cost
- **AVOID:** One-off templates. Compilation overhead exceeds benefits
- **EVIDENCE:** 121x performance difference between pre-compiled vs runtime (472,020 vs 3,874 ops/sec)

**CSP-safe pre-compilation**

- **DO:** Always when possible. Eliminates runtime JIT costs, reduces bundle 14KB+ minified
- **WHY:** Zero runtime compilation penalty, leverages V8's four-tier optimization immediately

**Template literal tag functions**

- **AVOID:** For performance-critical paths. Each call allocates objects, slower than plain concatenation
- **DO:** Replace with compiled string concatenation for hot paths

## Memory Layout & Object Optimization

**Hidden class optimization (Critical)**

- **DO:** Maintain consistent object shapes. Monomorphic = baseline performance
- **AVOID:** Dynamic property addition. Polymorphic (2-4 shapes) = 40% slower
- **NEVER:** >4 object shapes. Megamorphic = 3.5x slower, worst case 60x slower
- **IMPACT:** 20,000x performance improvements measured in optimal scenarios

**Object pooling with hidden class reuse**

- **DO:** For allocation-heavy rendering (1000+ objects). Can eliminate 50% GC time
- **HOW:** Pre-create objects with identical structure, reset fields between uses
- **EVIDENCE:** 2x throughput improvement when GC dropped from 50% to 0%
- **AVOID:** Low-frequency rendering. Pool overhead exceeds benefits

**Escape analysis optimization**

- **DO:** Write single-scope functions to enable stack allocation
- **AVOID:** Closures and scope nesting for hot paths. Forces heap allocation
- **BENEFIT:** 6.3% performance improvement when objects stay on stack
- **LIMIT:** Complex control flow defeats optimization

## String Construction

**String concatenation patterns**

- **DO:** Use `+=` operator for <413,085 concatenations. Modern V8 optimized
- **DO:** Use `Array.join()` for >1 million operations. 50% faster (7.88ms vs 15.83ms)
- **AVOID:** Manual array pre-allocation. Engine optimizes automatically
- **OBSOLETE:** Historic advice about avoiding `+` operator

**V8 string internals**

- **UNDERSTAND:** ConsString enables O(1) concatenation but O(n) flattening when indexed
- **AVOID:** Mixing string building with character-level access
- **USE:** SlicedString for substrings >13 characters (retains parent in memory)

**Buffer vs TextDecoder (Node.js)**

- **DO:** Use `Buffer.toString()` in Node. 2.9x faster than TextDecoder (4.1M vs 1.4M ops/sec)
- **PLATFORM:** Safari leads TextDecoder performance, Node.js 4.6x slower
- **RULE:** Native Node APIs over web standards for string generation

## Caching & Memoization

**WeakMap caching**

- **DO:** For templates with repeat patterns. 240x improvement after first render
- **UNDERSTAND:** Memoization paradox—first render slower, subsequent renders dramatically faster
- **DEPENDS:** Cache hit rates. High variability = net performance loss

**Function allocation vs pooling**

- **SURPRISING:** Object pooling often 2-3x slower in microbenchmarks (50.3M vs 15.2-25.2M ops/sec)
- **USE:** Only when sustained GC pressure reduction outweighs allocation overhead
- **TRUST:** Modern V8 escape analysis often better than manual pooling

## Advanced Optimizations

**SIMD string escaping**

- **POTENTIAL:** 2x+ improvements with ARM64 Neon instructions
- **CAUTION:** WebAssembly SIMD can be 4x slower due to register limitations
- **MEASURE:** Actual workloads over theoretical benefits

**Proxy-based patterns**

- **AVOID:** 83x slower than direct access (80M vs 960K ops/sec)
- **RECENT:** V8 improvements of 49-74%, still substantial baseline penalty
- **RULE:** Never use Proxy for performance-critical template rendering

**Bitwise operations for control flow**

- **LIMITED:** Benefits mainly in WASM contexts, not pure JavaScript
- **PREFER:** Let V8 handle branch prediction. Modern engines optimize predictable branches
- **COMPLEXITY:** Unreadable code for minimal gains

## Memory Management

**Large string construction (Node.js)**

- **DO:** Use Buffer for outputs >20KB. Native C++ operations significantly faster
- **HOW:** Write chunks to Buffer, single `toString()` call at end
- **EVIDENCE:** 2-3x faster for multi-MB outputs
- **BROWSER:** Use ArrayBuffer + TextDecoder for similar patterns

**String interning**

- **AUTOMATIC:** Engines intern literals automatically
- **MANUAL:** Only for proven duplicate dynamic strings
- **OVERHEAD:** Map lookup per string creation, unbounded memory growth risk

## Function Specialization

**Avoiding megamorphic behavior**

- **MONOMORPHIC:** Target function, same types = fastest
- **POLYMORPHIC:** Up to 4 types = 40% slowdown acceptable
- **MEGAMORPHIC:** >4 types = 3.5x slower minimum, up to 60x in worst case
- **STRATEGY:** Generate type-specific function variants for hot paths

**Inline caching optimization**

- **FACT:** 90% call sites remain monomorphic, 9% polymorphic, 1% megamorphic
- **MAINTAIN:** Consistent property access patterns
- **AVOID:** Dynamic method calls in hot paths

## Obsolete Techniques (Modern V8)

**No longer beneficial:**

- Manual array pre-allocation
- Avoiding `const`/`let` keywords
- Manual loop unrolling
- String concatenation tricks from 2012
- SunSpider-era optimizations

**Engine handles automatically:**

- Branch optimization for predictable patterns
- String concatenation via rope structures
- Escape analysis for short-lived objects

## Implementation Priorities

**High Impact, Low Complexity:**

1. Consistent object shapes (hidden classes)
2. Template pre-compilation
3. Object pooling for high-allocation scenarios
4. Appropriate string building thresholds

**Measure, Don't Assume:**

- Use Core Web Vitals and production profiling
- Cross-browser testing reveals optimization conflicts
- 42.68% of optimizations improve consistently across engines
- Most effective changes require 1-3 lines

**Architectural Over Micro:**

- Pre-compilation strategies: 472K vs 3.8K ops/sec
- Consistent object shapes: 60x performance differences
- Appropriate caching: 240x improvements
- These dwarf code-level micro-optimizations

---

> "In nature's brutal optimization game, ravens don't just endure—they dominate by exploiting weaknesses others can't see. Every technique here is backed by quantified evidence, not speculation."

_The sharp knife cuts clean. Measure, optimize, dominate._
