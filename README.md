# Cauldron Counter

Brew potions of an exact strength for a queue of picky customers. A Godot 4.7 game, exported for the Web and served on Cloudflare Workers.

The game lives in [`godot/`](godot/README.md); see its README for running it, the Web shell, the PWA and the capture tools.

## Develop

```sh
npm install
npm run build      # Godot Web export -> dist/ (downloads Godot 4.7.2 if it isn't installed)
npm run dev        # build, then serve dist/ with the Workers runtime (wrangler dev)
npm test           # Godot logic tests (godot/tests/test_logic.gd)
npm run og         # re-render public/og.png from art/og/og.html
```

`scripts/godot.mjs` uses a local `godot` (or `$GODOT`) when it is version 4.7.2. Otherwise, on Linux x86_64, it downloads the editor into `.godot-bin/`. It fetches only `web_nothreads_release.zip` out of the 1.3 GB export templates archive, using HTTP range requests.

## Layout

- `godot/` – the game (Godot project)
- `scripts/build.mjs` – export, then stage `dist/`: the export plus `public/`, with `index.wasm` brotli-compressed
- `src/worker.js` – serves `index.wasm.br` as `/index.wasm` with `Content-Encoding: br`. The raw engine (~40 MB) is over Workers' 25 MiB per-asset limit, and this Worker runs only for `*.wasm`.
- `public/` – extra static files (`og.png`)
- `wrangler.jsonc` – Worker + static assets config, with an empty `previews` block to enable Workers Previews

## Deploy

Deploys run through [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) (Cloudflare's Git integration). Wrangler runs `npm run build` itself (the `build` block in `wrangler.jsonc`), so the dashboard needs no build command:

| Setting | Value |
| --- | --- |
| Build command | *(empty)* |
| Deploy command (production, `main`) | `npx wrangler deploy` |
| Preview command (other branches / PRs) | `npx wrangler preview` |

Each pull request gets its own Preview, and Cloudflare comments the Preview URL on the PR. Preview URLs are public unless you add Cloudflare Access.

Manual deploy: `npm run deploy`.
