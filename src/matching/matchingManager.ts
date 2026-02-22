import type { ImageSource } from './imageSource';
import type { CubeState } from '../cube/types';
import { sampleStickersForGrid } from './projection';
import { findAllStates } from './search';

export interface MatchingDebugData {
  imageDataUrl: string;
  states: CubeState[];
  cols: number;
  rows: number;
}

// The matching manager renders an image source to an offscreen canvas,
// samples it per-sticker, and produces target cube states for each cube in the grid.

export class MatchingManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private source: ImageSource | null = null;
  private intervalId: number | null = null;
  private onUpdate: ((states: CubeState[], debug: MatchingDebugData) => void) | null = null;

  // Target pixel budget (total pixels ≈ 256×256)
  private readonly PIXEL_BUDGET = 256 * 256;

  // Screen-space aspect ratio of one hex cell (col spacing / row spacing).
  // Col spacing = 6/sqrt(2), row spacing = 9/sqrt(6).
  private readonly CELL_ASPECT = (6 / Math.sqrt(2)) / (9 / Math.sqrt(6));

  private sampleWidth = 256;
  private sampleHeight = 256;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.sampleWidth;
    this.canvas.height = this.sampleHeight;
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Resize canvas to match the grid's screen-space aspect ratio
  private resizeCanvas(cols: number, rows: number) {
    const aspect = (cols / rows) * this.CELL_ASPECT;
    const h = Math.round(Math.sqrt(this.PIXEL_BUDGET / aspect));
    const w = Math.round(aspect * h);
    if (w !== this.sampleWidth || h !== this.sampleHeight) {
      this.sampleWidth = w;
      this.sampleHeight = h;
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  setSource(source: ImageSource) {
    this.stop();
    this.source = source;
  }

  setOnUpdate(callback: (states: CubeState[], debug: MatchingDebugData) => void) {
    this.onUpdate = callback;
  }

  // Compute target states for the given grid dimensions
  private computeAndNotify(cols: number, rows: number) {
    if (!this.source) return;

    this.resizeCanvas(cols, rows);
    this.source.render(this.ctx, this.sampleWidth, this.sampleHeight);
    const imageData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
    const targets = sampleStickersForGrid(imageData, cols, rows);
    const states = findAllStates(targets);
    const debug: MatchingDebugData = {
      imageDataUrl: this.canvas.toDataURL(),
      states,
      cols,
      rows,
    };
    this.onUpdate?.(states, debug);
  }

  // Start periodic updates (for dynamic sources like the clock)
  start(cols: number, rows: number) {
    this.stop();
    if (!this.source) return;

    // Compute immediately
    this.computeAndNotify(cols, rows);

    // Set up periodic updates if the source has an interval
    if (this.source.interval > 0) {
      this.intervalId = window.setInterval(() => {
        this.computeAndNotify(cols, rows);
      }, this.source.interval);
    }
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  dispose() {
    this.stop();
    this.source = null;
    this.onUpdate = null;
  }
}
