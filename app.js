/* ============================================================
   Формулы v3 — полный app.js
   + Звуки
   + Универсальный решатель
   + Выбор устройства
   + Викторина → выучено
   ============================================================ */

const STORAGE = {
  fav: "uf.favorites",
  learned: "uf.learned",
  theme: "uf.theme",
  font: "uf.font",
  sidebar: "uf.sidebar",
  compare: "uf.compare",
  goal: "uf.goal",
  streak: "uf.streak",
  achieve: "uf.achievements",
  sound: "uf.sound",
  device: "uf.device"
};

// ---------- СОСТОЯНИЕ ----------
let activeSubject = null;
let activeTopic = null;
let activeTitle = null;
let viewMode = "grid";
let sortMode = "default";
let learnFilter = "all";
let currentQuery = "";
const activeChips = new Set();
let compareSet = new Set();
let currentSolveKey = null;
let currentQrUrl = "";
let currentReverseKey = null;
let splitActive = false;
let favorites = new Set();
let learned = new Set();
let expandedSubjects = new Set();
let expandAllMode = true;
let currentTab = "catalog";

const $ = (id) => document.getElementById(id);

const D = {
  nav: $("nav"), list: $("list"), empty: $("empty"),
  catalog: $("catalog"), viewCatalog: $("viewCatalog"),
  search: $("search"), suggest: $("suggest"),
  contentTitle: $("contentTitle"), contentSubtitle: $("contentSubtitle"),
  breadcrumbs: $("breadcrumbs"), sidebar: $("sidebar"), layout: $("layout"),
  backdrop: $("backdrop"), burger: $("burger"), toast: $("toast"),
  viewFormulas: $("viewFormulas"), viewRef: $("viewRef"),
  viewTerms: $("viewTerms"), viewFav: $("viewFav"), viewFlash: $("viewFlash"),
  refGrid: $("refGrid"), termsList: $("termsList"),
  favList: $("favList"), favEmpty: $("favEmpty"), favSubtitle: $("favSubtitle"),
  tabAll: $("tabAll"), tabFormulas: $("tabFormulas"), tabRef: $("tabRef"), tabTerms: $("tabTerms"),
  tabFav: $("tabFav"), tabFlash: $("tabFlash"), themeToggle: $("themeToggle"),
  toTop: $("toTop"), fontMinus: $("fontMinus"), fontPlus: $("fontPlus"),
  fontReset: $("fontReset"), printBtn: $("printBtn"), fullscreenBtn: $("fullscreenBtn"),
  sidebarToggle: $("sidebarToggle"), logo: $("logo"),
  navBack: $("navBack"), navForward: $("navForward"),
  searchMic: $("searchMic"), voiceOverlay: $("voiceOverlay"),
  voiceText: $("voiceText"), voiceStopBtn: $("voiceStopBtn"),
  splitBtn: $("splitBtn"), goalBtn: $("goalBtn"), soundToggle: $("soundToggle"),
  deviceToggle: $("deviceToggle"), deviceModal: $("deviceModal"),
  compareBar: $("compareBar"), compareCount: $("compareCount"),
  compareTitles: $("compareTitles"), compareOpen: $("compareOpen"),
  compareClear: $("compareClear"), compareModal: $("compareModal"),
  compareModalClose: $("compareModalClose"), compareGrid: $("compareGrid"),
  solveModal: $("solveModal"), solveModalClose: $("solveModalClose"),
  solveTitle: $("solveTitle"), solveDesc: $("solveDesc"),
  solveFormula: $("solveFormula"), solveVars: $("solveVars"),
  solveRun: $("solveRun"), solveReset: $("solveReset"), solveOutput: $("solveOutput"),
  qrModal: $("qrModal"), qrModalClose: $("qrModalClose"),
  qrCanvas: $("qrCanvas"), qrUrl: $("qrUrl"),
  qrCopyUrl: $("qrCopyUrl"), qrDownload: $("qrDownload"),
  reverseModal: $("reverseModal"), reverseModalClose: $("reverseModalClose"),
  reverseTitle: $("reverseTitle"), reverseDesc: $("reverseDesc"),
  reverseFormula: $("reverseFormula"), reverseList: $("reverseList"),
  deriveModal: $("deriveModal"), deriveModalClose: $("deriveModalClose"),
  deriveTitle: $("deriveTitle"), deriveDesc: $("deriveDesc"), deriveChain: $("deriveChain"),
  goalModal: $("goalModal"), goalModalClose: $("goalModalClose"), goalWidget: $("goalWidget"),
  flashBox: $("flashBox"), quizBox: $("quizBox"),
  flashProgress: $("flashProgress"), flashTitle: $("flashTitle"),
  flashAnswer: $("flashAnswer"), flashDesc: $("flashDesc"),
  flashShow: $("flashShow"), flashNext: $("flashNext"),
  flashStats: $("flashStats"), flashRestart: $("flashRestart"),
  flashSubtitle: $("flashSubtitle"), quizQuestion: $("quizQuestion"),
  quizOptions: $("quizOptions"), quizStats: $("quizStats"), quizRestart: $("quizRestart")
};

// ============================================================
// ЗВУК
// ============================================================
let soundEnabled = true;
let audioCtx = null;

function ensureAudio() {
  if (!soundEnabled) return null;
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  } catch { return null; }
  return audioCtx;
}

function playTone(freq, duration, type, gain, delay) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain ?? 0.08, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const SFX = {
  click:  () => playTone(520, 0.05, "sine", 0.04),
  tab:    () => playTone(660, 0.08, "triangle", 0.05),
  open:   () => { playTone(420, 0.09, "sine", 0.05); playTone(660, 0.12, "sine", 0.04, 0.05); },
  close:  () => { playTone(500, 0.09, "sine", 0.04); playTone(320, 0.12, "sine", 0.04, 0.05); },
  copy:   () => { playTone(880, 0.05, "sine", 0.05); playTone(1180, 0.07, "sine", 0.04, 0.05); },
  success:() => { playTone(523, 0.10, "sine", 0.06); playTone(659, 0.10, "sine", 0.06, 0.10); playTone(784, 0.18, "sine", 0.06, 0.20); },
  error:  () => { playTone(220, 0.14, "sawtooth", 0.05); playTone(160, 0.20, "sawtooth", 0.05, 0.10); },
  toggle: () => playTone(740, 0.06, "sine", 0.05),
  whoosh: () => playTone(300, 0.14, "triangle", 0.03),
  star:   () => { playTone(988, 0.08, "sine", 0.05); playTone(1319, 0.12, "sine", 0.05, 0.07); },
};

function initSound() {
  try {
    const s = localStorage.getItem(STORAGE.sound);
    soundEnabled = s === null ? true : s === "1";
  } catch { soundEnabled = true; }
  updateSoundIcon();
}
function updateSoundIcon() {
  if (!D.soundToggle) return;
  D.soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
  D.soundToggle.classList.toggle("is-active", soundEnabled);
  D.soundToggle.title = soundEnabled ? "Звуки включены" : "Звуки выключены";
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem(STORAGE.sound, soundEnabled ? "1" : "0"); } catch {}
  updateSoundIcon();
  if (soundEnabled) SFX.toggle();
}
D.soundToggle?.addEventListener("click", toggleSound);

// Автозвук на кнопки (делегирование)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.classList.contains("modal__close")) { SFX.close(); return; }
  if (btn.classList.contains("tab-btn")) { SFX.tab(); return; }
  if (btn.classList.contains("quiz-opt")) return; // звук даёт сам обработчик
  if (btn.classList.contains("card__star")) { SFX.star(); return; }
  if (btn.classList.contains("card__learn")) { SFX.success(); return; }
  if (btn.classList.contains("device-modal__option")) { SFX.toggle(); return; }
  if (btn.classList.contains("chip") || btn.classList.contains("icon-btn") ||
      btn.classList.contains("btn") || btn.classList.contains("sidebar__btn") ||
      btn.classList.contains("catalog__topic") || btn.classList.contains("related__link") ||
      btn.classList.contains("card__compare") || btn.classList.contains("card__menu-btn") ||
      btn.closest(".card__menu")) {
    SFX.click();
    return;
  }
});

// ============================================================
// ВЫБОР УСТРОЙСТВА
// ============================================================
function getSavedDevice() {
  try { return localStorage.getItem(STORAGE.device); } catch { return null; }
}
function saveDevice(device) {
  try { localStorage.setItem(STORAGE.device, device); } catch {}
}
function detectDevice() {
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua) ? "mobile" : "desktop";
}
function applyDevice(device) {
  document.documentElement.setAttribute("data-device", device);
  if (D.deviceToggle) {
    D.deviceToggle.textContent = device === "mobile" ? "📱" : "💻";
    D.deviceToggle.title = device === "mobile" ? "Мобильная версия (нажмите, чтобы сменить)" : "Компьютерная версия (нажмите, чтобы сменить)";
  }
}
function showDeviceModal() {
  if (!D.deviceModal) return;
  D.deviceModal.hidden = false;
  document.body.style.overflow = "hidden";
}
function hideDeviceModal() {
  if (!D.deviceModal) return;
  D.deviceModal.hidden = true;
  document.body.style.overflow = "";
}
function initDevice() {
  const saved = getSavedDevice();
  if (saved === "mobile" || saved === "desktop") {
    applyDevice(saved);
    return;
  }
  // Первый заход — спрашиваем
  showDeviceModal();
  D.deviceModal?.querySelectorAll("[data-device]").forEach(btn => {
    btn.addEventListener("click", () => {
      const device = btn.dataset.device;
      saveDevice(device);
      applyDevice(device);
      hideDeviceModal();
      SFX.toggle();
      if (typeof applyFilter === "function" && !D.viewFormulas.hidden) applyFilter();
      else if (typeof renderCatalog === "function" && !D.viewCatalog.hidden) renderCatalog();
      toast(device === "mobile" ? "Мобильная версия" : "Версия для ПК");
    });
  });
}
D.deviceToggle?.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-device") || detectDevice();
  const next = cur === "mobile" ? "desktop" : "mobile";
  saveDevice(next);
  applyDevice(next);
  SFX.toggle();
  if (typeof applyFilter === "function" && !D.viewFormulas.hidden) applyFilter();
  else if (typeof renderCatalog === "function" && !D.viewCatalog.hidden) renderCatalog();
  toast(next === "mobile" ? "Мобильная версия" : "Версия для ПК");
});

// ============================================================
// УТИЛИТЫ
// ============================================================
function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}
function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function slugify(str) {
  const map = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z",
    "и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t",
    "у":"u","ф":"f","х":"h","ц":"c","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e",
    "ю":"yu","я":"ya"," ":"-","·":"-","—":"-"};
  return String(str).toLowerCase().split("").map(c => map[c] !== undefined ? map[c] : c)
    .join("").replace(/[^a-z0-9\-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function highlight(text) {
  const safe = esc(text);
  if (!currentQuery) return safe;
  const q = currentQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try { return safe.replace(new RegExp(q, "gi"), (m) => `<mark>${m}</mark>`); }
  catch { return safe; }
}
function toast(text) {
  D.toast.textContent = text;
  D.toast.classList.add("is-visible");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => D.toast.classList.remove("is-visible"), 1500);
}
function favKey(subject, topic, title) { return subject + "||" + topic + "||" + title; }
function totalCount() {
  let n = 0;
  for (const s in data) for (const t in data[s]) n += data[s][t].length;
  return n;
}
function findFormulaByTitle(title) {
  for (const s in data) {
    for (const t in data[s]) {
      const found = data[s][t].find((x) => x.title === title);
      if (found) return { item: found, subject: s, topic: t };
    }
  }
  return null;
}
function debounce(fn, delay) {
  let t = null;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================================
// KATEX
// ============================================================
let KATEX_OK = false;
const katexCache = new Map();
const pendingKatex = new Set();

function isKatexReady() {
  return typeof window.katex !== "undefined" && typeof window.katex.renderToString === "function";
}
function renderTex(tex, node) {
  if (!tex || !node) return;
  if (node.dataset.rendered === "1") return;
  if (!isKatexReady()) {
    node.textContent = tex;
    node.classList.add("katex-fallback");
    node.dataset.rendered = "1";
    node.dataset.pendingKatex = "1";
    pendingKatex.add(node);
    return;
  }
  try {
    let html = katexCache.get(tex);
    if (!html) {
      html = window.katex.renderToString(tex, { throwOnError: false, displayMode: false });
      katexCache.set(tex, html);
    }
    node.innerHTML = html;
    node.classList.remove("katex-fallback");
    node.dataset.rendered = "1";
    delete node.dataset.pendingKatex;
  } catch {
    node.textContent = tex;
    node.classList.add("katex-fallback");
    node.dataset.rendered = "1";
  }
}
function renderMathIn(root) {
  if (!root) return;
  const nodes = root.querySelectorAll("[data-tex]:not([data-rendered='1'])");
  nodes.forEach((node) => renderTex(node.dataset.tex, node));
}
function rerenderAllKatex() {
  if (!isKatexReady()) return;
  KATEX_OK = true;
  pendingKatex.forEach((node) => { node.dataset.rendered = ""; renderTex(node.dataset.tex, node); });
  pendingKatex.clear();
  document.querySelectorAll("[data-tex]").forEach((node) => {
    if (node.dataset.pendingKatex === "1" || node.dataset.rendered !== "1") {
      node.dataset.rendered = "";
      renderTex(node.dataset.tex, node);
    }
  });
}

// ============================================================
// ТЕМА / ШРИФТ / САЙДБАР
// ============================================================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  D.themeToggle.textContent = theme === "light" ? "☀️" : "🌙";
  try { localStorage.setItem(STORAGE.theme, theme); } catch {}
}
function initTheme() {
  let theme = null;
  try { theme = localStorage.getItem(STORAGE.theme); } catch {}
  if (theme !== "light" && theme !== "dark") {
    theme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  }
  applyTheme(theme);
}
D.themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
});

