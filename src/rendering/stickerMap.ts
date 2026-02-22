// Maps each cubie position to its sticker indices in the 54-element state array.
//
// A Rubik's cube has 26 visible cubies in a 3×3×3 grid (excluding the hidden center).
// Cubie positions are (x, y, z) where each is -1, 0, or 1.
// x: -1=L, +1=R
// y: -1=D, +1=U
// z: -1=B, +1=F
//
// Each cubie has up to 3 visible colored faces. The rest are interior (black).
// The face directions map to sticker indices as follows:
//
// +Y face → U stickers (indices 0-8)
// -Y face → D stickers (indices 27-35)
// +X face → R stickers (indices 9-17)
// -X face → L stickers (indices 36-44)
// +Z face → F stickers (indices 18-26)
// -Z face → B stickers (indices 45-53)
//
// Within each face, the sticker index is determined by the cubie's position
// on that face's 3×3 grid.

export interface CubieInfo {
  position: [number, number, number]; // (x, y, z) each -1, 0, or 1
  // Map from face direction to sticker index. null = interior face (black)
  stickers: {
    px: number | null; // +X face (R)
    nx: number | null; // -X face (L)
    py: number | null; // +Y face (U)
    ny: number | null; // -Y face (D)
    pz: number | null; // +Z face (F)
    nz: number | null; // -Z face (B)
  };
}

// Map a 2D position on a face to a sticker index (0-8)
// Row and col are 0-2, where (0,0) is the "top-left" of the face
// when viewed from outside the cube.
function faceIndex(row: number, col: number): number {
  return row * 3 + col;
}

// For each face, map the cubie's (x,y,z) to (row, col) on that face's grid.
// The mapping depends on which axis the face is on and its orientation.

function uStickerIndex(x: number, _y: number, z: number): number {
  // U face viewed from above: rows go from back(z=-1) to front(z=1),
  // cols from left(x=-1) to right(x=1)
  // But standard U face: row0=back, row2=front; col0=left, col2=right
  // U face sticker layout (viewed from above):
  //   0 1 2   ← back edge (z=-1)
  //   3 4 5
  //   6 7 8   ← front edge (z=1)
  // Row 0 = z=-1 (back), Row 2 = z=1 (front)
  // Col 0 = x=-1 (left), Col 2 = x=1 (right)
  return faceIndex(z + 1, x + 1);
}

function dStickerIndex(x: number, _y: number, z: number): number {
  // D face viewed from below:
  //   27 28 29  ← front edge (z=1)
  //   30 31 32
  //   33 34 35  ← back edge (z=-1)
  // Row 0 = z=1 (front), Row 2 = z=-1 (back)
  // Col 0 = x=-1 (left), Col 2 = x=1 (right)
  return 27 + faceIndex(-z + 1, x + 1);
}

function rStickerIndex(_x: number, y: number, z: number): number {
  // R face viewed from right side:
  //   9  10 11  ← top edge (y=1)
  //   12 13 14
  //   15 16 17  ← bottom edge (y=-1)
  // Row 0 = y=1 (top), Row 2 = y=-1 (bottom)
  // Col 0 = z=1 (front), Col 2 = z=-1 (back)
  return 9 + faceIndex(-y + 1, -z + 1);
}

function lStickerIndex(_x: number, y: number, z: number): number {
  // L face viewed from left side:
  //   36 37 38  ← top edge (y=1)
  //   39 40 41
  //   42 43 44  ← bottom edge (y=-1)
  // Row 0 = y=1 (top), Row 2 = y=-1 (bottom)
  // Col 0 = z=-1 (back), Col 2 = z=1 (front)
  return 36 + faceIndex(-y + 1, z + 1);
}

function fStickerIndex(x: number, y: number, _z: number): number {
  // F face viewed from front:
  //   18 19 20  ← top edge (y=1)
  //   21 22 23
  //   24 25 26  ← bottom edge (y=-1)
  // Row 0 = y=1 (top), Row 2 = y=-1 (bottom)
  // Col 0 = x=-1 (left), Col 2 = x=1 (right)
  return 18 + faceIndex(-y + 1, x + 1);
}

function bStickerIndex(x: number, y: number, _z: number): number {
  // B face viewed from back:
  //   45 46 47  ← top edge (y=1)
  //   48 49 50
  //   51 52 53  ← bottom edge (y=-1)
  // Row 0 = y=1 (top), Row 2 = y=-1 (bottom)
  // Col 0 = x=1 (right in world), Col 2 = x=-1 (left in world)
  // (mirrored because we're viewing from behind)
  return 45 + faceIndex(-y + 1, -x + 1);
}

export function buildCubieInfos(): CubieInfo[] {
  const cubies: CubieInfo[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Skip the hidden center cubie
        if (x === 0 && y === 0 && z === 0) continue;

        const stickers = {
          px: x === 1 ? rStickerIndex(x, y, z) : null,
          nx: x === -1 ? lStickerIndex(x, y, z) : null,
          py: y === 1 ? uStickerIndex(x, y, z) : null,
          ny: y === -1 ? dStickerIndex(x, y, z) : null,
          pz: z === 1 ? fStickerIndex(x, y, z) : null,
          nz: z === -1 ? bStickerIndex(x, y, z) : null,
        };

        cubies.push({
          position: [x, y, z],
          stickers,
        });
      }
    }
  }

  return cubies;
}

export const CUBIE_INFOS = buildCubieInfos();

// Which cubies belong to a given layer (for face rotation animation)
export function getCubiesInLayer(
  axis: 'x' | 'y' | 'z',
  layerValue: number // -1, 0, or 1
): number[] {
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  return CUBIE_INFOS
    .map((c, i) => (c.position[axisIndex] === layerValue ? i : -1))
    .filter((i) => i !== -1);
}
