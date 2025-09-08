/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file EXIF metadata extraction from JPEG APP1 segments.
 *
 * Implements EXIF 2.32 and TIFF 6.0 specifications for extracting camera settings,
 * timestamps, GPS coordinates, and technical parameters from JPEG files. Handles
 * both little-endian and big-endian byte ordering with comprehensive error checking
 * and graceful degradation for malformed or non-standard EXIF data.
 */

/**
 * EXIF identifier in APP1 segment.
 * Must appear at the start of EXIF data.
 *
 * @type {string}
 */
export const EXIF_IDENTIFIER = "Exif\0\0";

/**
 * TIFF byte order markers.
 * Indicate endianness of TIFF data.
 */
export const TIFF_BYTE_ORDER = {
  /** Little-endian (Intel format) */
  LITTLE_ENDIAN: 0x4949, // "II"
  /** Big-endian (Motorola format) */
  BIG_ENDIAN: 0x4d4d, // "MM"
};

/**
 * TIFF magic number.
 * Always 42 (0x002A) in TIFF files.
 *
 * @type {number}
 */
export const TIFF_MAGIC_NUMBER = 0x002a;

/**
 * EXIF data types with their sizes in bytes.
 * Based on TIFF 6.0 specification.
 */
export const EXIF_DATA_TYPES = {
  BYTE: { id: 1, size: 1, name: "BYTE" },
  ASCII: { id: 2, size: 1, name: "ASCII" },
  SHORT: { id: 3, size: 2, name: "SHORT" },
  LONG: { id: 4, size: 4, name: "LONG" },
  RATIONAL: { id: 5, size: 8, name: "RATIONAL" },
  SBYTE: { id: 6, size: 1, name: "SBYTE" },
  UNDEFINED: { id: 7, size: 1, name: "UNDEFINED" },
  SSHORT: { id: 8, size: 2, name: "SSHORT" },
  SLONG: { id: 9, size: 4, name: "SLONG" },
  SRATIONAL: { id: 10, size: 8, name: "SRATIONAL" },
  FLOAT: { id: 11, size: 4, name: "FLOAT" },
  DOUBLE: { id: 12, size: 8, name: "DOUBLE" },
};

/**
 * Common EXIF tags with their descriptions.
 * Based on EXIF 2.32 specification.
 * @type {{[key: number]: {name: string, description: string}}}
 */
