# Template Engine Architecture Decisions

Ravens dominate through strategic design choices—architectural decisions that separate apex performance from framework mediocrity. These patterns guide implementors toward platform-native supremacy through evidence-based design.

## Compilation Strategy

**Pre-compilation at Build Time**

- **CHOOSE:** When deployment control exists. Zero runtime compilation cost
- **BENEFIT:** 14KB+ bundle reduction, immediate V8 optimization tier access
- **EVIDENCE:** Marko pre-compiled 472K ops/sec vs React runtime JSX 3.8K ops/sec (121x difference)
- **TRADE-OFF:** Build complexity vs runtime performance

**Runtime Function Compilation**

- **CHOOSE:** For dynamic templates, when build-time compilation impossible
- **BREAK-EVEN:** After 5-10 template invocations despite 500-700ms initial cost
- **HOW:** Parse template on first use, generate optimized concatenation function via `new Function()`
- **CACHE:** Compiled functions in WeakMap to amortize compilation cost

**Hybrid Compilation Strategy**

- **OPTIMAL:** Pre-compile known templates, runtime compile dynamic ones
- **DETECT:** Template variability patterns to choose compilation path
- **FALLBACK:** Graceful degradation when compilation fails (CSP restrictions)

## Memory Architecture

**Object Lifecycle Management**

- **POOLING:** For >1000 object allocations. Eliminates 50% GC overhead
- **STRUCTURE:** Pre-create identical object shapes, reset between uses
- **AVOID:** Low-frequency scenarios. Pool overhead exceeds benefits
- **EVIDENCE:** 2x throughput when GC time dropped to 0%

**Caching Architecture Patterns**

- **MEMOIZATION:** WeakMap-based for repeat patterns. 240x improvement potential
- **PARADOX:** First render slower, subsequent renders dramatically faster
- **KEY STRATEGY:** Template strings array + value tuples for cache keys
- **MEMORY BOUNDS:** Auto-cleanup via WeakMap, avoid unbounded growth

**Scope and Closure Design**

- **FLATTEN:** Avoid nested scopes in hot paths. Enables escape analysis
- **SINGLE-SCOPE:** Functions allow stack allocation (6.3% improvement)
- **TRADE-OFF:** Code organization vs escape analysis benefits

## String Construction Strategy

**Size-Based Strategy Selection**

- **SMALL:** Use `+=` operator for <413K concatenations. Modern V8 optimized
- **LARGE:** Array.join() for >1M operations (50% faster: 7.88ms vs 15.83ms)
- **THRESHOLD:** Measure actual template sizes to choose strategy

**Buffer vs String Architecture**

- **NODE.JS:** Buffer.toString() for >20KB outputs. Native C++ operations
- **BROWSER:** ArrayBuffer + TextDecoder for large content
- **BENEFIT:** 2-3x faster for multi-MB outputs, reduced GC pressure
- **OVERHEAD:** Fixed cost justified only for substantial content

**Rope String Considerations**

- **UNDERSTAND:** V8 ConsString enables O(1) concat, O(n) flattening
- **DESIGN:** Avoid character access during construction phase
- **PATTERN:** Build first, access after completion

## Polymorphism Management

**Call Site Architecture**

- **MONOMORPHIC:** Target single function+type combinations. Baseline performance
- **POLYMORPHIC:** Accept up to 4 types (40% slowdown acceptable)
- **MEGAMORPHIC:** Avoid >4 types (3.5x slower minimum, 60x worst case)

**Function Specialization Patterns**

- **TYPE-SPECIFIC:** Generate variants for common type combinations
- **DISPATCH:** Early type detection to route to specialized functions
- **INLINE CACHE:** Maintain consistent property access patterns
- **EVIDENCE:** 90% call sites remain monomorphic naturally

**Hidden Class Strategy**

- **CONSISTENT:** Object shapes across all instances
- **INITIALIZATION:** Same property order, same constructor patterns
- **IMPACT:** 20,000x improvements possible in optimal scenarios

