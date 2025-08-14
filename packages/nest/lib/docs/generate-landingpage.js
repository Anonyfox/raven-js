/**
 * @fileoverview Generate landing page HTML for packages
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { css, html } from "../../../beak/core/index.js";

/**
 * @typedef {Object} PackageInfo
 * @property {string} pkg - Package directory name
 * @property {string} emoji - Package emoji icon
 * @property {string} name - Display name (from package.json)
 * @property {string} description - Package description
 * @property {string} version - Package version
 */

/**
 * Package emoji mapping
 * @type {Record<string, string>}
 */
const PACKAGE_EMOJIS = {
	beak: "🦜",
	nest: "🦅",
	// Add more package emojis as needed
};

/**
 * Creates a package card component
 * @param {PackageInfo} packageInfo - Package information object
 * @returns {string} HTML for package card
 */
function PackageCard({ pkg, emoji, name, description, version }) {
	return html`
		<div class="package">
			<h2><a href="./${pkg}/">${emoji} ${name}</a></h2>
			<p class="description">${description}</p>
			<div class="package-links">
				<span class="version">v${version}</span>
				<a href="./${pkg}.context.json" class="context-link">📄 Context for LLMs</a>
				<div class="bundle-links">
					<a href="./${pkg}.bundle.cjs" class="bundle-link">📦 CJS</a>
					<a href="./${pkg}.bundle.cjs.min.js" class="bundle-link">📦 CJS (min)</a>
					<a href="./${pkg}.bundle.esm.js" class="bundle-link">📦 ESM</a>
					<a href="./${pkg}.bundle.esm.min.js" class="bundle-link">📦 ESM (min)</a>
				</div>
			</div>
		</div>
	`;
}

/**
 * Creates the page header component
 * @returns {string} HTML for page header
 */
function PageHeader() {
	return html`
		<h1>🦅 RavenJS Documentation</h1>
		<p>A swift web dev toolkit - zero-dependency, modern JavaScript libraries for developers who've had enough of framework fatigue.</p>
		<div class="bundles-info">
			<h3>📦 Pre-built Bundles</h3>
			<p>Each package provides pre-built, minified bundles for easy integration:</p>
			<ul>
				<li><strong>CJS:</strong> CommonJS bundle for traditional script tags and Node.js</li>
				<li><strong>CJS (min):</strong> Minified CommonJS bundle for production</li>
				<li><strong>ESM:</strong> ES Module bundle for modern browsers</li>
				<li><strong>ESM (min):</strong> Minified ES Module bundle for production</li>
			</ul>
			<p><strong>Usage:</strong> Click the bundle links below each package to download, or use directly in your HTML:</p>
			<pre><code>&lt;script src="./package-name.bundle.cjs"&gt;&lt;/script&gt;
&lt;script type="module"&gt;
  import { Component } from './package-name.bundle.esm.js';
&lt;/script&gt;</code></pre>
		</div>
	`;
}

/**
 * Creates the page footer component
 * @returns {string} HTML for page footer
 */
function PageFooter() {
	return html`
		<hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;">
		<p><a href="https://github.com/Anonyfox/raven-js">View on GitHub</a> | <a href="https://ravenjs.dev">Visit Website</a></p>
		<p style="font-size: 0.9rem; color: #6c757d; margin-top: 1rem;">
			MIT License - Copyright (c) 2025 Anonyfox e.K.
		</p>
	`;
}

/**
 * Creates the page styles component
 * @returns {string} CSS styles
 */
function PageStyles() {
	return css`
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 800px;
			margin: 0 auto;
			padding: 2rem;
			line-height: 1.6;
		}
		h1 {
			color: #2c3e50;
			border-bottom: 3px solid #3498db;
			padding-bottom: 0.5rem;
		}
		.package {
			background: #f8f9fa;
			border: 1px solid #e9ecef;
			border-radius: 8px;
			padding: 1.5rem;
			margin: 1rem 0;
		}
		.package h2 {
			margin-top: 0;
			color: #495057;
		}
		.package a {
			color: #3498db;
			text-decoration: none;
			font-weight: 500;
		}
		.package a:hover {
			text-decoration: underline;
		}
		.description {
			color: #6c757d;
			margin: 0.5rem 0;
		}
		.package-links {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			margin-top: 0.5rem;
			flex-wrap: wrap;
		}
		.bundle-links {
			display: flex;
			gap: 0.25rem;
		}
		.version {
			background: #e9ecef;
			padding: 0.2rem 0.5rem;
			border-radius: 4px;
			font-size: 0.9rem;
			color: #495057;
		}
		.context-link {
			font-size: 0.8rem;
			color: #6c757d;
			text-decoration: none;
			padding: 0.2rem 0.5rem;
			border: 1px solid #dee2e6;
			border-radius: 4px;
			background: #f8f9fa;
		}
		.context-link:hover {
			background: #e9ecef;
			color: #495057;
		}
		.bundle-link {
			font-size: 0.8rem;
			color: #6c757d;
			text-decoration: none;
			padding: 0.2rem 0.5rem;
			border: 1px solid #dee2e6;
			border-radius: 4px;
			background: #f8f9fa;
		}
		.bundle-link:hover {
			background: #e9ecef;
			color: #495057;
		}
		.bundles-info {
			background: #e3f2fd;
			border: 1px solid #bbdefb;
			border-radius: 8px;
			padding: 1.5rem;
			margin: 1.5rem 0;
		}
		.bundles-info h3 {
			margin-top: 0;
			color: #1976d2;
		}
		.bundles-info ul {
			margin: 0.5rem 0;
			padding-left: 1.5rem;
		}
		.bundles-info li {
			margin: 0.25rem 0;
		}
		.bundles-info pre {
			background: #f8f9fa;
			border: 1px solid #e9ecef;
			border-radius: 4px;
			padding: 1rem;
			overflow-x: auto;
			margin: 0.5rem 0;
		}
		.bundles-info code {
			font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
			font-size: 0.9rem;
		}
	`;
}

/**
 * Generate landing page HTML from package names
 * @param {string[]} packageNames - Array of package names (e.g., ["beak", "nest"])
 * @param {import('../folder.js').Folder} workspaceFolder - Folder instance containing workspace packages
 * @returns {string} Complete HTML page
 */
export function generateLandingPage(packageNames, workspaceFolder) {
	// Process package data
	const packageData = packageNames
		.map((pkg) => {
			try {
				const packageJsonContent = workspaceFolder.getFile(
					`packages/${pkg}/package.json`,
				);
				if (!packageJsonContent) {
					return null;
				}

				const packageJson = JSON.parse(packageJsonContent);

				/** @type {PackageInfo} */
				return {
					pkg,
					emoji: PACKAGE_EMOJIS[pkg] || "📦",
					name: packageJson.name.includes("/")
						? packageJson.name.split("/")[1]
						: packageJson.name,
					description: packageJson.description || "No description available",
					version: packageJson.version || "0.0.0",
				};
			} catch {
				// Return null for packages that can't be processed
				return null;
			}
		})
		.filter(Boolean);

	// Generate the complete HTML page
	return html`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>RavenJS Documentation</title>
			<style>${PageStyles()}</style>
		</head>
		<body>
			${PageHeader()}
			${packageData.map(PackageCard)}
			${PageFooter()}
		</body>
		</html>
	`;
}
