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

		it("should handle files with leading dots", () => {
			// Hidden files on Unix systems
			assert.equal(getMimeType(".htaccess"), "application/octet-stream");
			assert.equal(getMimeType(".env"), "application/octet-stream");
			assert.equal(getMimeType(".gitignore"), "application/octet-stream");
			assert.equal(getMimeType(".DS_Store"), "application/octet-stream");
		});

		it("should handle files with only dots", () => {
			assert.equal(getMimeType("."), "application/octet-stream");
			assert.equal(getMimeType(".."), "application/octet-stream");
			assert.equal(getMimeType("..."), "application/octet-stream");
			assert.equal(getMimeType("...."), "application/octet-stream");
		});

		it("should handle files with multiple consecutive dots", () => {
			assert.equal(getMimeType("file..txt"), "text/plain");
			assert.equal(getMimeType("file...txt"), "text/plain");
			assert.equal(getMimeType("file....txt"), "text/plain");
			assert.equal(getMimeType("file.."), "application/octet-stream");
			assert.equal(getMimeType("file..."), "application/octet-stream");
		});

		it("should handle files with spaces and special characters", () => {
			assert.equal(getMimeType("file name.txt"), "text/plain");
			assert.equal(getMimeType("file-name.txt"), "text/plain");
			assert.equal(getMimeType("file_name.txt"), "text/plain");
			assert.equal(getMimeType("file@name.txt"), "text/plain");
			assert.equal(getMimeType("file#name.txt"), "text/plain");
			assert.equal(getMimeType("file$name.txt"), "text/plain");
			assert.equal(getMimeType("file%name.txt"), "text/plain");
			assert.equal(getMimeType("file&name.txt"), "text/plain");
			assert.equal(getMimeType("file*name.txt"), "text/plain");
			assert.equal(getMimeType("file+name.txt"), "text/plain");
			assert.equal(getMimeType("file=name.txt"), "text/plain");
			assert.equal(getMimeType("file[name].txt"), "text/plain");
			assert.equal(getMimeType("file{name}.txt"), "text/plain");
			assert.equal(getMimeType("file(name).txt"), "text/plain");
		});

		it("should handle unicode characters in filenames", () => {
			assert.equal(getMimeType("café.txt"), "text/plain");
			assert.equal(getMimeType("résumé.pdf"), "application/pdf");
			assert.equal(getMimeType("über.jpg"), "image/jpeg");
			assert.equal(getMimeType("文件.txt"), "text/plain");
			assert.equal(getMimeType("файл.txt"), "text/plain");
			assert.equal(getMimeType("ファイル.txt"), "text/plain");
			assert.equal(getMimeType("파일.txt"), "text/plain");
			assert.equal(getMimeType("ملف.txt"), "text/plain");
		});

		it("should handle very long filenames", () => {
			const longName = `${"a".repeat(1000)}.txt`;
			assert.equal(getMimeType(longName), "text/plain");

			const longNameWithDots = `${"a".repeat(500)}.${"b".repeat(500)}.txt`;
			assert.equal(getMimeType(longNameWithDots), "text/plain");
		});

		it("should handle files with very long extensions", () => {
			const longExt = `file.${"x".repeat(100)}`;
			assert.equal(getMimeType(longExt), "application/octet-stream");
		});

		it("should handle files with numeric extensions", () => {
			assert.equal(getMimeType("file.123"), "application/octet-stream");
			assert.equal(getMimeType("file.1"), "application/octet-stream");
			assert.equal(getMimeType("file.999"), "application/octet-stream");
		});

		it("should handle files with mixed case in extension", () => {
			assert.equal(getMimeType("file.HtMl"), "text/html");
			assert.equal(getMimeType("file.JpEg"), "image/jpeg");
			assert.equal(getMimeType("file.PdF"), "application/pdf");
		});

		it("should handle files with trailing spaces", () => {
			assert.equal(getMimeType("file.txt "), "text/plain");
			assert.equal(getMimeType("file.txt  "), "text/plain");
			assert.equal(getMimeType(" file.txt"), "text/plain");
			assert.equal(getMimeType("  file.txt"), "text/plain");
		});

		it("should handle files with control characters", () => {
			assert.equal(getMimeType("file\x00.txt"), "text/plain");
			assert.equal(getMimeType("file\x01.txt"), "text/plain");
			assert.equal(getMimeType("file\x02.txt"), "text/plain");
			assert.equal(getMimeType("file\x1F.txt"), "text/plain");
			assert.equal(getMimeType("file\x7F.txt"), "text/plain");
		});

		it("should handle non-string inputs thoroughly", () => {
			// Primitives
			assert.equal(getMimeType(0), "application/octet-stream");
			assert.equal(getMimeType(1), "application/octet-stream");
			assert.equal(getMimeType(-1), "application/octet-stream");
			assert.equal(getMimeType(3.14), "application/octet-stream");
			assert.equal(getMimeType(NaN), "application/octet-stream");
			assert.equal(getMimeType(Infinity), "application/octet-stream");
			assert.equal(getMimeType(-Infinity), "application/octet-stream");
			assert.equal(getMimeType(true), "application/octet-stream");
			assert.equal(getMimeType(false), "application/octet-stream");
			assert.equal(getMimeType(Symbol("test")), "application/octet-stream");
			assert.equal(getMimeType(BigInt(123)), "application/octet-stream");

			// Objects
			assert.equal(getMimeType({}), "application/octet-stream");
			assert.equal(getMimeType([]), "application/octet-stream");
			assert.equal(
				getMimeType(() => {}),
				"application/octet-stream",
			);
			assert.equal(getMimeType(new Date()), "application/octet-stream");
			assert.equal(getMimeType(new Error()), "application/octet-stream");
			assert.equal(getMimeType(/(?:)/), "application/octet-stream");
			assert.equal(getMimeType(new Map()), "application/octet-stream");
			assert.equal(getMimeType(new Set()), "application/octet-stream");
			assert.equal(
				getMimeType(new Promise(() => {})),
				"application/octet-stream",
			);
		});

		it("should handle edge cases with dots and extensions", () => {
			// Edge cases that might break the split/pop logic
			assert.equal(getMimeType(".txt"), "text/plain");
			assert.equal(getMimeType("..txt"), "text/plain");
			assert.equal(getMimeType("...txt"), "text/plain");
			assert.equal(getMimeType("....txt"), "text/plain");
			assert.equal(getMimeType("file..txt"), "text/plain");
			assert.equal(getMimeType("file...txt"), "text/plain");
			assert.equal(getMimeType("file....txt"), "text/plain");
			assert.equal(getMimeType("file.."), "application/octet-stream");
			assert.equal(getMimeType("file..."), "application/octet-stream");
			assert.equal(getMimeType("file...."), "application/octet-stream");
		});

		it("should handle files with multiple extensions correctly", () => {
			// Should always take the last extension
			assert.equal(getMimeType("file.txt.bak"), "application/octet-stream");
			assert.equal(getMimeType("file.html.txt"), "text/plain");
			assert.equal(getMimeType("file.js.txt"), "text/plain");
			assert.equal(getMimeType("file.css.txt"), "text/plain");
			assert.equal(getMimeType("file.json.txt"), "text/plain");
			assert.equal(getMimeType("file.png.txt"), "text/plain");
			assert.equal(getMimeType("file.jpg.txt"), "text/plain");
			assert.equal(getMimeType("file.pdf.txt"), "text/plain");
		});

		it("should handle files with dots in the middle", () => {
			assert.equal(getMimeType("my.file.txt"), "text/plain");
			assert.equal(getMimeType("my.file.html"), "text/html");
			assert.equal(getMimeType("my.file.js"), "text/javascript");
			assert.equal(getMimeType("my.file.css"), "text/css");
		});

		it("should handle files with no name but extension", () => {
			assert.equal(getMimeType(".txt"), "text/plain");
			assert.equal(getMimeType(".html"), "text/html");
			assert.equal(getMimeType(".js"), "text/javascript");
			assert.equal(getMimeType(".css"), "text/css");
			assert.equal(getMimeType(".json"), "application/json");
		});

		it("should ensure complete coverage of mimeTypes lookup", () => {
			// Test all mime types to ensure the lookup path is covered
			assert.equal(getMimeType("test.html"), "text/html");
			assert.equal(getMimeType("test.js"), "text/javascript");
			assert.equal(getMimeType("test.css"), "text/css");
			assert.equal(getMimeType("test.json"), "application/json");
			assert.equal(getMimeType("test.png"), "image/png");
			assert.equal(getMimeType("test.jpg"), "image/jpeg");
			assert.equal(getMimeType("test.jpeg"), "image/jpeg");
			assert.equal(getMimeType("test.gif"), "image/gif");
			assert.equal(getMimeType("test.svg"), "image/svg+xml");
			assert.equal(getMimeType("test.wav"), "audio/wav");
			assert.equal(getMimeType("test.mp4"), "video/mp4");
			assert.equal(getMimeType("test.woff"), "application/font-woff");
			assert.equal(getMimeType("test.ttf"), "application/font-ttf");
			assert.equal(getMimeType("test.eot"), "application/vnd.ms-fontobject");
			assert.equal(getMimeType("test.otf"), "application/font-otf");
			assert.equal(getMimeType("test.wasm"), "application/wasm");
			assert.equal(getMimeType("test.txt"), "text/plain");
			assert.equal(getMimeType("test.xml"), "application/xml");
			assert.equal(getMimeType("test.ico"), "image/x-icon");
			assert.equal(getMimeType("test.webp"), "image/webp");
			assert.equal(getMimeType("test.avif"), "image/avif");
			assert.equal(getMimeType("test.webm"), "video/webm");
			assert.equal(getMimeType("test.mp3"), "audio/mpeg");
			assert.equal(getMimeType("test.pdf"), "application/pdf");
			assert.equal(getMimeType("test.zip"), "application/zip");
			assert.equal(getMimeType("test.gz"), "application/gzip");
			assert.equal(getMimeType("test.md"), "text/markdown");
			assert.equal(getMimeType("test.csv"), "text/csv");
		});

		it("should test the fallback case for complete coverage", () => {
			// Test the fallback case where mimeTypes[ext] returns undefined
			// This ensures the || "application/octet-stream" part is covered
			assert.equal(getMimeType("test.unknown"), "application/octet-stream");
			assert.equal(getMimeType("test.xyz"), "application/octet-stream");
			assert.equal(getMimeType("test.123"), "application/octet-stream");
			assert.equal(getMimeType("test.abc"), "application/octet-stream");
		});

		it("should handle whitespace-only filenames for complete coverage", () => {
			// Test the case where trimming results in empty string
			// This covers the if (!trimmedFilename) check
			assert.equal(getMimeType("   "), "application/octet-stream");
			assert.equal(getMimeType("\t"), "application/octet-stream");
			assert.equal(getMimeType("\n"), "application/octet-stream");
			assert.equal(getMimeType("\r"), "application/octet-stream");
			assert.equal(getMimeType("\f"), "application/octet-stream");
			assert.equal(getMimeType("\v"), "application/octet-stream");
			assert.equal(getMimeType(" \t\n\r\f\v "), "application/octet-stream");
		});
	});
});
