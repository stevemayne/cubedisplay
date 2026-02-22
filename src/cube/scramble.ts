import type { Move } from './types';
import { ALL_MOVES } from './moves';

// Generate a random scramble of the given length.
// Avoids consecutive moves on the same face (e.g. R R' is pointless).
// Also avoids redundant patterns like R L R (same axis, could simplify).
export function generateScramble(length: number): Move[] {
  const moves: Move[] = [];
  const faceOf = (m: Move) => m[0]; // 'U', 'R', 'F', 'D', 'L', 'B'

  // Faces on same axis (moves on these can commute)
  const sameAxis: Record<string, string> = {
    U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F',
  };

  for (let i = 0; i < length; i++) {
    let move: Move;
    let attempts = 0;
    do {
      move = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)];
      attempts++;
      // Avoid same face as last move
      if (moves.length > 0 && faceOf(move) === faceOf(moves[moves.length - 1])) continue;
      // Avoid A-B-A pattern where A and B are on same axis
      if (moves.length > 1) {
        const prev = faceOf(moves[moves.length - 1]);
        const prevPrev = faceOf(moves[moves.length - 2]);
        if (faceOf(move) === prevPrev && sameAxis[prev] === prevPrev) continue;
      }
      break;
    } while (attempts < 100);
    moves.push(move);
  }

  return moves;
}
