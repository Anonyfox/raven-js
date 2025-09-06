/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Root index page - demonstrates root route
 */

import { md } from "@raven-js/beak";

/**
 * Root page title
 */
export const title = "RavenJS SSG - File-Based Routing Demo";

/**
 * Root page description
 */
export const description =
	"Demonstration of file-based routing with static and dynamic routes";

/**
 * Root page content
 */
export const body = md`
# File-Based Routing Demo

Welcome to the **RavenJS SSG** file-based routing demonstration!

## Available Routes

### Static Routes
- \`/\` - This page (root index)
- \`/about\` - About page
- \`/docs\` - Documentation page
- \`/home\` - Home page

### Dynamic Routes
- \`/blog/[slug]\` - Blog posts with slug parameter
- \`/shop/[category]/[item]\` - Nested product pages
- \`/docs/[...path]\` - Catch-all documentation routes

## How It Works

Each route is automatically discovered from the filesystem:

\`\`\`
src/pages/
├── index.js              → /
├── about/index.js        → /about
├── blog/[slug]/index.js  → /blog/:slug
└── docs/[...path]/index.js → /docs/*path
\`\`\`

## Test the Routes

Try visiting these example URLs:
- [/blog/my-first-post](/blog/my-first-post)
- [/shop/electronics/laptop](/shop/electronics/laptop)
- [/docs/getting-started/installation](/docs/getting-started/installation)

**Content As Code** - every page is a JavaScript module with clean exports!
`;
