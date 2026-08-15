# Grok App 皮肤仓库

Grok App 的社区外观包。浏览、下载，或一键唤起本机 [Grok App](https://github.com/RongleCat/grok-app) 预览套用。

**站点：** [https://ronglecat.github.io/grok-app-skin/](https://ronglecat.github.io/grok-app-skin/)

[English](./README_EN.md)

> Grok App 不是 xAI 官方产品。本仓库也不是官方主题市场。

## GitHub Pages 能不能做

能。第一版就走 Pages，不需要单独的后端。

| 需求 | 怎么做 |
|------|--------|
| 批量展示所有预设 | 静态页读同目录的 `catalog.json` |
| 点击套用到本机 App | `grok://skin/import?url=`，`url` 指向 Pages 上的 `.grokskin` |
| 用户提交 / 下载 | PR 交 `skins/<id>/`；站点提供下载兜底 |
| App 里当皮肤源 | 把 catalog 地址加到「外观 → 皮肤源」 |

Catalog 和包必须同 origin。用户源不允许 catalog 在 Pages、包在 Releases。所以 **json、预览图、`.grokskin` 全部放在 `*.github.io`**。

官方源以后可以改成 Pages catalog + GitHub Releases（Host 对 `github.com` / `githubusercontent.com` 开了白名单）。现在官网 catalog URL 还是空的，网站只用 `url=`，不出 `repo=` 按钮。

套用不会自动发生。深链只打开 App 的预览确认框。

## 给 App 用的地址

```
https://ronglecat.github.io/grok-app-skin/catalog.json
```

设置 → 外观 → 皮肤源 → 添加上述 HTTPS 地址。刷新后就能在目录里看到本仓库的包。

网站上的「应用到 Grok App」不经过 catalog，直接：

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
docs/                       GitHub Pages 根目录
  index.html
  catalog.json
  packs/<id>.grokskin
  previews/<id>.jpg
catalog.json                与 docs 同步的副本
```

`.grokskin` 是 ZIP：`manifest.json`、可选 `preview.jpg`、可选恰好一张 `assets/wallpaper.{jpg,jpeg,png,webp,gif,mp4,webm}`。注释为 `GROKSKIN/1`。禁止 `tokens` / `style` / `css`。从不写入 `themePreference`。

## 第一套皮肤

[草原白椅](https://ronglecat.github.io/grok-app-skin/)（`white-chair-meadow`）是当前本机正在用的那一套：内置 `default` 皮肤、scrim 100、一张 1440×1920 的绿原白椅插画，焦点略偏椅子。壁纸来自即梦 AI @Nengz。

## 提交新皮肤

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

```bash
python3 -m pip install pillow
python3 scripts/build.py
python3 scripts/validate.py
```

## 协议

MIT。各套壁纸的署名写在对应 `meta.json` 的 `credit` 里。
