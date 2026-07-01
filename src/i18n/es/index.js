// ── Paquete del idioma: Español (es) ───────────────────────────────────────
// Todo lo específico de este idioma vive en esta carpeta:
//   ui.json         → textos de interfaz
//   manifest.json   → metadatos de la PWA (nombre, descripción…)
//   soundtrack.json → pistas de la banda sonora
//   data/           → contenido narrado (introduccion, planes, actos…)
//
// Para crear un idioma nuevo: copia esta carpeta a src/i18n/<código>/, traduce
// los .json (y, en su caso, apunta los audios a su versión localizada) y
// registra el idioma en src/i18n.js.

import ui from "./ui.json";
import manifest from "./manifest.json";
import soundtrack from "./soundtrack.json";

import start from "./data/start.json";
import introBase from "./data/introduccion/_base.json";
import introHdlc from "./data/introduccion/hermanos_de_las_cenizas.json";
import planesBase from "./data/planes/_base.json";
import planesHdlc from "./data/planes/hermanos_de_las_cenizas.json";
import actosBase from "./data/actos/_base.json";
import actosHdlc from "./data/actos/hermanos_de_las_cenizas.json";
import resolucionesBase from "./data/resoluciones/_base.json";
import resolucionesHdlc from "./data/resoluciones/hermanos_de_las_cenizas.json";
import codicesBase from "./data/codices/_base.json";
import codicesHdlc from "./data/codices/hermanos_de_las_cenizas.json";
import ambientConfig from "./data/ambient.json";

import { composeAppData } from "../../i18n/compose.js";

export default {
  code: "es",
  ui,
  manifest,
  soundtrack,
  appData: composeAppData({
    start,
    introBase,
    introHdlc,
    planesBase,
    planesHdlc,
    actosBase,
    actosHdlc,
    resolucionesBase,
    resolucionesHdlc,
    codicesBase,
    codicesHdlc,
    ambientConfig,
  }),
};
