import "./styles.css";
import { t, getLang, setLang, LANGUAGES, getContent } from "./i18n.js";

// ── Locale data ──────────────────────────────────────────────────────────────
let appData = getContent().appData;
let SOUNDTRACK = getContent().soundtrack;

const screenEl = document.getElementById("screen");
const sidebarEl = document.getElementById("sidebar");

// Solo los IDs son estables; las etiquetas mostradas se traducen con t() en
// tiempo de render (provincias.<id> / gremios.<id> en los .json de i18n).
const FILTER_OPTIONS = {
  provincias: ["hermanos_de_las_cenizas"],
  gremios: ["escenario_1", "escenario_2", "escenario_3"]
};

const provinciaLabel = (id) => t(`provincias.${id}`);
const gremioLabel = (id) => t(`gremios.${id}`);

function trackAudioPlay(node) {
  if (!node || typeof gtag !== "function") return;
  const provincia = node.tags?.provincia ? provinciaLabel(node.tags.provincia) : "—";
  const gremio   = node.tags?.gremio   ? gremioLabel(node.tags.gremio)   : "—";
  const audioName = node.audioSrc
    ? node.audioSrc.split("/").pop().replace(/\.[^.]+$/, "")
    : "—";
  gtag("event", "audio_play", {
    event_category: "audio",
    campana:   provincia,
    escenario: gremio,
    panel:     node.title || "—",
    audio:     audioName,
  });
}

// Imagen de cabecera de la landing. Pon "" para volver al placeholder "ASSET HERE".
const WELCOME_BANNER_SRC = "";

// Email de contacto que aparece en el pie de la landing.
const CONTACT_EMAIL = "overmalo@gmail.com";

// ── SVG Icons ────────────────────────────────────────────────────────────────
const ICONS = {
  // Media controls
  play:          `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 14,8"/></svg>`,
  pause:         `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="4" height="14"/><rect x="10" y="1" width="4" height="14"/></svg>`,
  prev:          `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="3" height="14"/><polygon points="13,1 13,15 4,8"/></svg>`,
  next:          `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 12,8"/><rect x="12" y="1" width="3" height="14"/></svg>`,
  musicNote:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 13V4h8v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="13" r="2.5"/><circle cx="13" cy="12" r="2.5"/></svg>`,
  speaker:       `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="1,5 4.5,5 8,2 8,14 4.5,11 1,11"/><path d="M10 5.5a4.5 4.5 0 0 1 0 5M12 3.5a7 7 0 0 1 0 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  // UI controls
  close:         `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/></svg>`,
  caretDown:     `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,4 14,4 8,12"/></svg>`,
  caretUp:       `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,12 14,12 8,4"/></svg>`,
  globe:         `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="3" ry="6.5"/><line x1="1.5" y1="8" x2="14.5" y2="8"/><line x1="2.5" y1="5" x2="13.5" y2="5"/><line x1="2.5" y1="11" x2="13.5" y2="11"/></svg>`,
  // State indicators
  diamondFilled: `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="8,1 15,8 8,15 1,8"/></svg>`,
  diamondEmpty:  `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="8,1 15,8 8,15 1,8"/></svg>`,
  boxFilled:     `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1"/></svg>`,
  boxEmpty:      `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1"/></svg>`,
  dotFilled:     `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="5"/></svg>`,
  dotEmpty:      `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="5"/></svg>`,
  minus:         `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="7" width="12" height="2"/></svg>`,
  plus:          `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="7" width="12" height="2"/><rect x="7" y="2" width="2" height="12"/></svg>`,
  chevronRight:  `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5,2 11,8 5,14"/></svg>`,
};

function loadState() {
  try {
    const saved = localStorage.getItem("ahlcg_audio:navState");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    selectedProvincia: "",
    selectedGremio: "",
    revealedDescriptions: [],
    autoPlay: true,
    playbackRate: 1,
    stEnabled: false,
    provinciaCollapsed: false,
    gremioCollapsed: false,
    narrationsCollapsed: false,
    bandaCollapsed: false
  };
}

function saveState() {
  localStorage.setItem(
    "ahlcg_audio:navState",
    JSON.stringify({
      view,
      selectedProvincia,
      selectedGremio,
      expandedPanels: [...expandedPanels],
      revealedDescriptions: [...revealedDescriptions],
      autoPlay,
      playbackRate,
      stEnabled,
      provinciaCollapsed,
      gremioCollapsed,
      narrationsCollapsed,
      bandaCollapsed,
      stVolume,
      stCurrentTrack,
      stCurrentTime: stAudio?.currentTime ?? 0
    })
  );
}

const state = loadState();
let selectedProvincia = typeof state.selectedProvincia === "string" ? state.selectedProvincia : "";
let selectedGremio = typeof state.selectedGremio === "string" ? state.selectedGremio : "";
let expandedPanels = new Set(Array.isArray(state.expandedPanels) ? state.expandedPanels : []);
let revealedDescriptions = new Set(Array.isArray(state.revealedDescriptions) ? state.revealedDescriptions : []);
let autoPlay = typeof state.autoPlay === "boolean" ? state.autoPlay : true;
let playbackRate = [1, 1.15, 1.25, 1.5].includes(state.playbackRate) ? state.playbackRate : 1;
let stEnabled = typeof (state.stEnabled ?? state.ytEnabled) === "boolean" ? (state.stEnabled ?? state.ytEnabled) : false;

// Vista activa: "inicio" (bienvenida) o "narraciones"
let view = state.view === "narraciones" ? "narraciones" : "inicio";

let provinciaCollapsed = typeof state.provinciaCollapsed === "boolean" ? state.provinciaCollapsed : false;
let gremioCollapsed = typeof state.gremioCollapsed === "boolean" ? state.gremioCollapsed : false;
let narrationsCollapsed = typeof state.narrationsCollapsed === "boolean" ? state.narrationsCollapsed : false;
let bandaCollapsed = typeof state.bandaCollapsed === "boolean" ? state.bandaCollapsed : false;

/** @type {null | { rafId: number, panelEl: HTMLAudioElement, ambientEl: HTMLAudioElement|null, hasAmbient: boolean, totalDuration: number, playerEl: HTMLElement, isSeeking: boolean }} */
let activePlayer = null;

let contentTree = buildTreeFromStart();
let accordionIndex = buildAccordionIndex(contentTree);

/** Map<cardLabel, nodeId> — sólo hojas con labels tipo XX-NN */
const CARD_LABEL_RE = /^[A-Z]{2}-\d{2}$/;
let cardLabelMap = buildCardLabelMap();
let cardSearchQuery = "";
let preSearchExpandedPanels = null;

function normalizeCardSearchInput(value) {
  return (value ?? "").toString().trim().replace(/\s+/g, " ");
}

function stripDiacritics(value) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeSearchText(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toLooseSearchKey(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9]+/g, "");
}

function beginCardSearchSession() {
  if (preSearchExpandedPanels) return;
  preSearchExpandedPanels = new Set(expandedPanels);
}

function endCardSearchSession() {
  if (!preSearchExpandedPanels) return;
  expandedPanels = new Set(preSearchExpandedPanels);
  preSearchExpandedPanels = null;
}

function applyCardSearchQuery(nextValue) {
  const nextQuery = normalizeCardSearchInput(nextValue);
  if (nextQuery === cardSearchQuery) return false;

  const hadQuery = Boolean(cardSearchQuery);
  const hasQuery = Boolean(nextQuery);

  if (!hadQuery && hasQuery) beginCardSearchSession();
  if (hadQuery && !hasQuery) {
    endCardSearchSession();
    saveState();
  }

  cardSearchQuery = nextQuery;
  return true;
}

function resetCardSearch() {
  applyCardSearchQuery("");
  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput) cardSearchInput.value = "";
}

function syncTopbarSearchAvailability() {
  const enabled = Boolean(selectedProvincia);
  const topbarProvinceHint = document.getElementById("topbar-province-hint");
  if (topbarProvinceHint) {
    topbarProvinceHint.hidden = enabled;
  }

  const cardSearchWrap = document.querySelector(".card-search");
  if (cardSearchWrap) cardSearchWrap.hidden = !enabled;

  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput) {
    cardSearchInput.disabled = !enabled;
    cardSearchInput.setAttribute("aria-disabled", enabled ? "false" : "true");
    cardSearchInput.setAttribute("title", enabled ? "" : t("search.disabledHint"));
    if (!enabled) cardSearchInput.value = "";
  }
}

function goToInicio() {
  view = "inicio";
  selectedProvincia = "";
  selectedGremio = "";
  resetCardSearch();
  stopActivePlayer();
  saveState();
  render();
}

function getNodeCardLabel(node) {
  const rawLabel = typeof node?.title === "string" ? node.title.trim().toUpperCase() : "";
  return CARD_LABEL_RE.test(rawLabel) ? rawLabel : "";
}