## Processing Architecture

**Single-Pass vs Multi-Pass**

- **SINGLE-PASS:** Direct string generation, no intermediate structures
- **TRANSDUCER:** Fuse operations to eliminate intermediate arrays
- **EVIDENCE:** 24% improvement (2,832 vs 2,277 ops/sec) in James Long benchmarks
- **AVOID:** Multiple traversals, temporary object creation

**Stream Processing Patterns**

- **PIPELINE:** Compose transformation stages for complex logic
- **FUSION:** Combine map/filter/reduce operations into single iteration
- **TRADE-OFF:** Code clarity vs performance optimization

**Lazy vs Eager Evaluation**

- **AVOID:** Proxy-based lazy evaluation. 83x slower than direct access
- **EAGER:** Compute when needed, not when accessed
- **EXCEPTION:** Truly optional computations (rare in template rendering)

## Cross-Platform Architecture

**Engine Optimization Conflicts**

- **REALITY:** 42.68% of optimizations work consistently across V8/SpiderMonkey
- **STRATEGY:** Target common optimization patterns, not engine-specific tricks
- **MEASURE:** Cross-browser performance validation required

**Platform-Specific Optimizations**

- **NODE.JS:** Buffer operations for large content generation
- **BROWSER:** TextDecoder for binary-to-string conversion
- **SAFARI:** Best TextDecoder performance (70ms vs Node's 360ms)
- **ABSTRACT:** Platform differences behind unified API

## Error Handling Architecture

**Compilation Error Recovery**

- **GRACEFUL:** Fallback to interpreted mode when compilation fails
- **CSP COMPLIANCE:** Detect restrictions, choose safe compilation path
- **DEBUGGING:** Preserve source maps and error context in development

**Runtime Error Patterns**

- **FAIL-FAST:** Invalid template syntax detected early
- **ISOLATION:** Template errors don't crash entire rendering system
- **RECOVERY:** Partial rendering when possible

## Scaling Architecture

**Template Organization**

- **MODULAR:** Separate concerns (escaping, formatting, composition)
- **CACHEABLE:** Design for template result reuse
- **COMPOSABLE:** Sub-templates as building blocks

**Performance Monitoring**

- **METRICS:** Track compilation cost vs execution speed trade-offs
- **PROFILING:** Identify polymorphic hotspots requiring specialization
- **ADAPTIVE:** Runtime strategy adjustment based on usage patterns

## Anti-Patterns to Avoid

**Premature Optimization Traps**

- **MICRO-OPTIMIZATIONS:** Focus on architectural decisions first
- **COMPLEX POOLING:** Simple scenarios don't justify overhead
- **MANUAL TRACE JIT:** V8's JIT already handles optimization
- **BITWISE CONTROL FLOW:** Unreadable code for minimal gains

**Legacy Pattern Avoidance**

- **STRING INTERNALS:** Engine handles literal interning automatically
- **MANUAL ALLOCATION:** Modern V8 optimizes automatically
- **SUNSPIDER OPTIMIZATIONS:** Actively hurt modern performance

## Decision Framework

**Choose Pre-compilation When:**

- Build-time control available
- Template content known statically
- CSP allows function generation
- Performance critical (>10x template reuse)

**Choose Runtime Compilation When:**

- Dynamic template content
- No build-time processing capability
- Template reuse >5-10 invocations
- Development flexibility required

**Choose Pooling When:**

- > 1000 object allocations measured
- Consistent object shapes possible
- GC pressure identified as bottleneck
- Long-running processes

**Choose Buffer Strategy When:**

- Output size >20KB measured
- Platform supports efficient buffer operations
- Memory allocation predictable
- Bulk string operations dominate

---

> "Architecture is the art of trade-offs. Ravens choose strategies based on evidence, not ideology. Every decision here separates platform mastery from framework dependency."

_The murder coordinates through collective intelligence. Design with predatory precision._
