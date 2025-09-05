/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Documentation page - demonstrates advanced markdown with multiple components
 */

import { md } from "@raven-js/beak";
import { Callout } from "../../components/callout.js";
import { CodeBlock } from "../../components/code-block.js";
import { Layout } from "../../components/layout.js";
import { TableOfContents } from "../../components/table-of-contents.js";

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
 * Docs page metadata
 */
export const meta = {
  title: "Documentation - RavenJS SSG",
  description: "Complete guide to building static sites with RavenJS",
  path: "/docs",
};

/**
 * Documentation sections for table of contents
 */
const sections = [
  { id: "getting-started", title: "Getting Started" },
  { id: "page-structure", title: "Page Structure" },
  { id: "components", title: "Components" },
  { id: "routing", title: "Routing" },
  { id: "building", title: "Building" },
  { id: "deployment", title: "Deployment" },
];

/**
 * Documentation content
 */
const content = md`
# Documentation

${TableOfContents({ sections })}

${Callout({
  type: "info",
  content:
    "This documentation is itself built using RavenJS SSG - pure JavaScript everywhere!",
})}

## Getting Started {#getting-started}

RavenJS SSG uses a **Content As Code** approach. Every page is a JavaScript module that exports a handler function.

${CodeBlock({
  language: "bash",
  code: `# Clone and install
git clone https://github.com/Anonyfox/ravenjs.git
cd ravenjs/examples/ssg
npm install

# Start development server
npm run dev

# Build static site
npm run build`,
})}

## Page Structure {#page-structure}

Each page lives in its own folder under \`src/pages/\`:

${CodeBlock({
  language: "text",
  code: `src/pages/
├── home/
│   └── index.js        # Exports handler function
├── about/
│   └── index.js        # Can import local components
├── blog/
│   ├── index.js        # Blog listing page
│   ├── components/     # Page-specific components
│   └── data/          # Page-specific data
└── docs/
    └── index.js        # This page!`,
})}

${Callout({
  type: "tip",
  content:
    "Each page folder can contain its own components, data, and assets. This keeps related code together and makes refactoring easier.",
})}

## Components {#components}

Components are just functions that return HTML strings using Beak's tagged templates:

${CodeBlock({
  language: "javascript",
  code: `import { html } from "@raven-js/beak";

export const Button = ({ text, href, variant = "primary" }) => {
  return html\`
    <a href="\${href}" class="btn btn--\${variant}">
      \${text}
    </a>
  \`;
};

// Use in markdown
const content = md\`
# My Page
Check out this button: \${Button({ text: "Click me", href: "/about" })}
\`;`,
})}

## Routing {#routing}

Routes are defined in \`src/routes.js\` by importing page handlers:

${CodeBlock({
  language: "javascript",
  code: `import { Router } from "@raven-js/wings/core";
import { handler as homeHandler } from "./pages/home/index.js";
import { handler as aboutHandler } from "./pages/about/index.js";

const router = new Router();

// Mount page handlers
router.get("/", homeHandler);
router.get("/about", aboutHandler);

export { router };`,
})}

${Callout({
  type: "warning",
  content:
    "For now, routes must be defined manually. Future versions may include automatic route discovery.",
})}

## Building {#building}

The build process uses Fledge to generate static files:

${CodeBlock({
  language: "javascript",
  code: `// build.js
import { static as fledgeStatic } from "@raven-js/fledge";

await fledgeStatic({
  server: "http://localhost:3000",
  routes: ["/", "/about", "/docs"],
  output: "./dist",
  discover: true, // Find linked pages automatically
});`,
})}

## Deployment {#deployment}

Deploy anywhere static files are supported:

${CodeBlock({
  language: "bash",
  code: `# Build first
npm run build

# Deploy with Soar to Cloudflare Workers
npx @raven-js/soar deploy --static ./dist --cf-workers my-site

# Or copy to any static host
rsync -av dist/ user@server:/var/www/html/

# Or use any static hosting service
# Netlify, Vercel, GitHub Pages, etc.`,
})}

${Callout({
  type: "success",
  content:
    "The generated site is just HTML, CSS, and JavaScript - it works everywhere!",
})}
`;
