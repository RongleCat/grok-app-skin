# 开源 Grok App 皮肤仓库

开源 [Grok App](https://github.com/RongleCat/grok-app) 的社区外观包。用 PR 提交皮肤源文件；浏览、预览、套用请到官网画廊。

**浏览画廊：** [https://grok-app.com/skins/](https://grok-app.com/skins/)

**本仓库：** 皮肤源文件与 PR 仍在这里。`catalog.json`、预览图、`.grokskin` 继续由 GitHub Pages 提供，地址不变。

[English](./README_EN.md)

## 画廊在哪

浏览皮肤请到官网 [grok-app.com/skins](https://grok-app.com/skins/)。本仓库的 GitHub Pages 只做交接说明，不再展示卡片画廊。

包下载和预览 URL 保持不变（官网和 jsDelivr 仍用这些地址）：

```
https://ronglecat.github.io/grok-app-skin/catalog.json
https://ronglecat.github.io/grok-app-skin/packs/<id>.grokskin
https://ronglecat.github.io/grok-app-skin/previews/<id>.jpg
```

| 需求 | 怎么做 |
|------|--------|
| 浏览 / 套用 | 官网 [grok-app.com/skins](https://grok-app.com/skins/) |
| 提交一套 | PR 交 `skins/<id>/`，见 [CONTRIBUTING.md](./CONTRIBUTING.md) |
| App 里当皮肤源 | 把 catalog 地址加到「外观 → 皮肤源」 |

Catalog 和包必须同 origin。用户源不允许 catalog 在 Pages、包在 Releases。所以 **json、预览图、`.grokskin` 全部放在 `*.github.io`**。

套用不会自动发生。深链只打开 App 的预览确认框。

## 给 App 用的地址

```
https://ronglecat.github.io/grok-app-skin/catalog.json
```

设置 → 外观 → 皮肤源 → 添加上述 HTTPS 地址。刷新后就能在目录里看到本仓库的包。

官网画廊的「应用到 Grok App」不经过 catalog，直接：

```
grok://skin/import?url=https%3A%2F%2Fronglecat.github.io%2Fgrok-app-skin%2Fpacks%2Fwhite-chair-meadow.grokskin
```

没有安装桌面版时，用同一条链接旁边的下载即可。

## 仓库结构

```
skins/<id>/                 源文件，PR 只改这里
  manifest.json             schemaVersion 1
  meta.json                 画廊双语名、标签
  preview.jpg
  assets/wallpaper.<ext>
scripts/build.py            打包 + 写 catalog
scripts/validate.py
docs/                       GitHub Pages 根目录（交接页 + 资源）
  index.html                指向官网画廊的交接页
  catalog.json
  packs/<id>.grokskin
  previews/<id>.jpg         16:9 预览，官网 / jsDelivr 仍读这里
catalog.json                与 docs 同步的副本
```

`.grokskin` 是 ZIP：`manifest.json`、可选 `preview.jpg`、可选恰好一张 `assets/wallpaper.{jpg,jpeg,png,webp,gif,mp4,webm}`。注释为 `GROKSKIN/1`。禁止 `tokens` / `style` / `css`。从不写入 `themePreference`。校验会拒绝路径穿越（`../`）和可执行位。

## 第一套皮肤

[草原白椅](https://grok-app.com/skins/)（`white-chair-meadow`）是当前本机正在用的那一套：内置 `default` 皮肤、scrim 100、一张 1440×1920 的绿原白椅插画，焦点略偏椅子。壁纸来自即梦 AI @Nengz。

## 提交新皮肤

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。浏览画廊请到 [grok-app.com/skins](https://grok-app.com/skins/)；PR 仍开在本仓库。

```bash
python3 -m pip install pillow
python3 scripts/build.py
python3 scripts/validate.py
```

## 协议

MIT。各套壁纸的署名写在对应 `meta.json` 的 `credit` 里。
