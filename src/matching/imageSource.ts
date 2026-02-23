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

// Helper: linear interpolation between two RGB colors
function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgbToCSS(rgb: [number, number, number] | number[]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export class DigitalClockSource implements ImageSource {
  interval = 10_000; // 10s for smooth gradient transitions

  private startTime = Date.now();

  // Cycle through the 3 Rubik's colors with highest contrast against white.
  // Using exact Rubik's RGB values gives distance-0 palette matches.
  private readonly CYCLE_COLORS: [number, number, number][] = [
    [255, 88, 0],   // Orange (CIELAB distance 101.10 from white)
    [183, 18, 52],  // Red    (CIELAB distance 90.67 from white)
    [0, 70, 173],   // Blue   (CIELAB distance 93.19 from white)
  ];
  private readonly CYCLE_DURATION = 180_000;  // 3 minutes for full color cycle
  private readonly ROTATION_PERIOD = 120_000; // gradient angle rotation period

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const elapsed = Date.now() - this.startTime;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    // --- Cycling diagonal gradient background ---
    const cyclePos = (elapsed % this.CYCLE_DURATION) / this.CYCLE_DURATION;
    const segCount = this.CYCLE_COLORS.length;
    const segPos = cyclePos * segCount;
    const segIndex = Math.floor(segPos) % segCount;
    const segFrac = segPos - Math.floor(segPos);

    const c1 = this.CYCLE_COLORS[segIndex];
    const c2 = this.CYCLE_COLORS[(segIndex + 1) % segCount];

    // Two gradient stops: leading and trailing color in the cycle
    const colorA = lerpRgb(c1, c2, segFrac);
    const colorB = lerpRgb(c1, c2, Math.min(1, segFrac + 0.4));

    // Slowly rotating gradient angle
    const angle = (elapsed / this.ROTATION_PERIOD) * 2 * Math.PI;
    const cx = width / 2, cy = height / 2;
    const dx = Math.cos(angle) * width * 0.5;
    const dy = Math.sin(angle) * height * 0.5;
    const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    grad.addColorStop(0, rgbToCSS(colorA));
    grad.addColorStop(1, rgbToCSS(colorB));

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // --- Text rendering ---
    // Start with height-based size, then shrink if text overflows width
    const pad = width * 0.05;
    let fontSize = height * 0.85;
    ctx.font = `900 ${fontSize}px monospace`;
    const measured = ctx.measureText(timeStr);
    if (measured.width > width - pad * 2) {
      fontSize *= (width - pad * 2) / measured.width;
      ctx.font = `900 ${fontSize}px monospace`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Use font metrics for true vertical centering (digits have no descenders,
    // so 'middle' baseline leaves text visually too high)
    const metrics = ctx.measureText(timeStr);
    const textY = height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;

    // Dark outline using darkened gradient color for clean text/background boundary
    const dominantColor = lerpRgb(c1, c2, segFrac + 0.2);
    const darkColor: [number, number, number] = [
      Math.round(dominantColor[0] * 0.35),
      Math.round(dominantColor[1] * 0.35),
      Math.round(dominantColor[2] * 0.35),
    ];
    ctx.strokeStyle = rgbToCSS(darkColor);
    ctx.lineWidth = fontSize / 12;
    ctx.lineJoin = 'round';
    ctx.strokeText(timeStr, width / 2, textY);

    // White fill on top
    ctx.fillStyle = '#ffffff';
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
