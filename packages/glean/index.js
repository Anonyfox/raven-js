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
  extract <path> [--output]   Extract documentation graph to JSON
  render <input> <output>     Generate static docs from JSON graph
  build <path> <output>       Extract + render in one command

Options:
  --verbose, -v              Show detailed output
  --help, -h                 Show this help message

Examples:
  glean analyze .            Analyze current directory
  glean extract .            Extract graph to stdout
  glean extract . --output docs.json    Save graph to file
  glean render docs.json ./docs         Generate site from JSON
  glean build . ./docs      Extract and render in one step

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

// Export analyze command from dedicated module
export { runAnalyzeCommand } from "./lib/analyze.js";

/**
 * Run the extract command for graph generation
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runExtractCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");
	const outputFlag = args.findIndex(
		(arg) => arg === "--output" || arg === "-o",
	);
	const outputFile = outputFlag !== -1 ? args[outputFlag + 1] : null;
	const target =
		args.find((arg) => !arg.startsWith("-") && arg !== outputFile) || ".";

	console.log(`📊 Extracting documentation graph from: ${target}`);

	if (verbose && outputFile) {
		console.log(`📄 Output file: ${outputFile}`);
	}

	try {
		// Discover package structure
		const discovery = await discoverPackage(target);

		if (discovery.files.length === 0) {
			console.log("⚠️  No JavaScript files found in target directory");
			return;
		}

		if (verbose) {
			console.log(`📁 Found ${discovery.files.length} JavaScript files`);
			console.log(`📖 Found ${discovery.readmes.length} README files`);
		}

		// Extract documentation graph
		const graph = await extractDocumentationGraph(target, discovery);

		// Output results
		if (outputFile) {
			const { writeFile } = await import("node:fs/promises");
			await writeFile(outputFile, JSON.stringify(graph, null, 2));
			console.log(`✅ Documentation graph written to: ${outputFile}`);
		} else {
			console.log(JSON.stringify(graph, null, 2));
		}

		// Summary
		const entityCount = Object.keys(graph.entities).length;
		const moduleCount = Object.keys(graph.modules).length;
		console.log(`\n📈 Extraction Results:`);
		console.log(`   Package: ${graph.package.name} v${graph.package.version}`);
		console.log(`   Modules: ${moduleCount}`);
		console.log(`   Entities: ${entityCount}`);
		console.log(`   READMEs: ${Object.keys(graph.readmes).length}`);

		console.log(`\n🎉 Extraction complete!`);
	} catch (error) {
		throw new Error(`Extraction failed: ${error.message}`);
	}
}

/**
 * Run the render command for static site generation
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runRenderCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");
	const inputFile = args.find((arg) => !arg.startsWith("-"));
	const outputDir = args.find(
		(arg, index) => !arg.startsWith("-") && index > args.indexOf(inputFile),
	);

	if (!inputFile || !outputDir) {
		throw new Error("Usage: glean render <input.json> <output-dir>");
	}

	console.log(`🎨 Rendering documentation site from: ${inputFile}`);
	console.log(`📁 Output directory: ${outputDir}`);

	try {
		// Read JSON graph
		const { readFile } = await import("node:fs/promises");
		const graphContent = await readFile(inputFile, "utf-8");
		const graph = JSON.parse(graphContent);

		if (verbose) {
			console.log(
				`📊 Loaded graph with ${Object.keys(graph.entities).length} entities`,
			);
		}

		// Generate static site
		await generateStaticSite(graph, outputDir);

		console.log(`\n📈 Rendering Results:`);
		console.log(`   Package: ${graph.package.name} v${graph.package.version}`);
		console.log(
			`   Pages generated: ${Object.keys(graph.modules).length + Object.keys(graph.entities).length + 1}`,
		);
		console.log(`   Output: ${outputDir}`);

		console.log(`\n🎉 Rendering complete!`);
	} catch (error) {
		throw new Error(`Rendering failed: ${error.message}`);
	}
}

/**
 * Run the build command for extract + render
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runBuildCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");
	const sourceDir = args.find((arg) => !arg.startsWith("-"));
	const outputDir = args.find(
		(arg, index) => !arg.startsWith("-") && index > args.indexOf(sourceDir),
	);

	if (!sourceDir || !outputDir) {
		throw new Error("Usage: glean build <source-dir> <output-dir>");
	}

	console.log(`🏗️ Building documentation from: ${sourceDir}`);
	console.log(`📁 Output directory: ${outputDir}`);

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
		await generateStaticSite(graph, outputDir);

		console.log(`\n📈 Build Results:`);
		console.log(`   Package: ${graph.package.name} v${graph.package.version}`);
		console.log(`   Modules: ${Object.keys(graph.modules).length}`);
		console.log(`   Entities: ${Object.keys(graph.entities).length}`);
		console.log(
			`   Pages: ${Object.keys(graph.modules).length + Object.keys(graph.entities).length + 1}`,
		);
		console.log(`   Output: ${outputDir}`);

		console.log(`\n🎉 Build complete!`);
	} catch (error) {
		throw new Error(`Build failed: ${error.message}`);
	}
}
