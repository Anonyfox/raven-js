// ============================================================================
// Landing Page Renderer
// A clean example of modern ECMAScript + beak templating
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { css, html } from "../packages/beak/core/index.js";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * @typedef {Object} PackageInfo
 * @property {string} pkg - Package directory name
 * @property {string} emoji - Package emoji icon
 * @property {string} name - Display name (from package.json)
 * @property {string} description - Package description
 * @property {string} version - Package version
 */

// Package configuration
const packages = ["beak"];
/** @type {Record<string, string>} */
const packageEmojis = { beak: "🦜" };

// ============================================================================
// Component Functions
// ============================================================================

/**
 * Creates a package card component
 * @param {PackageInfo} packageInfo - Package information object
 * @returns {string} HTML for package card
 */
const PackageCard = ({ pkg, emoji, name, description, version }) => html`
  <div class="package">
    <h2><a href="./${pkg}/">${emoji} ${name}</a></h2>
    <p class="description">${description}</p>
    <div class="package-links">
      <span class="version">v${version}</span>
      <a href="./${pkg}.context.json" class="context-link">📄 Context for LLMs</a>
    </div>
  </div>
`;

/**
 * Creates the page header component
 * @returns {string} HTML for page header
 */
const PageHeader = () => html`
  <h1>🦅 RavenJS Documentation</h1>
  <p>A swift web dev toolkit - zero-dependency, modern JavaScript libraries for developers who've had enough of framework fatigue.</p>
`;

/**
 * Creates the page footer component
 * @returns {string} HTML for page footer
 */
const PageFooter = () => html`
  <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;">
  <p><a href="https://github.com/Anonyfox/raven-js">View on GitHub</a> | <a href="https://ravenjs.dev">Visit Website</a></p>
  <p style="font-size: 0.9rem; color: #6c757d; margin-top: 1rem;">
    MIT License - Copyright (c) 2025 Anonyfox e.K.
  </p>
`;

/**
 * Creates the page styles component
 * @returns {string} CSS styles
 */
const PageStyles = () => css`
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
`;

// ============================================================================
// Data Processing
// ============================================================================

/**
 * Loads package information from package.json files
 * @returns {Promise<PackageInfo[]>} Array of package information objects
 */
export const loadPackageData = async () => {
	const promises = packages.map(async (pkg) => {
		const pkgPath = path.join("packages", pkg, "package.json");
		try {
			const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
			/** @type {PackageInfo} */
			return {
				pkg,
				emoji: packageEmojis[pkg] || "📦",
				name: pkgJson.name.split("/")[1],
				description: pkgJson.description,
				version: pkgJson.version,
			};
		} catch (error) {
			console.error(`Failed to load package ${pkg}:`, error);
			return null;
		}
	});

	const results = await Promise.all(promises);
	return results.filter(Boolean);
};

// ============================================================================
// Main Render Function
// ============================================================================

/**
 * Renders the complete documentation landing page
 * @returns {Promise<string>} Complete HTML page
 */
export const renderLandingPage = async () => {
	const packageData = await loadPackageData();

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
};
