/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

// Import all validation functions

import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import {
	GetAllFilePaths,
	PackageJsonListWorkspacePackages,
} from "../queries/index.js";
import { HasProperBiomeSetup } from "./dev-tooling/index.js";
import { HasValidStructure as FolderHasValidStructure } from "./folder/index.js";
import { IsNpmPackage } from "./is-npm-package.js";
import {
	HasValidJSDocHeaders,
	HasValidTestFile,
	shouldHaveJSDocHeader,
	shouldHaveTestFile,
} from "./js-file/index.js";
import { HasMinimalSettings } from "./jsconfig-json/index.js";
import {
	HasProperFilesField,
	HasValidAuthor,
	HasValidBugs,
	HasValidEngines,
	HasValidFunding,
	HasValidHomepage,
	HasValidLicense,
	HasValidName,
	HasValidPublishConfig,
	HasValidRepository,
	HasValidScripts,
	HasValidSemver,
	HasValidType,
	IsWorkspace,
	HasValidStructure as PackageJsonHasValidStructure,
} from "./package-json/index.js";

/**
 *
 */

/**
 * @typedef {Object} PackageValidationResult
 * @property {string} packagePath - Path to the package
 * @property {string} packageName - Name of the package
 * @property {Object[]} checks - Individual validation results
 * @property {boolean} passed - Whether all checks passed
 */

/**
 * @typedef {Object} ValidationResult
 * @property {PackageValidationResult[]} packages - Results for each package
 * @property {boolean} passed - Whether overall validation passed
 */

/**
 * Runs a validation function and returns a check result instead of throwing
 * @param {string} name - Name of the validation check
 * @param {Function} validationFn - Validation function to run
 * @returns {Object} Check result
 */