export const EXIF_TAGS = {
  // Image structure
  256: { name: "ImageWidth", description: "Image width in pixels" },
  257: { name: "ImageHeight", description: "Image height in pixels" },
  258: { name: "BitsPerSample", description: "Number of bits per component" },
  259: { name: "Compression", description: "Compression scheme" },
  262: { name: "PhotometricInterpretation", description: "Pixel composition" },
  270: { name: "ImageDescription", description: "Image description" },
  271: { name: "Make", description: "Camera manufacturer" },
  272: { name: "Model", description: "Camera model" },
  274: { name: "Orientation", description: "Image orientation" },
  282: { name: "XResolution", description: "Horizontal resolution" },
  283: { name: "YResolution", description: "Vertical resolution" },
  296: { name: "ResolutionUnit", description: "Unit of resolution" },
  305: { name: "Software", description: "Software used" },
  306: { name: "DateTime", description: "File change date and time" },
  318: { name: "WhitePoint", description: "White point chromaticity" },
  319: { name: "PrimaryChromaticities", description: "Primary chromaticities" },

  // EXIF-specific tags
  33434: { name: "ExposureTime", description: "Exposure time (seconds)" },
  33437: { name: "FNumber", description: "F-number (aperture)" },
  34850: { name: "ExposureProgram", description: "Exposure program" },
  34852: { name: "SpectralSensitivity", description: "Spectral sensitivity" },
  34855: { name: "ISOSpeedRatings", description: "ISO speed rating" },
  34856: { name: "OECF", description: "Optoelectric conversion factor" },
  36864: { name: "ExifVersion", description: "EXIF version" },
  36867: { name: "DateTimeOriginal", description: "Date and time of original image" },
  36868: { name: "DateTimeDigitized", description: "Date and time of digital creation" },
  37121: { name: "ComponentsConfiguration", description: "Components configuration" },
  37122: { name: "CompressedBitsPerPixel", description: "Compressed bits per pixel" },
  37377: { name: "ShutterSpeedValue", description: "Shutter speed (APEX)" },
  37378: { name: "ApertureValue", description: "Aperture value (APEX)" },
  37379: { name: "BrightnessValue", description: "Brightness value (APEX)" },
  37380: { name: "ExposureBiasValue", description: "Exposure bias (APEX)" },
  37381: { name: "MaxApertureValue", description: "Maximum aperture value" },
  37382: { name: "SubjectDistance", description: "Subject distance (meters)" },
  37383: { name: "MeteringMode", description: "Metering mode" },
  37384: { name: "LightSource", description: "Light source" },
  37385: { name: "Flash", description: "Flash settings" },
  37386: { name: "FocalLength", description: "Focal length (mm)" },
  37500: { name: "MakerNote", description: "Manufacturer-specific data" },
  37510: { name: "UserComment", description: "User comment" },
  37520: { name: "SubSecTime", description: "DateTime subseconds" },
  37521: { name: "SubSecTimeOriginal", description: "DateTimeOriginal subseconds" },
  37522: { name: "SubSecTimeDigitized", description: "DateTimeDigitized subseconds" },

  // GPS tags
  0: { name: "GPSVersionID", description: "GPS version" },
  1: { name: "GPSLatitudeRef", description: "North or South latitude" },
  2: { name: "GPSLatitude", description: "Latitude coordinates" },
  3: { name: "GPSLongitudeRef", description: "East or West longitude" },
  4: { name: "GPSLongitude", description: "Longitude coordinates" },
  5: { name: "GPSAltitudeRef", description: "Altitude reference" },
  6: { name: "GPSAltitude", description: "Altitude (meters)" },
  7: { name: "GPSTimeStamp", description: "GPS time (UTC)" },
  8: { name: "GPSSatellites", description: "GPS satellites used" },
  9: { name: "GPSStatus", description: "GPS receiver status" },
  10: { name: "GPSMeasureMode", description: "GPS measurement mode" },
  11: { name: "GPSDOP", description: "GPS measurement precision" },
  12: { name: "GPSSpeedRef", description: "Speed unit" },
  13: { name: "GPSSpeed", description: "GPS receiver speed" },
  29: { name: "GPSDateStamp", description: "GPS date (UTC)" },
};

/**
 * IFD (Image File Directory) types.
 * Different categories of EXIF data.
 */
export const IFD_TYPES = {
  /** Main image tags */
  IMAGE: "image",
  /** EXIF-specific tags */
  EXIF: "exif",
  /** GPS-related tags */
  GPS: "gps",
  /** Interoperability tags */
  INTEROP: "interop",
  /** Thumbnail image tags */
  THUMBNAIL: "thumbnail",
};

/**
 * Create a data reader for EXIF data with endianness handling.
 * Provides methods to read different data types with correct byte order.
 *
 * @param {Uint8Array} data - EXIF data buffer
 * @param {boolean} littleEndian - Whether data is little-endian
 * @returns {{
 *   readUint8: (offset: number) => number,
 *   readUint16: (offset: number) => number,
 *   readUint32: (offset: number) => number,
 *   readInt32: (offset: number) => number,
 *   readString: (offset: number, length: number) => string,
 *   readRational: (offset: number) => {numerator: number, denominator: number, value: number},
 *   readSRational: (offset: number) => {numerator: number, denominator: number, value: number},
 *   isValidOffset: (offset: number, size?: number) => boolean
 * }} Data reader with type-specific methods
 * @private
 */
