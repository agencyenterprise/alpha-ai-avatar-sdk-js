// @ts-nocheck
interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Creates a binary mask where greenscreen pixels are marked as background (0) and
 * subject pixels as foreground (1).
 */
function createMask(
  imageData: ImageData,
  greenKeyColor: RGBColor,
  tolerance: number,
): Uint8Array {
  const data = imageData.data;
  const width = 512;
  const height = 512;
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      // Calculate distance from the green key color
      const distance = Math.sqrt(
        (r - greenKeyColor.r) ** 2 +
          (g - greenKeyColor.g) ** 2 +
          (b - greenKeyColor.b) ** 2,
      );

      if (distance < tolerance) {
        // Greenscreen pixel
        mask[y * width + x] = 0; // Background
      } else {
        // Subject pixel
        mask[y * width + x] = 1; // Foreground
      }
    }
  }

  return mask;
}

function createSmoothedMask(
  imageData: ImageData,
  greenKeyColor: RGBColor,
  tolerance: number,
  smoothingKernelSize: number,
): Uint8Array {
  const data = imageData.data;
  const width = 512;
  const height = 512;
  const mask = new Uint8Array(width * height);

  // Create the initial mask
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      // Calculate distance from the green key color
      const distance = Math.sqrt(
        (r - greenKeyColor.r) ** 2 +
        (g - greenKeyColor.g) ** 2 +
        (b - greenKeyColor.b) ** 2,
      );
      if (distance < tolerance) {
        // Greenscreen pixel
        mask[y * width + x] = 0; // Background
      } else {
        // Subject pixel
        mask[y * width + x] = 1; // Foreground
      }
    }
  }

  // Apply smoothing to the mask
  const smoothedMask = smoothMaskWithGaussian(mask, width, height, 1);

  return smoothedMask;
}

function smoothMaskWithGaussian(mask: Uint8Array, width: number, height: number, sigma: number = 1): Uint8Array {
  const newMask = new Uint8Array(width * height);
  const kernelRadius = Math.ceil(sigma * 3);
  const kernelSize = 2 * kernelRadius + 1;

  // Generate Gaussian kernel
  const kernel = [];
  let sum = 0;
  for (let y = -kernelRadius; y <= kernelRadius; y++) {
    for (let x = -kernelRadius; x <= kernelRadius; x++) {
      const exponent = -(x * x + y * y) / (2 * sigma * sigma);
      const value = Math.exp(exponent);
      kernel.push(value);
      sum += value;
    }
  }
  // Normalize the kernel so that the sum of all weights is 1
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  // Function to get the pixel value with boundary checks
  function getPixel(x: number, y: number): number {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return 0; // Treat out-of-bound pixels as background (0)
    }
    return mask[y * width + x];
  }

  // Convolve the mask with the Gaussian kernel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let accumulator = 0;
      let index = 0;
      for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          const pixel = getPixel(x + kx, y + ky);
          const weight = kernel[index++];
          accumulator += pixel * weight;
        }
      }
      // Threshold the accumulator to create a binary mask
      newMask[y * width + x] = accumulator >= 0.5 ? 1 : 0;
    }
  }

  return newMask;
}

/**
 * Applies erosion to the mask, shrinking the foreground areas to eliminate thin green outlines.
 */
function erodeMask(
  mask: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const erodedMask = new Uint8Array(width * height);
  const kernel = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let erode = false;
      outerLoop: for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          if (kernel[ky + 1][kx + 1] === 1) {
            const nx = x + kx;
            const ny = y + ky;
            if (mask[ny * width + nx] === 0) {
              erode = true;
              break outerLoop;
            }
          }
        }
      }
      erodedMask[y * width + x] = erode ? 0 : mask[y * width + x];
    }
  }

  return erodedMask;
}

/**
 * Applies dilation to the mask, expanding the foreground areas to restore the subject size
 * without reintroducing green edges.
 */
function dilateMask(
  mask: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const dilatedMask = new Uint8Array(width * height);
  const kernel = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mask[y * width + x] === 1) {
        dilatedMask[y * width + x] = 1;
        continue;
      }
      let dilate = false;
      outerLoop: for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          if (kernel[ky + 1][kx + 1] === 1) {
            const nx = x + kx;
            const ny = y + ky;
            if (mask[ny * width + nx] === 1) {
              dilate = true;
              break outerLoop;
            }
          }
        }
      }
      dilatedMask[y * width + x] = dilate ? 1 : 0;
    }
  }

  return dilatedMask;
}

/**
 * Computes the distance transform of the mask.
 * For each pixel, computes the distance to the nearest background pixel.
 */
