import { useRef, useEffect } from 'react';
import type { MatchingDebugData } from '../matching/matchingManager';
import { COLOR_HEX } from '../cube/constants';

interface DebugOverlayProps {
  debugData: MatchingDebugData | null;
  visible: boolean;
}

function hexToCSS(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

export function DebugOverlay({ debugData, visible }: DebugOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!debugData || !canvasRef.current) return;

    const { orientations, cols, rows } = debugData;
    const canvas = canvasRef.current;
    const cellSize = 24;
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    const ctx = canvas.getContext('2d')!;

    // Draw each cell as 3 colored sections matching the orientation.
    // Flip vertically so the overlay matches the source image
    // (grid row 0 = bottom of screen, but we draw it at the bottom of the canvas).
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const o = orientations[idx];
        if (!o) continue;

        const x = col * cellSize;
        const y = (rows - 1 - row) * cellSize;
        const half = cellSize / 2;

        // Top half = top face color
        ctx.fillStyle = hexToCSS(COLOR_HEX[o.top]);
        ctx.fillRect(x, y, cellSize, half);

        // Bottom-left = left face color
        ctx.fillStyle = hexToCSS(COLOR_HEX[o.left]);
        ctx.fillRect(x, y + half, half, half);

        // Bottom-right = right face color
        ctx.fillStyle = hexToCSS(COLOR_HEX[o.right]);
        ctx.fillRect(x + half, y + half, half, half);

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }, [debugData]);

  if (!visible || !debugData) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 16,
      display: 'flex',
      gap: 12,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {/* Target image */}
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8 }}>
        <div style={{ color: '#aaa', fontSize: 11, marginBottom: 4 }}>Target Image</div>
        <img
          src={debugData.imageDataUrl}
          alt="target"
          style={{ width: 192, height: 192, imageRendering: 'pixelated', border: '1px solid #333' }}
        />
      </div>

      {/* Matched orientations */}
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8 }}>
        <div style={{ color: '#aaa', fontSize: 11, marginBottom: 4 }}>Matched Orientations</div>
        <canvas
          ref={canvasRef}
          style={{ imageRendering: 'pixelated', border: '1px solid #333', height: 192, width: 'auto' }}
        />
      </div>
    </div>
  );
}
