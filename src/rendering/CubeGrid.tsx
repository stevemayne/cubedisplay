import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RubiksCubeVisual, type RubiksCubeHandle } from './RubiksCubeVisual';
import { gridToWorld } from './gridLayout';
import { useStore } from '../store/useStore';
import { generateScramble } from '../cube/scramble';
import { inverseMoves } from '../cube/moves';
import { SOLVED_STATE } from '../cube/constants';
import type { CubeState, Move } from '../cube/types';

interface GridCubeProps {
  col: number;
  row: number;
  cubeIndex: number;
  animationSpeed: number;
  targetState: CubeState;
  targetBaseState: CubeState;
  targetMoves: Move[];
  targetVersion: number;
  frozen: boolean;
}

function GridCube({ col, row, cubeIndex, animationSpeed, targetState, targetBaseState, targetMoves, targetVersion, frozen }: GridCubeProps) {
  const cubeRef = useRef<RubiksCubeHandle>(null);
  const reportCubeSettled = useStore((s) => s.reportCubeSettled);
  const phaseRef = useRef<'idle' | 'animating' | 'waiting'>('waiting');
  const timerRef = useRef(0);
  const targetRef = useRef(targetState);
  const baseStateRef = useRef(targetBaseState);
  const movesRef = useRef(targetMoves);
  const versionRef = useRef(targetVersion);
  const displayedVersionRef = useRef<number | null>(null);
  const frozenRef = useRef(frozen);
  const position = useMemo(() => gridToWorld(col, row), [col, row]);

  // The initial state = the first target state we receive
  const initialState = useMemo(
    () => new Uint8Array(targetState) as CubeState,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Track target changes — schedule a new cycle when target changes
  useEffect(() => {
    const prevVersion = versionRef.current;
    targetRef.current = targetState;
    baseStateRef.current = targetBaseState;
    movesRef.current = targetMoves;
    versionRef.current = targetVersion;

    // If the target actually changed and we're idle (already showing old target),
    // schedule a new cycle to transition to the new target.
    if (
      prevVersion !== targetVersion &&
      displayedVersionRef.current !== null &&
      phaseRef.current === 'idle'
    ) {
      phaseRef.current = 'waiting';
      timerRef.current = Math.random() * 1.5;
    }
  }, [targetState, targetBaseState, targetMoves, targetVersion]);

  // Track frozen changes
  useEffect(() => {
    frozenRef.current = frozen;
    if (frozen) {
      const cube = cubeRef.current;
      if (cube) {
        cube.clearMoves();
        cube.setState(targetRef.current);
        phaseRef.current = 'idle';
        displayedVersionRef.current = versionRef.current;
      }
    } else if (displayedVersionRef.current !== versionRef.current) {
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
        cube.setState(targetRef.current);
        displayedVersionRef.current = versionRef.current;
        reportCubeSettled(cubeIndex);
      }
      return;
    }

    if (phaseRef.current === 'animating') {
      if (!cube.isAnimating()) {
        // Cycle finished — safety snap to target (should be a no-op since
        // the animation already applied the candidate's moves)
        const version = versionRef.current;
        cube.setState(targetRef.current);
        displayedVersionRef.current = version;
        phaseRef.current = 'idle';
        reportCubeSettled(cubeIndex);

        // If target changed DURING the animation, schedule another cycle
        if (version !== versionRef.current) {
          phaseRef.current = 'waiting';
          timerRef.current = Math.random() * 1.5;
        }
      }
    } else if (phaseRef.current === 'waiting') {
      timerRef.current -= delta;
      if (timerRef.current <= 0) {
        // Set the cube to the target's base orientation, then enqueue:
        // scramble → solve (back to base) → candidate's moves (reach target)
        // This way the final moves naturally arrive at the target — no jarring snap.
        const baseState = baseStateRef.current;
        const targetMovesToApply = movesRef.current;
        const scramble = generateScramble(10 + Math.floor(Math.random() * 8));
        const solve = inverseMoves(scramble);

        cube.setState(baseState);
        cube.enqueueMoves([...scramble, ...solve, ...targetMovesToApply]);
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

// Each cube subscribes to its own target state from the store
function GridCubeConnected({ col, row, cubeIndex, animationSpeed, frozen }: Omit<GridCubeProps, 'targetState' | 'targetBaseState' | 'targetMoves' | 'targetVersion'>) {
  const targetState = useStore(
    (s) => s.cubes[cubeIndex]?.targetState ?? SOLVED_STATE
  );
  const targetBaseState = useStore(
    (s) => s.cubes[cubeIndex]?.targetBaseState ?? SOLVED_STATE
  );
  const targetMoves = useStore(
    (s) => s.cubes[cubeIndex]?.targetMoves ?? []
  );
  const targetVersion = useStore(
    (s) => s.cubes[cubeIndex]?.targetVersion ?? 0
  );

  return (
    <GridCube
      col={col}
      row={row}
      cubeIndex={cubeIndex}
      animationSpeed={animationSpeed}
      targetState={targetState}
      targetBaseState={targetBaseState}
      targetMoves={targetMoves}
      targetVersion={targetVersion}
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
