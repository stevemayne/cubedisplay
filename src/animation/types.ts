import type { Move } from '../cube/types';

export interface MoveAnimation {
  move: Move;
  axis: 'x' | 'y' | 'z';
  layerValue: number;   // -1, 0, or 1: which slice along the axis
  angle: number;        // target rotation in radians (±π/2 or ±π)
  progress: number;     // 0 → 1
}

// Maps each move to its rotation axis, affected layer, and rotation angle
export const MOVE_ANIMATION_DATA: Record<Move, { axis: 'x' | 'y' | 'z'; layer: number; angle: number }> = {
  // U moves: rotate y=1 layer around Y axis
  'U':  { axis: 'y', layer: 1,  angle: -Math.PI / 2 },
  "U'": { axis: 'y', layer: 1,  angle: Math.PI / 2 },
  'U2': { axis: 'y', layer: 1,  angle: Math.PI },

  // D moves: rotate y=-1 layer around Y axis
  'D':  { axis: 'y', layer: -1, angle: Math.PI / 2 },
  "D'": { axis: 'y', layer: -1, angle: -Math.PI / 2 },
  'D2': { axis: 'y', layer: -1, angle: Math.PI },

  // R moves: rotate x=1 layer around X axis
  'R':  { axis: 'x', layer: 1,  angle: -Math.PI / 2 },
  "R'": { axis: 'x', layer: 1,  angle: Math.PI / 2 },
  'R2': { axis: 'x', layer: 1,  angle: Math.PI },

  // L moves: rotate x=-1 layer around X axis
  'L':  { axis: 'x', layer: -1, angle: Math.PI / 2 },
  "L'": { axis: 'x', layer: -1, angle: -Math.PI / 2 },
  'L2': { axis: 'x', layer: -1, angle: Math.PI },

  // F moves: rotate z=1 layer around Z axis
  'F':  { axis: 'z', layer: 1,  angle: -Math.PI / 2 },
  "F'": { axis: 'z', layer: 1,  angle: Math.PI / 2 },
  'F2': { axis: 'z', layer: 1,  angle: Math.PI },

  // B moves: rotate z=-1 layer around Z axis
  'B':  { axis: 'z', layer: -1, angle: Math.PI / 2 },
  "B'": { axis: 'z', layer: -1, angle: -Math.PI / 2 },
  'B2': { axis: 'z', layer: -1, angle: Math.PI },
};