const runCheck = (name, validationFn) => {
	try {
		validationFn();
		return { name, passed: true };
	} catch (error) {
		return {
			name,
			passed: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
};

/**
 * Gets package name from package.json, fallback to directory name
 * @param {string} packagePath - Path to the package
 * @returns {string} Package name
 */
const getPackageName = (packagePath) => {
	try {
		const packageJsonPath = join(packagePath, "package.json");
		const packageJsonContent = readFileSync(packageJsonPath, "utf8");
		const packageData = JSON.parse(packageJsonContent);
		return packageData.name || basename(packagePath);
	} catch {
		return basename(packagePath);
	}
};

/**
 * Console colors for output formatting
 */
const colors = {
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
};

/**
 * Displays validation results with colored output
 * @param {ValidationResult} results - The validation results to display
 */
const displayResults = (results) => {
	console.log(`\n${colors.bold}📋 Validation Results${colors.reset}\n`);

	for (const packageResult of results.packages) {
		const statusIcon = packageResult.passed ? "✅" : "❌";

		console.log(
			`${statusIcon} ${colors.bold}${packageResult.packageName}${colors.reset} (${packageResult.packagePath})`,
		);

		for (const check of packageResult.checks) {
			const checkIcon = /** @type {any} */ (check).passed ? "  ✓" : "  ✗";
			const checkColor = /** @type {any} */ (check).passed
				? colors.green
				: colors.red;
			const errorMsg = /** @type {any} */ (check).error
				? ` - ${/** @type {any} */ (check).error}`
				: "";

			console.log(
				`${checkColor}${checkIcon} ${/** @type {any} */ (check).name}${errorMsg}${colors.reset}`,
			);
		}
		console.log(); // Empty line between packages
	}

	// Summary
	const totalPackages = results.packages.length;
	const passedPackages = results.packages.filter((pkg) => pkg.passed).length;
	const failedPackages = totalPackages - passedPackages;

	const summaryColor = results.passed ? colors.green : colors.red;
	const summaryIcon = results.passed ? "🎉" : "💥";

	console.log(
		`${colors.bold}${summaryColor}${summaryIcon} Summary:${colors.reset}`,
	);
	console.log(
		`${colors.green}✓ Passed: ${passedPackages} packages${colors.reset}`,
	);
	if (failedPackages > 0) {
		console.log(
			`${colors.red}✗ Failed: ${failedPackages} packages${colors.reset}`,
		);
	}
	console.log();
};

/**
 * Validates a workspace root by running validation rules appropriate for workspace roots.
 * Collects all validation results instead of throwing on first error.
 * @param {string} workspacePath - The path to the workspace root directory
 * @returns {PackageValidationResult} Validation results for the workspace root
 */
export const validateWorkspaceRoot = (workspacePath) => {
	if (typeof workspacePath !== "string" || workspacePath === "") {
		throw new Error("Workspace path must be a non-empty string");
	}

	const packageName = getPackageName(workspacePath);
	const checks = [];

	// 1. Basic existence check (fastest)
	checks.push(
		runCheck("npm package exists", () => {
			if (!IsNpmPackage(workspacePath)) {
				throw new Error(
					`Path ${workspacePath} is not a valid npm package (missing package.json)`,
				);
			}
		}),
	);

	// 2. Package.json validation (simple to complex)
	checks.push(
		runCheck("package.json structure", () =>
			PackageJsonHasValidStructure(workspacePath),
		),
	);
	checks.push(runCheck("valid name", () => HasValidName(workspacePath)));
	checks.push(runCheck("valid semver", () => HasValidSemver(workspacePath)));
	checks.push(runCheck("valid type", () => HasValidType(workspacePath)));
	checks.push(runCheck("valid license", () => HasValidLicense(workspacePath)));
	checks.push(runCheck("valid author", () => HasValidAuthor(workspacePath)));
	checks.push(
		runCheck("valid homepage", () => HasValidHomepage(workspacePath)),
	);
	checks.push(
		runCheck("valid repository", () => HasValidRepository(workspacePath)),
	);
	checks.push(runCheck("valid bugs", () => HasValidBugs(workspacePath)));
	checks.push(runCheck("valid engines", () => HasValidEngines(workspacePath)));

	// 3. Folder/file structure validation
	checks.push(
		runCheck("folder structure", () => FolderHasValidStructure(workspacePath)),
	);
	checks.push(
		runCheck("jsconfig.json settings", () => HasMinimalSettings(workspacePath)),
	);
	checks.push(
		runCheck("biome dev tooling setup", () =>
			HasProperBiomeSetup(workspacePath),
		),
	);

	const passed = checks.every(
		(/** @type {any} */ check) => /** @type {any} */ (check).passed,
	);

	return {
		packagePath: workspacePath,
		packageName,
		checks,
		passed,
	};
};

/**
 * Validates test files for all JavaScript files in a package
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if all JS files have tests, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
const validateTestFiles = (packagePath) => {
	const allFilePaths = GetAllFilePaths(packagePath);
	const jsFiles = allFilePaths
		.map((relativePath) => join(packagePath, relativePath))
		.filter(shouldHaveTestFile);

	const errors = [];

	for (const jsFile of jsFiles) {
		try {
			HasValidTestFile(jsFile);
		} catch (error) {
			const relativePath = jsFile.replace(`${packagePath}/`, "");
			errors.push(
				`${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	if (errors.length > 0) {
		throw new Error(
			`Missing test files in ${packagePath}:\\n${errors.join("\\n")}`,
		);
	}

	return true;
};

/**
 * Validates JSDoc headers for all JavaScript files in a package
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if all JS files have valid JSDoc headers, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
const validateJSDocHeaders = (packagePath) => {
	const allFilePaths = GetAllFilePaths(packagePath);
	const jsFiles = allFilePaths
		.map((relativePath) => join(packagePath, relativePath))
		.filter(shouldHaveJSDocHeader);

	const errors = [];

	for (const jsFile of jsFiles) {
		try {
			HasValidJSDocHeaders(jsFile);
		} catch (error) {
			const relativePath = jsFile.replace(`${packagePath}/`, "");
			errors.push(
				`${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	if (errors.length > 0) {
		throw new Error(
			`Invalid JSDoc headers in ${packagePath}:\\n${errors.join("\\n")}`,
		);
	}

	return true;
};

/**
 * Validates a package by running all validation rules in a logical order.
 * Collects all validation results instead of throwing on first error.
 * @param {string} packagePath - The path to the package directory
 * @returns {PackageValidationResult} Validation results for the package
 */
export const validatePackage = (packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		throw new Error("Package path must be a non-empty string");
	}

	const packageName = getPackageName(packagePath);
	const checks = [];

	// 1. Basic existence check (fastest)
	checks.push(
		runCheck("npm package exists", () => {
			if (!IsNpmPackage(packagePath)) {
				throw new Error(
					`Path ${packagePath} is not a valid npm package (missing package.json)`,
				);
			}
		}),
	);

	// 2. Package.json validation (simple to complex)
	checks.push(
		runCheck("package.json structure", () =>
			PackageJsonHasValidStructure(packagePath),
		),
	);
	checks.push(runCheck("valid name", () => HasValidName(packagePath)));
	checks.push(runCheck("valid semver", () => HasValidSemver(packagePath)));
	checks.push(runCheck("valid type", () => HasValidType(packagePath)));
	checks.push(runCheck("valid license", () => HasValidLicense(packagePath)));
	checks.push(runCheck("valid author", () => HasValidAuthor(packagePath)));
	checks.push(runCheck("valid homepage", () => HasValidHomepage(packagePath)));
	checks.push(
		runCheck("valid repository", () => HasValidRepository(packagePath)),
	);
	checks.push(runCheck("valid bugs", () => HasValidBugs(packagePath)));
	checks.push(runCheck("valid engines", () => HasValidEngines(packagePath)));
	checks.push(runCheck("valid funding", () => HasValidFunding(packagePath)));
	checks.push(
		runCheck("valid publish config", () => HasValidPublishConfig(packagePath)),
	);
	checks.push(runCheck("valid scripts", () => HasValidScripts(packagePath)));

	// Files field validation
	checks.push(
		runCheck("package.json files field", () =>
			HasProperFilesField(packagePath),
		),
	);

	// 3. Folder/file structure validation
	checks.push(
		runCheck("folder structure", () => FolderHasValidStructure(packagePath)),
	);
	checks.push(
		runCheck("jsconfig.json settings", () => HasMinimalSettings(packagePath)),
	);
	checks.push(runCheck("test files", () => validateTestFiles(packagePath)));
	checks.push(
		runCheck("JSDoc headers", () => validateJSDocHeaders(packagePath)),
	);

	const passed = checks.every(
		(/** @type {any} */ check) => /** @type {any} */ (check).passed,
	);

	return {
		packagePath,
		packageName,
		checks,
		passed,
	};
};

/**
 * Validates a package or workspace by running all validation rules.
 * For workspaces, validates all packages including the root.
 * Collects all results and displays comprehensive report.
 * @param {string} path - The path to the package or workspace directory
 * @param {boolean} [displayOutput=true] - Whether to display colored output
 * @returns {ValidationResult} Complete validation results
 */
export const validate = (path, displayOutput = true) => {
	if (typeof path !== "string" || path === "") {
		throw new Error("Path must be a non-empty string");
	}

	const packages = [];

	// Check if this is a workspace
	if (IsWorkspace(path)) {
		// Validate workspace root first
		packages.push(validateWorkspaceRoot(path));

		// Get all workspace packages and validate each
		const packagePaths = PackageJsonListWorkspacePackages(path);
		for (const relativePath of packagePaths) {
			const fullPath = `${path}/${relativePath}`;
			packages.push(validatePackage(fullPath));
		}
	} else {
		// Single package validation
		packages.push(validatePackage(path));
	}

	const result = {
		packages,
		passed: packages.every((pkg) => pkg.passed),
	};

	if (displayOutput) {
		displayResults(result);
	}

	return result;
};

// Export workspace utility functions
export { IsWorkspace };
export { PackageJsonListWorkspacePackages as ListWorkspacePackages } from "../queries/index.js";
