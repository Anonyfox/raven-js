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
  EXIF_DATA_TYPES,
  EXIF_IDENTIFIER,
  EXIF_TAGS,
  extractMetadata,
  getExifSummary,
  IFD_TYPES,
  parseExifData,
  TIFF_BYTE_ORDER,
  TIFF_MAGIC_NUMBER,
} from "./parse-exif.js";

/**
 * Create minimal valid EXIF data for testing.
 * @param {boolean} littleEndian - Whether to use little-endian byte order
 * @returns {Uint8Array} Valid EXIF data
 */
function createMinimalExifData(littleEndian = true) {
  const data = [];

  // EXIF identifier
  data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));

  // TIFF header
  if (littleEndian) {
    data.push(0x49, 0x49); // "II" - little endian
    data.push(0x2a, 0x00); // Magic number (42) in little endian
    data.push(0x08, 0x00, 0x00, 0x00); // First IFD offset (8) in little endian
  } else {
    data.push(0x4d, 0x4d); // "MM" - big endian
    data.push(0x00, 0x2a); // Magic number (42) in big endian
    data.push(0x00, 0x00, 0x00, 0x08); // First IFD offset (8) in big endian
  }

  // IFD with one entry (Make tag)
  if (littleEndian) {
    data.push(0x01, 0x00); // Entry count (1)
    // IFD entry: Make tag
    data.push(0x0f, 0x01); // Tag (0x010f = Make)
    data.push(0x02, 0x00); // Type (ASCII)
    data.push(0x05, 0x00, 0x00, 0x00); // Count (5)
    data.push(0x1a, 0x00, 0x00, 0x00); // Value offset (26)
    // Next IFD offset (0)
    data.push(0x00, 0x00, 0x00, 0x00);
  } else {
    data.push(0x00, 0x01); // Entry count (1)
    // IFD entry: Make tag
    data.push(0x01, 0x0f); // Tag (0x010f = Make)
    data.push(0x00, 0x02); // Type (ASCII)
    data.push(0x00, 0x00, 0x00, 0x05); // Count (5)
    data.push(0x00, 0x00, 0x00, 0x1a); // Value offset (26)
    // Next IFD offset (0)
    data.push(0x00, 0x00, 0x00, 0x00);
  }

  // String value "Test\0"
  data.push(...new TextEncoder().encode("Test\0"));

  return new Uint8Array(data);
}

