// Pluggable image source interface.
// Anything that can render to a 2D canvas can be a target for the mosaic.

export interface ImageSource {
  // Render the current frame to the given canvas context
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void;
  // How often to update (in milliseconds). 0 = one-shot (static).
  interval: number;
}

export class StaticImageSource implements ImageSource {
  private image: HTMLImageElement;
  interval = 0;

  constructor(image: HTMLImageElement) {
    this.image = image;
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.drawImage(this.image, 0, 0, width, height);
  }
}

export class DigitalClockSource implements ImageSource {
  interval = 60_000; // update every minute

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    // Clear with dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw time in large, bold white text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate font size to fill the canvas
    const fontSize = Math.min(width / 3, height / 1.5);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillText(timeStr, width / 2, height / 2);
  }
}

export class ColorTestSource implements ImageSource {
  interval = 0;

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Render strips using actual Rubik's cube colors for accurate testing
    const colors = ['#ffffff', '#b71234', '#009b48', '#ffd500', '#ff5800', '#0046ad'];
    const stripW = width / colors.length;

    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(i * stripW, 0, stripW, height);
    }
  }
}
