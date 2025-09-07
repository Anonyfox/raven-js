/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Convolution utility functions for kernel-based image filtering.
 */

/**
 * Validates convolution kernel parameters.
 *
 * @param {number[][]} kernel - 2D convolution kernel matrix
 * @throws {Error} If kernel is invalid
 */
export function validateKernel(kernel) {
  if (!Array.isArray(kernel) || kernel.length === 0) {
    throw new Error("Kernel must be a non-empty 2D array");
  }

  const size = kernel.length;
  if (size % 2 === 0) {
    throw new Error("Kernel size must be odd (3x3, 5x5, 7x7, etc.)");
  }

  // Check that all rows have the same length and are valid numbers
  for (let i = 0; i < size; i++) {
    if (!Array.isArray(kernel[i]) || kernel[i].length !== size) {
      throw new Error("Kernel must be square (same width and height)");
    }

    for (let j = 0; j < size; j++) {
      if (typeof kernel[i][j] !== "number" || Number.isNaN(kernel[i][j])) {
        throw new Error("All kernel values must be valid numbers");
      }
    }
  }
}

/**
 * Validates convolution parameters.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number[][]} kernel - 2D convolution kernel matrix
 * @throws {Error} If any parameter is invalid
 */
export function validateConvolutionParameters(pixels, width, height, kernel) {
  // Basic pixel validation
  if (!(pixels instanceof Uint8Array)) {
    throw new Error("Pixels must be a Uint8Array");
  }

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("Width must be a positive integer");
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("Height must be a positive integer");
  }

  if (pixels.length !== width * height * 4) {
    throw new Error("Pixel data size must match width × height × 4 (RGBA)");
  }

  // Kernel validation
  validateKernel(kernel);
}

/**
 * Gets the pixel index for given coordinates with bounds checking.
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} [edgeHandling="clamp"] - Edge handling method ("clamp", "wrap", "mirror")
 * @returns {{x: number, y: number, index: number}} Clamped coordinates and pixel index
 */
export function getPixelWithEdgeHandling(x, y, width, height, edgeHandling = "clamp") {
  let clampedX = x;
  let clampedY = y;

  switch (edgeHandling) {
    case "clamp":
      clampedX = Math.max(0, Math.min(width - 1, x));
      clampedY = Math.max(0, Math.min(height - 1, y));
      break;

    case "wrap":
      clampedX = ((x % width) + width) % width;
      clampedY = ((y % height) + height) % height;
      break;

    case "mirror":
      if (x < 0) {
        clampedX = Math.abs(x) - 1;
      } else if (x >= width) {
        clampedX = width - 1 - (x - width);
      }

      if (y < 0) {
        clampedY = Math.abs(y) - 1;
      } else if (y >= height) {
        clampedY = height - 1 - (y - height);
      }

      // Ensure we're still in bounds after mirroring
      clampedX = Math.max(0, Math.min(width - 1, clampedX));
      clampedY = Math.max(0, Math.min(height - 1, clampedY));
      break;

    default:
      throw new Error(`Unknown edge handling method: ${edgeHandling}`);
  }

  const index = (clampedY * width + clampedX) * 4;
  return { x: clampedX, y: clampedY, index };
}

/**
 * Applies a convolution kernel to a single pixel.
 *
 * @param {Uint8Array} pixels - Source RGBA pixel data
 * @param {number} centerX - Center pixel X coordinate
 * @param {number} centerY - Center pixel Y coordinate
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number[][]} kernel - 2D convolution kernel matrix
 * @param {string} [edgeHandling="clamp"] - Edge handling method
 * @returns {[number, number, number, number]} Convolved RGBA values
 */
export function applyKernelToPixel(pixels, centerX, centerY, width, height, kernel, edgeHandling = "clamp") {
  const kernelSize = kernel.length;
  const kernelRadius = Math.floor(kernelSize / 2);

  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;

  // Apply kernel to neighborhood
  for (let ky = 0; ky < kernelSize; ky++) {
    for (let kx = 0; kx < kernelSize; kx++) {
      const pixelX = centerX + kx - kernelRadius;
      const pixelY = centerY + ky - kernelRadius;

      const { index } = getPixelWithEdgeHandling(pixelX, pixelY, width, height, edgeHandling);
      const kernelValue = kernel[ky][kx];

      r += pixels[index] * kernelValue;
      g += pixels[index + 1] * kernelValue;
      b += pixels[index + 2] * kernelValue;
      a += pixels[index + 3] * kernelValue;
    }
  }

  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b))),
    Math.max(0, Math.min(255, Math.round(a))),
  ];
}

