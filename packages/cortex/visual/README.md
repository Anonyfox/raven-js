# @raven-js/cortex/visual

**Zero-dependency image processing for modern JavaScript**

[![RavenJS](https://img.shields.io/badge/RavenJS-Cortex-blue.svg)](https://ravenjs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)

A pure JavaScript image processing library that provides comprehensive image manipulation capabilities with zero external dependencies. Built for modern JavaScript environments using only native Node.js APIs and modern ECMAScript features.

## 🏗️ Architecture

### Core Philosophy

- **Zero Dependencies**: Uses only Node.js built-ins and modern JavaScript
- **Unified API**: Single `Image` class for all operations
- **Async-First**: Consistent async/await patterns throughout
- **Memory Efficient**: In-place operations where possible
- **Type Safe**: Full JSDoc type annotations

### Design Principles

- **Surgical Precision**: Every operation is deliberate and optimized
- **Platform Mastery**: Leverages Node.js internals for maximum performance
- **Format Agnostic**: Same API regardless of image format
- **Zero Compromises**: Professional-quality results without complexity

## 📦 Installation

```bash
npm install @raven-js/cortex
```

```javascript
import { Image, decodePNG, encodePNG, decodeBMP, encodeBMP } from "@raven-js/cortex/visual";
```

## 🚀 Quick Start

### Load and Manipulate Images

```javascript
import { Image } from "@raven-js/cortex/visual";
import { readFileSync, writeFileSync } from "fs";

// Load PNG image
const pngBuffer = readFileSync("input.png");
const image = await Image.fromPngBuffer(pngBuffer);

// Chain operations
const processed = image
  .resize(800, 600, "bicubic")
  .crop(50, 50, 700, 500)
  .adjustBrightness(0.1)
  .adjustContrast(1.2);

// Save as BMP
const bmpBuffer = await processed.toBmpBuffer({ hasAlpha: false });
writeFileSync("output.bmp", bmpBuffer);
```

### Cross-Format Conversion

```javascript
// PNG to BMP
const pngImage = await Image.fromPngBuffer(pngBuffer);
const bmpBuffer = await pngImage.toBmpBuffer({ hasAlpha: true });

// BMP to PNG
const bmpImage = await Image.fromBmpBuffer(bmpBuffer);
const pngOutput = await bmpImage.toPngBuffer({ compressionLevel: 9 });
```

## 🎨 Supported Formats

### Currently Supported Codecs

| Format  | Read | Write | Features                                        |
| ------- | ---- | ----- | ----------------------------------------------- |
| **PNG** | ✅   | ✅    | Full RGBA support, compression levels, metadata |
| **BMP** | ✅   | ✅    | 24-bit RGB, 32-bit BGRA, uncompressed           |

### Codec Architecture

Each format uses a dedicated codec with separate encode/decode functions:

```javascript
// Direct codec usage
import { decodePNG, encodePNG, decodeBMP, encodeBMP } from "@raven-js/cortex/visual";

// Encode/decode operations
const { pixels, width, height, metadata } = await decodePNG(buffer);
const pngBuffer = await encodePNG(pixels, width, height, options);
```

## 🖼️ Image Class API

### Constructor

```javascript
const image = new Image(pixels, width, height, metadata);
```

- `pixels`: Uint8Array with RGBA pixel data (4 bytes per pixel)
- `width`: Image width in pixels
- `height`: Image height in pixels
- `metadata`: Optional metadata object

### Loading Images

#### PNG Images

```javascript
const image = await Image.fromPngBuffer(buffer);
```

#### BMP Images

```javascript
const image = await Image.fromBmpBuffer(buffer);
```

### Image Properties

```javascript
console.log(image.width);      // Image width
console.log(image.height);     // Image height
console.log(image.channels);   // Always 4 (RGBA)
console.log(image.pixelCount); // Total pixels (width × height)
console.log(image.hasAlpha);   // Always true (RGBA format)
```

### Manipulation Operations

#### Geometric Transformations

**Resize**

```javascript
image.resize(width, height, algorithm);
```

- `width`, `height`: Target dimensions
- `algorithm`: `"nearest"`, `"bilinear"`, `"bicubic"`, `"lanczos"`
- Default: `"bilinear"`

**Crop**

```javascript
image.crop(x, y, width, height);
```

- `x`, `y`: Top-left corner coordinates
- `width`, `height`: Crop dimensions

**Rotate**

```javascript
image.rotate(degrees, algorithm, fillColor);
```

- `degrees`: Rotation angle (positive = clockwise)
- `algorithm`: Interpolation method
- `fillColor`: RGBA array for empty areas

**Flip**

```javascript
image.flip(direction, inPlace);
```

- `direction`: `"horizontal"` or `"vertical"`
- `inPlace`: Modify pixels in-place (default: `true`)

#### Color Adjustments

**Brightness**

```javascript
image.adjustBrightness(factor, inPlace);
```

- `factor`: Brightness multiplier (1.0 = no change)
- Range: Typically 0.5 to 1.5

**Contrast**

```javascript
image.adjustContrast(factor, inPlace);
```

- `factor`: Contrast multiplier (1.0 = no change)
- Range: Typically 0.5 to 2.0

**Saturation**

```javascript
image.adjustSaturation(factor, inPlace);
```

- `factor`: Saturation multiplier (1.0 = no change)
- Range: Typically 0.0 to 2.0

**Hue**

```javascript
image.adjustHue(shift, inPlace);
```

- `shift`: Hue shift in degrees (-360 to 360)

**Combined HSL**

```javascript
image.adjustHueSaturation(hueShift, saturationFactor, inPlace);
```

#### Filters and Effects

**Grayscale**

```javascript
image.grayscale(method, inPlace);
```

- `method`: `"luminance"`, `"average"`, `"desaturate"`, `"max"`, `"min"`

**Invert Colors**

```javascript
image.invert(inPlace);
```

**Sepia Effect**

```javascript
image.sepia(inPlace);
```

**Blur Filters**

```javascript
// Gaussian blur
image.blur(radius, sigma, inPlace);

// Box blur
image.boxBlur(size, inPlace);
```

**Sharpening**

```javascript
// Basic sharpening
image.sharpen(strength, inPlace);

// Unsharp mask
image.unsharpMask(amount, radius, inPlace);
```

**Edge Detection**

```javascript
image.detectEdges(type, inPlace);
```

- `type`: `"sobel-x"`, `"sobel-y"`, `"laplacian"`, etc.

**Custom Convolution**

```javascript
image.convolve(kernel, options);
```

- `kernel`: 2D convolution matrix
- `options`: Edge handling, alpha preservation

### Saving Images

#### PNG Format

```javascript
const pngBuffer = await image.toPngBuffer({
  compressionLevel: 6,    // 0-9 (default: 6)
  filterStrategy: "optimal" // "none", "sub", "up", "average", "optimal"
});
```

#### BMP Format

```javascript
const bmpBuffer = await image.toBmpBuffer({
  hasAlpha: false,     // true = 32-bit BGRA, false = 24-bit BGR
  xResolution: 300,    // DPI horizontal
  yResolution: 300     // DPI vertical
});
```

### Method Chaining

All manipulation methods return `this` for fluent chaining:

```javascript
const result = await Image.fromPngBuffer(inputBuffer)
  .resize(1024, 768, "bicubic")
  .crop(100, 100, 800, 600)
  .adjustBrightness(1.1)
  .adjustContrast(1.2)
  .sharpen(0.5)
  .toBmpBuffer({ hasAlpha: false });
```

## 🔧 Advanced Usage

### Memory Management

```javascript
// In-place operations (default)
image.adjustBrightness(1.1, true);  // Modifies existing pixel array

// Create new pixel array
image.adjustBrightness(1.1, false); // Creates new pixel array
```

### Batch Processing

```javascript
const images = [
  "image1.png", "image2.png", "image3.png"
];

for (const filename of images) {
  const buffer = readFileSync(filename);
  const image = await Image.fromPngBuffer(buffer);

  const processed = image
    .resize(800, 600)
    .adjustBrightness(1.05);

  const output = await processed.toPngBuffer({ compressionLevel: 8 });
  writeFileSync(`processed-${filename}`, output);
}
```

### Custom Processing Pipeline

```javascript
function createThumbnail(buffer, size = 200) {
  return Image.fromPngBuffer(buffer)
    .then(img => {
      const minDim = Math.min(img.width, img.height);
      const scale = size / minDim;
      return img.resize(
        Math.round(img.width * scale),
        Math.round(img.height * scale),
        "bicubic"
      );
    })
    .then(img => img.toPngBuffer({ compressionLevel: 9 }));
}

// Usage
const thumbnail = await createThumbnail(pngBuffer, 150);
```

## 📊 Performance Characteristics

### Memory Usage

- **RGBA Storage**: 4 bytes per pixel
- **In-place Operations**: Minimal additional memory allocation
- **Copy Operations**: Creates new pixel arrays when `inPlace: false`

### Algorithm Performance

- **Resize**: Bicubic ~2-3x slower than bilinear, but higher quality
- **Filters**: Convolution-based operations scale with kernel size
- **Color Adjustments**: Fast pixel-wise operations
- **Format Conversion**: PNG compression is the main bottleneck

### Benchmarks

- **Resize 1000×1000**: ~50-200ms depending on algorithm
- **Gaussian Blur**: ~100-500ms for radius 5
- **PNG Encode**: ~200-1000ms depending on compression level
- **BMP Encode**: ~10-50ms (uncompressed)

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Coverage

- ✅ **100% branch coverage** for all core functions
- ✅ **Pixel-perfect accuracy** verification
- ✅ **Cross-format conversion** validation
- ✅ **Memory leak prevention** tests

### Test Categories

- **Codec Tests**: Format encoding/decoding accuracy
- **Manipulation Tests**: Operation correctness and precision
- **Integration Tests**: End-to-end pipeline validation
- **Performance Tests**: Memory usage and timing benchmarks

## 🏛️ Architecture Details

### Internal Representation

- **Pixel Format**: Always RGBA Uint8Array (4 bytes per pixel)
- **Coordinate System**: Top-left origin (0,0)
- **Channel Order**: Red, Green, Blue, Alpha
- **Bit Depth**: 8 bits per channel

### Codec Architecture

```
codecs/
├── png/           # Full PNG implementation
│   ├── decode.js  # PNG → RGBA conversion
│   ├── encode.js  # RGBA → PNG conversion
│   └── *.js       # PNG-specific utilities
└── bmp/           # BMP implementation
    ├── decode.js  # BMP → RGBA conversion
    ├── encode.js  # RGBA → BMP conversion
    └── *.js       # BMP-specific utilities
```

### Operation Pipeline

```
Input Buffer → Decoder → RGBA Pixels → Operations → Encoder → Output Buffer
     ↓            ↓           ↓           ↓          ↓           ↓
   Format      Metadata    Manipulate   Transform   Compress   Serialize
  Specific    Extraction   Pixels       Pixels     Pixels      Buffer
```

## 🔮 Future Formats

### Planned Codecs

- **JPEG**: Lossy compression with quality control
- **WebP**: Modern format with transparency and animation
- **GIF**: Indexed colors with animation support
- **TIFF**: Professional photography format
- **AVIF**: Next-generation compression

### Extension Points

```javascript
// Add new codec
export class CustomCodec {
  static async decode(buffer) { /* ... */ }
  static async encode(pixels, width, height, options) { /* ... */ }
}

// Register in Image class
Image.registerCodec("custom", CustomCodec);
const image = await Image.fromCustomBuffer(buffer);
```

## 📚 Examples

### Basic Workflow

```javascript
import { Image } from "@raven-js/cortex/visual";

// Load, process, save
const original = await Image.fromPngBuffer(readFileSync("photo.png"));
const processed = original
  .resize(1920, 1080, "bicubic")
  .adjustBrightness(1.05)
  .sharpen(0.3);

writeFileSync("processed.png", await processed.toPngBuffer());
```

### Batch Image Processing

```javascript
const processImages = async (inputDir, outputDir) => {
  const files = readdirSync(inputDir).filter(f => f.endsWith('.png'));

  for (const file of files) {
    const inputPath = join(inputDir, file);
    const outputPath = join(outputDir, file.replace('.png', '.bmp'));

    const image = await Image.fromPngBuffer(readFileSync(inputPath));
    const processed = image.resize(800, 600).adjustContrast(1.1);

    writeFileSync(outputPath, await processed.toBmpBuffer());
    console.log(`Processed: ${file}`);
  }
};
```

### Advanced Filtering

```javascript
const applyVintageEffect = (image) => {
  return image
    .adjustBrightness(1.1)
    .adjustContrast(1.15)
    .adjustSaturation(0.8)
    .sepia()
    .blur(0.5); // Soft focus effect
};

const vintageImage = applyVintageEffect(await Image.fromPngBuffer(buffer));
```

## 🤝 Contributing

### Development Setup

```bash
git clone https://github.com/Anonyfox/raven-js.git
cd raven-js/packages/cortex
npm install
npm test
```

### Adding New Features

1. **Fork and create feature branch**
2. **Add comprehensive tests**
3. **Ensure 100% test coverage**
4. **Update documentation**
5. **Submit pull request**

### Code Standards

- **ESLint**: Biome configuration
- **Types**: JSDoc type annotations
- **Tests**: 100% branch coverage required
- **Performance**: Benchmark new operations
- **Documentation**: Update README for new features

## 📄 License

**MIT License** - see [LICENSE](../LICENSE) file for details.

## 🔗 Links

- **Homepage**: [https://ravenjs.dev](https://ravenjs.dev)
- **Repository**: [https://github.com/Anonyfox/raven-js](https://github.com/Anonyfox/raven-js)
- **Issues**: [https://github.com/Anonyfox/raven-js/issues](https://github.com/Anonyfox/raven-js/issues)
- **Documentation**: [https://ravenjs.dev/docs](https://ravenjs.dev/docs)

---

**Built with 🐦 by Anonyfox** | **Zero dependencies, maximum performance** | **Modern JavaScript, timeless results**
