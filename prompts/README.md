# Prompts

**Read CODEX.md first.** Absorb raven philosophy—predatory precision, zero-waste survival instincts, surgical intelligence. These prompts weaponize AI agents to maintain codebase excellence through systematic, uncompromising execution.

This is a collection of useful prompts for copypasting into LLM Agents to
perform chores on your behalf with reasonable result quality and success rate
while ensuring the whole codebase stays in line with the general architectural
decisions and code style.

## General Approach

with an LLM agent, these tasks in that order seemingly produce outstanding results:

1. Build new Feature with reasonable initial testsuite
2. If the Complexity is too high (LOC, ...), run a [SPLIT](SPLIT.md) pass
3. Ensure it all works flawlessly, run a [TEST](TEST.md) pass
4. Optimize the code for performance, run a [TUNE](TUNE.md) pass
5. Ensure it all works still flawlessly, run a [TEST](TEST.md) pass (yes, again)
6. Generate optimal docs and types with [DOCS](DOCS.md)
   (optionally also including the relevant markdown files)
