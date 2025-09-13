#!/usr/bin/env node

import { execFile as execFileCb } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);

async function ensureCleanDist(distDir) {
	await fs.rm(distDir, { recursive: true, force: true });
	await fs.mkdir(distDir, { recursive: true });
}

async function findThemes(themesDir) {
	const entries = await fs.readdir(themesDir, { withFileTypes: true });
	return entries
		.filter((e) => e.isFile() && e.name.endsWith(".scss"))
		.map((e) => ({ name: e.name.replace(/\.scss$/i, ""), file: path.join(themesDir, e.name) }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

async function compileTheme(inputFile, outputFile) {
	const npx = process.platform === "win32" ? "npx.cmd" : "npx";
	await execFile(npx, ["sass", "--no-source-map", "--style=expanded", inputFile, outputFile], {
		timeout: 20000,
		maxBuffer: 16 * 1024 * 1024,
	});
}

async function main() {
	const root = process.cwd();
	const themesDir = path.resolve(root, "scss/themes");
	const distDir = path.resolve(root, "dist");

	await ensureCleanDist(distDir);
	const themes = await findThemes(themesDir);
	if (themes.length === 0) {
		console.error("No themes found in scss/themes.");
		process.exit(1);
	}

	for (const t of themes) {
		const out = path.join(distDir, `${t.name}.css`);
		console.log(`Building ${t.name}.css`);
		await compileTheme(t.file, out);
	}
	console.log(`✅ Built ${themes.length} theme(s) to ${distDir}`);
}

main().catch((err) => {
	console.error("Build failed:", err?.message || err);
	process.exit(1);
});
