// Generate a pool of candidate cube states via BFS from all 24 solved orientations.
//
// Each candidate represents a unique visible sticker pattern (the 27 stickers on
// the U, R, F faces — indices 0-26 of the CubeState array). By applying up to N
// moves from each solved orientation, we expand the palette from 24 solid-face
// options to thousands of distinct per-sticker patterns.
//
// Each candidate stores its base orientation (solved state) and the moves applied
// to reach it. This allows smooth animation: solve to base, then apply the
// candidate's moves — avoiding jarring whole-cube snaps.

import type { CubeState, Move } from '../cube/types';
import { ALL_MOVES, applyMove, inverseMove } from '../cube/moves';
import { ORIENTATION_STATES } from '../cube/wholeCubeRotations';

export interface Candidate {
  visiblePattern: Uint8Array; // 27 elements: U(0-8), R(9-17), F(18-26)
  state: CubeState;           // full 54-element state
  baseState: CubeState;       // the solved orientation this was derived from
  moves: Move[];              // moves from baseState to reach this state (0-2 moves)
}

// Extract the visible sticker pattern (first 27 elements = U + R + F faces)
function visibleKey(state: CubeState): string {
  let s = '';
  for (let i = 0; i < 27; i++) {
    s += state[i].toString(36);
  }
  return s;
}

// Get the face letter from a move (e.g., "R'" → "R", "U2" → "U")
function moveFace(move: Move): string {
  return move[0];
}

// Should we prune this move given the last move applied?
function shouldPrune(move: Move, lastMove: Move | null): boolean {
  if (!lastMove) return false;
  // Skip inverse of last move (undoes it)
  if (move === inverseMove(lastMove)) return true;
  // Skip same-face follow-ups (e.g., U after U' — redundant, covered by other combos)
  if (moveFace(move) === moveFace(lastMove)) return true;
  return false;
}

export function generateCandidatePool(maxDepth: number = 2): Candidate[] {
  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  // Queue: [state, depth, lastMove, baseState, movePath]
  const queue: [CubeState, number, Move | null, CubeState, Move[]][] = [];

  // Seed with all 24 solved orientations at depth 0
  for (const baseState of ORIENTATION_STATES) {
    const key = visibleKey(baseState);
    if (!seen.has(key)) {
      seen.add(key);
      const vp = baseState.slice(0, 27) as Uint8Array;
      candidates.push({
        visiblePattern: vp,
        state: new Uint8Array(baseState) as CubeState,
        baseState: new Uint8Array(baseState) as CubeState,
        moves: [],
      });
      queue.push([baseState, 0, null, baseState, []]);
    }
  }

  // BFS expansion
  while (queue.length > 0) {
    const [current, depth, lastMove, baseState, movePath] = queue.shift()!;
    if (depth >= maxDepth) continue;

    for (const move of ALL_MOVES) {
      if (shouldPrune(move, lastMove)) continue;

      const next = applyMove(current, move);
      const key = visibleKey(next);

      if (!seen.has(key)) {
        seen.add(key);
        const vp = next.slice(0, 27) as Uint8Array;
        const nextMoves = [...movePath, move];
        candidates.push({
          visiblePattern: vp,
          state: new Uint8Array(next) as CubeState,
          baseState: new Uint8Array(baseState) as CubeState,
          moves: nextMoves,
        });
        if (depth + 1 < maxDepth) {
          queue.push([next, depth + 1, move, baseState, nextMoves]);
        }
      }
    }
  }

  return candidates;
}

// Pre-compute the candidate pool at module load time
export const CANDIDATE_POOL: Candidate[] = generateCandidatePool(2);
