import { COLOR_RGB } from '../cube/constants';
import { rgbToLab } from '../utils/color';

// Mutable LAB arrays for the active palette — updated by setActivePalette()
const initialLabs = COLOR_RGB.map((rgb) => rgbToLab(rgb));

export const RUBIK_L: number[] = initialLabs.map((lab) => lab[0]);
export const RUBIK_A: number[] = initialLabs.map((lab) => lab[1]);
export const RUBIK_B: number[] = initialLabs.map((lab) => lab[2]);

// Switch the active palette used for matching
export function setActivePalette(rgb: [number, number, number][]) {
  const labs = rgb.map((c) => rgbToLab(c));
  for (let i = 0; i < 6; i++) {
    RUBIK_L[i] = labs[i][0];
    RUBIK_A[i] = labs[i][1];
    RUBIK_B[i] = labs[i][2];
  }
}