const FONT_SIZES = ["small", "normal", "large", "xlarge"];
function applyFontSize(size) {
  if (!FONT_SIZES.includes(size)) size = "normal";
  document.documentElement.setAttribute("data-fontsize", size);
  try { localStorage.setItem(STORAGE.font, size); } catch {}
}
function initFontSize() {
  let size = "normal";
  try { const s = localStorage.getItem(STORAGE.font); if (FONT_SIZES.includes(s)) size = s; } catch {}
  applyFontSize(size);
}
D.fontMinus.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-fontsize") || "normal";
  applyFontSize(FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(cur) - 1)]);
});
D.fontPlus.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-fontsize") || "normal";
  applyFontSize(FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(cur) + 1)]);
});
D.fontReset.addEventListener("click", () => applyFontSize("normal"));
D.printBtn.addEventListener("click", () => window.print());

function initSidebar() {
  try {
    if (localStorage.getItem(STORAGE.sidebar) === "1") {
      D.sidebar.classList.add("is-hidden");
      D.layout.classList.add("is-sidebar-hidden");
    }
  } catch {}
}
D.sidebarToggle.addEventListener("click", () => {
  D.sidebar.classList.toggle("is-hidden");
  D.layout.classList.toggle("is-sidebar-hidden", D.sidebar.classList.contains("is-hidden"));
  try { localStorage.setItem(STORAGE.sidebar, D.sidebar.classList.contains("is-hidden") ? "1" : "0"); } catch {}
});

if (D.fullscreenBtn) {
  D.fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  });
  document.addEventListener("fullscreenchange", () => {
    D.fullscreenBtn.textContent = document.fullscreenElement ? "⛉" : "⛶";
  });
}
if (D.navBack) D.navBack.addEventListener("click", () => history.back());
if (D.navForward) D.navForward.addEventListener("click", () => history.forward());

function updateSubjectColor() {
  if (activeSubject) document.documentElement.setAttribute("data-subject", activeSubject);
  else document.documentElement.removeAttribute("data-subject");
}

// ============================================================
// URL-РОУТИНГ
// ============================================================
function updateURL() {
  if (currentTab === "catalog") { location.hash = "#/catalog"; return; }
  if (currentTab === "fav") { location.hash = "#/favorites"; return; }
  if (activeTitle) location.hash = "#/" + slugify(activeSubject) + "/" + slugify(activeTopic) + "/" + slugify(activeTitle);
  else if (activeSubject && activeTopic) location.hash = "#/" + slugify(activeSubject) + "/" + slugify(activeTopic);
  else if (activeSubject) location.hash = "#/" + slugify(activeSubject);
  else location.hash = "#/";
}
function findSubjectBySlug(slug) { for (const s in data) if (slugify(s) === slug) return s; return null; }
function findTopicBySlug(subject, slug) { for (const t in data[subject]) if (slugify(t) === slug) return t; return null; }
function findTitleBySlug(subject, topic, slug) { for (const it of data[subject][topic]) if (slugify(it.title) === slug) return it.title; return null; }
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  if (!raw) return { catalog: true };
  if (raw === "favorites") return { favorites: true };
  if (raw === "catalog") return { catalog: true };
  const parts = raw.split("/").map(decodeURIComponent);
  if (parts.length === 1) return { subject: findSubjectBySlug(parts[0]), topic: null, title: null };
  if (parts.length === 2) {
    const s = findSubjectBySlug(parts[0]);
    if (!s) return { catalog: true };
    return { subject: s, topic: findTopicBySlug(s, parts[1]), title: null };
  }
  if (parts.length >= 3) {
    const s = findSubjectBySlug(parts[0]);
    if (!s) return { catalog: true };
    const t = findTopicBySlug(s, parts[1]);
    if (!t) return { subject: s, topic: null, title: null };
    return { subject: s, topic: t, title: findTitleBySlug(s, t, parts[2]) };
  }
  return { catalog: true };
}
function applyHash() {
  const parsed = parseHash();
  if (parsed.catalog) {
    activeSubject = null; activeTopic = null; activeTitle = null;
    showTab("catalog"); renderCatalog(); renderNav(); updateSubjectColor();
    return;
  }
  if (parsed.favorites) { showTab("fav"); renderFavorites(); return; }
  activeSubject = parsed.subject;
  activeTopic = parsed.topic;
  activeTitle = parsed.title;
  showTab("formulas");
  renderNav();
  updateSubjectColor();
  applyFilter();
  if (activeTitle) {
    setTimeout(() => {
      const card = D.list.querySelector(`[data-card-title="${CSS.escape(activeTitle)}"]`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("is-highlighted");
        setTimeout(() => card.classList.remove("is-highlighted"), 2000);
      }
    }, 300);
  }
}
window.addEventListener("hashchange", applyHash);

// ============================================================
// СПРАВОЧНИК / ТЕРМИНЫ
// ============================================================
function renderReference() {
  let html = "";
  for (const section in reference) {
    html += `<div class="ref-card"><h3>${esc(section)}</h3><table class="ref-table">`;
    for (const [name, value] of reference[section]) html += `<tr><td>${esc(name)}</td><td>${esc(value)}</td></tr>`;
    html += `</table></div>`;
  }
  D.refGrid.innerHTML = html;
}
function renderTerms() {
  D.termsList.innerHTML = terms.map((t) => `<div class="term"><h3>${esc(t.term)}</h3><p>${esc(t.def)}</p></div>`).join("");
}

// ============================================================
// КАТАЛОГ
// ============================================================
function renderCatalog() {
  let html = "";
  for (const subject in data) {
    const topics = data[subject];
    const total = Object.values(topics).reduce((s, arr) => s + arr.length, 0);
    html += `
      <div class="catalog__subject" data-catalog-subject="${esc(subject)}">
        <div class="catalog__head">
          <h2 class="catalog__name" data-catalog-name="${esc(subject)}">${esc(subject)}</h2>
          <span class="catalog__count">${total} формул</span>
        </div>
        <div class="catalog__topics">
          ${Object.keys(topics).map((topic) => {
            const count = topics[topic].length;
            const p = topicProgress(subject, topic);
            return `
              <button class="catalog__topic" type="button"
                      data-catalog-subject="${esc(subject)}"
                      data-catalog-topic="${esc(topic)}">
                <span class="catalog__topic-name">${esc(topic)}</span>
                <span class="catalog__topic-count">${count}</span>
                <div class="catalog__progress"><i style="width:${p}%"></i></div>
              </button>`;
          }).join("")}
        </div>
      </div>`;
  }
  D.catalog.innerHTML = html;

  D.catalog.querySelectorAll(".catalog__topic").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSubject = btn.dataset.catalogSubject;
      activeTopic = btn.dataset.catalogTopic;
      activeTitle = null;
      showTab("formulas"); renderNav(); updateSubjectColor(); applyFilter(); updateURL();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  D.catalog.querySelectorAll("[data-catalog-name]").forEach((h) => {
    h.addEventListener("click", () => {
      activeSubject = h.dataset.catalogName;
      activeTopic = null;
      activeTitle = null;
      showTab("formulas"); renderNav(); updateSubjectColor(); applyFilter(); updateURL();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

// ============================================================
// НАВИГАЦИЯ
// ============================================================
function topicProgress(subject, topic) {
  const arr = data[subject][topic];
  if (!arr.length) return 0;
  let done = 0;
  for (const item of arr) if (learned.has(favKey(subject, topic, item.title))) done++;
  return Math.round((done / arr.length) * 100);
}
function renderNav() {
  let html = "";
  for (const subject in data) {
    const topics = data[subject];
    const count = Object.values(topics).reduce((s, arr) => s + arr.length, 0);
    const isOpen = expandAllMode || expandedSubjects.has(subject) || activeSubject === subject;
    html += `
      <div class="nav__subject ${isOpen ? "is-open" : ""}" data-subject="${esc(subject)}">
        <button class="nav__subject-btn" type="button">
          <span>${esc(subject)}</span>
          <span class="nav__count">${count}</span>
          <span class="arrow">▶</span>
        </button>
        <div class="nav__topics">
          ${Object.keys(topics).map((topic) => {
            const isActive = activeSubject === subject && activeTopic === topic;
            const p = topicProgress(subject, topic);
            return `<button class="nav__topic ${isActive ? "is-active" : ""}" type="button"
                      data-subject="${esc(subject)}" data-topic="${esc(topic)}">
                      <span>${esc(topic)}</span>
                      <span class="nav__count">${topics[topic].length}</span>
                    </button>
                    <div class="nav__progress"><i style="width:${p}%"></i></div>`;
          }).join("")}
        </div>
      </div>`;
  }
  html += `<div class="nav__subject"><button class="nav__topic nav__topic--fav" type="button" id="navFav">
    <span>★ Избранное</span><span class="nav__count">${favorites.size}</span>
  </button></div>`;
  D.nav.innerHTML = html;
  D.nav.classList.toggle("is-expanded-all", expandAllMode);
  D.nav.querySelectorAll(".nav__subject-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const subject = btn.closest(".nav__subject").dataset.subject;
      if (expandAllMode) { expandAllMode = false; expandedSubjects = new Set([subject]); }
      else { if (expandedSubjects.has(subject)) expandedSubjects.delete(subject); else expandedSubjects.add(subject); }
      renderNav();
    });
  });
  D.nav.querySelectorAll(".nav__topic[data-subject]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSubject = btn.dataset.subject;
      activeTopic = btn.dataset.topic;
      activeTitle = null;
      showTab("formulas"); renderNav(); updateSubjectColor(); applyFilter(); updateURL(); closeSidebar();
    });
  });
  const navFav = document.getElementById("navFav");
  if (navFav) navFav.addEventListener("click", () => { showTab("fav"); renderFavorites(); location.hash = "#/favorites"; closeSidebar(); });
  updateSidebarButtons();
}
function updateSidebarButtons() {
  const expandBtn = document.getElementById("expandAll");
  const collapseBtn = document.getElementById("collapseAll");
  if (expandBtn) expandBtn.classList.toggle("is-active", expandAllMode);
  if (collapseBtn) collapseBtn.classList.toggle("is-active", !expandAllMode && expandedSubjects.size === 0);
}
document.addEventListener("click", (e) => {
  if (e.target.closest("#expandAll")) { expandAllMode = true; expandedSubjects = new Set(Object.keys(data)); renderNav(); return; }
  if (e.target.closest("#collapseAll")) { expandAllMode = false; expandedSubjects = new Set(); renderNav(); return; }
});

