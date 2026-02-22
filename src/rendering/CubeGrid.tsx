import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RubiksCubeVisual, type RubiksCubeHandle } from './RubiksCubeVisual';
import { gridToWorld } from './gridLayout';
import { useStore } from '../store/useStore';
import { generateScramble } from '../cube/scramble';
import { inverseMoves } from '../cube/moves';
import { solvedStateForOrientation } from '../cube/wholeCubeRotations';
import { ORIENTATIONS } from '../cube/orientations';
import type { Orientation } from '../cube/types';

interface GridCubeProps {
  col: number;
  row: number;
  cubeIndex: number;
  animationSpeed: number;
  targetOrientation: Orientation;
}

function GridCube({ col, row, cubeIndex, animationSpeed, targetOrientation }: GridCubeProps) {
  const cubeRef = useRef<RubiksCubeHandle>(null);
  const phaseRef = useRef<'idle' | 'animating'>('idle');
  const timerRef = useRef(0);
  const targetRef = useRef(targetOrientation);
  const position = useMemo(() => gridToWorld(col, row), [col, row]);

  // The initial state = the solved state for the target orientation
  const initialState = useMemo(
    () => solvedStateForOrientation(targetOrientation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Track target changes
  useEffect(() => {
    targetRef.current = targetOrientation;
  }, [targetOrientation]);

  useFrame((_, delta) => {
    const cube = cubeRef.current;
    if (!cube) return;

    if (phaseRef.current === 'animating') {
      if (!cube.isAnimating()) {
        // Cycle finished — update to current target state and pause
        const targetState = solvedStateForOrientation(targetRef.current);
        cube.setState(targetState);
        phaseRef.current = 'idle';
        timerRef.current = 1.5 + Math.random() * 2;
      }
    } else if (phaseRef.current === 'idle') {
      timerRef.current -= delta;
      if (timerRef.current <= 0) {
        const scramble = generateScramble(10 + Math.floor(Math.random() * 8));
        const solve = inverseMoves(scramble);
        cube.enqueueMoves([...scramble, ...solve]);
        phaseRef.current = 'animating';
      }
    }
  });

  // Stagger initial start times based on position
  useEffect(() => {
    timerRef.current = (cubeIndex * 0.2) % 2.5;
  }, [cubeIndex]);

  return (
    <RubiksCubeVisual
      ref={cubeRef}
      initialState={initialState}
      position={position}
      animationSpeed={animationSpeed}
    />
  );
}

// Each cube subscribes to its own target orientation from the store
function GridCubeConnected({ col, row, cubeIndex, animationSpeed }: Omit<GridCubeProps, 'targetOrientation'>) {
  const targetOrientation = useStore(
    (s) => s.cubes[cubeIndex]?.targetOrientation ?? ORIENTATIONS[0]
  );

  return (
    <GridCube
      col={col}
      row={row}
      cubeIndex={cubeIndex}
      animationSpeed={animationSpeed}
      targetOrientation={targetOrientation}
    />
  );
}

export function CubeGrid() {
  const gridCols = useStore((s) => s.gridCols);
  const gridRows = useStore((s) => s.gridRows);
  const animationSpeed = useStore((s) => s.animationSpeed);

  const cubes = useMemo(() => {
    const result: { col: number; row: number; index: number }[] = [];
    let index = 0;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        result.push({ col, row, index: index++ });
      }
    }
    return result;
  }, [gridCols, gridRows]);

  return (
    <group>
      {cubes.map((c) => (
        <GridCubeConnected
          key={`${c.col}-${c.row}`}
          col={c.col}
          row={c.row}
          cubeIndex={c.index}
          animationSpeed={animationSpeed}
        />
      ))}
    </group>
  );
}
