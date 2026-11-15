# Cauldron Counter — art style guide

## Mood

A potion stall at night. The shop is dark, quiet and plum-coloured; the only strong light
comes from three places: the fire under the cauldron (warm), the brew itself (whatever colour
the player has mixed), and the moon in the window (cool). Everything the player touches is
brass or parchment. The tone is cosy and a little wry, never spooky.

One idea carries the whole look: **the dark is plum, not black, and colour belongs to the
ingredients.** Walls, iron and UI panels stay in a narrow violet range so the sixteen brew
colours and the brass plate are always the brightest things on screen.

## Palette

| Role | Name | Hex | Used for |
|---|---|---|---|
| Darkest | void | `#0c0912` | cauldron mouth, vignette, drop shadows |
| | iron | `#120e1a` | cauldron body, lantern chains |
| | iron hi | `#2c2538` | lit side of iron |
| | iron rim | `#3d3552` | rim, rivets |
| Ground | night | `#1e1830` | clear colour, boot splash, shadow tint |
| | dusk | `#2a2142` | wall, secondary surfaces |
| | panel | `#2f2749` | panels, bubbles, chips |
| | panel hi | `#3d3460` | panel top, secondary buttons |
| | panel line | `#4a3f6e` | 1–2px top highlights, rim light on iron |
| Text | parchment | `#efe7d6` | body text, primary button, ticket |
| | parchment lo | `#d9cdb4` | parchment shade |
| | parchment edge | `#b9a98a` | parchment lip, rules |
| | lilac | `#a99fbd` | secondary text, labels, smoke |
| | ink | `#1e1628` | text and emblems on brass, parchment and liquid |
| Accent | brass | `#d4ad55` | plate, tags, coins, frames |
| | brass hi | `#f0cb73` | lit brass, "ready" state |
| | brass lo | `#9a7426` | brass lip, engraving |
| | brass deep | `#6b4e17` | brass underside |
| Magic | mint | `#6fe0bd` | default brew glow, progress fill, success |
| | mint lo | `#2f9e7e` | stems, shaded mint |
| Fire | ember | `#f08a4b` | outer flame, warm bounce light |
| | flame | `#f6b443` | mid flame, lantern glass |
| | flame hi | `#ffe6a8` | flame core |
| | coal | `#e2504a` | red flame, low patience |
| | danger | `#ef7a64` | errors, cheeks |
| Wood | wood lo / wood / wood hi | `#33221a` / `#4f3624` / `#6d4c33` | counter, shelves, beam |
| | cork | `#8a6440` | corks, wood highlights |
| Moon | moon / moon hi | `#cfc8ff` / `#f1eeff` | stars, sparkles, window light |

Ingredient colours are the sixteen from `src/logic.js` and are never used for UI.

Derived tones follow two rules (see `shade()` and `tint()` in `_tools/lib.mjs`):
shadows mix toward **night** `#1e1830`, highlights mix toward **candle cream** `#fff6e2`.
Never darken with black or lighten with pure white, except for small specular glints.

## Lighting

- **Key light: top-left, cool.** Every object carries a pale highlight on its upper-left
  (a stroke on glass and iron, a 1–2px line along the top of panels and buttons).
- **Core shadow: right and below**, one flat shape at 20–50% opacity in the night-mixed tone.
  Two tones per surface plus one highlight; no soft airbrushing on objects.
- **Fire is the only warm light.** It shows as an ember rim on the underside of the cauldron
  and as additive glow sprites (`fire_glow`, `bg_glow`). Nothing else is lit warm.
- **The brew lights its surroundings.** `cauldron_glow`, `cauldron_reflect` and the steam are
  white sprites tinted with the current brew colour, so the scene changes colour as you mix.
- Soft gradients are reserved for light itself (glows, haze, vignette), never for form.

## Outlines and shape

- **No outlines.** Shapes are separated by value, not by line. The one exception is glass,
  which gets a 2.5px parchment edge at 42% so bottles read against the dark.
- Round, slightly chunky forms; corners are always rounded (UI radii 16–22px at 1x).
- Details are strokes with round caps, 2–5px at native size.
- **Bottle silhouette encodes the operation**: round flask adds, cone flask subtracts,
  tall bottle multiplies, faceted jar divides. The emblem inside says which ingredient.
- Faces are built from the same parts (dot eyes with one glint, arc mouths, blush ovals) so
  the cast reads as one family; character comes from hats, hair and props.

## Typography

All three families are under the SIL Open Font License 1.1; files and licences are in `fonts/`.

| Role | Family | File | Use |
|---|---|---|---|
| Display | IM Fell English | `IMFellEnglish-Regular.ttf`, `-Italic.ttf` | wordmark, card titles ("Day 12"), flavour quotes in italic |
| Interface | Alegreya Sans | `AlegreyaSans-Regular/Medium/Bold/ExtraBold.ttf` | labels, names, buttons (ExtraBold), eyebrow caps |
| Numbers and dialogue | Atkinson Hyperlegible Next | `AtkinsonHyperlegibleNext-Variable.ttf` (wght 200–800) | every number, customer speech, hints |

- Numbers are the game, so they are always Atkinson at weight 800 with tabular figures, in
  **ink on brass or parchment** or **parchment on plum**. Never set a number in IM Fell
  (its old-style figures are hard to tell apart).
- Sizes at 1280×720: wordmark 32, card title 44, strength number 44–56, order number 42,
  dialogue 18, buttons 20, labels 15–16, eyebrow caps 14–15 with 6px tracking.
- IM Fell only at 28px and above; its rough edges turn to noise when small.

## Motion notes for the code side

- Things arrive with a small overshoot (scale 0.95 → 1.04 → 1) and leave quickly.
- Fire never stops: three flames, each with its own `phase` in `shaders/flame_flicker.gdshader`.
- The "ready" moment is brass: swap to `strength_badge_ready`, `button_ready_*`, raise
  `cauldron_glow` opacity, emit `sparkle` particles, run `shaders/sheen.gdshader`.
- A failed pour uses `fizzle` and `smoke`; never tint those.
