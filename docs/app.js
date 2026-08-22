const I18N = {
  zh: {
    brand: "开源 Grok App",
    kicker: "皮肤仓库",
    title: "先看见工作台上的样子",
    lead: "每张卡片是 16:9 主题预览：壁纸铺满，上面叠一层开源 Grok App 的侧栏和对话。点应用只打开确认，不会改你现在的样子。",
    copyCatalog: "复制目录地址",
    submit: "提交一套",
    catalogHow: "在 App 里：设置 → 外观 → 皮肤源，加上这条 HTTPS。",
    gallery: "全部皮肤",
    search: "搜索皮肤",
    searchPh: "搜索名字、作者、标签",
    apply: "应用到 Grok App",
    download: "下载",
    foot: "社区皮肤仓库。需要桌面版才能唤起套用。",
    copied: "目录地址已复制",
    copyFail: "复制失败，请手动选中地址",
    empty: "没有匹配的皮肤",
    loadFail: "目录加载失败",
    applyHint:
      "已请求打开 Grok App。若没有反应，确认已安装桌面版，或改用下载。套用前会先预览。",
    themeToLight: "浅色",
    themeToDark: "深色",
    featured: "精选",
    openPack: "查看皮肤",
    count: (n) => `${n} 套`,
    by: (a) => (a ? `作者 ${a}` : "匿名"),
    skin: (s) => `皮肤 ${s}`,
    wallpaper: "含壁纸",
    video: "视频壁纸",
  },
  en: {
    brand: "Open-source Grok App",
    kicker: "Skin catalog",
    title: "See the workbench wearing the skin",
    lead: "Each card is a 16:9 theme preview: wallpaper fills the frame, with a translucent Open-source Grok App chrome on top. Apply opens a confirm dialog. It does not change your current look.",
    copyCatalog: "Copy catalog URL",
    submit: "Submit a pack",
    catalogHow: "In the app: Settings → Appearance → skin sources, then add this HTTPS URL.",
    gallery: "All packs",
    search: "Search packs",
    searchPh: "Search name, author, tags",
    apply: "Apply in Grok App",
    download: "Download",
    foot: "Community skin catalog. The desktop app is required to apply.",
    copied: "Catalog URL copied",
    copyFail: "Could not copy. Select the URL instead.",
    empty: "No packs match",
    loadFail: "Could not load the catalog",
    applyHint:
      "Asked Grok App to open. If nothing happens, install the desktop app or use Download. Apply always asks first.",
    themeToLight: "Light",
    themeToDark: "Dark",
    featured: "Featured",
    openPack: "View pack",
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
  theme: localStorage.getItem("gas.theme") === "light" ? "light" : "dark",
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

function previewSrc(p) {
  return p.id ? `previews/${p.id}.jpg` : p.previewUrl || "";
}

function packFileSrc(p) {
  return p.id ? `packs/${p.id}.grokskin` : p.downloadUrl;
}

function wallPosition(p) {
  const f = p.focus;
  if (f && typeof f.cx === "number" && typeof f.cy === "number") {
    return `${Math.round(f.cx * 1000) / 10}% ${Math.round(f.cy * 1000) / 10}%`;
  }
  if (p.id === "white-chair-meadow") return "50% 40.3%";
  return "50% 40%";
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

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  const btn = document.getElementById("themeBtn");
  const next = state.theme === "dark" ? "themeToLight" : "themeToDark";
  btn.setAttribute("aria-label", t(next));
  const hidden = btn.querySelector("[data-i18n]");
  if (hidden) {
    hidden.setAttribute("data-i18n", next);
    hidden.textContent = t(next);
  }
}

function applyI18n() {
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
  document.title =
    state.lang === "en" ? "Open-source Grok App skins" : "开源 Grok App 皮肤";
  document.getElementById("langBtn").textContent = state.lang === "en" ? "中文" : "EN";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.getElementById("catalogUrl").textContent = CATALOG_PUBLIC;
  applyTheme();
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

function chromeEl() {
  const root = document.createElement("div");
  root.className = "chrome";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<aside class="chrome__rail">' +
    '<div class="chrome__brand"><span class="chrome__logo"></span><span class="chrome__word"></span></div>' +
    '<div class="chrome__new"></div>' +
    '<div class="chrome__list"><i></i><i></i><i></i><i></i></div>' +
    '<div class="chrome__user"></div>' +
    "</aside>" +
    '<section class="chrome__main">' +
    '<header class="chrome__bar"><span class="chrome__dot"></span><span class="chrome__bar-line"></span></header>' +
    '<div class="chrome__chat">' +
    '<div class="bubble bubble--user"><span></span></div>' +
    '<div class="bubble bubble--ai"><b></b><b></b><b></b></div>' +
    "</div>" +
    '<div class="chrome__composer"><span class="chrome__plus"></span><span class="chrome__field"></span><span class="chrome__send"></span></div>' +
    "</section>";
  return root;
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
  if (state.openId) {
    const open = state.packs.find((p) => p.id === state.openId);
    if (open) fillSheet(open);
  }
}

function cardEl(p) {
  const li = document.createElement("li");
  li.className = p.featured ? "card card--featured" : "card";

  const stage = document.createElement("div");
  stage.className = "card__stage";
  stage.tabIndex = 0;
  stage.setAttribute("role", "button");
  stage.setAttribute("aria-label", `${t("openPack")} ${packName(p)}`);
  stage.addEventListener("click", (e) => {
    if (e.target.closest(".card__actions")) return;
    openSheet(p);
  });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSheet(p);
    }
  });

  const img = document.createElement("img");
  img.className = "card__wall";
  img.src = previewSrc(p);
  img.alt = packName(p);
  img.loading = "lazy";
  img.style.objectPosition = wallPosition(p);

  const scrim = document.createElement("div");
  scrim.className = "card__scrim";
  scrim.setAttribute("aria-hidden", "true");

  const dock = document.createElement("div");
  dock.className = "card__dock";

  const idBox = document.createElement("div");
  idBox.className = "card__id";
  const name = document.createElement("h3");
  name.className = "card__name";
  name.textContent = packName(p);
  const meta = document.createElement("p");
  meta.className = "card__meta";
  meta.textContent = t("by", p.author);
  const chips = document.createElement("div");
  chips.className = "chips";
  if (p.featured) chips.append(chip(t("featured"), "chip--hot"));
  chips.append(chip(t("skin", p.skin || "default")));
  if (p.hasWallpaper) chips.append(chip(p.kind === "video" ? t("video") : t("wallpaper")));

  const actions = document.createElement("div");
  actions.className = "card__actions";
  const apply = document.createElement("button");
  apply.type = "button";
  apply.className = "btn btn--primary btn--tiny";
  apply.textContent = t("apply");
  apply.addEventListener("click", (e) => {
    e.stopPropagation();
    applyPack(p);
  });
  const dl = document.createElement("a");
  dl.className = "btn btn--ghost btn--tiny";
  dl.href = packFileSrc(p);
  dl.download = `${p.id}.grokskin`;
  dl.textContent = t("download");
  dl.addEventListener("click", (e) => e.stopPropagation());
  actions.append(apply, dl);

  idBox.append(name, meta, chips);
  dock.append(idBox, actions);
  stage.append(img, scrim, chromeEl(), dock);
  li.append(stage);
  return li;
}

function chip(text, extra) {
  const s = document.createElement("span");
  s.className = extra ? `chip ${extra}` : "chip";
  s.textContent = text;
  return s;
}

function fillSheet(p) {
  document.getElementById("sheetKicker").textContent = p.featured
    ? t("featured")
    : t("skin", p.skin || "default");
  document.getElementById("sheetTitle").textContent = packName(p);
  document.getElementById("sheetMeta").textContent = `${t("by", p.author)} · ${t("skin", p.skin || "default")}`;
  document.getElementById("sheetDesc").textContent = packDesc(p) || "";
  document.getElementById("sheetCredit").textContent = packCredit(p) || "";
  const art = document.getElementById("sheetArt");
  art.src = previewSrc(p);
  art.alt = packName(p);
  art.style.objectPosition = wallPosition(p);
  const chromeHost = document.getElementById("sheetChrome");
  chromeHost.replaceChildren(chromeEl());
  const apply = document.getElementById("sheetApply");
  apply.onclick = () => applyPack(p);
  const dl = document.getElementById("sheetDownload");
  dl.href = packFileSrc(p);
  dl.download = `${p.id}.grokskin`;
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
document.getElementById("themeBtn").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("gas.theme", state.theme);
  applyTheme();
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
