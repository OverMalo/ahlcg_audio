// ── Paquete del idioma: Español (es) ───────────────────────────────────────
// Todo lo específico de este idioma vive en esta carpeta:
//   ui.json         → textos de interfaz
//   manifest.json   → metadatos de la PWA (nombre, descripción…)
//   soundtrack.json → pistas de la banda sonora
//   data/           → contenido narrado, jerárquico:
//                       campaigns/<id>.json  (campaña → escenarios → components → items)
//                       ambient.json         (config de audio ambiente)
//
// Para crear un idioma nuevo: copia esta carpeta a src/i18n/<código>/, traduce
// los .json (y, en su caso, apunta los audios a su versión localizada) y
// registra el idioma en src/i18n.js.
//
// Para añadir una campaña / escenario independiente: crea su .json en data/
// e impórtalo en el array correspondiente (campaigns / standalone).

import ui from "./ui.json";
import manifest from "./manifest.json";
import soundtrack from "./soundtrack.json";

import hermanosDeLasCenizas from "./data/campaigns/hermanos_de_las_cenizas.json";
import vastagosDeSangre from "./data/campaigns/vastagos_de_sangre.json";
import tracesToNowhere from "./data/standalone/traces_to_nowhere.json";
import sleepyHollow from "./data/standalone/sleepy_hollow.json";
import elDiaQueLaTierraAullo from "./data/standalone/el_dia_que_la_tierra_aullo.json";
import ambient from "./data/ambient.json";

import { composeContent } from "../../i18n/compose.js";

export default {
  code: "es",
  ui,
  manifest,
  soundtrack,
  appData: composeContent({
    chapter: "Capítulo 2",
    campaigns: [hermanosDeLasCenizas, vastagosDeSangre],
    standalone: [tracesToNowhere, elDiaQueLaTierraAullo, sleepyHollow ],
    ambientConfig: ambient.ambientConfig,
  }),
};