function nodeMatchesSearch(node, queryRaw) {
  if (!queryRaw) return true;

  const textQuery = normalizeSearchText(queryRaw);
  const looseQuery = toLooseSearchKey(queryRaw);
  const textHaystack = normalizeSearchText([
    node?.title,
    node?.summary,
    node?.contentTitle,
  ].filter(Boolean).join(" "));

  if (textQuery && textHaystack.includes(textQuery)) {
    return true;
  }

  if (!looseQuery) {
    return false;
  }

  const labelLoose = toLooseSearchKey(getNodeCardLabel(node));
  if (labelLoose && labelLoose.includes(looseQuery)) {
    return true;
  }

  const looseHaystack = toLooseSearchKey([
    node?.title,
    node?.summary,
    node?.contentTitle,
  ].filter(Boolean).join(" "));

  return looseHaystack.includes(looseQuery);
}

function buildCardLabelMap() {
  const map = new Map();
  function walk(nodes) {
    for (const node of nodes) {
      if (node.type === "leaf") {
        const label = getNodeCardLabel(node);
        if (label) map.set(label, node.id);
      }
      if (node.children?.length) walk(node.children);
    }
  }
  walk(contentTree);
  return map;
}

let swRegistration = null;

registerServiceWorker();

// ── Sidebar toggle (mobile) ──────────────────────────────────────────────
const sidebarToggleEl = document.getElementById("sidebar-toggle");

function setSidebarOpen(open) {
  sidebarEl.classList.toggle("sidebar--open", open);
  document.getElementById("sidebar-overlay").classList.toggle("sidebar-overlay--visible", open);
  sidebarToggleEl?.setAttribute("aria-expanded", open ? "true" : "false");
  sidebarToggleEl?.setAttribute("aria-label", open ? t("a11y.closeSidebar") : t("a11y.openSidebar"));
}

sidebarToggleEl?.addEventListener("click", () => {
  const willOpen = !sidebarEl.classList.contains("sidebar--open");
  setSidebarOpen(willOpen);
  if (willOpen) sidebarEl.querySelector(".sidebar-nav-item")?.focus();
});
document.getElementById("sidebar-overlay")?.addEventListener("click", () => setSidebarOpen(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebarEl.classList.contains("sidebar--open")) {
    setSidebarOpen(false);
    sidebarToggleEl?.focus();
  }
});

// ── Soundtrack ────────────────────────────────────────────

const ST_CACHE_NAME = "ahlcg-soundtrack-v1";
const stCachedIds = new Set(JSON.parse(localStorage.getItem("ahlcg_audio:stCachedIds") || "[]"));

/** @type {HTMLAudioElement | null} */
let stAudio = null;
/** @type {AudioContext | null} */
let stAudioCtx = null;
/** @type {GainNode | null} */
let stGainNode = null;
let stCurrentTrack = (typeof state.stCurrentTrack === "number" && state.stCurrentTrack >= 0 && state.stCurrentTrack < SOUNDTRACK.length) ? state.stCurrentTrack : 0;
let stVolume = (typeof state.stVolume === "number" && state.stVolume >= 0 && state.stVolume <= 100) ? state.stVolume : 100;
let stRestoreTime = (typeof state.stCurrentTime === "number" && state.stCurrentTime > 0) ? state.stCurrentTime : 0;
let stSaveTickCount = 0;
let stIsDucked = false;
let stPollId = null;
let stIsSeeking = false;
let stIsDownloading = false;
/** @type {Promise<void> | null} */
let stDownloadPromise = null;
const stObjectUrls = {};

function stTrackUrl(index) {
  const src = SOUNDTRACK[index]?.src ?? "";
  if (/^https?:\/\//.test(src)) {
    if (import.meta.env.DEV) {
      const pathname = new URL(src).pathname;
      return `/r2-dev${pathname}`;
    }
    return src;
  }
  return `${import.meta.env.BASE_URL}${src}`;
}

function setupSTPlayer() {
  if (stAudio) return;
  if (!SOUNDTRACK.length) return;
  stAudio = new Audio();
  stAudio.preload = "metadata";
  try {
    stAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    stGainNode = stAudioCtx.createGain();
    stAudioCtx.createMediaElementSource(stAudio).connect(stGainNode);
    stGainNode.connect(stAudioCtx.destination);
    stGainNode.gain.value = stVolume / 100;
  } catch (_) {
    stAudio.volume = stVolume / 100;
  }
  stAudio.addEventListener("ended", () => {
    stCurrentTrack = (stCurrentTrack + 1) % SOUNDTRACK.length;
    loadSTTrack(stCurrentTrack).then(() => {
      stAudio.play().catch(() => {});
    });
    updateSTUI();
    saveState();
    updateSTMediaSession(true);
  });
  stAudio.addEventListener("pause", saveState);
}

async function loadSTTrack(index) {
  if (!stAudio || !SOUNDTRACK[index]) return;
  const url = stTrackUrl(index);

  if (stObjectUrls[index]) {
    URL.revokeObjectURL(stObjectUrls[index]);
    delete stObjectUrls[index];
  }

  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(ST_CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        const blob = await cached.blob();
        const objectUrl = URL.createObjectURL(blob);
        stObjectUrls[index] = objectUrl;
        stAudio.src = objectUrl;
        stAudio.load();
        return;
      }
    } catch (_) {}
  }

  if (import.meta.env.DEV) {
    console.warn("[ST] cache miss, cargando directo desde red:", url);
  }
  stAudio.src = url;
  stAudio.load();
}

function updateSTDownloadUI(progress) {
  const bar = document.getElementById("st-download-bar");
  const text = document.getElementById("st-download-text");
  const fill = document.getElementById("st-download-fill");
  if (!bar) return;
  if (progress < 0) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "";
  const pct = Math.round(progress * 100);
  if (text) text.textContent = t("soundtrackPlayer.downloading", { pct });
  if (fill) fill.style.width = `${pct}%`;
}

async function downloadSTIfNeeded() {
  if (!SOUNDTRACK.length || stIsDownloading) return stDownloadPromise;

  if (typeof caches === "undefined") return;
  const cache = await caches.open(ST_CACHE_NAME);

  const allInLS = SOUNDTRACK.every((track) => stCachedIds.has(track.id));
  if (allInLS) {
    const firstCached = await cache.match(stTrackUrl(0));
    if (firstCached) return;
    stCachedIds.clear();
    localStorage.removeItem("ahlcg_audio:stCachedIds");
  }

  const toDownload = [];
  for (let i = 0; i < SOUNDTRACK.length; i++) {
    const cached = await cache.match(stTrackUrl(i));
    if (!cached) toDownload.push(i);
  }
  if (!toDownload.length) return;

  stIsDownloading = true;
  stDownloadPromise = (async () => {
  updateSTDownloadUI(0);

  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }

  for (let di = 0; di < toDownload.length; di++) {
    const trackIndex = toDownload[di];
    const url = stTrackUrl(trackIndex);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = parseInt(response.headers.get("Content-Length") || "0", 10);
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        const fileProgress = contentLength > 0 ? received / contentLength : 0;
        updateSTDownloadUI((di + fileProgress) / toDownload.length);
      }

      const blob = new Blob(chunks, { type: "audio/mpeg" });
      await cache.put(url, new Response(blob, {
        headers: { "Content-Type": "audio/mpeg", "Content-Length": String(blob.size) }
      }));

      stCachedIds.add(SOUNDTRACK[trackIndex].id);
      localStorage.setItem("ahlcg_audio:stCachedIds", JSON.stringify([...stCachedIds]));

      if (trackIndex === stCurrentTrack && stAudio) {
        const wasPlaying = !stAudio.paused;
        const savedTime = stAudio.currentTime;
        await loadSTTrack(trackIndex);
        stAudio.currentTime = savedTime;
        if (wasPlaying) stAudio.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Soundtrack download failed:", url, err);
    }
  }

  stIsDownloading = false;
  updateSTDownloadUI(-1);
  })();
  return stDownloadPromise;
}

function setSTGain(value) {
  if (stGainNode) stGainNode.gain.value = value;
  else if (stAudio) stAudio.volume = value;
}

function getSTGain() {
  if (stGainNode) return stGainNode.gain.value;
  if (stAudio) return stAudio.volume;
  return stVolume / 100;
}

function duckST() {
  if (stEnabled && stAudio) {
    stIsDucked = true;
    setSTGain(Math.min(stVolume, 20) / 100);
  }
}

function duckSTFade(onDone) {
  const targetVol = Math.min(stVolume, 20) / 100;
  if (!stEnabled || !stAudio || stAudio.paused) {
    onDone();
    return;
  }
  stIsDucked = true;
  if (getSTGain() <= targetVol) {
    setSTGain(targetVol);
    setTimeout(onDone, 300);
    return;
  }
  const startVol = getSTGain();
  const startTime = performance.now();
  const FADE_MS = 500;
  function step() {
    const elapsed = Math.min((performance.now() - startTime) / FADE_MS, 1);
    setSTGain(startVol + (targetVol - startVol) * elapsed);
    if (elapsed < 1) {
      requestAnimationFrame(step);
    } else {
      onDone();
    }
  }
  requestAnimationFrame(step);
}

