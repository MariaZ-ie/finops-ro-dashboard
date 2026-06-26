import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path   from 'path'

// ─── De ce a aparut eroarea? ──────────────────────────────────────────────────
//
// jspdf importa canvg pentru a procesa SVG-uri si HTML in PDF.
// canvg la randul lui importa core-js (biblioteca de polyfill-uri).
// core-js@3.49.0 — versiunea instalata — are un bug: fisierul sau intern
// `internals/promise-statics-incorrect-iteration.js` lipseste complet
// din pachet, desi propriile sale module (es.promise.all.js etc.) il importa.
// Rollup/rolldown nu poate rezolva importul si opreste build-ul cu UNRESOLVED_IMPORT.
//
// ─── Solutia permanenta ───────────────────────────────────────────────────────
//
// Noi nu folosim niciodata doc.html() sau procesare SVG in jspdf — generam
// doar text, culori si tabele. Deci pot inlocui canvg cu un stub gol.
// Aliasul de mai jos redirecteaza orice import de 'canvg' catre fisierul
// nostru stub, astfel ca lantul canvg → core-js nu mai porneste niciodata.
// Solutia functioneaza atat la `npm run dev` cat si la `npm run build`
// si supravietuieste oricarui `npm install` viitor.

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // redirectez canvg catre un stub gol — asta rupe lantul de import
      // canvg -> core-js care cauza eroarea de build
      canvg: path.resolve(__dirname, 'src/utils/stubs/canvg-stub.js'),
    },
  },

  optimizeDeps: {
    // exclud jspdf si jspdf-autotable din pre-bundling-ul esbuild
    // ca sa nu mai apara erori similare la pornirea serverului de dev
    exclude: ['jspdf', 'jspdf-autotable'],
  },
})
