/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset management for static documentation sites.
 *
 * Handles generation and writing of CSS styles and static assets
 * to output directories. Pure asset generation business logic
 * with zero external dependencies.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Generate CSS styles and assets for documentation site
 * @param {string} outputDir - Output directory path
 * @returns {Promise<void>}
 */
export async function generateAssets(outputDir) {
	const assetsDir = join(outputDir, "assets");
	await mkdir(assetsDir, { recursive: true });

	const css = generateCSSContent();
	await writeFile(join(assetsDir, "styles.css"), css);
}

/**
 * Generate CSS content for documentation styling
 * @returns {string} Complete CSS content
 */
export function generateCSSContent() {
	return `
/* Glean Documentation Styles */
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	line-height: 1.6;
	color: #333;
	background: #fafafa;
}

.header {
	background: #2c3e50;
	color: white;
	padding: 2rem;
	border-bottom: 3px solid #34495e;
}

.header h1 {
	font-size: 2.5rem;
	margin-bottom: 0.5rem;
}

.header h1 a {
	color: white;
	text-decoration: none;
}

.header .version {
	color: #bdc3c7;
	font-size: 1.1rem;
}

.header .description {
	color: #ecf0f1;
	margin-top: 1rem;
}

.navigation {
	background: white;
	padding: 1rem 2rem;
	border-bottom: 1px solid #e1e8ed;
}

.navigation a {
	color: #3498db;
	text-decoration: none;
	margin-right: 1rem;
}

.navigation a:hover {
	text-decoration: underline;
}

.module-list {
	list-style: none;
	margin-top: 1rem;
}

.module-list li {
	margin-bottom: 0.5rem;
}

.main-content {
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
}

.stats {
	display: flex;
	gap: 2rem;
	margin: 2rem 0;
}

.stat {
	text-align: center;
	padding: 1rem;
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-number {
	display: block;
	font-size: 2rem;
	font-weight: bold;
	color: #3498db;
}

.stat-label {
	display: block;
	color: #7f8c8d;
	margin-top: 0.5rem;
}

.entity-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
}

.entity-card {
	background: white;
	padding: 1.5rem;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.entity-card h4 {
	margin-bottom: 0.5rem;
}

.entity-card a {
	color: #2c3e50;
	text-decoration: none;
}

.entity-card a:hover {
	color: #3498db;
}

.entity-type {
	background: #3498db;
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.8rem;
	text-transform: uppercase;
}

.entity-description {
	margin-top: 1rem;
	color: #7f8c8d;
}

.jsdoc {
	background: white;
	padding: 2rem;
	border-radius: 8px;
	margin-bottom: 2rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.jsdoc .description {
	font-size: 1.1rem;
	margin-bottom: 1.5rem;
}

.parameters ul, .returns {
	margin-top: 1rem;
}

.parameters li {
	margin-bottom: 0.5rem;
}

.type {
	color: #27ae60;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
}

.source-code {
	background: white;
	padding: 2rem;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.source-code pre {
	background: #2c3e50;
	color: #ecf0f1;
	padding: 1rem;
	border-radius: 4px;
	overflow-x: auto;
}

.source-code code {
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
}

.readme {
	background: white;
	padding: 2rem;
	border-radius: 8px;
	margin-top: 2rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.readme-content h2, .readme-content h3, .readme-content h4 {
	margin: 1.5rem 0 1rem 0;
	color: #2c3e50;
}

.readme-content p {
	margin-bottom: 1rem;
}

.readme-content code {
	background: #f8f9fa;
	padding: 0.2rem 0.4rem;
	border-radius: 3px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
}`;
}