function createDataReader(data, littleEndian) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  return {
    /**
     * Read unsigned 8-bit integer.
     * @param {number} offset - Byte offset
     * @returns {number} Value
     */
    readUint8(offset) {
      if (offset < 0 || offset >= data.length) {
        throw new Error(`Offset ${offset} out of bounds`);
      }
      return view.getUint8(offset);
    },

    /**
     * Read unsigned 16-bit integer.
     * @param {number} offset - Byte offset
     * @returns {number} Value
     */
    readUint16(offset) {
      if (offset < 0 || offset + 1 >= data.length) {
        throw new Error(`Offset ${offset} out of bounds`);
      }
      return view.getUint16(offset, littleEndian);
    },

    /**
     * Read unsigned 32-bit integer.
     * @param {number} offset - Byte offset
     * @returns {number} Value
     */
    readUint32(offset) {
      if (offset < 0 || offset + 3 >= data.length) {
        throw new Error(`Offset ${offset} out of bounds`);
      }
      return view.getUint32(offset, littleEndian);
    },

    /**
     * Read signed 32-bit integer.
     * @param {number} offset - Byte offset
     * @returns {number} Value
     */
    readInt32(offset) {
      if (offset < 0 || offset + 3 >= data.length) {
        throw new Error(`Offset ${offset} out of bounds`);
      }
      return view.getInt32(offset, littleEndian);
    },

    /**
     * Read ASCII string.
     * @param {number} offset - Byte offset
     * @param {number} length - String length
     * @returns {string} String value
     */
    readString(offset, length) {
      if (offset < 0 || offset + length > data.length) {
        throw new Error(`String offset ${offset} length ${length} out of bounds`);
      }

      const bytes = data.slice(offset, offset + length);
      // Remove null terminator if present
      const nullIndex = bytes.indexOf(0);
      const stringBytes = nullIndex >= 0 ? bytes.slice(0, nullIndex) : bytes;

      return new TextDecoder("utf-8").decode(stringBytes);
    },

    /**
     * Read rational (fraction) value.
     * @param {number} offset - Byte offset
     * @returns {{numerator: number, denominator: number, value: number}} Rational value
     */
    readRational(offset) {
      const numerator = this.readUint32(offset);
      const denominator = this.readUint32(offset + 4);
      const value = denominator !== 0 ? numerator / denominator : 0;

      return { numerator, denominator, value };
    },

    /**
     * Read signed rational value.
     * @param {number} offset - Byte offset
     * @returns {{numerator: number, denominator: number, value: number}} Signed rational value
     */
    readSRational(offset) {
      const numerator = this.readInt32(offset);
      const denominator = this.readInt32(offset + 4);
      const value = denominator !== 0 ? numerator / denominator : 0;

      return { numerator, denominator, value };
    },

    /**
     * Check if offset is within bounds.
     * @param {number} offset - Byte offset
     * @param {number} size - Required size
     * @returns {boolean} Whether access is safe
     */
    isValidOffset(offset, size = 1) {
      return offset >= 0 && offset + size <= data.length;
    },
  };
}

/**
 * Parse TIFF header from EXIF data.
 * Extracts byte order, magic number, and first IFD offset.
 *
 * @param {Uint8Array} data - EXIF data starting after "Exif\0\0"
 * @returns {{littleEndian: boolean, firstIfdOffset: number}} TIFF header info
 * @throws {Error} If TIFF header is invalid
 * @private
 */
function parseTiffHeader(data) {
  if (data.length < 8) {
    throw new Error("TIFF header too short");
  }

  // Read byte order marker
  const byteOrder = (data[0] << 8) | data[1];
  let littleEndian;

  switch (byteOrder) {
    case TIFF_BYTE_ORDER.LITTLE_ENDIAN:
      littleEndian = true;
      break;
    case TIFF_BYTE_ORDER.BIG_ENDIAN:
      littleEndian = false;
      break;
    default:
      throw new Error(`Invalid TIFF byte order: 0x${byteOrder.toString(16)}`);
  }

  const reader = createDataReader(data, littleEndian);

  // Verify magic number
  const magic = reader.readUint16(2);
  if (magic !== TIFF_MAGIC_NUMBER) {
    throw new Error(`Invalid TIFF magic number: 0x${magic.toString(16)}`);
  }

  // Get first IFD offset
  const firstIfdOffset = reader.readUint32(4);

  return {
    littleEndian,
    firstIfdOffset,
  };
}

/**
 * Read IFD entry from EXIF data.
 * Parses tag, type, count, and value/offset from 12-byte IFD entry.
 *
 * @param {ReturnType<typeof createDataReader>} reader - Data reader
 * @param {number} offset - Entry offset
 * @returns {{
 *   tag: number,
 *   type: number,
 *   count: number,
 *   dataType: {id: number, size: number, name: string},
 *   value: any,
 *   offset: number
 * }} IFD entry data
 * @private
 */
function readIfdEntry(reader, offset) {
  const tag = reader.readUint16(offset);
  const type = reader.readUint16(offset + 2);
  const count = reader.readUint32(offset + 4);
  const valueOffset = offset + 8;

  // Find data type info
  const dataType = Object.values(EXIF_DATA_TYPES).find((dt) => dt.id === type);
  if (!dataType) {
    throw new Error(`Unknown EXIF data type: ${type}`);
  }

  const totalSize = dataType.size * count;
  let value;
  let actualOffset = valueOffset;

  if (totalSize <= 4) {
    // Value stored inline in the entry
    value = readTagValue(reader, valueOffset, dataType, count);
  } else {
    // Value stored at offset
    actualOffset = reader.readUint32(valueOffset);
    if (!reader.isValidOffset(actualOffset, totalSize)) {
      throw new Error(`Invalid value offset ${actualOffset} for tag 0x${tag.toString(16)}`);
    }
    value = readTagValue(reader, actualOffset, dataType, count);
  }

  return {
    tag,
    type,
    count,
    dataType,
    value,
    offset: actualOffset,
  };
}

