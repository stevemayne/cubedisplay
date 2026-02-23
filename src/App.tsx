import { useCallback, useEffect, useRef, useState } from 'react';
import { Scene } from './rendering/Scene';
import { Controls } from './ui/Controls';
import { DebugOverlay } from './ui/DebugOverlay';
import { MatchingManager, type MatchingDebugData } from './matching/matchingManager';
import { DigitalClockSource, StaticImageSource, ColorTestSource } from './matching/imageSource';
import { PALETTES } from './cube/constants';
import { setActivePalette } from './matching/palette';
import { setMaterialPalette } from './rendering/materials';
import { useStore } from './store/useStore';

function App() {
  const gridCols = useStore((s) => s.gridCols);
  const gridRows = useStore((s) => s.gridRows);
  const setAllTargets = useStore((s) => s.setAllTargets);
  const setOnAllSettled = useStore((s) => s.setOnAllSettled);
  const managerRef = useRef<MatchingManager | null>(null);
  const clockSourceRef = useRef<DigitalClockSource | null>(null);
  const inversionTimerRef = useRef<number | null>(null);
  const [activeSource, setActiveSource] = useState<'clock' | 'image' | 'test'>('clock');
  const [debugData, setDebugData] = useState<MatchingDebugData | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [clockFontIndex, setClockFontIndex] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);

  // Initialize the matching manager once
  useEffect(() => {
    const manager = new MatchingManager();
    managerRef.current = manager;
    manager.setOnUpdate((results, debug) => {
      setAllTargets(results);
      setDebugData(debug);
    });
    return () => manager.dispose();
  }, [setAllTargets]);

  // Drive the inversion cycle: wait for all cubes to settle, then swap colors
  useEffect(() => {
    setOnAllSettled(() => {
      if (inversionTimerRef.current !== null) {
        clearTimeout(inversionTimerRef.current);
      }
      inversionTimerRef.current = window.setTimeout(() => {
        const source = clockSourceRef.current;
        const manager = managerRef.current;
        if (!source || !manager) return;
        // Re-check that cubes are still settled (not disrupted during wait)
        if (!useStore.getState().isAllSettled()) return;
        source.inverted = !source.inverted;
        manager.refresh();
      }, 2000);
    });
    return () => {
      setOnAllSettled(null);
      if (inversionTimerRef.current !== null) {
        clearTimeout(inversionTimerRef.current);
      }
    };
  }, [setOnAllSettled]);

  // Apply source whenever grid dimensions or source type changes
  const applySource = useCallback(
    (source: 'clock' | 'image' | 'test', img?: HTMLImageElement) => {
      const manager = managerRef.current;
      if (!manager || gridCols === 0 || gridRows === 0) return;

      if (source === 'clock') {
        const clockSource = new DigitalClockSource();
        clockSource.fontIndex = clockFontIndex;
        clockSourceRef.current = clockSource;
        manager.setSource(clockSource);
      } else {
        clockSourceRef.current = null;
        if (inversionTimerRef.current !== null) {
          clearTimeout(inversionTimerRef.current);
          inversionTimerRef.current = null;
        }
        if (source === 'test') {
          manager.setSource(new ColorTestSource());
        } else if (source === 'image' && img) {
          manager.setSource(new StaticImageSource(img));
        }
      }
      manager.start(gridCols, gridRows);
    },
    [gridCols, gridRows, clockFontIndex]
  );

  // Auto-apply clock on startup and when grid changes
  useEffect(() => {
    if (gridCols > 0 && gridRows > 0) {
      applySource(activeSource);
    }
  }, [gridCols, gridRows, activeSource, applySource]);

  const handleImageUpload = useCallback(
    (img: HTMLImageElement) => {
      setActiveSource('image');
      applySource('image', img);
    },
    [applySource]
  );

  const handleClockMode = useCallback(() => {
    setActiveSource('clock');
  }, []);

  const handleColorTest = useCallback(() => {
    setActiveSource('test');
  }, []);

  const handleClockFontChange = useCallback((index: number) => {
    setClockFontIndex(index);
    const source = clockSourceRef.current;
    const manager = managerRef.current;
    if (source && manager) {
      source.fontIndex = index;
      manager.refresh();
    }
  }, []);

  const handlePaletteChange = useCallback((index: number) => {
    setPaletteIndex(index);
    const palette = PALETTES[index];
    if (!palette) return;
    setActivePalette(palette.rgb);
    setMaterialPalette(palette.hex);
    managerRef.current?.refresh();
  }, []);

  return (
    <>
      <Scene />
      <Controls
        onImageUpload={handleImageUpload}
        onClockMode={handleClockMode}
        onColorTest={handleColorTest}
        activeSource={activeSource}
        clockFontIndex={clockFontIndex}
        onClockFontChange={handleClockFontChange}
        paletteIndex={paletteIndex}
        onPaletteChange={handlePaletteChange}
        showDebug={showDebug}
        onToggleDebug={() => setShowDebug((v) => !v)}
      />
      <DebugOverlay debugData={debugData} visible={showDebug} />
      <a
        href="https://stevemayne.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: 12,
          right: 16,
          color: '#888',
          fontSize: 13,
          textDecoration: 'none',
          zIndex: 50,
        }}
      >
        stevemayne.com
      </a>
    </>
  );
}

export default App;
