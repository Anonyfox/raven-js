/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Content integration for README and documentation files.
 *
 * Surgical extraction of README content with asset reference tracking
 * and directory mapping for comprehensive documentation coverage.
 */

import { readFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { ReadmeContentEntity } from "../models/readme-content-entity.js";
import { generateReadmeId } from "./id-generators.js";

/**
 * Extract README data and content
 * @param {string} readmePath - Path to README file
 * @param {string} packagePath - Package root path
 * @returns {Promise<import('../models/readme-content-entity.js').ReadmeContentEntity>} README content entity
 */
export async function extractReadmeData(readmePath, packagePath) {
	const content = await readFile(readmePath, "utf-8");
	const relativePath = relative(packagePath, readmePath);
	const dirPath = dirname(relativePath);

	// Generate ID and create ReadmeContentEntity
	const readmeId = generateReadmeId(readmePath, packagePath);
	const readmeEntity = new ReadmeContentEntity(readmeId, relativePath, dirPath);

	// Set content and parse it
	readmeEntity.setContent(content);

	// Set metadata
	readmeEntity.setMetadata({
		lastModified: new Date(),
	});

	// Set additional metadata directly
	readmeEntity.lineCount = content.split("\n").length;

	// Validate the entity
	readmeEntity.validate();

	return readmeEntity;
}
