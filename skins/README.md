# skins/

一套皮肤一个目录，目录名就是 `id`。

必有 `manifest.json`。画廊文案放 `meta.json`。壁纸放 `assets/wallpaper.<ext>`。

改完后在仓库根目录跑：

```bash
python3 scripts/build.py
python3 scripts/validate.py
```

细则见根目录 `CONTRIBUTING.md`。
