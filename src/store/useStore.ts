import { create } from 'zustand';
import type { CubeState, Move } from '../cube/types';
import { SOLVED_STATE } from '../cube/constants';
import { generateScramble } from '../cube/scramble';
import { inverseMoves } from '../cube/moves';
import type { TargetResult } from '../matching/search';

export type CubePhase = 'idle' | 'scrambling' | 'solving' | 'displaying';

export interface CubeInstance {
  id: number;
  col: number;
  row: number;
  state: CubeState;
  targetState: CubeState;
  targetBaseState: CubeState;   // solved orientation the target was derived from
  targetMoves: Move[];          // moves from baseState to reach targetState
  targetVersion: number; // increments when targetState actually changes
  phase: CubePhase;
  moveQueue: Move[];
  displayTimer: number; // seconds remaining in display phase
}

interface AppState {
  // Grid config
  gridCols: number;
  gridRows: number;

  // Cube instances
  cubes: CubeInstance[];

  // Animation
  animationSpeed: number; // moves per second
  isPlaying: boolean;
  frozen: boolean; // When true, all cubes show target state without animating

  // Actions
  initGrid: (cols: number, rows: number) => void;
  setAnimationSpeed: (speed: number) => void;
  togglePlay: () => void;
  setFrozen: (frozen: boolean) => void;
  setAllTargets: (results: TargetResult[]) => void;
  startCycle: (cubeId: number) => void;
}

// Compare two CubeStates by visible content (first 27 elements = U+R+F faces)
function visibleStatesEqual(a: CubeState, b: CubeState): boolean {
  for (let i = 0; i < 27; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function createCubeInstance(id: number, col: number, row: number): CubeInstance {
  return {
    id,
    col,
    row,
    state: SOLVED_STATE,
    targetState: SOLVED_STATE,
    targetBaseState: SOLVED_STATE,
    targetMoves: [],
    targetVersion: 0,
    phase: 'idle',
    moveQueue: [],
    displayTimer: 0,
  };
}

export const useStore = create<AppState>((set) => ({
  gridCols: 5,
  gridRows: 5,
  cubes: [],
  animationSpeed: 6,
  isPlaying: true,
  frozen: false,

  initGrid: (cols: number, rows: number) => {
    const cubes: CubeInstance[] = [];
    let id = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cubes.push(createCubeInstance(id++, col, row));
      }
    }
    set({ gridCols: cols, gridRows: rows, cubes });
  },

  setAnimationSpeed: (speed: number) => set({ animationSpeed: speed }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setFrozen: (frozen: boolean) => set({ frozen }),

  setAllTargets: (results: TargetResult[]) => {
    set((s) => ({
      cubes: s.cubes.map((c, i) => {
        const result = results[i];
        if (!result) return c;
        // Only bump version if the visible pattern actually changed
        if (visibleStatesEqual(c.targetState, result.state)) return c;
        return {
          ...c,
          targetState: result.state,
          targetBaseState: result.baseState,
          targetMoves: result.moves,
          targetVersion: c.targetVersion + 1,
        };
      }),
    }));
  },

  startCycle: (cubeId: number) => {
    set((s) => {
      const cube = s.cubes.find((c) => c.id === cubeId);
      if (!cube || cube.phase !== 'idle') return s;

      const scramble = generateScramble(12 + Math.floor(Math.random() * 8));
      const solve = inverseMoves(scramble);

      return {
        cubes: s.cubes.map((c) =>
          c.id === cubeId
            ? {
                ...c,
                phase: 'scrambling' as CubePhase,
                moveQueue: [...scramble, ...solve],
              }
            : c
        ),
      };
    });
  },
}));
