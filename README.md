# 🐱 Cute Cat Game

A 3D cat adventure game built with [Three.js](https://threejs.org/). Explore a little world, collect fish and yarn, chase a mouse, jump between platforms, and watch the day turn to night.

## Play

- **Game:** `index.html` — the full game (tank controls, collectibles, day/night cycle, 5 cat skins, 3 camera modes)
- **Viewer:** `viewer.html` — a simple 3D cat you can orbit and poke

### Controls

| Key | Action |
|---|---|
| W / S | Move forward / back |
| A / D | Turn left / right |
| Shift | Run (uses energy) |
| Space | Jump |
| C | Switch camera (3rd person / 1st person / cinematic) |
| Mouse drag | Rotate camera |
| Scroll | Zoom |

## Development

```bash
npm install     # install dependencies (first time only)
npm run dev     # start the dev server at http://localhost:5173
npm run build   # build the production bundle into dist/
npm run preview # preview the production build locally
```

## Project structure

```
index.html            game page (UI + HUD)
viewer.html           cat viewer page
src/
  main.js             entry point + game loop
  viewer.js           cat viewer scene
  game/
    scene.js          renderer, camera, lights, sky
    world.js          ground, trees, house, platforms
    cat.js            the cat model + skins
    collectibles.js   items + chase mouse
    particles.js      dust / sparkle effects
    physics.js        platform collision
    input.js          keyboard + mouse handling
    daynight.js       day/night cycle
    ui.js             HUD, start screen, messages
    state.js          shared game state
legacy/               the original single-file prototypes
```

## Deployment

Every push to `main` automatically builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
