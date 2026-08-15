# Grok App skins

Community appearance packs for [Grok App](https://github.com/RongleCat/grok-app). Browse, download, or hand a pack to the local desktop app for preview.

**Site:** [https://ronglecat.github.io/grok-app-skin/](https://ronglecat.github.io/grok-app-skin/)

[中文](./README.md)

> Grok App is not an official xAI product. This repo is not an official theme store.

## Does GitHub Pages cover this

Yes. v1 is static Pages. No extra backend.

| Need | How |
|------|-----|
| Show every preset | Static page reads same-origin `catalog.json` |
| Apply in the local app | `grok://skin/import?url=` pointing at a Pages `.grokskin` |
| Submit / download | PR `skins/<id>/`; download is the fallback |
| Use inside the app | Add the catalog URL under Appearance → skin sources |

Catalog and packs must share origin. A Pages catalog that points at Releases is rejected for user sources. So **json, previews, and `.grokskin` all live on `*.github.io`**.

A future official catalog may use Pages + GitHub Releases (the host allowlists `github.com` / `githubusercontent.com`). The in-app official URL is still empty, so this site only emits `url=`, never `repo=`.

Nothing auto-applies. The deep link only opens the confirm preview.

## Addresses

```
https://ronglecat.github.io/grok-app-skin/catalog.json
```

Settings → Appearance → skin sources → add that HTTPS URL.

The site Apply button does not go through the catalog. It opens:

```
grok://skin/import?url=https%3A%2F%2Fronglecat.github.io%2Fgrok-app-skin%2Fpacks%2Fwhite-chair-meadow.grokskin
```

## Layout

```
skins/<id>/                 source of truth
scripts/build.py            pack + catalog
docs/                       GitHub Pages root
```

A `.grokskin` is a ZIP of `manifest.json`, optional `preview.jpg`, and at most one `assets/wallpaper.{jpg,jpeg,png,webp,gif,mp4,webm}`. Comment `GROKSKIN/1`. No `tokens` / `style` / `css`. Never write `themePreference`.

## First pack

[White Chair Meadow](https://ronglecat.github.io/grok-app-skin/) (`white-chair-meadow`) is the look currently applied on the author's machine: built-in `default` skin, scrim 100, 1440×1920 meadow illustration focused on the chair. Wallpaper by Jimeng AI @Nengz.

See [CONTRIBUTING.md](./CONTRIBUTING.md) to add another pack.

## License

MIT. Per-pack wallpaper credit lives in `meta.json`.
