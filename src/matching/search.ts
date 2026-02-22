// Find the best cube state for each grid position using per-sticker scoring.

import type { CubeState } from '../cube/types';
import { CANDIDATE_POOL, type Candidate } from './candidates';
import { COLOR_LAB } from './palette';
import type { StickerTarget } from './projection';

// Pre-compute flat LAB arrays for each Rubik's color for fast access
const RUBIK_L = COLOR_LAB.map((lab) => lab[0]);
const RUBIK_A = COLOR_LAB.map((lab) => lab[1]);
const RUBIK_B = COLOR_LAB.map((lab) => lab[2]);

// Per-sticker score: sum of 27 deltaE² values
function scoreCandidate(
  candidate: Candidate,
  target: StickerTarget,
): number {
  let error = 0;
  const vp = candidate.visiblePattern;
  for (let i = 0; i < 27; i++) {
    const colorIdx = vp[i];
    const dL = target[i][0] - RUBIK_L[colorIdx];
    const dA = target[i][1] - RUBIK_A[colorIdx];
    const dB = target[i][2] - RUBIK_B[colorIdx];
    error += dL * dL + dA * dA + dB * dB;
  }
  return error;
}

// Find the best candidate state for a single cube target
export function findBestState(target: StickerTarget): CubeState {
  let best = CANDIDATE_POOL[0];
  let bestScore = Infinity;

  for (const candidate of CANDIDATE_POOL) {
    const score = scoreCandidate(candidate, target);
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
