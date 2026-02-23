import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { CubeGrid } from './CubeGrid';
import { gridCenter, gridToWorld } from './gridLayout';
import { useStore } from '../store/useStore';

const CAM_DIST = 100;

function CameraSetup() {
  const { camera } = useThree();
  const gridCols = useStore((s) => s.gridCols);
  const gridRows = useStore((s) => s.gridRows);

  const target = useMemo(() => gridCenter(gridCols, gridRows), [gridCols, gridRows]);

  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, target]);

  return null;
}

function SceneContent() {
  const gridCols = useStore((s) => s.gridCols);
  const gridRows = useStore((s) => s.gridRows);
  const center = useMemo(() => gridCenter(gridCols, gridRows), [gridCols, gridRows]);

  // Compute zoom to fit the grid.
  // In isometric projection along (1,1,1), the projected width of the grid
  // depends on the span of positions. We compute the bounding box of all
  // grid positions and estimate the projected extent.
  const zoom = useMemo(() => {
    if (gridCols === 0 || gridRows === 0) return 20;

    // Get corner positions to estimate extent
    const corners = [
      gridToWorld(0, 0),
      gridToWorld(gridCols - 1, 0),
      gridToWorld(0, gridRows - 1),
      gridToWorld(gridCols - 1, gridRows - 1),
    ];

    // In isometric projection along (1,1,1)/sqrt(3), the screen-space axes are:
    //   horizontal: (1, 0, -1) / sqrt(2)
    //   vertical: (-1, 2, -1) / sqrt(6)
    // Project all corners onto these axes to find extent
    let minH = Infinity, maxH = -Infinity;
    let minV = Infinity, maxV = -Infinity;
    const invSqrt2 = 1 / Math.sqrt(2);
    const invSqrt6 = 1 / Math.sqrt(6);

    for (const [x, y, z] of corners) {
      const h = (x - z) * invSqrt2;
      const v = (-x + 2 * y - z) * invSqrt6;
      minH = Math.min(minH, h);
      maxH = Math.max(maxH, h);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }

    // Add padding for cube size (each cube extends ~1.5 units from center in projection)
    const cubeRadius = 3; // half a cube side projected
    const extentH = (maxH - minH) + cubeRadius * 3;
    const extentV = (maxV - minV) + cubeRadius * 3;

    // The OrthographicCamera frustum is window.innerWidth/zoom × window.innerHeight/zoom
    const w = window.innerWidth;
    const h = window.innerHeight;

    const zoomH = w / extentH;
    const zoomV = h / extentV;

    return Math.min(zoomH, zoomV) * 0.95;
  }, [gridCols, gridRows]);

  // Position camera along (1,1,1) direction from the center
  const norm = 1 / Math.sqrt(3);
  const camPos: [number, number, number] = [
    center[0] + CAM_DIST * norm,
    center[1] + CAM_DIST * norm,
    center[2] + CAM_DIST * norm,
  ];

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={camPos}
        zoom={zoom}
        near={0.1}
        far={1000}
      />
      <CameraSetup />
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 20, 10]} intensity={0.15} />
      <directionalLight position={[-10, 5, -10]} intensity={0.1} />
      <CubeGrid />
    </>
  );
}

export function Scene() {
  const initGrid = useStore((s) => s.initGrid);

  useEffect(() => {
    initGrid(28, 14);
  }, [initGrid]);

  return (
    <Canvas style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <SceneContent />
    </Canvas>
  );
}
