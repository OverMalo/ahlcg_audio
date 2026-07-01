// Compone el árbol de contenido (appData) a partir de las piezas de datos de un
// idioma. El orden de las secciones es significativo, por eso la composición es
// explícita y compartida por todos los idiomas (cada idioma aporta sus piezas).
export function composeAppData(p) {
  return {
    ...p.start,
    introduccion: {
      ...p.introBase,
      options: [...p.introHdlc],
    },
    planes: {
      ...p.planesBase,
      options: [...p.planesHdlc],
    },
    actos: {
      ...p.actosBase,
      options: [...p.actosHdlc],
    },
    resoluciones: {
      ...p.resolucionesBase,
      options: [...p.resolucionesHdlc],
    },
    codices: {
      ...p.codicesBase,
      options: [...p.codicesHdlc],
    },
    ...p.ambientConfig,
  };
}
