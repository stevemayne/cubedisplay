// Find the best cube state for each grid position by scoring all candidates
// in the pre-computed pool against per-sticker CIELAB targets.

import type { CubeState } from '../cube/types';
import { CANDIDATE_POOL } from './candidates';
import { COLOR_LAB } from './palette';
import type { StickerTarget } from './projection';

// Pre-compute flat LAB arrays for each Rubik's color for fast access
const RUBIK_L = COLOR_LAB.map((lab) => lab[0]);
const RUBIK_A = COLOR_LAB.map((lab) => lab[1]);
const RUBIK_B = COLOR_LAB.map((lab) => lab[2]);

// Score a candidate's visible pattern against a sticker target.
// Returns sum of squared CIELAB distances (skip sqrt for speed).
function scoreCandidate(visiblePattern: Uint8Array, target: StickerTarget): number {
  let total = 0;
  for (let i = 0; i < 27; i++) {
    const colorIdx = visiblePattern[i];
    const tL = target[i][0];
    const tA = target[i][1];
    const tB = target[i][2];
    const dL = tL - RUBIK_L[colorIdx];
    const dA = tA - RUBIK_A[colorIdx];
    const dB = tB - RUBIK_B[colorIdx];
    total += dL * dL + dA * dA + dB * dB;
  }
  return total;
}

// Find the best candidate state for a single cube target
export function findBestState(target: StickerTarget): CubeState {
  let best = CANDIDATE_POOL[0];
  let bestScore = Infinity;

  for (const candidate of CANDIDATE_POOL) {
    const score = scoreCandidate(candidate.visiblePattern, target);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best.state;
}

// Find the best states for an entire grid
export function findAllStates(targets: StickerTarget[]): CubeState[] {
  return targets.map(findBestState);
}
