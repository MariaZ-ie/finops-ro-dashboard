import { useState, useMemo } from 'react';
import {
  filterFacts, aggregateByMonth, aggregateByDepartment,
  aggregateByProvider, aggregateByServiceType, computeKPIs,
} from '../../data/mockData';
import leoImg               from '../../assets/leo.png';
import FinOpsCopilot        from '../ai/FinOpsCopilot';
import { generatePdfReport } from '../../utils/generatePdfReport';

// iconitele svg pe care le folosesc pe butoanele din bara de sus
const IconDocument = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);
const IconCopy = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconDownload = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
  </svg>
);
const IconPdf = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M7 21H4a2 2 0 01-2-2V5a2 2 0 012-2h10l5 5v4M16 17h6m-3-3v6M9 9h1M9 13h6"/>
  </svg>
);
const IconSparkle = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
  </svg>
);

// lista cu cele 3 ecrane intre care comut din meniu
const SCREENS = [
  { id: 'overview',      label: 'Overview'          },
  { id: 'departments',   label: 'Departamente'       },
  { id: 'optimization',  label: 'Optimizare Resurse' },
];

// hook-ul asta imi construieste raportul text pe care il pun in panoul de jos
// adun aici toate datele si le formatez frumos pe sectiuni
function useReport(facts2025, facts2024) {
  return useMemo(() => {
    const kpis    = computeKPIs(facts2025, facts2024);
    const luni    = aggregateByMonth(facts2025, '2025');
    const dept25  = aggregateByDepartment(facts2025);
    const dept24  = aggregateByDepartment(facts2024);
    const prov    = aggregateByProvider(facts2025);
    const svc     = aggregateByServiceType(facts2025);
    const BUGET   = 33000;

    const luniDep  = luni.filter(l => l.netCost > BUGET);
    const lunaMax  = luni.reduce((a, b) => b.netCost > a.netCost ? b : a, luni[0]);
    const lunaMin  = luni.reduce((a, b) => b.netCost < a.netCost ? b : a, luni[0]);
    const provMax  = [...prov].sort((a, b) => b.netCost - a.netCost)[0];
    const svcTotal = svc.reduce((s, x) => s + x.value, 0);
    const svcMax   = [...svc].sort((a, b) => b.value - a.value)[0];
    const svcPct   = Math.round((svcMax.value / svcTotal) * 100);
    const deptMax  = dept25
      .map((d, i) => ({
        name:     d.name,
        crestere: Math.round(((d.netCost - dept24[i].netCost) / dept24[i].netCost) * 100),
      }))
      .reduce((a, b) => b.crestere > a.crestere ? b : a);

    const data = new Date().toLocaleDateString('ro-RO', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const sep = '─'.repeat(52);

    return `
RAPORT MONITORIZARE COSTURI CLOUD - 2025
Generat automat de FinOps RO Dashboard
Data generării: ${data}
${sep}

REZUMAT EXECUTIV
• Cost total net 2025:       ${kpis.totalNet.toLocaleString('ro-RO')} RON
• Cost total net 2024:       ${Math.round(facts2024.reduce((s, f) => s + f.net_cost, 0)).toLocaleString('ro-RO')} RON
• Variație anuală:           ${kpis.deltaVsPrev > 0 ? '+' : ''}${kpis.deltaVsPrev}% față de 2024
• Economii prin discounturi: ${kpis.totalDiscount.toLocaleString('ro-RO')} RON (${kpis.discountPct}% din cost brut)
• Servicii cloud active:     ${kpis.activeServices} servicii pe 3 provideri

${sep}
ANALIZA BUGETULUI LUNAR (limită: 33.000 RON/lună)
• Luni care au depășit bugetul: ${luniDep.length} din 12
• Luna cu costul maxim: ${lunaMax.month} - ${lunaMax.netCost.toLocaleString('ro-RO')} RON
• Luna cu costul minim: ${lunaMin.month} - ${lunaMin.netCost.toLocaleString('ro-RO')} RON
${luniDep.length > 0
  ? `• Luni cu depășire: ${luniDep.map(l => l.month).join(', ')}`
  : '• Nicio lună nu a depășit bugetul'}

${sep}
COSTURI PE DEPARTAMENTE
${dept25.map((d, i) => {
  const cr  = Math.round(((d.netCost - dept24[i].netCost) / dept24[i].netCost) * 100);
  const pct = Math.round((d.netCost / kpis.totalNet) * 100);
  return `• ${d.name.padEnd(14)} ${d.netCost.toLocaleString('ro-RO').padStart(10)} RON  (${pct}% din total, ${cr > 0 ? '+' : ''}${cr}% vs 2024)`;
}).join('\n')}

${sep}
COSTURI PE PROVIDERI CLOUD
${prov.map(p => {
  const pct = Math.round((p.netCost / kpis.totalNet) * 100);
  return `• ${p.name.padEnd(8)} ${p.netCost.toLocaleString('ro-RO').padStart(10)} RON  (${pct}% din total, economii: ${p.discounts.toLocaleString('ro-RO')} RON)`;
}).join('\n')}

${sep}
DISTRIBUȚIE PE TIPURI DE SERVICII
${svc.sort((a, b) => b.value - a.value).map(s => {
  const pct = Math.round((s.value / svcTotal) * 100);
  return `• ${s.name.padEnd(12)} ${s.value.toLocaleString('ro-RO').padStart(10)} RON  (${pct}%)`;
}).join('\n')}

${sep}
RECOMANDĂRI
1. Revizuire buget 2026 - ${luniDep.length} luni au depășit limita de 33.000 RON/lună
2. Audit departament ${deptMax.name} - creștere de +${deptMax.crestere}% față de 2024
3. Optimizare servicii ${svcMax.name} - reprezintă ${svcPct}% din total
4. Negociere contracte ${provMax.name} - provider dominant, volum mare
5. Implementare alerte automate pentru depășiri de buget

${sep}
Raport generat de FinOps RO Dashboard
Sistem de monitorizare costuri cloud - Lucrare de licență 2026
    `.trim();
  }, [facts2025, facts2024]);
}

// componenta barii de sus: logo, tab-urile, butonul de AI si cel de raport
function TopBar({ activeScreen = 'overview', onNavigate }) {
  const [reportOpen,  setReportOpen]  = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const now = new Date().toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const facts2025 = useMemo(() => filterFacts({ year: '2025' }), []);
  const facts2024 = useMemo(() => filterFacts({ year: '2024' }), []);
  const raport    = useReport(facts2025, facts2024);

  const handleCopy = () => {
    navigator.clipboard.writeText(raport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // generez un fisier .txt din raport si il descarc automat
  const handleDownload = () => {
    const blob = new Blob([raport], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'raport-finops-ro-2025.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* bara de navigare fixata sus */}
      <nav className="glass sticky top-0 z-50 w-full">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between gap-6">

          {/* in stanga: logo-ul si tab-urile de ecrane */}
          <div className="flex items-center gap-5 min-w-0">

            {/* logo-ul cu motanul Leo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <img src={leoImg} alt="Leo" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              <div className="hidden sm:block">
                <p className="font-bold text-gray-900 text-sm leading-tight tracking-tight">FinOps RO</p>
                <p className="text-[10px] text-gray-500 leading-tight tracking-wide font-medium">
                  Monitorizare Costuri Cloud
                </p>
              </div>
            </div>

            {/* o liniuta verticala de separare */}
            <div className="hidden md:block w-px h-5 bg-gray-200 flex-shrink-0" />

            {/* tab-urile prin care comut intre ecrane */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              {SCREENS.map(s => {
                const isActive = s.id === activeScreen;
                return (
                  <button
                    key={s.id}
                    onClick={() => onNavigate?.(s.id)}
                    className={[
                      'px-3 py-1.5 rounded-lg text-xs transition-all duration-150 flex items-center gap-1.5',
                      isActive
                        ? 'bg-white text-gray-900 font-semibold shadow-sm border border-gray-200 border-l-2 border-l-blue-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium cursor-pointer',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* in dreapta: data, butonul de AI si cel de raport */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden lg:block text-xs text-gray-500 font-mono font-medium">{now}</span>

            {/* butonul care deschide si inchide chat-ul cu Leo */}
            <button
              onClick={() => setCopilotOpen(p => !p)}
              className={[
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150',
                copilotOpen
                  ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700',
              ].join(' ')}
              title="Deschide Leo - Asistent AI"
            >
              <img src={leoImg} alt="Leo" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
              <span className="hidden sm:inline">Leo AI</span>
              <IconSparkle />
            </button>

            {/* butonul care deschide panoul cu raportul */}
            <button
              onClick={() => setReportOpen(p => !p)}
              className={[
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150',
                reportOpen
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
              ].join(' ')}
            >
              <IconDocument />
              <span className="hidden sm:inline">Raport</span>
            </button>
          </div>
        </div>
      </nav>

      {/* panoul cu raportul care coboara cand apas pe buton */}
      {reportOpen && (
        <div className="bg-white border-b border-gray-100 shadow-sm fade-in">
          <div className="max-w-[1440px] mx-auto px-6 py-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Raport executiv - 2025
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Generat din datele live ale dashboard-ului
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150',
                    copied
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <IconCopy />
                  {copied ? 'Copiat!' : 'Copiează'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             bg-white border border-gray-200 text-gray-600
                             text-xs font-medium hover:bg-gray-50 transition-colors duration-150"
                >
                  <IconDownload />
                  Descarcă .txt
                </button>
                <button
                  onClick={generatePdfReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             bg-blue-600 border border-blue-600 text-white
                             text-xs font-semibold hover:bg-blue-700 transition-colors duration-150"
                >
                  <IconPdf />
                  Descarcă PDF
                </button>
              </div>
            </div>
            <pre className="font-mono text-xs text-gray-600 leading-relaxed
                            whitespace-pre-wrap max-h-72 overflow-y-auto
                            bg-slate-50 rounded-xl p-4 border border-gray-100">
              {raport}
            </pre>
          </div>
        </div>
      )}

      {/* panoul lateral cu chat-ul lui Leo */}
      {/* trimit onNavigate ca Leo sa poata schimba ecranul din chat */}
      <FinOpsCopilot open={copilotOpen} onClose={() => setCopilotOpen(false)} onNavigate={onNavigate} />
    </>
  );
}

export default TopBar;
