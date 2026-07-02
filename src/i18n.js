// ── i18n ─────────────────────────────────────────────────────────────────
// Registro central de idiomas. Cada idioma es una carpeta autocontenida en
// src/i18n/<code>/ (ui.json, manifest.json, soundtrack.json, data/), expuesta
// por su index.js.
//
// Para añadir un idioma:
//   1. Copia src/i18n/es/ a src/i18n/<code>/ y traduce su contenido.
//   2. Impórtalo aquí y añádelo a LANGUAGES y a LOCALES.
// El resto (selector, t(), getContent(), persistencia) funciona solo.

import es from "./i18n/es/index.js";

/** Idiomas disponibles, en el orden en que aparecen en el selector. */
export const LANGUAGES = [
  { code: "es", label: "ESP", name: "Español" },
  // { code: "en", label: "ENG", name: "English" },
];

/** Paquetes de cada idioma: { code, ui, manifest, soundtrack, appData }. */
const LOCALES = {
  es,
  // en,
};

const DEFAULT_LANG = "es";
const STORAGE_KEY = "ahlcg_audio:lang";

function isSupported(code) {
  return Boolean(code && LOCALES[code]);
}

function loadLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {}
  return DEFAULT_LANG;
}

let currentLang = loadLang();

export function getLang() {
  return currentLang;
}

export function setLang(code) {
  if (!isSupported(code)) return false;
  currentLang = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {}
  return true;
}

/** Devuelve el paquete completo del idioma actual (ui, manifest, soundtrack, appData). */
export function getContent() {
  return LOCALES[currentLang] || LOCALES[DEFAULT_LANG];
}

function resolve(messages, key) {
  return key.split(".").reduce((obj, part) => (obj == null ? undefined : obj[part]), messages);
}

/**
 * Traduce una clave de interfaz con notación de puntos, p. ej. t("sidebar.home").
 * Soporta interpolación con {param}: t("soundtrackPlayer.downloading", { pct: 50 }).
 * Si resuelve a un objeto/array (p. ej. welcome.features), lo devuelve tal cual.
 * Si falta en el idioma actual, recurre al idioma por defecto y, por último, a la clave.
 */
export function t(key, params) {
  let msg = resolve(getContent().ui, key);
  if (msg === undefined && currentLang !== DEFAULT_LANG) msg = resolve(LOCALES[DEFAULT_LANG].ui, key);
  if (msg === undefined) return key;

  if (typeof msg !== "string") return msg;

  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}
