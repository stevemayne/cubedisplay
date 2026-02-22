import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { CubeGrid } from './CubeGrid';
import { gridCenter } from './gridLayout';
import { useStore } from '../store/useStore';

const CAM_DIST = 50;

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

  // Scale zoom to fit grid
  const zoom = useMemo(() => {
    const maxDim = Math.max(gridCols, gridRows);
    return Math.max(8, 50 / maxDim);
  }, [gridCols, gridRows]);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[center[0] + CAM_DIST, center[1] + CAM_DIST, center[2] + CAM_DIST]}
        zoom={zoom}
        near={0.1}
        far={1000}
      />
      <CameraSetup />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, 5, -10]} intensity={0.3} />
      <CubeGrid />
    </>
  );
}

export function Scene() {
  const initGrid = useStore((s) => s.initGrid);

  useEffect(() => {
    initGrid(8, 6);
  }, [initGrid]);

  return (
    <Canvas style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <SceneContent />
    </Canvas>
  );
}
