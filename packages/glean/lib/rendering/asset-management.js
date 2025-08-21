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
 * Handles CSS generation, image copying (as-is), favicon processing,
 * and static file management. Zero transformations, maximum performance.
 */

import { copyFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Get the path to glean static folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const GLEAN_STATIC_PATH = join(__dirname, "../..", "static");

/**
 * Copy static files recursively from source to destination
 * @param {string} sourceDir - Source directory path
 * @param {string} destDir - Destination directory path
 * @returns {Promise<void>}
 */
async function copyStaticFiles(sourceDir, destDir) {
	const { mkdir } = await import("node:fs/promises");

	try {
		const entries = await readdir(sourceDir, { withFileTypes: true });

		for (const entry of entries) {
			const sourcePath = join(sourceDir, entry.name);
			const destPath = join(destDir, entry.name);

			if (entry.isDirectory()) {
				await mkdir(destPath, { recursive: true });
				await copyStaticFiles(sourcePath, destPath);
			} else {
				await copyFile(sourcePath, destPath);
			}
		}
	} catch (error) {
		console.warn(
			`Warning: Could not copy static files from ${sourceDir}:`,
			error.message,
		);
	}
}

/**
 * Generate and copy all static assets for documentation site
 * @param {string} outputDir - Output directory path
 * @returns {Promise<void>}
 */
export async function generateAssets(outputDir) {
	const { mkdir, writeFile } = await import("node:fs/promises");
	const { join } = await import("node:path");

	// Create assets directory
	const assetsDir = join(outputDir, "assets");
	await mkdir(assetsDir, { recursive: true });

	// Generate and write CSS file
	const cssContent = generateCSSContent();
	await writeFile(join(assetsDir, "styles.css"), cssContent, "utf8");

	// Copy all static files (including favicon, bootstrap, etc.) to assets directory
	await copyStaticFiles(GLEAN_STATIC_PATH, assetsDir);
}

/**
 * Generate minimal CSS content for documentation site
 * @returns {string} CSS content string
 */
export function generateCSSContent() {
	return `/* Glean Documentation Styles */

/* Reset and base styles */
* {
  box-sizing: border-box;
}

:root {
  /* Color tokens */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-text-light: #9ca3af;
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-surface-hover: #f3f4f6;
  --color-border: #e5e7eb;
  --color-border-light: #f3f4f6;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Layout */
  --container-max: 1200px;
  --sidebar-width: 280px;
  --content-max: 768px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #3b82f6;
    --color-primary-hover: #2563eb;
    --color-text: #f9fafb;
    --color-text-muted: #d1d5db;
    --color-text-light: #9ca3af;
    --color-bg: #111827;
    --color-surface: #1f2937;
    --color-surface-hover: #374151;
    --color-border: #374151;
    --color-border-light: #4b5563;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
  }
}

/* Base elements */
html {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-bg);
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  margin: 0 0 var(--space-4) 0;
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-text);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }
h4 { font-size: var(--font-size-lg); }
h5 { font-size: var(--font-size-base); }
h6 { font-size: var(--font-size-sm); }

p {
  margin: 0 0 var(--space-4) 0;
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

/* Code styling */
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background-color: var(--color-surface);
  padding: var(--space-1) var(--space-2);
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

pre {
  font-family: var(--font-mono);
  background-color: var(--color-surface);
  padding: var(--space-4);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow-x: auto;
  margin: var(--space-4) 0;
}

pre code {
  background: none;
  padding: 0;
  border: none;
  font-size: var(--font-size-sm);
}

/* Layout components */
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-6) 0;
  margin-bottom: var(--space-8);
}

.header h1 {
  margin-bottom: var(--space-2);
  font-size: var(--font-size-4xl);
}

.version {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  background-color: var(--color-bg);
  padding: var(--space-1) var(--space-3);
  border-radius: 20px;
  border: 1px solid var(--color-border);
  display: inline-block;
  margin-bottom: var(--space-3);
}

.description {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  margin-bottom: 0;
}

/* Navigation */
.navigation {
  background-color: var(--color-surface);
  padding: var(--space-6);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-8);
}

.navigation h2 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-4);
  color: var(--color-text);
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.nav-item {
  display: block;
  padding: var(--space-4);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all var(--transition-fast);
  text-decoration: none;
}

.nav-item:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-primary);
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.nav-item h3 {
  margin-bottom: var(--space-2);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.nav-item p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Entity components */
.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-6);
  margin: var(--space-6) 0;
}

.entity-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-6);
  transition: all var(--transition-fast);
}

.entity-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.entity-card h4 {
  margin-bottom: var(--space-3);
  font-size: var(--font-size-lg);
}

.entity-card h4 a {
  color: var(--color-text);
}

.entity-card h4 a:hover {
  color: var(--color-primary);
}

.entity-type {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--color-primary);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: 4px;
  margin-bottom: var(--space-3);
}

.entity-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

/* Entity details */
.entity-details {
  max-width: var(--content-max);
  margin: 0 auto;
}

.entity-header {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.entity-name {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--space-2);
  font-weight: 700;
}

.entity-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.entity-source {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

/* JSDoc sections */
.jsdoc-section {
  margin: var(--space-8) 0;
}

.jsdoc-section h3 {
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-4);
  color: var(--color-text);
}

.param-table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-4) 0;
  background-color: var(--color-surface);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.param-table th {
  background-color: var(--color-bg);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.param-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
}

.param-table tr:last-child td {
  border-bottom: none;
}

.param-name {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-text);
}

.param-type {
  font-family: var(--font-mono);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
}

/* Source code display */
.source-code {
  font-family: var(--font-mono);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-4);
  overflow-x: auto;
  margin: var(--space-4) 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

/* Search functionality */
.search-container {
  position: relative;
  max-width: 300px;
  margin: var(--space-4) auto 0;
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  display: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background: var(--color-surface-hover);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-1);
}

.search-result-description {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
}

.search-result-type {
  font-size: 0.6875rem;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.source-code .line-number {
  color: var(--color-text-light);
  margin-right: var(--space-3);
  user-select: none;
}

/* README content */
.readme {
  max-width: var(--content-max);
  margin: var(--space-8) auto;
  line-height: 1.7;
}

.readme h1:first-child {
  margin-top: 0;
}

.readme img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.readme blockquote {
  border-left: 4px solid var(--color-primary);
  margin: var(--space-6) 0;
  padding: var(--space-4) var(--space-6);
  background-color: var(--color-surface);
  border-radius: 0 8px 8px 0;
}

.readme table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-6) 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.readme th, .readme td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

.readme th {
  background-color: var(--color-surface);
  font-weight: 600;
}

.readme tr:last-child td {
  border-bottom: none;
}

/* Utilities */
.text-center { text-align: center; }
.text-muted { color: var(--color-text-muted); }
.mb-0 { margin-bottom: 0; }
.mt-0 { margin-top: 0; }

/* Responsive design */
@media (max-width: 768px) {
  :root {
    --space-4: 0.75rem;
    --space-6: 1rem;
    --space-8: 1.5rem;
  }

  .container {
    padding: 0 var(--space-3);
  }

  .entity-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .nav-grid {
    grid-template-columns: 1fr;
  }

  .entity-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .header h1 {
    font-size: var(--font-size-3xl);
  }

  .entity-name {
    font-size: var(--font-size-3xl);
  }
}

@media (max-width: 480px) {
  .param-table {
    font-size: var(--font-size-xs);
  }

  .param-table th,
  .param-table td {
    padding: var(--space-2);
  }

  .entity-card {
    padding: var(--space-4);
  }

  .header {
    padding: var(--space-4) 0;
  }
}

/* Print styles */
@media print {
  .navigation {
    display: none;
  }

  .entity-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ccc;
  }

  a {
    color: inherit;
    text-decoration: underline;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-border: #000000;
    --shadow-sm: none;
    --shadow-md: none;
    --shadow-lg: none;
  }

  .entity-card,
  .nav-item {
    border-width: 2px;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .entity-card:hover,
  .nav-item:hover {
    transform: none;
  }
}`;
}
