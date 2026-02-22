// CIELAB color distance for perceptually uniform comparison

type RGB = [number, number, number]; // 0-255
type LAB = [number, number, number]; // L: 0-100, a/b: roughly -128 to 127

// sRGB → linear RGB
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

// Linear RGB → XYZ (D65 illuminant)
function rgbToXyz(rgb: RGB): [number, number, number] {
  const r = linearize(rgb[0]);
  const g = linearize(rgb[1]);
  const b = linearize(rgb[2]);

  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  ];
}

// XYZ → CIELAB
function xyzToLab(xyz: [number, number, number]): LAB {
  // D65 reference white
  const xn = 0.95047, yn = 1.0, zn = 1.08883;

  function f(t: number): number {
    return t > 0.008856 ? Math.cbrt(t) : (903.3 * t + 16) / 116;
  }

  const fx = f(xyz[0] / xn);
  const fy = f(xyz[1] / yn);
  const fz = f(xyz[2] / zn);

  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz),
  ];
}

export function rgbToLab(rgb: RGB): LAB {
  return xyzToLab(rgbToXyz(rgb));
}

// CIEDE2000 is complex; CIE76 (simple Euclidean in LAB) is good enough for our purposes
export function colorDistanceLab(a: LAB, b: LAB): number {
  const dL = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function colorDistanceRgb(a: RGB, b: RGB): number {
  return colorDistanceLab(rgbToLab(a), rgbToLab(b));
}
