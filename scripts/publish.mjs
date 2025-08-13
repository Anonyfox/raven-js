import { execSync } from "node:child_process";

// Check if we're on a version tag
const currentTag = execSync(
	'git describe --tags --exact-match 2>/dev/null || echo ""',
	{ encoding: "utf8" },
).trim();

if (!currentTag.startsWith("v")) {
	console.log("Not on a version tag, skipping publish");
	process.exit(0);
}

const version = currentTag.slice(1);
console.log(`Publishing version ${version}`);

// Verify all tests pass
console.log("Running tests...");
execSync("npm test", { stdio: "inherit" });

// Verify linting passes
console.log("Running linting...");
execSync("npm run lint", { stdio: "inherit" });

// Generate complete documentation
console.log("Generating complete documentation...");
execSync("npm run gen:all", { stdio: "inherit" });

// Publish all packages
const packages = ["packages/beak"];
for (const pkgPath of packages) {
	console.log(`Publishing ${pkgPath}...`);
	execSync(`cd ${pkgPath} && npm publish --access public`, {
		stdio: "inherit",
	});
}

console.log(`✅ Successfully published version ${version}`);
