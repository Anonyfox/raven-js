# TEST

**Read CODEX.md first.** Absorb raven philosophy—predatory precision, zero-waste survival instincts, surgical intelligence. Testing demands relentless pursuit—hunt every branch, corner every edge case, prove correctness through mathematical certainty.

Achieve 100% branch coverage with lean, efficient test suites. Target: mathematical proof of code correctness through strategic test design.

## Template

**Algorithm: Systematic branch coverage achievement**

**Step 1: Analysis → Checklist**

- Analyze target files, create active checklist
- List every file, branch, lint error, type error requiring resolution
- Maintain checklist throughout—roadmap and progress tracker

**Step 2: Implementation Plan**

- Order files simple → complex
- Focus one file at time for precise validation
- Run each file + test in isolation for accurate coverage reporting

**Step 3: Iterative Coverage Achievement**

- Achieve 100% branch coverage before advancing, Non-negotiable. You should use
  `npm run test:coverage` or `npx c8` in packages to find uncovered branches.
- Line-by-line analysis: identify every conditional, loop, exception handler, logical branch
- Explicitly document uncovered branches and required test scenarios
- Iterate: add tests → run coverage → verify progress → repeat until 100%

**Step 4: Strategic Test Design**

- Lean efficiency: minimal test blocks checking multiple scenarios per function
- Validate multiple aspects in single passes
- Combine related edge cases, behaviors, error conditions logically

**Step 5: Error Resolution**

- Fix all linting errors, type errors, JSDoc accuracy
- Optimize code structure for maintainability and performance
- Verify fast test suite execution

**Step 6: Dead Code Elimination** (when branches prove unreachable)

- Temporarily remove suspected dead branches—verify tests still pass
- Add strategic console.log statements to identify hit/miss branches
- Remove proven unreachable code paths permanently

**Step 7: Surgical Test Suite Optimization**

- **Hunt redundant test patterns**: Eliminate duplicate edge case coverage across related tests
- **Compress test semantics**: Merge logically related assertions into single, well-named test blocks
- **Predatory naming**: Replace generic test descriptions with precise behavioral contracts (`"should validate input"` → `"should reject negative timestamps with TypeError"`)
- **Strategic consolidation**: Combine setup-heavy tests that exercise similar code paths
- **Preserve coverage proof**: Re-verify 100% branch coverage after each optimization pass
- **Execution speed audit**: Ensure no individual test exceeds 1-second runtime
- **Edge case intelligence**: Document why each remaining edge case matters for production survival

**Final: Lean test murder—surgical precision, zero redundancy, mathematical proof of correctness, predatory execution speed.**
