/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Central routing configuration - clean route registration only
 */

import { execFile as execFileCb } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { markdownToHTML } from "@raven-js/beak";
import { Router } from "@raven-js/wings";
import { registerFileRoutes } from "@raven-js/wings/file-routes";
import { Assets } from "@raven-js/wings/server";
import { Layout } from "../src/components/layout.js";

/** @typedef {{ title: string|Function, description: string|Function, body: string|Function }} PageModule */

const router = new Router();

const execFile = promisify(execFileCb);
const cssCache = new Map();

function isValidThemeName(name) {
	return /^[A-Za-z0-9_-]+$/.test(name);
}

async function getThemeNames() {
	const themesDir = path.resolve(process.cwd(), "scss/themes");
	const entries = await fs.readdir(themesDir, { withFileTypes: true });
	return entries
		.filter((e) => e.isFile() && e.name.endsWith(".scss"))
		.map((e) => e.name.replace(/\.scss$/i, ""))
		.sort();
}

async function getMtime(filePath) {
	try {
		const stat = await fs.stat(filePath);
		return stat.mtimeMs;
	} catch {
		return 0;
	}
}

function sendCss(ctx, css, status = 200) {
	const body = css || "";
	ctx.responseStatusCode = status;
	ctx.responseHeaders.set("Content-Type", "text/css; charset=utf-8");
	ctx.responseHeaders.set("Cache-Control", "no-store, max-age=0");
	ctx.responseBody = body;
	ctx.responseHeaders.set("Content-Length", Buffer.byteLength(body).toString());
}

router.get("/dev/theme/:name.css", async (ctx) => {
	const params = /** @type {Record<string,string>} */ (ctx.pathParams || {});
	let rawName = params.name ?? params["name.css"] ?? Object.values(params)[0] ?? "";
	if (!rawName) {
		const pathStr = String(ctx.path || "");
		const idx = pathStr.indexOf("/dev/theme/");
		if (idx >= 0) {
			rawName = pathStr.slice(idx + "/dev/theme/".length).split("?")[0];
		}
	}
	const name = String(rawName).replace(/\.css$/i, "");
	if (!isValidThemeName(name)) {
		sendCss(ctx, "/* Invalid theme name */", 400);
		return;
	}

	const entry = path.resolve(process.cwd(), "scss/themes", `${name}.scss`);
	try {
		await fs.access(entry);
	} catch {
		sendCss(ctx, `/* Theme not found: ${name} */`, 404);
		return;
	}

	const bootstrapPath = path.resolve(process.cwd(), "scss/bootstrap.scss");
	const entryMtime = await getMtime(entry);
	const bootMtime = await getMtime(bootstrapPath);
	const sassVersion = "dart-sass-npx";
	const cacheKey = `${name}:${entryMtime}:${bootMtime}:${sassVersion}`;

	let cached = cssCache.get(cacheKey);
	if (!cached) {
		try {
			const { stdout } = await execFile(
				process.platform === "win32" ? "npx.cmd" : "npx",
				["sass", "--no-source-map", "--style=expanded", entry],
				{ timeout: 3000, maxBuffer: 10 * 1024 * 1024 }
			);
			const etag = createHash("sha256").update(stdout).digest("hex");
			cached = { css: stdout, etag, key: cacheKey };
			cssCache.clear();
			cssCache.set(cacheKey, cached);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			sendCss(ctx, `/* Sass compile error: ${msg.replaceAll("*/", "* /")} */`, 500);
			return;
		}
	}

	ctx.responseHeaders.set("ETag", cached.etag);
	sendCss(ctx, cached.css, 200);
});

async function setupRoutes() {
	router.use(new Assets({ assetsDir: "./public" }));

	const routes = await registerFileRoutes(router, "src/pages", {
		baseDir: process.cwd(),
		indexFile: "index.js",
		includeNested: true,
		handler: async (ctx, route) => {
			/** @type {PageModule} */
			const pageModule = await import(route.module);
			const themes = await getThemeNames();
			const queryTheme = ctx.queryParams.get("theme") || "default";
			const activeTheme = themes.includes(queryTheme) ? queryTheme : themes[0] || "default";
			const title =
				typeof pageModule.title === "function" ? await pageModule.title({}) : pageModule.title;
			const description =
				typeof pageModule.description === "function"
					? await pageModule.description({})
					: pageModule.description;
			const body =
				typeof pageModule.body === "function" ? await pageModule.body({}) : pageModule.body;
			const content = markdownToHTML(body);
			const page = Layout({ title, description, content, themes, activeTheme });
			ctx.html(page);
		},
	});
	console.log(`🔍 Discovered ${routes.length} routes`);
}

await setupRoutes();

export { router };
