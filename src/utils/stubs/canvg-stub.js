// asta e un stub (modul gol) pentru biblioteca canvg
// canvg e folosita de jspdf doar cand apelezi doc.html() sau procesezi SVG-uri externe
// nu folosesc aceste functii ci generez PDF ul cu text, tabele si figuri geometrice
// fara acest stub, canvg importa core-js care are un fisier intern lipsa in v3.49.0
// si face build-ul sa esueze cu UNRESOLVED_IMPORT
// solutia: ii spun lui vite sa inlocuiasca canvg cu modulul asta gol

export default {};
export const Canvg = class {
  static from() { return new Canvg(); }
  start()  {}
  stop()   {}
};
export const presets = {};
export const SVGElement = class {};