function computeDistanceTransform(
  mask: Uint8Array,
  width: number,
  height: number,
): Float32Array {
  const distanceMap = new Float32Array(width * height);
  const maxDistance = Math.sqrt(width * width + height * height);

  // First pass: top-left to bottom-right
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (mask[index] === 1) {
        let minDist = maxDistance;
        if (x > 0) {
          minDist = Math.min(minDist, distanceMap[index - 1] + 1);
        }
        if (y > 0) {
          minDist = Math.min(minDist, distanceMap[index - width] + 1);
        }
        distanceMap[index] = minDist;
      } else {
        distanceMap[index] = 0;
      }
    }
  }

  // Second pass: bottom-right to top-left
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const index = y * width + x;
      if (mask[index] === 1) {
        if (x + 1 < width) {
          distanceMap[index] = Math.min(
            distanceMap[index],
            distanceMap[index + 1] + 1,
          );
        }
        if (y + 1 < height) {
          distanceMap[index] = Math.min(
            distanceMap[index],
            distanceMap[index + width] + 1,
          );
        }
      }
    }
  }

  return distanceMap;
}

/**
 * Applies edge feathering by adjusting alpha values based on the distance transform.
 */
function featherEdges(
  imageData: ImageData,
  distanceMap: Float32Array,
  maxFeatherDistance: number,
  bgData: Uint8ClampedArray | null = null, // Added bgData as an optional parameter
): void {
  const data = imageData.data;
  const width = 512;
  const height = 512;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const distance = distanceMap[y * width + x];

      if (distance > 0 && distance <= maxFeatherDistance) {
        const normalizedDistance = distance / maxFeatherDistance;
        const alphaFactor = normalizedDistance; // Linear interpolation

        if (bgData) {
          // Blend the foreground with the background based on alphaFactor
          data[index] =
            data[index] * alphaFactor + bgData[index] * (1 - alphaFactor);
          data[index + 1] =
            data[index + 1] * alphaFactor +
            bgData[index + 1] * (1 - alphaFactor);
          data[index + 2] =
            data[index + 2] * alphaFactor +
            bgData[index + 2] * (1 - alphaFactor);
          // Optionally adjust alpha channel if needed
          // For non-transparent backgrounds, you might want to keep alpha at 255
          data[index + 3] = 255;
        } else {
          // If no background is provided, adjust the alpha channel as before
          const alpha = normalizedDistance * 255;
          data[index + 3] = Math.min(data[index + 3], alpha);
        }
      }
    }
  }
}

/**
 * Main function to perform chroma keying with smooth edges.
 */
export function chromaKeySmoothEdges(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  greenKeyColor: RGBColor,
  tolerance: number,
  erosionIterations: number,
  dilationIterations: number,
  maxFeatherDistance: number,
  avatarPositionX: number,
  avatarPositionY: number,
  bgData: Uint8ClampedArray | null = null,
): void {
  const width = 512;
  const height = 512;

  // Step 1: Create initial mask
  let mask = createMask(imageData, greenKeyColor, tolerance);

  const greenScreenDetected = mask.includes(0);

  // If there's no green screen, skip the rest of the processing
  if (!greenScreenDetected) {
    ctx.putImageData(imageData, avatarPositionX, avatarPositionY);
    return;
  }

  // Step 2: Apply erosion multiple times
  // for (let i = 0; i < erosionIterations; i++) {
  //   mask = erodeMask(mask, width, height);
  // }

  // Step 3: Apply dilation multiple times
  // for (let i = 0; i < dilationIterations; i++) {
  //   mask = dilateMask(mask, width, height);
  // }

  // Step 4: Compute distance transform
  const distanceMap = computeDistanceTransform(mask, width, height);

  // Step 5: Apply the mask to the alpha channel (initially set to opaque or transparent)
  applyMask(imageData, mask, bgData);

  // Step 6: Feather edges based on distance transform
  featherEdges(imageData, distanceMap, maxFeatherDistance, bgData);

  // Update the canvas with the modified image data
  ctx.putImageData(imageData, avatarPositionX, avatarPositionY);
}

/**
 * Applies the final mask to the image data, setting the alpha channel accordingly.
 */
function applyMask(
  imageData: ImageData,
  mask: Uint8Array,
  bgData: Uint8ClampedArray | null,
): void {
  const data = imageData.data;
  const width = 512;
  const height = 512;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (mask[y * width + x] === 0) {
        if (bgData) {
          data[index] = bgData[index]; // Copy background pixel RGB values
          data[index + 1] = bgData[index + 1];
          data[index + 2] = bgData[index + 2];
        } else {
          data[index + 3] = 0; // Set alpha to 0 (transparent)
        }
      } else {
        // Foreground pixel
        data[index + 3] = 255; // Set alpha to 255 (opaque)
      }
    }
  }
}
