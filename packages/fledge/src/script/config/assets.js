/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Asset resolution for script mode bundling.
 *
 * Handles various asset input formats (strings, arrays, functions) and
 * resolves them to file paths for embedding in executables.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Asset collection and resolution for script bundling
 */
export class Assets {
  /**
   * Resolved asset file paths
   * @type {string[]}
   */
  files;

  /**
   * Mapping of mount paths to full file paths for asset mounting
   * @type {Map<string, string>}
   */
  mountMap;

  /**
   * Create Assets instance
   * @param {string[]} files - Array of resolved file paths
   * @param {Map<string, string>} [mountMap] - Optional mount path mapping
   */
  constructor(files, mountMap) {
    this.files = files || [];
    this.mountMap = mountMap || new Map();
  }

  /**
   * Resolve various asset input formats to file paths
   * @param {unknown} assetInput - Asset configuration (string, array, function, or null)
   * @returns {Promise<Assets>} Assets instance with resolved files
   *
   * @example String input
   * ```javascript
   * const assets = await Assets.resolve("./public");
   * // Resolves all files in ./public directory
   * ```
   *
   * @example Array input
   * ```javascript
   * const assets = await Assets.resolve([
   *   "./public",
   *   "./config.json",
   *   "./templates/*.html"
   * ]);
   * // Resolves directories, files, and glob patterns
   * ```
   *
   * @example Function input
   * ```javascript
   * const assets = await Assets.resolve(async () => {
   *   const templates = await loadTemplateList();
   *   return ["./public", ...templates.map(t => `./templates/${t.file}`)];
   * });
   * ```
   */
  static async resolve(assetInput) {
    if (!assetInput) {
      return new Assets([]);
    }

    // Handle function input - call and resolve result
    if (typeof assetInput === "function") {
      const result = await assetInput();
      return await Assets.resolve(result);
    }

    // Handle string input - convert to array
    if (typeof assetInput === "string") {
      const mountMap = new Map();
      const files = await resolveAssetPath(assetInput, mountMap);
      return new Assets(files, mountMap);
    }

    // Handle array input - resolve each entry
    if (Array.isArray(assetInput)) {
      const allFiles = [];
      const mountMap = new Map();
      for (const entry of assetInput) {
        if (typeof entry === "string") {
          const files = await resolveAssetPath(entry, mountMap);
          allFiles.push(...files);
        }
      }
      // Remove duplicates and sort
      const uniqueFiles = [...new Set(allFiles)].sort();
      return new Assets(uniqueFiles, mountMap);
    }

    throw new Error("Assets configuration must be a string, array, function, or null");
  }

  /**
   * Get all resolved asset files
   * @returns {string[]} Array of file paths
   */
  getFiles() {
    return this.files;
  }

  /**
   * Get mount path mapping (mount path -> full file path)
   * @returns {Map<string, string>} Mount path mapping
   */
  getMountMap() {
    return this.mountMap;
  }

  /**
   * Check if any assets are configured
   * @returns {boolean} True if assets exist
   */
  hasAssets() {
    return this.files.length > 0;
  }

  /**
   * Validate that all asset files exist
   * @throws {Error} If any asset file doesn't exist
   */
  validate() {
    for (const file of this.files) {
      if (!existsSync(file)) {
        throw new Error(`Asset file not found: ${file}`);
      }
    }
  }
}

/**
 * Resolve single asset path (file, directory, or glob pattern)
 * @param {string} assetPath - Path to resolve
 * @param {Map<string, string>} [mountMap] - Mount path mapping to populate
 * @returns {Promise<string[]>} Array of resolved file paths
 */
async function resolveAssetPath(assetPath, mountMap) {
  if (!existsSync(assetPath)) {
    throw new Error(`Asset path not found: ${assetPath}`);
  }

  const stat = statSync(assetPath);

  if (stat.isFile()) {
    // For single files, mount at root with original filename
    if (mountMap) {
      const fileName = assetPath.split("/").pop() || assetPath.split("\\").pop() || "file";
      mountMap.set(`/${fileName}`, assetPath);
    }
    return [assetPath];
  }

  if (stat.isDirectory()) {
    // For directories, mount contents relative to root
    const resolvedBaseDir = resolve(assetPath);
    const files = listFilesRecursively(resolvedBaseDir, mountMap, resolvedBaseDir);
    return files;
  }

  return [];
}

/**
 * Recursively list all files in a directory
 * @param {string} dirPath - Directory path to scan
 * @param {Map<string, string>} [mountMap] - Mount path mapping to populate
 * @param {string} [baseDir] - Base directory for relative mount paths
 * @returns {string[]} Array of file paths
 */
function listFilesRecursively(dirPath, mountMap, baseDir) {
  /** @type {string[]} */
  const files = [];

  /**
   * @param {string} currentPath
   */
  function scanDirectory(currentPath) {
    try {
      const entries = readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);

        if (entry.isFile()) {
          files.push(fullPath);

          // Create mount path if mountMap is provided
          if (mountMap && baseDir) {
            const resolvedFullPath = resolve(fullPath);
            const relativePath = resolvedFullPath.slice(baseDir.length);
            // Ensure mount path starts with / and normalize path separators
            const mountPath = `/${relativePath.replace(/^[/\\]+/, "").replace(/\\/g, "/")}`;
            mountMap.set(mountPath, fullPath);
          }
        } else if (entry.isDirectory()) {
          scanDirectory(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  scanDirectory(dirPath);
  return files.sort();
}
