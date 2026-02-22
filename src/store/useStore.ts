import { create } from 'zustand';
import type { CubeState, Move, Orientation } from '../cube/types';
import { SOLVED_STATE } from '../cube/constants';
import { generateScramble } from '../cube/scramble';
import { inverseMoves } from '../cube/moves';
import { ORIENTATIONS } from '../cube/orientations';

export type CubePhase = 'idle' | 'scrambling' | 'solving' | 'displaying';

export interface CubeInstance {
  id: number;
  col: number;
  row: number;
  state: CubeState;
  targetOrientation: Orientation;
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
  setTargetOrientation: (cubeId: number, orientation: Orientation) => void;
  setAllTargets: (orientations: Orientation[]) => void;
  startCycle: (cubeId: number) => void;
}

function createCubeInstance(id: number, col: number, row: number): CubeInstance {
  return {
    id,
    col,
    row,
    state: SOLVED_STATE,
    targetOrientation: ORIENTATIONS[0], // default: standard solved orientation
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

  setTargetOrientation: (cubeId: number, orientation: Orientation) => {
    set((s) => ({
      cubes: s.cubes.map((c) =>
        c.id === cubeId ? { ...c, targetOrientation: orientation } : c
      ),
    }));
  },

  setAllTargets: (orientations: Orientation[]) => {
    set((s) => ({
      cubes: s.cubes.map((c, i) => ({
        ...c,
        targetOrientation: orientations[i] ?? c.targetOrientation,
      })),
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
