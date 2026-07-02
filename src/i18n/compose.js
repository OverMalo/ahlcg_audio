// Compone el árbol de contenido jerárquico a partir de las piezas de datos de un
// idioma: cada campaña / escenario independiente es un objeto autocontenido con la
// forma  campaña → escenarios[] → components[] → items[]  (ver
// data/campaigns/*.json). Añadir contenido nuevo es solo añadir datos.
export function composeContent(p) {
  return {
    chapter: p.chapter ?? "",
    campaigns: p.campaigns ?? [],
    standalone: p.standalone ?? [],
    ambientConfig: p.ambientConfig ?? {},
  };
}
