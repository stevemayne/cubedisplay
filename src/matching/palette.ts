import { COLOR_RGB } from '../cube/constants';
import { rgbToLab, colorDistanceLab } from '../utils/color';
import type { ColorIndex } from '../cube/types';

// Pre-compute LAB values for each Rubik's color
export const COLOR_LAB = COLOR_RGB.map((rgb) => rgbToLab(rgb));

// Pre-compute 6×6 distance table between all Rubik's colors
export const COLOR_DISTANCE_TABLE: number[][] = Array.from({ length: 6 }, (_, i) =>
  Array.from({ length: 6 }, (_, j) => colorDistanceLab(COLOR_LAB[i], COLOR_LAB[j]))
);

// Find the nearest Rubik's color to an arbitrary RGB value
export function nearestRubikColor(rgb: [number, number, number]): ColorIndex {
  const lab = rgbToLab(rgb);
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < 6; i++) {
    const d = colorDistanceLab(lab, COLOR_LAB[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  return bestIdx as ColorIndex;
}
