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

execSync(`rm -rf ${docsPath}`);

const flags = [];
flags.push("--tsconfig ./jsconfig.json");
flags.push(`--out ${docsPath}`);
flags.push("--skipErrorChecking");
flags.push('--customFooterHtml "<a href="/">View all RavenJS packages</a>"');

execSync(`typedoc ${flags.join(" ")} ${entryPoints}`);

execSync(`cp ../../media/favicon.ico ${docsPath}/favicon.ico`);
