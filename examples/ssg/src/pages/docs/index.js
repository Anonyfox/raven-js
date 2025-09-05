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

import { code, md } from "@raven-js/beak";
import { Callout } from "../../components/callout.js";
import { TableOfContents } from "../../components/table-of-contents.js";
import {
	buildSnippet,
	componentSnippet,
	deploySnippet,
	installSnippet,
	pageStructureSnippet,
	routingSnippet,
} from "./snippets.js";

/**
 * Documentation page title
 */
export const title = "Documentation - RavenJS SSG";

/**
 * Documentation page description
 */
export const description =
	"Complete guide to building static sites with RavenJS";

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
 * Documentation page content using markdown with embedded components
 */
export const body = md`
# Documentation

${TableOfContents({ sections })}

${Callout({
	type: "info",
	content:
		"This documentation is itself built using RavenJS SSG - pure JavaScript everywhere!",
})}

## Getting Started {#getting-started}

RavenJS SSG uses a **Content As Code** approach. Every page is a JavaScript module that exports three things: \`title\`, \`description\`, and \`body\`.

${code(installSnippet, "bash")}

## Page Structure {#page-structure}

Each page lives in its own folder under \`src/pages/\`. Pages export metadata and content, while the router handles the plumbing:

${code(pageStructureSnippet, "text")}

${Callout({
	type: "tip",
	content:
		"Each page folder can contain its own components, data, and assets. This keeps related code together and makes refactoring easier.",
})}

## Components {#components}

Components are just functions that return HTML strings using Beak's tagged templates:

${code(componentSnippet, "javascript")}

## Routing {#routing}

Routes are defined in \`src/routes.js\` using dynamic imports. The router automatically wraps page exports in the Layout component:

${code(routingSnippet, "javascript")}

${Callout({
	type: "tip",
	content:
		"The router uses dynamic imports to load pages on-demand. This keeps the initial bundle small and eliminates import ceremony.",
})}

## Building {#building}

The build process uses Fledge to generate static files:

${code(buildSnippet, "javascript")}

## Deployment {#deployment}

Deploy anywhere static files are supported:

${code(deploySnippet, "bash")}

${Callout({
	type: "success",
	content:
		"The generated site is just HTML, CSS, and JavaScript - it works everywhere!",
})}
`;
