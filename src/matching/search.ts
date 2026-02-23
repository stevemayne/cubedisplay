// Find the best cube state for each grid position using edge-weighted per-sticker scoring.

import type { CubeState } from '../cube/types';
import { CANDIDATE_POOL, type Candidate } from './candidates';
import { COLOR_LAB } from './palette';
import type { StickerTarget } from './projection';

// Pre-compute flat LAB arrays for each Rubik's color for fast access
const RUBIK_L = COLOR_LAB.map((lab) => lab[0]);
const RUBIK_A = COLOR_LAB.map((lab) => lab[1]);
const RUBIK_B = COLOR_LAB.map((lab) => lab[2]);

// Per-sticker score: weighted sum of 27 deltaE² values.
// Stickers at image edges get higher weights to prioritize boundary accuracy.
function scoreCandidate(
  candidate: Candidate,
  target: StickerTarget,
  weights: Float32Array | null,
): number {
  let error = 0;
  const vp = candidate.visiblePattern;
  for (let i = 0; i < 27; i++) {
    const colorIdx = vp[i];
    const dL = target[i][0] - RUBIK_L[colorIdx];
    const dA = target[i][1] - RUBIK_A[colorIdx];
    const dB = target[i][2] - RUBIK_B[colorIdx];
    const distSq = dL * dL + dA * dA + dB * dB;
    error += weights ? weights[i] * distSq : distSq;
  }
  return error;
}

// Find the best candidate state for a single cube target
export function findBestState(target: StickerTarget, weights: Float32Array | null = null): CubeState {
  let best = CANDIDATE_POOL[0];
  let bestScore = Infinity;

  for (const candidate of CANDIDATE_POOL) {
    const score = scoreCandidate(candidate, target, weights);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best.state;
}

// Find the best states for an entire grid
export function findAllStates(targets: StickerTarget[], weights: Float32Array[] | null = null): CubeState[] {
  return targets.map((target, i) => findBestState(target, weights ? weights[i] : null));
}
