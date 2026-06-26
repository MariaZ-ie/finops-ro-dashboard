import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer, Legend,
} from 'recharts';
import { filterFacts, aggregateByMonth } from '../../data/mockData';
import TopBar from './TopBar';

// constante: bugetul lunar si rata de crestere pe care o folosesc la prognoza
const BUDGET        = 33000;
const GROWTH_RATE   = 1.18; // estimez o crestere de +18% in 2026 fata de 2025
const MONTH_LABELS  = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

// lista mea fixa de resurse inactive, ca exemplu pentru Waste Finder
const WASTE_RESOURCES = [
  { id: 1, name: 'DB-Test-QA',        dept: 'Engineering', daysIdle: 47, costMonth: 1240, action: 'stop',    provider: 'AWS'   },
  { id: 2, name: 'EC2-Idle-Staging',  dept: 'DevOps',      daysIdle: 32, costMonth:  890, action: 'stop',    provider: 'AWS'   },
  { id: 3, name: 'Azure-VM-Dev-Old',  dept: 'Engineering', daysIdle: 61, costMonth: 1540, action: 'stop',    provider: 'Azure' },
  { id: 4, name: 'S3-Backup-Archive', dept: 'Data',        daysIdle: 90, costMonth:  420, action: 'archive', provider: 'AWS'   },
  { id: 5, name: 'GKE-Cluster-Test',  dept: 'DevOps',      daysIdle: 18, costMonth: 2100, action: 'resize',  provider: 'GCP'   },
  { id: 6, name: 'RDS-Reports-Old',   dept: 'Data',        daysIdle: 55, costMonth:  760, action: 'stop',    provider: 'AWS'   },
  { id: 7, name: 'GuardDuty-Dup',     dept: 'Security',    daysIdle: 12, costMonth:  330, action: 'archive', provider: 'AWS'   },
];

const ACTION_CONFIG = {
  stop:    { label: 'Oprește Resursa',  cls: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'    },
  resize:  { label: 'Redimensionează', cls: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  archive: { label: 'Arhivează',       cls: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' },
};

// badge-ul care coloreaza diferit in functie de cate zile a stat resursa nefolosita
function IdleBadge({ days }) {
  if (days >= 60) return <span className="badge-critical">{days} zile</span>;
  if (days >= 30) return <span className="badge-warning">{days} zile</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                     bg-blue-50 text-blue-600 border border-blue-100">
      {days} zile
    </span>
  );
}

// tooltip-ul personalizat pentru graficul de prognoza
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip min-w-[180px]">
      <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(entry => (
        <p key={entry.dataKey} className="text-xs text-gray-600 mb-0.5 flex justify-between gap-4 font-medium">
          <span>{entry.name}</span>
          <span className="font-mono font-semibold text-gray-700">
            {entry.value != null ? `${entry.value.toLocaleString('ro-RO')} RON` : '-'}
          </span>
        </p>
      ))}
      {payload[0]?.value != null && payload[0].value > BUDGET && (
        <p className="text-xs text-red-500 font-semibold mt-1.5 pt-1.5 border-t border-gray-100">
          ▲ +{(payload[0].value - BUDGET).toLocaleString('ro-RO')} RON peste buget
        </p>
      )}
    </div>
  );
}

// eticheta de sectiune cu titlu si subtitlu
function SectionLabel({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-gray-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
    </div>
  );
}

