#!/usr/bin/env python3
"""Pack skins/* into .grokskin files and write docs/catalog.json.

Catalog URLs are absolute https on GitHub Pages so Grok App can add this
repo as a user source (downloadUrl / previewUrl must share the catalog origin).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SKINS_DIR = ROOT / "skins"
DOCS_DIR = ROOT / "docs"
PACKS_DIR = DOCS_DIR / "packs"
PREVIEWS_DIR = DOCS_DIR / "previews"

DEFAULT_BASE = "https://ronglecat.github.io/grok-app-skin"
ZIP_COMMENT = b"GROKSKIN/1"
PREVIEW_MAX = 256 * 1024
PREVIEW_EDGE = 640
PACK_ID_RE = __import__("re").compile(r"^[a-z0-9-]{1,64}$")
KNOWN_SKINS = {"default", "rose", "gothic", "mist", "ocean", "ember"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: object) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def zip_datetime(created_at_ms: int) -> tuple[int, int, int, int, int, int]:
    t = time.gmtime(max(created_at_ms, 0) / 1000)
    return (t.tm_year, t.tm_mon, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec)


def encode_preview(wallpaper: Path) -> bytes:
    img = Image.open(wallpaper).convert("RGB")
    img.thumbnail((PREVIEW_EDGE, PREVIEW_EDGE), Image.Resampling.LANCZOS)
    quality = 82
    raw = b""
    while quality >= 50:
        from io import BytesIO

        buf = BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        raw = buf.getvalue()
        if len(raw) <= PREVIEW_MAX:
            return raw
        quality -= 8
    raise SystemExit(f"preview for {wallpaper} exceeds {PREVIEW_MAX} bytes")


def write_zip(dest: Path, created_at: int, entries: list[tuple[str, bytes, int]]) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dt = zip_datetime(created_at)
    with zipfile.ZipFile(dest, "w") as zf:
        zf.comment = ZIP_COMMENT
        for name, data, compress in entries:
            info = zipfile.ZipInfo(filename=name, date_time=dt)
            info.compress_type = compress
            info.external_attr = 0o644 << 16
            zf.writestr(info, data)


def pick_text(value: object, lang: str, fallback: str = "") -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return str(value.get(lang) or value.get("zh") or value.get("en") or fallback)
    return fallback


def build_one(skin_dir: Path) -> dict:
    pack_id = skin_dir.name
    if not PACK_ID_RE.match(pack_id):
        raise SystemExit(f"invalid pack id: {pack_id}")

    man_path = skin_dir / "manifest.json"
    if not man_path.is_file():
        raise SystemExit(f"missing {man_path}")
    manifest = load_json(man_path)
    if manifest.get("schemaVersion") != 1:
        raise SystemExit(f"{pack_id}: schemaVersion must be 1")
    if "tokens" in manifest or "style" in manifest or "css" in manifest:
        raise SystemExit(f"{pack_id}: tokens/style/css are forbidden")
    manifest.pop("themePreference", None)
    manifest["id"] = pack_id
    manifest["schemaVersion"] = 1

    meta_path = skin_dir / "meta.json"
    meta = load_json(meta_path) if meta_path.is_file() else {}

    wall = manifest.get("wallpaper")
    wall_bytes: bytes | None = None
    wall_kind = None
    if wall is None:
        pass
    elif isinstance(wall, dict):
        rel = str(wall.get("file") or "")
        if not rel.lower().startswith("assets/wallpaper."):
            raise SystemExit(f"{pack_id}: wallpaper.file must be assets/wallpaper.<ext>")
        wall_path = skin_dir / rel
        if not wall_path.is_file():
            raise SystemExit(f"{pack_id}: missing {rel}")
        wall_bytes = wall_path.read_bytes()
        wall["sha256"] = sha256_bytes(wall_bytes)
        wall["file"] = rel.lower()
        wall_kind = wall.get("kind") or "image"
        preview_src = wall_path
    else:
        raise SystemExit(f"{pack_id}: wallpaper must be object or null")

    created_at = int(manifest.get("createdAt") or 0)
    if created_at <= 0:
        created_at = int(time.time() * 1000)
        manifest["createdAt"] = created_at

    preview_path = skin_dir / "preview.jpg"
    if preview_path.is_file():
        preview = preview_path.read_bytes()
        if len(preview) > PREVIEW_MAX:
            raise SystemExit(f"{pack_id}: preview.jpg > 256 KiB")
    elif wall_bytes is not None and wall_kind == "image":
        preview = encode_preview(preview_src)
        preview_path.write_bytes(preview)
    else:
        preview = None

    dump_json(man_path, manifest)
    man_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")

    entries: list[tuple[str, bytes, int]] = [
        ("manifest.json", man_bytes, zipfile.ZIP_DEFLATED),
    ]
    if preview is not None:
        entries.append(("preview.jpg", preview, zipfile.ZIP_DEFLATED))
    if wall_bytes is not None:
        entries.append((str(wall["file"]), wall_bytes, zipfile.ZIP_STORED))

    pack_dest = PACKS_DIR / f"{pack_id}.grokskin"
    write_zip(pack_dest, created_at, entries)

    if preview is not None:
        PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
        (PREVIEWS_DIR / f"{pack_id}.jpg").write_bytes(preview)

    name = pick_text(meta.get("name"), "zh", str(manifest.get("name") or pack_id))
    description = pick_text(meta.get("description"), "zh", str(manifest.get("description") or ""))
    author = str(meta.get("author") or manifest.get("author") or "")
    tags = meta.get("tags") if isinstance(meta.get("tags"), list) else []
    skin = str(manifest.get("skin") or "default")
    if skin not in KNOWN_SKINS:
        print(f"warning: {pack_id} uses unknown skin {skin!r}, app will fall back", file=sys.stderr)

    return {
        "id": pack_id,
        "name": name,
        "nameEn": pick_text(meta.get("name"), "en", name),
        "description": description,
        "descriptionEn": pick_text(meta.get("description"), "en", description),
        "author": author,
        "credit": pick_text(meta.get("credit"), "zh", ""),
        "creditEn": pick_text(meta.get("credit"), "en", ""),
        "featured": bool(meta.get("featured")),
        "skin": skin,
        "hasWallpaper": wall_bytes is not None,
        "kind": wall_kind if wall_bytes is not None else None,
        "tags": [str(t) for t in tags],
        "scrim": int(manifest.get("scrim") if manifest.get("scrim") is not None else 100),
        "createdAt": created_at,
        "packRel": f"packs/{pack_id}.grokskin",
        "previewRel": f"previews/{pack_id}.jpg" if preview is not None else "",
        "bytes": pack_dest.stat().st_size,
        "sha256": sha256_file(pack_dest),
    }


def build(base_url: str) -> dict:
    base = base_url.rstrip("/")
    PACKS_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

    packs: list[dict] = []
    if SKINS_DIR.is_dir():
        for skin_dir in sorted(p for p in SKINS_DIR.iterdir() if p.is_dir() and not p.name.startswith(".")):
            packs.append(build_one(skin_dir))

    catalog_packs = []
    for p in packs:
        row = {
            "id": p["id"],
            "name": p["name"],
            "description": p["description"],
            "author": p["author"],
            "previewUrl": f"{base}/{p['previewRel']}" if p["previewRel"] else "",
            "downloadUrl": f"{base}/{p['packRel']}",
            "sha256": p["sha256"],
            "bytes": p["bytes"],
            "skin": p["skin"],
            "hasWallpaper": p["hasWallpaper"],
            "tags": p["tags"],
        }
        if p["kind"]:
            row["kind"] = p["kind"]
        # Gallery-only extras. Grok App ignores unknown catalog fields.
        row["nameEn"] = p["nameEn"]
        row["descriptionEn"] = p["descriptionEn"]
        row["credit"] = p["credit"]
        row["creditEn"] = p["creditEn"]
        row["featured"] = p["featured"]
        row["scrim"] = p["scrim"]
        row["createdAt"] = p["createdAt"]
        catalog_packs.append(row)

    catalog = {
        "schemaVersion": 1,
        # Deterministic: latest pack clock, so rebuilds do not churn git.
        "updatedAt": max((p["createdAt"] for p in catalog_packs), default=0),
        "baseUrl": base,
        "packs": catalog_packs,
    }
    dump_json(DOCS_DIR / "catalog.json", catalog)
    dump_json(ROOT / "catalog.json", catalog)
    return catalog


def main() -> None:
    parser = argparse.ArgumentParser(description="Build grokskin packs and catalog.json")
    parser.add_argument("--base-url", default=DEFAULT_BASE)
    args = parser.parse_args()
    catalog = build(args.base_url)
    print(f"built {len(catalog['packs'])} pack(s)")
    for p in catalog["packs"]:
        print(f"  {p['id']}: {p['bytes']} bytes  {p['sha256'][:12]}…")


if __name__ == "__main__":
    main()
