// Grid layout for isometric cube tessellation.
//
// In isometric projection from direction (1,1,1), a cube projects as a
// pointy-top regular hexagon. To tessellate these hexagons in a rectangular
// mosaic, cubes are placed on the plane x+y+z=0 using axial hex coordinates.
//
// Lattice vectors: e1 = (S, 0, -S), e2 = (0, S, -S)
// Position from axial (q, r): (q*S, r*S, -(q+r)*S)
//
// Rectangular grid (col, row) maps to axial via even-row pointy-top offset:
//   q = col - floor(row / 2)
//   r = row
//
// This produces rows that project as horizontal lines, with odd rows
// shifted right by half a hex width — a standard rectangular hex mosaic.

const S = 3; // cube side length in cubies

export function gridToWorld(col: number, row: number): [number, number, number] {
  const q = col - Math.floor(row / 2);
  const r = row;
  return [q * S, r * S, -(q + r) * S];
}

// Calculate center position for camera target
export function gridCenter(cols: number, rows: number): [number, number, number] {
  // Average the corner positions to find the center
  const p00 = gridToWorld(0, 0);
  const p10 = gridToWorld(cols - 1, 0);
  const p01 = gridToWorld(0, rows - 1);
  const p11 = gridToWorld(cols - 1, rows - 1);
  return [
    (p00[0] + p10[0] + p01[0] + p11[0]) / 4,
    (p00[1] + p10[1] + p01[1] + p11[1]) / 4,
    (p00[2] + p10[2] + p01[2] + p11[2]) / 4,
  ];
}
