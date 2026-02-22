import { useCallback, useEffect, useRef, useState } from 'react';
import { Scene } from './rendering/Scene';
import { Controls } from './ui/Controls';
import { MatchingManager } from './matching/matchingManager';
import { DigitalClockSource, StaticImageSource, ColorTestSource } from './matching/imageSource';
import { useStore } from './store/useStore';

function App() {
  const gridCols = useStore((s) => s.gridCols);
  const gridRows = useStore((s) => s.gridRows);
  const setAllTargets = useStore((s) => s.setAllTargets);
  const managerRef = useRef<MatchingManager | null>(null);
  const [activeSource, setActiveSource] = useState<'clock' | 'image' | 'test'>('clock');

  // Initialize the matching manager once
  useEffect(() => {
    const manager = new MatchingManager();
    managerRef.current = manager;
    manager.setOnUpdate((orientations) => {
      setAllTargets(orientations);
    });
    return () => manager.dispose();
  }, [setAllTargets]);

  // Apply source whenever grid dimensions or source type changes
  const applySource = useCallback(
    (source: 'clock' | 'image' | 'test', img?: HTMLImageElement) => {
      const manager = managerRef.current;
      if (!manager || gridCols === 0 || gridRows === 0) return;

      if (source === 'clock') {
        manager.setSource(new DigitalClockSource());
      } else if (source === 'test') {
        manager.setSource(new ColorTestSource());
      } else if (source === 'image' && img) {
        manager.setSource(new StaticImageSource(img));
      }
      manager.start(gridCols, gridRows);
    },
    [gridCols, gridRows]
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

  return (
    <>
      <Scene />
      <Controls
        onImageUpload={handleImageUpload}
        onClockMode={handleClockMode}
        onColorTest={handleColorTest}
        activeSource={activeSource}
      />
    </>
  );
}

export default App;