function restoreST() {
  if (stEnabled && stAudio) {
    stIsDucked = false;
    setSTGain(stVolume / 100);
    if (!stAudio.paused) updateSTMediaSession(true);
  }
}

function restoreSTFade() {
  stIsDucked = false;
  if (!stEnabled || !stAudio || stAudio.paused) return;
  const targetVol = stVolume / 100;
  if (getSTGain() >= targetVol) {
    setSTGain(targetVol);
    updateSTMediaSession(true);
    return;
  }
  const startVol = getSTGain();
  const startTime = performance.now();
  const FADE_MS = 800;
  function step() {
    const elapsed = Math.min((performance.now() - startTime) / FADE_MS, 1);
    setSTGain(startVol + (targetVol - startVol) * elapsed);
    if (elapsed < 1) {
      requestAnimationFrame(step);
    } else {
      setSTGain(targetVol);
      if (!stAudio.paused) updateSTMediaSession(true);
    }
  }
  requestAnimationFrame(step);
}

function updateSTUI() {
  const titleEl = document.getElementById("st-track-title");
  const playBtn = document.querySelector("[data-st-playpause]");
  const engaged = stEnabled && stAudio;
  const isPlaying = engaged ? !stAudio.paused : false;
  if (titleEl) {
    titleEl.textContent = engaged
      ? (SOUNDTRACK[stCurrentTrack]?.title ?? "")
      : t("soundtrackPlayer.idle");
  }
  if (playBtn) playBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  musicBarEl?.classList.toggle("music-bar--playing", isPlaying);
  if (engaged && !stAudio.paused) startSTPoll(); else stopSTPoll();
  tickSTProgress();
}

function startSTPoll() {
  if (stPollId) return;
  stPollId = setInterval(() => {
    if (!stAudio || stAudio.paused) { stopSTPoll(); return; }
    tickSTProgress();
    if (++stSaveTickCount >= 20) { stSaveTickCount = 0; saveState(); }
  }, 500);
}

function stopSTPoll() {
  if (stPollId) { clearInterval(stPollId); stPollId = null; }
  stSaveTickCount = 0;
}

function tickSTProgress() {
  if (stIsSeeking || !stAudio) return;
  const current = stAudio.currentTime;
  const duration = stAudio.duration;
  const seekbar = document.getElementById("st-seekbar");
  const currentEl = document.getElementById("st-current-time");
  const totalEl = document.getElementById("st-total-time");
  if (seekbar && isFinite(duration) && duration > 0) seekbar.value = Math.round((current / duration) * 1000);
  if (currentEl) currentEl.textContent = formatTimeLong(current);
  if (totalEl) totalEl.textContent = isFinite(duration) && duration > 0 ? formatTimeLong(duration) : "-:--";
}

function renderMusicBar() {
  if (!musicBarEl) return;
  const engaged = stEnabled && stAudio;
  const isPlaying = engaged ? !stAudio.paused : false;
  const title = engaged
    ? (SOUNDTRACK[stCurrentTrack]?.title ?? t("soundtrackPlayer.fallbackTitle"))
    : t("soundtrackPlayer.idle");

  musicBarEl.className = `music-bar${isPlaying ? " music-bar--playing" : ""}`;
  musicBarEl.innerHTML = `
    <div class="mb-inner" role="group" aria-label="${escapeAttribute(t("soundtrackPlayer.barLabel"))}">
      <span class="mb-icon" aria-hidden="true">${ICONS.musicNote}</span>
      <div class="mb-controls">
        <button type="button" class="mb-btn" data-st-prev aria-label="${escapeAttribute(t("soundtrackPlayer.prev"))}">${ICONS.prev}</button>
        <button type="button" class="mb-btn mb-btn--play" data-st-playpause aria-label="${escapeAttribute(t("soundtrackPlayer.playPause"))}">${isPlaying ? ICONS.pause : ICONS.play}</button>
        <button type="button" class="mb-btn" data-st-next aria-label="${escapeAttribute(t("soundtrackPlayer.next"))}">${ICONS.next}</button>
      </div>
      <span class="mb-title" id="st-track-title">${escapeHtml(title)}</span>
      <div class="mb-progress">
        <span class="mb-time" id="st-current-time">0:00</span>
        <input type="range" class="mb-seekbar" id="st-seekbar" min="0" max="1000" value="0" step="1" aria-label="${escapeAttribute(t("soundtrackPlayer.seek"))}">
        <span class="mb-time" id="st-total-time">-:--</span>
      </div>
      <div class="mb-volume">
        <span class="mb-vol-icon" aria-hidden="true">${ICONS.speaker}</span>
        <input type="range" class="mb-volume-slider" id="st-volume" min="0" max="100" value="${stVolume}" step="1" aria-label="${escapeAttribute(t("soundtrackPlayer.volume"))}">
      </div>
      <div id="st-download-bar" class="mb-download" style="display:none" role="status" aria-live="polite">
        <span id="st-download-text"></span>
        <div class="st-download-progress"><div class="st-download-progress-fill" id="st-download-fill" style="width:0%"></div></div>
      </div>
    </div>
  `;
}

function engageMusic() {
  stEnabled = true;
  setupSTPlayer();
  loadSTTrack(stCurrentTrack).then(() => {
    stAudioCtx?.resume();
    stAudio?.play().catch(() => {});
    updateSTMediaSession(true);
    updateSTUI();
  });
  downloadSTIfNeeded();
  stopActivePlayer();
  renderMusicBar();
  saveState();
  render();
  setTimeout(updateSTUI, 200);
}

function stPlayPause() {
  if (!stEnabled || !stAudio) { engageMusic(); return; }
  if (stAudio.paused) {
    stAudioCtx?.resume();
    stAudio.play().catch(() => {});
    updateSTMediaSession(true);
  } else {
    stAudio.pause();
    updateSTMediaSession(false);
  }
  updateSTUI();
}

function stPrev() {
  if (!stAudio || !SOUNDTRACK.length) return;
  const wasPlaying = !stAudio.paused;
  if (stAudio.currentTime > 3) {
    stAudio.currentTime = 0;
    updateSTUI();
    if (wasPlaying) updateSTMediaSession(true);
  } else {
    stCurrentTrack = (stCurrentTrack - 1 + SOUNDTRACK.length) % SOUNDTRACK.length;
    loadSTTrack(stCurrentTrack).then(() => {
      if (wasPlaying) stAudio.play().catch(() => {});
      updateSTUI();
      saveState();
      if (wasPlaying) updateSTMediaSession(true);
    });
  }
}

function stNext() {
  if (!stAudio || !SOUNDTRACK.length) return;
  const wasPlaying = !stAudio.paused;
  stCurrentTrack = (stCurrentTrack + 1) % SOUNDTRACK.length;
  loadSTTrack(stCurrentTrack).then(() => {
    if (wasPlaying) stAudio.play().catch(() => {});
    updateSTUI();
    saveState();
    if (wasPlaying) updateSTMediaSession(true);
  });
}

function bindMusicBarEvents() {
  if (!musicBarEl || musicBarEl.dataset.bound === "true") return;
  musicBarEl.dataset.bound = "true";

  musicBarEl.addEventListener("click", (event) => {
    if (event.target.closest("[data-st-playpause]")) stPlayPause();
    else if (event.target.closest("[data-st-prev]")) stPrev();
    else if (event.target.closest("[data-st-next]")) stNext();
  });

  const startSeek = (event) => { if (event.target.id === "st-seekbar") stIsSeeking = true; };
  musicBarEl.addEventListener("mousedown", startSeek);
  musicBarEl.addEventListener("touchstart", startSeek, { passive: true });

  musicBarEl.addEventListener("change", (event) => {
    if (event.target.id !== "st-seekbar") return;
    stIsSeeking = false;
    if (!stAudio) return;
    const duration = stAudio.duration;
    if (isFinite(duration) && duration > 0) {
      stAudio.currentTime = (parseInt(event.target.value, 10) / 1000) * duration;
      tickSTProgress();
    }
  });

  musicBarEl.addEventListener("input", (event) => {
    if (event.target.id !== "st-volume") return;
    stVolume = parseInt(event.target.value, 10);
    setSTGain((stIsDucked ? Math.min(stVolume, 30) : stVolume) / 100);
    saveState();
  });
}

