import "./styles.css";
import { t, getLang, setLang, LANGUAGES, getContent } from "./i18n.js";

// Only shown to users still accessing from the old GitHub Pages origin
if (location.hostname.endsWith('github.io')) {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
    background: var(--panel-2); color: var(--ink);
    border-top: 1px solid var(--gold-line);
    padding: 10px 16px; font-family: 'Crimson Pro', serif; font-size: 15px;
    display: flex; align-items: center; justify-content: center; gap: 16px;
  `;
  banner.innerHTML = `
    <span>Nos hemos mudado a <strong style="color:var(--accent)">arkham.voicesfromover.com</strong> — reinstala la app desde ahí para seguir recibiendo actualizaciones.</span>
    <button onclick="this.parentElement.remove()" style="
      background: none; border: 1px solid var(--gold-line); color: var(--muted);
      cursor: pointer; padding: 2px 8px; font-family: inherit; border-radius: 3px;
    ">✕</button>
  `;
  document.body.appendChild(banner);
}

// ── Locale data ──────────────────────────────────────────────────────────────
let appData = getContent().appData;
let SOUNDTRACK = getContent().soundtrack;

const screenEl = document.getElementById("screen");
const sidebarEl = document.getElementById("sidebar");

// ── Navegación jerárquica ────────────────────────────────────────────────────
// El contenido es un árbol  sección(campaña|standalone) → escenario → componente
// → items(narraciones). Cada nodo del menú lateral se identifica con claves de
// cadena estables; las etiquetas mostradas viven en los propios datos (títulos).
const NAV_SEP = "|";
const INTRO_COMPONENT = "__intro__";
// Hoja de navegación especial: "índice" de un escenario (todos sus componentes).
const OVERVIEW_COMPONENT = "__overview__";
// Hoja especial: teaser "próximamente" de una sección aún sin contenido.
const SOON_COMPONENT = "__soon__";
// Hoja especial: portada de la campaña ("de qué va"), distinta de la intro narrada.
const ABOUT_COMPONENT = "__about__";

const allSections = () => [...(appData.campaigns || []), ...(appData.standalone || [])];

function findSection(nav) {
  if (!nav) return null;
  return allSections().find((s) => s.type === nav.sectionType && s.id === nav.sectionId) || null;
}

// Claves de despliegue (nodos plegables del árbol lateral).
const sectionToggleKey = (type, id) => ["sec", type, id].join(NAV_SEP);
const scenarioToggleKey = (type, id, scnId) => ["scn", type, id, scnId].join(NAV_SEP);

// Clave de selección (hoja de navegación: un componente, o la intro de campaña).
function navId(nav) {
  return ["nav", nav.sectionType, nav.sectionId, nav.scenarioId || "", nav.componentType || ""].join(NAV_SEP);
}
function parseNavId(str) {
  const [, sectionType, sectionId, scenarioId, componentType] = String(str).split(NAV_SEP);
  return {
    sectionType,
    sectionId,
    scenarioId: scenarioId || null,
    componentType: componentType || null,
  };
}

// Resuelve una hoja de navegación a { scenario, componentTitle, groups[], isOverview? }.
// Cada group = { type, title, nav, items } → 1 group para un componente/intro,
// N groups (todos los componentes en orden) para el índice de un escenario.
function resolveNavItems(nav) {
  const section = findSection(nav);
  if (!section) return null;

  if (nav.componentType === SOON_COMPONENT) {
    return { isSoon: true, scenario: null, componentTitle: section.title, groups: [] };
  }

  if (nav.componentType === ABOUT_COMPONENT) {
    return { isAbout: true, scenario: null, componentTitle: section.title, groups: [] };
  }

  if (nav.componentType === INTRO_COMPONENT) {
    if (!section.intro) return null;
    return {
      scenario: null,
      componentTitle: section.intro.title,
      groups: [{ type: "introduccion", title: section.intro.title, nav, items: section.intro.items || [] }]
    };
  }

  // Standalone sin escenarios: los componentes están directamente en la sección.
  if (section.type === "standalone" && section.components && !nav.scenarioId) {
    if (nav.componentType === OVERVIEW_COMPONENT) {
      const groups = section.components.map((c) => ({
        type: c.type,
        title: c.title,
        nav: { sectionType: nav.sectionType, sectionId: nav.sectionId, scenarioId: null, componentType: c.type },
        items: c.items || []
      }));
      return { scenario: null, componentTitle: section.title, isOverview: true, groups };
    }

    const comp = section.components.find((c) => c.type === nav.componentType);
    if (!comp) return null;
    return {
      scenario: null,
      componentTitle: comp.title,
      groups: [{ type: comp.type, title: comp.title, nav, items: comp.items || [] }]
    };
  }

  const scenario = section.scenarios?.find((s) => s.id === nav.scenarioId);
  if (!scenario) return null;

  if (nav.componentType === OVERVIEW_COMPONENT) {
    const groups = (scenario.components || []).map((c) => ({
      type: c.type,
      title: c.title,
      nav: { sectionType: nav.sectionType, sectionId: nav.sectionId, scenarioId: scenario.id, componentType: c.type },
      items: c.items || []
    }));
    return { scenario, componentTitle: scenario.title, isOverview: true, groups };
  }

  const comp = scenario.components?.find((c) => c.type === nav.componentType);
  if (!comp) return null;
  return {
    scenario,
    componentTitle: comp.title,
    groups: [{ type: comp.type, title: comp.title, nav, items: comp.items || [] }]
  };
}

function trackAudioPlay(node) {
  if (!node || typeof gtag !== "function") return;
  const audioName = node.audioSrc
    ? node.audioSrc.split("/").pop().replace(/\.[^.]+$/, "")
    : "—";
  gtag("event", "audio_play", {
    event_category: "audio",
    campana:   node.tags?.campaignTitle || "—",
    escenario: node.tags?.scenarioTitle || "—",
    panel:     node.title || "—",
    audio:     audioName,
  });
}

// Imagen de cabecera de la landing. Pon "" para volver al placeholder "ASSET HERE".
const WELCOME_BANNER_SRC = "images/general_banner_01.webp";

// Email de contacto que aparece en el pie de la landing.
const CONTACT_EMAIL = "overmalo@gmail.com";
const RINCON_URL = "https://rinconmiskatonic.org/";

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
  // Selector de tema: círculo medio relleno (glifo de "contraste/tema")
  theme:         `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="8" cy="8" r="6.4"/><path d="M8 1.6 A6.4 6.4 0 0 1 8 14.4 Z" fill="currentColor" stroke="none"/></svg>`,
};

function loadState() {
  try {
    const saved = localStorage.getItem("ahlcg_audio:navState");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    selectedNav: null,
    expandedNav: [],
    revealedDescriptions: [],
    autoPlay: true,
    playbackRate: 1,
    stEnabled: false
  };
}

function saveState() {
  localStorage.setItem(
    "ahlcg_audio:navState",
    JSON.stringify({
      view,
      selectedNav,
      expandedNav: [...expandedNav],
      expandedPanels: [...expandedPanels],
      revealedDescriptions: [...revealedDescriptions],
      autoPlay,
      playbackRate,
      stEnabled,
      stVolume,
      stCurrentTrack,
      stCurrentTime: stAudio?.currentTime ?? 0
    })
  );
}

// Normaliza la hoja de navegación guardada (tolera estados antiguos → null).
function sanitizeSelectedNav(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.sectionType !== "string" || typeof raw.sectionId !== "string") return null;
  return {
    sectionType: raw.sectionType,
    sectionId: raw.sectionId,
    scenarioId: typeof raw.scenarioId === "string" ? raw.scenarioId : null,
    componentType: typeof raw.componentType === "string" ? raw.componentType : null
  };
}

const state = loadState();
let selectedNav = sanitizeSelectedNav(state.selectedNav);
let expandedNav = new Set(Array.isArray(state.expandedNav) ? state.expandedNav : []);
let expandedPanels = new Set(Array.isArray(state.expandedPanels) ? state.expandedPanels : []);
let revealedDescriptions = new Set(Array.isArray(state.revealedDescriptions) ? state.revealedDescriptions : []);
let autoPlay = typeof state.autoPlay === "boolean" ? state.autoPlay : true;
let playbackRate = [1, 1.15, 1.25, 1.5].includes(state.playbackRate) ? state.playbackRate : 1;
let stEnabled = typeof (state.stEnabled ?? state.ytEnabled) === "boolean" ? (state.stEnabled ?? state.ytEnabled) : false;

// Vista activa: "inicio" (bienvenida) o "narraciones"
let view = state.view === "narraciones" ? "narraciones" : "inicio";

// Si el estado restaurado dice "narraciones" pero no hay hoja válida, vuelve a inicio.
if (view === "narraciones" && !resolveNavItems(selectedNav)) {
  view = "inicio";
  selectedNav = null;
}

/** @type {null | { rafId: number, panelEl: HTMLAudioElement, ambientEl: HTMLAudioElement|null, hasAmbient: boolean, totalDuration: number, playerEl: HTMLElement, isSeeking: boolean }} */
let activePlayer = null;

// contentTree = hojas (narraciones) del componente actualmente seleccionado.
let contentTree = buildLeavesForNav(selectedNav);
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

// Gobierna el buscador de narraciones (vive al INICIO del área de contenido, no en
// la topbar) y el texto contextual de la topbar. El buscador solo aparece en
// pantallas con narraciones (no en Inicio, portada de campaña ni "próximamente").
function syncTopbarSearchAvailability() {
  const enabled = view === "narraciones" && contentTree.length > 0;

  const searchWrap = document.getElementById("content-search");
  if (searchWrap) searchWrap.hidden = !enabled;
  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput) {
    cardSearchInput.disabled = !enabled;
    cardSearchInput.setAttribute("aria-disabled", enabled ? "false" : "true");
    if (!enabled && cardSearchInput.value) cardSearchInput.value = "";
  }

  // La topbar muestra el contexto: la sección actual, o el texto por defecto.
  const topbarProvinceHint = document.getElementById("topbar-province-hint");
  if (topbarProvinceHint) {
    const section = view === "narraciones" && selectedNav ? findSection(selectedNav) : null;
    topbarProvinceHint.hidden = false;
    topbarProvinceHint.textContent = section ? section.title : t("topbar.selectSectionHint");
  }
}

function goToInicio() {
  view = "inicio";
  selectedNav = null;
  expandedNav.clear();          // volver a Inicio colapsa todo el árbol
  resetCardSearch();
  stopActivePlayer();
  rebuildContentTree();
  saveState();
  render();
}

// Reconstruye las hojas del componente seleccionado y sus índices asociados.
function rebuildContentTree() {
  contentTree = buildLeavesForNav(selectedNav);
  accordionIndex = buildAccordionIndex(contentTree);
  cardLabelMap = buildCardLabelMap();
}

// Colapsa las demás secciones (campañas / escenarios independientes) y sus
// escenarios: acordeón de nivel superior, solo una campaña abierta a la vez.
function collapseOtherSections(keepType, keepId) {
  for (const s of allSections()) {
    if (s.type === keepType && s.id === keepId) continue;
    expandedNav.delete(sectionToggleKey(s.type, s.id));
    for (const sc of s.scenarios || []) {
      expandedNav.delete(scenarioToggleKey(s.type, s.id, sc.id));
    }
  }
}

// Colapsa los escenarios hermanos (acordeón: solo uno abierto a la vez).
function collapseSiblingScenarios(sectionType, sectionId, keepScenarioId) {
  const section = findSection({ sectionType, sectionId });
  if (!section) return;
  for (const sc of section.scenarios || []) {
    if (sc.id !== keepScenarioId) {
      expandedNav.delete(scenarioToggleKey(sectionType, sectionId, sc.id));
    }
  }
}

// Asegura que la ruta (sección → escenario) de una hoja esté desplegada,
// colapsando de paso los demás escenarios de esa sección.
function ensureNavExpanded(nav) {
  if (!nav) return;
  collapseOtherSections(nav.sectionType, nav.sectionId);
  expandedNav.add(sectionToggleKey(nav.sectionType, nav.sectionId));
  if (nav.scenarioId) {
    collapseSiblingScenarios(nav.sectionType, nav.sectionId, nav.scenarioId);
    expandedNav.add(scenarioToggleKey(nav.sectionType, nav.sectionId, nav.scenarioId));
  } else if (nav.componentType !== ABOUT_COMPONENT) {
    // Introducción narrada a nivel campaña: vuelve a la raíz → colapsa escenarios.
    // La portada/general (ABOUT) NO colapsa: deja el árbol como lo tiene el usuario.
    collapseSiblingScenarios(nav.sectionType, nav.sectionId, null);
  }
}

// Selecciona un componente (o la intro de campaña) y muestra sus narraciones.
function selectNav(nav) {
  if (!resolveNavItems(nav)) return;
  selectedNav = nav;
  view = "narraciones";
  resetCardSearch();
  stopActivePlayer();
  expandedPanels = new Set();
  ensureNavExpanded(nav);
  rebuildContentTree();
  saveState();
  render();
  // El menú NO se cierra al navegar (móvil): lo cierra el usuario con la X, el
  // overlay o Escape. Así se puede saltar entre apartados sin reabrirlo cada vez.
}

// Click en un escenario desde el árbol lateral: SIEMPRE entra en su índice y lo
// deja desplegado, colapsando los escenarios hermanos (acordeón de uno abierto).
// Nunca se colapsa a sí mismo aunque ya estuviera abierto: volver a pulsarlo (o
// pulsar su cabecera tras entrar en un componente) reabre su índice sin plegarlo.
function toggleScenario(overviewNav) {
  selectNav(overviewNav);
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
  if (!SOUNDTRACK.length) { musicBarEl.innerHTML = ""; musicBarEl.hidden = true; return; }
  musicBarEl.hidden = false;
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
  if (!SOUNDTRACK.length) return;
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
// Barra de reproducción (autoplay + velocidad), bajo la de música.
const playbackBarEl = document.getElementById("playback-bar");

// Controles globales de reproducción (autoplay + velocidad de narración),
// en la barra superior. Se re-renderiza en cada render() → bindConfigEvents
// engancha sobre elementos frescos (sin listeners duplicados).
function renderPlaybackBar() {
  if (!playbackBarEl) return;
  const speedChips = [1.00, 1.15, 1.25, 1.5].map((rate) => {
    const active = playbackRate === rate;
    return `<button type="button" class="checkable-chip${active ? " checkable-chip--active" : ""}" data-config-rate="${rate}" aria-pressed="${active ? "true" : "false"}"><span class="checkable-chip-mark" aria-hidden="true">${active ? ICONS.dotFilled : ICONS.dotEmpty}</span><span>${rate.toFixed(2)}x</span></button>`;
  }).join("");

  playbackBarEl.innerHTML = `
    <div class="pb-inner" role="group" aria-label="${escapeAttribute(t("sidebar.playback"))}">
      <span class="pb-label">${escapeHtml(t("sidebar.playback"))}</span>
      <label class="pb-autoplay">
        <input type="checkbox" id="autoplay-checkbox" class="autoplay-checkbox"${autoPlay ? " checked" : ""}>
        <span>${escapeHtml(t("sidebar.autoplay"))}</span>
      </label>
      <div class="pb-speed">${speedChips}</div>
    </div>
  `;
}

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
      renderThemeSwitcher();
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

// ── Theme switcher ────────────────────────────────────────────────────────
// 3 temas: "green" (Verde tentacular, por defecto), "cosmic" (Púrpura cósmico),
// "light" (Claridad psícopata). Solo cambian tokens CSS vía [data-theme] en :root.
// El swatch es un color representativo de cada tema (se pinta inline).
const THEMES = [
  { code: "green",  swatch: "#64a596" },
  { code: "cosmic", swatch: "#a98fe0" },
  { code: "light",  swatch: "#e8dcbf" },
];
const DEFAULT_THEME = "green";
const THEME_BAR_COLOR = { green: "#0f1a17", cosmic: "#0e0b1a", light: "#d8ccac" };
const themeSwitcherEl = document.getElementById("theme-switcher");
let themeMenuOpen = false;

function loadTheme() {
  try {
    const stored = localStorage.getItem("ahlcg_audio:theme");
    if (stored === "cosmic" || stored === "light" || stored === "green") return stored;
  } catch {}
  return DEFAULT_THEME;
}
let currentTheme = loadTheme();

function applyTheme(theme) {
  currentTheme = theme;
  const root = document.documentElement;
  // "green" es el tema base (:root), sin atributo; los demás activan su bloque.
  if (theme === "green") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try { localStorage.setItem("ahlcg_audio:theme", theme); } catch {}
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_BAR_COLOR[theme] || THEME_BAR_COLOR.green);
}

function renderThemeSwitcher() {
  if (!themeSwitcherEl) return;
  const options = THEMES.map((th) => {
    const isCurrent = th.code === currentTheme;
    return `<button type="button" class="theme-option" role="menuitemradio" aria-checked="${isCurrent ? "true" : "false"}" data-theme-code="${escapeAttribute(th.code)}"><span class="theme-option-swatch" style="background:${th.swatch}" aria-hidden="true"></span><span class="theme-option-name">${escapeHtml(t("themes." + th.code))}</span><span class="theme-option-mark" aria-hidden="true">${isCurrent ? ICONS.diamondFilled : ICONS.diamondEmpty}</span></button>`;
  }).join("");
  const btnLabel = `${t("themeSwitcher.label")}. ${t("themeSwitcher.current", { name: t("themes." + currentTheme) })}`;

  themeSwitcherEl.innerHTML = `
    <button type="button" class="theme-btn" id="theme-btn" aria-haspopup="menu" aria-expanded="${themeMenuOpen ? "true" : "false"}" aria-label="${escapeAttribute(btnLabel)}">
      <span aria-hidden="true">${ICONS.theme}</span>
    </button>
    <div class="theme-menu" id="theme-menu" role="menu" aria-label="${escapeAttribute(t("themeSwitcher.menuLabel"))}"${themeMenuOpen ? "" : " hidden"}>
      ${options}
    </div>
  `;
  bindThemeSwitcherEvents();
}

function bindThemeSwitcherEvents() {
  const btn = document.getElementById("theme-btn");
  const menu = document.getElementById("theme-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    themeMenuOpen = !themeMenuOpen;
    menu.hidden = !themeMenuOpen;
    btn.setAttribute("aria-expanded", themeMenuOpen ? "true" : "false");
    if (themeMenuOpen) menu.querySelector(".theme-option")?.focus();
  });

  menu.querySelectorAll("[data-theme-code]").forEach((opt) => {
    opt.addEventListener("click", () => {
      const code = opt.dataset.themeCode;
      themeMenuOpen = false;
      if (code && code !== currentTheme) applyTheme(code);
      renderThemeSwitcher();
      document.getElementById("theme-btn")?.focus();
    });
  });
}

function closeThemeMenu() {
  if (!themeMenuOpen) return;
  themeMenuOpen = false;
  document.getElementById("theme-menu")?.setAttribute("hidden", "");
  document.getElementById("theme-btn")?.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", (event) => {
  if (langMenuOpen && langSwitcherEl && !langSwitcherEl.contains(event.target)) closeLangMenu();
  if (themeMenuOpen && themeSwitcherEl && !themeSwitcherEl.contains(event.target)) closeThemeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && langMenuOpen) {
    closeLangMenu();
    document.getElementById("lang-btn")?.focus();
  }
  if (event.key === "Escape" && themeMenuOpen) {
    closeThemeMenu();
    document.getElementById("theme-btn")?.focus();
  }
});

function reloadContent() {
  appData = getContent().appData;
  SOUNDTRACK = getContent().soundtrack;
  if (view === "narraciones" && !resolveNavItems(selectedNav)) {
    view = "inicio";
    selectedNav = null;
  }
  rebuildContentTree();
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
  if (topbarProvinceHint) topbarProvinceHint.textContent = t("topbar.selectSectionHint");
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

applyTheme(currentTheme);
applyStaticI18n();
renderLangSwitcher();
renderThemeSwitcher();
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
  renderPlaybackBar();

  if (view === "inicio") {
    screenEl.setAttribute("aria-label", t("a11y.screenWelcome"));
    screenEl.innerHTML = renderWelcome();
    bindFilterEvents();
    bindConfigEvents();
    return;
  }

  screenEl.setAttribute("aria-label", t("a11y.screenNarrations"));

  const resolved = selectedNav ? resolveNavItems(selectedNav) : null;
  const section = selectedNav ? findSection(selectedNav) : null;

  let bodyHtml;
  if (!resolved) {
    bodyHtml = `<div class="empty-screen">${escapeHtml(t("content.selectSection"))}</div>`;
  } else if (resolved.isSoon) {
    bodyHtml = renderSoon(section);
  } else if (resolved.isAbout) {
    bodyHtml = renderAbout(section);
  } else if (resolved.isOverview) {
    // Índice del escenario: cada componente como sección titulada con sus narraciones.
    const groupsHtml = resolved.groups.map(renderOverviewGroup).filter(Boolean).join("");
    bodyHtml = groupsHtml || `<div class="empty-screen">${escapeHtml(t("content.noMatches"))}</div>`;
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

  const crumbParts = [];
  if (section && !resolved?.isSoon && !resolved?.isAbout) crumbParts.push(section.title);
  if (resolved && !resolved.isOverview && !resolved.isSoon && resolved.scenario) crumbParts.push(resolved.scenario.title);
  const breadcrumb = resolved?.isSoon
    ? `<p class="description breadcrumb">${escapeHtml(t("content.comingSoonLead"))}</p>`
    : resolved?.isAbout
    ? `<p class="description breadcrumb">${escapeHtml(t("content.aboutLead"))}</p>`
    : (crumbParts.length ? `<p class="description breadcrumb">${crumbParts.map(escapeHtml).join(" &rsaquo; ")}</p>` : "");
  const headTitle = resolved
    ? (resolved.isOverview ? (resolved.scenario?.title || section?.title || t("app.campaignTitle")) : resolved.componentTitle)
    : t("app.campaignTitle");

  // Banner de la sección (campaña / escenario independiente) en lo alto del contenido.
  // En la portada de campaña ("de qué va") usa el formato hero, más grande.
  // El banner encabeza el contenido (siempre visible al entrar): carga inmediata
  // (eager) y prioridad alta para que aparezca cuanto antes y no se quede en blanco.
  const bannerHtml = section?.banner
    ? `<div class="content-banner${resolved?.isAbout ? " content-banner--hero" : ""}"><img class="content-banner-img" src="${escapeAttribute(audioUrl(section.banner))}" alt="${escapeAttribute(section.title)}" loading="eager" fetchpriority="high" decoding="async"></div>`
    : "";

  screenEl.innerHTML = `
    ${bannerHtml}
    <div class="single-screen-head">
      <h2>${escapeHtml(headTitle)}</h2>
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

// Página "próximamente" de una sección. Para secciones sin contenido (oficiales
// aún sin narrar) es solo el aviso. Para escenarios fanmade muestra además su
// descripción (`about`) y el enlace de descarga (`download`), ya que el material
// existe y es jugable aunque las narraciones en audio estén por llegar.
function renderSoon(section) {
  const hasContent = !!(section?.about || section?.download);
  const parts = [];
  if (section?.about) parts.push(renderAbout(section));
  if (section?.download?.url) {
    const label = section.download.label || section.download.url;
    parts.push(
      `<p class="fanmade-download">${escapeHtml(t("content.fanmadeDownloadLead"))} ` +
      `<a href="${escapeAttribute(section.download.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></p>`
    );
  }
  const note = hasContent ? t("content.fanmadeAudioSoon") : t("content.comingSoonBody");
  parts.push(`<p class="soon-teaser">${escapeHtml(note)}</p>`);
  return parts.join("");
}

// Portada de campaña: prosa "de qué va" (campo `about` en los datos: string o
// array de párrafos). Distinta de la introducción narrada del escenario.
function renderAbout(section) {
  const about = section?.about;
  const paras = Array.isArray(about) ? about : (about ? [about] : []);
  const html = paras.length
    ? paras.map((p) => `<p class="about-paragraph">${escapeHtml(p)}</p>`).join("")
    : `<p class="about-paragraph about-paragraph--muted">${escapeHtml(t("content.aboutEmpty"))}</p>`;
  return `<div class="about-content">${html}</div>`;
}

function renderWelcome() {
  const features = t("welcome.features");
  const featuresHtml = (Array.isArray(features) ? features : [])
    .map((f) => `<li><strong>${escapeHtml(f.term)}</strong> ${escapeHtml(f.desc)}</li>`)
    .join("");

  const bannerHtml = WELCOME_BANNER_SRC
    ? `<div class="content-banner content-banner--hero"><img class="content-banner-img" src="${escapeAttribute(import.meta.env.BASE_URL + WELCOME_BANNER_SRC)}" alt="${escapeAttribute(t("welcome.bannerAlt"))}" loading="eager" fetchpriority="high" decoding="async"></div>`
    : `<div class="welcome-banner" role="img" aria-label="${escapeAttribute(t("welcome.bannerAria"))}">
        <span class="welcome-banner-label">${escapeHtml(t("welcome.bannerLabel"))}</span>
      </div>`;

  return `
    <div class="welcome">
      ${bannerHtml}
      <div class="welcome-intro">
        <h2>${escapeHtml(t("welcome.appTitle"))}</h2>
        <p class="welcome-lead">${escapeHtml(t("welcome.lead"))}</p>
        <p class="welcome-text">${escapeHtml(t("welcome.intro"))}</p>
        <h3 class="welcome-features-title">${escapeHtml(t("welcome.featuresTitle"))}</h3>
        <ul class="welcome-features">
          ${featuresHtml}
        </ul>
        <p class="welcome-text welcome-note">${escapeHtml(t("welcome.note"))}</p>
      </div>
      <footer class="welcome-footer">
        <p>${escapeHtml(t("welcome.footerDevLead"))} <a href="${RINCON_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("welcome.footerDevStudio"))}</a>.</p>
        <p>${escapeHtml(t("welcome.footerCredits"))}</p>
        <p>${escapeHtml(t("welcome.footerDisclaimer"))}</p>
        <p>${escapeHtml(t("welcome.footerContact"))} <a href="mailto:${CONTACT_EMAIL}">${escapeHtml(CONTACT_EMAIL)}</a></p>
      </footer>
    </div>
  `;
}

function renderSidebar() {
  const inicioActive = view === "inicio";
  const campaigns = appData.campaigns || [];
  const standalone = appData.standalone || [];

  const campaignsHtml = renderOriginSubgroups(campaigns);
  const standaloneHtml = renderOriginSubgroups(standalone);

  return `
    <nav class="sidebar-nav" aria-label="${escapeAttribute(t("a11y.sidebarNav"))}">
      <button type="button" class="sidebar-close" data-sidebar-close aria-label="${escapeAttribute(t("a11y.closeSidebar"))}">${ICONS.close}</button>
      <div class="sidebar-section">
        <div class="sidebar-nav-list">
          <button type="button" class="sidebar-nav-item${inicioActive ? " sidebar-nav-item--active" : ""}" data-nav-view="inicio" aria-current="${inicioActive ? "page" : "false"}"><span class="sidebar-nav-dot" aria-hidden="true">${inicioActive ? ICONS.diamondFilled : ICONS.diamondEmpty}</span><span class="sidebar-nav-text">${escapeHtml(t("sidebar.home"))}</span></button>
        </div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.campaignGroup"))}</h3>
        <p class="sidebar-section-hint">${escapeHtml(t("sidebar.navHint"))}</p>
        <div class="sidebar-origins">${campaignsHtml}</div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.standaloneGroup"))}</h3>
        <div class="sidebar-origins">${standaloneHtml}</div>
      </div>
    </nav>
  `;
}

// Subdivide una lista de secciones (campañas o escenarios independientes) en dos
// subgrupos por procedencia — "Oficial" y "Fanmade" — cada uno con su subtítulo.
// El origen por defecto (sin campo `origin`) es "oficial".
function renderOriginSubgroups(sections) {
  const oficial = sections.filter((s) => (s.origin || "oficial") === "oficial");
  const fanmade = sections.filter((s) => s.origin === "fanmade");
  const block = (headingKey, list) => `
    <div class="sidebar-origin">
      <h4 class="sidebar-subheading">${escapeHtml(t(headingKey))}</h4>
      ${list.length
        ? `<div class="sidebar-nav-list sidebar-nav-tree">${list.map(renderSectionNode).join("")}</div>`
        : `<p class="sidebar-section-hint sidebar-section-hint--sub">${escapeHtml(t("sidebar.standaloneEmpty"))}</p>`}
    </div>`;
  return block("sidebar.originOfficial", oficial) + block("sidebar.originFanmade", fanmade);
}

// Nodo de sección (campaña / escenario independiente): plegable; intro + escenarios.
function renderSectionNode(section) {
  if (section.comingSoon) {
    const soonNav = { sectionType: section.type, sectionId: section.id, scenarioId: null, componentType: SOON_COMPONENT };
    const active = view === "narraciones" && selectedNav && navId(selectedNav) === navId(soonNav);
    return `
      <button type="button" class="sidebar-nav-item sidebar-nav-item--section sidebar-nav-item--soon${active ? " sidebar-nav-item--active" : ""}" data-nav-select="${escapeAttribute(navId(soonNav))}" aria-current="${active ? "page" : "false"}">
        <span class="sidebar-nav-dot" aria-hidden="true">${active ? ICONS.diamondFilled : ICONS.diamondEmpty}</span>
        <span class="sidebar-nav-soon-body">
          <span class="sidebar-nav-text">${escapeHtml(section.title)}</span>
          <span class="soon-badge">${escapeHtml(t("sidebar.comingSoon"))}</span>
        </span>
      </button>
    `;
  }
  const key = sectionToggleKey(section.type, section.id);
  const open = expandedNav.has(key);
  const caret = open ? ICONS.caretUp : ICONS.caretDown;
  // La cabecera de campaña abre su portada ("de qué va") y despliega el árbol.
  const aboutNav = { sectionType: section.type, sectionId: section.id, scenarioId: null, componentType: ABOUT_COMPONENT };
  const active = view === "narraciones" && selectedNav && navId(selectedNav) === navId(aboutNav);

  let childrenHtml = "";
  if (open) {
    const introHtml = section.intro
      ? renderNavLeaf(
          { sectionType: section.type, sectionId: section.id, scenarioId: null, componentType: INTRO_COMPONENT },
          section.intro.title
        )
      : "";

    let bodyHtml;
    // Standalone con componentes directos (sin escenarios).
    if (section.type === "standalone" && section.components) {
      bodyHtml = (section.components || [])
        .map((c) =>
          renderNavLeaf(
            { sectionType: section.type, sectionId: section.id, scenarioId: null, componentType: c.type },
            c.title
          )
        )
        .join("");
    } else {
      bodyHtml = (section.scenarios || []).map((sc) => renderScenarioNode(section, sc)).join("");
    }

    childrenHtml = `<div class="sidebar-nav-list sidebar-nav-list--filter">${introHtml}${bodyHtml}</div>`;
  }

  return `
    <button type="button" class="sidebar-nav-item sidebar-nav-item--section${active ? " sidebar-nav-item--active" : ""}" data-nav-toggle="${escapeAttribute(key)}" data-nav-about="${escapeAttribute(navId(aboutNav))}" aria-expanded="${open ? "true" : "false"}" aria-current="${active ? "page" : "false"}">
      <span class="sidebar-nav-dot" aria-hidden="true">${caret}</span>
      <span class="sidebar-nav-text">${escapeHtml(section.title)}</span>
    </button>
    ${childrenHtml}
  `;
}

// Nodo de escenario: al pulsarlo muestra su índice (todos los componentes) y se
// despliega en el árbol; contiene sus componentes como sub-hojas seleccionables.
function renderScenarioNode(section, scenario) {
  const key = scenarioToggleKey(section.type, section.id, scenario.id);
  const open = expandedNav.has(key);
  const caret = open ? ICONS.caretUp : ICONS.caretDown;
  const overviewNav = { sectionType: section.type, sectionId: section.id, scenarioId: scenario.id, componentType: OVERVIEW_COMPONENT };
  const active = view === "narraciones" && selectedNav && navId(selectedNav) === navId(overviewNav);

  let childrenHtml = "";
  if (open) {
    const comps = (scenario.components || [])
      .map((c) =>
        renderNavLeaf(
          { sectionType: section.type, sectionId: section.id, scenarioId: scenario.id, componentType: c.type },
          c.title
        )
      )
      .join("");
    childrenHtml = `<div class="sidebar-nav-list sidebar-nav-list--filter">${comps}</div>`;
  }

  return `
    <button type="button" class="sidebar-nav-item sidebar-nav-item--scenario${active ? " sidebar-nav-item--active" : ""}" data-nav-scenario="${escapeAttribute(navId(overviewNav))}" aria-expanded="${open ? "true" : "false"}" aria-current="${active ? "page" : "false"}">
      <span class="sidebar-nav-dot" aria-hidden="true">${caret}</span>
      <span class="sidebar-nav-text">${escapeHtml(scenario.title)}</span>
    </button>
    ${childrenHtml}
  `;
}

// Hoja de navegación seleccionable (un componente o la intro de campaña).
function renderNavLeaf(nav, label) {
  const id = navId(nav);
  const active = view === "narraciones" && selectedNav && navId(selectedNav) === id;
  return `<button type="button" class="sidebar-nav-item sidebar-nav-item--filter${active ? " sidebar-nav-item--active" : ""}" data-nav-select="${escapeAttribute(id)}" aria-current="${active ? "page" : "false"}"><span class="sidebar-nav-dot sidebar-nav-dot--check" aria-hidden="true">${active ? ICONS.diamondFilled : ICONS.diamondEmpty}</span><span class="sidebar-nav-text">${escapeHtml(label)}</span></button>`;
}

// Grupo del índice de escenario: título de sección (enlace a esa sección) + narraciones.
function renderOverviewGroup(group) {
  const leaves = contentTree.filter((n) => n.tags.component === group.type);
  const visible = cardSearchQuery ? leaves.filter((n) => matchesFilters(n)) : leaves;
  if (!visible.length) return "";
  const panels = visible.map((node) => renderPanel(node, 0)).join("");
  return `
    <section class="overview-group">
      <button type="button" class="overview-group-head" data-nav-select="${escapeAttribute(navId(group.nav))}">
        <span class="overview-group-title">${escapeHtml(group.title)}</span>
        <span class="overview-group-jump" aria-hidden="true">${ICONS.chevronRight}</span>
      </button>
      <div class="panel-children">${panels}</div>
    </section>
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
  document.querySelector("[data-sidebar-close]")?.addEventListener("click", () => {
    setSidebarOpen(false);
    sidebarToggleEl?.focus();
  });

  document.querySelectorAll("[data-nav-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.navView === "inicio") goToInicio();
    });
  });

  // Cabecera de campaña: colapsable. Cerrada → abre su portada ("de qué va") y
  // despliega el árbol; abierta → se pliega a mano (el centro no cambia).
  document.querySelectorAll("[data-nav-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.navToggle;
      if (!key) return;
      const aboutId = button.dataset.navAbout;
      const aboutNav = aboutId ? parseNavId(aboutId) : null;
      const onAbout = aboutNav && view === "narraciones" && selectedNav && navId(selectedNav) === navId(aboutNav);
      // Colapsa SOLO si ya está abierta y estás en su "general". Si estás dentro
      // de la campaña (viendo un componente), te lleva al general SIN colapsar.
      if (expandedNav.has(key) && onAbout) {
        expandedNav.delete(key);
        saveState();
        render();
      } else if (aboutNav) {
        selectNav(aboutNav);
      } else {
        expandedNav.add(key);
        saveState();
        render();
      }
    });
  });

  // Escenario: entrar en su índice (siempre despliega y colapsa hermanos).
  document.querySelectorAll("[data-nav-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleScenario(parseNavId(button.dataset.navScenario || ""));
    });
  });

  // Seleccionar una hoja de navegación (componente o intro de campaña).
  document.querySelectorAll("[data-nav-select]").forEach((button) => {
    button.addEventListener("click", () => {
      selectNav(parseNavId(button.dataset.navSelect || ""));
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

  bindMultiSegmentEvents();
}

// Bind play/seekbar events for multi-segment panels. Each segment player is
// independent; clicking play or interacting with a seekbar on a segment that
// is NOT the currently active player stops the active one and inits the new one.
function bindMultiSegmentEvents() {
  screenEl.querySelectorAll('.leaf-content--multi .custom-player').forEach((playerEl) => {
    if (playerEl.dataset.segBound === "true") return;
    playerEl.dataset.segBound = "true";

    const segId = playerEl.dataset.playerId;
    const leafId = playerEl.dataset.leafId;

    const playBtn = playerEl.querySelector("[data-player-play]");
    const seekbar = playerEl.querySelector("[data-player-seek]");

    function activateSegment(andPlay) {
      // If this segment is already the active player, delegate to normal play/pause.
      if (activePlayer && activePlayer.playerEl === playerEl) return false;

      // Stop whatever was playing before.
      stopActivePlayer();

      // Find audio elements for this segment.
      const contentEl = document.getElementById(`${leafId}-content`);
      if (!contentEl) return false;
      const panelAudio = contentEl.querySelector(`audio[data-seg-id="${CSS.escape(segId)}"][data-role="panel"]`);
      const ambientAudio = contentEl.querySelector(`audio[data-seg-id="${CSS.escape(segId)}"][data-role="ambient"]`);
      if (!panelAudio) return false;

      const node = findNodeById(contentTree, leafId);

      const doInit = () => {
        const panelDuration = panelAudio.duration;
        const totalDuration = ambientAudio ? panelDuration + 2 : panelDuration;
        initPlayer(contentEl, panelAudio, ambientAudio || null, totalDuration, panelDuration, node, playerEl);

        if (andPlay) {
          duckSTFade(() => {
            const p = activePlayer;
            if (!p) return;
            if (!p.playTracked) { trackAudioPlay(p.node); p.playTracked = true; }
            if (p.hasAmbient) {
              p.phaseStartMs = performance.now();
              ambientAudio.play().catch(() => {});
            } else {
              panelAudio.play().catch(() => {});
            }
            p.rafId = requestAnimationFrame(playerRaf);
            setPlayerBtnState(p.playerEl, true);
            p.playing = true;
            updateMediaSession(true);
          });
        }
      };

      if (isFinite(panelAudio.duration) && panelAudio.duration > 0) {
        doInit();
      } else {
        panelAudio.addEventListener("loadedmetadata", () => doInit(), { once: true });
      }
      return true;
    }

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        // If already active, handle play/pause toggle.
        if (activePlayer && activePlayer.playerEl === playerEl) {
          const p = activePlayer;
          if (p.phase === "ended" || p.panelEl.ended) {
            // Restart from beginning
            trackAudioPlay(p.node);
            p.playTracked = true;
            if (p.hasAmbient) {
              if (p.ambientEl) { p.ambientEl.volume = 0.25; p.ambientEl.currentTime = 0; }
              p.panelEl.currentTime = 0;
              p.phase = "pre-roll";
              p.preRollPosAtStart = 0;
              p.fadeOutPosAtStart = 0;
              p.phaseStartMs = performance.now();
              p.ambientEl?.play().catch(() => {});
            } else {
              p.panelEl.currentTime = 0;
              p.phase = "playing";
              p.panelEl.play().catch(() => {});
            }
            p.rafId = requestAnimationFrame(playerRaf);
            setPlayerBtnState(p.playerEl, true);
            p.playing = true;
            updateMediaSession(true);
            duckST();
          } else if (p.playing) {
            pauseActivePlayerInternal();
          } else {
            resumeActivePlayerInternal();
          }
          return;
        }
        activateSegment(true);
      });
    }

    if (seekbar) {
      seekbar.addEventListener("mousedown", () => {
        if (activePlayer && activePlayer.playerEl === playerEl) {
          activePlayer.isSeeking = true;
          return;
        }
        activateSegment(false);
      });
      seekbar.addEventListener("touchstart", () => {
        if (activePlayer && activePlayer.playerEl === playerEl) {
          activePlayer.isSeeking = true;
          return;
        }
        activateSegment(false);
      }, { passive: true });
      seekbar.addEventListener("input", () => {
        if (!activePlayer || activePlayer.playerEl !== playerEl) return;
        const vt = (parseInt(seekbar.value, 10) / 1000) * activePlayer.totalDuration;
        updatePlayerUI(activePlayer, vt);
      });
      seekbar.addEventListener("change", () => {
        if (!activePlayer || activePlayer.playerEl !== playerEl) return;
        activePlayer.isSeeking = false;
        const vt = (parseInt(seekbar.value, 10) / 1000) * activePlayer.totalDuration;
        seekPlayer(vt);
      });
    }
  });
}

function resolveAmbientSrc(nodeId) {
  const node = findNodeById(contentTree, nodeId);
  const campaignId = node?.tags?.campaign;

  const campaignAmbient = campaignId ? appData.ambientConfig?.campaigns?.[campaignId] : null;
  if (campaignAmbient) return campaignAmbient;

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
  setPlayerBtnState(activePlayer.playerEl, false);
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

function initPlayer(contentEl, panelEl, ambientEl, totalDuration, panelDuration, node, playerElOverride) {
  const playerEl = playerElOverride || contentEl.querySelector(".custom-player");
  if (!playerEl) return;

  const skipEventBinding = !!playerElOverride;

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

  if (!skipEventBinding) {
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
  } // end if (!skipEventBinding)
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
        // Multi-segment: find first segment's audio; single: find the only audio.
        const isMulti = !!node.segments;
        let panelEl, ambientEl, playerEl;

        if (isMulti) {
          const firstSegId = `${node.id}__seg0`;
          panelEl = contentEl.querySelector(`audio[data-seg-id="${CSS.escape(firstSegId)}"][data-role="panel"]`);
          ambientEl = contentEl.querySelector(`audio[data-seg-id="${CSS.escape(firstSegId)}"][data-role="ambient"]`);
          playerEl = contentEl.querySelector(`.custom-player[data-player-id="${CSS.escape(firstSegId)}"]`);
        } else {
          panelEl = contentEl.querySelector('audio[data-role="panel"]');
          ambientEl = contentEl.querySelector('audio[data-role="ambient"]');
          playerEl = contentEl.querySelector('.custom-player');
        }

        if (!panelEl) return;

        const setupAndStart = () => {
          const panelDuration = panelEl.duration;
          const totalDuration = ambientEl ? panelDuration + 2 : panelDuration;
          initPlayer(contentEl, panelEl, ambientEl || null, totalDuration, panelDuration, node, isMulti ? playerEl : undefined);
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
  // Clear multi-segment text reveal states for this panel.
  for (const key of revealedDescriptions) {
    if (key.startsWith(panelId + "__text")) revealedDescriptions.delete(key);
  }
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
  if (node.segments) {
    return renderMultiSegmentContent(node);
  }

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

function renderMultiSegmentContent(node) {
  const isOpen = expandedPanels.has(node.id);
  const rawAmbientSrc = (isOpen && !(stAudio && !stAudio.paused)) ? resolveAmbientSrc(node.id) : null;
  const ambientSrc = audioUrl(rawAmbientSrc);

  let html = '<article class="leaf-content leaf-content--multi">';
  let audioIndex = 0;
  let textIndex = 0;

  for (const seg of node.segments) {
    if (seg.type === "text") {
      const textId = `${node.id}__text${textIndex}`;
      const boxedClass = seg.boxed ? " segment-block--boxed" : "";
      const titleHtml = seg.title ? `<strong class="segment-title">${renderLabel(seg.title)}</strong>` : "";
      const isRevealed = revealedDescriptions.has(textId);

      html += `<div class="segment-block${boxedClass}" data-segment-text-id="${escapeAttribute(textId)}">`;
      html += titleHtml;

      if (seg.content) {
        if (isRevealed) {
          html += `
            <div class="spoiler spoiler--revealed">
              <button type="button" class="spoiler-toggle-btn" data-reveal-description="${escapeAttribute(textId)}" aria-expanded="true">
                <span class="spoiler-preview-label">${escapeHtml(t("spoiler.hideLabel"))}</span>
                <span class="spoiler-caret" aria-hidden="true">${ICONS.caretUp}</span>
              </button>
              <p class="description leaf-description">${escapeHtml(seg.content)}</p>
            </div>
          `;
        } else {
          html += `
            <button type="button" class="spoiler spoiler-preview" data-reveal-description="${escapeAttribute(textId)}" aria-expanded="false">
              <span class="spoiler-preview-label">${escapeHtml(t("spoiler.label"))}</span>
              <span class="spoiler-lines" aria-hidden="true">
                <span class="spoiler-line"></span>
                <span class="spoiler-line"></span>
                <span class="spoiler-line"></span>
              </span>
            </button>
          `;
        }
      }

      html += `</div>`;
      textIndex++;
    } else if (seg.type === "audio") {
      const segId = `${node.id}__seg${audioIndex}`;
      const src = audioUrl(seg.src);
      const boxedClass = seg.boxed ? " segment-block--boxed" : "";
      const titleHtml = seg.title ? `<strong class="segment-title">${renderLabel(seg.title)}</strong>` : "";
      const audioTextId = `${node.id}__audiotext${audioIndex}`;

      html += `<div class="segment-block${boxedClass}" data-segment-text-id="${escapeAttribute(audioTextId)}">`;
      html += titleHtml;

      if (!src) {
        html += `<p class="empty">${escapeHtml(t("player.missingAudio"))}</p>`;
      } else {
        html += `
          <div class="custom-player" data-player-id="${escapeAttribute(segId)}" data-leaf-id="${escapeAttribute(node.id)}" data-seg-index="${audioIndex}">
            <button type="button" class="player-btn" data-player-play aria-label="${escapeAttribute(t("player.play"))}">${ICONS.play}</button>
            <div class="player-track">
              <input type="range" class="player-seekbar" data-player-seek min="0" max="1000" value="0" step="1" aria-label="${escapeAttribute(t("player.seek"))}" disabled>
              <div class="player-time">
                <span data-player-current>0:00</span>
                <span data-player-total>-:--</span>
              </div>
            </div>
          </div>
        `;
        if (isOpen) {
          html += `<audio preload="metadata" src="${escapeAttribute(src)}" data-role="panel" data-seg-id="${escapeAttribute(segId)}" hidden></audio>`;
          if (ambientSrc) {
            html += `<audio preload="metadata" src="${escapeAttribute(ambientSrc)}" data-role="ambient" data-seg-id="${escapeAttribute(segId)}" loop hidden></audio>`;
          }
        }
      }

      if (seg.content) {
        const isAudioTextRevealed = revealedDescriptions.has(audioTextId);
        if (isAudioTextRevealed) {
          html += `
            <div class="spoiler spoiler--revealed">
              <button type="button" class="spoiler-toggle-btn" data-reveal-description="${escapeAttribute(audioTextId)}" aria-expanded="true">
                <span class="spoiler-preview-label">${escapeHtml(t("spoiler.hideLabel"))}</span>
                <span class="spoiler-caret" aria-hidden="true">${ICONS.caretUp}</span>
              </button>
              <p class="description leaf-description">${escapeHtml(seg.content)}</p>
            </div>
          `;
        } else {
          html += `
            <button type="button" class="spoiler spoiler-preview" data-reveal-description="${escapeAttribute(audioTextId)}" aria-expanded="false">
              <span class="spoiler-preview-label">${escapeHtml(t("spoiler.label"))}</span>
              <span class="spoiler-lines" aria-hidden="true">
                <span class="spoiler-line"></span>
                <span class="spoiler-line"></span>
                <span class="spoiler-line"></span>
              </span>
            </button>
          `;
        }
      }

      html += `</div>`;
      audioIndex++;
    }
  }

  html += '</article>';
  return html;
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
  // Multi-segment text: IDs contain "__text" — re-render just that segment block.
  if (panelId.includes("__text")) {
    const blockEl = document.querySelector(`[data-segment-text-id="${CSS.escape(panelId)}"]`);
    if (!blockEl) return;
    const leafId = panelId.split("__text")[0];
    const node = findNodeById(contentTree, leafId);
    if (!node || !node.segments) return;
    const textIdx = parseInt(panelId.split("__text")[1], 10);
    let currentTextIdx = 0;
    let seg = null;
    for (const s of node.segments) {
      if (s.type === "text") {
        if (currentTextIdx === textIdx) { seg = s; break; }
        currentTextIdx++;
      }
    }
    if (!seg) return;

    const isRevealed = revealedDescriptions.has(panelId);
    const boxedClass = seg.boxed ? " segment-block--boxed" : "";
    const titleHtml = seg.title ? `<strong class="segment-title">${renderLabel(seg.title)}</strong>` : "";

    let innerHtml = titleHtml;
    if (seg.content) {
      if (isRevealed) {
        innerHtml += `
          <div class="spoiler spoiler--revealed">
            <button type="button" class="spoiler-toggle-btn" data-reveal-description="${escapeAttribute(panelId)}" aria-expanded="true">
              <span class="spoiler-preview-label">${escapeHtml(t("spoiler.hideLabel"))}</span>
              <span class="spoiler-caret" aria-hidden="true">${ICONS.caretUp}</span>
            </button>
            <p class="description leaf-description">${escapeHtml(seg.content)}</p>
          </div>
        `;
      } else {
        innerHtml += `
          <button type="button" class="spoiler spoiler-preview" data-reveal-description="${escapeAttribute(panelId)}" aria-expanded="false">
            <span class="spoiler-preview-label">${escapeHtml(t("spoiler.label"))}</span>
            <span class="spoiler-lines" aria-hidden="true">
              <span class="spoiler-line"></span>
              <span class="spoiler-line"></span>
              <span class="spoiler-line"></span>
            </span>
          </button>
        `;
      }
    }
    blockEl.className = `segment-block${boxedClass}`;
    blockEl.innerHTML = innerHtml;
    bindDescriptionRevealEvents();
    return;
  }

  // Multi-segment audio with content: IDs contain "__audiotext" — re-render just the spoiler part.
  if (panelId.includes("__audiotext")) {
    const blockEl = document.querySelector(`[data-segment-text-id="${CSS.escape(panelId)}"]`);
    if (!blockEl) return;
    const leafId = panelId.split("__audiotext")[0];
    const node = findNodeById(contentTree, leafId);
    if (!node || !node.segments) return;
    const audioIdx = parseInt(panelId.split("__audiotext")[1], 10);
    let currentAudioIdx = 0;
    let seg = null;
    for (const s of node.segments) {
      if (s.type === "audio") {
        if (currentAudioIdx === audioIdx) { seg = s; break; }
        currentAudioIdx++;
      }
    }
    if (!seg || !seg.content) return;

    const isRevealed = revealedDescriptions.has(panelId);
    // Re-render only the spoiler portion — keep existing player/title intact by replacing from spoiler onward.
    const existingSpoiler = blockEl.querySelector(".spoiler, .spoiler-preview");
    if (!existingSpoiler) return;

    let spoilerHtml = "";
    if (isRevealed) {
      spoilerHtml = `
        <div class="spoiler spoiler--revealed">
          <button type="button" class="spoiler-toggle-btn" data-reveal-description="${escapeAttribute(panelId)}" aria-expanded="true">
            <span class="spoiler-preview-label">${escapeHtml(t("spoiler.hideLabel"))}</span>
            <span class="spoiler-caret" aria-hidden="true">${ICONS.caretUp}</span>
          </button>
          <p class="description leaf-description">${escapeHtml(seg.content)}</p>
        </div>
      `;
    } else {
      spoilerHtml = `
        <button type="button" class="spoiler spoiler-preview" data-reveal-description="${escapeAttribute(panelId)}" aria-expanded="false">
          <span class="spoiler-preview-label">${escapeHtml(t("spoiler.label"))}</span>
          <span class="spoiler-lines" aria-hidden="true">
            <span class="spoiler-line"></span>
            <span class="spoiler-line"></span>
            <span class="spoiler-line"></span>
          </span>
        </button>
      `;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = spoilerHtml;
    existingSpoiler.replaceWith(tempDiv.firstElementChild);
    bindDescriptionRevealEvents();
    return;
  }

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
  return !cardSearchQuery || nodeMatchesSearch(node, cardSearchQuery);
}

// Construye las hojas (narraciones) de la selección, con la forma que espera el
// acordeón/reproductor central. Aplana todos los grupos (1 componente o el índice
// completo de un escenario). Sin selección válida → lista vacía.
function buildLeavesForNav(nav) {
  if (!nav) return [];
  const resolved = resolveNavItems(nav);
  const section = findSection(nav);
  if (!resolved || !section) return [];

  const leaves = [];
  for (const group of resolved.groups) {
    group.items.forEach((item, index) => {
      leaves.push({
        id: `leaf-${item.id || `${navId(group.nav)}-${index}`}`,
        type: "leaf",
        title: item.label || "",
        summary: "",
        contentTitle: "",
        description: item.text || "",
        audioSrc: item.audio || "",
        segments: item.segments || null,
        tags: {
          campaign: section.id,
          scenario: resolved.scenario?.id || "",
          campaignTitle: section.title,
          scenarioTitle: resolved.scenario?.title || section.title,
          component: group.type,
          componentTitle: group.title
        },
        children: []
      });
    });
  }
  return leaves;
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


