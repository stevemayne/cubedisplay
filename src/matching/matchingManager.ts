import type { ImageSource } from './imageSource';
import type { Orientation } from '../cube/types';
import { sampleImageForGrid } from './sample';
import { findAllOrientations } from './search';

// The matching manager renders an image source to an offscreen canvas,
// samples it, and produces target orientations for each cube in the grid.

export class MatchingManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private source: ImageSource | null = null;
  private intervalId: number | null = null;
  private onUpdate: ((orientations: Orientation[]) => void) | null = null;

  // Canvas resolution for sampling (doesn't need to be high)
  private readonly sampleWidth = 128;
  private readonly sampleHeight = 128;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.sampleWidth;
    this.canvas.height = this.sampleHeight;
    this.ctx = this.canvas.getContext('2d')!;
  }

  setSource(source: ImageSource) {
    this.stop();
    this.source = source;
  }

  setOnUpdate(callback: (orientations: Orientation[]) => void) {
    this.onUpdate = callback;
  }

  // Compute orientations for the given grid dimensions
  compute(cols: number, rows: number): Orientation[] {
    if (!this.source) return [];

    this.source.render(this.ctx, this.sampleWidth, this.sampleHeight);
    const imageData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
    const targets = sampleImageForGrid(imageData, cols, rows);
    return findAllOrientations(targets);
  }

  // Start periodic updates (for dynamic sources like the clock)
  start(cols: number, rows: number) {
    this.stop();
    if (!this.source) return;

    // Compute immediately
    const orientations = this.compute(cols, rows);
    this.onUpdate?.(orientations);

    // Set up periodic updates if the source has an interval
    if (this.source.interval > 0) {
      this.intervalId = window.setInterval(() => {
        const orientations = this.compute(cols, rows);
        this.onUpdate?.(orientations);
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
