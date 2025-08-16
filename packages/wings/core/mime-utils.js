/**
 * @type {Object<string, string>} MimeTypes
 */
const mimeTypes = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg", // Add jpeg extension
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".wav": "audio/wav",
	".mp4": "video/mp4",
	".woff": "application/font-woff",
	".ttf": "application/font-ttf",
	".eot": "application/vnd.ms-fontobject",
	".otf": "application/font-otf",
	".wasm": "application/wasm",
	".txt": "text/plain",
	".xml": "application/xml",
	".ico": "image/x-icon",
	".webp": "image/webp",
	".avif": "image/avif",
	".webm": "video/webm",
	".mp3": "audio/mpeg",
	".pdf": "application/pdf",
	".zip": "application/zip",
	".gz": "application/gzip",
	".md": "text/markdown",
	".csv": "text/csv",
};

/**
 * Gets the MIME type based on the file extension.
 *
 * @param {string} filename - The name of the file to get the MIME type for.
 * @returns {string} The MIME type corresponding to the file extension, or "application/octet-stream" if not found.
 */
export function getMimeType(filename) {
	if (!filename || typeof filename !== "string") {
		return "application/octet-stream";
	}

	// Trim whitespace from the filename
	const trimmedFilename = filename.trim();

	// Handle edge cases where trimming results in empty string
	if (!trimmedFilename) {
		return "application/octet-stream";
	}

	const parts = trimmedFilename.split(".");
	if (parts.length < 2) {
		return "application/octet-stream";
	}

	// Get the last part and trim any whitespace, then convert to lowercase
	const ext = `.${parts.pop().trim().toLowerCase()}`;
	return mimeTypes[ext] || "application/octet-stream";
}
