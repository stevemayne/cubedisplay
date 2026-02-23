import * as THREE from 'three';
import { COLOR_HEX, INTERIOR_COLOR } from '../cube/constants';

// Shared materials for all cubies — one per Rubik's color + interior
const stickerMaterials = COLOR_HEX.map(
  (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.02 })
);

const interiorMaterial = new THREE.MeshStandardMaterial({
  color: INTERIOR_COLOR,
  roughness: 0.9,
  metalness: 0,
});

export function getMaterial(colorIndex: number | null): THREE.MeshStandardMaterial {
  if (colorIndex === null || colorIndex < 0 || colorIndex > 5) {
    return interiorMaterial;
  }
  return stickerMaterials[colorIndex];
}

// Box face order in Three.js: +X, -X, +Y, -Y, +Z, -Z
// This matches our sticker convention: px, nx, py, ny, pz, nz
export function getCubieMaterials(
  px: number | null,
  nx: number | null,
  py: number | null,
  ny: number | null,
  pz: number | null,
  nz: number | null,
): THREE.MeshStandardMaterial[] {
  return [
    getMaterial(px),
    getMaterial(nx),
    getMaterial(py),
    getMaterial(ny),
    getMaterial(pz),
    getMaterial(nz),
  ];
}
