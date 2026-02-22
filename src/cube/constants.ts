import type { CubeState, ColorIndex } from './types';

// Color indices
export const U_COLOR: ColorIndex = 0; // White
export const R_COLOR: ColorIndex = 1; // Red
export const F_COLOR: ColorIndex = 2; // Green
export const D_COLOR: ColorIndex = 3; // Yellow
export const L_COLOR: ColorIndex = 4; // Orange
export const B_COLOR: ColorIndex = 5; // Blue

// Face offsets in the 54-element array
export const U_OFFSET = 0;
export const R_OFFSET = 9;
export const F_OFFSET = 18;
export const D_OFFSET = 27;
export const L_OFFSET = 36;
export const B_OFFSET = 45;

// RGB values for each color index
export const COLOR_RGB: [number, number, number][] = [
  [255, 255, 255], // 0: White
  [183, 18, 52],   // 1: Red
  [0, 155, 72],    // 2: Green
  [255, 213, 0],   // 3: Yellow
  [255, 88, 0],    // 4: Orange
  [0, 70, 173],    // 5: Blue
];

// Three.js hex colors for rendering
export const COLOR_HEX = [
  0xffffff, // White
  0xb71234, // Red
  0x009b48, // Green
  0xffd500, // Yellow
  0xff5800, // Orange
  0x0046ad, // Blue
];

export const INTERIOR_COLOR = 0x1a1a1a; // Dark gray for non-sticker faces

// Opposite face pairs: color i is opposite to OPPOSITE[i]
export const OPPOSITE: ColorIndex[] = [3, 4, 5, 0, 1, 2];
// White↔Yellow, Red↔Orange, Green↔Blue

export function createSolvedState(): CubeState {
  const state = new Uint8Array(54);
  for (let face = 0; face < 6; face++) {
    for (let i = 0; i < 9; i++) {
      state[face * 9 + i] = face;
    }
  }
  return state;
}

export const SOLVED_STATE: CubeState = createSolvedState();
