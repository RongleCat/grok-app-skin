# 提交一套皮肤

这个仓库收的是 Grok App 外观包（`.grokskin`），不是 CLI plugin。

套用永远先走 App 里的预览确认，网站和应用都不会自动 apply。

## 你要交什么

在 `skins/<id>/` 下放源文件，不要手改 `docs/packs/` 或 `catalog.json`。

```
skins/harbor-dusk/
  manifest.json
  meta.json
  preview.jpg            # 可选；静图壁纸可由 scripts/build.py 生成
                         # 站点画廊另写 16:9 到 docs/previews/
  assets/wallpaper.jpg   # 可选，恰好一个
```

`<id>` 只能是小写字母、数字和连字符，最长 64：`harbor-dusk`。

### `manifest.json`

必须是 schemaVersion `1`。允许字段：`id`、`name`、`description`、`author`、`createdAt`、`skin`、`scrim`、`wallpaper`。

禁止：`tokens`、`style`、`css`、`themePreference`。未知皮肤 id 不会让整包失败，App 会回落 `default` 并给出警告。

`skin` 目前只认：`default`、`rose`、`gothic`、`mist`、`ocean`、`ember`。

`wallpaper` 为 `null` 或不写，表示套用时清掉对方壁纸。

壁纸文件名只能是：

`assets/wallpaper.{jpg,jpeg,png,webp,gif,mp4,webm}`

### `meta.json`

画廊用的双语名字、标签、署名。App 读 catalog 时会忽略这些额外字段。

```json
{
  "id": "harbor-dusk",
  "name": { "zh": "港湾黄昏", "en": "Harbor Dusk" },
  "description": { "zh": "……", "en": "…" },
  "author": "your-github-login",
  "credit": { "zh": "壁纸作者", "en": "Wallpaper credit" },
  "tags": ["ocean", "dusk"],
  "featured": false
}
```

## 本地构建

需要 Python 3.10+ 和 Pillow：

```bash
python3 -m pip install pillow
python3 scripts/build.py
python3 scripts/validate.py
```

构建脚本会：

1. 回填壁纸 `sha256`
2. 生成不超过 256 KiB 的 `preview.jpg`
3. 打出 `docs/packs/<id>.grokskin`（ZIP 注释 `GROKSKIN/1`）
4. 写出 `docs/catalog.json` 和仓库根目录的 `catalog.json`

`downloadUrl` / `previewUrl` 必须和 catalog 同 origin。本仓库统一走：

`https://ronglecat.github.io/grok-app-skin/`

不要把下载指到别的 CDN、Release 资产或 `raw.githubusercontent.com`。用户把这个 catalog 加进 App 时，跨 origin 会被拒绝。

## 体积

| 东西 | 上限 |
|------|------|
| 单个 `.grokskin` | 201 MiB |
| `preview.jpg` | 256 KiB |
| `catalog.json` | 512 KiB |
| 整库 packs | 200 套 |

视频壁纸按原片进包，请先自己压到够用。静图建议长边不超过 1920。

## PR

标题写成 `skin: <id>`。描述里写清：

- 皮肤 id 和作者
- 壁纸来源与授权（自有、许可、或 AI 生成及原作者）
- 你在 Grok App 里导入预览过

不要提交 `__MACOSX`、`.DS_Store`、密钥、或整包 CSS。

## 网站上的「应用到 Grok App」

按钮只发：

```
grok://skin/import?url=https%3A%2F%2Fronglecat.github.io%2Fgrok-app-skin%2Fpacks%2F<id>.grokskin
```

`url` 做一次 `encodeURIComponent`。不要用 `repo=`。不要指望自动套用。