/**
 * Read tag value based on data type and count.
 * Handles different EXIF data types with proper conversion.
 *
 * @param {ReturnType<typeof createDataReader>} reader - Data reader
 * @param {number} offset - Value offset
 * @param {{id: number, size: number, name: string}} dataType - EXIF data type info
 * @param {number} count - Number of values
 * @returns {*} Parsed value(s)
 * @private
 */
function readTagValue(reader, offset, dataType, count) {
  const values = [];

  for (let i = 0; i < count; i++) {
    const itemOffset = offset + i * dataType.size;

    switch (dataType.id) {
      case EXIF_DATA_TYPES.BYTE.id:
      case EXIF_DATA_TYPES.UNDEFINED.id:
        values.push(reader.readUint8(itemOffset));
        break;

      case EXIF_DATA_TYPES.ASCII.id:
        // ASCII is handled as a single string
        return reader.readString(offset, count);

      case EXIF_DATA_TYPES.SHORT.id:
        values.push(reader.readUint16(itemOffset));
        break;

      case EXIF_DATA_TYPES.LONG.id:
        values.push(reader.readUint32(itemOffset));
        break;

      case EXIF_DATA_TYPES.RATIONAL.id:
        values.push(reader.readRational(itemOffset));
        break;

      case EXIF_DATA_TYPES.SLONG.id:
        values.push(reader.readInt32(itemOffset));
        break;

      case EXIF_DATA_TYPES.SRATIONAL.id:
        values.push(reader.readSRational(itemOffset));
        break;

      default:
        // For unsupported types, store raw bytes
        values.push(reader.readUint8(itemOffset));
        break;
    }
  }

  return count === 1 ? values[0] : values;
}

/**
 * Parse IFD (Image File Directory) from EXIF data.
 * Reads all entries in an IFD and returns structured data.
 *
 * @param {ReturnType<typeof createDataReader>} reader - Data reader
 * @param {number} ifdOffset - IFD offset
 * @param {string} ifdType - IFD type for categorization
 * @returns {{entries: {[key: number]: any}, nextIfdOffset: number}} IFD data
 * @throws {Error} If IFD is invalid
 * @private
 */
function parseIfd(reader, ifdOffset, ifdType = IFD_TYPES.IMAGE) {
  if (!reader.isValidOffset(ifdOffset, 2)) {
    throw new Error(`Invalid IFD offset: ${ifdOffset}`);
  }

  const entryCount = reader.readUint16(ifdOffset);
  /** @type {{[key: number]: any}} */
  const entries = {};

  // Read all IFD entries
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;

    if (!reader.isValidOffset(entryOffset, 12)) {
      throw new Error(`IFD entry ${i} out of bounds`);
    }

    try {
      const entry = readIfdEntry(reader, entryOffset);
      const tagInfo = EXIF_TAGS[entry.tag];

      entries[entry.tag] = {
        ...entry,
        name: tagInfo?.name || `Unknown_0x${entry.tag.toString(16)}`,
        description: tagInfo?.description || "Unknown tag",
        ifdType,
      };
    } catch (error) {
      // Skip malformed entries but continue processing
      console.warn(`Failed to parse IFD entry ${i}: ${error.message}`);
    }
  }

  // Read next IFD offset
  const nextIfdOffsetLocation = ifdOffset + 2 + entryCount * 12;
  let nextIfdOffset = 0;

  if (reader.isValidOffset(nextIfdOffsetLocation, 4)) {
    nextIfdOffset = reader.readUint32(nextIfdOffsetLocation);
  }

  return {
    entries,
    nextIfdOffset,
  };
}

/**
 * Parse EXIF data from APP1 segment.
 * Extracts and structures all EXIF metadata from JPEG APP1 segment.
 *
 * @param {Uint8Array} app1Data - Complete APP1 segment data
 * @returns {{
 *   byteOrder: string,
 *   tags: {[key: number]: any},
 *   ifd: {[key: string]: any},
 *   errors: string[]
 * }} Parsed EXIF metadata
 * @throws {Error} If APP1 data is invalid
 */
