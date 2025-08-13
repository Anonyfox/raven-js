// this script generates the documentation for the package and keeps the
// package.json script more readable and clean

import { execSync } from "node:child_process";
import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const packageName = packageJson.name.split("/")[1];
const docsPath = `../../docs/${packageName}`;
const entryPoints = packageJson.exports
	? Object.values(packageJson.exports)
			.map((entry) => entry.import)
			.join(" ")
	: packageJson.main;

// Create docs directory if it doesn't exist
execSync("mkdir -p ../../docs");

// Clean and recreate package docs
execSync(`rm -rf ${docsPath}`);
execSync(`mkdir -p ${docsPath}`);

const flags = [];
flags.push("--tsconfig ./jsconfig.json");
flags.push(`--out ${docsPath}`);
flags.push("--skipErrorChecking");
flags.push(
	'--customFooterHtml "<a href=\\"/\\">View all RavenJS packages</a>"',
);
flags.push("--name", `@raven-js/${packageName}`);

execSync(`typedoc ${flags.join(" ")} ${entryPoints}`);

// Copy favicon
execSync(`cp ../../media/favicon.ico ${docsPath}/favicon.ico`);

console.log(`✅ Generated documentation for ${packageName}`);
