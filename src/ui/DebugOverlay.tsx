import { useRef, useEffect } from 'react';
import type { MatchingDebugData } from '../matching/matchingManager';
import { COLOR_HEX } from '../cube/constants';
import { STICKER_POSITIONS } from '../matching/projection';

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

    const { states, cols, rows } = debugData;
    const canvas = canvasRef.current;
    const cellSize = 36;
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each cell's 27 stickers using projected positions.
    // Flip vertically so grid row 0 (bottom of screen) is at the bottom of the canvas.
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const state = states[idx];
        if (!state) continue;

        const cellX = col * cellSize;
        const cellY = (rows - 1 - row) * cellSize;

        // Draw each sticker as a small colored dot/square at its projected position
        const stickerSize = Math.max(2, cellSize / 6);
        for (const { u, v, stickerIndex } of STICKER_POSITIONS) {
          const colorIdx = state[stickerIndex];
          ctx.fillStyle = hexToCSS(COLOR_HEX[colorIdx]);
          const sx = cellX + u * cellSize - stickerSize / 2;
          const sy = cellY + v * cellSize - stickerSize / 2;
          ctx.fillRect(sx, sy, stickerSize, stickerSize);
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
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

      {/* Matched sticker patterns */}
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8 }}>
        <div style={{ color: '#aaa', fontSize: 11, marginBottom: 4 }}>Matched Stickers</div>
        <canvas
          ref={canvasRef}
          style={{ imageRendering: 'pixelated', border: '1px solid #333', height: 192, width: 'auto' }}
        />
      </div>
    </div>
  );
}
