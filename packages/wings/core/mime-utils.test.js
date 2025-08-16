import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { getMimeType } from "./mime-utils.js";

describe("mime-utils", () => {
	describe("getMimeType", () => {
		it("should return correct MIME types for common file extensions", () => {
			// Web files
			assert.equal(getMimeType("index.html"), "text/html");
			assert.equal(getMimeType("script.js"), "text/javascript");
			assert.equal(getMimeType("styles.css"), "text/css");
			assert.equal(getMimeType("data.json"), "application/json");
			assert.equal(getMimeType("config.xml"), "application/xml");

			// Images
			assert.equal(getMimeType("image.png"), "image/png");
			assert.equal(getMimeType("photo.jpg"), "image/jpeg");
			assert.equal(getMimeType("icon.gif"), "image/gif");
			assert.equal(getMimeType("logo.svg"), "image/svg+xml");
			assert.equal(getMimeType("favicon.ico"), "image/x-icon");
			assert.equal(getMimeType("photo.webp"), "image/webp");
			assert.equal(getMimeType("image.avif"), "image/avif");

			// Media
			assert.equal(getMimeType("audio.wav"), "audio/wav");
			assert.equal(getMimeType("video.mp4"), "video/mp4");
			assert.equal(getMimeType("video.webm"), "video/webm");
			assert.equal(getMimeType("music.mp3"), "audio/mpeg");

			// Fonts
			assert.equal(getMimeType("font.woff"), "application/font-woff");
			assert.equal(getMimeType("font.ttf"), "application/font-ttf");
			assert.equal(getMimeType("font.eot"), "application/vnd.ms-fontobject");
			assert.equal(getMimeType("font.otf"), "application/font-otf");

			// Documents
			assert.equal(getMimeType("document.pdf"), "application/pdf");
			assert.equal(getMimeType("readme.txt"), "text/plain");
			assert.equal(getMimeType("readme.md"), "text/markdown");
			assert.equal(getMimeType("data.csv"), "text/csv");

			// Archives
			assert.equal(getMimeType("archive.zip"), "application/zip");
			assert.equal(getMimeType("file.gz"), "application/gzip");

			// Other
			assert.equal(getMimeType("module.wasm"), "application/wasm");
		});

		it("should handle case-insensitive extensions", () => {
			assert.equal(getMimeType("file.HTML"), "text/html");
			assert.equal(getMimeType("file.Html"), "text/html");
			assert.equal(getMimeType("file.html"), "text/html");
			assert.equal(getMimeType("file.JPG"), "image/jpeg");
			assert.equal(getMimeType("file.Jpg"), "image/jpeg");
			assert.equal(getMimeType("file.jpg"), "image/jpeg");
		});

		it("should handle files with multiple dots", () => {
			assert.equal(getMimeType("file.name.with.dots.txt"), "text/plain");
			assert.equal(getMimeType("archive.backup.zip"), "application/zip");
			assert.equal(getMimeType("image.compressed.jpg"), "image/jpeg");
		});

		it("should return default for unknown extensions", () => {
			assert.equal(getMimeType("file.unknown"), "application/octet-stream");
			assert.equal(getMimeType("file.xyz"), "application/octet-stream");
			assert.equal(getMimeType("file.123"), "application/octet-stream");
		});

		it("should handle edge cases", () => {
			// No extension
			assert.equal(getMimeType("filename"), "application/octet-stream");
			assert.equal(getMimeType("file."), "application/octet-stream");

			// Empty or invalid input
			assert.equal(getMimeType(""), "application/octet-stream");
			assert.equal(getMimeType(null), "application/octet-stream");
			assert.equal(getMimeType(undefined), "application/octet-stream");
			assert.equal(getMimeType(123), "application/octet-stream");
			assert.equal(getMimeType({}), "application/octet-stream");
		});
	});
});