function updateSTMediaSession(playing) {
  if (!("mediaSession" in navigator) || !SOUNDTRACK.length) return;
  const base = import.meta.env.BASE_URL;
  if (playing) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: SOUNDTRACK[stCurrentTrack]?.title ?? t("soundtrackPlayer.fallbackTitle"),
      artist: t("app.mediaArtist"),
      artwork: [
        { src: `${base}icons/icon-192.png`, sizes: "192x192", type: "image/png" },
        { src: `${base}icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      ]
    });
    navigator.mediaSession.setActionHandler("play", () => {
      stAudio?.play().catch(() => {});
      updateSTUI();
      updateSTMediaSession(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      stAudio?.pause();
      stopSTPoll();
      updateSTUI();
      navigator.mediaSession.playbackState = "paused";
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (!stAudio) return;
      const wasPlaying = !stAudio.paused;
      if (stAudio.currentTime > 3) {
        stAudio.currentTime = 0;
        updateSTUI();
        updateSTMediaSession(true);
      } else {
        stCurrentTrack = (stCurrentTrack - 1 + SOUNDTRACK.length) % SOUNDTRACK.length;
        loadSTTrack(stCurrentTrack).then(() => {
          if (wasPlaying) stAudio.play().catch(() => {});
          updateSTUI();
          updateSTMediaSession(true);
        });
      }
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (!stAudio) return;
      const wasPlaying = !stAudio.paused;
      stCurrentTrack = (stCurrentTrack + 1) % SOUNDTRACK.length;
      loadSTTrack(stCurrentTrack).then(() => {
        if (wasPlaying) stAudio.play().catch(() => {});
        updateSTUI();
        updateSTMediaSession(true);
      });
    });
  }
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}

// Barra de música de ambiente (persistente en la zona superior).
const musicBarEl = document.getElementById("music-bar");

// ── Language switcher ─────────────────────────────────────────────────────
const langSwitcherEl = document.getElementById("lang-switcher");
let langMenuOpen = false;

function renderLangSwitcher() {
  if (!langSwitcherEl) return;
  const current = getLang();
  const currentLangObj = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];
  const options = LANGUAGES.map((l) => {
    const isCurrent = l.code === current;
    return `<button type="button" class="lang-option" role="menuitemradio" aria-checked="${isCurrent ? "true" : "false"}" data-lang-code="${escapeAttribute(l.code)}"><span class="lang-option-mark" aria-hidden="true">${isCurrent ? ICONS.diamondFilled : ICONS.diamondEmpty}</span><span>${escapeHtml(l.name)} (${escapeHtml(l.label)})</span></button>`;
  }).join("");

  const btnLabel = `${t("langSwitcher.label")}. ${t("langSwitcher.current", { name: currentLangObj.name })}`;

  langSwitcherEl.innerHTML = `
    <button type="button" class="lang-btn" id="lang-btn" aria-haspopup="menu" aria-expanded="${langMenuOpen ? "true" : "false"}" aria-label="${escapeAttribute(btnLabel)}">
      <span class="lang-globe" aria-hidden="true">${ICONS.globe}</span>
      <span class="lang-current">${escapeHtml(currentLangObj.label)}</span>
      <span class="lang-caret" aria-hidden="true">${ICONS.caretDown}</span>
    </button>
    <div class="lang-menu" id="lang-menu" role="menu" aria-label="${escapeAttribute(t("langSwitcher.menuLabel"))}"${langMenuOpen ? "" : " hidden"}>
      ${options}
    </div>
  `;
  bindLangSwitcherEvents();
}

function bindLangSwitcherEvents() {
  const btn = document.getElementById("lang-btn");
  const menu = document.getElementById("lang-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    langMenuOpen = !langMenuOpen;
    menu.hidden = !langMenuOpen;
    btn.setAttribute("aria-expanded", langMenuOpen ? "true" : "false");
    if (langMenuOpen) menu.querySelector(".lang-option")?.focus();
  });

  menu.querySelectorAll("[data-lang-code]").forEach((opt) => {
    opt.addEventListener("click", () => {
      const code = opt.dataset.langCode;
      langMenuOpen = false;
      const changed = code !== getLang() && setLang(code);
      if (changed) {
        stopActivePlayer();
        reloadContent();
        applyStaticI18n();
        render();
      }
      renderLangSwitcher();
      document.getElementById("lang-btn")?.focus();
    });
  });
}

function closeLangMenu() {
  if (!langMenuOpen) return;
  langMenuOpen = false;
  document.getElementById("lang-menu")?.setAttribute("hidden", "");
  document.getElementById("lang-btn")?.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", (event) => {
  if (langMenuOpen && langSwitcherEl && !langSwitcherEl.contains(event.target)) closeLangMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && langMenuOpen) {
    closeLangMenu();
    document.getElementById("lang-btn")?.focus();
  }
});

function reloadContent() {
  appData = getContent().appData;
  SOUNDTRACK = getContent().soundtrack;
  contentTree = buildTreeFromStart();
  accordionIndex = buildAccordionIndex(contentTree);
  cardLabelMap = buildCardLabelMap();
  if (stCurrentTrack >= SOUNDTRACK.length) stCurrentTrack = 0;
}

const DEFAULT_MANIFEST_LANG = LANGUAGES[0]?.code || "es";
function applyManifest() {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return;
  if (getLang() === DEFAULT_MANIFEST_LANG) {
    if (link.dataset.objUrl) {
      URL.revokeObjectURL(link.dataset.objUrl);
      delete link.dataset.objUrl;
    }
    link.href = `${import.meta.env.BASE_URL}manifest.webmanifest`;
    return;
  }
  try {
    const blob = new Blob([JSON.stringify(getContent().manifest)], { type: "application/manifest+json" });
    if (link.dataset.objUrl) URL.revokeObjectURL(link.dataset.objUrl);
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.dataset.objUrl = url;
  } catch {}
}

function applyStaticI18n() {
  document.documentElement.lang = getLang();
  document.title = t("app.title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.metaDescription"));
  const skip = document.querySelector(".skip-link");
  if (skip) skip.textContent = t("app.skipLink");
  const topbarProvinceHint = document.getElementById("topbar-province-hint");
  if (topbarProvinceHint) topbarProvinceHint.textContent = t("topbar.selectProvinceHint");
  sidebarToggleEl?.setAttribute(
    "aria-label",
    sidebarEl.classList.contains("sidebar--open") ? t("a11y.closeSidebar") : t("a11y.openSidebar")
  );
  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput) {
    cardSearchInput.placeholder = t("search.placeholder");
    cardSearchInput.setAttribute("aria-label", t("search.ariaLabel"));
  }
  applyManifest();
}

applyStaticI18n();
renderLangSwitcher();
renderMusicBar();
bindMusicBarEvents();
render();

if (stEnabled) {
  setupSTPlayer();
  loadSTTrack(stCurrentTrack).then(() => {
    if (stRestoreTime > 0) {
      if (isFinite(stAudio.duration) && stAudio.duration > 0) {
        stAudio.currentTime = stRestoreTime;
        stRestoreTime = 0;
      } else {
        const seekOnce = () => {
          stAudio.currentTime = stRestoreTime;
          stRestoreTime = 0;
          stAudio.removeEventListener("loadedmetadata", seekOnce);
        };
        stAudio.addEventListener("loadedmetadata", seekOnce);
      }
    }
    stAudio?.play().catch(() => {});
    updateSTUI();
    updateSTMediaSession(true);
  });
  downloadSTIfNeeded();
}

window.addEventListener("pagehide", () => {
  saveState();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveState();
});

window.addEventListener("pagehide", (e) => {
  if (!e.persisted && activePlayer?.playing) pauseActivePlayerInternal();
});

function registerServiceWorker() {
  if (import.meta.env.DEV) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {});
    }
    if (typeof caches !== "undefined") {
      caches.keys()
        .then((keys) => keys.filter((k) => k !== ST_CACHE_NAME).forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
    return;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `${import.meta.env.BASE_URL}sw.js`,
          { updateViaCache: "none" }
        );

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });

        swRegistration = registration;
        registration.update();

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && swRegistration) {
            swRegistration.update().catch(() => {});
          }
        });

        console.log("Service worker registrado");
      } catch (error) {
        console.error("Error registrando service worker:", error);
      }
    });
  }
}

function render() {
  syncTopbarSearchAvailability();
  sidebarEl.innerHTML = renderSidebar();

  if (view === "inicio") {
    screenEl.setAttribute("aria-label", t("a11y.screenWelcome"));
    screenEl.innerHTML = renderWelcome();
    bindFilterEvents();
    bindConfigEvents();
    return;
  }

  screenEl.setAttribute("aria-label", t("a11y.screenNarrations"));

  let bodyHtml;
  if (!selectedProvincia) {
    bodyHtml = `<div class="empty-screen">${escapeHtml(t("content.selectProvince"))}</div>`;
  } else {
    const filteredRoots = contentTree
      .map(filterTree)
      .filter(Boolean);

    if (cardSearchQuery && filteredRoots.length) {
      filteredRoots.forEach((node) => expandedPanels.add(node.id));
    }

    bodyHtml = filteredRoots.length
      ? filteredRoots.map((node) => renderPanel(node, 0)).join("")
      : `<div class="empty-screen">${escapeHtml(t("content.noMatches"))}</div>`;
  }

  const provLabel = selectedProvincia ? provinciaLabel(selectedProvincia) : null;
  const gremLabel = selectedGremio ? gremioLabel(selectedGremio) : null;
  const breadcrumb = provLabel
    ? `<p class="description breadcrumb">${escapeHtml(provLabel)}${gremLabel ? ` &mdash; ${escapeHtml(gremLabel)}` : ""}</p>`
    : "";

  screenEl.innerHTML = `
    <div class="single-screen-head">
      <h2>${escapeHtml(t("app.campaignTitle"))}</h2>
      ${breadcrumb}
    </div>
    <div class="accordion-root">
      ${bodyHtml}
    </div>
  `;

  bindFilterEvents();
  bindConfigEvents();
  bindPanelEvents();
  bindDescriptionRevealEvents();
}

function renderWelcome() {
  const features = t("welcome.features");
  const featuresHtml = (Array.isArray(features) ? features : [])
    .map((f) => `<li><strong>${escapeHtml(f.term)}</strong> ${escapeHtml(f.desc)}</li>`)
    .join("");

  const bannerHtml = WELCOME_BANNER_SRC
    ? `<img class="welcome-banner-img" src="${escapeAttribute(import.meta.env.BASE_URL + WELCOME_BANNER_SRC)}" alt="${escapeAttribute(t("welcome.bannerAlt"))}" decoding="async">`
    : `<div class="welcome-banner" role="img" aria-label="${escapeAttribute(t("welcome.bannerAria"))}">
        <span class="welcome-banner-label">${escapeHtml(t("welcome.bannerLabel"))}</span>
      </div>`;

  return `
    <div class="welcome">
      ${bannerHtml}
      <div class="welcome-intro">
        <h2>${escapeHtml(t("app.campaignTitle"))}</h2>
        <p class="welcome-lead">${escapeHtml(t("welcome.lead"))}</p>
        <p class="welcome-text">${escapeHtml(t("welcome.intro"))}</p>
        <h3 class="welcome-features-title">${escapeHtml(t("welcome.featuresTitle"))}</h3>
        <ul class="welcome-features">
          ${featuresHtml}
        </ul>
        <p class="welcome-text welcome-note">${escapeHtml(t("welcome.note"))}</p>
      </div>
      <footer class="welcome-footer">
        <p>${escapeHtml(t("welcome.footerCredits"))}</p>
        <p>${escapeHtml(t("welcome.footerDisclaimer"))}</p>
        <p>${escapeHtml(t("welcome.footerContact"))} <a href="mailto:${CONTACT_EMAIL}">${escapeHtml(CONTACT_EMAIL)}</a></p>
      </footer>
    </div>
  `;
}

function renderSidebar() {
  const inNarr = view === "narraciones";

  const provinciaItems = FILTER_OPTIONS.provincias.map((id) => {
    const active = inNarr && selectedProvincia === id;
    return `<button type="button" class="sidebar-nav-item sidebar-nav-item--section${active ? " sidebar-nav-item--active" : ""}" data-filter-type="provincia" data-filter-value="${escapeAttribute(id)}" aria-pressed="${active ? "true" : "false"}"><span class="sidebar-nav-dot" aria-hidden="true">${active ? ICONS.diamondFilled : ICONS.diamondEmpty}</span><span class="sidebar-nav-text">${escapeHtml(provinciaLabel(id))}</span><span class="sidebar-nav-chevron" aria-hidden="true">${ICONS.chevronRight}</span></button>`;
  }).join("");

  const gremioNoneActive = inNarr && !selectedGremio;
  const gremioBtn = (value, label, active) =>
    `<button type="button" class="sidebar-nav-item sidebar-nav-item--filter${active ? " sidebar-nav-item--active" : ""}" data-filter-type="gremio" data-filter-value="${escapeAttribute(value)}" aria-pressed="${active ? "true" : "false"}"><span class="sidebar-nav-dot sidebar-nav-dot--check" aria-hidden="true">${active ? ICONS.boxFilled : ICONS.boxEmpty}</span><span class="sidebar-nav-text">${escapeHtml(label)}</span></button>`;
  const gremioItems = [
    gremioBtn("", t("sidebar.allGuilds"), gremioNoneActive),
    ...FILTER_OPTIONS.gremios.map((id) => gremioBtn(id, gremioLabel(id), inNarr && selectedGremio === id)),
  ].join("");

  const speedChips = [1.00, 1.15, 1.25, 1.5].map((rate) => {
    const active = playbackRate === rate;
    return `<button type="button" class="checkable-chip${active ? " checkable-chip--active" : ""}" data-config-rate="${rate}" aria-pressed="${active ? "true" : "false"}"><span class="checkable-chip-mark" aria-hidden="true">${active ? ICONS.dotFilled : ICONS.dotEmpty}</span><span>${rate.toFixed(2)}x</span></button>`;
  }).join("");

  const inicioActive = view === "inicio";

  return `
    <nav class="sidebar-nav" aria-label="${escapeAttribute(t("a11y.sidebarNav"))}">
      <button type="button" class="sidebar-close" data-sidebar-close aria-label="${escapeAttribute(t("a11y.closeSidebar"))}">${ICONS.close}</button>
      <div class="sidebar-section">
        <div class="sidebar-nav-list">
          <button type="button" class="sidebar-nav-item${inicioActive ? " sidebar-nav-item--active" : ""}" data-nav-view="inicio" aria-current="${inicioActive ? "page" : "false"}"><span class="sidebar-nav-dot" aria-hidden="true">${inicioActive ? ICONS.diamondFilled : ICONS.diamondEmpty}</span>${escapeHtml(t("sidebar.home"))}</button>
        </div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.provincia"))}</h3>
        <p class="sidebar-section-hint">${escapeHtml(t("sidebar.provinciaHint"))}</p>
        <div class="sidebar-nav-list">${provinciaItems}</div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section sidebar-section--filter">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.gremio"))}</h3>
        <p class="sidebar-section-hint">${escapeHtml(t("sidebar.gremioHint"))}</p>
        <div class="sidebar-nav-list sidebar-nav-list--filter">${gremioItems}</div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.playback"))}</h3>
        <div class="sidebar-controls">
          <label class="sidebar-ctrl-label">
            <input type="checkbox" id="autoplay-checkbox" class="autoplay-checkbox"${autoPlay ? " checked" : ""}>
            <span>${escapeHtml(t("sidebar.autoplay"))}</span>
          </label>
          <div class="sidebar-speed">${speedChips}</div>
        </div>
      </div>
    </nav>
  `;
}

function bindConfigEvents() {
  const checkbox = document.getElementById("autoplay-checkbox");
  if (checkbox) {
    checkbox.addEventListener("change", () => {
      autoPlay = checkbox.checked;
      saveState();
    });
  }

  document.querySelectorAll("[data-config-rate]").forEach((button) => {
    button.addEventListener("click", () => {
      const rate = parseFloat(button.dataset.configRate);
      playbackRate = rate;
      saveState();

      screenEl.querySelectorAll("audio").forEach((audioEl) => {
        audioEl.playbackRate = rate;
      });
      if (activePlayer) {
        activePlayer.panelEl.playbackRate = rate;
        if (activePlayer.ambientEl) activePlayer.ambientEl.playbackRate = rate;
      }

      document.querySelectorAll("[data-config-rate]").forEach((btn) => {
        const btnRate = parseFloat(btn.dataset.configRate);
        const active = playbackRate === btnRate;
        btn.classList.toggle("checkable-chip--active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        btn.querySelector(".checkable-chip-mark").innerHTML = active ? ICONS.dotFilled : ICONS.dotEmpty;
      });
    });
  });

  if (stEnabled) updateSTUI();
}

function bindFilterEvents() {
  document.querySelectorAll("[data-filter-collapse]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.filterCollapse;
      if (target === "provincia") provinciaCollapsed = !provinciaCollapsed;
      if (target === "gremio") gremioCollapsed = !gremioCollapsed;
      if (target === "narraciones") narrationsCollapsed = !narrationsCollapsed;
      if (target === "banda") bandaCollapsed = !bandaCollapsed;
      saveState();
      render();
    });
  });

  document.querySelector("[data-sidebar-close]")?.addEventListener("click", () => {
    setSidebarOpen(false);
    sidebarToggleEl?.focus();
  });

  document.querySelectorAll("[data-nav-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.navView === "inicio") {
        goToInicio();
        return;
      }
      view = "narraciones";
      stopActivePlayer();
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.filterType;
      const value = button.dataset.filterValue;
      if (!type) return;

      if (type === "provincia") {
        selectedProvincia = value;
        selectedGremio = "";
        view = "narraciones";
      }

      if (type === "gremio") {
        selectedGremio = selectedGremio === value ? "" : value;
      }

      saveState();
      render();
    });
  });

  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput && cardSearchInput.dataset.bound !== "true") {
    cardSearchInput.dataset.bound = "true";
    cardSearchInput.setAttribute("autocapitalize", "characters");

    cardSearchInput.addEventListener("input", () => {
      const changed = applyCardSearchQuery(cardSearchInput.value);
      if (!changed) return;
      if (view === "narraciones") render();
    });

    cardSearchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!cardSearchInput.value && !cardSearchQuery) return;
      cardSearchInput.value = "";
      applyCardSearchQuery("");
      if (view === "narraciones") render();
    });
  }

  if (cardSearchInput && cardSearchInput.value !== cardSearchQuery) {
    cardSearchInput.value = cardSearchQuery;
  }
}

function bindPanelEvents() {
  screenEl.querySelectorAll("[data-panel-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      togglePanel(button.dataset.panelToggle || "");
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      togglePanel(button.dataset.panelToggle || "");
    });
  });
}

function resolveAmbientSrc(nodeId) {
  let id = nodeId;
  let parentId = accordionIndex.parentById.get(id);
  while (parentId && parentId !== accordionIndex.rootId) {
    id = parentId;
    parentId = accordionIndex.parentById.get(id);
  }
  const categoryKey = id.replace(/^group-/, "");
  const planAmbient = appData[categoryKey]?.ambient;
  if (planAmbient) return planAmbient;

  const provinciaAmbient = appData.ambientConfig?.provincias?.[selectedProvincia];
  if (provinciaAmbient) return provinciaAmbient;

  const generalAmbient = appData.ambientConfig?.general;
  if (generalAmbient) return generalAmbient;

  return null;
}

function formatTime(secs) {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeLong(secs) {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function stopActivePlayer() {
  if (!activePlayer) return;
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  }
  restoreSTFade();
  cancelAnimationFrame(activePlayer.rafId);
  activePlayer.rafId = 0;
  activePlayer.playing = false;
  activePlayer.panelEl.pause();
  if (activePlayer.ambientEl) activePlayer.ambientEl.pause();
  activePlayer = null;
}

function playerRaf() {
  if (!activePlayer) return;
  const p = activePlayer;

  let vt;
  if (p.hasAmbient) {
    if (p.phase === "pre-roll") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / p.panelEl.playbackRate;
      const pos = p.preRollPosAtStart + elapsed;
      vt = Math.min(1, pos);
      if (pos >= 1) {
        p.phase = "playing";
        p.preRollPosAtStart = 0;
        p.phaseStartMs = null;
        p.panelEl.play().catch(() => {});
      }
    } else if (p.phase === "playing") {
      vt = p.panelEl.currentTime + 1;
      if (p.panelEl.ended) {
        p.phase = "fade-out";
        p.fadeOutPosAtStart = 0;
        p.phaseStartMs = performance.now();
        if (p.ambientEl) p.ambientEl.volume = 0.25;
      }
    } else if (p.phase === "fade-out") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / (p.ambientEl?.playbackRate || 1);
      const pos = p.fadeOutPosAtStart + elapsed;
      vt = p.panelDuration + 1 + pos;
      if (p.ambientEl) p.ambientEl.volume = Math.max(0, 0.25 * (1 - pos));
      if (pos >= 1) {
        vt = p.totalDuration;
        if (p.ambientEl) { p.ambientEl.volume = 0; p.ambientEl.pause(); }
        updatePlayerUI(p, vt);
        setPlayerBtnState(p.playerEl, false);
        p.playing = false;
        updateMediaSession(false);
        restoreSTFade();
        cancelAnimationFrame(p.rafId);
        p.rafId = 0;
        p.phase = "ended";
        p.playTracked = false;
        return;
      }
    } else {
      return;
    }
  } else {
    vt = p.panelEl.currentTime;
    if (p.panelEl.ended) {
      vt = p.totalDuration;
      updatePlayerUI(p, vt);
      setPlayerBtnState(p.playerEl, false);
      p.playing = false;
      updateMediaSession(false);
      restoreSTFade();
      cancelAnimationFrame(p.rafId);
      p.rafId = 0;
      p.phase = "ended";
      p.playTracked = false;
      return;
    }
  }

  updatePlayerUI(p, vt);
  p.rafId = requestAnimationFrame(playerRaf);
}

function updatePlayerUI(p, vt) {
  const seekbar = p.playerEl.querySelector("[data-player-seek]");
  const currentEl = p.playerEl.querySelector("[data-player-current]");
  if (!p.isSeeking && seekbar) {
    seekbar.value = p.totalDuration > 0 ? Math.round((vt / p.totalDuration) * 1000) : 0;
  }
  if (currentEl) currentEl.textContent = formatTime(vt);
}

function setPlayerBtnState(playerEl, isPlaying) {
  const btn = playerEl.querySelector("[data-player-play]");
  if (!btn) return;
  btn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  btn.classList.toggle("player-btn--playing", isPlaying);
  btn.setAttribute("aria-label", isPlaying ? t("player.pause") : t("player.play"));
}

function seekPlayer(vt) {
  if (!activePlayer) return;
  const p = activePlayer;
  const clamped = Math.max(0, Math.min(vt, p.totalDuration));

  cancelAnimationFrame(p.rafId);
  p.rafId = 0;

  const wasPlaying = p.hasAmbient
    ? !(p.ambientEl?.paused ?? true)
    : !p.panelEl.paused;

  if (p.hasAmbient) {
    if (clamped < 1) {
      p.panelEl.pause();
      p.panelEl.currentTime = 0;
      if (p.ambientEl) p.ambientEl.volume = 0.25;
      p.phase = "pre-roll";
      p.preRollPosAtStart = clamped;
      p.phaseStartMs = wasPlaying ? performance.now() : null;
      if (wasPlaying && p.ambientEl?.paused) p.ambientEl.play().catch(() => {});
    } else if (clamped <= p.panelDuration + 1) {
      p.panelEl.currentTime = clamped - 1;
      if (p.ambientEl) p.ambientEl.volume = 0.25;
      p.phase = "playing";
      p.phaseStartMs = null;
      if (wasPlaying) {
        if (p.ambientEl?.paused) p.ambientEl.play().catch(() => {});
        if (p.panelEl.paused) p.panelEl.play().catch(() => {});
      }
    } else {
      const fadeOutPos = clamped - (p.panelDuration + 1);
      p.panelEl.pause();
      p.phase = "fade-out";
      p.fadeOutPosAtStart = fadeOutPos;
      p.phaseStartMs = wasPlaying ? performance.now() : null;
      if (p.ambientEl) p.ambientEl.volume = Math.max(0, 0.25 * (1 - fadeOutPos));
      if (wasPlaying && p.ambientEl?.paused) p.ambientEl.play().catch(() => {});
    }
  } else {
    p.panelEl.currentTime = clamped;
    p.phase = clamped < p.totalDuration ? "playing" : "ended";
    if (wasPlaying && p.panelEl.paused) p.panelEl.play().catch(() => {});
  }

  if (wasPlaying) {
    p.rafId = requestAnimationFrame(playerRaf);
  } else {
    updatePlayerUI(p, clamped);
  }
}

function updateMediaSession(playing) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}

function pauseActivePlayerInternal() {
  if (!activePlayer) return;
  const p = activePlayer;
  cancelAnimationFrame(p.rafId);
  p.rafId = 0;
  if (p.hasAmbient) {
    if (p.phase === "pre-roll") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / p.panelEl.playbackRate;
      p.preRollPosAtStart = Math.min(1, p.preRollPosAtStart + elapsed);
      p.phaseStartMs = null;
    } else if (p.phase === "fade-out") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / (p.ambientEl?.playbackRate || 1);
      p.fadeOutPosAtStart = Math.min(1, p.fadeOutPosAtStart + elapsed);
      p.phaseStartMs = null;
    }
    p.ambientEl?.pause();
  }
  p.playing = false;
  p.panelEl.pause();
  setPlayerBtnState(p.playerEl, false);
  updateMediaSession(false);
  restoreSTFade();
}

function resumeActivePlayerInternal() {
  if (!activePlayer) return;
  const p = activePlayer;
  if (p.hasAmbient) {
    if (p.phase === "pre-roll") {
      p.phaseStartMs = performance.now();
      p.ambientEl?.play().catch(() => {});
    } else if (p.phase === "playing") {
      p.ambientEl?.play().catch(() => {});
      p.panelEl.play().catch(() => {});
    } else if (p.phase === "fade-out") {
      p.phaseStartMs = performance.now();
      if (p.ambientEl) {
        p.ambientEl.volume = Math.max(0, 0.25 * (1 - p.fadeOutPosAtStart));
        p.ambientEl.play().catch(() => {});
      }
    }
  } else {
    if (!p.panelEl.ended) p.panelEl.play().catch(() => {});
  }
  p.playing = true;
  p.rafId = requestAnimationFrame(playerRaf);
  setPlayerBtnState(p.playerEl, true);
  updateMediaSession(true);
  duckST();
}

function initPlayer(contentEl, panelEl, ambientEl, totalDuration, panelDuration, node) {
  const playerEl = contentEl.querySelector(".custom-player");
  if (!playerEl) return;

  const hasAmbient = !!ambientEl;

  activePlayer = {
    rafId: 0,
    playerEl,
    panelEl,
    ambientEl: ambientEl || null,
    hasAmbient,
    totalDuration,
    panelDuration,
    phase: hasAmbient ? "pre-roll" : "playing",
    phaseStartMs: null,
    preRollPosAtStart: 0,
    fadeOutPosAtStart: 0,
    isSeeking: false,
    playing: false,
    node: node || null,
    playTracked: false,
  };

  panelEl.volume = 1;
  panelEl.playbackRate = playbackRate;
  if (ambientEl) {
    ambientEl.volume = 0.25;
    ambientEl.playbackRate = playbackRate;
  }

  const totalEl = playerEl.querySelector("[data-player-total]");
  if (totalEl) totalEl.textContent = formatTime(totalDuration);

  const seekbar = playerEl.querySelector("[data-player-seek]");
  if (seekbar) seekbar.removeAttribute("disabled");

  if (hasAmbient) {
    panelEl.addEventListener("ended", () => {
      if (!activePlayer || activePlayer.panelEl !== panelEl) return;
      if (activePlayer.phase !== "playing") return;
      activePlayer.phase = "fade-out";
      activePlayer.fadeOutPosAtStart = 0;
      activePlayer.phaseStartMs = performance.now();
      if (activePlayer.ambientEl) activePlayer.ambientEl.volume = 0.25;
      if (!activePlayer.rafId) activePlayer.rafId = requestAnimationFrame(playerRaf);
    });
  }

  panelEl.addEventListener("pause", () => {
    if (!activePlayer || activePlayer.panelEl !== panelEl) return;
    if (!activePlayer.playing || panelEl.ended) return;
    panelEl.play().catch(() => {});
  });

  if ("mediaSession" in navigator) {
    const title = contentEl.closest(".panel")?.querySelector(".panel-title")?.textContent?.trim() || t("app.mediaFallbackTitle");
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: t("app.mediaArtist") });
    navigator.mediaSession.setActionHandler("play", () => playerEl.querySelector("[data-player-play]")?.click());
    navigator.mediaSession.setActionHandler("pause", () => playerEl.querySelector("[data-player-play]")?.click());
    navigator.mediaSession.setActionHandler("stop", () => stopActivePlayer());
  }

  playerEl.querySelector("[data-player-play]")?.addEventListener("click", () => {
    if (!activePlayer) return;
    const p = activePlayer;

    if (p.hasAmbient) {
      if (p.phase === "ended") {
        trackAudioPlay(p.node);
        p.playTracked = true;
        if (p.ambientEl) { p.ambientEl.volume = 0.25; p.ambientEl.currentTime = 0; }
        p.panelEl.currentTime = 0;
        p.phase = "pre-roll";
        p.preRollPosAtStart = 0;
        p.fadeOutPosAtStart = 0;
        p.phaseStartMs = performance.now();
        p.ambientEl?.play().catch(() => {});
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
        return;
      }

      const isPlaying = !(p.ambientEl?.paused ?? true);

      if (isPlaying) {
        cancelAnimationFrame(p.rafId);
        p.rafId = 0;
        if (p.phase === "pre-roll") {
          const elapsed = (performance.now() - p.phaseStartMs) / 1000 / p.panelEl.playbackRate;
          p.preRollPosAtStart = Math.min(1, p.preRollPosAtStart + elapsed);
          p.phaseStartMs = null;
        } else if (p.phase === "fade-out") {
          const elapsed = (performance.now() - p.phaseStartMs) / 1000 / (p.ambientEl?.playbackRate || 1);
          p.fadeOutPosAtStart = Math.min(1, p.fadeOutPosAtStart + elapsed);
          p.phaseStartMs = null;
        }
        p.playing = false;
        p.ambientEl?.pause();
        p.panelEl.pause();
        setPlayerBtnState(playerEl, false);
        updateMediaSession(false);
        restoreSTFade();
      } else {
        if (!p.playTracked) { trackAudioPlay(p.node); p.playTracked = true; }
        if (p.phase === "pre-roll") {
          p.phaseStartMs = performance.now();
          p.ambientEl?.play().catch(() => {});
        } else if (p.phase === "playing") {
          p.ambientEl?.play().catch(() => {});
          p.panelEl.play().catch(() => {});
        } else if (p.phase === "fade-out") {
          p.phaseStartMs = performance.now();
          if (p.ambientEl) {
            p.ambientEl.volume = Math.max(0, 0.25 * (1 - p.fadeOutPosAtStart));
            p.ambientEl.play().catch(() => {});
          }
        }
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
      }
    } else {
      if (p.phase === "ended" || p.panelEl.ended) {
        trackAudioPlay(p.node);
        p.playTracked = true;
        p.panelEl.currentTime = 0;
        p.phase = "playing";
        p.panelEl.play().catch(() => {});
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
        return;
      }
      if (p.panelEl.paused) {
        if (!p.playTracked) { trackAudioPlay(p.node); p.playTracked = true; }
        p.panelEl.play().catch(() => {});
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
      } else {
        p.playing = false;
        p.panelEl.pause();
        cancelAnimationFrame(p.rafId);
        p.rafId = 0;
        setPlayerBtnState(playerEl, false);
        updateMediaSession(false);
        restoreSTFade();
      }
    }
  });

  if (seekbar) {
    seekbar.addEventListener("mousedown", () => { if (activePlayer) activePlayer.isSeeking = true; });
    seekbar.addEventListener("touchstart", () => { if (activePlayer) activePlayer.isSeeking = true; }, { passive: true });
    seekbar.addEventListener("input", () => {
      if (!activePlayer) return;
      const vt = (parseInt(seekbar.value, 10) / 1000) * activePlayer.totalDuration;
      updatePlayerUI(activePlayer, vt);
    });
    seekbar.addEventListener("change", () => {
      if (!activePlayer) return;
      activePlayer.isSeeking = false;
      const vt = (parseInt(seekbar.value, 10) / 1000) * activePlayer.totalDuration;
      seekPlayer(vt);
    });
  }
}

function togglePanel(panelId) {
  if (!panelId) return;

  let isOpening = false;

  if (expandedPanels.has(panelId)) {
    collapseBranch(panelId);
  } else {
    const parentId = accordionIndex.parentById.get(panelId) || accordionIndex.rootId;
    const siblings = accordionIndex.childrenByParent.get(parentId) || [];

    siblings.forEach((siblingId) => {
      if (siblingId !== panelId) {
        collapseBranch(siblingId);
      }
    });

    expandedPanels.add(panelId);
    isOpening = true;
  }

  saveState();
  render();

  if (isOpening) {
    const node = findNodeById(contentTree, panelId);
    if (node?.type === "leaf") {
      const contentEl = document.getElementById(`${panelId}-content`);
      if (contentEl) {
        const panelEl = contentEl.querySelector('audio[data-role="panel"]');
        const ambientEl = contentEl.querySelector('audio[data-role="ambient"]');
        if (!panelEl) return;

        const setupAndStart = () => {
          const panelDuration = panelEl.duration;
          const totalDuration = ambientEl ? panelDuration + 2 : panelDuration;
          initPlayer(contentEl, panelEl, ambientEl || null, totalDuration, panelDuration, node);
          if (autoPlay) {
            duckSTFade(() => {
              const p = activePlayer;
              if (!p) return;
              if (!p.playTracked) { trackAudioPlay(p.node); p.playTracked = true; }
              if (p.hasAmbient) {
                p.phaseStartMs = performance.now();
                ambientEl.play().catch(() => {});
              } else {
                panelEl.play().catch(() => {});
              }
              p.rafId = requestAnimationFrame(playerRaf);
              setPlayerBtnState(p.playerEl, true);
              p.playing = true;
              updateMediaSession(true);
            });
          }
        };

        if (isFinite(panelEl.duration) && panelEl.duration > 0) {
          setupAndStart();
        } else {
          panelEl.addEventListener("loadedmetadata", setupAndStart, { once: true });
        }
      }
    }
  }
}

function collapseBranch(panelId) {
  stopActivePlayer();
  const contentEl = document.getElementById(`${panelId}-content`);
  contentEl?.querySelectorAll("audio").forEach((a) => a.pause());
  expandedPanels.delete(panelId);
  revealedDescriptions.delete(panelId);
  const children = accordionIndex.childrenByParent.get(panelId) || [];
  children.forEach((childId) => collapseBranch(childId));
}

function buildAccordionIndex(roots) {
  const rootId = "__root__";
  const parentById = new Map();
  const childrenByParent = new Map();

  function ensureParent(parentId) {
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }
  }

  function link(parentId, childId) {
    ensureParent(parentId);
    childrenByParent.get(parentId).push(childId);
  }

  function walk(node, parentId) {
    parentById.set(node.id, parentId);
    link(parentId, node.id);
    node.children.forEach((child) => {
      walk(child, node.id);
    });
  }

  ensureParent(rootId);
  roots.forEach((node) => walk(node, rootId));

  return { rootId, parentById, childrenByParent };
}

function renderPanel(node, level) {
  const isOpen = expandedPanels.has(node.id);
  const icon = isOpen ? ICONS.minus : ICONS.plus;
  const levelClass = `panel level-${Math.min(level, 3)}`;
  const childrenHtml = node.children.map((child) => renderPanel(child, level + 1)).join("");

  return `
    <section class="${levelClass}">
      <button
        type="button"
        class="panel-toggle"
        data-panel-toggle="${escapeAttribute(node.id)}"
        aria-expanded="${isOpen ? "true" : "false"}"
        aria-controls="${escapeAttribute(`${node.id}-content`)}"
      >
        <span class="panel-main">
          <strong class="panel-title">${renderLabel(node.title)}</strong>
          ${node.summary ? `<span class="panel-summary">${escapeHtml(node.summary)}</span>` : ""}
        </span>
        <span class="panel-icon" aria-hidden="true">${icon}</span>
      </button>
      <div id="${escapeAttribute(`${node.id}-content`)}" class="panel-content${isOpen ? " is-open" : ""}">
        ${node.type === "leaf" ? renderLeafContent(node) : `<div class="panel-children">${childrenHtml}</div>`}
      </div>
    </section>
  `;
}

// Construye la URL de un audio. Para ahlcg los archivos no están particionados
// por idioma, así que se sirven directamente de public/audios/.
function audioUrl(src) {
  if (!src) return "";
  const path = src.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${path}`;
}