export function parseExifData(app1Data) {
  // Validate APP1 data
  if (!(app1Data instanceof Uint8Array)) {
    throw new Error("APP1 data must be Uint8Array");
  }

  if (app1Data.length < EXIF_IDENTIFIER.length) {
    throw new Error("APP1 data too short");
  }

  // Check for EXIF identifier
  const identifier = new TextDecoder("ascii").decode(app1Data.slice(0, EXIF_IDENTIFIER.length));
  if (identifier !== EXIF_IDENTIFIER) {
    throw new Error(`Invalid EXIF identifier: ${identifier}`);
  }

  // Extract TIFF data (after EXIF identifier)
  const tiffData = app1Data.slice(EXIF_IDENTIFIER.length);
  const tiffHeader = parseTiffHeader(tiffData);
  const reader = createDataReader(tiffData, tiffHeader.littleEndian);

  const exifData = {
    byteOrder: tiffHeader.littleEndian ? "little-endian" : "big-endian",
    /** @type {{[key: number]: any}} */
    tags: {},
    /** @type {{[key: string]: any}} */
    ifd: {},
    /** @type {string[]} */
    errors: [],
  };

  try {
    // Parse main IFD (IFD0)
    let currentIfdOffset = tiffHeader.firstIfdOffset;
    let ifdIndex = 0;

    while (currentIfdOffset > 0 && ifdIndex < 10) {
      // Prevent infinite loops
      const ifdName = ifdIndex === 0 ? "IFD0" : `IFD${ifdIndex}`;

      try {
        const ifd = parseIfd(reader, currentIfdOffset, IFD_TYPES.IMAGE);
        exifData.ifd[ifdName] = ifd.entries;

        // Merge tags into main tags object
        Object.assign(exifData.tags, ifd.entries);

        // Look for sub-IFDs
        const exifIfdTag = ifd.entries[0x8769]; // EXIF IFD pointer
        const gpsIfdTag = ifd.entries[0x8825]; // GPS IFD pointer

        // Parse EXIF sub-IFD
        if (exifIfdTag && typeof exifIfdTag.value === "number") {
          try {
            const exifIfd = parseIfd(reader, exifIfdTag.value, IFD_TYPES.EXIF);
            exifData.ifd.EXIF = exifIfd.entries;
            Object.assign(exifData.tags, exifIfd.entries);
          } catch (error) {
            exifData.errors.push(`Failed to parse EXIF IFD: ${error.message}`);
          }
        }

        // Parse GPS sub-IFD
        if (gpsIfdTag && typeof gpsIfdTag.value === "number") {
          try {
            const gpsIfd = parseIfd(reader, gpsIfdTag.value, IFD_TYPES.GPS);
            exifData.ifd.GPS = gpsIfd.entries;
            Object.assign(exifData.tags, gpsIfd.entries);
          } catch (error) {
            exifData.errors.push(`Failed to parse GPS IFD: ${error.message}`);
          }
        }

        currentIfdOffset = ifd.nextIfdOffset;
        ifdIndex++;
      } catch (error) {
        exifData.errors.push(`Failed to parse ${ifdName}: ${error.message}`);
        break;
      }
    }
  } catch (error) {
    throw new Error(`Failed to parse EXIF data: ${error.message}`);
  }

  return exifData;
}

/**
 * Extract human-readable metadata from EXIF data.
 * Converts raw EXIF tags to user-friendly format.
 *
 * @param {{
 *   tags?: {[key: number]: any}
 * }} exifData - Parsed EXIF data
 * @returns {{
 *   camera: {make?: string, model?: string, software?: string},
 *   image: {width?: number, height?: number, orientation?: number, description?: string},
 *   settings: {exposureTime?: number, fNumber?: number, iso?: number, focalLength?: number, meteringMode?: number, flash?: number},
 *   timestamp: {modified?: string, original?: string, digitized?: string},
 *   gps: {latitude?: number, longitude?: number, altitude?: number}
 * }} Human-readable metadata
 */
