/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Home page - demonstrates markdown content with component integration
 */

import { code, js, markdownToHTML, md } from "@raven-js/beak";
import { FeatureGrid } from "../../components/feature-grid.js";
import { Hero } from "../../components/hero.js";
import { Layout } from "../../components/layout.js";

/**
 * Home page handler function
 * @param {import('@raven-js/wings').Context} ctx - Request context
 */
export const handler = (ctx) => {
	const page = Layout({
		title: "RavenJS SSG - Content As Code",
		description:
			"Build static sites with pure JavaScript - no magic, just code",
		content,
	});
	ctx.html(page);
};

const homeHandlerSnippet = js`
  // src/pages/home/index.js
  export const handler = (ctx) => {
    const content = md\`# Welcome to RavenJS SSG\nPure JavaScript content...\`;
    return ctx.html(Layout({ title: "Home", content }));
  };
`;

const routeRegistrationSnippet = js`
  import { handler as homeHandler } from "./pages/home/index.js";
  router.get("/", homeHandler);
`;

/**
 * Home page content using markdown with embedded components
 */
const content = markdownToHTML(md`
# Welcome to RavenJS SSG

${Hero({
	title: "Content As Code",
	subtitle: "Build static sites with pure JavaScript",
	cta: { text: "Get Started", href: "/docs" },
})}

## Why RavenJS SSG?

This isn't just another static site generator. It's a **Content As Code** approach that treats your pages like JavaScript modules - because that's exactly what they are.

${FeatureGrid([
	{
		icon: "⚡",
		title: "Zero Dependencies",
		description: "No supply chain vulnerabilities, no framework lock-in",
	},
	{
		icon: "🔧",
		title: "Pure JavaScript",
		description: "Every page is a JS module - familiar, powerful, flexible",
	},
	{
		icon: "🚀",
		title: "Scales Up",
		description: "Start with static, evolve to full-stack when needed",
	},
])}

## How It Works

Each page lives in its own folder with an \`index.js\` file that exports a handler function. No magic syntax to learn - just JavaScript and tagged template literals from Beak.

${code(homeHandlerSnippet, "javascript")}

Mount pages in your central \`routes.js\`:

${code(routeRegistrationSnippet, "javascript")}

## Evolution Path

1. **Start here**: Static marketing site with Markdown + components
2. **Add interactivity**: Client-side JavaScript with Reflex signals
3. **Go dynamic**: Server-side logic with Wings routing
4. **Scale up**: Deploy to Cloudflare Workers, AWS Lambda, or VPS

Same codebase, same patterns, seamless evolution.
`);
