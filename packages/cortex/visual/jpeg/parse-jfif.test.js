/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  calculateAspectRatio,
  DEFAULT_DENSITY,
  dpiToPixelsPerCm,
  extractJfifMetadata,
  getJfifSummary,
  JFIF_DENSITY_UNITS,
  JFIF_IDENTIFIER,
  JFIF_VERSIONS,
  JFXX_IDENTIFIER,
  JFXX_THUMBNAIL_FORMATS,
  JfifMetrics,
  MAX_THUMBNAIL_DIMENSION,
  MAX_THUMBNAIL_SIZE,
  normalizeDensity,
  parseJfifData,
  parseJfxxData,
  pixelsPerCmToDpi,
} from "./parse-jfif.js";

describe("JFIF Metadata Parsing", () => {
  describe("Constants and Definitions", () => {
    it("defines correct JFIF identifier", () => {
      assert.equal(JFIF_IDENTIFIER, "JFIF\0");
      assert.equal(JFIF_IDENTIFIER.length, 5);
    });

    it("defines correct JFXX identifier", () => {
      assert.equal(JFXX_IDENTIFIER, "JFXX\0");
      assert.equal(JFXX_IDENTIFIER.length, 5);
    });

    it("defines JFIF versions", () => {
      assert.equal(JFIF_VERSIONS.V1_00.major, 1);
      assert.equal(JFIF_VERSIONS.V1_00.minor, 0);
      assert.equal(JFIF_VERSIONS.V1_00.name, "1.00");

      assert.equal(JFIF_VERSIONS.V1_01.major, 1);
      assert.equal(JFIF_VERSIONS.V1_01.minor, 1);
      assert.equal(JFIF_VERSIONS.V1_01.name, "1.01");

      assert.equal(JFIF_VERSIONS.V1_02.major, 1);
      assert.equal(JFIF_VERSIONS.V1_02.minor, 2);
      assert.equal(JFIF_VERSIONS.V1_02.name, "1.02");
    });

    it("defines density units", () => {
      assert.equal(JFIF_DENSITY_UNITS.NONE, 0);
      assert.equal(JFIF_DENSITY_UNITS.PIXELS_PER_INCH, 1);
      assert.equal(JFIF_DENSITY_UNITS.PIXELS_PER_CM, 2);
    });

    it("defines thumbnail formats", () => {
      assert.equal(JFXX_THUMBNAIL_FORMATS.JPEG, 16);
      assert.equal(JFXX_THUMBNAIL_FORMATS.PALETTE, 17);
      assert.equal(JFXX_THUMBNAIL_FORMATS.RGB, 19);
    });

    it("defines default density", () => {
      assert.equal(DEFAULT_DENSITY.DPI, 72);
      assert.equal(DEFAULT_DENSITY.PIXELS_PER_CM, 28.35);
    });

    it("defines maximum thumbnail limits", () => {
      assert.equal(MAX_THUMBNAIL_DIMENSION, 255);
      assert.equal(MAX_THUMBNAIL_SIZE, 255 * 255 * 3);
    });
  });

  describe("Density Conversion Functions", () => {
    it("converts DPI to pixels per cm", () => {
      assert.equal(dpiToPixelsPerCm(72), 72 / 2.54);
      assert.equal(dpiToPixelsPerCm(300), 300 / 2.54);
      assert(Math.abs(dpiToPixelsPerCm(150) - 59.055) < 0.001);
    });

    it("converts pixels per cm to DPI", () => {
      assert.equal(pixelsPerCmToDpi(28.35), 72.009);
      assert(Math.abs(pixelsPerCmToDpi(59.055) - 150) < 0.001);
      assert(Math.abs(pixelsPerCmToDpi(118.11) - 300) < 0.001);
    });

    it("throws on invalid DPI values", () => {
      assert.throws(() => dpiToPixelsPerCm(0), /DPI must be a positive number/);
      assert.throws(() => dpiToPixelsPerCm(-72), /DPI must be a positive number/);
      assert.throws(() => dpiToPixelsPerCm("72"), /DPI must be a positive number/);
    });

    it("throws on invalid pixels per cm values", () => {
      assert.throws(() => pixelsPerCmToDpi(0), /Pixels per cm must be a positive number/);
      assert.throws(() => pixelsPerCmToDpi(-28), /Pixels per cm must be a positive number/);
      assert.throws(() => pixelsPerCmToDpi("28"), /Pixels per cm must be a positive number/);
    });
  });

  describe("Aspect Ratio Calculation", () => {
    it("calculates correct aspect ratios", () => {
      assert.equal(calculateAspectRatio(100, 100), 1.0);
      assert.equal(calculateAspectRatio(200, 100), 2.0);
      assert.equal(calculateAspectRatio(100, 200), 0.5);
      assert.equal(calculateAspectRatio(150, 100), 1.5);
    });

    it("handles zero density values", () => {
      assert.equal(calculateAspectRatio(0, 100), 1.0);
      assert.equal(calculateAspectRatio(100, 0), 1.0);
      assert.equal(calculateAspectRatio(0, 0), 1.0);
    });

    it("throws on invalid input types", () => {
      assert.throws(() => calculateAspectRatio("100", 100), /Density values must be numbers/);
      assert.throws(() => calculateAspectRatio(100, "100"), /Density values must be numbers/);
      assert.throws(() => calculateAspectRatio(null, 100), /Density values must be numbers/);
    });
  });

  describe("Density Normalization", () => {
    it("normalizes pixels per inch", () => {
      assert.equal(normalizeDensity(72, JFIF_DENSITY_UNITS.PIXELS_PER_INCH), 72);
      assert.equal(normalizeDensity(300, JFIF_DENSITY_UNITS.PIXELS_PER_INCH), 300);
    });

    it("normalizes pixels per cm", () => {
      const result = normalizeDensity(28.35, JFIF_DENSITY_UNITS.PIXELS_PER_CM);
      assert(Math.abs(result - 72.009) < 0.001);
    });

    it("handles no units specified", () => {
      assert.equal(normalizeDensity(100, JFIF_DENSITY_UNITS.NONE), DEFAULT_DENSITY.DPI);
      assert.equal(normalizeDensity(200, 999), DEFAULT_DENSITY.DPI); // Unknown unit
    });

    it("handles zero density", () => {
      assert.equal(normalizeDensity(0, JFIF_DENSITY_UNITS.PIXELS_PER_INCH), DEFAULT_DENSITY.DPI);
      assert.equal(normalizeDensity(-50, JFIF_DENSITY_UNITS.PIXELS_PER_CM), DEFAULT_DENSITY.DPI);
    });

    it("throws on invalid input types", () => {
      assert.throws(() => normalizeDensity("72", 1), /Density and units must be numbers/);
      assert.throws(() => normalizeDensity(72, "1"), /Density and units must be numbers/);
    });
  });

  describe("JFIF Data Parsing", () => {
    /**
     * Create minimal valid JFIF data for testing.
     * @param {Object} options - Customization options
     * @returns {Uint8Array} Valid JFIF data
     */
    function createJfifData(options = {}) {
      const {
        version = JFIF_VERSIONS.V1_02,
        densityUnits = JFIF_DENSITY_UNITS.PIXELS_PER_INCH,
        xDensity = 72,
        yDensity = 72,
        thumbnailWidth = 0,
        thumbnailHeight = 0,
        thumbnailData = null,
      } = options;

      const data = [];

      // JFIF identifier
      data.push(...new TextEncoder().encode(JFIF_IDENTIFIER));

      // Version
      data.push(version.major, version.minor);

      // Density units
      data.push(densityUnits);

      // Density values (big-endian)
      data.push((xDensity >> 8) & 0xff, xDensity & 0xff);
      data.push((yDensity >> 8) & 0xff, yDensity & 0xff);

      // Thumbnail dimensions
      data.push(thumbnailWidth, thumbnailHeight);

      // Thumbnail data
      if (thumbnailData) {
        for (let i = 0; i < thumbnailData.length; i++) {
          data.push(thumbnailData[i]);
        }
      }

      return new Uint8Array(data);
    }

    it("parses minimal JFIF data", () => {
      const jfifData = createJfifData();
      const result = parseJfifData(jfifData);

      assert.equal(result.identifier, JFIF_IDENTIFIER);
      assert.equal(result.version.major, 1);
      assert.equal(result.version.minor, 2);
      assert.equal(result.version.name, "1.02");
      assert.equal(result.densityUnits, JFIF_DENSITY_UNITS.PIXELS_PER_INCH);
      assert.equal(result.xDensity, 72);
      assert.equal(result.yDensity, 72);
      assert.equal(result.thumbnailWidth, 0);
      assert.equal(result.thumbnailHeight, 0);
      assert.equal(result.thumbnailData, null);
    });

    it("parses JFIF with different versions", () => {
      const jfifData = createJfifData({ version: JFIF_VERSIONS.V1_00 });
      const result = parseJfifData(jfifData);

      assert.equal(result.version.major, 1);
      assert.equal(result.version.minor, 0);
      assert.equal(result.version.name, "1.00");
    });

    it("parses JFIF with different density units", () => {
      const jfifData = createJfifData({
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_CM,
        xDensity: 28,
        yDensity: 35,
      });
      const result = parseJfifData(jfifData);

      assert.equal(result.densityUnits, JFIF_DENSITY_UNITS.PIXELS_PER_CM);
      assert.equal(result.xDensity, 28);
      assert.equal(result.yDensity, 35);
    });

    it("parses JFIF with thumbnail", () => {
      const thumbnailData = new Uint8Array(2 * 3 * 3); // 2x3 RGB thumbnail
      thumbnailData.fill(128); // Gray thumbnail

      const jfifData = createJfifData({
        thumbnailWidth: 2,
        thumbnailHeight: 3,
        thumbnailData,
      });
      const result = parseJfifData(jfifData);

      assert.equal(result.thumbnailWidth, 2);
      assert.equal(result.thumbnailHeight, 3);
      assert(result.thumbnailData instanceof Uint8Array);
      assert.equal(result.thumbnailData.length, 18); // 2 * 3 * 3
      assert.equal(result.thumbnailData[0], 128);
    });

    it("handles unknown JFIF versions", () => {
      const jfifData = createJfifData({
        version: { major: 2, minor: 5, name: "2.05" },
      });
      const result = parseJfifData(jfifData);

      assert.equal(result.version.major, 2);
      assert.equal(result.version.minor, 5);
      assert.equal(result.version.name, "2.05");
    });

    it("throws on invalid JFIF identifier", () => {
      const invalidData = new TextEncoder().encode("JPEG\0");

      assert.throws(() => {
        parseJfifData(invalidData);
      }, /Invalid JFIF identifier/);
    });

    it("throws on data too short", () => {
      const shortData = new Uint8Array([0x4a, 0x46, 0x49]);

      assert.throws(() => {
        parseJfifData(shortData);
      }, /APP0 data too short for JFIF/);
    });

    it("throws on header too short", () => {
      const headerData = new TextEncoder().encode(JFIF_IDENTIFIER);

      assert.throws(() => {
        parseJfifData(headerData);
      }, /JFIF header too short/);
    });

    it("throws on invalid data type", () => {
      assert.throws(() => {
        parseJfifData("not a uint8array");
      }, /APP0 data must be Uint8Array/);
    });

    it("throws on insufficient thumbnail data", () => {
      const jfifData = createJfifData({
        thumbnailWidth: 10,
        thumbnailHeight: 10,
        // No thumbnail data provided, but dimensions indicate 300 bytes needed
      });

      assert.throws(() => {
        parseJfifData(jfifData);
      }, /Insufficient data for thumbnail/);
    });

    it("handles maximum thumbnail size", () => {
      // The validation checks expectedThumbnailSize = width * height * 3
      // MAX_THUMBNAIL_SIZE is 255 * 255 * 3 = 195,075
      // So we need width * height * 3 > 195,075
      // Since max width/height is 255, we can't exceed this with valid JFIF
      // Let's test the edge case where it equals the maximum
      const maxThumbnailData = new Uint8Array(MAX_THUMBNAIL_SIZE);
      const jfifData = createJfifData({
        thumbnailWidth: 255,
        thumbnailHeight: 255,
        thumbnailData: maxThumbnailData,
      });

      // This should NOT throw since it's exactly at the limit
      const result = parseJfifData(jfifData);
      assert.equal(result.thumbnailWidth, 255);
      assert.equal(result.thumbnailHeight, 255);
      assert.equal(result.thumbnailData.length, MAX_THUMBNAIL_SIZE);
    });

    it("validates thumbnail size limit conceptually", () => {
      // Since JFIF format limits dimensions to 255x255, we can't actually
      // exceed MAX_THUMBNAIL_SIZE (255*255*3) with valid data.
      // This test verifies the mathematical limit.
      const maxValidSize = 255 * 255 * 3;
      assert.equal(maxValidSize, MAX_THUMBNAIL_SIZE);

      // Any size larger than this would be invalid
      const hypotheticalLargerSize = 256 * 256 * 3;
      assert(hypotheticalLargerSize > MAX_THUMBNAIL_SIZE);
    });
  });

  describe("JFXX Data Parsing", () => {
    /**
     * Create minimal valid JFXX data for testing.
     * @param {number} format - Thumbnail format
     * @param {Uint8Array} thumbnailData - Thumbnail data
     * @returns {Uint8Array} Valid JFXX data
     */
    function createJfxxData(format, thumbnailData = new Uint8Array(0)) {
      const data = [];

      // JFXX identifier
      data.push(...new TextEncoder().encode(JFXX_IDENTIFIER));

      // Thumbnail format
      data.push(format);

      // Thumbnail data
      data.push(...thumbnailData);

      return new Uint8Array(data);
    }

    it("parses JFXX with JPEG thumbnail", () => {
      const thumbnailData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
      const jfxxData = createJfxxData(JFXX_THUMBNAIL_FORMATS.JPEG, thumbnailData);
      const result = parseJfxxData(jfxxData);

      assert.equal(result.identifier, JFXX_IDENTIFIER);
      assert.equal(result.thumbnailFormat, JFXX_THUMBNAIL_FORMATS.JPEG);
      assert.deepEqual(result.thumbnailData, thumbnailData);
    });

    it("parses JFXX with palette thumbnail", () => {
      const thumbnailData = new Uint8Array([1, 1, 255, 0, 0, 0]); // 1x1 palette + RGB data
      const jfxxData = createJfxxData(JFXX_THUMBNAIL_FORMATS.PALETTE, thumbnailData);
      const result = parseJfxxData(jfxxData);

      assert.equal(result.thumbnailFormat, JFXX_THUMBNAIL_FORMATS.PALETTE);
      assert.deepEqual(result.thumbnailData, thumbnailData);
    });

    it("parses JFXX with RGB thumbnail", () => {
      const thumbnailData = new Uint8Array([1, 1, 255, 0, 0]); // 1x1 RGB data
      const jfxxData = createJfxxData(JFXX_THUMBNAIL_FORMATS.RGB, thumbnailData);
      const result = parseJfxxData(jfxxData);

      assert.equal(result.thumbnailFormat, JFXX_THUMBNAIL_FORMATS.RGB);
      assert.deepEqual(result.thumbnailData, thumbnailData);
    });

    it("throws on invalid JFXX identifier", () => {
      const invalidData = new TextEncoder().encode("JFIF\0");

      assert.throws(() => {
        parseJfxxData(invalidData);
      }, /Invalid JFXX identifier/);
    });

    it("throws on unknown thumbnail format", () => {
      const jfxxData = createJfxxData(0xff); // Invalid format

      assert.throws(() => {
        parseJfxxData(jfxxData);
      }, /Unknown JFXX thumbnail format/);
    });

    it("throws on data too short", () => {
      const shortData = new Uint8Array([0x4a, 0x46, 0x58]);

      assert.throws(() => {
        parseJfxxData(shortData);
      }, /APP0 data too short for JFXX/);
    });

    it("throws on header too short", () => {
      const headerData = new TextEncoder().encode(JFXX_IDENTIFIER);

      assert.throws(() => {
        parseJfxxData(headerData);
      }, /JFXX header too short/);
    });
  });

  describe("Metadata Extraction", () => {
    it("extracts basic metadata", () => {
      const jfifData = {
        version: JFIF_VERSIONS.V1_02,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_INCH,
        xDensity: 300,
        yDensity: 300,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        thumbnailData: null,
      };

      const metadata = extractJfifMetadata(jfifData);

      assert.equal(metadata.version, "1.02");
      assert.equal(metadata.density.x, 300);
      assert.equal(metadata.density.y, 300);
      assert.equal(metadata.density.units, "pixels per inch");
      assert.equal(metadata.density.dpi.x, 300);
      assert.equal(metadata.density.dpi.y, 300);
      assert.equal(metadata.aspectRatio, 1.0);
      assert.equal(metadata.thumbnail, null);
    });

    it("extracts metadata with different density units", () => {
      const jfifData = {
        version: JFIF_VERSIONS.V1_01,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_CM,
        xDensity: 118,
        yDensity: 59,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        thumbnailData: null,
      };

      const metadata = extractJfifMetadata(jfifData);

      assert.equal(metadata.density.units, "pixels per centimeter");
      assert(Math.abs(metadata.density.dpi.x - 299.72) < 0.1);
      assert(Math.abs(metadata.density.dpi.y - 149.86) < 0.1);
      assert.equal(metadata.aspectRatio, 2.0); // 118/59 = 2.0
    });

    it("extracts metadata with no density units", () => {
      const jfifData = {
        version: JFIF_VERSIONS.V1_00,
        densityUnits: JFIF_DENSITY_UNITS.NONE,
        xDensity: 4,
        yDensity: 3,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        thumbnailData: null,
      };

      const metadata = extractJfifMetadata(jfifData);

      assert.equal(metadata.density.units, "none (aspect ratio only)");
      assert.equal(metadata.density.dpi.x, DEFAULT_DENSITY.DPI);
      assert.equal(metadata.density.dpi.y, DEFAULT_DENSITY.DPI);
      assert(Math.abs(metadata.aspectRatio - 4 / 3) < 0.001);
    });

    it("extracts thumbnail metadata", () => {
      const thumbnailData = new Uint8Array(48); // 4x4 RGB = 48 bytes
      const jfifData = {
        version: JFIF_VERSIONS.V1_02,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_INCH,
        xDensity: 72,
        yDensity: 72,
        thumbnailWidth: 4,
        thumbnailHeight: 4,
        thumbnailData,
      };

      const metadata = extractJfifMetadata(jfifData);

      assert(metadata.thumbnail !== null);
      assert.equal(metadata.thumbnail.width, 4);
      assert.equal(metadata.thumbnail.height, 4);
      assert.equal(metadata.thumbnail.hasData, true);
      assert.equal(metadata.thumbnail.size, 48);
    });

    it("handles thumbnail without data", () => {
      const jfifData = {
        version: JFIF_VERSIONS.V1_02,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_INCH,
        xDensity: 72,
        yDensity: 72,
        thumbnailWidth: 2,
        thumbnailHeight: 2,
        thumbnailData: null,
      };

      const metadata = extractJfifMetadata(jfifData);

      assert(metadata.thumbnail !== null);
      assert.equal(metadata.thumbnail.width, 2);
      assert.equal(metadata.thumbnail.height, 2);
      assert.equal(metadata.thumbnail.hasData, false);
      assert.equal(metadata.thumbnail.size, 0);
    });
  });

  describe("JFIF Metrics", () => {
    it("creates metrics analyzer", () => {
      const metrics = new JfifMetrics();

      assert.equal(metrics.jfifSegmentsParsed, 0);
      assert.equal(metrics.jfxxSegmentsParsed, 0);
      assert.equal(metrics.thumbnailsExtracted, 0);
      assert.equal(metrics.totalThumbnailSize, 0);
      assert.deepEqual(metrics.versionCounts, {});
      assert.deepEqual(metrics.densityUnitCounts, {});
      assert.deepEqual(metrics.thumbnailFormatCounts, {});
      assert.deepEqual(metrics.errors, []);
    });

    it("records JFIF segment processing", () => {
      const metrics = new JfifMetrics();

      metrics.recordJfifSegment("1.02", JFIF_DENSITY_UNITS.PIXELS_PER_INCH, true, 192);

      assert.equal(metrics.jfifSegmentsParsed, 1);
      assert.equal(metrics.thumbnailsExtracted, 1);
      assert.equal(metrics.totalThumbnailSize, 192);
      assert.equal(metrics.versionCounts["1.02"], 1);
      assert.equal(metrics.densityUnitCounts.PIXELS_PER_INCH, 1);
    });

    it("records JFXX segment processing", () => {
      const metrics = new JfifMetrics();

      metrics.recordJfxxSegment(JFXX_THUMBNAIL_FORMATS.JPEG, 1024);

      assert.equal(metrics.jfxxSegmentsParsed, 1);
      assert.equal(metrics.totalThumbnailSize, 1024);
      assert.equal(metrics.thumbnailFormatCounts[JFXX_THUMBNAIL_FORMATS.JPEG], 1);
    });

    it("records errors", () => {
      const metrics = new JfifMetrics();

      metrics.recordError("Invalid format");
      metrics.recordError("Corrupted data");

      assert.equal(metrics.errors.length, 2);
      assert.equal(metrics.errors[0], "Invalid format");
      assert.equal(metrics.errors[1], "Corrupted data");
    });

    it("generates summary statistics", () => {
      const metrics = new JfifMetrics();

      metrics.recordJfifSegment("1.02", JFIF_DENSITY_UNITS.PIXELS_PER_INCH, true, 192);
      metrics.recordJfifSegment("1.01", JFIF_DENSITY_UNITS.PIXELS_PER_CM, false, 0);
      metrics.recordJfxxSegment(JFXX_THUMBNAIL_FORMATS.RGB, 48);
      metrics.recordError("Test error");

      const summary = metrics.getSummary();

      assert.equal(summary.jfifSegmentsParsed, 2);
      assert.equal(summary.jfxxSegmentsParsed, 1);
      assert.equal(summary.thumbnailsExtracted, 1);
      assert.equal(summary.totalThumbnailSize, 240); // 192 + 48
      assert.equal(summary.averageThumbnailSize, 120); // (192 + 48) / 2 thumbnails = 120
      assert.equal(summary.errorCount, 1);
      assert.equal(summary.mostCommonVersion, "1.02");
    });

    it("resets metrics", () => {
      const metrics = new JfifMetrics();

      metrics.recordJfifSegment("1.02", JFIF_DENSITY_UNITS.PIXELS_PER_INCH, true, 192);
      metrics.recordError("Test error");

      assert.equal(metrics.jfifSegmentsParsed, 1);
      assert.equal(metrics.errors.length, 1);

      metrics.reset();

      assert.equal(metrics.jfifSegmentsParsed, 0);
      assert.equal(metrics.errors.length, 0);
      assert.deepEqual(metrics.versionCounts, {});
    });
  });

  describe("Summary Generation", () => {
    it("generates summary for basic JFIF", () => {
      const jfifData = {
        version: JFIF_VERSIONS.V1_02,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_INCH,
        xDensity: 150,
        yDensity: 150,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        thumbnailData: null,
      };

      const summary = getJfifSummary(jfifData);

      assert.equal(summary.version, "1.02");
      assert.equal(summary.densityUnits, JFIF_DENSITY_UNITS.PIXELS_PER_INCH);
      assert.equal(summary.hasThumbnail, false);
      assert.equal(summary.thumbnailSize, 0);
      assert.equal(summary.aspectRatio, 1.0);
      assert.equal(summary.dpiX, 150);
      assert.equal(summary.dpiY, 150);
      assert(summary.description.includes("150×150 DPI"));
    });

    it("generates summary with thumbnail", () => {
      const thumbnailData = new Uint8Array(12); // 2x2 RGB
      const jfifData = {
        version: JFIF_VERSIONS.V1_01,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_CM,
        xDensity: 59,
        yDensity: 118,
        thumbnailWidth: 2,
        thumbnailHeight: 2,
        thumbnailData,
      };

      const summary = getJfifSummary(jfifData);

      assert.equal(summary.version, "1.01");
      assert.equal(summary.hasThumbnail, true);
      assert.equal(summary.thumbnailSize, 12);
      assert.equal(summary.aspectRatio, 0.5); // 59/118 = 0.5
      assert(summary.description.includes("2×2 thumbnail"));
    });

    it("handles aspect ratio rounding", () => {
      const jfifData = {
        version: JFIF_VERSIONS.V1_00,
        densityUnits: JFIF_DENSITY_UNITS.NONE,
        xDensity: 100,
        yDensity: 300,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        thumbnailData: null,
      };

      const summary = getJfifSummary(jfifData);

      assert.equal(summary.aspectRatio, 0.333); // Rounded to 3 decimal places
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles maximum thumbnail size", () => {
      const thumbnailData = new Uint8Array(MAX_THUMBNAIL_SIZE);
      const jfifData = {
        version: JFIF_VERSIONS.V1_02,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_INCH,
        xDensity: 72,
        yDensity: 72,
        thumbnailWidth: MAX_THUMBNAIL_DIMENSION,
        thumbnailHeight: MAX_THUMBNAIL_DIMENSION,
        thumbnailData,
      };

      const metadata = extractJfifMetadata(jfifData);

      assert.equal(metadata.thumbnail.width, MAX_THUMBNAIL_DIMENSION);
      assert.equal(metadata.thumbnail.height, MAX_THUMBNAIL_DIMENSION);
      assert.equal(metadata.thumbnail.size, MAX_THUMBNAIL_SIZE);
    });

    it("handles extreme density values", () => {
      const jfifData = {
        version: JFIF_VERSIONS.V1_02,
        densityUnits: JFIF_DENSITY_UNITS.PIXELS_PER_INCH,
        xDensity: 65535, // Maximum 16-bit value
        yDensity: 1,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        thumbnailData: null,
      };

      const metadata = extractJfifMetadata(jfifData);

      assert.equal(metadata.density.dpi.x, 65535);
      assert.equal(metadata.density.dpi.y, 1);
      assert.equal(metadata.aspectRatio, 65535);
    });

    it("handles zero density gracefully", () => {
      const result = calculateAspectRatio(0, 100);
      assert.equal(result, 1.0);

      const normalized = normalizeDensity(0, JFIF_DENSITY_UNITS.PIXELS_PER_INCH);
      assert.equal(normalized, DEFAULT_DENSITY.DPI);
    });

    it("handles malformed version numbers", () => {
      const jfifData = new Uint8Array([
        ...new TextEncoder().encode(JFIF_IDENTIFIER),
        99,
        99, // Invalid version 99.99
        1, // Density units
        0,
        72, // X density
        0,
        72, // Y density
        0,
        0, // No thumbnail
      ]);

      const result = parseJfifData(jfifData);

      assert.equal(result.version.major, 99);
      assert.equal(result.version.minor, 99);
      assert.equal(result.version.name, "99.99");
    });

    it("validates thumbnail data consistency", () => {
      const jfifData = new Uint8Array([
        ...new TextEncoder().encode(JFIF_IDENTIFIER),
        1,
        2, // Version 1.02
        1, // Pixels per inch
        0,
        72, // X density
        0,
        72, // Y density
        2,
        2, // 2x2 thumbnail (needs 12 bytes)
        // Only 6 bytes of thumbnail data provided
        255,
        0,
        0,
        0,
        255,
        0,
      ]);

      assert.throws(() => {
        parseJfifData(jfifData);
      }, /Insufficient data for thumbnail/);
    });

    it("handles empty JFXX thumbnail data", () => {
      const jfxxData = new Uint8Array([
        ...new TextEncoder().encode(JFXX_IDENTIFIER),
        JFXX_THUMBNAIL_FORMATS.RGB,
        // No thumbnail data
      ]);

      const result = parseJfxxData(jfxxData);

      assert.equal(result.thumbnailFormat, JFXX_THUMBNAIL_FORMATS.RGB);
      assert.equal(result.thumbnailData.length, 0);
    });
  });
});