export function extractMetadata(exifData) {
  const metadata = {
    /** @type {{make?: string, model?: string, software?: string}} */
    camera: {},
    /** @type {{width?: number, height?: number, orientation?: number, description?: string}} */
    image: {},
    /** @type {{exposureTime?: number, fNumber?: number, iso?: number, focalLength?: number, meteringMode?: number, flash?: number}} */
    settings: {},
    /** @type {{modified?: string, original?: string, digitized?: string}} */
    timestamp: {},
    /** @type {{latitude?: number, longitude?: number, altitude?: number}} */
    gps: {},
  };

  const tags = exifData.tags || {};

  // Camera information
  if (tags[0x010f]) metadata.camera.make = tags[0x010f].value;
  if (tags[0x0110]) metadata.camera.model = tags[0x0110].value;
  if (tags[0x0131]) metadata.camera.software = tags[0x0131].value;

  // Image information
  if (tags[0x0100]) metadata.image.width = tags[0x0100].value;
  if (tags[0x0101]) metadata.image.height = tags[0x0101].value;
  if (tags[0x0112]) metadata.image.orientation = tags[0x0112].value;
  if (tags[0x010e]) metadata.image.description = tags[0x010e].value;

  // Camera settings
  if (tags[0x829a]) {
    const exposure = tags[0x829a].value;
    metadata.settings.exposureTime = typeof exposure === "object" ? exposure.value : exposure;
  }

  if (tags[0x829d]) {
    const fnumber = tags[0x829d].value;
    metadata.settings.fNumber = typeof fnumber === "object" ? fnumber.value : fnumber;
  }

  if (tags[0x8827]) metadata.settings.iso = tags[0x8827].value;
  if (tags[0x920a]) {
    const focal = tags[0x920a].value;
    metadata.settings.focalLength = typeof focal === "object" ? focal.value : focal;
  }

  if (tags[0x9207]) metadata.settings.meteringMode = tags[0x9207].value;
  if (tags[0x9209]) metadata.settings.flash = tags[0x9209].value;

  // Timestamps
  if (tags[0x0132]) metadata.timestamp.modified = tags[0x0132].value;
  if (tags[0x9003]) metadata.timestamp.original = tags[0x9003].value;
  if (tags[0x9004]) metadata.timestamp.digitized = tags[0x9004].value;

  // GPS data
  if (tags[0x0001] && tags[0x0002]) {
    const latRef = tags[0x0001].value;
    const lat = tags[0x0002].value;
    if (Array.isArray(lat) && lat.length >= 3) {
      const latitude = lat[0].value + lat[1].value / 60 + lat[2].value / 3600;
      metadata.gps.latitude = latRef === "S" ? -latitude : latitude;
    }
  }

  if (tags[0x0003] && tags[0x0004]) {
    const lonRef = tags[0x0003].value;
    const lon = tags[0x0004].value;
    if (Array.isArray(lon) && lon.length >= 3) {
      const longitude = lon[0].value + lon[1].value / 60 + lon[2].value / 3600;
      metadata.gps.longitude = lonRef === "W" ? -longitude : longitude;
    }
  }

  if (tags[0x0006]) {
    const alt = tags[0x0006].value;
    metadata.gps.altitude = typeof alt === "object" ? alt.value : alt;
  }

  return metadata;
}

/**
 * Get summary information about EXIF parsing.
 * Provides debugging and analysis information.
 *
 * @param {{
 *   tags?: {[key: number]: any},
 *   ifd?: {[key: string]: any},
 *   errors?: string[],
 *   byteOrder?: string
 * }} exifData - Parsed EXIF data
 * @returns {{
 *   tagCount: number,
 *   ifdCount: number,
 *   errorCount: number,
 *   byteOrder: string,
 *   hasGps: boolean,
 *   hasThumbnail: boolean,
 *   ifdTypes: string[],
 *   description: string
 * }} Summary information
 */
export function getExifSummary(exifData) {
  const tagCount = Object.keys(exifData.tags || {}).length;
  const ifdCount = Object.keys(exifData.ifd || {}).length;
  const errorCount = (exifData.errors || []).length;

  const hasGps = !!(exifData.tags?.[2] && exifData.tags[4]);
  const hasThumbnail = !!(exifData.ifd && (exifData.ifd.IFD1 || exifData.ifd.Thumbnail));

  return {
    tagCount,
    ifdCount,
    errorCount,
    byteOrder: exifData.byteOrder || "unknown",
    hasGps,
    hasThumbnail,
    ifdTypes: Object.keys(exifData.ifd || {}),
    description: `EXIF: ${tagCount} tags, ${ifdCount} IFDs, ${errorCount} errors, ${exifData.byteOrder || "unknown"} byte order`,
  };
}
