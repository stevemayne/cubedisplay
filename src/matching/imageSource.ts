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

export interface ClockFont {
  label: string;
  css: string;
}

export const CLOCK_FONTS: ClockFont[] = [
  { label: 'Courier', css: "bold %spx 'Courier New', Courier, monospace" },
  { label: 'Helvetica', css: "900 %spx Helvetica, Arial, sans-serif" },
  { label: 'Menlo', css: "bold %spx Menlo, Monaco, monospace" },
  { label: 'Consolas', css: "bold %spx Consolas, 'Liberation Mono', monospace" },
  { label: 'Impact', css: "900 %spx Impact, 'Arial Black', sans-serif" },
  { label: 'DSEG7 Classic', css: "bold %spx 'DSEG7-Classic', monospace" },
  { label: 'DSEG7 Modern', css: "bold %spx 'DSEG7-Modern', monospace" },
  { label: 'DSEG14 Classic', css: "bold %spx 'DSEG14-Classic', monospace" },
  { label: 'DSEG14 Modern', css: "bold %spx 'DSEG14-Modern', monospace" },
];

export class DigitalClockSource implements ImageSource {
  interval = 10_000;
  inverted = false;
  fontIndex = 0;

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const bgColor = this.inverted ? '#0046ad' : '#ff5800';
    const textColor = this.inverted ? '#ff5800' : '#0046ad';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // --- Text rendering ---
    const fontTemplate = CLOCK_FONTS[this.fontIndex]?.css ?? CLOCK_FONTS[0].css;
    const pad = width * 0.05;
    let fontSize = height * 0.85;
    ctx.font = fontTemplate.replace('%s', String(fontSize));
    const measured = ctx.measureText(timeStr);
    if (measured.width > width - pad * 2) {
      fontSize *= (width - pad * 2) / measured.width;
      ctx.font = fontTemplate.replace('%s', String(fontSize));
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Use font metrics for true vertical centering
    const metrics = ctx.measureText(timeStr);
    const textY = height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;

    ctx.fillStyle = textColor;
    ctx.fillText(timeStr, width / 2, textY);
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
