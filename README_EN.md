# Open-source Grok App skins

Community appearance packs for [Open-source Grok App](https://github.com/RongleCat/grok-app). Submit pack sources with a PR here. Browse, preview, and apply on the official gallery.

**Browse the gallery:** [https://grok-app.com/skins/](https://grok-app.com/skins/)

**This repo:** pack sources and PRs stay here. `catalog.json`, previews, and `.grokskin` files still ship from GitHub Pages at the same URLs.

[中文](./README.md)

## Where to browse

Use the official gallery at [grok-app.com/skins](https://grok-app.com/skins/). The GitHub Pages site for this repo is a handoff page only; it no longer renders the card gallery.

Download and preview URLs are unchanged (the official site and jsDelivr still use them):

```
https://ronglecat.github.io/grok-app-skin/catalog.json
https://ronglecat.github.io/grok-app-skin/packs/<id>.grokskin
https://ronglecat.github.io/grok-app-skin/previews/<id>.jpg
```

| Need | How |
|------|-----|
| Browse / apply | Official gallery at [grok-app.com/skins](https://grok-app.com/skins/) |
| Submit a pack | PR `skins/<id>/`; see [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Use inside the app | Add the catalog URL under Appearance → skin sources |

Catalog and packs must share origin. A Pages catalog that points at Releases is rejected for user sources. So **json, previews, and `.grokskin` all live on `*.github.io`**.

Nothing auto-applies. The deep link only opens the confirm preview.

## Addresses

```
https://ronglecat.github.io/grok-app-skin/catalog.json
```

Settings → Appearance → skin sources → add that HTTPS URL.

The official gallery Apply button does not go through the catalog. It opens:

```
grok://skin/import?url=https%3A%2F%2Fronglecat.github.io%2Fgrok-app-skin%2Fpacks%2Fwhite-chair-meadow.grokskin
```

## Layout

```
skins/<id>/                 source of truth
scripts/build.py            pack + catalog
docs/                       GitHub Pages root (handoff + assets)
  index.html                handoff to the official gallery
  catalog.json
  packs/<id>.grokskin
  previews/<id>.jpg
```

A `.grokskin` is a ZIP of `manifest.json`, optional `preview.jpg`, and at most one `assets/wallpaper.{jpg,jpeg,png,webp,gif,mp4,webm}`. Comment `GROKSKIN/1`. No `tokens` / `style` / `css`. Never write `themePreference`. Validation rejects path traversal (`../`) and executable bits.

## First pack

[White Chair Meadow](https://grok-app.com/skins/) (`white-chair-meadow`) is the look currently applied on the author's machine: built-in `default` skin, scrim 100, 1440×1920 meadow illustration focused on the chair. Wallpaper by Jimeng AI @Nengz.

See [CONTRIBUTING.md](./CONTRIBUTING.md) to add another pack. Browse the gallery on [grok-app.com/skins](https://grok-app.com/skins/); open PRs here.

## License

MIT. Per-pack wallpaper credit lives in `meta.json`.
