import { useCallback, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

interface ControlsProps {
  onImageUpload: (image: HTMLImageElement) => void;
  onClockMode: () => void;
  onColorTest: () => void;
  activeSource: 'clock' | 'image' | 'test';
}

export function Controls({ onImageUpload, onClockMode, onColorTest, activeSource }: ControlsProps) {
  const gridCols = useStore((s) => s.gridCols);
  const gridRows = useStore((s) => s.gridRows);
  const animationSpeed = useStore((s) => s.animationSpeed);
  const setAnimationSpeed = useStore((s) => s.setAnimationSpeed);
  const initGrid = useStore((s) => s.initGrid);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cols, setCols] = useState(gridCols);
  const [rows, setRows] = useState(gridRows);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const img = new Image();
      img.onload = () => onImageUpload(img);
      img.src = URL.createObjectURL(file);
    },
    [onImageUpload]
  );

  const handleGridResize = useCallback(() => {
    initGrid(cols, rows);
  }, [initGrid, cols, rows]);

  return (
    <div style={panelStyle}>
      <div style={sectionStyle}>
        <label style={labelStyle}>Source</label>
        <div style={buttonGroupStyle}>
          <button
            style={activeSource === 'clock' ? activeButtonStyle : buttonStyle}
            onClick={onClockMode}
          >
            Clock
          </button>
          <button
            style={activeSource === 'test' ? activeButtonStyle : buttonStyle}
            onClick={onColorTest}
          >
            Test
          </button>
          <button
            style={activeSource === 'image' ? activeButtonStyle : buttonStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            Image
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          Speed: {animationSpeed.toFixed(1)} moves/s
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Grid: {cols} × {rows}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="range"
            min="2"
            max="20"
            value={cols}
            onChange={(e) => setCols(parseInt(e.target.value))}
            style={{ ...sliderStyle, flex: 1 }}
          />
          <span style={{ color: '#999', fontSize: 12 }}>×</span>
          <input
            type="range"
            min="2"
            max="15"
            value={rows}
            onChange={(e) => setRows(parseInt(e.target.value))}
            style={{ ...sliderStyle, flex: 1 }}
          />
          <button style={buttonStyle} onClick={handleGridResize}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(10px)',
  borderRadius: 12,
  padding: 16,
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 13,
  minWidth: 240,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#aaa',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
};

const buttonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 6,
  color: '#fff',
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: 12,
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'rgba(100, 140, 255, 0.3)',
  borderColor: 'rgba(100, 140, 255, 0.6)',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  accentColor: '#648cff',
};
