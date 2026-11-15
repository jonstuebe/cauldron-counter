# Cauldron Counter (Godot 4.7)

Cauldron Counter, originally a vanilla-JS web game; this port replaced it.
The Web export is the main target: a single-threaded build that runs from any
static server. Production builds go through `npm run build` at the repo root
(see the root README).

All commands run from the repo root. Godot 4.7.2 is at `/opt/homebrew/bin/godot`.

## Run

```sh
godot --path godot                    # desktop window
godot --path godot -- --reduced-motion
```

Reduced motion turns off particles, the shader wobble, the pour flights and the
other tweens. To turn it on or off:

- In the game, use the **Motion: full / reduced** button in the header.
- With the `--reduced-motion` argument.
- On the web, it defaults to the browser's `prefers-reduced-motion` setting.

The choice is saved, together with the best score, in `user://settings.cfg`.

## Web build

```sh
godot --headless --path godot --import                                  # first time / after art changes
node godot/tools/make_shell.mjs                                         # after editing tools/shell.template.html
godot --headless --path godot --export-release "Web" build/web/index.html
node godot/tools/serve.mjs                                              # http://localhost:8060/
```

To watch the game play itself, open `http://localhost:8060/?demo=1`.

The preset (`export_presets.cfg`) writes `godot/build/web/` with
`thread_support=false`. The `build/` folder is git-ignored and holds a
`.gdignore`, so Godot never imports the exported files.

The page uses a custom HTML shell, `web/shell.html`, which
`tools/make_shell.mjs` generates from `tools/shell.template.html`. The art,
fonts and quote lines are inlined into it. While the engine downloads, the
shell draws the same preloader as `scripts/boot.gd` at the same canvas
positions. That covers 0–70% of the bar. It keeps the themed error and
"browser unsupported" messages. The boot scene then reads
`window.ccBoot.state()` (progress, quote and clock) and continues from there
to 100%. After its first frame, it calls `ccBoot.handoff()`, and the HTML
overlay fades out. `boot_splash/show_image` is off, so Godot never shows its
own splash in between.

### PWA and the install sheet

The preset exports a PWA (`progressive_web_app/enabled=true`): a manifest,
an offline service worker and icons from `assets/pwa/`, which
`node godot/tools/make_icons.mjs` renders from `art/icon.svg`. The editor
plugin `addons/cc_pwa` finishes the manifest after each export, adding a
maskable icon, `theme_color`, `id`, `scope` and `short_name`. The service
worker serves from its cache first. When a newer build's worker appears while
the preloader is still up, the shell switches to it and reloads. Mid-game, it
waits for the next visit instead.

Installed on an iPhone home screen, the page runs full screen under a
black-translucent status bar. WebKit can report `innerHeight` short by the
status bar there, which would leave an empty strip below Godot's canvas, so
the shell takes the height from the screen in that case. `?standalone=ios`
forces this for tests; `phone_capture.mjs` checks it (`standalone_gap`).

The shell also holds the install sheet (`window.ccInstall`). It is a bottom
sheet in the game's style that you can drag and flick to dismiss, like an iOS
sheet. It shows the steps for the visitor's platform:

- iOS 26 Safari
- iOS 16.4–18 Safari
- other iOS browsers
- iOS before 16.4
- Android with the install prompt, or without it
- desktop Chrome or Edge with the prompt, as a small card

It never shows when the game is already installed. It appears at a calm
moment between customers: after the first served potion, or after about 20 s
of play. "Not now" (or the backdrop, Escape or a swipe down) hides it for
14 days. The `WebInstall` autoload (`scripts/web_install.gd`) bridges it to
the game, which pauses the customer's timer while the sheet is open and offers
"Install app" in the header and on the cards. Add
`?install=ios26|ios18|ios-other|ios-old|android|android-noprompt|desktop` to
force a variant.

## Test

```sh
godot --headless --path godot -s tests/test_logic.gd      # 2799 checks, exits non-zero on failure
godot --headless --path godot --quit-after 300            # boot + game with no window; look for script errors
godot --headless --path godot -- --capture                # full scripted autoplay, headless
```

`tests/test_logic.gd` ported the old JS unit tests. It also checks a
`mulberry32` port against values taken from the JS version, so seeded order
generation matches the original web game exactly.

## Screenshots and gameplay video

```sh
node godot/tools/web_capture.mjs        # needs the Web export and Playwright (repo devDependency)
node godot/tools/phone_capture.mjs      # portrait phones/tablet, safe areas, rotation -> preview/phone/
node godot/tools/preloader_capture.mjs  # HTML -> Godot preloader hand-off, throttled (Chromium + WebKit) -> preview/phone/preloader/
node godot/tools/install_capture.mjs    # install sheet variants, detection, manifest + service worker -> preview/phone/install/
node godot/tools/sheet_drag_test.mjs    # install sheet drag/flick/rubber-band checks in WebKit (touch)
```

This plays the `?demo=1` autoplay in headless Chromium and writes these files
to `godot/preview/` (git-ignored):

- `web_01_preloader.png` … `web_06_success_2.png`
- `gameplay.mp4` (H.264, yuv420p, 1280×720)
- `web_phone_card.png` (a phone held upright)

The autoplay is the `Capture` autoload (`scripts/capture.gd`). It also runs on
desktop with `-- --capture`, which saves PNGs to `godot/screenshots/`.

## Layout

| Path | What it is |
| --- | --- |
| `scenes/boot.tscn`, `scripts/boot.gd` | Preloader. It requests the game scene and every asset with `ResourceLoader.load_threaded_request`, shows the real progress on the cauldron plate and the bar, then dissolves into the game with `shaders/dissolve.gdshader`. |
| `scenes/game.tscn`, `scripts/game.gd` | The shop. Port of `main.js`: orders, the pour pipeline, serving and scoring, day cards. |
| `scripts/logic.gd`, `scripts/data.gd` | Ports of `logic.js` and `data.js`. |
| `scripts/widgets/` | Cauldron view (layered art and a liquid shader), backdrop (still layers, flickering window glow), jar buttons, patience bar, queue dots, particles. |
| `scripts/assets.gd` | Maps asset keys to files. |
| `art/` | Final art; see `art/MANIFEST.md`. Do not edit by hand. |
| `assets/gen/` | Generated placeholders (committed; their generator was removed with the JS version). |
| `assets/fonts/` | Fallback fonts (OFL). |

`Assets.path()` uses the art in `art/` when it is there and the placeholder
otherwise, so the game still runs without `art/`. Without the art, the layout
falls back to the flat look of the original web version.

The display is 1280×720 with the `canvas_items` stretch mode and the `expand`
aspect. Wider and taller windows show more of the shop. On a screen taller than
it is wide (height > 1.05 × width), the `Screen` autoload (`scripts/screen.gd`)
switches the design canvas to 400×720, and the shop uses a portrait layout:
a header, the cauldron stage, and a bottom sheet holding the order, the jar
shelf and the actions. The layout follows rotation live and keeps clear of
notches and the home indicator through CSS `env(safe-area-inset-*)` (the
export sets `viewport-fit=cover`). Add `?safe=TOP,BOTTOM` to the URL to fake
the insets. Touch emulates the
mouse, and keys 1–9, Backspace and Enter work as shortcuts.
