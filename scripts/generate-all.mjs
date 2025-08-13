import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { renderLandingPage } from "./render-landingpage.mjs";

console.log("🦅 Generating complete RavenJS documentation...");

// Clean docs directory
console.log("📁 Cleaning docs directory...");
execSync("rm -rf docs", { stdio: "inherit" });
execSync("mkdir -p docs", { stdio: "inherit" });

// Generate TypeDoc documentation for all packages
console.log("📚 Generating TypeDoc documentation...");
execSync("npm run predeploy --workspaces --if-present", { stdio: "inherit" });

// Generate context files for all packages
console.log("📄 Generating context files...");
execSync("npm run gen:context --workspaces --if-present", { stdio: "inherit" });

// Aggregate context files
console.log("🔗 Aggregating context files...");
const files = execSync("find docs -name '*.context.json'", { encoding: "utf8" })
	.trim()
	.split("\n")
	.filter(Boolean);

/** @type {Record<string, any>} */
const ctx = {};
for (const file of files) {
	const key = file.split("/").pop()?.replace(".context.json", "") || "";
	ctx[key] = JSON.parse(readFileSync(file, "utf-8"));
}
writeFileSync("docs/context.json", JSON.stringify(ctx, null, 2));

// Generate landing page
console.log("🏠 Generating landing page...");
const indexHtml = await renderLandingPage();
writeFileSync("docs/index.html", indexHtml);

// Add CNAME for custom domain
console.log("🌐 Adding CNAME file...");
writeFileSync("docs/CNAME", "docs.ravenjs.dev");

// Add license info
console.log("📜 Adding license info...");
writeFileSync(
	"docs/LICENSE",
	"MIT License - Copyright (c) 2025 Anonyfox e.K.\nThis documentation is licensed under the MIT License.",
);

console.log("✅ Complete documentation generated successfully!");
