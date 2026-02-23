# Rubik's Mosaic Clock

A real-time mosaic display built from a tessellating grid of 3D Rubik's cubes rendered in isometric projection. Each cube's three visible faces (top, right, front) are matched to approximate a target image — by default, a digital clock with a cycling color gradient background.

## How It Works

### Rendering

The cubes are rendered in **isometric projection** from the (1,1,1) direction using Three.js via `@react-three/fiber`. From this angle each cube appears as a pointy-top regular hexagon, and the cubes tessellate seamlessly in a rectangular grid using axial hex coordinates. An orthographic camera auto-zooms to fit the grid to the viewport.

### Image Matching

A pluggable **image source** (clock, uploaded image, or color test pattern) renders to an offscreen canvas. The canvas is sampled at 27 sticker positions per grid cell — one for each sticker on the cube's three visible faces (U, R, F — 9 stickers each).

Sampled RGB colors are converted to **CIELAB** color space for perceptually uniform distance calculations. A precomputed pool of ~1,700 **candidate states** (24 solved orientations × depth-2 face moves, deduplicated by visible pattern) is scored against each cell's target colors. **Edge-weighted scoring** uses Sobel gradient magnitude at each sticker position to prioritize stickers at color boundaries, improving text legibility.

### Animation

When a cube's target changes, it plays a scramble-then-solve animation before arriving at the new pattern. Each candidate stores the base orientation it was derived from and the moves to reach the target, so the animation naturally ends at the correct state without jarring snaps.

State management uses **Zustand**, with each cube subscribing to its own slice of the store.

## Image Sources

- **Digital Clock** — displays current time (HH:MM) with bold white text on a cycling gradient background that rotates through Rubik's orange, red, and blue
- **Image Upload** — upload any image to display as a Rubik's mosaic
- **Color Test** — vertical strips of the six Rubik's cube colors for calibration

## Tech Stack

- React 19, TypeScript, Vite
- Three.js / @react-three/fiber / @react-three/drei
- Zustand for state management

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type-check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── cube/             # Rubik's cube model — state representation, moves, orientations, scramble
├── matching/         # Image → cube state pipeline
│   ├── imageSource.ts      # Pluggable image sources (clock, static image, test)
│   ├── projection.ts       # Per-sticker sampling with Sobel edge weighting
│   ├── candidates.ts       # BFS candidate pool generation (24 orientations × depth-2 moves)
│   ├── search.ts           # CIELAB scoring and best-match selection
│   ├── matchingManager.ts  # Orchestrates sampling → matching → store updates
│   └── palette.ts          # Rubik's color palette in CIELAB
├── rendering/        # Three.js scene
│   ├── Scene.tsx           # Camera, lighting, canvas setup
│   ├── CubeGrid.tsx        # Grid of cubes with staggered animation lifecycle
│   ├── RubiksCubeVisual.tsx # Single cube mesh with move animation
│   ├── gridLayout.ts       # Hex tessellation math
│   ├── stickerMap.ts       # Sticker geometry mapping
│   └── materials.ts        # Cube face materials
├── animation/        # Animation utilities (easing, types)
├── store/            # Zustand store (grid state, cube instances, targets)
├── ui/               # Controls panel, debug overlay
├── utils/            # Color conversion (RGB ↔ CIELAB)
└── App.tsx           # Root component wiring sources, matching, and rendering
```
