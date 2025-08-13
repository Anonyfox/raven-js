// small utility script to get a blob for copypasting into LLM chats

import fs from "node:fs";
import path from "node:path";

const targetPath = path.resolve(process.cwd(), process.argv[2]);

/** @type {Object<string, string>} */
const data = {};

/**
 * Reads all files in a directory and its subdirectories.
 * @param {string} dir - The directory to read.
 */
function readFilesRecursively(dir) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const relativePath = path.relative(targetPath, fullPath);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			readFilesRecursively(fullPath);
		} else {
			data[relativePath] = fs.readFileSync(fullPath, "utf-8");
		}
	}
}
readFilesRecursively(targetPath);

console.log(JSON.stringify(data));
