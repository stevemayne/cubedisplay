// Sample a target image into 3-color targets for each cube in the grid.
//
// In isometric projection, each cube appears as a hexagon divided into 3 rhombuses:
//   - Top: the U face
//   - Bottom-left: the F face
//   - Bottom-right: the R face
//
// For our simplified model, we just need the average color in each of these
// 3 zones per hex cell.
//
// The hex layout in screen space:
//
//        /\
//       / U \
//      /    \
//     |\ F /| R |
//     | \/ |    |
//     |    |    |
//      \  / \  /
//       \/   \/
//
// For a rectangular grid of cubes viewed isometrically, the screen-space positions
// form a regular pattern. Rather than computing exact hex geometry, we sample
// the image at the approximate center of each zone.

import type { ColorIndex } from '../cube/types';
import { nearestRubikColor } from './palette';

export interface CubeTarget {
  top: ColorIndex;
  left: ColorIndex;   // F face
  right: ColorIndex;  // R face
}

// Sample an image canvas and produce a target for each cube in a cols×rows grid.
// The image is mapped to fill the entire grid area.
export function sampleImageForGrid(
  imageData: ImageData,
  cols: number,
  rows: number,
): CubeTarget[] {
  const { width, height, data } = imageData;
  const targets: CubeTarget[] = [];

  // In isometric projection from (1,1,1), the projected grid of cubes:
  // Each cube occupies a hexagonal region.
  //
  // For a grid of cols×rows cubes, the screen-space layout maps to:
  // - Horizontal: each column shifts right by ~cube_width_in_screen
  // - Vertical: each row shifts down by ~cube_height_in_screen
  //
  // For simplicity, we divide the image into a cols×rows grid of cells.
  // Within each cell, the top third = U face, bottom-left sixth = F, bottom-right sixth = R.
  //
  // More precisely, for a hexagonal cell:
  // - Top 1/3 of the hex area → U face (top rhombus)
  // - Bottom-left 1/3 → F face
  // - Bottom-right 1/3 → R face
  //
  // We approximate this by dividing each cell into a simple 2×2 grid:
  // - Top half → U face
  // - Bottom-left quarter → F face
  // - Bottom-right quarter → R face

  const cellW = width / cols;
  const cellH = height / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * cellW;
      const cy = row * cellH;

      // Sample top zone (U face): upper half of cell
      const topColor = sampleRegion(data, width, height,
        cx, cy, cellW, cellH * 0.5);

      // Sample bottom-left zone (F face): lower-left quarter
      const leftColor = sampleRegion(data, width, height,
        cx, cy + cellH * 0.5, cellW * 0.5, cellH * 0.5);

      // Sample bottom-right zone (R face): lower-right quarter
      const rightColor = sampleRegion(data, width, height,
        cx + cellW * 0.5, cy + cellH * 0.5, cellW * 0.5, cellH * 0.5);

      targets.push({
        top: nearestRubikColor(topColor),
        left: nearestRubikColor(leftColor),
        right: nearestRubikColor(rightColor),
      });
    }
  }

  return targets;
}

// Sample average RGB color in a rectangular region of the image
function sampleRegion(
  data: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  x: number,
  y: number,
  w: number,
  h: number,
): [number, number, number] {
  let r = 0, g = 0, b = 0, count = 0;

  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(imgWidth, Math.floor(x + w));
  const y1 = Math.min(imgHeight, Math.floor(y + h));

  // Sample every few pixels for speed (don't need every pixel for average)
  const step = Math.max(1, Math.floor(Math.min(w, h) / 8));

  for (let py = y0; py < y1; py += step) {
    for (let px = x0; px < x1; px += step) {
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