function renderLeafContent(node) {
  const isOpen = expandedPanels.has(node.id);

  const panelSrc = audioUrl(node.audioSrc);

  const rawAmbientSrc = (isOpen && !(stAudio && !stAudio.paused)) ? resolveAmbientSrc(node.id) : null;
  const ambientSrc = audioUrl(rawAmbientSrc);

  const descriptionHtml = renderLeafDescription(node);

  let audioHtml;
  if (!panelSrc) {
    audioHtml = `<p class="empty">${escapeHtml(t("player.missingAudio"))}</p>`;
  } else {
    const hiddenAudios = isOpen
      ? (ambientSrc
          ? `<audio preload="metadata" src="${escapeAttribute(ambientSrc)}" data-role="ambient" loop hidden></audio>
         <audio preload="metadata" src="${escapeAttribute(panelSrc)}" data-role="panel" hidden></audio>`
          : `<audio preload="metadata" src="${escapeAttribute(panelSrc)}" data-role="panel" hidden></audio>`)
      : "";

    audioHtml = `
      <div class="custom-player" data-player-id="${escapeAttribute(node.id)}">
        <button type="button" class="player-btn" data-player-play aria-label="${escapeAttribute(t("player.play"))}">${ICONS.play}</button>
        <div class="player-track">
          <input type="range" class="player-seekbar" data-player-seek min="0" max="1000" value="0" step="1" aria-label="${escapeAttribute(t("player.seek"))}" disabled>
          <div class="player-time">
            <span data-player-current>0:00</span>
            <span data-player-total>-:--</span>
          </div>
        </div>
      </div>
      ${hiddenAudios}
    `;
  }

  return `
    <article class="leaf-content">
      ${audioHtml}
      <div class="leaf-description-block">
        ${descriptionHtml}
      </div>
    </article>
  `;
}

