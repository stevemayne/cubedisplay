import type { CubeState, Move } from './types';

// Each move is a permutation: result[i] = source[perm[i]]
//
// Permutations are derived from physically tracking where each sticker moves.
// We use corner and edge cycle analysis to ensure correctness.
//
// Face sticker layout (when looking at face from outside):
//   0 1 2
//   3 4 5
//   6 7 8
//
// Face indices: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
//
// Corner positions (sticker indices):
//   UFR: U[8], F[20], R[9]     UFL: U[6], F[18], L[38]
//   UBR: U[2], B[45], R[11]    UBL: U[0], B[47], L[36]
//   DFR: D[29], F[26], R[15]   DFL: D[27], F[24], L[44]
//   DBR: D[35], B[51], R[17]   DBL: D[33], B[53], L[42]
//
// Edge positions (sticker indices):
//   UF: U[7], F[19]    UB: U[1], B[46]    UR: U[5], R[10]    UL: U[3], L[37]
//   DF: D[28], F[25]   DB: D[34], B[52]   DR: D[32], R[16]   DL: D[30], L[43]
//   FR: F[23], R[12]   FL: F[21], L[41]   BR: B[48], R[14]   BL: B[50], L[39]

// Face CW rotation: position i gets value from FACE_CW_SRC[i]
const FACE_CW_SRC = [6, 3, 0, 7, 4, 1, 8, 5, 2];

function identity(): Uint8Array {
  const p = new Uint8Array(54);
  for (let i = 0; i < 54; i++) p[i] = i;
  return p;
}

function composePerm(a: Uint8Array, b: Uint8Array): Uint8Array {
  const r = new Uint8Array(54);
  for (let i = 0; i < 54; i++) r[i] = a[b[i]];
  return r;
}

function invertPerm(p: Uint8Array): Uint8Array {
  const inv = new Uint8Array(54);
  for (let i = 0; i < 54; i++) inv[p[i]] = i;
  return inv;
}

// Build a permutation from face offset + 4-cycles
// Each cycle is [a, b, c, d] meaning a→b→c→d→a
// In perm terms: p[b]=a, p[c]=b, p[d]=c, p[a]=d
function buildFromCycles(faceOffset: number, cycles: number[][]): Uint8Array {
  const p = identity();

  // Face CW rotation
  for (let i = 0; i < 9; i++) {
    p[faceOffset + i] = faceOffset + FACE_CW_SRC[i];
  }

  // Apply 4-cycles: a→b means "the sticker at a moves to position b"
  // So p[b] = a (position b gets value from position a)
  for (const [a, b, c, d] of cycles) {
    p[b] = a;
    p[c] = b;
    p[d] = c;
    p[a] = d;
  }

  return p;
}

// U CW: pieces cycle F→R→B→L (viewed from top)
// Corner cycle 1: F[20] → R[11] → B[47] → L[38] → F[20]
// Corner cycle 2: R[9]  → B[45] → L[36] → F[18] → R[9]
// Edge cycle:     F[19] → R[10] → B[46] → L[37] → F[19]
const U_PERM = buildFromCycles(0, [
  [20, 11, 47, 38],  // corner cycle 1
  [9, 45, 36, 18],   // corner cycle 2
  [19, 10, 46, 37],  // edge cycle
]);

// R CW: pieces cycle F→U→B→D (viewed from right)
// Corner cycle 1: F[20] → U[2]  → B[51] → D[29] → F[20]
// Corner cycle 2: U[8]  → B[45] → D[35] → F[26] → U[8]
// Edge cycle:     F[23] → U[5]  → B[48] → D[32] → F[23]
const R_PERM = buildFromCycles(9, [
  [20, 2, 51, 29],   // corner cycle 1
  [8, 45, 35, 26],   // corner cycle 2
  [23, 5, 48, 32],   // edge cycle
]);

// F CW: pieces cycle U→R→D→L (viewed from front)
// Corner cycle 1: U[6]  → R[9]  → D[29] → L[44] → U[6]
// Corner cycle 2: L[38] → U[8]  → R[15] → D[27] → L[38]
// Edge cycle:     U[7]  → R[12] → D[28] → L[41] → U[7]
const F_PERM = buildFromCycles(18, [
  [6, 9, 29, 44],    // corner cycle 1
  [38, 8, 15, 27],   // corner cycle 2
  [7, 12, 28, 41],   // edge cycle
]);

// D CW: pieces cycle F→L→B→R (viewed from bottom)
// Corner cycle 1: F[24] → R[15] → B[51] → L[42] → F[24]
// Corner cycle 2: L[44] → F[26] → R[17] → B[53] → L[44]
// Edge cycle:     F[25] → R[16] → B[52] → L[43] → F[25]
const D_PERM = buildFromCycles(27, [
  [24, 15, 51, 42],  // corner cycle 1
  [44, 26, 17, 53],  // corner cycle 2
  [25, 16, 52, 43],  // edge cycle
]);

// L CW: pieces cycle U→F→D→B (viewed from left)
// Corner cycle 1: U[0]  → F[18] → D[27] → B[53] → U[0]
// Corner cycle 2: B[47] → U[6]  → F[24] → D[33] → B[47]
// Edge cycle:     U[3]  → F[21] → D[30] → B[50] → U[3]
const L_PERM = buildFromCycles(36, [
  [0, 18, 27, 53],   // corner cycle 1
  [47, 6, 24, 33],   // corner cycle 2
  [3, 21, 30, 50],   // edge cycle
]);

// B CW: pieces cycle U→L→D→R (viewed from back)
// Corner cycle 1: U[2]  → L[36] → D[33] → R[17] → U[2]
// Corner cycle 2: R[11] → U[0]  → L[42] → D[35] → R[11]
// Edge cycle:     U[1]  → L[39] → D[34] → R[14] → U[1]
const B_PERM = buildFromCycles(45, [
  [2, 36, 33, 17],   // corner cycle 1
  [11, 0, 42, 35],   // corner cycle 2
  [1, 39, 34, 14],   // edge cycle
]);

// Build all 18 move permutations
function buildAllMoves(): Record<Move, Uint8Array> {
  const moves: Partial<Record<Move, Uint8Array>> = {};

  const bases: [Move, Uint8Array][] = [
    ['U', U_PERM], ['R', R_PERM], ['F', F_PERM],
    ['D', D_PERM], ['L', L_PERM], ['B', B_PERM],
  ];

  for (const [name, perm] of bases) {
    moves[name] = perm;
    moves[`${name}'` as Move] = invertPerm(perm);
    moves[`${name}2` as Move] = composePerm(perm, perm);
  }

  return moves as Record<Move, Uint8Array>;
}

export const MOVE_PERMS = buildAllMoves();

export const ALL_MOVES: Move[] = [
  'U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2',
  'D', "D'", 'D2', 'L', "L'", 'L2', 'B', "B'", 'B2',
];

export function applyMove(state: CubeState, move: Move): CubeState {
  const perm = MOVE_PERMS[move];
  const next = new Uint8Array(54);
  for (let i = 0; i < 54; i++) {
    next[i] = state[perm[i]];
  }
  return next;
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  let s = state;
  for (const m of moves) {
    s = applyMove(s, m);
  }
  return s;
}

export function inverseMove(move: Move): Move {
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return move[0] as Move;
  return `${move}'` as Move;
}

export function inverseMoves(moves: Move[]): Move[] {
  return moves.map(inverseMove).reverse();
}
