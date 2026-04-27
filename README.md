# The Pokopia Architect

A browser-based 3D voxel design tool and habitat planner for **Pokemon Pokopia**. Plan builds visually with region-accurate plots, then assign Pokemon to houses and see their live **Comfy Level** based on habitat type and furniture.

> Status: early scaffold. The 3D shell, tab structure, and data ingestion pipeline are wired up; feature implementations land incrementally.

## Features (planned)

**3D builder**

- 5 regions at official sizes (Withered Wastelands 240x240, Bleak Beach 272x272, Rocky Ridges 272x272, Sparkling Skylands 352x352, Palette Town 384x384), 127 blocks tall
- Three cameras: orbit, first-person (WASD + mouse-look), bird's-eye top-down
- Pokopia-themed block palette (wood/leaf/stone/sand/city + furniture + habitat blocks)
- Place / remove with hover ghost block, hotbar, undo/redo
- Live validators per detected house: 2x2 to 10x10 footprint, fully enclosed, at least one door, 3+ furniture, single habitat type
- Material and worker cost estimator
- All 43 official building kits as stampable hollow shells

**Habitat planner**

- Browse 305 Pokemon and 209+3 habitats
- Detect houses in your scene; assign rosters of up to 4 Pokemon (single habitat type)
- Live Comfy Level per Pokemon (Iffy / Average / Nice / Great / Awesome) with suggestions
- One-click "stamp + populate" using the upstream house-group templates

**Local-first**

- JSON file save/load, drag-drop import, `localStorage` autosave, PNG screenshot export. No backend, no accounts.

## Tech stack

- Vite + React + TypeScript
- three.js + @react-three/fiber + @react-three/drei
- Zustand state, Tailwind v4 UI
- papaparse + marked + zod for build-time data ingestion

## Quick start

```bash
git clone --recurse-submodules https://github.com/studiojrba/pokopia-architect.git
cd pokopia-architect
npm install
npm run ingest    # parse upstream data into src/data/generated
npm run dev
```

If you forgot `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build
- `npm run preview` — preview the production build
- `npm run lint` — ESLint
- `npm run ingest` — parse `data/upstream/` reference docs into `src/data/generated/`

## Project layout

```
pokopia-architect/
  data/upstream/         # git submodule: JEschete/PokopiaPlanning
  scripts/
    ingestPokopiaData.ts # parses upstream CSV/MD into typed JSON
  src/
    main.tsx App.tsx
    scene/               # 3D canvas, voxel grid, cameras, controls
    editor/              # zustand store, validators, comfy, costEstimator, IO
    data/
      regions.ts blocks.ts buildingKits.ts
      generated/         # produced by `npm run ingest`, committed
    ui/
      tabs/              # World, Pokemon, Habitats, Houses, Items
      panels/            # palette, kits, validators, cost, HUD, comfy badge
```

## Credits

Massive thanks to **[JEschete/PokopiaPlanning](https://github.com/JEschete/PokopiaPlanning)** for the structured Pokemon, habitat, item, location, and house-group data this app consumes — included here as a git submodule under `data/upstream/`. The upstream sources its Pokemon data from **[Serebii](https://www.serebii.net/)**, who deserves the original credit.

UX patterns inspired by **[cubical.xyz](https://cubical.xyz/)**, the excellent Minecraft schematic editor.

## Notice of non-affiliation

The Pokopia Architect is an unaffiliated fan project. It is not associated, endorsed by, or in any way officially connected with **Nintendo**, **The Pokemon Company**, **Game Freak**, or any of their subsidiaries or affiliates. "Pokemon" and "Pokopia" and all related names, characters, and imagery are trademarks of their respective owners.

## License

[MIT](LICENSE)