function renderLeafDescription(node) {
  const hasDescription = Boolean(node.description);
  const isDescriptionRevealed = revealedDescriptions.has(node.id);

  if (!hasDescription) {
    return "";
  }

  const id = escapeAttribute(node.id);

  if (isDescriptionRevealed) {
    return `
      <div class="spoiler spoiler--revealed">
        <button
          type="button"
          class="spoiler-toggle-btn"
          data-reveal-description="${id}"
          aria-expanded="true"
        >
          <span class="spoiler-preview-label">${escapeHtml(t("spoiler.hideLabel"))}</span>
          <span class="spoiler-caret" aria-hidden="true">${ICONS.caretUp}</span>
        </button>
        <p class="description leaf-description">${escapeHtml(node.description)}</p>
      </div>
    `;
  }

  return `
    <button
      type="button"
      class="spoiler spoiler-preview"
      data-reveal-description="${id}"
      aria-expanded="false"
    >
      <span class="spoiler-preview-label">${escapeHtml(t("spoiler.label"))}</span>
      <span class="spoiler-lines" aria-hidden="true">
        <span class="spoiler-line"></span>
        <span class="spoiler-line"></span>
        <span class="spoiler-line"></span>
      </span>
    </button>
  `;
}

function bindDescriptionRevealEvents() {
  screenEl.querySelectorAll("[data-reveal-description]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDescription(button.dataset.revealDescription || "");
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      toggleDescription(button.dataset.revealDescription || "");
    });
  });
}

