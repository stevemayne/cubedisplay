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

// Named palettes
export interface CubePalette {
  label: string;
  rgb: [number, number, number][];
  hex: number[];
}

export const PALETTES: CubePalette[] = [
  {
    label: 'Classic',
    rgb: COLOR_RGB,
    hex: COLOR_HEX,
  },
  {
    label: 'Pastel',
    rgb: [
      [255, 255, 255], // White
      [255, 158, 170], // Pink
      [126, 219, 166], // Mint
      [255, 243, 163], // Light yellow
      [255, 184, 122], // Peach
      [126, 181, 232], // Sky blue
    ],
    hex: [
      0xffffff, // White
      0xff9eaa, // Pink
      0x7edba6, // Mint
      0xfff3a3, // Light yellow
      0xffb87a, // Peach
      0x7eb5e8, // Sky blue
    ],
  },
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
