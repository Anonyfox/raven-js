/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Glean - Documentation archaeology for modern JavaScript codebases
 *
 * Ravens glean fields after harvest, gathering valuable scattered resources
 * others missed. Glean does the same with JSDoc comments scattered throughout
 * your codebase, collecting and organizing documentation knowledge into
 * beautiful, validated, comprehensive docs.
 *
 * Pure lib2 implementation with zero external dependencies and surgical precision.
 */

// Import lib2 functionality
import { runAnalyzeCommand } from "./lib/analyze.js";
import { startDocumentationServer } from "./lib/server/index.js";
import { generateStaticSite } from "./lib/static-generate.js";

/**
 * Get the current version of Glean
 * @returns {string} The current version
 */
export function getVersion() {
	return "0.4.8";
}

/**
 * Display the Glean banner
 */
export function showBanner() {
	console.log(`
🔍 Glean - Documentation Archaeology v${getVersion()}
   Gathering scattered JSDoc treasures with raven precision
`);
}

/**
 * Show help information for CLI usage
 */
export function showHelp() {
	console.log(`
Usage: glean <command> [options]

Commands:
  validate <path>             Validate JSDoc quality and report issues
  ssg <path> <output>         Generate static documentation site
  server [path]               Start live documentation server

Options:
  --domain <domain>          Domain for SEO tags (e.g. --domain example.com)
  --port <port>              Port for server command (default: 3000)
  --verbose, -v              Show detailed output
  --help, -h                 Show this help message

Examples:
  glean validate .                             Validate current directory
  glean ssg . ./docs                          Generate static documentation site
  glean ssg . ./docs --domain example.com     Generate with custom domain
  glean ssg . ./docs --base /myproject/        Generate with base path for subdirectory deployment
  glean server                                 Start server for current directory
  glean server ./my-project --port 8080       Start server on custom port

Documentation: https://ravenjs.dev/packages/glean
`);
}

/**
 * Run the validate command (renamed from analyze for clarity)
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runValidateCommand(args) {
	return runAnalyzeCommand(args);
}

/**
 * Run the ssg (static site generation) command using lib2
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runSsgCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");

	// Parse domain flag
	const domainIndex = args.indexOf("--domain");
	const domain =
		domainIndex !== -1 && args[domainIndex + 1] ? args[domainIndex + 1] : null;

	// Parse base path flag
	const baseIndex = args.indexOf("--base");
	const basePath =
		baseIndex !== -1 && args[baseIndex + 1] ? args[baseIndex + 1] : "/";

	const sourceDir = args.find((arg) => !arg.startsWith("-"));
	const outputDir = args.find(
		(arg, index) => !arg.startsWith("-") && index > args.indexOf(sourceDir),
	);

	if (!sourceDir || !outputDir) {
		throw new Error("Usage: glean ssg <source-dir> <output-dir>");
	}

	console.log(`🚀 Generating static documentation site...`);
	console.log(`📦 Source package: ${sourceDir}`);
	console.log(`📁 Output directory: ${outputDir}`);
	if (domain) {
		console.log(`🌐 Using domain for SEO: ${domain}`);
	}
	if (basePath !== "/") {
		console.log(`📍 Using base path: ${basePath}`);
	}

	try {
		// Generate static site using lib2
		const stats = await generateStaticSite(sourceDir, outputDir, {
			domain,
			basePath,
		});

		console.log(`\n📊 Generation Results:`);
		console.log(`   Files generated: ${stats.totalFiles}`);
		console.log(`   Total size: ${Math.round(stats.totalBytes / 1024)}KB`);
		console.log(`   Generated at: ${stats.generatedAt}`);
		console.log(`   Output: ${outputDir}`);

		console.log(`\n🎉 Static site generation complete!`);
		if (verbose) {
			console.log(
				`💡 Deploy the '${outputDir}' folder to any static hosting service`,
			);
		}
	} catch (error) {
		throw new Error(`Static site generation failed: ${error.message}`);
	}
}

/**
 * Run the server command for live documentation serving
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runServerCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");

	// Parse domain flag
	const domainIndex = args.indexOf("--domain");
	const domain =
		domainIndex !== -1 && args[domainIndex + 1] ? args[domainIndex + 1] : null;

	// Parse port flag
	const portIndex = args.indexOf("--port");
	const port =
		portIndex !== -1 && args[portIndex + 1]
			? parseInt(args[portIndex + 1], 10)
			: 3000;

	if (Number.isNaN(port) || port < 1 || port > 65535) {
		throw new Error("Port must be a valid number between 1 and 65535");
	}

	const packagePath = args.find((arg) => !arg.startsWith("-")) || ".";

	console.log(`🚀 Starting documentation server...`);
	console.log(`📦 Package: ${packagePath}`);
	console.log(`🌐 Port: ${port}`);
	if (domain) {
		console.log(`🔗 Domain: ${domain}`);
	}

	try {
		// Start server using lib2
		await startDocumentationServer(packagePath, {
			port,
			host: "localhost",
			domain,
			enableLogging: verbose,
		});
	} catch (error) {
		throw new Error(`Server failed to start: ${error.message}`);
	}
}

export { discover } from "./lib/discover/index.js";
export { extract } from "./lib/extract/index.js";
// Export lib2 core functionality for programmatic use
export {
	createDocumentationServer,
	startDocumentationServer,
} from "./lib/server/index.js";
export { generateStaticSite } from "./lib/static-generate.js";
export { validate } from "./lib/validate.js";
