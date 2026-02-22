import type { Orientation, ColorIndex } from './types';

// All 24 orientations of a cube, defined by which color is on top (U),
// front (F = left in isometric), and right (R).
//
// Constraints:
// - U, F, R must be 3 mutually adjacent faces (no opposite pairs)
// - For each choice of U (6 options) and F (4 remaining non-opposite options),
//   R is determined (right-hand rule), giving 24 orientations.
//
// Standard solved: U=White(0), F=Green(2), R=Red(1)
//
// We enumerate by choosing which color goes on top, then which goes to front.
// The right face follows from the cross product (right-hand rule).

// Define the "right face" for each (top, front) pair.
// This encodes the physical cube structure.
// When holding a standard cube:
//   top=W(0): front can be G(2)→right=R(1), R(1)→right=B(5), B(5)→right=O(4), O(4)→right=G(2)
//   top=Y(3): front can be G(2)→right=O(4), O(4)→right=B(5), B(5)→right=R(1), R(1)→right=G(2)
//   top=R(1): front can be W(0)→right=G(2), G(2)→right=Y(3), Y(3)→right=B(5), B(5)→right=W(0)
//   top=O(4): front can be W(0)→right=B(5), B(5)→right=Y(3), Y(3)→right=G(2), G(2)→right=W(0)
//   top=G(2): front can be W(0)→right=R(1)... wait, need to check.
//   Actually, top=G(2): looking down at green face.
//   front can be W(0)→right=O(4), O(4)→right=Y(3), Y(3)→right=R(1), R(1)→right=W(0)
//   top=B(5): front can be W(0)→right=R(1), R(1)→right=Y(3), Y(3)→right=O(4), O(4)→right=W(0)

// Let me define this systematically using the adjacency structure.
// The 8 corners of a cube (as color triples, ordered CCW when viewed from outside):
// These define which 3 colors meet at each corner.
// Corner vertices (U, F, R) triples following right-hand convention:
const CORNER_TRIPLES: [ColorIndex, ColorIndex, ColorIndex][] = [
  // Top-layer corners (U = White = 0)
  [0, 2, 1], // White, Green, Red (UFR corner of solved cube)
  [0, 1, 5], // White, Red, Blue
  [0, 5, 4], // White, Blue, Orange
  [0, 4, 2], // White, Orange, Green

  // Bottom-layer corners (equivalent, with Yellow on top)
  [3, 2, 4], // Yellow, Green, Orange
  [3, 4, 5], // Yellow, Orange, Blue
  [3, 5, 1], // Yellow, Blue, Red
  [3, 1, 2], // Yellow, Red, Green
];

// From each corner triple (A, B, C), we can generate 3 orientations
// by rotating which color is on top:
// (A, B, C) → top=A, front=B, right=C
// (B, C, A) → top=B, front=C, right=A
// (C, A, B) → top=C, front=A, right=B
function generateOrientations(): Orientation[] {
  const orientations: Orientation[] = [];
  let id = 0;

  for (const [a, b, c] of CORNER_TRIPLES) {
    // Three cyclic permutations of each corner
    const triples: [ColorIndex, ColorIndex, ColorIndex][] = [
      [a, b, c],
      [b, c, a],
      [c, a, b],
    ];

    for (const [top, front, right] of triples) {
      orientations.push({
        id,
        top,
        left: front,  // F face = left rhombus in isometric
        right,         // R face = right rhombus in isometric
        rotations: [],  // We'll compute move sequences separately if needed
      });
      id++;
    }
  }

  return orientations;
}

export const ORIENTATIONS: Orientation[] = generateOrientations();

// Quick lookup: given a desired (top, left, right) triple, find the orientation
const orientationMap = new Map<string, Orientation>();
for (const o of ORIENTATIONS) {
  orientationMap.set(`${o.top},${o.left},${o.right}`, o);
}

export function findOrientation(top: ColorIndex, left: ColorIndex, right: ColorIndex): Orientation | undefined {
  return orientationMap.get(`${top},${left},${right}`);
}

// Get the RGB colors for an orientation
export function getOrientationColors(o: Orientation): [ColorIndex, ColorIndex, ColorIndex] {
  return [o.top, o.left, o.right];
}