function renderBreadcrumbs() {
  if (!D.viewFav.hidden) { D.breadcrumbs.innerHTML = ""; return; }
  let html = `<a data-nav="catalog">Все разделы</a>`;
  if (activeSubject) {
    html += `<span class="breadcrumbs__sep">›</span>`;
    if (activeTopic) html += `<a data-nav="subject">${esc(activeSubject)}</a>`; else html += `<span>${esc(activeSubject)}</span>`;
  }
  if (activeTopic) {
    html += `<span class="breadcrumbs__sep">›</span>`;
    if (activeTitle) html += `<a data-nav="topic">${esc(activeTopic)}</a>`; else html += `<span>${esc(activeTopic)}</span>`;
  }
  if (activeTitle) html += `<span class="breadcrumbs__sep">›</span><span>${esc(activeTitle)}</span>`;
  D.breadcrumbs.innerHTML = html;
  D.breadcrumbs.querySelector('[data-nav="catalog"]')?.addEventListener("click", () => {
    activeSubject = null; activeTopic = null; activeTitle = null;
    showTab("catalog"); renderCatalog(); renderNav(); updateSubjectColor(); location.hash = "#/catalog";
  });
  D.breadcrumbs.querySelector('[data-nav="subject"]')?.addEventListener("click", () => {
    activeTopic = null; activeTitle = null; renderNav(); applyFilter(); updateURL();
  });
  D.breadcrumbs.querySelector('[data-nav="topic"]')?.addEventListener("click", () => {
    activeTitle = null; applyFilter(); updateURL();
  });
}

// ============================================================
// УНИВЕРСАЛЬНЫЙ РЕШАТЕЛЬ
// ============================================================
function solveForVariable(expr, unknownKey, knownValues, targetValue) {
  const f = (x) => {
    const vals = { ...knownValues, [unknownKey]: x };
    try {
      const r = expr(vals);
      if (typeof r !== "number" || !isFinite(r)) return NaN;
      return r - targetValue;
    } catch { return NaN; }
  };
  const candidates = [0];
  for (let e = -6; e <= 6; e++) {
    const step = Math.pow(10, e);
    for (let k = -10; k <= 10; k++) candidates.push(k * step);
  }
  candidates.sort((a, b) => a - b);

  let lo = null, hi = null;
  for (let i = 0; i < candidates.length - 1; i++) {
    const a = candidates[i], b = candidates[i + 1];
    const fa = f(a), fb = f(b);
    if (isNaN(fa) || isNaN(fb)) continue;
    if (fa === 0) return a;
    if (fb === 0) return b;
    if (fa * fb < 0) { lo = a; hi = b; break; }
  }
  if (lo === null) return null;
  let a = lo, b = hi;
  for (let iter = 0; iter < 200; iter++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (isNaN(fm)) return null;
    if (Math.abs(fm) < 1e-9 || (b - a) < 1e-12) return m;
    if (f(a) * fm < 0) b = m; else a = m;
  }
  return (a + b) / 2;
}
function exprSafe(expr, vals) {
  try { const r = expr(vals); return typeof r === "number" && isFinite(r) ? r : NaN; } catch { return NaN; }
}

// ============================================================
// ПОШАГОВОЕ РЕШЕНИЕ
// ============================================================
function openSolveModal(key) {
  const parts = key.split("||");
  const found = findFormulaByTitle(parts[2]);
  if (!found || !found.item.calc) { toast("Для этой формулы нет калькулятора"); SFX.error(); return; }
  currentSolveKey = key;
  const item = found.item;
  D.solveTitle.textContent = "Решение: " + item.title;
  D.solveDesc.textContent = "Оставьте ОДНО поле пустым — его и найдём.";
  D.solveFormula.dataset.tex = item.formula;
  D.solveFormula.dataset.rendered = "";
  D.solveFormula.textContent = "";
  renderTex(item.formula, D.solveFormula);
  D.solveVars.innerHTML = `<div class="solve-modal__vars-title">Введите значения (одно поле пустое):</div>` +
    item.calc.vars.map(vr => `
      <div class="solve-modal__var">
        <label for="solve-${esc(vr.v)}">${esc(vr.label)}</label>
        <input id="solve-${esc(vr.v)}" type="text" inputmode="decimal" autocomplete="off"
               placeholder="${esc(vr.label)}" data-svar="${esc(vr.v)}">
      </div>`).join("");
  D.solveOutput.innerHTML = "";
  D.solveModal.classList.add("is-visible");
  document.body.style.overflow = "hidden";
  SFX.open();
}
function closeSolveModal() {
  D.solveModal.classList.remove("is-visible");
  document.body.style.overflow = "";
}
D.solveRun.addEventListener("click", () => {
  if (!currentSolveKey) return;
  const parts = currentSolveKey.split("||");
  const found = findFormulaByTitle(parts[2]);
  if (!found || !found.item.calc) return;
  const item = found.item;

  const inputs = D.solveVars.querySelectorAll("input[data-svar]");
  const values = {};
  const emptyKeys = [];
  inputs.forEach(inp => {
    const raw = inp.value.trim().replace(",", ".");
    if (raw === "") { emptyKeys.push(inp.dataset.svar); return; }
    const val = parseFloat(raw);
    if (Number.isNaN(val)) { emptyKeys.push(inp.dataset.svar); return; }
    values[inp.dataset.svar] = val;
  });

  if (emptyKeys.length === 0) {
    SFX.error();
    D.solveOutput.innerHTML = `<div style="padding:12px;background:color-mix(in srgb,#f87171 15%,var(--surface-solid));border-radius:8px;color:#f87171;">Оставьте <b>одно</b> поле пустым — его и найдём.</div>`;
    return;
  }
  if (emptyKeys.length > 1) {
    SFX.error();
    D.solveOutput.innerHTML = `<div style="padding:12px;background:color-mix(in srgb,#f87171 15%,var(--surface-solid));border-radius:8px;color:#f87171;">Заполните все поля, кроме <b>одного</b>. Пустых сейчас: ${emptyKeys.length}.</div>`;
    return;
  }

  const unknownKey = emptyKeys[0];
  const unknownVar = item.calc.vars.find(v => v.v === unknownKey);
  const unit = item.calc.unit ? " " + item.calc.unit : "";

  let result = null;
  try {
    const testVal0 = exprSafe(item.calc.expr, { ...values, [unknownKey]: 0 });
    const testVal1 = exprSafe(item.calc.expr, { ...values, [unknownKey]: 1 });
    const dependsOnUnknown = !(Math.abs(testVal1 - testVal0) < 1e-12);

    if (!dependsOnUnknown) {
      result = item.calc.expr(values);
    } else {
      const firstVar = item.calc.vars[0]?.v;
      const target = (firstVar && values[firstVar] !== undefined) ? values[firstVar] : null;
      if (target === null) {
        SFX.error();
        D.solveOutput.innerHTML = `<div style="padding:12px;background:color-mix(in srgb,#f87171 15%,var(--surface-solid));border-radius:8px;color:#f87171;">Не удалось определить, что искать. Проверьте введённые значения.</div>`;
        return;
      }
      const x = solveForVariable(item.calc.expr, unknownKey, values, target);
      if (x === null) {
        SFX.error();
        D.solveOutput.innerHTML = `<div style="padding:12px;background:color-mix(in srgb,#f87171 15%,var(--surface-solid));border-radius:8px;color:#f87171;">Не удалось найти решение. Проверьте входные данные.</div>`;
        return;
      }
      result = x;
    }
  } catch (e) {
    SFX.error();
    D.solveOutput.innerHTML = `<div style="padding:12px;background:color-mix(in srgb,#f87171 15%,var(--surface-solid));border-radius:8px;color:#f87171;">Ошибка: ${esc(e.message || String(e))}</div>`;
    return;
  }

  const fmt = (n) => (typeof n === "number" && isFinite(n)) ? (+n.toPrecision(6)).toString() : String(n);

  let html = `<div class="solve-steps">`;
  html += `<div class="solve-step"><div class="solve-step__num">1</div>
    <div class="solve-step__text">Формула: <span data-tex="${esc(item.formula)}"></span></div></div>`;
  const knownText = item.calc.vars
    .filter(v => v.v !== unknownKey)
    .map(v => `${v.label.split(",")[0]} = ${fmt(values[v.v])}`)
    .join(", ");
  html += `<div class="solve-step"><div class="solve-step__num">2</div>
    <div class="solve-step__text">Известно: ${esc(knownText)}</div></div>`;
  html += `<div class="solve-step"><div class="solve-step__num">3</div>
    <div class="solve-step__text">Ищем: <b>${esc(unknownVar.label)}</b></div></div>`;
  html += `<div class="solve-step"><div class="solve-step__num">4</div>
    <div class="solve-step__text">Ответ: ${esc(unknownVar.label.split(",")[0])} = ${fmt(result)}${unit}</div></div>`;
  html += `</div>`;
  html += `<div class="solve-result">✓ ${esc(unknownVar.label.split(",")[0])} = ${fmt(result)}${unit}</div>`;
  D.solveOutput.innerHTML = html;
  renderMathIn(D.solveOutput);
  SFX.success();

  if (parts[0] && parts[1]) {
    const key = favKey(parts[0], parts[1], parts[2]);
    if (!learned.has(key)) {
      learned.add(key);
      saveSet(STORAGE.learned, learned);
      renderNav();
    }
  }
});
D.solveReset.addEventListener("click", () => {
  D.solveVars.querySelectorAll("input").forEach(inp => inp.value = "");
  D.solveOutput.innerHTML = "";
});
D.solveModalClose.addEventListener("click", closeSolveModal);
D.solveModal.addEventListener("click", (e) => { if (e.target === D.solveModal) closeSolveModal(); });

// ============================================================
// ОБРАТНЫЕ ЗАДАЧИ
// ============================================================
function openReverseModal(key) {
  const parts = key.split("||");
  const found = findFormulaByTitle(parts[2]);
  if (!found || !found.item.calc) { toast("Для этой формулы нет переменных"); SFX.error(); return; }
  currentReverseKey = key;
  const item = found.item;
  D.reverseTitle.textContent = "Как найти переменную?";
  D.reverseDesc.textContent = "Формула: " + item.title + ". Выберите, что нужно найти — откроется решение с этой переменной.";
  D.reverseFormula.dataset.tex = item.formula;
  D.reverseFormula.dataset.rendered = "";
  D.reverseFormula.textContent = "";
  renderTex(item.formula, D.reverseFormula);
  D.reverseList.innerHTML = item.calc.vars.map(vr => `
    <div class="reverse-modal__item" data-reverse-var="${esc(vr.v)}">
      <div class="reverse-modal__var">${esc(vr.label.split(",")[0])}</div>
      <div class="reverse-modal__info">
        <div class="reverse-modal__name">Найти: ${esc(vr.label)}</div>
        <div class="reverse-modal__hint">Откроется решение — оставьте это поле пустым</div>
      </div>
    </div>`).join("");
  D.reverseList.querySelectorAll("[data-reverse-var]").forEach(el => {
    el.addEventListener("click", () => {
      const varKey = el.dataset.reverseVar;
      closeReverseModal();
      openSolveModal(currentReverseKey);
      setTimeout(() => {
        const inp = document.getElementById("solve-" + varKey);
        if (inp) inp.focus();
      }, 100);
    });
  });
  D.reverseModal.classList.add("is-visible");
  document.body.style.overflow = "hidden";
  SFX.open();
}
function closeReverseModal() {
  D.reverseModal.classList.remove("is-visible");
  document.body.style.overflow = "";
}
D.reverseModalClose.addEventListener("click", closeReverseModal);
D.reverseModal.addEventListener("click", (e) => { if (e.target === D.reverseModal) closeReverseModal(); });

// ============================================================
// QR
// ============================================================
function getFormulaUrl(key) {
  const parts = key.split("||");
  const base = location.origin + location.pathname;
  return base + "#/" + slugify(parts[0]) + "/" + slugify(parts[1]) + "/" + slugify(parts[2]);
}
function openQrModal(key) {
  const url = getFormulaUrl(key);
  currentQrUrl = url;
  D.qrUrl.innerHTML = `Ссылка: <a href="${esc(url)}" target="_blank">${esc(url)}</a>`;
  D.qrCanvas.innerHTML = "";
  if (typeof QRCode !== "undefined") {
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, url, { width: 280, margin: 2, color: { dark: "#000000", light: "#ffffff" } }, (err) => {
      if (err) { D.qrCanvas.innerHTML = `<div style="color:#f87171;padding:20px;">Ошибка генерации QR</div>`; return; }
      D.qrCanvas.appendChild(canvas);
    });
  } else {
    D.qrCanvas.innerHTML = `<div style="color:var(--muted);padding:20px;text-align:center;">Библиотека QRCode не загрузилась.</div>`;
  }
  D.qrModal.classList.add("is-visible");
  document.body.style.overflow = "hidden";
  SFX.open();
}
function closeQrModal() {
  D.qrModal.classList.remove("is-visible");
  document.body.style.overflow = "";
}
D.qrCopyUrl.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(currentQrUrl); toast("Ссылка скопирована"); SFX.copy(); }
  catch { toast("Не удалось скопировать"); }
});
D.qrDownload.addEventListener("click", () => {
  const canvas = D.qrCanvas.querySelector("canvas");
  if (!canvas) { toast("QR ещё не готов"); return; }
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url; a.download = "formula-qr.png"; a.click();
  toast("Скачано");
});
D.qrModalClose.addEventListener("click", closeQrModal);
D.qrModal.addEventListener("click", (e) => { if (e.target === D.qrModal) closeQrModal(); });

