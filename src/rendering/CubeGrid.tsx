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
  frozen: boolean;
}

function GridCube({ col, row, cubeIndex, animationSpeed, targetOrientation, frozen }: GridCubeProps) {
  const cubeRef = useRef<RubiksCubeHandle>(null);
  const phaseRef = useRef<'idle' | 'animating' | 'waiting'>('waiting');
  const timerRef = useRef(0);
  const targetRef = useRef(targetOrientation);
  const displayedTargetRef = useRef<Orientation | null>(null);
  const frozenRef = useRef(frozen);
  const position = useMemo(() => gridToWorld(col, row), [col, row]);

  // The initial state = the solved state for the target orientation
  const initialState = useMemo(
    () => solvedStateForOrientation(targetOrientation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Track target changes — schedule a new cycle when target changes
  useEffect(() => {
    const prevTarget = targetRef.current;
    targetRef.current = targetOrientation;

    // If the target actually changed and we're idle (already showing old target),
    // schedule a new cycle to transition to the new target.
    if (
      prevTarget.id !== targetOrientation.id &&
      displayedTargetRef.current !== null &&
      phaseRef.current === 'idle'
    ) {
      phaseRef.current = 'waiting';
      timerRef.current = Math.random() * 1.5;
    }
  }, [targetOrientation]);

  // Track frozen changes
  useEffect(() => {
    frozenRef.current = frozen;
    if (frozen) {
      const cube = cubeRef.current;
      if (cube) {
        cube.clearMoves();
        cube.setState(solvedStateForOrientation(targetRef.current));
        phaseRef.current = 'idle';
        displayedTargetRef.current = targetRef.current;
      }
    } else if (displayedTargetRef.current?.id !== targetRef.current.id) {
      // Unfreezing with a pending target change
      phaseRef.current = 'waiting';
      timerRef.current = Math.random() * 1.5;
    }
  }, [frozen]);

  useFrame((_, delta) => {
    const cube = cubeRef.current;
    if (!cube) return;

    if (frozenRef.current) {
      if (cube.isAnimating()) {
        cube.clearMoves();
        cube.setState(solvedStateForOrientation(targetRef.current));
        displayedTargetRef.current = targetRef.current;
      }
      return;
    }

    if (phaseRef.current === 'animating') {
      if (!cube.isAnimating()) {
        // Cycle finished — snap to current target and hold
        const target = targetRef.current;
        cube.setState(solvedStateForOrientation(target));
        displayedTargetRef.current = target;
        phaseRef.current = 'idle';

        // If target changed DURING the animation, schedule another cycle
        if (target.id !== targetRef.current.id) {
          phaseRef.current = 'waiting';
          timerRef.current = Math.random() * 1.5;
        }
      }
    } else if (phaseRef.current === 'waiting') {
      timerRef.current -= delta;
      if (timerRef.current <= 0) {
        const scramble = generateScramble(10 + Math.floor(Math.random() * 8));
        const solve = inverseMoves(scramble);
        cube.enqueueMoves([...scramble, ...solve]);
        phaseRef.current = 'animating';
      }
    }
    // 'idle' phase: do nothing, cube holds its displayed state
  });

  // Stagger initial start — all cubes begin with a 'waiting' cycle to show their first target
  useEffect(() => {
    timerRef.current = (cubeIndex * 0.2) % 2.5;
    phaseRef.current = 'waiting';
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
function GridCubeConnected({ col, row, cubeIndex, animationSpeed, frozen }: Omit<GridCubeProps, 'targetOrientation'>) {
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
      frozen={frozen}
    />
  );
}

export function CubeGrid() {
  const gridCols = useStore((s) => s.gridCols);
  const gridRows = useStore((s) => s.gridRows);
  const animationSpeed = useStore((s) => s.animationSpeed);
  const frozen = useStore((s) => s.frozen);

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
          frozen={frozen}
        />
      ))}
    </group>
  );
}
