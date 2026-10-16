# See Music

**See Music** is an interactive audio visualizer that turns sound into a spatial listening field.

Notes stand in a room (lower notes closer to the viewer). Ripples leave from the place each note sounds. The color of the entire moment shifts according to how full the chord is:

- One note → red (~700 nm)
- Every note sounding at once → violet (~400 nm)

The HUD shows the current spectral color name, approximate photon energy (eV), and wavelength (nm).

## Features

- **Listening field** — Canvas visualization of notes arranged in depth, with expanding ripples and energy-based glows.
- **Modes**
  - One note — single note stays red
  - The climb (ensemble) — notes gradually join
  - Every note — full chord, violet
  - Listen to the room (microphone)
  - Track (drag-and-drop or file picker audio)
- **Interaction**
  - Click the floating note markers or press number keys to strike individual notes
  - Toggle “Hear it” for synthesized sound
  - Drag-and-drop audio files
- **3D visualizer** (`Visualizer3D`) — Three.js scene with a reactive wireframe icosahedron core, particle starfield, and lights driven by bass / mid / treble energy.
- **Spectrum mapping** — Acoustic fullness is mapped onto the visible spectrum (red → violet) with approximate wavelength and photon energy readouts.
- **Accessibility** — Live region announces the current moment; reduced-motion preference is respected.

## Tech Stack

| Area            | Technology                          |
|-----------------|-------------------------------------|
| Framework       | TanStack Start + React 19           |
| Routing         | TanStack Router                     |
| Styling         | Tailwind CSS v4                     |
| 3D              | Three.js                            |
| Audio           | Web Audio API                       |
| State           | React state + refs                  |
| Build / Deploy  | Vite + Nitro (Vercel preset)        |
| Platform        | Grok App Builder workspace          |

Key libraries: `three`, `@tanstack/react-start`, `tailwindcss`, `lucide-react`, `zustand` (available), Radix UI primitives.

## Project Structure

src/
├── components/
│   ├── see-music.tsx          # Main visualizer UI + animation loop
│   ├── Visualizer3D.tsx       # Three.js 3D scene
│   ├── draw-field.ts          # Canvas drawing of room, ripples, glows
│   └── preview-host-bridge.tsx
├── lib/
│   ├── spectrum.ts            # Wavelength ↔ color ↔ energy mapping
│   ├── voices.ts              # Note positions & composed scores
│   ├── sound.ts               # Audio output / mic / file playback
│   ├── audioAnalyzer.ts       # Frequency-band energy for 3D
│   └── ...                    # Auth, DB, preview helpers (platform)
├── routes/
│   └── index.tsx              # Renders `<SeeMusic />`
├── router.tsx
└── styles.css

Other important files:

- `AGENTS.md` — App Builder sandbox contract
- `.grok/` — Skills, references, and platform config
- `startup.sh` — Idempotent restart script for the preview server
- `vercel.json` — Deployment config

## Development

This repository is a **Grok App Builder** workspace. The live preview expects the dev server on `0.0.0.0:8080`.

```bash
# Install dependencies (Node 22+ recommended)
pnpm install

# Start the development server
pnpm run dev
```

The `startup.sh` script is the platform’s restart contract. It checks whether the server is already healthy on port 8080 and starts `pnpm run dev` in the background if needed.

### Useful scripts

```bash
pnpm run dev          # Vite dev server (host 0.0.0.0, port 8080)
pnpm run build        # Production build + migrations
pnpm run preview      # Preview the production build
pnpm run typecheck    # tsc --noEmit
pnpm run lint         # ESLint
pnpm run format       # Prettier
```

### Environment notes

- Do **not** create a `.env` file. The platform injects `DATABASE_URL` and auth credentials on deploy. Only `VITE_`-prefixed variables reach the browser.
- Auth and database are opt-in (see `AGENTS.md`). This visualizer does not require them.
- The app is deployed to Vercel via the Nitro preset.

## How the visualization works

1. **Voices** — Eight notes of a C major chord (C2–G4) are placed in a elliptical stage. Lower frequencies sit closer to the viewer (`v` closer to +1).
2. **Energy → color** — The fraction of active notes (plus overall power) drives a scalar from 0 → 1. That scalar maps linearly from 700 nm (red) to 400 nm (violet). The wavelength is converted to an approximate photon energy in eV and an RGB color.
3. **Ripples** — When a note is active, timed ripples spawn at its stage position and expand with a dual-stroke ellipse, fading over their lifetime.
4. **3D core** — Bass energy scales an icosahedron wireframe; mid frequencies affect rotation; treble drives light intensity. A particle field rotates slowly in the background.

## Adding local files

If you have additional files locally that belong with this project:

```bash
git clone https://github.com/isaiah9238/music-visual.git
cd music-visual

# Copy your local files in
cp -r /path/to/local/files/* .

git add .
git status
git commit -m "Add local files and README"
git push
```

## License

Private / personal project. Add a `LICENSE` file if you decide to open-source it.