function toggleDescription(panelId) {
  if (!panelId) return;

  if (revealedDescriptions.has(panelId)) {
    revealedDescriptions.delete(panelId);
  } else {
    revealedDescriptions.add(panelId);
  }

  saveState();
  updateDescriptionDisplay(panelId);
}

function updateDescriptionDisplay(panelId) {
  const contentEl = document.getElementById(`${panelId}-content`);
  if (!contentEl) return;

  const descriptionBlockEl = contentEl.querySelector(".leaf-description-block");
  if (!descriptionBlockEl) return;

  const node = findNodeById(contentTree, panelId);
  if (!node || node.type !== "leaf") return;

  descriptionBlockEl.innerHTML = renderLeafDescription(node);
  bindDescriptionRevealEvents();
}

function findNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (!node.children.length) continue;

    const found = findNodeById(node.children, id);
    if (found) return found;
  }

  return null;
}

function filterTree(node) {
  if (node.type === "leaf") {
    return matchesFilters(node) ? node : null;
  }

  const visibleChildren = node.children
    .map(filterTree)
    .filter(Boolean);

  if (!visibleChildren.length) {
    return null;
  }

  return {
    ...node,
    children: visibleChildren
  };
}

function matchesFilters(node) {
  const provinciaMatch =
    !selectedProvincia ||
    node.tags.provincia === "all" ||
    node.tags.provincia === selectedProvincia;

  const gremioMatch =
    !selectedGremio ||
    node.tags.gremio === "all" ||
    node.tags.gremio === selectedGremio;

  const searchMatch =
    !cardSearchQuery ||
    nodeMatchesSearch(node, cardSearchQuery);

  return provinciaMatch && gremioMatch && searchMatch;
}

