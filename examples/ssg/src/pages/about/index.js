/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file About page - demonstrates simple markdown content
 */

import { code, md } from "@raven-js/beak";
import { Counter } from "../../apps/counter.js";
import { island } from "../../components/island.js";
import { pageExampleSnippet } from "./snippets.js";

/**
 * About page title
 */
export const title = "About - RavenJS SSG";

/**
 * About page description
 */
export const description =
	"Learn about the RavenJS approach to static site generation";

/**
 * About page content using markdown with embedded components
 */
export const body = md`
# About RavenJS SSG

RavenJS SSG represents a fundamental shift in how we think about static site generation. Instead of learning new templating languages or dealing with complex build systems, you work with pure JavaScript.

## Islands Architecture Demo

Including seamless reactivity with **selective hydration** - interactive components on static pages:

### Load Strategy (immediate)
${island(Counter, { initial: 0 })}

### Idle Strategy (when browser idle)
${island(Counter, { initial: 10 }, { client: "idle" })}

### Visible Strategy (when scrolled into view)
${island(Counter, { initial: 100 }, { client: "visible" })}

## The Philosophy

Ravens are apex predators of intelligence—ancient survivors who've mastered thriving in hostile environments through cunning, adaptability, and ruthless efficiency. RavenJS embodies this dark intelligence: surgical problem-solving, creative repurposing, and institutional memory.

${code(pageExampleSnippet, "javascript")}

## Zero Dependencies

No external dependencies means:
- No supply chain attacks
- No abandoned maintainers breaking your build
- No version conflicts
- No security vulnerabilities from transitive dependencies

## Content As Code

When your content is JavaScript:
- **Type safety** with JSDoc annotations
- **Imports and exports** for code reuse
- **Version control** works naturally
- **Refactoring tools** understand your content
- **Testing** becomes straightforward

## Evolution Path

Start with static content, evolve to dynamic applications:

1. **Static Phase**: Markdown content with component integration
2. **Interactive Phase**: Add client-side JavaScript with Reflex
3. **Dynamic Phase**: Server-side logic with Wings routing
4. **Scale Phase**: Deploy anywhere - CDN, serverless, VPS

Same codebase, same patterns, seamless growth.
`;
