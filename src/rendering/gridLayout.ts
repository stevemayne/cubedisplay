// Grid layout for isometric cube tessellation.
//
// In isometric projection from direction (1,1,1), a cube projects as a regular hexagon.
// Cubes placed in a simple rectangular grid in 3D (sharing faces) will tessellate
// perfectly as hexagons in the projection.
//
// Each Rubik's cube is 3 units wide (3 cubies). Adjacent cubes share faces,
// so they are placed 3 units apart along each axis.

const CUBE_SPACING = 3; // 3 cubies per cube side

export function gridToWorld(col: number, row: number): [number, number, number] {
  // Place cubes in the XZ plane at y=0
  // The isometric projection handles making them look hexagonal
  return [col * CUBE_SPACING, 0, row * CUBE_SPACING];
}

// Calculate camera zoom to fit the entire grid in view
export function calculateZoom(
  cols: number,
  rows: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  // In isometric projection, the grid spans:
  // Horizontal: roughly cols * CUBE_SPACING * sqrt(2) (diagonal projection)
  // Vertical: roughly rows * CUBE_SPACING * sqrt(2) + some for the cube height
  //
  // The exact projected dimensions depend on the isometric transform.
  // For a (1,1,1) camera direction, the projected width of a unit along X
  // is sqrt(2/3) and along Z is also sqrt(2/3).
  // The projected height contribution from Y is sqrt(1/3).

  const projectedWidth = (cols - 1) * CUBE_SPACING * Math.sqrt(2 / 3) * 2 + CUBE_SPACING * 2;
  const projectedHeight = (rows - 1) * CUBE_SPACING * Math.sqrt(2 / 3) * 2 + CUBE_SPACING * 2;

  const zoomX = viewportWidth / projectedWidth;
  const zoomY = viewportHeight / projectedHeight;

  return Math.min(zoomX, zoomY) * 0.85; // 85% to add some margin
}

// Calculate center position for camera target
export function gridCenter(cols: number, rows: number): [number, number, number] {
  return [
    ((cols - 1) * CUBE_SPACING) / 2,
    0,
    ((rows - 1) * CUBE_SPACING) / 2,
  ];
}