function buildTreeFromStart() {
  const root = appData.start;
  if (!root || !Array.isArray(root.options)) {
    return [];
  }

  return root.options
    .map((option, index) => buildNodeFromOption(option, [], `root-${index}`))
    .filter(Boolean);
}

function buildNodeFromOption(option, parentTags, fallbackId) {
  const inlineAudio = option?.audio || (Array.isArray(option?.audios) && option.audios.length ? option.audios[0] : null);
  const hasInlineLeaf = !!(inlineAudio || option?.leafDescription);
  const nextId = option?.next;
  const nextNode = nextId ? appData[nextId] : null;
  const derivedTags = mergeTags(parentTags, extractTags(option, nextId, nextNode));

  if (hasInlineLeaf) {
    return {
      id: `leaf-${nextId || fallbackId}`,
      type: "leaf",
      title: option.label || nextId || fallbackId,
      summary: option.description || "",
      contentTitle: "",
      description: option.leafDescription || option.description || "",
      audioSrc: inlineAudio?.src || "",
      tags: derivedTags,
      children: []
    };
  }

  if (!nextId || !nextNode) {
    return {
      id: `leaf-${fallbackId}`,
      type: "leaf",
      title: option?.label || fallbackId,
      summary: option?.description || "",
      contentTitle: "",
      description: "",
      audioSrc: "",
      tags: derivedTags,
      children: []
    };
  }

  if (Array.isArray(nextNode.options) && nextNode.options.length) {
    const children = nextNode.options
      .map((childOption, index) => buildNodeFromOption(childOption, derivedTags, `${nextId}-${index}`))
      .filter(Boolean);

    return {
      id: `group-${nextId}`,
      type: "group",
      title: option.label || nextNode.title || nextId,
      summary: option.description || nextNode.description || "",
      children,
      tags: derivedTags
    };
  }

  const audioData = nextNode.audio || (Array.isArray(nextNode.audios) && nextNode.audios[0]) || null;

  return {
    id: `leaf-${nextId || fallbackId}`,
    type: "leaf",
    title: option.label || nextNode.title || nextId,
    summary: option.description || "",
    contentTitle: nextNode.title || "",
    description: nextNode.description || "",
    audioSrc: audioData?.src || "",
    tags: derivedTags,
    children: []
  };
}

function mergeTags(parentTags, ownTags) {
  return {
    provincia: ownTags.provincia || parentTags.provincia || "",
    gremio: ownTags.gremio || parentTags.gremio || ""
  };
}

function extractTags(option, _nextId, _nextNode) {
  const explicitProvincia = normalizeProvinciaTag(option?.provinciaTag || option?.provincia || "");
  const explicitGremio = normalizeGremioTag(option?.gremioTag || option?.gremio || "");

  return {
    provincia: explicitProvincia,
    gremio: explicitGremio
  };
}

function normalizeProvinciaTag(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "all" || v === "hermanos_de_las_cenizas") {
    return v;
  }
  return "";
}

function normalizeGremioTag(value) {
  const v = String(value || "").trim().toLowerCase();
  if (
    v === "all" ||
    v === "escenario_1" ||
    v === "escenario_2" ||
    v === "escenario_3"
  ) {
    return v;
  }
  return "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLabel(raw) {
  return escapeHtml(raw)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function goHome() {
  currentScreenId = "start";
  historyStack = [];
  pathLabels = [];
  render();
}

backBtn.addEventListener("click", goBack);
homeBtn.addEventListener("click", goHome);