// ============================================================
// ВЫВОД ФОРМУЛЫ
// ============================================================
const derivations = {
  "Второй закон Ньютона": [
    { label: "Начнём с определения ускорения", formula: "a = \\frac{\\Delta v}{\\Delta t}", hint: "Ускорение — быстрота изменения скорости" },
    { label: "Умножим обе части на массу m", formula: "m a = m \\frac{\\Delta v}{\\Delta t}", hint: "Масса — постоянная величина" },
    { label: "Импульс p = mv, значит Δp = mΔv", formula: "m a = \\frac{\\Delta p}{\\Delta t}", hint: "Изменение импульса через массу и скорость" },
    { label: "Сила — скорость изменения импульса", formula: "F = \\frac{\\Delta p}{\\Delta t} = m a", hint: "Получили второй закон Ньютона" }
  ],
  "Кинетическая энергия": [
    { label: "Работа силы на пути s", formula: "A = F \\cdot s", hint: "Определение механической работы" },
    { label: "Подставим F = ma", formula: "A = m a s", hint: "Второй закон Ньютона" },
    { label: "Из кинематики: v² = 2as → s = v²/(2a)", formula: "A = m a \\cdot \\frac{v^2}{2a}", hint: "Связь скорости и пути" },
    { label: "Сократим ускорение", formula: "A = \\frac{m v^2}{2} = E_k", hint: "Работа равна кинетической энергии" }
  ],
  "Закон Ома для полной цепи": [
    { label: "Напряжение на внешнем участке", formula: "U = I R", hint: "Закон Ома для участка цепи" },
    { label: "Напряжение на внутреннем сопротивлении", formula: "U_r = I r", hint: "Падение напряжения внутри источника" },
    { label: "ЭДС = сумма падений напряжений", formula: "\\varepsilon = I R + I r", hint: "Закон сохранения энергии в цепи" },
    { label: "Выразим силу тока", formula: "I = \\frac{\\varepsilon}{R + r}", hint: "Закон Ома для полной цепи" }
  ],
  "Период математического маятника": [
    { label: "Возвращающая сила", formula: "F = -m g \\sin\\alpha", hint: "Проекция силы тяжести на дугу" },
    { label: "Для малых углов sin α ≈ α ≈ s/l", formula: "F \\approx -\\frac{m g}{l} s", hint: "Приближение малых колебаний" },
    { label: "Это гармоническое колебание с k = mg/l", formula: "\\omega = \\sqrt{\\frac{g}{l}}", hint: "Циклическая частота" },
    { label: "Период T = 2π/ω", formula: "T = 2\\pi\\sqrt{\\frac{l}{g}}", hint: "Формула Гюйгенса" }
  ],
  "Закон Джоуля — Ленца": [
    { label: "Работа тока", formula: "A = U I t", hint: "Работа электрического тока" },
    { label: "По закону Ома U = IR", formula: "A = I^2 R t", hint: "Подставим напряжение" },
    { label: "Вся работа идёт на нагрев", formula: "Q = A = I^2 R t", hint: "Получили закон Джоуля — Ленца" }
  ],
  "Плотность": [
    { label: "Масса через объём и плотность", formula: "m = \\rho V", hint: "Определение плотности" },
    { label: "Выразим плотность", formula: "\\rho = \\frac{m}{V}", hint: "Формула плотности" }
  ],
  "Теорема Пифагора": [
    { label: "Площадь большого квадрата", formula: "S = (a+b)^2", hint: "Сторона квадрата a+b" },
    { label: "Он состоит из 4 треугольников и квадрата c²", formula: "(a+b)^2 = 4 \\cdot \\frac{1}{2}ab + c^2", hint: "Площадь фигуры равна сумме частей" },
    { label: "Раскроем скобки", formula: "a^2 + 2ab + b^2 = 2ab + c^2", hint: "Приведём подобные" },
    { label: "Упростим", formula: "a^2 + b^2 = c^2", hint: "Теорема Пифагора" }
  ],
  "Квадратное уравнение": [
    { label: "Общий вид", formula: "ax^2 + bx + c = 0", hint: "Старший коэффициент a ≠ 0" },
    { label: "Выделим полный квадрат", formula: "a\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a}", hint: "Преобразование" },
    { label: "Обозначим D = b² − 4ac", formula: "\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{D}{4a^2}", hint: "Дискриминант" },
    { label: "Извлечём корень", formula: "x = \\frac{-b \\pm \\sqrt{D}}{2a}", hint: "Корни квадратного уравнения" }
  ],
  "Уравнение Менделеева — Клапейрона": [
    { label: "Объединённый газовый закон", formula: "\\frac{P_1 V_1}{T_1} = \\frac{P_2 V_2}{T_2}", hint: "Для данной массы газа" },
    { label: "Для 1 моля константа = R", formula: "\\frac{P V}{T} = R", hint: "Универсальная газовая постоянная" },
    { label: "Для n молей", formula: "P V = n R T", hint: "Уравнение состояния идеального газа" }
  ]
};
function openDeriveModal(key) {
  const parts = key.split("||");
  const found = findFormulaByTitle(parts[2]);
  if (!found) return;
  const { item } = found;
  D.deriveTitle.textContent = "Вывод: " + item.title;
  D.deriveDesc.textContent = item.desc || "";
  const steps = derivations[item.title];
  if (!steps) {
    D.deriveChain.innerHTML = `
      <div style="padding:20px;text-align:center;color:var(--muted);background:var(--surface-2);border-radius:12px;">
        <div style="font-size:2em;margin-bottom:8px;">📖</div>
        <div>Готовый вывод этой формулы пока отсутствует.</div>
        <div style="margin-top:12px;font-size:0.85em;">Связанные формулы:</div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
          ${(item.related || []).map(r => `<button class="related__link" type="button" data-goto="${esc(r)}">${esc(r)}</button>`).join("")}
        </div>
      </div>`;
  } else {
    let html = "";
    steps.forEach((step, i) => {
      if (i > 0) html += `<div class="derive-arrow">↓</div>`;
      html += `
        <div class="derive-step">
          <div class="derive-step__num">${i + 1}</div>
          <div class="derive-step__body">
            <div class="derive-step__label">${esc(step.label)}</div>
            <div class="derive-step__formula" data-tex="${esc(step.formula)}"></div>
            <div class="derive-step__hint">${esc(step.hint)}</div>
          </div>
        </div>`;
    });
    html += `<div class="derive-arrow">↓</div>`;
    html += `
      <div class="derive-target">
        <div class="derive-target__label">Итог</div>
        <div class="derive-target__formula" data-tex="${esc(item.formula)}"></div>
      </div>`;
    D.deriveChain.innerHTML = html;
  }
  D.deriveModal.classList.add("is-visible");
  document.body.style.overflow = "hidden";
  renderMathIn(D.deriveChain);
  SFX.open();
  D.deriveChain.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => {
      closeDeriveModal();
      const f = findFormulaByTitle(btn.dataset.goto);
      if (!f) return;
      activeSubject = f.subject;
      activeTopic = f.topic;
      activeTitle = f.item.title;
      showTab("formulas"); renderNav(); updateSubjectColor(); applyFilter(); updateURL();
    });
  });
}
function closeDeriveModal() {
  D.deriveModal.classList.remove("is-visible");
  document.body.style.overflow = "";
}
D.deriveModalClose.addEventListener("click", closeDeriveModal);
D.deriveModal.addEventListener("click", (e) => { if (e.target === D.deriveModal) closeDeriveModal(); });

// ============================================================
// SPLIT VIEW
// ============================================================
function openSplitPane(key) {
  const parts = key.split("||");
  const found = findFormulaByTitle(parts[2]);
  if (!found) return;
  const { item, subject, topic } = found;
  let pane = document.getElementById("splitPane");
  if (!pane) {
    pane = document.createElement("div");
    pane.id = "splitPane";
    pane.className = "split-pane";
    document.querySelector(".content").appendChild(pane);
  }
  pane.innerHTML = `
    <button class="split-pane__close" id="splitPaneClose" title="Закрыть">✕</button>
    <h3 class="split-pane__title">${esc(item.title)}</h3>
    <div class="split-pane__formula" data-tex="${esc(item.formula)}"></div>
    <p class="split-pane__desc">${esc(item.desc)}</p>
    <div class="split-pane__meta">
      <span class="tag tag--subject">${esc(subject)}</span>
      <span class="tag">${esc(topic)}</span>
    </div>
    ${item.example ? `<div class="block is-open"><button class="block__toggle" type="button">Пример</button><div class="block__body"><div class="example">${esc(item.example)}</div></div></div>` : ""}
    ${item.calc ? `
      <div class="block is-open">
        <button class="block__toggle" type="button">Калькулятор</button>
        <div class="block__body">
          <div class="calc" data-split-calc="${esc(key)}">
            ${item.calc.vars.map(vr => `
              <div class="calc__row">
                <label>${esc(vr.label.split(",")[0])}</label>
                <input type="text" inputmode="decimal" placeholder="${esc(vr.label)}" data-var="${esc(vr.v)}">
              </div>`).join("")}
            <div class="calc__actions">
              <button class="btn is-active" type="button" data-split-run="${esc(key)}">Вычислить</button>
            </div>
            <div class="calc__result" id="split-result"></div>
          </div>
        </div>
      </div>` : ""}
  `;
  document.querySelector(".content").classList.add("split-active");
  pane.classList.add("is-visible");
  splitActive = true;
  renderMathIn(pane);
  document.getElementById("splitPaneClose")?.addEventListener("click", (e) => { e.stopPropagation(); closeSplitPane(); });
  pane.querySelectorAll(".block__toggle").forEach(btn => {
    btn.addEventListener("click", () => btn.closest(".block").classList.toggle("is-open"));
  });
  const runBtn = pane.querySelector("[data-split-run]");
  if (runBtn) {
    runBtn.addEventListener("click", () => {
      const block = pane.querySelector("[data-split-calc]");
      const inputs = block.querySelectorAll("input[data-var]");
      const values = {};
      let ok = true;
      inputs.forEach(inp => {
        const val = parseFloat(inp.value.replace(",", "."));
        if (Number.isNaN(val)) ok = false;
        values[inp.dataset.var] = val;
      });
      const resultEl = document.getElementById("split-result");
      if (!ok) { resultEl.textContent = "Заполните все поля"; SFX.error(); return; }
      try {
        const res = item.calc.expr(values);
        const unit = item.calc.unit ? " " + item.calc.unit : "";
        resultEl.textContent = "Результат: " + (typeof res === "number" ? (+res).toPrecision(6) : res) + unit;
        SFX.success();
      } catch { resultEl.textContent = "Ошибка"; SFX.error(); }
    });
  }
}
function closeSplitPane() {
  const pane = document.getElementById("splitPane");
  if (pane) pane.classList.remove("is-visible");
  document.querySelector(".content").classList.remove("split-active");
  splitActive = false;
}
function toggleSplit() {
  if (splitActive) closeSplitPane();
  else {
    const card = document.querySelector(".card");
    if (card) openSplitPane(card.dataset.key);
    else toast("Откройте предмет с формулами");
  }
}
D.splitBtn.addEventListener("click", toggleSplit);
document.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card && e.shiftKey && !e.target.closest("button, input, .block")) {
    e.preventDefault(); e.stopPropagation();
    openSplitPane(card.dataset.key);
  }
}, true);