describe("EXIF Metadata Parsing", () => {
  describe("Constants and Definitions", () => {
    it("defines correct EXIF identifier", () => {
      assert.equal(EXIF_IDENTIFIER, "Exif\0\0");
      assert.equal(EXIF_IDENTIFIER.length, 6);
    });

    it("defines TIFF byte order constants", () => {
      assert.equal(TIFF_BYTE_ORDER.LITTLE_ENDIAN, 0x4949);
      assert.equal(TIFF_BYTE_ORDER.BIG_ENDIAN, 0x4d4d);
    });

    it("defines TIFF magic number", () => {
      assert.equal(TIFF_MAGIC_NUMBER, 0x002a);
    });

    it("defines EXIF data types", () => {
      assert.equal(EXIF_DATA_TYPES.BYTE.id, 1);
      assert.equal(EXIF_DATA_TYPES.BYTE.size, 1);
      assert.equal(EXIF_DATA_TYPES.ASCII.id, 2);
      assert.equal(EXIF_DATA_TYPES.SHORT.id, 3);
      assert.equal(EXIF_DATA_TYPES.SHORT.size, 2);
      assert.equal(EXIF_DATA_TYPES.LONG.id, 4);
      assert.equal(EXIF_DATA_TYPES.LONG.size, 4);
      assert.equal(EXIF_DATA_TYPES.RATIONAL.id, 5);
      assert.equal(EXIF_DATA_TYPES.RATIONAL.size, 8);
    });

    it("defines common EXIF tags", () => {
      assert.equal(EXIF_TAGS[0x010f].name, "Make");
      assert.equal(EXIF_TAGS[0x0110].name, "Model");
      assert.equal(EXIF_TAGS[0x829a].name, "ExposureTime");
      assert.equal(EXIF_TAGS[0x829d].name, "FNumber");
      assert.equal(EXIF_TAGS[0x8827].name, "ISOSpeedRatings");
      assert.equal(EXIF_TAGS[0x920a].name, "FocalLength");
    });

    it("defines IFD types", () => {
      assert.equal(IFD_TYPES.IMAGE, "image");
      assert.equal(IFD_TYPES.EXIF, "exif");
      assert.equal(IFD_TYPES.GPS, "gps");
      assert.equal(IFD_TYPES.INTEROP, "interop");
      assert.equal(IFD_TYPES.THUMBNAIL, "thumbnail");
    });
  });

  describe("EXIF Data Parsing", () => {
    it("parses minimal EXIF data with little-endian", () => {
      const exifData = createMinimalExifData(true);
      const result = parseExifData(exifData);

      assert.equal(result.byteOrder, "little-endian");
      assert(result.tags[0x010f]); // Make tag
      assert.equal(result.tags[0x010f].name, "Make");
      assert.equal(result.tags[0x010f].value, "Test");
      assert.equal(result.tags[0x010f].dataType.name, "ASCII");
    });

    it("parses minimal EXIF data with big-endian", () => {
      const exifData = createMinimalExifData(false);
      const result = parseExifData(exifData);

      assert.equal(result.byteOrder, "big-endian");
      assert(result.tags[0x010f]); // Make tag
      assert.equal(result.tags[0x010f].name, "Make");
      assert.equal(result.tags[0x010f].value, "Test");
    });

    it("handles inline values (≤4 bytes)", () => {
      const data = [];

      // EXIF identifier + TIFF header
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x49, 0x49); // Little endian
      data.push(0x2a, 0x00); // Magic number
      data.push(0x08, 0x00, 0x00, 0x00); // First IFD offset

      // IFD with SHORT value stored inline
      data.push(0x01, 0x00); // Entry count
      data.push(0x12, 0x01); // Tag (0x0112 = Orientation)
      data.push(0x03, 0x00); // Type (SHORT)
      data.push(0x01, 0x00, 0x00, 0x00); // Count (1)
      data.push(0x06, 0x00, 0x00, 0x00); // Value (6) stored inline
      data.push(0x00, 0x00, 0x00, 0x00); // Next IFD offset

      const exifData = new Uint8Array(data);
      const result = parseExifData(exifData);

      assert.equal(result.tags[0x0112].value, 6);
      assert.equal(result.tags[0x0112].name, "Orientation");
    });

    it("handles rational values", () => {
      const data = [];

      // EXIF identifier + TIFF header
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x49, 0x49); // Little endian
      data.push(0x2a, 0x00); // Magic number
      data.push(0x08, 0x00, 0x00, 0x00); // First IFD offset

      // IFD with rational value
      data.push(0x01, 0x00); // Entry count
      data.push(0x9a, 0x82); // Tag (0x829a = ExposureTime)
      data.push(0x05, 0x00); // Type (RATIONAL)
      data.push(0x01, 0x00, 0x00, 0x00); // Count (1)
      data.push(0x1a, 0x00, 0x00, 0x00); // Value offset
      data.push(0x00, 0x00, 0x00, 0x00); // Next IFD offset

      // Rational value: 1/60 (1/60 second exposure)
      data.push(0x01, 0x00, 0x00, 0x00); // Numerator (1)
      data.push(0x3c, 0x00, 0x00, 0x00); // Denominator (60)

      const exifData = new Uint8Array(data);
      const result = parseExifData(exifData);

      const exposure = result.tags[0x829a];
      assert.equal(exposure.value.numerator, 1);
      assert.equal(exposure.value.denominator, 60);
      assert(Math.abs(exposure.value.value - 1 / 60) < 0.001);
    });

    it("throws on invalid EXIF identifier", () => {
      const invalidData = new TextEncoder().encode("NotExif");

      assert.throws(() => {
        parseExifData(invalidData);
      }, /Invalid EXIF identifier/);
    });

    it("throws on invalid TIFF byte order", () => {
      const data = [];
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x12, 0x34); // Invalid byte order
      data.push(0x2a, 0x00);
      data.push(0x08, 0x00, 0x00, 0x00);

      assert.throws(() => {
        parseExifData(new Uint8Array(data));
      }, /Invalid TIFF byte order/);
    });

    it("throws on invalid TIFF magic number", () => {
      const data = [];
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x49, 0x49); // Little endian
      data.push(0x99, 0x00); // Invalid magic number
      data.push(0x08, 0x00, 0x00, 0x00);

      assert.throws(() => {
        parseExifData(new Uint8Array(data));
      }, /Invalid TIFF magic number/);
    });

    it("throws on data too short", () => {
      const shortData = new Uint8Array([0x45, 0x78]);

      assert.throws(() => {
        parseExifData(shortData);
      }, /APP1 data too short/);
    });

    it("throws on invalid data type", () => {
      assert.throws(() => {
        parseExifData("not a uint8array");
      }, /APP1 data must be Uint8Array/);
    });
  });

  describe("Metadata Extraction", () => {
    it("extracts camera information", () => {
      const exifData = {
        tags: {
          271: { value: "Canon" }, // Make
          272: { value: "EOS R5" }, // Model
          305: { value: "Adobe Lightroom" }, // Software
        },
      };

      const metadata = extractMetadata(exifData);

      assert.equal(metadata.camera.make, "Canon");
      assert.equal(metadata.camera.model, "EOS R5");
      assert.equal(metadata.camera.software, "Adobe Lightroom");
    });

    it("extracts image information", () => {
      const exifData = {
        tags: {
          256: { value: 6000 }, // ImageWidth
          257: { value: 4000 }, // ImageHeight
          274: { value: 1 }, // Orientation
          270: { value: "Beautiful landscape" }, // ImageDescription
        },
      };

      const metadata = extractMetadata(exifData);

      assert.equal(metadata.image.width, 6000);
      assert.equal(metadata.image.height, 4000);
      assert.equal(metadata.image.orientation, 1);
      assert.equal(metadata.image.description, "Beautiful landscape");
    });

    it("extracts camera settings", () => {
      const exifData = {
        tags: {
          33434: { value: { value: 1 / 60 } }, // ExposureTime
          33437: { value: { value: 2.8 } }, // FNumber
          34855: { value: 400 }, // ISO
          37386: { value: { value: 85 } }, // FocalLength
          37383: { value: 2 }, // MeteringMode
          37385: { value: 16 }, // Flash
        },
      };

      const metadata = extractMetadata(exifData);

      assert(Math.abs(metadata.settings.exposureTime - 1 / 60) < 0.001);
      assert.equal(metadata.settings.fNumber, 2.8);
      assert.equal(metadata.settings.iso, 400);
      assert.equal(metadata.settings.focalLength, 85);
      assert.equal(metadata.settings.meteringMode, 2);
      assert.equal(metadata.settings.flash, 16);
    });

    it("extracts timestamp information", () => {
      const exifData = {
        tags: {
          306: { value: "2023:12:25 14:30:00" }, // DateTime
          36867: { value: "2023:12:25 14:30:00" }, // DateTimeOriginal
          36868: { value: "2023:12:25 14:30:05" }, // DateTimeDigitized
        },
      };

      const metadata = extractMetadata(exifData);

      assert.equal(metadata.timestamp.modified, "2023:12:25 14:30:00");
      assert.equal(metadata.timestamp.original, "2023:12:25 14:30:00");
      assert.equal(metadata.timestamp.digitized, "2023:12:25 14:30:05");
    });

    it("extracts GPS coordinates", () => {
      const exifData = {
        tags: {
          1: { value: "N" }, // GPSLatitudeRef
          2: {
            // GPSLatitude
            value: [
              { value: 37 }, // Degrees
              { value: 46 }, // Minutes
              { value: 30.5 }, // Seconds
            ],
          },
          3: { value: "W" }, // GPSLongitudeRef
          4: {
            // GPSLongitude
            value: [
              { value: 122 }, // Degrees
              { value: 25 }, // Minutes
              { value: 10.2 }, // Seconds
            ],
          },
          6: { value: { value: 15.5 } }, // GPSAltitude
        },
      };

      const metadata = extractMetadata(exifData);

      // Latitude: 37 + 46/60 + 30.5/3600 ≈ 37.775139
      assert(Math.abs(metadata.gps.latitude - 37.775139) < 0.001);
      // Longitude: -(122 + 25/60 + 10.2/3600) ≈ -122.419500 (negative for West)
      assert(Math.abs(metadata.gps.longitude - -122.4195) < 0.001);
      assert.equal(metadata.gps.altitude, 15.5);
    });

    it("handles missing GPS data gracefully", () => {
      const exifData = {
        tags: {
          1: { value: "N" }, // GPSLatitudeRef without coordinates
        },
      };

      const metadata = extractMetadata(exifData);

      assert.equal(metadata.gps.latitude, undefined);
      assert.equal(metadata.gps.longitude, undefined);
    });

    it("handles empty EXIF data", () => {
      const metadata = extractMetadata({});

      assert.deepEqual(metadata.camera, {});
      assert.deepEqual(metadata.image, {});
      assert.deepEqual(metadata.settings, {});
      assert.deepEqual(metadata.timestamp, {});
      assert.deepEqual(metadata.gps, {});
    });
  });

  describe("Summary Generation", () => {
    it("generates summary for complete EXIF data", () => {
      const exifData = {
        byteOrder: "little-endian",
        tags: {
          271: { value: "Canon" },
          272: { value: "EOS R5" },
          33434: { value: { value: 1 / 60 } },
          2: { value: [{ value: 37 }] }, // GPS data
          4: { value: [{ value: 122 }] },
        },
        ifd: {
          IFD0: {},
          EXIF: {},
          GPS: {},
        },
        errors: [],
      };

      const summary = getExifSummary(exifData);

      assert.equal(summary.tagCount, 5);
      assert.equal(summary.ifdCount, 3);
      assert.equal(summary.errorCount, 0);
      assert.equal(summary.byteOrder, "little-endian");
      assert.equal(summary.hasGps, true);
      assert.equal(summary.hasThumbnail, false);
      assert.deepEqual(summary.ifdTypes, ["IFD0", "EXIF", "GPS"]);
    });

    it("generates summary for minimal EXIF data", () => {
      const exifData = {
        byteOrder: "big-endian",
        tags: {
          271: { value: "Test" },
        },
        ifd: {
          IFD0: {},
        },
        errors: ["Some parsing error"],
      };

      const summary = getExifSummary(exifData);

      assert.equal(summary.tagCount, 1);
      assert.equal(summary.ifdCount, 1);
      assert.equal(summary.errorCount, 1);
      assert.equal(summary.byteOrder, "big-endian");
      assert.equal(summary.hasGps, false);
      assert.equal(summary.hasThumbnail, false);
    });

    it("handles empty EXIF data in summary", () => {
      const summary = getExifSummary({});

      assert.equal(summary.tagCount, 0);
      assert.equal(summary.ifdCount, 0);
      assert.equal(summary.errorCount, 0);
      assert.equal(summary.byteOrder, "unknown");
      assert.equal(summary.hasGps, false);
      assert.equal(summary.hasThumbnail, false);
    });

    it("detects thumbnail presence", () => {
      const exifData = {
        ifd: {
          IFD1: {}, // Thumbnail IFD
        },
        tags: {},
      };

      const summary = getExifSummary(exifData);
      assert.equal(summary.hasThumbnail, true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles malformed IFD entries gracefully", () => {
      // This would require creating complex malformed data
      // For now, test that the parser doesn't crash on edge cases
      const exifData = createMinimalExifData(true);

      // Corrupt the IFD entry count to be very large
      exifData[14] = 0xff;
      exifData[15] = 0xff;

      // Should not crash, but may have errors
      const result = parseExifData(exifData);
      assert(Array.isArray(result.errors));
    });

    it("handles unknown data types", () => {
      const data = [];
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x49, 0x49); // Little endian
      data.push(0x2a, 0x00); // Magic number
      data.push(0x08, 0x00, 0x00, 0x00); // First IFD offset

      // IFD with unknown data type
      data.push(0x01, 0x00); // Entry count
      data.push(0x0f, 0x01); // Tag (Make)
      data.push(0xff, 0x00); // Invalid type (255)
      data.push(0x01, 0x00, 0x00, 0x00); // Count
      data.push(0x42, 0x00, 0x00, 0x00); // Value
      data.push(0x00, 0x00, 0x00, 0x00); // Next IFD offset

      const exifData = new Uint8Array(data);

      // Should handle gracefully - errors are logged but parsing continues
      const result = parseExifData(exifData);
      // The parser continues even with malformed entries, so we just check it doesn't crash
      assert(result);
      assert(Array.isArray(result.errors));
    });

    it("handles out-of-bounds offsets", () => {
      const data = [];
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x49, 0x49); // Little endian
      data.push(0x2a, 0x00); // Magic number
      data.push(0x08, 0x00, 0x00, 0x00); // First IFD offset

      // IFD with out-of-bounds value offset
      data.push(0x01, 0x00); // Entry count
      data.push(0x0f, 0x01); // Tag (Make)
      data.push(0x02, 0x00); // Type (ASCII)
      data.push(0x10, 0x00, 0x00, 0x00); // Count (16 bytes)
      data.push(0xff, 0xff, 0xff, 0xff); // Invalid offset (way out of bounds)
      data.push(0x00, 0x00, 0x00, 0x00); // Next IFD offset

      const exifData = new Uint8Array(data);

      // Should handle gracefully - parsing continues even with invalid offsets
      const result = parseExifData(exifData);
      // The parser should not crash and should return a result
      assert(result);
      assert(Array.isArray(result.errors));
    });

    it("handles circular IFD references", () => {
      const data = [];
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x49, 0x49); // Little endian
      data.push(0x2a, 0x00); // Magic number
      data.push(0x08, 0x00, 0x00, 0x00); // First IFD offset

      // IFD that points to itself
      data.push(0x00, 0x00); // Entry count (0)
      data.push(0x08, 0x00, 0x00, 0x00); // Next IFD offset (points back to itself)

      const exifData = new Uint8Array(data);
      const result = parseExifData(exifData);

      // Should not hang and should limit IFD processing
      assert(result.ifd);
    });

    it("handles very large rational denominators", () => {
      const data = [];
      data.push(...new TextEncoder().encode(EXIF_IDENTIFIER));
      data.push(0x49, 0x49); // Little endian
      data.push(0x2a, 0x00); // Magic number
      data.push(0x08, 0x00, 0x00, 0x00); // First IFD offset

      // IFD with rational value
      data.push(0x01, 0x00); // Entry count
      data.push(0x9a, 0x82); // Tag (ExposureTime)
      data.push(0x05, 0x00); // Type (RATIONAL)
      data.push(0x01, 0x00, 0x00, 0x00); // Count
      data.push(0x1a, 0x00, 0x00, 0x00); // Value offset
      data.push(0x00, 0x00, 0x00, 0x00); // Next IFD offset

      // Rational with zero denominator
      data.push(0x01, 0x00, 0x00, 0x00); // Numerator (1)
      data.push(0x00, 0x00, 0x00, 0x00); // Denominator (0)

      const exifData = new Uint8Array(data);
      const result = parseExifData(exifData);

      // Should handle division by zero gracefully
      const exposure = result.tags[0x829a];
      assert.equal(exposure.value.denominator, 0);
      assert.equal(exposure.value.value, 0); // Should be 0, not NaN or infinity
    });
  });
});
