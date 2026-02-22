// Find the best cube orientation for each grid position.
//
// With only 24 possible orientations, we simply score all of them
// and pick the best match. No stochastic search needed.

import type { Orientation } from '../cube/types';
import { ORIENTATIONS } from '../cube/orientations';
import { COLOR_DISTANCE_TABLE } from './palette';
import type { CubeTarget } from './sample';

// Score an orientation against a target: sum of color distances for 3 zones
function scoreOrientation(orientation: Orientation, target: CubeTarget): number {
  return (
    COLOR_DISTANCE_TABLE[orientation.top][target.top] +
    COLOR_DISTANCE_TABLE[orientation.left][target.left] +
    COLOR_DISTANCE_TABLE[orientation.right][target.right]
  );
}

// Find the best orientation for a single cube target
export function findBestOrientation(target: CubeTarget): Orientation {
  let best = ORIENTATIONS[0];
  let bestScore = Infinity;

  for (const orientation of ORIENTATIONS) {
    const score = scoreOrientation(orientation, target);
    if (score < bestScore) {
      bestScore = score;
      best = orientation;
    }
  }

  return best;
}

// Find the best orientations for an entire grid
export function findAllOrientations(targets: CubeTarget[]): Orientation[] {
  return targets.map(findBestOrientation);
}