// ============================================================
// ЦЕЛИ ОБУЧЕНИЯ
// ============================================================
function getGoal() {
  try { return JSON.parse(localStorage.getItem(STORAGE.goal) || "null"); } catch { return null; }
}
function setGoal(goal) {
  try { localStorage.setItem(STORAGE.goal, JSON.stringify(goal)); } catch {}
}
function clearGoal() {
  try { localStorage.removeItem(STORAGE.goal); } catch {}
}
function getStreak() {
  try { return JSON.parse(localStorage.getItem(STORAGE.streak) || '{"count":0,"last":null}'); }
  catch { return { count: 0, last: null }; }
}
function updateStreak() {
  const today = new Date().toDateString();
  const s = getStreak();
  if (s.last === today) return s;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (s.last === yesterday) s.count += 1;
  else s.count = 1;
  s.last = today;
  try { localStorage.setItem(STORAGE.streak, JSON.stringify(s)); } catch {}
  return s;
}
function getAchievements() {
  try { return JSON.parse(localStorage.getItem(STORAGE.achieve) || "[]"); } catch { return []; }
}
function unlockAchievement(id) {
  const list = getAchievements();
  if (!list.includes(id)) {
    list.push(id);
    try { localStorage.setItem(STORAGE.achieve, JSON.stringify(list)); } catch {}
  }
}
const ALL_ACHIEVEMENTS = [
  { id: "learned_10", icon: "🎓", name: "10 формул", desc: "Выучил 10 формул", check: () => learned.size >= 10 },
  { id: "learned_50", icon: "🏆", name: "50 формул", desc: "Выучил 50 формул", check: () => learned.size >= 50 },
  { id: "fav_10", icon: "⭐", name: "10 избранных", desc: "10 формул в избранном", check: () => favorites.size >= 10 },
  { id: "streak_3", icon: "🔥", name: "3 дня подряд", desc: "Заходил 3 дня подряд", check: () => getStreak().count >= 3 },
  { id: "streak_7", icon: "🔥🔥", name: "Неделя", desc: "Заходил 7 дней подряд", check: () => getStreak().count >= 7 },
  { id: "compare_1", icon: "🟣", name: "Первое сравнение", desc: "Сравнил формулы", check: () => compareSet.size > 0 }
];
function renderGoalWidget() {
  const goal = getGoal();
  const streak = getStreak();
  const unlocked = getAchievements();
  let html = "";
  if (streak.count > 0) {
    html += `
      <div class="goal-streak">
        <div class="goal-streak__icon">🔥</div>
        <div>
          <div class="goal-streak__num">${streak.count}</div>
          <div class="goal-streak__label">${streak.count === 1 ? "день подряд" : "дней подряд"}</div>
        </div>
      </div>`;
  }
  if (goal) {
    const subject = goal.subject;
    const topics = data[subject];
    let total = 0, learnedCount = 0;
    for (const t in topics) {
      total += topics[t].length;
      for (const item of topics[t]) {
        if (learned.has(favKey(subject, t, item.title))) learnedCount++;
      }
    }
    const pct = total ? Math.round((learnedCount / total) * 100) : 0;
    const remaining = total - learnedCount;
    html += `
      <div class="goal-current">
        <div class="goal-current__label">Текущая цель</div>
        <div class="goal-current__title">${esc(subject)}</div>
        <div class="goal-current__progress-bar"><i style="width:${pct}%"></i></div>
        <div class="goal-current__stats">
          <span>${learnedCount} / ${total} (${pct}%)</span>
          <span>${remaining > 0 ? "Осталось: " + remaining : "✓ Выполнено!"}</span>
        </div>
        <div class="goal-form__actions" style="margin-top:12px;">
          <button class="btn" id="goalClearBtn" type="button">Сменить цель</button>
        </div>
      </div>`;
  } else {
    html += `
      <div class="goal-current">
        <div class="goal-current__label">Поставьте цель</div>
        <div class="goal-current__title">Какой предмет хотите выучить?</div>
        <p style="color:var(--muted);font-size:0.9em;margin:8px 0 0;">Цель появится здесь с прогресс-баром.</p>
      </div>`;
  }
  html += `
    <div class="goal-form">
      <div class="goal-form__row">
        <label for="goalSelect">Предмет:</label>
        <select id="goalSelect">
          ${Object.keys(data).map(s => `<option value="${esc(s)}" ${goal && goal.subject === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
        </select>
      </div>
      <div class="goal-form__actions">
        <button class="btn btn--solve" id="goalSetBtn" type="button">Поставить цель</button>
      </div>
    </div>
    <div>
      <div class="goal-section-title">Достижения</div>
      <div class="goal-achievements">
        ${ALL_ACHIEVEMENTS.map(a => {
          const isUnlocked = unlocked.includes(a.id) || a.check();
          if (isUnlocked && !unlocked.includes(a.id)) unlockAchievement(a.id);
          return `
            <div class="goal-achievement ${isUnlocked ? "is-unlocked" : ""}">
              <div class="goal-achievement__icon">${a.icon}</div>
              <div class="goal-achievement__name">${esc(a.name)}</div>
              <div class="goal-achievement__desc">${esc(a.desc)}</div>
            </div>`;
        }).join("")}
      </div>
    </div>`;
  D.goalWidget.innerHTML = html;
  document.getElementById("goalSetBtn")?.addEventListener("click", () => {
    const subj = document.getElementById("goalSelect").value;
    setGoal({ subject: subj, created: Date.now() });
    toast("Цель установлена: " + subj);
    renderGoalWidget();
  });
  document.getElementById("goalClearBtn")?.addEventListener("click", () => {
    clearGoal();
    renderGoalWidget();
  });
}
function openGoalModal() {
  renderGoalWidget();
  D.goalModal.classList.add("is-visible");
  document.body.style.overflow = "hidden";
  SFX.open();
}
function closeGoalModal() {
  D.goalModal.classList.remove("is-visible");
  document.body.style.overflow = "";
}
D.goalBtn.addEventListener("click", openGoalModal);
D.goalModalClose.addEventListener("click", closeGoalModal);
D.goalModal.addEventListener("click", (e) => { if (e.target === D.goalModal) closeGoalModal(); });

// ============================================================
// НЕЧЁТКИЙ ПОИСК
// ============================================================
function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}
function phonetic(s) {
  return s.toLowerCase()
    .replace(/[ъь]/g, "").replace(/ё/g, "е").replace(/й/g, "и")
    .replace(/[.,!?;:()"']/g, "").replace(/\s+/g, " ").trim();
}
function similarity(query, target) {
  const q = phonetic(query); const t = phonetic(target);
  if (!q || !t) return 0;
  if (t.includes(q)) return 1;
  const qw = q.split(/\s+/).filter(Boolean);
  const tw = t.split(/\s+/).filter(Boolean);
  if (!qw.length || !tw.length) return 0;
  let hits = 0;
  for (const w of qw) {
    let best = 0;
    for (const v of tw) {
      const dist = levenshtein(w, v);
      const maxLen = Math.max(w.length, v.length);
      const sim = 1 - dist / maxLen;
      if (sim > best) best = sim;
    }
    if (best >= 0.6) hits += best;
  }
  return hits / qw.length;
}
function smartFind(query, limit = 6) {
  const results = [];
  for (const s in data) {
    for (const t in data[s]) {
      for (const it of data[s][t]) {
        const titleScore = similarity(query, it.title) * 1.5;
        const descScore = similarity(query, it.desc || "") * 0.5;
        const subjectScore = similarity(query, s) * 0.8;
        const topicScore = similarity(query, t) * 0.8;
        const score = Math.max(titleScore, descScore, subjectScore, topicScore);
        if (score >= 0.55) results.push({ item: it, subject: s, topic: t, score });
      }
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU"; u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ============================================================
// ГОЛОСОВОЙ ПОИСК
// ============================================================
let voiceRecognition = null;
let voiceActive = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SR) {
  voiceRecognition = new SR();
  voiceRecognition.lang = "ru-RU";
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;
  voiceRecognition.maxAlternatives = 1;
  voiceRecognition.onstart = () => {
    voiceActive = true;
    D.searchMic.classList.add("is-listening");
    D.voiceOverlay.classList.add("is-visible");
    D.voiceText.textContent = "Слушаю…";
    speak("Слушаю");
  };
  voiceRecognition.onresult = (e) => {
    let interim = "", final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += transcript;
      else interim += transcript;
    }
    D.voiceText.textContent = final || interim || "Слушаю…";
    if (final) {
      const clean = final.trim();
      const smart = smartFind(clean, 6);
      if (smart.length) {
        const best = smart[0];
        D.voiceText.textContent = `Найдено: «${best.item.title}»`;
        setTimeout(() => {
          activeSubject = best.subject;
          activeTopic = best.topic;
          activeTitle = best.item.title;
          D.search.value = clean;
          showTab("formulas");
          renderNav(); updateSubjectColor(); applyFilter(); updateURL();
        }, 200);
      } else {
        D.voiceText.textContent = `Не нашёл по «${clean}».`;
        D.search.value = clean;
        applyFilter();
      }
    }
  };
  voiceRecognition.onerror = (e) => {
    if (e.error === "not-allowed") toast("Разрешите доступ к микрофону");
    else if (e.error === "no-speech") toast("Речь не распознана");
    stopVoice();
  };
  voiceRecognition.onend = () => {
    if (voiceActive) {
      setTimeout(() => {
        D.voiceOverlay.classList.remove("is-visible");
        D.searchMic.classList.remove("is-listening");
        voiceActive = false;
      }, 800);
    }
  };
}
function startVoice() {
  if (!voiceRecognition) { toast("Голосовой поиск не поддерживается"); return; }
  try { voiceRecognition.start(); } catch {}
}
function stopVoice() {
  if (voiceRecognition && voiceActive) { try { voiceRecognition.stop(); } catch {} }
  voiceActive = false;
  D.voiceOverlay.classList.remove("is-visible");
  D.searchMic.classList.remove("is-listening");
}
D.searchMic.addEventListener("click", () => { if (voiceActive) stopVoice(); else startVoice(); });
D.voiceStopBtn?.addEventListener("click", stopVoice);

// ============================================================
// КАРТОЧКА
// ============================================================
function levelTag(level) {
  if (!level) return "";
  const labels = { easy: "🟢 Базовый", medium: "🟡 Средний", hard: "🔴 Продвинутый" };
  const classes = { easy: "tag--easy", medium: "tag--medium", hard: "tag--hard" };
  return `<span class="tag ${classes[level] || ""}">${labels[level] || ""}</span>`;
}
function cardHTML(item, subject, topic) {
  const id = "f-" + Math.random().toString(36).slice(2, 9);
  const key = favKey(subject, topic, item.title);
  const isFav = favorites.has(key);
  const isLearned = learned.has(key);
  const isCompare = compareSet.has(key);
  let relatedHTML = "";
  if (item.related && item.related.length) {
    relatedHTML = `
      <div class="block">
        <button class="block__toggle" type="button">См. также</button>
        <div class="block__body">
          <div class="related">
            ${item.related.map((r) => `<button class="related__link" type="button" data-goto="${esc(r)}">${esc(r)}</button>`).join("")}
          </div>
        </div>
      </div>`;
  }
  let exampleHTML = "";
  if (item.example) {
    exampleHTML = `
      <div class="block">
        <button class="block__toggle" type="button">Пример</button>
        <div class="block__body"><div class="example">${esc(item.example)}</div></div>
      </div>`;
  }
  let calcHTML = "";
  if (item.calc) {
    calcHTML = `
      <div class="block" data-calc="${id}">
        <button class="block__toggle" type="button">Калькулятор</button>
        <div class="block__body">
          <div class="calc">
            ${item.calc.vars.map((vr) => `
              <div class="calc__row">
                <label for="${id}-${vr.v}">${esc(vr.label.split(",")[0])}</label>
                <input id="${id}-${vr.v}" type="text" inputmode="decimal" autocomplete="off"
                       placeholder="${esc(vr.label)}" data-var="${esc(vr.v)}">
              </div>`).join("")}
            <div class="calc__actions">
              <button class="btn is-active" type="button" data-calc-run="${id}">Вычислить</button>
            </div>
            <div class="calc__result" id="${id}-result"></div>
          </div>
        </div>
      </div>`;
  }
  return `
    <article class="card ${isLearned ? "is-learned" : ""} ${isCompare ? "is-selected" : ""}"
             id="${id}" data-key="${esc(key)}"
             data-formula="${esc(item.formula)}" data-card-title="${esc(item.title)}">
      <div class="card__head">
        <h3 class="card__title">${highlight(item.title)}</h3>
        <div class="card__actions">
          <button class="card__compare ${isCompare ? "is-active" : ""}" type="button" title="Сравнить">≡</button>
          <button class="card__learn ${isLearned ? "is-active" : ""}" type="button" title="Выучил">✓</button>
          <button class="card__star ${isFav ? "is-active" : ""}" type="button" title="В избранное">★</button>
          <button class="card__menu-btn" type="button" title="Ещё">⋯</button>
        </div>
      </div>
      <div class="card__formula" data-tex="${esc(item.formula)}"></div>
      <p class="card__desc">${highlight(item.desc)}</p>
      <div class="tags">
        <span class="tag tag--subject">${esc(subject)}</span>
        <span class="tag">${esc(topic)}</span>
        ${levelTag(item.level)}
      </div>
      ${exampleHTML}
      ${calcHTML}
      ${relatedHTML}
      <div class="card__menu" data-menu="${id}">
        <button data-copy-mode="latex" data-tex-src="${esc(item.formula)}">📋 LaTeX-код</button>
        <button data-copy-mode="text" data-tex-src="${esc(item.formula)}">📝 Текстом</button>
        <button data-copy-mode="png" data-tex-src="${esc(item.formula)}">🖼 Как PNG</button>
        <button data-copy-mode="mathml" data-tex-src="${esc(item.formula)}">📐 MathML</button>
        <button data-action="derive" data-card-key="${esc(key)}">🧩 Вывод формулы</button>
        <button data-action="solve" data-card-key="${esc(key)}">📖 Пошаговое решение</button>
        <button data-action="reverse" data-card-key="${esc(key)}">🔄 Как найти переменную</button>
        <button data-action="qr" data-card-key="${esc(key)}">📱 QR-код формулы</button>
        <button data-action="split" data-card-key="${esc(key)}">◫ Открыть в Split view</button>
      </div>
    </article>`;
}

// ============================================================
// ВИРТУАЛИЗАЦИЯ
// ============================================================
const VIRTUAL_THRESHOLD = 50;
const RENDER_BATCH = 12;
let virtualObserver = null;
function destroyVirtual() {
  if (virtualObserver) { virtualObserver.disconnect(); virtualObserver = null; }
}
function setupVirtual(allItems) {
  destroyVirtual();
  if (allItems.length <= VIRTUAL_THRESHOLD) return null;
  const allFlat = allItems.slice();
  let rendered = 0;
  const container = document.createElement("div");
  const sentinel = document.createElement("div");
  D.list.innerHTML = "";
  D.list.appendChild(container);
  appendBatch(Math.min(RENDER_BATCH, allFlat.length));
  sentinel.style.height = "1px";
  D.list.appendChild(sentinel);
  function appendBatch(count) {
    const end = Math.min(rendered + count, allFlat.length);
    const slice = allFlat.slice(rendered, end);
    const html = slice.map(({ item, subject, topic }) => cardHTML(item, subject, topic)).join("");
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    while (tmp.firstChild) container.appendChild(tmp.firstChild);
    rendered = end;
    bindCardEvents(container);
    renderMathIn(container);
  }
  virtualObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && rendered < allFlat.length) appendBatch(RENDER_BATCH);
    });
  }, { rootMargin: "400px" });
  virtualObserver.observe(sentinel);
}

// ============================================================
// РЕНДЕР СПИСКА
// ============================================================
function buildSections(items) {
  const grouped = {};
  items.forEach(({ item, subject, topic }) => {
    if (!grouped[subject]) grouped[subject] = {};
    if (!grouped[subject][topic]) grouped[subject][topic] = [];
    grouped[subject][topic].push(item);
  });
  let html = "";
  for (const subject in grouped) {
    for (const topic in grouped[subject]) {
      const arr = grouped[subject][topic];
      html += `<h2 class="topic-title">${esc(subject)} · ${esc(topic)}</h2>`;
      html += `<p class="topic-count">${arr.length} формул</p>`;
      html += `<div class="list ${viewMode === "rows" ? "list--rows" : ""}">${arr.map((it) => cardHTML(it, subject, topic)).join("")}</div>`;
    }
  }
  return html;
}

// ============================================================
// ПОИСК
// ============================================================
function matchQuery(item, subject, topic, q) {
  const hay = [item.title, item.formula, item.desc, subject, topic].join(" ").toLowerCase();
  if (hay.includes(q)) return true;
  const words = q.split(/\s+/);
  for (const w of words) {
    if (!w) continue;
    const syn = synonyms[w];
    if (syn) { for (const s of syn) if (hay.includes(s)) return true; }
    for (const key in synonyms) {
      if (hay.includes(key) && synonyms[key].some(s => s.includes(w))) return true;
    }
  }
  return false;
}
function collectItems() {
  const q = D.search.value.trim().toLowerCase();
  currentQuery = q;
  const collected = [];
  for (const subject in data) {
    if (activeSubject && subject !== activeSubject) continue;
    for (const topic in data[subject]) {
      if (activeTopic && topic !== activeTopic) continue;
      for (const item of data[subject][topic]) {
        const key = favKey(subject, topic, item.title);
        if (learnFilter === "notlearned" && learned.has(key)) continue;
        if (activeChips.has("fav") && !favorites.has(key)) continue;
        if (activeChips.has("learned") && !learned.has(key)) continue;
        if (activeChips.has("easy") && item.level !== "easy") continue;
        if (activeChips.has("medium") && item.level !== "medium") continue;
        if (activeChips.has("hard") && item.level !== "hard") continue;
        if (q && !matchQuery(item, subject, topic, q)) continue;
        collected.push({ item, subject, topic });
      }
    }
  }
  return collected;
}
function applyFilter() {
  destroyVirtual();
  const collected = collectItems();
  if (sortMode === "alpha") {
    collected.sort((a, b) => a.item.title.localeCompare(b.item.title, "ru"));
    D.list.innerHTML = `
      <p class="topic-count">${collected.length} формул · по алфавиту</p>
      <div class="list ${viewMode === "rows" ? "list--rows" : ""}">
        ${collected.map(({ item, subject, topic }) => cardHTML(item, subject, topic)).join("")}
      </div>`;
    bindCardEvents(D.list);
    renderMathIn(D.list);
  } else {
    const virtual = setupVirtual(collected);
    if (!virtual) {
      D.list.innerHTML = buildSections(collected);
      bindCardEvents(D.list);
      renderMathIn(D.list);
    }
  }
  D.empty.hidden = collected.length > 0;
  if (!activeSubject) D.contentTitle.textContent = "Все формулы";
  else if (!activeTopic) D.contentTitle.textContent = activeSubject;
  else D.contentTitle.textContent = activeSubject + " · " + activeTopic;
  D.contentSubtitle.textContent = `Найдено: ${collected.length} из ${totalCount()}`;
  renderBreadcrumbs();
  updateCompareBar();
}

// ============================================================
// ИЗБРАННОЕ
// ============================================================
function renderFavorites() {
  const collected = [];
  for (const subject in data) {
    for (const topic in data[subject]) {
      for (const item of data[subject][topic]) {
        const key = favKey(subject, topic, item.title);
        if (favorites.has(key)) collected.push({ item, subject, topic });
      }
    }
  }
  D.favSubtitle.textContent = `${collected.length} формул`;
  D.favEmpty.hidden = collected.length > 0;
  const q = D.search.value.trim().toLowerCase();
  currentQuery = q;
  const filtered = q
    ? collected.filter(({ item, subject, topic }) => matchQuery(item, subject, topic, q))
    : collected;
  D.favList.innerHTML = `
    <div class="list ${viewMode === "rows" ? "list--rows" : ""}">
      ${filtered.map(({ item, subject, topic }) => cardHTML(item, subject, topic)).join("")}
    </div>`;
  renderBreadcrumbs();
  bindCardEvents(D.favList);
  renderMathIn(D.favList);
}

// ============================================================
// КОПИРОВАНИЕ
// ============================================================
function texToPlain(tex) {
  return tex
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
    .replace(/\\cdot/g, "·").replace(/\\times/g, "×").replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±").replace(/\\mp/g, "∓")
    .replace(/\\sin/g, "sin").replace(/\\cos/g, "cos").replace(/\\tan/g, "tg")
    .replace(/\\ln/g, "ln").replace(/\\lg/g, "lg").replace(/\\log/g, "log")
    .replace(/\\pi/g, "π").replace(/\\alpha/g, "α").replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ").replace(/\\delta/g, "δ").replace(/\\Delta/g, "Δ")
    .replace(/\\varepsilon/g, "ε").replace(/\\varphi/g, "φ").replace(/\\omega/g, "ω")
    .replace(/\\lambda/g, "λ").replace(/\\mu/g, "μ").replace(/\\nu/g, "ν")
    .replace(/\\rho/g, "ρ").replace(/\\sigma/g, "σ").replace(/\\tau/g, "τ")
    .replace(/\\Phi/g, "Φ").replace(/\\Omega/g, "Ω")
    .replace(/\\to/g, "→").replace(/\\leftrightarrow/g, "↔")
    .replace(/\\land/g, "∧").replace(/\\lor/g, "∨").replace(/\\lnot/g, "¬")
    .replace(/\\oplus/g, "⊕").replace(/\\approx/g, "≈").replace(/\\sim/g, "~")
    .replace(/\\le/g, "≤").replace(/\\ge/g, "≥").replace(/\\ne/g, "≠")
    .replace(/\\infty/g, "∞").replace(/\\sum/g, "Σ").replace(/\\int/g, "∫")
    .replace(/\\xrightarrow\{([^}]*)\}/g, "→($1)")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\left[()\[\]|]/g, "").replace(/\\right[()\[\]|]/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ").trim();
}
function copyTexToCanvas(tex, item) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const scale = 3;
    canvas.width = 800 * scale;
    canvas.height = 160 * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    ctx.fillStyle = isDark ? "#161a23" : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const html = isKatexReady()
      ? window.katex.renderToString(tex, { throwOnError: false, displayMode: false })
      : `<span>${tex}</span>`;
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      font-size: 40px; padding: 30px 40px; color: ${isDark ? "#7c9cff" : "#4f46e5"};
      font-family: 'Cambria Math', Georgia, serif;
      display: flex; align-items: center; height: 100%; box-sizing: border-box;">
      ${html}
    </div>
  </foreignObject>
</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 800, 160);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return reject("toBlob failed");
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])
              .then(resolve).catch(() => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(pngBlob);
                a.download = (item ? item.title : "formula") + ".png";
                a.click(); resolve();
              });
          } catch { reject("clipboard failed"); }
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(pngBlob);
          a.download = (item ? item.title : "formula") + ".png";
          a.click(); resolve();
        }
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject("img failed"); };
    img.src = url;
  });
}
async function handleCopy(mode, tex, item) {
  try {
    if (mode === "latex") { await navigator.clipboard.writeText(tex); toast("LaTeX скопирован"); SFX.copy(); }
    else if (mode === "text") { await navigator.clipboard.writeText(texToPlain(tex)); toast("Текст скопирован"); SFX.copy(); }
    else if (mode === "png") { await copyTexToCanvas(tex, item); toast("PNG скопирован или скачан"); SFX.copy(); }
    else if (mode === "mathml") {
      if (isKatexReady()) {
        try {
          const mml = window.katex.renderToString(tex, { output: "mathml", throwOnError: false });
          await navigator.clipboard.writeText(mml);
          toast("MathML скопирован");
          SFX.copy();
        } catch {
          await navigator.clipboard.writeText(tex);
          toast("Скопирован LaTeX");
          SFX.copy();
        }
      } else {
        await navigator.clipboard.writeText(tex);
        toast("Скопирован LaTeX");
        SFX.copy();
      }
    }
  } catch { toast("Ошибка копирования"); }
}

// ============================================================
// СОБЫТИЯ КАРТОЧЕК
// ============================================================
function bindCardEvents(root) {
  root.querySelectorAll(".block__toggle:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => { e.stopPropagation(); btn.closest(".block").classList.toggle("is-open"); });
  });
  root.querySelectorAll(".card__menu-btn:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".card");
      const menu = card.querySelector(".card__menu");
      const open = menu.classList.contains("is-open");
      document.querySelectorAll(".card__menu.is-open").forEach(m => m.classList.remove("is-open"));
      if (!open) menu.classList.add("is-open");
    });
  });
  root.querySelectorAll("[data-copy-mode]:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".card");
      const item = findFormulaByTitle(card.dataset.cardTitle)?.item;
      await handleCopy(btn.dataset.copyMode, btn.dataset.texSrc, item);
      card.querySelector(".card__menu").classList.remove("is-open");
    });
  });
  root.querySelectorAll("[data-action]:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".card");
      const key = btn.dataset.cardKey;
      card.querySelector(".card__menu").classList.remove("is-open");
      if (btn.dataset.action === "solve") openSolveModal(key);
      else if (btn.dataset.action === "reverse") openReverseModal(key);
      else if (btn.dataset.action === "qr") openQrModal(key);
      else if (btn.dataset.action === "derive") openDeriveModal(key);
      else if (btn.dataset.action === "split") openSplitPane(key);
    });
  });
  root.querySelectorAll(".card__star:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".card");
      const key = card.dataset.key;
      if (favorites.has(key)) favorites.delete(key); else favorites.add(key);
      saveSet(STORAGE.fav, favorites);
      btn.classList.toggle("is-active", favorites.has(key));
      renderNav();
      if (!D.viewFav.hidden) renderFavorites();
    });
  });
  root.querySelectorAll(".card__learn:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".card");
      const key = card.dataset.key;
      if (learned.has(key)) learned.delete(key); else learned.add(key);
      saveSet(STORAGE.learned, learned);
      btn.classList.toggle("is-active", learned.has(key));
      card.classList.toggle("is-learned", learned.has(key));
      renderNav();
      if (learnFilter === "notlearned") applyFilter();
    });
  });
  root.querySelectorAll(".card__compare:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".card");
      toggleCompare(card.dataset.key);
    });
  });
  root.querySelectorAll("[data-goto]:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const found = findFormulaByTitle(btn.dataset.goto);
      if (!found) return;
      activeSubject = found.subject;
      activeTopic = found.topic;
      activeTitle = found.item.title;
      D.search.value = "";
      currentQuery = "";
      showTab("formulas"); renderNav(); updateSubjectColor(); applyFilter(); updateURL();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  root.querySelectorAll("[data-calc-run]:not([data-bound])").forEach((btn) => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.calcRun;
      const block = document.querySelector(`[data-calc="${id}"]`);
      if (!block) return;
      const card = block.closest(".card");
      const found = findFormulaByTitle(card.dataset.cardTitle);
      if (!found || !found.item.calc) return;
      const inputs = block.querySelectorAll("input[data-var]");
      const values = {};
      let ok = true;
      inputs.forEach((inp) => {
        const val = parseFloat(inp.value.replace(",", "."));
        if (Number.isNaN(val)) ok = false;
        values[inp.dataset.var] = val;
      });
      const resultEl = document.getElementById(id + "-result");
      if (!ok) { resultEl.textContent = "Заполните все поля"; SFX.error(); return; }
      try {
        const res = found.item.calc.expr(values);
        const unit = found.item.calc.unit ? " " + found.item.calc.unit : "";
        resultEl.textContent = "Результат: " + (typeof res === "number" ? (+res).toPrecision(6) : res) + unit;
        SFX.success();
      } catch { resultEl.textContent = "Ошибка вычисления"; SFX.error(); }
    });
  });
  root.querySelectorAll(".card:not([data-bound])").forEach((card) => {
    card.dataset.bound = "1";
    card.addEventListener("click", async (e) => {
      if (e.target.closest("input, button, a, .block, .card__menu")) return;
      const found = findFormulaByTitle(card.dataset.cardTitle);
      if (!found) return;
      activeTitle = found.item.title;
      updateURL();
      try { await navigator.clipboard.writeText(card.dataset.formula); toast("LaTeX скопирован"); SFX.copy(); } catch {}
    });
  });
}

// ============================================================
// СРАВНЕНИЕ
// ============================================================
function getCompareItem(key) {
  const parts = key.split("||");
  const found = findFormulaByTitle(parts[2]);
  if (!found) return null;
  return { item: found.item, subject: parts[0], topic: parts[1], key };
}
function updateCompareBar() {
  const n = compareSet.size;
  if (n === 0) { D.compareBar.classList.remove("is-visible"); return; }
  D.compareBar.classList.add("is-visible");
  D.compareCount.textContent = `Выбрано: ${n}`;
  const titles = [...compareSet].map(k => k.split("||")[2]).slice(0, 3).join(", ");
  D.compareTitles.textContent = n > 3 ? titles + "…" : titles;
}
function toggleCompare(key) {
  if (compareSet.has(key)) compareSet.delete(key);
  else {
    if (compareSet.size >= 4) { toast("Максимум 4 формулы"); SFX.error(); return; }
    compareSet.add(key);
  }
  saveSet(STORAGE.compare, compareSet);
  updateCompareBar();
  document.querySelectorAll(`.card[data-key]`).forEach(card => {
    card.classList.toggle("is-selected", compareSet.has(card.dataset.key));
    const btn = card.querySelector(".card__compare");
    if (btn) btn.classList.toggle("is-active", compareSet.has(card.dataset.key));
  });
}
function openCompareModal() {
  if (compareSet.size < 2) { toast("Выберите минимум 2 формулы"); SFX.error(); return; }
  const items = [...compareSet].map(getCompareItem).filter(Boolean);
  D.compareGrid.innerHTML = items.map(({ item, subject, topic, key }) => {
    const id = "cmp-" + Math.random().toString(36).slice(2, 7);
    let calcHTML = "";
    if (item.calc) {
      calcHTML = `
        <div class="compare-col__section">
          <div class="compare-col__section-label">Калькулятор</div>
          <div class="compare-col__calc" data-calc-compare="${id}">
            ${item.calc.vars.map(vr => `
              <input type="text" inputmode="decimal" placeholder="${esc(vr.label)}" data-var="${esc(vr.v)}">
            `).join("")}
            <button type="button" data-calc-run="${id}">Вычислить</button>
            <div class="compare-col__calc-result" id="${id}-result"></div>
          </div>
        </div>`;
    }
    return `
      <div class="compare-col" data-cmp-key="${esc(key)}">
        <div class="compare-col__head">
          <h3 class="compare-col__title">${esc(item.title)}</h3>
          <button class="compare-col__remove" type="button" data-cmp-remove="${esc(key)}" title="Убрать">✕</button>
        </div>
        <div class="compare-col__formula" data-tex="${esc(item.formula)}"></div>
        <div class="compare-col__desc">${esc(item.desc)}</div>
        ${item.example ? `
          <div class="compare-col__section">
            <div class="compare-col__section-label">Пример</div>
            <div class="compare-col__section-value">${esc(item.example)}</div>
          </div>` : ""}
        ${calcHTML}
        <div class="compare-col__section">
          <div class="compare-col__section-label">Раздел</div>
          <div class="compare-col__section-value">${esc(subject)} · ${esc(topic)}</div>
        </div>
      </div>`;
  }).join("");

  D.compareModal.classList.add("is-visible");
  document.body.style.overflow = "hidden";
  renderMathIn(D.compareGrid);
  SFX.open();

  D.compareGrid.querySelectorAll("[data-cmp-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleCompare(btn.dataset.cmpRemove);
      if (compareSet.size < 2) closeCompareModal();
      else openCompareModal();
    });
  });
  D.compareGrid.querySelectorAll("[data-calc-run]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.calcRun;
      const block = D.compareGrid.querySelector(`[data-calc-compare="${id}"]`);
      if (!block) return;
      const col = block.closest(".compare-col");
      const ci = getCompareItem(col.dataset.cmpKey);
      if (!ci || !ci.item.calc) return;
      const inputs = block.querySelectorAll("input[data-var]");
      const values = {};
      let ok = true;
      inputs.forEach(inp => {
        const val = parseFloat(inp.value.replace(",", "."));
        if (Number.isNaN(val)) ok = false;
        values[inp.dataset.var] = val;
      });
      const resultEl = document.getElementById(id + "-result");
      if (!ok) { resultEl.textContent = "Заполните все поля"; SFX.error(); return; }
      try {
        const res = ci.item.calc.expr(values);
        const unit = ci.item.calc.unit ? " " + ci.item.calc.unit : "";
        resultEl.textContent = "= " + (typeof res === "number" ? (+res).toPrecision(6) : res) + unit;
        SFX.success();
      } catch { resultEl.textContent = "Ошибка"; SFX.error(); }
    });
  });
}
function closeCompareModal() {
  D.compareModal.classList.remove("is-visible");
  document.body.style.overflow = "";
}
D.compareOpen.addEventListener("click", openCompareModal);
D.compareClear.addEventListener("click", () => {
  compareSet.clear();
  saveSet(STORAGE.compare, compareSet);
  updateCompareBar();
  document.querySelectorAll(".card.is-selected").forEach(c => {
    c.classList.remove("is-selected");
    const b = c.querySelector(".card__compare");
    if (b) b.classList.remove("is-active");
  });
});
D.compareModalClose.addEventListener("click", closeCompareModal);
D.compareModal.addEventListener("click", (e) => { if (e.target === D.compareModal) closeCompareModal(); });

// ============================================================
// ВКЛАДКИ
// ============================================================
function showTab(which) {
  currentTab = which;
  const tabs = {
    catalog:  D.tabAll,
    formulas: D.tabFormulas,
    ref:      D.tabRef,
    terms:    D.tabTerms,
    fav:      D.tabFav,
    flash:    D.tabFlash
  };
  for (const key in tabs) {
    const el = tabs[key];
    if (el) el.classList.toggle("is-active", key === which);
  }
  D.viewCatalog.hidden  = which !== "catalog";
  D.viewFormulas.hidden = which !== "formulas";
  D.viewRef.hidden      = which !== "ref";
  D.viewTerms.hidden    = which !== "terms";
  D.viewFav.hidden      = which !== "fav";
  D.viewFlash.hidden    = which !== "flash";
  D.sidebar.style.display =
    (which === "catalog" || which === "formulas" || which === "fav") ? "" : "none";
}

D.tabAll.addEventListener("click", () => {
  activeSubject = null; activeTopic = null; activeTitle = null;
  D.search.value = ""; currentQuery = "";
  activeChips.clear();
  document.querySelectorAll("[data-chip]").forEach(b => b.classList.remove("is-active"));
  showTab("catalog");
  renderCatalog();
  renderNav();
  updateSubjectColor();
  location.hash = "#/catalog";
  window.scrollTo({ top: 0, behavior: "smooth" });
});
D.tabFormulas.addEventListener("click", () => {
  activeSubject = null; activeTopic = null; activeTitle = null;
  D.search.value = ""; currentQuery = "";
  showTab("formulas");
  renderNav();
  updateSubjectColor();
  applyFilter();
  location.hash = "#/";
});
D.tabRef.addEventListener("click", () => showTab("ref"));
D.tabTerms.addEventListener("click", () => showTab("terms"));
D.tabFav.addEventListener("click", () => {
  showTab("fav");
  renderFavorites();
  location.hash = "#/favorites";
});
D.tabFlash.addEventListener("click", () => {
  showTab("flash");
  startTraining();
});
D.logo.addEventListener("click", (e) => {
  e.preventDefault();
  activeSubject = null; activeTopic = null; activeTitle = null;
  showTab("catalog");
  renderCatalog();
  renderNav();
  updateSubjectColor();
  location.hash = "#/catalog";
});

document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    viewMode = btn.dataset.view;
    document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("is-active", b === btn));
    if (!D.viewFav.hidden) renderFavorites(); else applyFilter();
  });
});
document.querySelectorAll("[data-sort]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sortMode = btn.dataset.sort;
    document.querySelectorAll("[data-sort]").forEach((b) => b.classList.toggle("is-active", b === btn));
    if (!D.viewFav.hidden) renderFavorites(); else applyFilter();
  });
});
document.querySelectorAll("[data-learn]").forEach((btn) => {
  btn.addEventListener("click", () => {
    learnFilter = btn.dataset.learn;
    document.querySelectorAll("[data-learn]").forEach((b) => b.classList.toggle("is-active", b === btn));
    applyFilter();
  });
});
document.querySelectorAll("[data-chip]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const c = btn.dataset.chip;
    if (activeChips.has(c)) { activeChips.delete(c); btn.classList.remove("is-active"); }
    else { activeChips.add(c); btn.classList.add("is-active"); }
    if (!D.viewFav.hidden) renderFavorites(); else applyFilter();
  });
});

// ============================================================
// АВТОДОПОЛНЕНИЕ
// ============================================================
let suggestIndex = -1;
function buildSuggestions(q) {
  if (!q || q.length < 2) return [];
  const lower = q.toLowerCase();
  const out = [];
  for (const s in data) {
    for (const t in data[s]) {
      for (const it of data[s][t]) {
        if (it.title.toLowerCase().includes(lower) || matchQuery(it, s, t, lower)) {
          out.push({ title: it.title, subject: s, topic: t });
        }
        if (out.length >= 6) return out;
      }
    }
  }
  return out;
}
function showSuggestions(q) {
  const list = buildSuggestions(q);
  if (!list.length) { D.suggest.classList.remove("is-visible"); suggestIndex = -1; return; }
  D.suggest.innerHTML = list.map((s, i) =>
    `<button class="suggest__item" type="button" data-s-title="${esc(s.title)}" data-s-index="${i}">
      ${esc(s.title)}<span class="suggest__subject">${esc(s.subject)} · ${esc(s.topic)}</span>
    </button>`).join("");
  D.suggest.classList.add("is-visible");
  suggestIndex = -1;
  D.suggest.querySelectorAll(".suggest__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const found = findFormulaByTitle(btn.dataset.sTitle);
      if (!found) return;
      activeSubject = found.subject;
      activeTopic = found.topic;
      activeTitle = found.item.title;
      D.search.value = "";
      currentQuery = "";
      D.suggest.classList.remove("is-visible");
      showTab("formulas"); renderNav(); updateSubjectColor(); applyFilter(); updateURL();
    });
  });
}
function moveSuggest(dir) {
  const items = D.suggest.querySelectorAll(".suggest__item");
  if (!items.length) return;
  suggestIndex = (suggestIndex + dir + items.length) % items.length;
  items.forEach((el, i) => el.classList.toggle("is-active", i === suggestIndex));
  items[suggestIndex].scrollIntoView({ block: "nearest" });
}
function pickSuggest() {
  const items = D.suggest.querySelectorAll(".suggest__item");
  if (suggestIndex >= 0 && items[suggestIndex]) items[suggestIndex].click();
  else if (items.length) items[0].click();
}
let suggestTimer = null;
D.search.addEventListener("input", () => {
  clearTimeout(suggestTimer);
  const q = D.search.value.trim();
  suggestTimer = setTimeout(() => showSuggestions(q), 150);
  if (!D.viewFav.hidden) renderFavorites();
  else if (!D.viewFlash.hidden) {}
  else if (!D.viewCatalog.hidden) {}
  else applyFilter();
});
D.search.addEventListener("blur", () => {
  setTimeout(() => D.suggest.classList.remove("is-visible"), 200);
});
D.search.addEventListener("focus", () => {
  if (D.search.value.trim().length >= 2) showSuggestions(D.search.value.trim());
});

// ============================================================
// ТРЕНИРОВКА
// ============================================================
let trainMode = "flash";
let trainList = [];
let trainIndex = 0;
let trainShown = false;
let quizScore = 0;
let quizAnswered = false;

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    trainMode = btn.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
    D.flashBox.hidden = trainMode !== "flash";
    D.quizBox.hidden = trainMode !== "quiz";
    startTraining();
  });
});
function buildTrainList() {
  const list = [];
  for (const subject in data) {
    if (activeSubject && subject !== activeSubject) continue;
    for (const topic in data[subject]) {
      if (activeTopic && topic !== activeTopic) continue;
      for (const item of data[subject][topic]) list.push({ item, subject, topic });
    }
  }
  return list;
}
function startTraining() {
  trainList = buildTrainList();
  trainIndex = 0;
  trainShown = false;
  quizScore = 0;
  quizAnswered = false;
  D.flashSubtitle.textContent = activeSubject
    ? (activeTopic ? activeSubject + " · " + activeTopic : activeSubject)
    : "Все формулы";
  if (trainMode === "flash") renderFlashCard();
  else renderQuizQuestion();
}
function renderFlashCard() {
  if (!trainList.length) {
    D.flashTitle.textContent = "Нет формул для тренировки";
    D.flashAnswer.hidden = true; D.flashAnswer.dataset.tex = ""; D.flashAnswer.textContent = "";
    D.flashDesc.hidden = true; D.flashProgress.textContent = ""; D.flashStats.textContent = "";
    return;
  }
  if (trainIndex >= trainList.length) trainIndex = 0;
  const { item, subject, topic } = trainList[trainIndex];
  D.flashProgress.textContent = `${trainIndex + 1} / ${trainList.length}`;
  D.flashTitle.textContent = item.title;
  D.flashAnswer.dataset.tex = ""; D.flashAnswer.dataset.rendered = ""; D.flashAnswer.textContent = "";
  D.flashAnswer.hidden = true; D.flashDesc.hidden = true;
  D.flashShow.hidden = false; D.flashNext.hidden = true;
  D.flashStats.textContent = `${subject} · ${topic}`;
  trainShown = false;
}
D.flashShow.addEventListener("click", () => {
  if (!trainList.length) return;
  const { item } = trainList[trainIndex];
  D.flashAnswer.dataset.tex = item.formula;
  D.flashAnswer.dataset.rendered = "";
  D.flashAnswer.textContent = "";
  D.flashAnswer.hidden = false;
  D.flashDesc.textContent = item.desc;
  D.flashDesc.hidden = false;
  D.flashShow.hidden = true;
  D.flashNext.hidden = false;
  trainShown = true;
  renderMathIn(D.flashAnswer.parentElement);
  SFX.whoosh();
});
D.flashNext.addEventListener("click", () => {
  trainIndex++;
  if (trainIndex >= trainList.length) trainIndex = 0;
  renderFlashCard();
});
D.flashRestart.addEventListener("click", () => { trainIndex = 0; renderFlashCard(); });

function renderQuizQuestion() {
  if (!trainList.length) {
    D.quizQuestion.textContent = "Нет формул для викторины";
    D.quizOptions.innerHTML = ""; D.quizStats.textContent = "";
    return;
  }
  if (trainIndex >= trainList.length) {
    D.quizQuestion.textContent = "Готово!";
    D.quizOptions.innerHTML = "";
    D.quizStats.textContent = `Правильных ответов: ${quizScore} из ${trainList.length}`;
    return;
  }
  const { item, subject, topic } = trainList[trainIndex];
  D.quizQuestion.innerHTML = `<div>Что это за формула?</div>`;
  const mathEl = document.createElement("div");
  mathEl.style.marginTop = "12px";
  mathEl.dataset.tex = item.formula;
  D.quizQuestion.appendChild(mathEl);
  renderMathIn(D.quizQuestion);
  const pool = [];
  for (const s in data) {
    for (const t in data[s]) {
      for (const it of data[s][t]) if (it.title !== item.title) pool.push(it.title);
    }
  }
  const options = [item.title];
  while (options.length < 4 && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const title = pool.splice(idx, 1)[0];
    if (!options.includes(title)) options.push(title);
  }
  options.sort(() => Math.random() - 0.5);
  D.quizOptions.innerHTML = options
    .map((t) => `<button class="quiz-opt" type="button" data-answer="${esc(t)}">${esc(t)}</button>`)
    .join("");
  D.quizStats.textContent = `Вопрос ${trainIndex + 1} из ${trainList.length} · правильных: ${quizScore}`;
  quizAnswered = false;
  D.quizOptions.querySelectorAll(".quiz-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (quizAnswered) return;
      quizAnswered = true;
      const correct = btn.dataset.answer === item.title;
      if (correct) {
        quizScore++;
        btn.classList.add("is-correct");
        SFX.success();
        // ⭐ Отмечаем формулу выученной
        const key = favKey(subject, topic, item.title);
        if (!learned.has(key)) {
          learned.add(key);
          saveSet(STORAGE.learned, learned);
          renderNav();
        }
      } else {
        btn.classList.add("is-wrong");
        SFX.error();
        D.quizOptions.querySelectorAll(".quiz-opt").forEach((b) => {
          if (b.dataset.answer === item.title) b.classList.add("is-correct");
        });
      }
      D.quizStats.textContent = `Вопрос ${trainIndex + 1} из ${trainList.length} · правильных: ${quizScore}`;
      setTimeout(() => { trainIndex++; renderQuizQuestion(); }, 900);
    });
  });
}
D.quizRestart.addEventListener("click", () => { trainIndex = 0; quizScore = 0; renderQuizQuestion(); });

// ============================================================
// САЙДБАР / СКРОЛЛ / КЛАВИШИ
// ============================================================
function openSidebar() { D.sidebar.classList.add("is-open"); D.backdrop.classList.add("is-visible"); }
function closeSidebar() { D.sidebar.classList.remove("is-open"); D.backdrop.classList.remove("is-visible"); }
D.burger.addEventListener("click", () => {
  if (D.sidebar.classList.contains("is-open")) closeSidebar(); else openSidebar();
});
D.backdrop.addEventListener("click", closeSidebar);

window.addEventListener("scroll", () => {
  D.toTop.classList.toggle("is-visible", window.scrollY > 400);
}, { passive: true });
D.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

document.addEventListener("click", (e) => {
  if (!e.target.closest(".card__menu") && !e.target.closest(".card__menu-btn")) {
    document.querySelectorAll(".card__menu.is-open").forEach(m => m.classList.remove("is-open"));
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== D.search) { e.preventDefault(); D.search.focus(); }
  if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); history.back(); }
  if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); history.forward(); }
  if (document.activeElement === D.search && D.suggest.classList.contains("is-visible")) {
    if (e.key === "ArrowDown") { e.preventDefault(); moveSuggest(1); }
    if (e.key === "ArrowUp") { e.preventDefault(); moveSuggest(-1); }
    if (e.key === "Enter") { e.preventDefault(); pickSuggest(); }
  }
  if (e.key === "Escape") {
    if (document.activeElement === D.search) {
      D.search.value = ""; currentQuery = ""; applyFilter(); D.search.blur();
    }
    D.suggest.classList.remove("is-visible");
    if (D.compareModal.classList.contains("is-visible")) closeCompareModal();
    if (D.solveModal.classList.contains("is-visible")) closeSolveModal();
    if (D.qrModal.classList.contains("is-visible")) closeQrModal();
    if (D.reverseModal.classList.contains("is-visible")) closeReverseModal();
    if (D.deriveModal.classList.contains("is-visible")) closeDeriveModal();
    if (D.goalModal.classList.contains("is-visible")) closeGoalModal();
    if (voiceActive) stopVoice();
  }
  if (!D.viewFlash.hidden && !D.flashBox.hidden) {
    if (e.key === " " && !trainShown) { e.preventDefault(); D.flashShow.click(); }
    if (e.key === "ArrowRight" && trainShown) { e.preventDefault(); D.flashNext.click(); }
  }
});

// ============================================================
// СТАРТ
// ============================================================
function init() {
  favorites = loadSet(STORAGE.fav);
  learned = loadSet(STORAGE.learned);
  compareSet = loadSet(STORAGE.compare);
  expandedSubjects = new Set(Object.keys(data));
  expandAllMode = true;
  initTheme();
  initFontSize();
  initSidebar();
  initSound();
  initDevice();
  renderReference();
  renderTerms();
  updateCompareBar();
  updateStreak();

  const parsed = parseHash();
  if (parsed.catalog) {
    activeSubject = null; activeTopic = null; activeTitle = null;
    renderNav();
    showTab("catalog");
    renderCatalog();
  } else if (parsed.favorites) {
    activeSubject = null; activeTopic = null; activeTitle = null;
    renderNav();
    showTab("fav");
    renderFavorites();
  } else if (parsed.subject || parsed.topic) {
    activeSubject = parsed.subject;
    activeTopic = parsed.topic;
    activeTitle = parsed.title;
    renderNav();
    updateSubjectColor();
    showTab("formulas");
    applyFilter();
  } else {
    activeSubject = null; activeTopic = null; activeTitle = null;
    renderNav();
    showTab("catalog");
    renderCatalog();
  }

  if (!location.hash) location.hash = "#/catalog";

  if (isKatexReady()) {
    KATEX_OK = true;
    rerenderAllKatex();
  } else {
    window.addEventListener("load", rerenderAllKatex);
    setTimeout(rerenderAllKatex, 1000);
    setTimeout(rerenderAllKatex, 2500);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}