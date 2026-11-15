# Cauldron Counter

Brew potions of an exact strength for a queue of picky customers. A small vanilla-JS game built with Vite and served as static assets on Cloudflare Workers.

## Develop

```sh
npm install
npm run dev        # Vite dev server
npm test           # unit tests for the game rules (Vitest)
npm run test:e2e   # browser smoke test (Playwright; run `npx playwright install chromium` once)
npm run preview    # build, then serve with the Workers runtime via `wrangler dev`
npm run og         # re-render public/og.png from art/og/og.html
```

## Layout

- `index.html` – markup
- `src/logic.js` – pure game rules (ingredients, difficulty tiers, order generation); unit tested
- `src/data.js` – SVG glyphs, customers and dialogue
- `src/main.js` – rendering, animation and input
- `wrangler.jsonc` – Workers static-assets config, with an empty `previews` block to enable Workers Previews

## Deploy

Deploys run through [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) (Cloudflare's Git integration):

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command (production, `main`) | `npx wrangler deploy` |
| Preview command (other branches / PRs) | `npx wrangler preview` |

Each pull request gets its own Preview, and Cloudflare comments the Preview URL on the PR. Preview URLs are public unless you add Cloudflare Access.

Manual deploy: `npm run deploy`.
