import fs from "node:fs";
import path from "node:path";

// this script performs all steps to build up the official docs website including
// the individual packages' jsdoc pages as well as context blobs for the LLMs

import { execSync } from "node:child_process";

// this is the outer website, will also rm-rf the docs folder to make sure we have a clean slate
execSync("npm run build -w apps/ravenjs-docs", { stdio: "inherit" });

// create the JSDoc pages and contexts for all packages
execSync("npm run predeploy --workspaces --if-present", { stdio: "inherit" });

// fuse all the individual package contexts into a single json file for easier access
const files = fs
	.readdirSync("docs")
	.filter((file) => file.endsWith(".context.json"));
const ctx = /** @type {Object<String, any>} */ ({});
for (const file of files) {
	const key = file.replace(".context.json", "");
	ctx[key] = JSON.parse(fs.readFileSync(path.join("docs", file), "utf-8"));
}
fs.writeFileSync("docs/context.json", JSON.stringify(ctx));