// componenta principala a ecranului de optimizare
function ResourceOptimization({ onNavigate }) {
  const [deptFilter, setDeptFilter] = useState('');
  const [confirmId,  setConfirmId]  = useState(null);
  const [executed,   setExecuted]   = useState({});

  // aici construiesc datele pentru grafic: costurile reale din 2025 plus prognoza pe 2026
  const facts2025  = useMemo(() => filterFacts({ year: '2025' }), []);
  const monthly    = useMemo(() => aggregateByMonth(facts2025, '2025'), [facts2025]);

  const chartData = useMemo(() => {
    // partea istorica, lunile reale din 2025
    const hist = monthly.map((m, i) => ({
      label:      `${MONTH_LABELS[i]} '25`,
      historical: Math.round(m.netCost),
      forecast:   null,
    }));

    const lastHist     = hist[hist.length - 1].historical;
    const monthlyGrowth = Math.pow(GROWTH_RATE, 1 / 12);

    // partea de prognoza pentru 2026, aplic cresterea lunara
    const proj = MONTH_LABELS.map((lbl, i) => ({
      label:      `${lbl} '26`,
      historical: null,
      forecast:   Math.round(lastHist * Math.pow(monthlyGrowth, i + 1)),
    }));

    // leg cele doua linii: pun in Dec '25 si valoarea de prognoza ca sa nu fie o ruptura
    hist[hist.length - 1].forecast = lastHist;

    return [...hist, ...proj];
  }, [monthly]);

  // calculez cand se epuizeaza bugetul si cat de mare e depasirea prognozata
  const { exhaustionLabel, overshootLabel } = useMemo(() => {
    const MONTHS_RO = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];
    const proj2026 = chartData.filter(d => d.forecast != null && d.label.includes("'26"));
    const over     = proj2026.find(d => d.forecast > BUDGET);
    const monthIdx = over ? proj2026.indexOf(over) : -1;
    const exLabel  = over ? `${MONTHS_RO[monthIdx]} 2026` : 'Sub buget';
    const maxForecast = proj2026[proj2026.length - 1]?.forecast ?? 0;
    const ovLabel     = maxForecast > BUDGET
      ? `+${(maxForecast - BUDGET).toLocaleString('ro-RO')} RON`
      : '-';
    return { exhaustionLabel: exLabel, overshootLabel: ovLabel };
  }, [chartData]);

  // filtrez resursele inactive pe departament si calculez costul total pierdut
  const tableRows = useMemo(() =>
    deptFilter ? WASTE_RESOURCES.filter(r => r.dept === deptFilter) : WASTE_RESOURCES,
  [deptFilter]);

  const totalWasteCost = useMemo(() =>
    tableRows.filter(r => !executed[r.id]).reduce((s, r) => s + r.costMonth, 0),
  [tableRows, executed]);

  const forecastStart = chartData.find(d => d.label.includes("'26"))?.label;
  const forecastEnd   = chartData[chartData.length - 1]?.label;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar activeScreen="optimization" onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-6 pb-16 pt-8 space-y-8">

        {/* antetul paginii cu titlu si avertismentul de depasire */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Optimizare Resurse
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">
              Prognoză bugetară 2026 și identificare resurse inactive
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100
                          rounded-xl text-xs text-amber-600 font-medium">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Atenție: depășire buget prognozată în 2026
          </div>
        </div>

        {/* sectiunea 1: graficul de prognoza si cardurile KPI */}
        <section>
          <SectionLabel
            title="Prognoză Buget 2026"
            subtitle="Tendința cheltuielilor istorice 2025 și proiecția costurilor pe baza trendului anual"
          />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6 items-start">

            {/* cardul cu graficul liniar de prognoza */}
            <div className="card p-6">
              <div className="min-h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    {forecastStart && forecastEnd && (
                      <ReferenceArea
                        x1={forecastStart}
                        x2={forecastEnd}
                        fill="#fef3c7"
                        fillOpacity={0.5}
                      />
                    )}
                    <ReferenceLine
                      y={BUDGET}
                      stroke="#ef4444"
                      strokeDasharray="5 3"
                      strokeWidth={1.5}
                      label={{
                        value: `Buget 33k RON`,
                        position: 'insideTopRight',
                        fill: '#ef4444',
                        fontSize: 10,
                        fontFamily: 'Inter',
                        fontWeight: 600,
                      }}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Inter' }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 12 }}
                      formatter={value => value === 'historical' ? 'Cost real 2025' : 'Prognoză 2026'}
                    />
                    <Line
                      type="monotone"
                      dataKey="historical"
                      name="historical"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="forecast"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-500 mt-3 pt-3 border-t border-gray-50 font-medium">
                Zona galbenă reprezintă perioada de prognoză. Linia roșie indică limita bugetară de{' '}
                <span className="font-mono font-semibold text-gray-700">33.000 RON/lună</span>.
                Proiecția presupune un trend de creștere de{' '}
                <span className="font-semibold text-amber-600">+18%</span> față de 2025.
              </p>
            </div>

            {/* coloana din dreapta cu cele 3 carduri KPI */}
            <div className="flex flex-col gap-4">

              {/* cardul 1 - cand se epuizeaza bugetul */}
              <div className="card p-5 border-l-4 border-l-red-400">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                    Epuizare Buget Estimată
                  </p>
                </div>
                <p className="text-2xl font-bold font-mono text-gray-900 leading-none mb-2">
                  {exhaustionLabel}
                </p>
                <p className="text-xs text-red-500 font-semibold mb-1">
                  Prima lună care depășește 33k RON
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Bazat pe trendul de creștere din 2025
                </p>
              </div>

              {/* cardul 2 - cat de mare e depasirea prognozata */}
              <div className="card p-5 border-l-4 border-l-amber-400">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                    Depășire Prognozată
                  </p>
                </div>
                <p className="text-2xl font-bold font-mono text-gray-900 leading-none mb-2">
                  {overshootLabel}
                </p>
                <p className="text-xs text-amber-600 font-semibold mb-1">
                  ▲ Față de bugetul lunar în Dec &apos;26
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Necesită revizuire buget sau optimizare
                </p>
              </div>

              {/* cardul 3 - economiile posibile daca opresc resursele inactive */}
              <div className="card p-5 border-l-4 border-l-emerald-400">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                    Economii Posibile / Lună
                  </p>
                </div>
                <p className="text-2xl font-bold font-mono text-emerald-600 leading-none mb-2">
                  {WASTE_RESOURCES.reduce((s, r) => s + r.costMonth, 0).toLocaleString('ro-RO')} RON
                </p>
                <p className="text-xs text-emerald-600 font-semibold mb-1">
                  ▼ Prin dezafectarea resurselor inactive
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {WASTE_RESOURCES.length} resurse identificate în Waste Finder
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* sectiunea 2: Waste Finder cu tabelul de resurse inactive */}
        {/* id-ul asta e folosit de chat-ul Leo ca sa faca scroll direct aici */}
        <section id="waste-finder-section">
          <SectionLabel
            title="Waste Finder - Resurse Inactive"
            subtitle="Servicii cloud neutilizate sau subdimensionate, cu impact bugetar direct"
          />

          <div className="card p-6">
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
                  <span className="text-xs font-semibold text-red-600">
                    {tableRows.length} resurse inactive detectate
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Cost pierdut:{' '}
                  <span className="font-mono font-semibold text-gray-700">
                    {totalWasteCost.toLocaleString('ro-RO')} RON/lună
                  </span>
                </span>
              </div>
              <select
                className="select-input"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="">Toate departamentele</option>
                <option value="Engineering">Engineering</option>
                <option value="DevOps">DevOps</option>
                <option value="Data">Data</option>
                <option value="Security">Security</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Nume Resursă', 'Departament', 'Provider', 'Zile Inactive', 'Cost Pierdut / Lună', 'Acțiune Recomandată'].map(col => (
                      <th
                        key={col}
                        className="text-left text-[10px] text-gray-500 font-semibold uppercase tracking-widest pb-3 pr-4 last:pr-0 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(row => {
                    const done    = !!executed[row.id];
                    const waiting = confirmId === row.id;
                    const cfg     = ACTION_CONFIG[row.action];
                    return (
                      <tr
                        key={row.id}
                        className={[
                          'border-b border-gray-50 transition-all duration-300',
                          done ? 'opacity-40' : 'hover:bg-slate-50/80',
                        ].join(' ')}
                      >
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-8 rounded-full bg-red-200 flex-shrink-0" />
                            <span className="font-mono text-xs font-semibold text-gray-800">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-gray-700 font-medium">{row.dept}</td>
                        <td className="py-3.5 pr-4 text-xs text-gray-600">{row.provider}</td>
                        <td className="py-3.5 pr-4"><IdleBadge days={row.daysIdle} /></td>
                        <td className="py-3.5 pr-4 font-mono font-semibold text-xs text-red-600">
                          {row.costMonth.toLocaleString('ro-RO')} RON
                        </td>
                        <td className="py-3.5">
                          {done ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                              Executat
                            </span>
                          ) : waiting ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 font-medium">Sigur?</span>
                              <button
                                onClick={() => { setExecuted(prev => ({ ...prev, [row.id]: true })); setConfirmId(null); }}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >Da</button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >Nu</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(row.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${cfg.cls}`}
                            >
                              {row.action === 'stop' && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <rect x="6" y="6" width="12" height="12" rx="1" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {row.action === 'resize' && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                                </svg>
                              )}
                              {row.action === 'archive' && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                                </svg>
                              )}
                              {cfg.label}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-100">
                    <td colSpan={4} className="pt-3 text-xs text-gray-500 font-medium">
                      Total cost pierdut lunar ({tableRows.filter(r => !executed[r.id]).length} resurse active)
                    </td>
                    <td className="pt-3 font-mono font-bold text-sm text-red-600" colSpan={2}>
                      {totalWasteCost.toLocaleString('ro-RO')} RON/lună
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-50 flex items-start gap-2 text-xs text-gray-500 font-medium">
              <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span>
                Resursele marcate ca „inactive" nu au înregistrat trafic în perioada specificată.
                Acțiunile simulate nu produc efecte reale - folosiți consola cloud pentru operațiuni efective.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ResourceOptimization;
