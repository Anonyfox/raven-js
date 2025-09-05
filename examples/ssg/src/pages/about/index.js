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

import { md } from "@raven-js/beak";
import { CodeBlock } from "../../components/code-block.js";
import { Layout } from "../../components/layout.js";

/**
 * Docs page handler function
 * @param {import('@raven-js/wings').Context} ctx - Request context
 */
export const handler = (ctx) => {
  const page = Layout({
    title: meta.title,
    description: meta.description,
    content,
  });
  ctx.html(page);
};

/**
 * About page metadata
 */
export const meta = {
  title: "About - RavenJS SSG",
  description: "Learn about the RavenJS approach to static site generation",
  path: "/about",
};

/**
 * About page content
 */
const content = md`
# About RavenJS SSG

RavenJS SSG represents a fundamental shift in how we think about static site generation. Instead of learning new templating languages or dealing with complex build systems, you work with pure JavaScript.

## The Philosophy

Ravens are apex predators of intelligence—ancient survivors who've mastered thriving in hostile environments through cunning, adaptability, and ruthless efficiency. RavenJS embodies this dark intelligence: surgical problem-solving, creative repurposing, and institutional memory.

${CodeBlock({
  language: "javascript",
  code: `// Every page is just a JavaScript module
export const handler = (ctx) => {
  const content = md\`# My Page\nContent here...\`;
  return ctx.html(Layout({ content }));
};`,
})}

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
