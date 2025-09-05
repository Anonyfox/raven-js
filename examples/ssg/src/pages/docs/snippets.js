/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Documentation page code snippets
 */

export const installSnippet = `# Clone and install
git clone https://github.com/Anonyfox/ravenjs.git
cd ravenjs/examples/ssg
npm install

# Start development server
npm run dev

# Build static site
npm run build`;

export const pageStructureSnippet = `src/pages/
├── home/
│   ├── index.js        # Exports title, description, body
│   └── snippets.js     # Code examples for this page
├── about/
│   └── index.js        # Can import local components
├── blog/
│   ├── index.js        # Blog listing page
│   ├── components/     # Page-specific components
│   └── data/          # Page-specific data
└── docs/
    ├── index.js        # This page!
    └── snippets.js     # Documentation code examples`;

export const componentSnippet = `import { html, md } from "@raven-js/beak";

export const Button = ({ text, href, variant = "primary" }) => {
  return html\`
    <a href="\${href}" class="btn btn--\${variant}">
      \${text}
    </a>
  \`;
};

// Use in page body
export const title = "My Page";
export const description = "A page with a button";
export const body = md\`
# My Page
Check out this button: \${Button({ text: "Click me", href: "/about" })}
\`;`;

export const routingSnippet = `import { Router } from "@raven-js/wings";
import { Assets } from "@raven-js/wings/server";
import { Layout } from "./components/layout.js";

const router = new Router();
router.use(new Assets({ assetsDir: "public" }));

// Route definitions with dynamic imports
const routes = [
  { path: "/", page: "./pages/home/index.js" },
  { path: "/about", page: "./pages/about/index.js" },
];

// Mount all routes with dynamic imports
for (const route of routes) {
  router.get(route.path, async (ctx) => {
    const page = await import(route.page);
    ctx.html(Layout(page));
  });
}

export { router };`;

export const buildSnippet = `// build.js
import { static as fledgeStatic } from "@raven-js/fledge";

await fledgeStatic({
  server: "http://localhost:3000",
  routes: ["/", "/about", "/docs"],
  output: "./dist",
  discover: true, // Find linked pages automatically
});`;

export const deploySnippet = `# Build first
npm run build

# Deploy with Soar to Cloudflare Workers
npx @raven-js/soar deploy --static ./dist --cf-workers my-site

# Or copy to any static host
rsync -av dist/ user@server:/var/www/html/

# Or use any static hosting service
# Netlify, Vercel, GitHub Pages, etc.`;
