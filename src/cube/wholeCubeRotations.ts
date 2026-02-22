import type { CubeState, Orientation, ColorIndex } from './types';
import { OPPOSITE } from './constants';
import { ORIENTATIONS } from './orientations';

// For each of the 24 orientations, the solved state has:
//   U face = all top color
//   F face = all left color
//   R face = all right color
//   D face = opposite of top
//   B face = opposite of left
//   L face = opposite of right

export function solvedStateForOrientation(o: Orientation): CubeState {
  const state = new Uint8Array(54);
  const colors: ColorIndex[] = [
    o.top,                           // U face (indices 0-8)
    o.right,                         // R face (indices 9-17)
    o.left,                          // F face (indices 18-26)
    OPPOSITE[o.top] as ColorIndex,   // D face (indices 27-35)
    OPPOSITE[o.right] as ColorIndex, // L face (indices 36-44)
    OPPOSITE[o.left] as ColorIndex,  // B face (indices 45-53)
  ];

  for (let face = 0; face < 6; face++) {
    for (let i = 0; i < 9; i++) {
      state[face * 9 + i] = colors[face];
    }
  }

  return state;
}

// Pre-compute all 24 solved states
export const ORIENTATION_STATES: CubeState[] = ORIENTATIONS.map(solvedStateForOrientation);
