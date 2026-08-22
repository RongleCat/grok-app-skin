#!/usr/bin/env python3
"""Validate catalog.json + each .grokskin against Grok App pack rules."""

from __future__ import annotations

import hashlib
import json
import re
import stat
import sys
import zipfile
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
CATALOG = DOCS / "catalog.json"

PACK_ID_RE = re.compile(r"^[a-z0-9-]{1,64}$")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
ALLOWED = {"manifest.json", "preview.jpg", "assets/", "assets/wallpaper.jpg",
           "assets/wallpaper.jpeg", "assets/wallpaper.png", "assets/wallpaper.webp",
           "assets/wallpaper.gif", "assets/wallpaper.mp4", "assets/wallpaper.webm"}
PREVIEW_MAX = 256 * 1024
PACK_MAX = 201 * 1024 * 1024
CATALOG_MAX = 512 * 1024


def fail(msg: str) -> None:
    print(f"error: {msg}", file=sys.stderr)
    raise SystemExit(1)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    if not CATALOG.is_file():
        fail("docs/catalog.json missing; run scripts/build.py")
    raw = CATALOG.read_bytes()
    if len(raw) > CATALOG_MAX:
        fail("catalog.json exceeds 512 KiB")
    catalog = json.loads(raw)
    if catalog.get("schemaVersion") != 1:
        fail("catalog schemaVersion must be 1")
    packs = catalog.get("packs")
    if not isinstance(packs, list):
        fail("catalog.packs must be an array")
    if len(packs) > 200:
        fail("catalog has more than 200 packs")

    ids: set[str] = set()
    for p in packs:
        pid = p.get("id")
        if not isinstance(pid, str) or not PACK_ID_RE.match(pid):
            fail(f"bad pack id: {pid!r}")
        if pid in ids:
            fail(f"duplicate pack id: {pid}")
        ids.add(pid)
        sha = str(p.get("sha256") or "").lower()
        if not SHA_RE.match(sha):
            fail(f"{pid}: sha256 must be 64 hex")
        download = p.get("downloadUrl") or ""
        preview = p.get("previewUrl") or ""
        for label, url in (("downloadUrl", download), ("previewUrl", preview)):
            if not url and label == "previewUrl":
                continue
            u = urlparse(url)
            if u.scheme != "https" or not u.netloc:
                fail(f"{pid}: {label} must be https")
        pack_path = DOCS / "packs" / f"{pid}.grokskin"
        if not pack_path.is_file():
            fail(f"{pid}: missing {pack_path}")
        size = pack_path.stat().st_size
        if size == 0 or size > PACK_MAX:
            fail(f"{pid}: pack size {size} out of range")
        if int(p.get("bytes") or 0) != size:
            fail(f"{pid}: catalog bytes {p.get('bytes')} != file {size}")
        if sha256_file(pack_path) != sha:
            fail(f"{pid}: sha256 mismatch")
        validate_zip(pid, pack_path)
        if preview:
            prev_path = DOCS / "previews" / f"{pid}.jpg"
            if not prev_path.is_file():
                fail(f"{pid}: missing preview file")
            if prev_path.stat().st_size > PREVIEW_MAX:
                fail(f"{pid}: preview exceeds 256 KiB")

    print(f"ok: {len(packs)} pack(s)")


def zip_name_unsafe(filename: str) -> bool:
    raw = filename.replace("\\", "/")
    if raw.startswith("/") or raw.startswith("\\"):
        return True
    if re.match(r"^[a-zA-Z]:", filename):
        return True
    return ".." in [part for part in raw.split("/") if part]


def zip_entry_forbidden_mode(info: zipfile.ZipInfo) -> str | None:
    unix_mode = info.external_attr >> 16
    if stat.S_ISLNK(unix_mode):
        return "symlink"
    if info.is_dir():
        return None
    if unix_mode and (unix_mode & 0o111):
        return "executable bit"
    return None


def validate_zip(pid: str, path: Path) -> None:
    with zipfile.ZipFile(path) as zf:
        names = []
        for info in zf.infolist():
            if zip_name_unsafe(info.filename):
                fail(f"{pid}: path traversal in zip entry {info.filename!r}")
            mode_err = zip_entry_forbidden_mode(info)
            if mode_err:
                fail(f"{pid}: {mode_err} not allowed ({info.filename})")
            name = info.filename.replace("\\", "/").lower()
            if name.endswith("/") and name == "assets/":
                continue
            if name.startswith("__macosx/") or name.endswith("/.ds_store") or name == ".ds_store":
                fail(f"{pid}: ignored junk must not be packed ({name})")
            if name not in ALLOWED:
                fail(f"{pid}: unknown zip entry {info.filename}")
            names.append(name)
            if name == "preview.jpg" and info.file_size > PREVIEW_MAX:
                fail(f"{pid}: preview.jpg too large")
        if "manifest.json" not in names:
            fail(f"{pid}: zip missing manifest.json")
        raw = zf.read("manifest.json")
        man = json.loads(raw)
        if man.get("schemaVersion") != 1:
            fail(f"{pid}: manifest schemaVersion must be 1")
        for forbidden in ("tokens", "style", "css"):
            if forbidden in man:
                fail(f"{pid}: forbidden field {forbidden}")
        if "themePreference" in man:
            fail(f"{pid}: themePreference must not be exported")
        wall = man.get("wallpaper")
        if isinstance(wall, dict):
            file = str(wall.get("file") or "").lower()
            if file not in names:
                fail(f"{pid}: wallpaper file {file} not in zip")
            expected = hashlib.sha256(zf.read(file)).hexdigest()
            got = str(wall.get("sha256") or "").lower()
            if got != expected:
                fail(f"{pid}: wallpaper sha256 mismatch")


if __name__ == "__main__":
    main()
