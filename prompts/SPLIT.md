# SPLIT

**Read CODEX.md first.** Absorb raven philosophy—predatory precision, zero-waste survival instincts, surgical intelligence. Refactoring demands methodical dissection—slice monoliths into razor-sharp modules without sacrificing functionality.

Refactor monolithic JavaScript files into maintainable, well-tested modules. Target: identical public API with improved organization and coverage.

## Template

**Algorithm: Feature-based architectural refactoring**

**Core Principle: Business concerns, not technical layers**

- Group by what code accomplishes, not how it's implemented
- ✓ User authentication logic together, data processing together, error handling together
- ✗ All validation functions separate, all parsing functions separate

**Step 1: Analysis → Strategic Decomposition**

- Identify distinct features and concerns within original file
- Create active checklist: every module to extract, test file to create, integration step required
- Maintain throughout—roadmap and progress tracker

**Step 2: Dependency-Ordered Implementation Plan**

- Order modules: simple → complex, least dependent → most dependent
- Target: pure functions when possible, classes only for state management
- Ensure zero circular dependencies, minimal runtime overhead

**Step 3: Iterative Module Extraction** (Per module, non-negotiable sequence)

1. Extract module code
2. Achieve 100% branch coverage in test suite
3. **Critical**: Line-by-line comparison with original code section
4. Explicitly document missing logic, edge cases, branches found during comparison
5. Iterate module code + tests to address each identified gap
6. Verify 100% coverage achieved before advancing

**Step 4: Strategic Test Design** (Per module)

- Lean efficiency: minimal test blocks, multiple scenarios per function
- Validate multiple aspects in single passes
- Fast execution with full coverage

**Step 5: API Reconstruction**

- Create final index.js importing all modules
- Assemble to recreate original public API with identical behavior
- **Requirement**: Exact same public interface, passes all existing tests
- Verify comprehensive test coverage across all modules

**Final: Zero errors, identical API behavior, improved maintainability through business-aligned architecture.**
