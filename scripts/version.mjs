import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const versionType = args[0]; // 'major', 'minor', 'patch'

if (!["major", "minor", "patch"].includes(versionType)) {
	console.error("Usage: node scripts/version.mjs [major|minor|patch]");
	process.exit(1);
}

// Get current version from root package.json
const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
const currentVersion = rootPackage.version;

// Calculate new version
const [major, minor, patch] = currentVersion.split(".").map(Number);
let newVersion;

switch (versionType) {
	case "major":
		newVersion = `${major + 1}.0.0`;
		break;
	case "minor":
		newVersion = `${major}.${minor + 1}.0`;
		break;
	case "patch":
		newVersion = `${major}.${minor}.${patch + 1}`;
		break;
}

console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

// Update all package.json files
const packages = ["packages/beak"];
for (const pkgPath of packages) {
	const pkgFile = join(pkgPath, "package.json");
	const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
	pkg.version = newVersion;
	writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
	console.log(`Updated ${pkgFile}`);
}

// Update root package.json
rootPackage.version = newVersion;
writeFileSync("package.json", `${JSON.stringify(rootPackage, null, 2)}\n`);

// Create git tag
execSync("git add .");
execSync(`git commit -m "chore: bump version to ${newVersion}"`);
execSync(`git tag v${newVersion}`);

console.log(`✅ Version bumped to ${newVersion}`);
console.log(`✅ Git tag v${newVersion} created`);
execSync("git push origin main", { stdio: "inherit" });
execSync(`git push origin v${newVersion}`, { stdio: "inherit" });
