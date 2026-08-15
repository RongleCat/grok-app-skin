const I18N = {
  zh: {
    brand: "Grok App 皮肤",
    title: "给本机 Grok App 用的外观包",
    lead: "一套包是皮肤、遮罩和壁纸。点应用会打开桌面版预览，不会直接改你现在的样子。",
    copyCatalog: "复制目录地址",
    submit: "提交一套",
    catalogHow: "在 App 里：设置 → 外观 → 皮肤源，加上这条 HTTPS。",
    gallery: "全部皮肤",
    search: "搜索皮肤",
    searchPh: "搜索名字、作者、标签",
    apply: "应用到 Grok App",
    download: "下载",
    foot: "非官方社区仓库。需要桌面版才能唤起套用。",
    copied: "目录地址已复制",
    copyFail: "复制失败，请手动选中地址",
    empty: "没有匹配的皮肤",
    loadFail: "目录加载失败",
    applyHint:
      "已请求打开 Grok App。若没有反应，确认已安装桌面版，或改用下载。套用前会先预览。",
    count: (n) => `${n} 套`,
    by: (a) => (a ? `作者 ${a}` : "匿名"),
    skin: (s) => `皮肤 ${s}`,
    wallpaper: "含壁纸",
    video: "视频壁纸",
  },
  en: {
    brand: "Grok App skins",
    title: "Looks for the Grok App on your machine",
    lead: "A pack is a skin, scrim, and wallpaper. Apply opens a desktop preview. It does not change your current look by itself.",
    copyCatalog: "Copy catalog URL",
    submit: "Submit a pack",
    catalogHow: "In the app: Settings → Appearance → skin sources, then add this HTTPS URL.",
    gallery: "All packs",
    search: "Search packs",
    searchPh: "Search name, author, tags",
    apply: "Apply in Grok App",
    download: "Download",
    foot: "Unofficial community catalog. The desktop app is required to apply.",
    copied: "Catalog URL copied",
    copyFail: "Could not copy. Select the URL instead.",
    empty: "No packs match",
    loadFail: "Could not load the catalog",
    applyHint:
      "Asked Grok App to open. If nothing happens, install the desktop app or use Download. Apply always asks first.",
    count: (n) => `${n} pack${n === 1 ? "" : "s"}`,
    by: (a) => (a ? `by ${a}` : "anonymous"),
    skin: (s) => `skin ${s}`,
    wallpaper: "wallpaper",
    video: "video wallpaper",
  },
};

const CATALOG_PUBLIC =
  "https://ronglecat.github.io/grok-app-skin/catalog.json";

const state = {
  lang: localStorage.getItem("gas.lang") === "en" ? "en" : "zh",
  packs: [],
  filter: "",
  openId: null,
};

function t(key, ...args) {
  const table = I18N[state.lang];
  const v = table[key];
  return typeof v === "function" ? v(...args) : v;
}

function packName(p) {
  return state.lang === "en" ? p.nameEn || p.name : p.name;
}

function packDesc(p) {
  return state.lang === "en" ? p.descriptionEn || p.description : p.description;
}

function packCredit(p) {
  return state.lang === "en" ? p.creditEn || p.credit : p.credit;
}

function applyHref(downloadUrl) {
  return `grok://skin/import?url=${encodeURIComponent(downloadUrl)}`;
}

function applyPack(pack) {
  window.location.href = applyHref(pack.downloadUrl);
  const hint = document.getElementById("sheetHint");
  if (hint && state.openId === pack.id) {
    hint.hidden = false;
    hint.textContent = t("applyHint");
  }
  toast(t("applyHint"));
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}

function applyI18n() {
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
  document.title = state.lang === "en" ? "Grok App skins" : "Grok App 皮肤仓库";
  document.getElementById("langBtn").textContent = state.lang === "en" ? "中文" : "EN";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.getElementById("catalogUrl").textContent = CATALOG_PUBLIC;
  render();
}

