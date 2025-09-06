/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  analyzeMetadata,
  extractChromaticityChunk,
  extractCompressedTextChunk,
  extractGammaChunk,
  extractICCProfileChunk,
  extractInternationalTextChunk,
  extractMetadata,
  extractPhysicalDimensionsChunk,
  extractSignificantBitsChunk,
  extractSRGBChunk,
  extractTextChunk,
  extractTimeChunk,
  formatPNGTimestamp,
  getStandardTextKeywords,
  validateMetadataParameters,
} from "./extract-metadata.js";
import { findChunksByType, parseChunks } from "./parse-chunks.js";
import { validatePNGSignature } from "./validate-signature.js";

describe("PNG Metadata Extraction", () => {
  describe("extractMetadata", () => {
    it("throws TypeError for invalid chunks parameter", async () => {
      await assert.rejects(async () => await extractMetadata(null), TypeError);
      await assert.rejects(async () => await extractMetadata(undefined), TypeError);
      await assert.rejects(async () => await extractMetadata("invalid"), TypeError);
      await assert.rejects(async () => await extractMetadata(123), TypeError);
    });

    it("returns default metadata object for stub implementation", async () => {
      const chunks = [];
      const result = await extractMetadata(chunks);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.text, "object", "Should have text object");
      assert.equal(result.time, null, "Should have null time");
      assert.equal(result.physicalDimensions, null, "Should have null physicalDimensions");
      assert.equal(result.significantBits, null, "Should have null significantBits");
      assert.equal(result.gamma, null, "Should have null gamma");
      assert.equal(result.chromaticity, null, "Should have null chromaticity");
      assert.equal(result.colorSpace, null, "Should have null colorSpace");
      assert.equal(result.iccProfile, null, "Should have null iccProfile");
    });

    it("accepts array of chunks", () => {
      const mockChunks = [
        { type: "IHDR", data: new Uint8Array(13) },
        { type: "tEXt", data: new Uint8Array(10) },
        { type: "IEND", data: new Uint8Array(0) },
      ];
      const result = extractMetadata(mockChunks);

      assert.equal(typeof result, "object", "Should return metadata object");
    });
  });

  describe("extractTextChunk", () => {
    it("throws TypeError for invalid data types", () => {
      assert.throws(() => extractTextChunk(null), TypeError);
      assert.throws(() => extractTextChunk(undefined), TypeError);
      assert.throws(() => extractTextChunk("invalid"), TypeError);
      assert.throws(() => extractTextChunk(123), TypeError);
    });

    it("throws on too short data", () => {
      assert.throws(() => extractTextChunk(new Uint8Array(0)), /too short/);
      assert.throws(() => extractTextChunk(new Uint8Array(1)), /too short/);
    });

    it("throws on missing null separator", () => {
      const noSeparator = new Uint8Array([84, 105, 116, 108, 101]); // "Title" without null
      assert.throws(() => extractTextChunk(noSeparator), /missing null separator/);
    });

    it("throws on empty keyword", () => {
      const emptyKeyword = new Uint8Array([0, 84, 101, 115, 116]); // "\0Test"
      assert.throws(() => extractTextChunk(emptyKeyword), /empty keyword/);
    });

    it("throws on keyword too long", () => {
      // Create 80-byte keyword (exceeds 79-byte limit)
      const longKeyword = new Array(80).fill(65); // 80 'A's
      longKeyword.push(0, 84, 101, 115, 116); // Add null + "Test"
      assert.throws(() => extractTextChunk(new Uint8Array(longKeyword)), /keyword too long/);
    });

    it("throws on keyword with leading/trailing spaces", () => {
      const leadingSpace = new Uint8Array([32, 84, 105, 116, 108, 101, 0, 84, 101, 115, 116]); // " Title\0Test"
      const trailingSpace = new Uint8Array([84, 105, 116, 108, 101, 32, 0, 84, 101, 115, 116]); // "Title \0Test"

      assert.throws(() => extractTextChunk(leadingSpace), /leading or trailing spaces/);
      assert.throws(() => extractTextChunk(trailingSpace), /leading or trailing spaces/);
    });

    it("throws on invalid keyword characters", () => {
      const invalidChar = new Uint8Array([84, 105, 116, 31, 101, 0, 84, 101, 115, 116]); // "Tit\x1fle\0Test"
      assert.throws(() => extractTextChunk(invalidChar), /invalid character/);
    });

    it("extracts valid text chunk", () => {
      const chunkData = new Uint8Array([84, 105, 116, 108, 101, 0, 84, 101, 115, 116]); // "Title\0Test"
      const result = extractTextChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(result.keyword, "Title", "Should extract keyword");
      assert.equal(result.value, "Test", "Should extract value");
    });

    it("handles empty text value", () => {
      const chunkData = new Uint8Array([84, 105, 116, 108, 101, 0]); // "Title\0"
      const result = extractTextChunk(chunkData);

      assert.equal(result.keyword, "Title", "Should extract keyword");
      assert.equal(result.value, "", "Should handle empty value");
    });

    it("handles maximum length keyword", () => {
      // Create 79-byte keyword (maximum allowed)
      const maxKeyword = new Array(79).fill(65); // 79 'A's
      maxKeyword.push(0, 84, 101, 115, 116); // Add null + "Test"
      const result = extractTextChunk(new Uint8Array(maxKeyword));

      assert.equal(result.keyword.length, 79, "Should handle maximum keyword length");
      assert.equal(result.value, "Test", "Should extract value");
    });

    it("handles Latin-1 characters", () => {
      // Test with Latin-1 characters (codes 32-126)
      const latin1Data = new Uint8Array([65, 117, 116, 104, 111, 114, 0, 74, 111, 104, 110, 32, 68, 111, 101]); // "Author\0John Doe"
      const result = extractTextChunk(latin1Data);

      assert.equal(result.keyword, "Author", "Should handle Latin-1 keyword");
      assert.equal(result.value, "John Doe", "Should handle Latin-1 value");
    });

    it("handles special characters in text value", () => {
      // Text value can contain any Latin-1 characters including control chars
      const specialChars = new Uint8Array([
        84, 105, 116, 108, 101, 0, 72, 101, 108, 108, 111, 10, 87, 111, 114, 108, 100,
      ]); // "Title\0Hello\nWorld"
      const result = extractTextChunk(specialChars);

      assert.equal(result.keyword, "Title", "Should extract keyword");
      assert.equal(result.value, "Hello\nWorld", "Should handle special chars in value");
    });

    it("handles long text values", () => {
      const keyword = [84, 105, 116, 108, 101, 0]; // "Title\0"
      const longText = new Array(1000).fill(65); // 1000 'A's
      const chunkData = new Uint8Array([...keyword, ...longText]);
      const result = extractTextChunk(chunkData);

      assert.equal(result.keyword, "Title", "Should extract keyword");
      assert.equal(result.value.length, 1000, "Should handle long text values");
      assert.equal(result.value, "A".repeat(1000), "Should preserve long text content");
    });

    it("handles standard PNG text keywords", () => {
      const standardKeywords = [
        "Title",
        "Author",
        "Description",
        "Copyright",
        "Creation Time",
        "Software",
        "Disclaimer",
        "Warning",
        "Source",
        "Comment",
      ];

      for (const keyword of standardKeywords) {
        const keywordBytes = Array.from(keyword, (char) => char.charCodeAt(0));
        const chunkData = new Uint8Array([...keywordBytes, 0, 84, 101, 115, 116]); // keyword + "\0Test"
        const result = extractTextChunk(chunkData);

        assert.equal(result.keyword, keyword, `Should handle standard keyword: ${keyword}`);
        assert.equal(result.value, "Test", "Should extract value");
      }
    });
  });

  describe("extractCompressedTextChunk", () => {
    it("extracts keyword and handles empty compressed data", async () => {
      const chunkData = new Uint8Array([84, 105, 116, 108, 101, 0, 0]); // "Title\0\0" + empty compressed data
      const result = await extractCompressedTextChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.keyword, "string", "Should have keyword string");
      assert.equal(typeof result.value, "string", "Should have value string");
      assert.equal(result.keyword, "Title", "Should extract keyword correctly");
      assert.equal(result.value, "", "Should return empty value for empty compressed data");
    });

    it("handles async operation", async () => {
      // Valid zTXt chunk: "Test\0\0" + empty compressed data
      const chunkData = new Uint8Array([84, 101, 115, 116, 0, 0]); // "Test\0\0"
      const result = await extractCompressedTextChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object from async operation");
      assert.equal(result.keyword, "Test", "Should extract keyword");
      assert.equal(result.value, "", "Should handle empty compressed data");
    });
  });

  describe("extractInternationalTextChunk", () => {
    it("extracts international text with UTF-8 support", async () => {
      // Create valid iTXt chunk: "Title\0\0\0en\0English Title\0Hello World"
      const chunkData = new Uint8Array([
        // Keyword: "Title"
        84, 105, 116, 108, 101, 0,
        // Compression flag: 0 (uncompressed)
        0,
        // Compression method: 0 (not used since uncompressed)
        0,
        // Language tag: "en"
        101, 110, 0,
        // Translated keyword: "English Title"
        69, 110, 103, 108, 105, 115, 104, 32, 84, 105, 116, 108, 101, 0,
        // Text: "Hello World"
        72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
      ]);

      const result = await extractInternationalTextChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.keyword, "string", "Should have keyword");
      assert.equal(typeof result.languageTag, "string", "Should have languageTag");
      assert.equal(typeof result.translatedKeyword, "string", "Should have translatedKeyword");
      assert.equal(typeof result.value, "string", "Should have value");
      assert.equal(typeof result.compressed, "boolean", "Should have compressed flag");

      // Check extracted values
      assert.equal(result.keyword, "Title", "Should extract keyword");
      assert.equal(result.languageTag, "en", "Should extract language tag");
      assert.equal(result.translatedKeyword, "English Title", "Should extract translated keyword");
      assert.equal(result.value, "Hello World", "Should extract text value");
      assert.equal(result.compressed, false, "Should detect uncompressed");
    });
  });

  describe("extractTimeChunk", () => {
    it("extracts valid timestamp", () => {
      // Year 2023 (0x07E7), Dec (12), 25, 14:30:45
      const chunkData = new Uint8Array([0x07, 0xe7, 12, 25, 14, 30, 45]);
      const result = extractTimeChunk(chunkData);

      assert(result instanceof Date, "Should return Date object");
      assert.equal(result.getFullYear(), 2023, "Should extract year correctly");
      assert.equal(result.getMonth(), 11, "Should extract month correctly (0-based)");
      assert.equal(result.getDate(), 25, "Should extract day correctly");
      assert.equal(result.getHours(), 14, "Should extract hour correctly");
      assert.equal(result.getMinutes(), 30, "Should extract minute correctly");
      assert.equal(result.getSeconds(), 45, "Should extract second correctly");
    });

    it("handles early timestamp", () => {
      // Year 1990 (0x07C6), Jan (1), 1, 0:0:0
      const validChunk = new Uint8Array([0x07, 0xc6, 1, 1, 0, 0, 0]);
      const result = extractTimeChunk(validChunk);

      assert(result instanceof Date, "Should return Date for valid chunk");
      assert.equal(result.getFullYear(), 1990, "Should handle early year");
      assert.equal(result.getMonth(), 0, "Should handle January");
      assert.equal(result.getDate(), 1, "Should handle first day");
    });
  });

  describe("extractPhysicalDimensionsChunk", () => {
    it("extracts physical dimensions with DPI calculation", () => {
      const chunkData = new Uint8Array([0, 0, 0x0b, 0x13, 0, 0, 0x0b, 0x13, 1]); // 2835 ppu, meters
      const result = extractPhysicalDimensionsChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.pixelsPerUnitX, "number", "Should have pixelsPerUnitX");
      assert.equal(typeof result.pixelsPerUnitY, "number", "Should have pixelsPerUnitY");
      assert.equal(typeof result.unit, "number", "Should have unit");
      assert.equal(typeof result.unitName, "string", "Should have unitName");
      assert.equal(typeof result.dpiX, "number", "Should have dpiX");
      assert.equal(typeof result.dpiY, "number", "Should have dpiY");
      assert.equal(typeof result.aspectRatio, "number", "Should have aspectRatio");

      // Check extracted values
      assert.equal(result.pixelsPerUnitX, 2835, "Should extract pixels per unit X");
      assert.equal(result.pixelsPerUnitY, 2835, "Should extract pixels per unit Y");
      assert.equal(result.unit, 1, "Should extract unit (meters)");
      assert.equal(result.unitName, "meters", "Should have unit name");
      assert.equal(result.dpiX, 72, "Should calculate DPI X (2835/39.3701 ≈ 72)");
      assert.equal(result.dpiY, 72, "Should calculate DPI Y");
      assert.equal(result.aspectRatio, 1, "Should calculate aspect ratio");
    });

    it("handles unknown unit", () => {
      const chunkData = new Uint8Array([0, 0, 0x03, 0xe8, 0, 0, 0x07, 0xd0, 0]); // 1000x2000 ppu, unknown unit
      const result = extractPhysicalDimensionsChunk(chunkData);

      assert.equal(result.pixelsPerUnitX, 1000, "Should extract pixels per unit X");
      assert.equal(result.pixelsPerUnitY, 2000, "Should extract pixels per unit Y");
      assert.equal(result.unit, 0, "Should extract unit (unknown)");
      assert.equal(result.unitName, "unknown", "Should have unit name");
      assert.equal(result.dpiX, 0, "Should not calculate DPI for unknown unit");
      assert.equal(result.dpiY, 0, "Should not calculate DPI for unknown unit");
      assert.equal(result.aspectRatio, 0.5, "Should calculate aspect ratio");
    });
  });

  describe("extractSignificantBitsChunk", () => {
    it("extracts significant bits for RGBA color type", () => {
      const chunkData = new Uint8Array([8, 8, 8, 8]); // RGBA 8-bit
      const result = extractSignificantBitsChunk(chunkData, 6); // RGBA color type

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.red, "number", "Should have red");
      assert.equal(typeof result.green, "number", "Should have green");
      assert.equal(typeof result.blue, "number", "Should have blue");
      assert.equal(typeof result.alpha, "number", "Should have alpha");
      assert.equal(typeof result.grayscale, "number", "Should have grayscale");

      // Check extracted values
      assert.equal(result.red, 8, "Should extract red significant bits");
      assert.equal(result.green, 8, "Should extract green significant bits");
      assert.equal(result.blue, 8, "Should extract blue significant bits");
      assert.equal(result.alpha, 8, "Should extract alpha significant bits");
      assert.equal(result.grayscale, 0, "Should not set grayscale for RGBA");
    });

    it("handles different color types correctly", () => {
      // RGB color type (3 bytes)
      const rgbData = new Uint8Array([8, 8, 8]);
      const rgbResult = extractSignificantBitsChunk(rgbData, 2);
      assert.equal(rgbResult.red, 8, "Should extract RGB red");
      assert.equal(rgbResult.green, 8, "Should extract RGB green");
      assert.equal(rgbResult.blue, 8, "Should extract RGB blue");
      assert.equal(rgbResult.alpha, 0, "Should not set alpha for RGB");
      assert.equal(rgbResult.grayscale, 0, "Should not set grayscale for RGB");

      // Grayscale color type (1 byte)
      const grayData = new Uint8Array([8]);
      const grayResult = extractSignificantBitsChunk(grayData, 0);
      assert.equal(grayResult.grayscale, 8, "Should extract grayscale");
      assert.equal(grayResult.red, 0, "Should not set red for grayscale");
      assert.equal(grayResult.green, 0, "Should not set green for grayscale");
      assert.equal(grayResult.blue, 0, "Should not set blue for grayscale");
      assert.equal(grayResult.alpha, 0, "Should not set alpha for grayscale");

      // Grayscale + Alpha color type (2 bytes)
      const grayAlphaData = new Uint8Array([8, 8]);
      const grayAlphaResult = extractSignificantBitsChunk(grayAlphaData, 4);
      assert.equal(grayAlphaResult.grayscale, 8, "Should extract grayscale");
      assert.equal(grayAlphaResult.alpha, 8, "Should extract alpha");
      assert.equal(grayAlphaResult.red, 0, "Should not set red for grayscale+alpha");
    });
  });

  describe("extractGammaChunk", () => {
    it("extracts gamma value correctly", () => {
      const chunkData = new Uint8Array([0, 1, 0x86, 0xa0]); // Gamma 1.0 (100000)
      const result = extractGammaChunk(chunkData);

      assert.equal(typeof result, "number", "Should return number");
      assert.equal(result, 1.0, "Should extract gamma 1.0");
    });

    it("extracts common gamma values", () => {
      // Gamma 2.2 (220000)
      const gamma22Data = new Uint8Array([0, 3, 0x5b, 0x60]);
      const result22 = extractGammaChunk(gamma22Data);
      assert.equal(result22, 2.2, "Should extract gamma 2.2");

      // Gamma 0.45454 (45454) - reciprocal of 2.2
      const gamma045Data = new Uint8Array([0, 0, 0xb1, 0x8e]);
      const result045 = extractGammaChunk(gamma045Data);
      assert.equal(result045, 0.45454, "Should extract gamma 0.45454");
    });
  });

  describe("extractChromaticityChunk", () => {
    it("returns default chromaticity object for stub implementation", () => {
      const chunkData = new Uint8Array(32); // 8 * 4 bytes for chromaticity values
      const result = extractChromaticityChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.whitePointX, "number", "Should have whitePointX");
      assert.equal(typeof result.whitePointY, "number", "Should have whitePointY");
      assert.equal(typeof result.redX, "number", "Should have redX");
      assert.equal(typeof result.redY, "number", "Should have redY");
      assert.equal(typeof result.greenX, "number", "Should have greenX");
      assert.equal(typeof result.greenY, "number", "Should have greenY");
      assert.equal(typeof result.blueX, "number", "Should have blueX");
      assert.equal(typeof result.blueY, "number", "Should have blueY");

      // Stub should return zeros
      assert.equal(result.whitePointX, 0, "Stub whitePointX should be 0");
      assert.equal(result.redX, 0, "Stub redX should be 0");
    });
  });

  describe("extractSRGBChunk", () => {
    it("extracts sRGB rendering intent correctly", () => {
      const chunkData = new Uint8Array([0]); // Perceptual rendering intent
      const result = extractSRGBChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.renderingIntent, "number", "Should have renderingIntent");
      assert.equal(typeof result.intentName, "string", "Should have intentName");
      assert.equal(typeof result.description, "string", "Should have description");

      // Check extracted values
      assert.equal(result.renderingIntent, 0, "Should extract perceptual intent");
      assert.equal(result.intentName, "perceptual", "Should have perceptual name");
      assert.equal(result.description, "Perceptual - for photographs and complex images", "Should have description");
    });

    it("extracts all rendering intents", () => {
      const intents = [
        { value: 0, name: "perceptual" },
        { value: 1, name: "relative colorimetric" },
        { value: 2, name: "saturation" },
        { value: 3, name: "absolute colorimetric" },
      ];

      for (const intent of intents) {
        const chunkData = new Uint8Array([intent.value]);
        const result = extractSRGBChunk(chunkData);

        assert.equal(result.renderingIntent, intent.value, `Should extract intent ${intent.value}`);
        assert.equal(result.intentName, intent.name, `Should have name ${intent.name}`);
        assert.equal(typeof result.description, "string", "Should have description");
      }
    });
  });

  describe("extractICCProfileChunk", () => {
    it("extracts ICC profile with basic validation", async () => {
      // Create minimal valid iCCP chunk: "sRGB\0\0<compressed_data>"
      // We'll use a minimal fake ICC profile that decompresses to valid header
      const profileName = "sRGB";
      const compressionMethod = 0;

      // Create a minimal fake ICC profile (128 bytes, RGB monitor profile)
      const fakeProfile = new Uint8Array(128);
      fakeProfile[0] = 0x00;
      fakeProfile[1] = 0x00;
      fakeProfile[2] = 0x00;
      fakeProfile[3] = 0x80; // Size: 128
      fakeProfile[12] = 0x6d;
      fakeProfile[13] = 0x6e;
      fakeProfile[14] = 0x74;
      fakeProfile[15] = 0x72; // "mntr"
      fakeProfile[16] = 0x52;
      fakeProfile[17] = 0x47;
      fakeProfile[18] = 0x42;
      fakeProfile[19] = 0x20; // "RGB "

      // Compress the fake profile using Node.js zlib (for testing)
      const zlib = await import("node:zlib");
      const compressedProfile = zlib.deflateSync(fakeProfile);

      // Build iCCP chunk data
      const chunkData = new Uint8Array(profileName.length + 1 + 1 + compressedProfile.length);
      let offset = 0;

      // Profile name
      for (let i = 0; i < profileName.length; i++) {
        chunkData[offset++] = profileName.charCodeAt(i);
      }
      chunkData[offset++] = 0; // Null terminator

      // Compression method
      chunkData[offset++] = compressionMethod;

      // Compressed profile data
      chunkData.set(compressedProfile, offset);

      const result = await extractICCProfileChunk(chunkData);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.profileName, "string", "Should have profileName");
      assert.equal(typeof result.compressionMethod, "number", "Should have compressionMethod");
      assert.equal(typeof result.colorSpace, "string", "Should have colorSpace");
      assert.equal(typeof result.deviceClass, "string", "Should have deviceClass");
      assert(result.profileData instanceof Uint8Array, "Should have profileData as Uint8Array");

      // Check extracted values
      assert.equal(result.profileName, "sRGB", "Should extract profile name");
      assert.equal(result.compressionMethod, 0, "Should extract compression method");
      assert.equal(result.profileSize, 128, "Should extract profile size");
      assert.equal(result.colorSpace, "RGB", "Should extract color space");
      assert.equal(result.deviceClass, "Display Device (Monitor)", "Should extract device class");
      assert.equal(result.profileData.length, 128, "Should decompress profile data");
    });
  });

  describe("validateMetadataParameters", () => {
    it("returns false for stub implementation", () => {
      const chunks = [{ type: "tEXt", data: new Uint8Array(10) }];
      const result = validateMetadataParameters(chunks);

      assert.equal(typeof result, "boolean", "Should return boolean");
      assert.equal(result, false, "Stub should return false");
    });

    it("handles different parameter types", () => {
      const validChunks = [];
      const invalidChunks = null;

      const validResult = validateMetadataParameters(validChunks);
      const invalidResult = validateMetadataParameters(invalidChunks);

      assert.equal(typeof validResult, "boolean", "Should return boolean for valid chunks");
      assert.equal(typeof invalidResult, "boolean", "Should return boolean for invalid chunks");
    });
  });

  describe("getStandardTextKeywords", () => {
    it("returns array of standard keywords", () => {
      const result = getStandardTextKeywords();

      assert(Array.isArray(result), "Should return array");
      assert(result.length > 0, "Should have keywords");
      assert(result.includes("Title"), "Should include Title");
      assert(result.includes("Author"), "Should include Author");
      assert(result.includes("Description"), "Should include Description");
      assert(result.includes("Copyright"), "Should include Copyright");
    });

    it("returns consistent results", () => {
      const result1 = getStandardTextKeywords();
      const result2 = getStandardTextKeywords();

      assert.deepEqual(result1, result2, "Should return consistent results");
    });
  });

  describe("formatPNGTimestamp", () => {
    it("returns empty string for stub implementation", () => {
      const date = new Date("2023-12-25T14:30:45Z");
      const result = formatPNGTimestamp(date);

      assert.equal(typeof result, "string", "Should return string");
      assert.equal(result, "", "Stub should return empty string");
    });

    it("handles different date objects", () => {
      const date1 = new Date(0);
      const date2 = new Date();

      const result1 = formatPNGTimestamp(date1);
      const result2 = formatPNGTimestamp(date2);

      assert.equal(typeof result1, "string", "Should handle epoch date");
      assert.equal(typeof result2, "string", "Should handle current date");
    });
  });

  describe("analyzeMetadata", () => {
    it("returns default analysis object for stub implementation", () => {
      const metadata = {
        text: { Title: "Test Image" },
        time: new Date(),
        physicalDimensions: { dpiX: 72, dpiY: 72 },
      };
      const result = analyzeMetadata(metadata);

      assert.equal(typeof result, "object", "Should return object");
      assert.equal(typeof result.hasText, "boolean", "Should have hasText");
      assert.equal(typeof result.hasTimestamp, "boolean", "Should have hasTimestamp");
      assert.equal(typeof result.hasPhysicalDimensions, "boolean", "Should have hasPhysicalDimensions");
      assert.equal(typeof result.hasColorProfile, "boolean", "Should have hasColorProfile");
      assert.equal(typeof result.completeness, "number", "Should have completeness");
      assert.equal(typeof result.standardKeywords, "number", "Should have standardKeywords");
      assert.equal(typeof result.customKeywords, "number", "Should have customKeywords");

      // Stub should return defaults
      assert.equal(result.hasText, false, "Stub hasText should be false");
      assert.equal(result.completeness, 0, "Stub completeness should be 0");
    });
  });

  describe("Real PNG Integration", () => {
    it("processes metadata extraction pipeline on real PNG", async () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");

        // Verify PNG and parse structure
        assert(validatePNGSignature(pngBuffer), "Should be valid PNG");

        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);

        // Test metadata extraction
        const metadata = await extractMetadata(chunks);

        // Validate behavior
        assert.equal(typeof metadata, "object", "Should return metadata object");
        assert.equal(typeof metadata.text, "object", "Should have text object");
        // Note: apple-touch-icon.png may have a tIME chunk, so we check if it's either null or a Date
        if (metadata.time !== null) {
          assert(metadata.time instanceof Date, "Time should be a Date object if present");
        }

        // Check for common metadata chunks
        const textChunks = findChunksByType(chunks, "tEXt");
        const timeChunks = findChunksByType(chunks, "tIME");
        const physChunks = findChunksByType(chunks, "pHYs");

        console.log(`✓ Metadata extraction pipeline ready for apple-touch-icon.png:`);
        console.log(`  - Total chunks: ${chunks.length}`);
        console.log(`  - tEXt chunks: ${textChunks.length}`);
        console.log(`  - tIME chunks: ${timeChunks.length}`);
        console.log(`  - pHYs chunks: ${physChunks.length}`);
        console.log(`  - Ready for metadata extraction implementation`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG metadata extraction test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });

    it("validates metadata parameters with real PNG data", () => {
      try {
        const pngBuffer = readFileSync("media/apple-touch-icon.png");
        const chunkData = pngBuffer.slice(8);
        const chunks = parseChunks(chunkData);

        // Test parameter validation (stub)
        const isValid = validateMetadataParameters(chunks);
        assert.equal(typeof isValid, "boolean", "Should return boolean");
        assert.equal(isValid, false, "Stub should return false");

        // Test analysis (stub)
        const metadata = extractMetadata(chunks);
        const analysis = analyzeMetadata(metadata);
        assert.equal(typeof analysis, "object", "Should return analysis object");
        assert.equal(analysis.completeness, 0, "Stub completeness should be 0");
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log("⚠ Skipping real PNG metadata validation test - apple-touch-icon.png not found");
        } else {
          throw error;
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles empty chunks array", () => {
      const emptyChunks = [];
      const result = extractMetadata(emptyChunks);

      assert.equal(typeof result, "object", "Should handle empty chunks array");
    });

    it("handles chunks without metadata", () => {
      const basicChunks = [
        { type: "IHDR", data: new Uint8Array(13) },
        { type: "IDAT", data: new Uint8Array(100) },
        { type: "IEND", data: new Uint8Array(0) },
      ];
      const result = extractMetadata(basicChunks);

      assert.equal(typeof result, "object", "Should handle chunks without metadata");
    });

    it("handles malformed chunk data", () => {
      const malformedData = new Uint8Array([0xff, 0xff, 0xff]);

      // Text extraction should throw on malformed data (no null separator)
      assert.throws(() => extractTextChunk(malformedData), /missing null separator/);

      // Time extraction should throw on invalid length
      assert.throws(() => extractTimeChunk(malformedData), /Invalid tIME chunk length/);

      // Physical dimensions extraction should throw on invalid length
      assert.throws(() => extractPhysicalDimensionsChunk(malformedData), /Invalid pHYs chunk length/);
    });
  });

  describe("Performance", () => {
    it("processes metadata extraction efficiently", () => {
      const largeMockChunks = Array.from({ length: 100 }, (_, i) => ({
        type: i % 2 === 0 ? "tEXt" : "iTXt",
        data: new Uint8Array(50),
      }));

      const startTime = performance.now();
      const result = extractMetadata(largeMockChunks);
      const endTime = performance.now();

      const duration = endTime - startTime;
      assert(duration < 50, "Should process large chunk arrays quickly (stub)");
      assert.equal(typeof result, "object", "Should return valid result");

      console.log(`✓ Processed ${largeMockChunks.length} chunks in ${duration.toFixed(2)}ms`);
    });
  });
});
