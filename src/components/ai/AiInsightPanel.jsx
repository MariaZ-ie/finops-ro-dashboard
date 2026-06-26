import { useState, useMemo } from 'react';
import {
  filterFacts, aggregateByMonth, aggregateByDepartment,
  dimDepartment,
} from '../../data/mockData';

// cardul de insight simplu, varianta normala fara click
function InsightCard({ iconBg, iconColor, icon, label, headline, trend, trendColor, detail }) {
  return (
    <div className="bg-slate-50 border border-gray-100 rounded-xl p-5
                    hover:border-gray-200 transition-colors duration-150">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono text-gray-900 leading-none mb-2">
        {headline}
      </p>
      <p className={`text-xs font-semibold mb-1 ${trendColor}`}>{trend}</p>
      <p className="text-xs text-gray-500 font-medium">{detail}</p>
    </div>
  );
}

// varianta clickabila a cardului, cu drill-down spre alt ecran
// adaug cursor-pointer si un mic indicator vizual ca sa se vada se poate da click 
function DrillDownCard({ iconBg, iconColor, icon, label, headline, trend, trendColor, detail, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-50 border border-gray-100 rounded-xl p-5 text-left w-full
                 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-sm
                 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        {/* sageata mica care apare la hover ca sa indice ca e clickabil */}
        <span className="ml-auto text-amber-400 opacity-0 group-hover:opacity-100
                         transition-opacity duration-150 text-xs font-bold">
          → Vezi detalii
        </span>
      </div>
      <p className="text-2xl font-bold font-mono text-gray-900 leading-none mb-2">
        {headline}
      </p>
      <p className={`text-xs font-semibold mb-1 ${trendColor}`}>{trend}</p>
      <p className="text-xs text-gray-500 font-medium">{detail}</p>
    </button>
  );
}

// iconitele desenate cu svg pentru cele 3 carduri
const IconWarning = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
);
const IconTrend = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
  </svg>
);
const IconForecast = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
);

// componenta cu panoul de AI Insights
// primesc onNavigate de la Dashboard -> App ca sa pot schimba ecranul cu parametri
function AiInsightPanel({ onNavigate }) {
  const [year, setYear] = useState('2025');

  const factsCurrent = useMemo(() => filterFacts({ year }), [year]);
  const factsPrev    = useMemo(() =>
    filterFacts({ year: String(parseInt(year) - 1) }), [year]);

  const anomalie = useMemo(() => {
    const luni = aggregateByMonth(factsCurrent, year);
    if (!luni || luni.length === 0) return null;
    const medie = luni.reduce((s, l) => s + l.netCost, 0) / luni.length;
    const spike = luni.reduce((a, b) => b.netCost > a.netCost ? b : a, luni[0]);
    return {
      luna:   spike.month,
      valoare: spike.netCost,
      pct:    Math.round(((spike.netCost - medie) / medie) * 100),
    };
  }, [factsCurrent, year]);

  const recomandare = useMemo(() => {
    const d1 = aggregateByDepartment(factsCurrent);
    const d2 = aggregateByDepartment(factsPrev);
    if (!d1.length || !d2.length) return null;
    const list = d1.map((d, i) => ({
      name:     d.name,
      crestere: d2[i].netCost > 0
        ? Math.round(((d.netCost - d2[i].netCost) / d2[i].netCost) * 100)
        : 0,
    }));
    return list.reduce((a, b) => b.crestere > a.crestere ? b : a, list[0]);
  }, [factsCurrent, factsPrev]);

  const prognoza = useMemo(() => {
    const luni = aggregateByMonth(factsCurrent, year);
    if (!luni || luni.length < 3) return null;
    const medie = luni.slice(-3).reduce((s, l) => s + l.netCost, 0) / 3;
    return Math.round(medie * 1.05);
  }, [factsCurrent, year]);

  if (!anomalie || !recomandare || !prognoza) return null;

  const prevYear = String(parseInt(year) - 1);

  // aici preiau departamentul trimis din cardul de insight ca sa pun filtrul automat
  // caut in dimDepartment id-ul care corespunde numelui afisat in card
  const handleDeptDrillDown = () => {
    const dept = dimDepartment.find(d => d.dept_name === recomandare.name);
    if (dept && onNavigate) {
      // navighez la ecranul de departamente si trimit id-ul ca parametru
      onNavigate('departments', { dept: String(dept.department_id) });
    }
  };

  return (
    <div className="card p-6">
      {/* antetul panoului cu titlu, badge-uri si selectorul de an */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100
                        flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-sm">AI Insights</span>
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px]
                         font-semibold border border-blue-100 uppercase tracking-wide">Beta</span>
        <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-500 text-[10px]
                         font-semibold border border-violet-100 uppercase tracking-wide">
          Implementare viitoare
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">An</label>
          <select className="select-input" value={year} onChange={e => setYear(e.target.value)}>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* cele 3 carduri de insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* cardul 1 - luna cu cel mai mare cost (nu e clickabil) */}
        <InsightCard
          icon={<IconWarning />}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          label="Luna cu cel mai mare cost"
          headline={anomalie.luna}
          trend={`▲ +${anomalie.pct}% față de media ${year}`}
          trendColor="text-red-500"
          detail={`${anomalie.valoare.toLocaleString('ro-RO')} RON cost net`}
        />

        {/* cardul 2 - departamentul cu crestere maxima, asta e clickabil
            la click mut utilizatorul pe tab-ul Departamente
            si pre-selectez automat departamentul din filtrul de acolo */}
        <DrillDownCard
          icon={<IconTrend />}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          label="Departament cu creștere maximă - click pentru detalii"
          headline={recomandare.name}
          trend={`▲ +${recomandare.crestere}% față de ${prevYear}`}
          trendColor="text-amber-500"
          detail={`Recomandare: revizuire buget ${parseInt(year) + 1}`}
          onClick={handleDeptDrillDown}
        />

        {/* cardul 3 - prognoza (nu e clickabil) */}
        <InsightCard
          icon={<IconForecast />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          label="Prognoză luna următoare"
          headline={`${prognoza.toLocaleString('ro-RO')} RON`}
          trend="▲ +5% față de media ultimelor 3 luni"
          trendColor="text-amber-500"
          detail={`Bazat pe trendul ${year}`}
        />
      </div>
    </div>
  );
}

export default AiInsightPanel;
