/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Glean - Documentation archaeology for modern JavaScript codebases.
 *
 * Ravens glean fields after harvest, gathering valuable scattered resources
 * others missed. Glean does the same with JSDoc comments scattered throughout
 * your codebase, collecting and organizing documentation knowledge into
 * beautiful, validated, comprehensive docs.
 *
 * Core functionality for parsing, validating, and generating documentation
 * from JSDoc comments with surgical precision and zero dependencies.
 */

import { discoverPackage } from "./lib/discovery/index.js";
import { extractDocumentationGraph } from "./lib/extraction/index.js";
import { generateStaticSite } from "./lib/rendering/index.js";

/**
 * Get the current version of Glean
 * @returns {string} The current version
 */
export function getVersion() {
	return "0.1.0";
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
  analyze <path>              Validate JSDoc quality and report issues
  build <path> <output>       Generate documentation site
  server [path]               Start live documentation server

Options:
  --domain <domain>          Domain for SEO tags (e.g. --domain example.com)
  --port <port>              Port for server command (default: 3000)
  --verbose, -v              Show detailed output
  --help, -h                 Show this help message

Examples:
  glean analyze .                              Analyze current directory
  glean build . ./docs                        Generate documentation site
  glean build . ./docs --domain example.com   Build with custom domain
  glean server                                 Start server for current directory
  glean server ./my-project --port 8080       Start server on custom port

Documentation: https://ravenjs.dev/packages/glean
`);
}

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {{target: string, format: string, validate: boolean, verbose: boolean}} Parsed arguments object
 */
export function parseArguments(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");
	const nonFlagArgs = args.filter((arg) => !arg.startsWith("-"));

	return {
		target: nonFlagArgs[0] || ".",
		format: "html",
		validate: true,
		verbose,
	};
}

/**
 * Process a codebase for JSDoc analysis
 * @param {{target: string, format: string, validate: boolean, verbose: boolean}} options - Processing options
 * @returns {Promise<void>}
 */
export async function processCodebase(options) {
	console.log(`🔍 Gleaning documentation from: ${options.target}`);

	if (options.verbose) {
		console.log("📋 Options:", options);
	}

	// TODO: Implement actual JSDoc parsing and validation
	console.log("📝 JSDoc parsing - Coming soon...");
	console.log("✅ Documentation generation - Coming soon...");
	console.log("🎉 Glean complete!");
}

// Export analyze command from lib2 (superior validation)
export { runAnalyzeCommand } from "./lib2/analyze.js";

// Export server functionality
export {
	createDocumentationServer,
	startDocumentationServer,
} from "./lib2/server/index.js";

/**
 * Run the build command for extract + render
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runBuildCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");

	// Parse domain flag
	const domainIndex = args.indexOf("--domain");
	const domain =
		domainIndex !== -1 && args[domainIndex + 1] ? args[domainIndex + 1] : null;

	const sourceDir = args.find((arg) => !arg.startsWith("-"));
	const outputDir = args.find(
		(arg, index) => !arg.startsWith("-") && index > args.indexOf(sourceDir),
	);

	if (!sourceDir || !outputDir) {
		throw new Error("Usage: glean build <source-dir> <output-dir>");
	}

	console.log(`🏗️ Building documentation from: ${sourceDir}`);
	console.log(`📁 Output directory: ${outputDir}`);
	if (domain) {
		console.log(`🌐 Using domain for SEO: ${domain}`);
	}

	try {
		// Extract graph
		const discovery = await discoverPackage(sourceDir);

		if (discovery.files.length === 0) {
			console.log("⚠️  No JavaScript files found in source directory");
			return;
		}

		if (verbose) {
			console.log(`📁 Found ${discovery.files.length} JavaScript files`);
			console.log(`📖 Found ${discovery.readmes.length} README files`);
		}

		const graph = await extractDocumentationGraph(sourceDir, discovery);

		// Generate static site
		await generateStaticSite(graph, outputDir, { domain });

		console.log(`\n📈 Build Results:`);
		console.log(`   Package: ${graph.package.name} v${graph.package.version}`);
		console.log(`   Modules: ${graph.modules.size}`);
		console.log(`   Entities: ${graph.entities.size}`);
		console.log(`   Pages: ${graph.modules.size + graph.entities.size + 1}`);
		console.log(`   Output: ${outputDir}`);

		console.log(`\n🎉 Build complete!`);
	} catch (error) {
		throw new Error(`Build failed: ${error.message}`);
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

	// Parse target directory (first non-flag argument)
	const targetDir = args.find((arg) => !arg.startsWith("-")) || ".";

	console.log(`🚀 Starting documentation server...`);
	console.log(`📁 Target directory: ${targetDir}`);
	console.log(`🌐 Port: ${port}`);
	if (domain) {
		console.log(`🌍 Domain: ${domain}`);
	}

	try {
		// Import server functions
		const { startDocumentationServer } = await import("./lib2/server/index.js");

		// Start the documentation server
		await startDocumentationServer(targetDir, {
			port,
			domain,
			enableLogging: verbose,
		});

		console.log(`\n🎉 Documentation server running!`);
		console.log(`📖 Open: http://localhost:${port}`);
		if (domain) {
			console.log(`🌐 Production: https://${domain}`);
		}
		console.log(`\n⏹️  Press Ctrl+C to stop server\n`);

		// Keep the process alive
		process.on("SIGINT", () => {
			console.log("\n👋 Shutting down documentation server...");
			process.exit(0);
		});
	} catch (error) {
		throw new Error(`Server failed to start: ${error.message}`);
	}
}
