/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 *
 * Bump a semantic version according to the specified type
 */
export function bumpVersion(/** @type {string} */ currentVersion, /** @type {string} */ bumpType) {
	// Validate current version format
	if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
		throw new Error(
			`Invalid version format: ${currentVersion}. Expected format: x.y.z`,
		);
	}

	// Validate bump type
	if (!["major", "minor", "patch"].includes(bumpType)) {
		throw new Error(
			`Invalid bump type: ${bumpType}. Expected: major, minor, or patch`,
		);
	}

	// Parse current version
	const [major, minor, patch] = currentVersion.split(".").map(Number);

	// Calculate new version based on bump type
	let newVersion;
	switch (bumpType) {
		case "major":
			newVersion = `${major + 1}.0.0`;
			break;
		case "minor":
			newVersion = `${major}.${minor + 1}.0`;
			break;
		case "patch":
			newVersion = `${major}.${minor}.${patch + 1}`;
			break;
		default:
			// This should never happen due to validation above
			throw new Error(`Unsupported bump type: ${bumpType}`);
	}

	return newVersion;
}