/**
 * Normalizes a kernel so its values sum to 1 (for blur kernels).
 *
 * @param {number[][]} kernel - 2D convolution kernel matrix
 * @returns {number[][]} Normalized kernel
 */
export function normalizeKernel(kernel) {
  const sum = kernel.flat().reduce((acc, val) => acc + val, 0);

  if (sum === 0) {
    throw new Error("Cannot normalize kernel with zero sum");
  }

  return kernel.map((row) => row.map((val) => val / sum));
}

/**
 * Creates a box blur kernel of specified size.
 *
 * @param {number} size - Kernel size (must be odd: 3, 5, 7, etc.)
 * @returns {number[][]} Box blur kernel
 */
export function createBoxBlurKernel(size) {
  if (size % 2 === 0 || size < 3) {
    throw new Error("Kernel size must be odd and at least 3");
  }

  const value = 1 / (size * size);
  return Array(size)
    .fill()
    .map(() => Array(size).fill(value));
}

/**
 * Creates a Gaussian blur kernel with specified size and sigma.
 *
 * @param {number} size - Kernel size (must be odd: 3, 5, 7, etc.)
 * @param {number} sigma - Standard deviation for Gaussian distribution
 * @returns {number[][]} Gaussian blur kernel
 */
export function createGaussianKernel(size, sigma) {
  if (size % 2 === 0 || size < 3) {
    throw new Error("Kernel size must be odd and at least 3");
  }

  if (sigma <= 0) {
    throw new Error("Sigma must be positive");
  }

  const kernel = [];
  const center = Math.floor(size / 2);
  const twoSigmaSquared = 2 * sigma * sigma;

  // Generate Gaussian values
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const distance = dx * dx + dy * dy;

      kernel[y][x] = Math.exp(-distance / twoSigmaSquared);
    }
  }

  // Normalize kernel
  return normalizeKernel(kernel);
}

/**
 * Creates a sharpening kernel with specified strength.
 *
 * @param {number} [strength=1.0] - Sharpening strength [0.0 to 2.0]
 * @returns {number[][]} Sharpening kernel (3x3)
 */
export function createSharpenKernel(strength = 1.0) {
  if (strength < 0 || strength > 2) {
    throw new Error("Sharpening strength must be between 0.0 and 2.0");
  }

  // Basic 3x3 sharpening kernel
  const center = 1 + 4 * strength;
  const edge = -strength;

  return [
    [0, edge, 0],
    [edge, center, edge],
    [0, edge, 0],
  ];
}

/**
 * Creates an unsharp mask kernel for advanced sharpening.
 *
 * @param {number} [amount=1.0] - Sharpening amount [0.0 to 3.0]
 * @param {number} [radius=1.0] - Blur radius for mask [0.5 to 3.0]
 * @returns {number[][]} Unsharp mask kernel
 */
export function createUnsharpMaskKernel(amount = 1.0, radius = 1.0) {
  if (amount < 0 || amount > 3) {
    throw new Error("Unsharp mask amount must be between 0.0 and 3.0");
  }

  if (radius < 0.5 || radius > 3.0) {
    throw new Error("Unsharp mask radius must be between 0.5 and 3.0");
  }

  // Create a small Gaussian blur kernel for the mask
  const size = Math.max(3, Math.ceil(radius * 2) * 2 + 1); // Ensure odd size
  const sigma = radius / 2;

  const blurKernel = createGaussianKernel(size, sigma);

  // Create unsharp mask: original + amount * (original - blurred)
  // This simplifies to: (1 + amount) * original - amount * blurred
  const center = Math.floor(size / 2);
  const unsharpKernel = blurKernel.map((row, y) =>
    row.map((val, x) => {
      if (x === center && y === center) {
        return 1 + amount - amount * val;
      }
      return -amount * val;
    })
  );

  return unsharpKernel;
}

/**
 * Creates an edge detection kernel (Sobel, Laplacian, etc.).
 *
 * @param {string} [type="sobel-x"] - Edge detection type ("sobel-x", "sobel-y", "laplacian")
 * @returns {number[][]} Edge detection kernel
 */
export function createEdgeDetectionKernel(type = "sobel-x") {
  switch (type.toLowerCase()) {
    case "sobel-x":
      return [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ];

    case "sobel-y":
      return [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
      ];

    case "laplacian":
      return [
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0],
      ];

    case "laplacian-diagonal":
      return [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1],
      ];

    default:
      throw new Error(`Unknown edge detection type: ${type}`);
  }
}
