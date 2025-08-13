// generate a minimally effective context blob that can be used for LLMs

import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const readme = fs.readFileSync("./README.md", "utf-8");

const ctx = {
	name: packageJson.name,
	version: packageJson.version,
	exports: packageJson.exports ? packageJson.exports : packageJson.main,
	readme,
};

// Create docs directory if it doesn't exist
const docsDir = "../../docs";
if (!fs.existsSync(docsDir)) {
	fs.mkdirSync(docsDir, { recursive: true });
}

const docsPath = `${docsDir}/${packageJson.name.split("/")[1]}.context.json`;
fs.writeFileSync(docsPath, JSON.stringify(ctx, null, 2));
console.log(`✅ Generated context for ${packageJson.name.split("/")[1]}`);
