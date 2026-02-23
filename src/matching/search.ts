// Find the best cube state for each grid position using edge-weighted per-sticker scoring.

import type { CubeState, Move } from '../cube/types';
import { CANDIDATE_POOL, type Candidate } from './candidates';
import { RUBIK_L, RUBIK_A, RUBIK_B } from './palette';
import type { StickerTarget } from './projection';

// Result returned for each grid cell — includes animation info
export interface TargetResult {
  state: CubeState;
  baseState: CubeState;
  moves: Move[];
}

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

// Find the best candidate for a single cube target
export function findBestMatch(target: StickerTarget, weights: Float32Array | null = null): TargetResult {
  let best = CANDIDATE_POOL[0];
  let bestScore = Infinity;

  for (const candidate of CANDIDATE_POOL) {
    const score = scoreCandidate(candidate, target, weights);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return { state: best.state, baseState: best.baseState, moves: best.moves };
}

// Find the best matches for an entire grid
export function findAllMatches(targets: StickerTarget[], weights: Float32Array[] | null = null): TargetResult[] {
  return targets.map((target, i) => findBestMatch(target, weights ? weights[i] : null));
}
