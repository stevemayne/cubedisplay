export type { CubeState, Move, Face, ColorIndex, Orientation } from './types';
export { SOLVED_STATE, COLOR_RGB, COLOR_HEX, INTERIOR_COLOR, OPPOSITE, createSolvedState } from './constants';
export { applyMove, applyMoves, ALL_MOVES, MOVE_PERMS, inverseMove, inverseMoves } from './moves';
export { ORIENTATIONS, findOrientation, getOrientationColors } from './orientations';
export { generateScramble } from './scramble';

import type { CubeState, ColorIndex } from './types';
import { U_OFFSET, R_OFFSET, F_OFFSET } from './constants';

// Get the 3 visible face colors (assuming each face is solid / checking center sticker)
export function getVisibleFaceColors(state: CubeState): [ColorIndex, ColorIndex, ColorIndex] {
  return [
    state[U_OFFSET + 4] as ColorIndex, // U center = top
    state[F_OFFSET + 4] as ColorIndex, // F center = left
    state[R_OFFSET + 4] as ColorIndex, // R center = right
  ];
}
