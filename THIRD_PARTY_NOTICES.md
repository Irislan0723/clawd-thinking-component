# Third-party notices and provenance

Required Notice: Copyright (c) 2026 FeiFei (@nextoneforeal) — https://github.com/next1foreal-dotcom/creative-components

## Creative Components — included

- Author: FeiFei / @nextoneforeal
- Repository: https://github.com/next1foreal-dotcom/creative-components
- Pinned revision: `3ff64a171b53b11d6d79e7bb11d499ba5e55f1cf` (2026-10-20)
- Code license: PolyForm Noncommercial 1.0.0, copied to `LICENSE` and `vendor/creative-components/LICENSE.txt`
- Commercial terms/contact: `vendor/creative-components/COMMERCIAL.md`

Included upstream work:

- `thinking-effort/thinking-effort.js`: standalone web component, including the internal Preact renderer and synthesized sound data
- `thinking-effort/EffortGlass.jsx`, `effort-glass.css`, `thinking-effort-sfx.js`: original source references in `vendor/upstream/`
- `thinking-effort/media/voice/*.mp3`: 19 original speech/tick files, recorded by @nextoneforeal according to the source header
- `clawd-perch/clawd-engine.js`: original framework-free Canvas Clawd renderer/state machine, retained unmodified as `vendor/creative-components/clawd-engine.js`

Our standalone runtime changes to the thinking-effort bundle:

1. Four displayed labels translated into Chinese
2. A scoped `effort-audio-activate` event, with an optional AudioContext unlocked by the user's real click
3. Audio setup delayed until interaction/activation
4. Initial voice samples loaded before scheduling the current-level announcement, without changing the effort setting

`scripts/vendor-patches.json` records exact replacements and input/output SHA-256 values. `scripts/rebuild-vendor.py` rebuilds the runtime from the preserved, pinned original bundle and checks the resulting hash

The new `src/` adapter retains the original zombie/scene/spring/bite mechanics, replaces the brain with Canvas Clawd or explicitly supplied authorized artwork, and adds the auto toggle, independent sound controls, themes, save rollback, loading and lifecycle controls

## Preact — included in standalone bundle

Copyright (c) 2015-present Jason Miller

MIT License, full text retained in `vendor/creative-components/PREACT-LICENSE.txt`

## Upstream scene artwork attribution

The original `EffortGlass.jsx` header credits its zombie redraw to SVG Repo's “Plants Vs Zombies” (CC0, https://www.svgrepo.com/svg/518723), and its brain line art to SVG Repo's “Brain Illustration 1” (CC0, https://www.svgrepo.com/svg/482775)

These are upstream attribution statements retained here; the original header is included unchanged. We do not claim authorship of the zombie, original brain or their underlying characters

## Clawd on Desk — attribution for the Whisper integration, artwork not included

- Project: Clawd on Desk
- Author/maintainer: 鹿鹿 / @rullerzhou-afk and contributors
- Repository: https://github.com/rullerzhou-afk/clawd-on-desk
- Official source/artwork distinction: https://github.com/rullerzhou-afk/clawd-on-desk#license
- Current artwork terms: https://github.com/rullerzhou-afk/clawd-on-desk/blob/main/assets/LICENSE
- Source code: AGPL-3.0; that license does not cover the artwork

The Whisper application integration used this project's `clawd-sleeping.svg`, `clawd-working-thinking.svg`, `clawd-working-ultrathink.svg` and `clawd-dizzy.svg`, with framing/reduced-motion adjustments

This public package contains **none of those original or derived SVGs, none of the desktop pet implementation, and no preview containing those SVGs**. It contains a filename/hash provenance manifest and copies of the locally retained and current official artwork license terms for reference

No artwork redistribution authorization has been recorded with this package. These references do not grant permission to copy, modify or redistribute that project's artwork. Authorized assets can be supplied separately through the `assets` option, subject to their own terms

## Clawd / Anthropic

Clawd is Anthropic's character. This is an unofficial fan adaptation, not affiliated with or endorsed by Anthropic

Source-code licenses and third-party notices do not transfer rights in characters, trademarks or separately licensed artwork
