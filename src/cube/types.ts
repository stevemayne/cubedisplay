// 54-element array: 6 faces × 9 stickers, values 0-5 (color indices)
// Face order: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
// Sticker layout per face:
//   0 1 2
//   3 4 5   (4 = center, never moves)
//   6 7 8
export type CubeState = Uint8Array;

export type Move =
  | 'U' | "U'" | 'U2'
  | 'R' | "R'" | 'R2'
  | 'F' | "F'" | 'F2'
  | 'D' | "D'" | 'D2'
  | 'L' | "L'" | 'L2'
  | 'B' | "B'" | 'B2';

export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type ColorIndex = 0 | 1 | 2 | 3 | 4 | 5;

// An orientation is identified by which color ends up on U, F, R faces
export interface Orientation {
  id: number;
  top: ColorIndex;
  left: ColorIndex;   // F face in isometric view = left rhombus
  right: ColorIndex;  // R face in isometric view = right rhombus
  // The sequence of whole-cube rotations from solved to reach this orientation
  rotations: Move[];
}
