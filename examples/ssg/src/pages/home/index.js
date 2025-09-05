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

import { code, md } from "@raven-js/beak";
import { FeatureGrid } from "../../components/feature-grid.js";
import { Hero } from "../../components/hero.js";
import { homeHandlerSnippet, routeRegistrationSnippet } from "./snippets.js";

/**
 * Home page title
 */
export const title = "RavenJS SSG - Content As Code";

/**
 * Home page description
 */
export const description =
	"Build static sites with pure JavaScript - no magic, just code";

/**
 * Home page content using markdown with embedded components
 */
export const body = md`
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
`;
