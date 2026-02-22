import { useRef, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CUBIE_INFOS, type CubieInfo } from './stickerMap';
import { getCubieMaterials } from './materials';
import type { CubeState, Move } from '../cube/types';
import { applyMove } from '../cube/moves';
import { MOVE_ANIMATION_DATA } from '../animation/types';
import { easeInOutCubic } from '../animation/easing';

export interface RubiksCubeHandle {
  enqueueMoves: (moves: Move[]) => void;
  isAnimating: () => boolean;
  setState: (state: CubeState) => void;
  clearMoves: () => void;
}

interface RubiksCubeVisualProps {
  initialState: CubeState;
  position?: [number, number, number];
  animationSpeed?: number; // moves per second, default 4
}

const cubieGeometry = new THREE.BoxGeometry(0.93, 0.93, 0.93);

export const RubiksCubeVisual = forwardRef<RubiksCubeHandle, RubiksCubeVisualProps>(
  function RubiksCubeVisual({ initialState, position = [0, 0, 0], animationSpeed = 4 }, ref) {
    const groupRef = useRef<THREE.Group>(null);

    // Mutable state to avoid re-renders during animation
    const stateRef = useRef<CubeState>(initialState);
    const moveQueueRef = useRef<Move[]>([]);
    const currentMoveRef = useRef<Move | null>(null);
    const progressRef = useRef(0);

    // Refs for each cubie's mesh
    const cubieRefs = useRef<(THREE.Mesh | null)[]>(new Array(CUBIE_INFOS.length).fill(null));

    const cubieBasePositions = useMemo(
      () => CUBIE_INFOS.map((c) => new THREE.Vector3(...c.position)),
      []
    );

    const enqueueMoves = useCallback((moves: Move[]) => {
      moveQueueRef.current.push(...moves);
    }, []);

    const isAnimating = useCallback(() => {
      return currentMoveRef.current !== null || moveQueueRef.current.length > 0;
    }, []);

    const setState = useCallback((state: CubeState) => {
      stateRef.current = state;
    }, []);

    const clearMoves = useCallback(() => {
      moveQueueRef.current = [];
      currentMoveRef.current = null;
      progressRef.current = 0;
    }, []);

    useImperativeHandle(ref, () => ({ enqueueMoves, isAnimating, setState, clearMoves }), [enqueueMoves, isAnimating, setState, clearMoves]);

    // Temp objects to avoid allocations in the animation loop
    const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
    const axisVectors = useMemo(() => ({
      x: new THREE.Vector3(1, 0, 0),
      y: new THREE.Vector3(0, 1, 0),
      z: new THREE.Vector3(0, 0, 1),
    }), []);

    useFrame((_, delta) => {
      // Start next move if idle
      if (currentMoveRef.current === null && moveQueueRef.current.length > 0) {
        currentMoveRef.current = moveQueueRef.current.shift()!;
        progressRef.current = 0;
      }

      const currentMove = currentMoveRef.current;

      if (currentMove === null) {
        // No animation — ensure all cubies at base positions with correct materials
        updateAllCubies(stateRef.current, cubieRefs.current, cubieBasePositions);
        return;
      }

      const moveData = MOVE_ANIMATION_DATA[currentMove];
      const duration = 1 / animationSpeed;
      progressRef.current += delta / duration;

      if (progressRef.current >= 1) {
        // Move complete — apply to logical state
        stateRef.current = applyMove(stateRef.current, currentMove);
        currentMoveRef.current = null;
        progressRef.current = 0;

        // Reset positions
        updateAllCubies(stateRef.current, cubieRefs.current, cubieBasePositions);
        return;
      }

      // Animate the rotating layer
      const easedProgress = easeInOutCubic(progressRef.current);
      const currentAngle = easedProgress * moveData.angle;
      tempQuaternion.setFromAxisAngle(axisVectors[moveData.axis], currentAngle);
      const axisIndex = moveData.axis === 'x' ? 0 : moveData.axis === 'y' ? 1 : 2;

      for (let i = 0; i < CUBIE_INFOS.length; i++) {
        const mesh = cubieRefs.current[i];
        if (!mesh) continue;

        // Update materials from current (pre-move) state
        updateCubieMaterials(mesh, CUBIE_INFOS[i], stateRef.current);

        if (CUBIE_INFOS[i].position[axisIndex] === moveData.layer) {
          // In the rotating layer — apply rotation
          mesh.position.copy(cubieBasePositions[i]).applyQuaternion(tempQuaternion);
          mesh.quaternion.copy(tempQuaternion);
        } else {
          // Not in layer — base position
          mesh.position.copy(cubieBasePositions[i]);
          mesh.quaternion.identity();
        }
      }
    });

    return (
      <group ref={groupRef} position={position}>
        {CUBIE_INFOS.map((cubie, i) => (
          <mesh
            key={i}
            ref={(mesh) => { cubieRefs.current[i] = mesh; }}
            geometry={cubieGeometry}
            position={cubie.position}
          />
        ))}
      </group>
    );
  }
);

function updateCubieMaterials(mesh: THREE.Mesh, cubie: CubieInfo, state: CubeState) {
  const { stickers } = cubie;
  mesh.material = getCubieMaterials(
    stickers.px !== null ? state[stickers.px] : null,
    stickers.nx !== null ? state[stickers.nx] : null,
    stickers.py !== null ? state[stickers.py] : null,
    stickers.ny !== null ? state[stickers.ny] : null,
    stickers.pz !== null ? state[stickers.pz] : null,
    stickers.nz !== null ? state[stickers.nz] : null,
  );
}

function updateAllCubies(
  state: CubeState,
  cubieRefs: (THREE.Mesh | null)[],
  basePositions: THREE.Vector3[],
) {
  for (let i = 0; i < CUBIE_INFOS.length; i++) {
    const mesh = cubieRefs[i];
    if (!mesh) continue;
    mesh.position.copy(basePositions[i]);
    mesh.quaternion.identity();
    updateCubieMaterials(mesh, CUBIE_INFOS[i], state);
  }
}
