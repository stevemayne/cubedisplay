// Per-sticker projection and image sampling.
//
// In isometric view from (1,1,1), each cube shows 3 faces with 9 stickers each
// (U, R, F = 27 visible stickers). This module pre-computes the normalized screen
// position of each sticker within a grid cell and samples the source image at
// those positions.
//
// Projection: sx = (x - z) / sqrt(2),  sy = (-x + 2y - z) / sqrt(6)
// Hex bounding box: sx in [-3/sqrt(2), 3/sqrt(2)], sy in [-sqrt(6), sqrt(6)]
// Normalization: u = (sx*sqrt(2) + 3) / 6,  v = (sqrt(6) - sy) / (2*sqrt(6))

import { rgbToLab } from '../utils/color';

export type LAB = [number, number, number];

// 27 CIELAB values, one per visible sticker (indices 0-26)
export type StickerTarget = LAB[];

export interface StickerSample {
  targets: StickerTarget[];
  weights: Float32Array[];  // per-cell array of 27 edge weights
}

interface StickerPos {
  u: number; // normalized horizontal position [0, 1] within cell
  v: number; // normalized vertical position [0, 1] within cell (0 = top)
  stickerIndex: number; // index in the 54-element CubeState array
}

const SQRT2 = Math.sqrt(2);
const SQRT6 = Math.sqrt(6);

// Edge stickers get up to (1 + EDGE_SCALE)× the influence of uniform stickers.
const EDGE_SCALE = 3.0;

// Project a 3D point to normalized (u, v) within the hex cell
function projectToCell(x: number, y: number, z: number): { u: number; v: number } {
  const sx = (x - z) / SQRT2;
  const sy = (-x + 2 * y - z) / SQRT6;
  const u = (sx * SQRT2 + 3) / 6;
  const v = (SQRT6 - sy) / (2 * SQRT6);
  return { u, v };
}

// Build the 27 sticker positions from the cube geometry.
// Each visible face has 9 stickers at the centers of the 3x3 grid of cubies.
function buildStickerPositions(): StickerPos[] {
  const positions: StickerPos[] = [];

  // U face (y=1.5): sticker index = faceIndex(z+1, x+1) = (z+1)*3 + (x+1)
  // Sticker indices 0-8
  for (let z = -1; z <= 1; z++) {
    for (let x = -1; x <= 1; x++) {
      const stickerIndex = (z + 1) * 3 + (x + 1); // 0-8
      const { u, v } = projectToCell(x, 1.5, z);
      positions.push({ u, v, stickerIndex });
    }
  }

  // R face (x=1.5): sticker index = 9 + faceIndex(-y+1, -z+1) = 9 + (-y+1)*3 + (-z+1)
  // Sticker indices 9-17
  for (let y = 1; y >= -1; y--) {
    for (let z = 1; z >= -1; z--) {
      const stickerIndex = 9 + (-y + 1) * 3 + (-z + 1); // 9-17
      const { u, v } = projectToCell(1.5, y, z);
      positions.push({ u, v, stickerIndex });
    }
  }

  // F face (z=1.5): sticker index = 18 + faceIndex(-y+1, x+1) = 18 + (-y+1)*3 + (x+1)
  // Sticker indices 18-26
  for (let y = 1; y >= -1; y--) {
    for (let x = -1; x <= 1; x++) {
      const stickerIndex = 18 + (-y + 1) * 3 + (x + 1); // 18-26
      const { u, v } = projectToCell(x, y, 1.5);
      positions.push({ u, v, stickerIndex });
    }
  }

  return positions;
}

export const STICKER_POSITIONS: StickerPos[] = buildStickerPositions();

// Pre-compute a luminance image from RGBA data for fast gradient computation.
function buildLuminanceMap(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const lum = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    lum[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  return lum;
}

// Compute Sobel gradient magnitude at a pixel position.
// Returns a value in [0, 1] (normalized by max possible gradient ~= 4*255).
function gradientMagnitude(
  lum: Float32Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
): number {
  const ix = Math.round(cx);
  const iy = Math.round(cy);
  if (ix <= 0 || ix >= width - 1 || iy <= 0 || iy >= height - 1) return 0;

  // Sobel 3×3 kernel
  const tl = lum[(iy - 1) * width + (ix - 1)];
  const tc = lum[(iy - 1) * width + ix];
  const tr = lum[(iy - 1) * width + (ix + 1)];
  const ml = lum[iy * width + (ix - 1)];
  const mr = lum[iy * width + (ix + 1)];
  const bl = lum[(iy + 1) * width + (ix - 1)];
  const bc = lum[(iy + 1) * width + ix];
  const br = lum[(iy + 1) * width + (ix + 1)];

  const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
  const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;

  // Max possible magnitude ≈ sqrt((4*255)² + (4*255)²) ≈ 1442
  return Math.sqrt(gx * gx + gy * gy) / 1442;
}

// Sample the source image at each sticker position for all cubes in the grid.
// Returns per-cell sticker colors (27 CIELAB values) and edge weights.
// Grid row 0 = bottom of image (isometric convention), so we flip vertically.
export function sampleStickersForGrid(
  imageData: ImageData,
  cols: number,
  rows: number,
): StickerSample {
  const { width, height, data } = imageData;
  const cellW = width / cols;
  const cellH = height / rows;
  const targets: StickerTarget[] = [];
  const weights: Float32Array[] = [];

  // Sampling radius in pixels around each sticker center (for anti-aliasing)
  const sampleRadius = Math.max(1, Math.floor(Math.min(cellW, cellH) / 12));

  // Pre-compute luminance map for gradient detection
  const lum = buildLuminanceMap(data, width, height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * cellW;
      // Flip: grid row 0 is at bottom of screen, image row 0 is at top
      const cy = (rows - 1 - row) * cellH;

      const stickers: LAB[] = [];
      const cellWeights = new Float32Array(27);

      for (let si = 0; si < STICKER_POSITIONS.length; si++) {
        const { u, v } = STICKER_POSITIONS[si];
        const px = cx + u * cellW;
        const py = cy + v * cellH;
        const rgb = sampleRegion(data, width, height, px, py, sampleRadius);
        stickers.push(rgbToLab(rgb));

        const grad = gradientMagnitude(lum, width, height, px, py);
        cellWeights[si] = 1.0 + EDGE_SCALE * grad;
      }

      targets.push(stickers);
      weights.push(cellWeights);
    }
  }

  return { targets, weights };
}

// Sample average RGB in a small square region centered at (cx, cy)
function sampleRegion(
  data: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  cx: number,
  cy: number,
  radius: number,
): [number, number, number] {
  let r = 0, g = 0, b = 0, count = 0;

  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(imgWidth - 1, Math.floor(cx + radius));
  const y1 = Math.min(imgHeight - 1, Math.floor(cy + radius));

  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const idx = (py * imgWidth + px) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }

  if (count === 0) return [128, 128, 128];
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}
