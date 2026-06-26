import { useState, useMemo } from 'react';
import { filterFacts, computeKPIs } from '../../data/mockData';

const ANNUAL_BUDGET = 33000 * 12; // 396.000 RON

function KpiGrid() {
  const [year, setYear] = useState('2025');

  const facts     = useMemo(() => filterFacts({ year }), [year]);
  const factsPrev = useMemo(() =>
    filterFacts({ year: String(parseInt(year) - 1) }), [year]);
  const kpis = useMemo(() => computeKPIs(facts, factsPrev), [facts, factsPrev]);

  const bugetPct = Math.min(100, Math.round((kpis.totalNet / ANNUAL_BUDGET) * 100));
  const budgetBarColor =
    bugetPct >= 100 ? 'bg-red-500' : bugetPct > 80 ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div>
      {/* capul randului: titlu si selectorul de an fiscal */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 tracking-tight">KPI Summary</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Evoluția indicatorilor cheie</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">An fiscal</label>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="select-input"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* cele 4 carduri cu indicatorii principali */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

        {/* 1 - costul total net */}
        <div className="card border-l-4 border-l-blue-400 p-6
                        hover:shadow-card-hover transition-all duration-200">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Cost total net
          </p>
          <p className="text-3xl font-bold font-mono text-gray-900 leading-none">
            {kpis.totalNet.toLocaleString('ro-RO')}
            <span className="text-base font-semibold text-gray-500 ml-1">RON</span>
          </p>
          {kpis.deltaVsPrev !== null && (
            <p className={`text-xs font-semibold mt-3 ${
              kpis.deltaVsPrev > 0 ? 'text-red-500' : 'text-emerald-600'
            }`}>
              {kpis.deltaVsPrev > 0 ? '▲' : '▼'} {Math.abs(kpis.deltaVsPrev)}% față de {parseInt(year) - 1}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1 font-medium">Cost net total anual</p>
        </div>

        {/* 2 - bugetul ramas */}
        <div className={[
          'card border-l-4 p-6 hover:shadow-card-hover transition-all duration-200',
          kpis.bugetDepasit ? 'border-l-red-400' : 'border-l-emerald-400',
        ].join(' ')}>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Buget rămas
          </p>
          <p className={`text-3xl font-bold font-mono leading-none ${
            kpis.bugetDepasit ? 'text-red-500' : 'text-gray-900'
          }`}>
            {kpis.bugetDepasit ? '-' : ''}{kpis.bugetRamas.toLocaleString('ro-RO')}
            <span className="text-base font-semibold text-gray-500 ml-1">RON</span>
          </p>
          <div className="mt-3.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${budgetBarColor}`}
              style={{ width: `${Math.min(bugetPct, 100)}%` }}
            />
          </div>
          <p className={`text-xs mt-2 font-medium ${kpis.bugetDepasit ? 'text-red-500' : 'text-gray-500'}`}>
            {bugetPct}% utilizat din bugetul anual
          </p>
        </div>

        {/* 3 - economiile din discounturi */}
        <div className="card border-l-4 border-l-emerald-400 p-6
                        hover:shadow-card-hover transition-all duration-200">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Economii (discounturi)
          </p>
          <p className="text-3xl font-bold font-mono text-emerald-600 leading-none">
            {kpis.totalDiscount.toLocaleString('ro-RO')}
            <span className="text-base font-semibold text-emerald-500 ml-1">RON</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"/>
            </svg>
            <span className="text-xs text-emerald-600 font-semibold">
              {kpis.discountPct}% din costul brut
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">Economii aplicate de provideri</p>
        </div>

        {/* 4 - serviciile active */}
        <div className="card border-l-4 border-l-violet-400 p-6
                        hover:shadow-card-hover transition-all duration-200">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Servicii active
          </p>
          <p className="text-3xl font-bold font-mono text-gray-900 leading-none">
            {kpis.activeServices}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 pulse-dot" />
            <span className="text-xs text-gray-600 font-medium">Toți providerii online</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">AWS · Azure · GCP</p>
        </div>

      </div>
    </div>
  );
}

export default KpiGrid;