function matches(p, q) {
  if (!q) return true;
  const hay = [
    p.name,
    p.nameEn,
    p.author,
    p.description,
    p.descriptionEn,
    ...(p.tags || []),
    p.skin,
    p.id,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function render() {
  const q = state.filter.trim().toLowerCase();
  const shown = state.packs.filter((p) => matches(p, q));
  document.getElementById("count").textContent = t("count", shown.length);
  const status = document.getElementById("status");
  const grid = document.getElementById("grid");
  grid.replaceChildren();
  if (!shown.length) {
    status.hidden = false;
    status.textContent = t("empty");
    return;
  }
  status.hidden = true;
  const frag = document.createDocumentFragment();
  for (const p of shown) {
    frag.append(cardEl(p));
  }
  grid.append(frag);
  const feat = state.packs.find((p) => p.featured) || state.packs[0];
  if (feat) {
    const img = document.getElementById("featuredImg");
    img.src = feat.previewUrl || feat.downloadUrl;
    img.alt = packName(feat);
    document.getElementById("featuredCap").textContent = `${packName(feat)} · ${t("by", feat.author)}`;
  }
  if (state.openId) {
    const open = state.packs.find((p) => p.id === state.openId);
    if (open) fillSheet(open);
  }
}

function cardEl(p) {
  const li = document.createElement("li");
  li.className = "card";
  const art = document.createElement("button");
  art.type = "button";
  art.className = "card__art";
  art.addEventListener("click", () => openSheet(p));
  const img = document.createElement("img");
  img.src = p.previewUrl || "";
  img.alt = packName(p);
  img.loading = "lazy";
  art.append(img);
  const body = document.createElement("div");
  body.className = "card__body";
  const name = document.createElement("h3");
  name.className = "card__name";
  name.textContent = packName(p);
  const meta = document.createElement("p");
  meta.className = "card__meta";
  meta.textContent = t("by", p.author);
  const chips = document.createElement("div");
  chips.className = "chips";
  chips.append(chip(t("skin", p.skin || "default")));
  if (p.hasWallpaper) chips.append(chip(p.kind === "video" ? t("video") : t("wallpaper")));
  const actions = document.createElement("div");
  actions.className = "card__actions";
  const apply = document.createElement("button");
  apply.type = "button";
  apply.className = "btn btn--primary";
  apply.textContent = t("apply");
  apply.addEventListener("click", () => applyPack(p));
  const dl = document.createElement("a");
  dl.className = "btn btn--ghost";
  dl.href = p.downloadUrl;
  dl.download = "";
  dl.textContent = t("download");
  actions.append(apply, dl);
  body.append(name, meta, chips, actions);
  li.append(art, body);
  return li;
}

function chip(text) {
  const s = document.createElement("span");
  s.className = "chip";
  s.textContent = text;
  return s;
}

function fillSheet(p) {
  document.getElementById("sheetTitle").textContent = packName(p);
  document.getElementById("sheetMeta").textContent = `${t("by", p.author)} · ${t("skin", p.skin || "default")}`;
  document.getElementById("sheetDesc").textContent = packDesc(p) || "";
  document.getElementById("sheetCredit").textContent = packCredit(p) || "";
  const art = document.getElementById("sheetArt");
  art.src = p.previewUrl || "";
  art.alt = packName(p);
  const apply = document.getElementById("sheetApply");
  apply.onclick = () => applyPack(p);
  const dl = document.getElementById("sheetDownload");
  dl.href = p.downloadUrl;
  document.getElementById("sheetHint").hidden = true;
}

function openSheet(p) {
  state.openId = p.id;
  fillSheet(p);
  document.getElementById("sheet").hidden = false;
}

function closeSheet() {
  state.openId = null;
  document.getElementById("sheet").hidden = true;
}

async function copyCatalog() {
  try {
    await navigator.clipboard.writeText(CATALOG_PUBLIC);
    toast(t("copied"));
  } catch {
    toast(t("copyFail"));
  }
}

async function load() {
  const status = document.getElementById("status");
  try {
    const res = await fetch("catalog.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.packs)) {
      throw new Error("bad catalog");
    }
    state.packs = data.packs;
    render();
  } catch (err) {
    console.error(err);
    status.hidden = false;
    status.textContent = t("loadFail");
  }
}

document.getElementById("filter").addEventListener("input", (e) => {
  state.filter = e.target.value;
  render();
});
document.getElementById("langBtn").addEventListener("click", () => {
  state.lang = state.lang === "zh" ? "en" : "zh";
  localStorage.setItem("gas.lang", state.lang);
  applyI18n();
});
document.getElementById("copyCatalog").addEventListener("click", () => {
  void copyCatalog();
});
document.getElementById("sheetClose").addEventListener("click", closeSheet);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});

applyI18n();
void load();
