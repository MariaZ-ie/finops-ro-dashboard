import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ResponsiveContainer, PieChart, Pie,
} from 'recharts';
import TopBar from './TopBar';
import {
  filterFacts,
  aggregateByDepartment,
  aggregateByServiceType,
  computeKPIs,
  dimDepartment,
  getServiceTableData,
} from '../../data/mockData';

// culorile pentru departamente si configurarea badge-urilor de status
const DEPT_COLORS   = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];
const STATUS_CONFIG = {
  critical: { cls: 'badge-critical', dot: 'bg-red-500',    label: 'Critical' },
  warning:  { cls: 'badge-warning',  dot: 'bg-amber-400',  label: 'Warning'  },
  online:   { cls: 'badge-online',   dot: 'bg-emerald-500 pulse-dot', label: 'Online' },
};

function deptStatus(pct) {
  if (pct >= 25) return 'critical';
  if (pct >= 10) return 'warning';
  return 'online';
}

// niste componente mici pe care le refolosesc mai jos in pagina
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.online;
  return (
    <span className={cfg.cls}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function KpiCard({ accent, label, value, trend, trendColor, subtitle }) {
  const accentMap = {
    blue:   'border-l-blue-400',
    green:  'border-l-emerald-400',
    amber:  'border-l-amber-400',
    violet: 'border-l-violet-400',
  };
  return (
    <div className={`card border-l-4 p-6 hover:shadow-card-hover transition-all duration-200 ${accentMap[accent]}`}>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">{label}</p>
      <p className="text-3xl font-bold font-mono text-gray-900 leading-none">{value}</p>
      {trend && <p className={`text-xs font-semibold mt-3 ${trendColor}`}>{trend}</p>}
      {subtitle && <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
}

function SectionLabel({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-gray-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
    </div>
  );
}

// tooltip-urile personalizate pentru graficul cu bare si cel tip inel
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-xs text-gray-600 mb-0.5 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ background: p.fill }} />
          {p.dataKey === 'cost2025' ? '2025' : '2024'}:
          <span className="font-mono font-semibold text-gray-700 ml-1">
            {p.value.toLocaleString('ro-RO')} RON
          </span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-sm mb-1.5" style={{ color: item.payload.fill }}>
        {item.name}
      </p>
      <p className="text-gray-900 font-mono text-sm">
        {item.value.toLocaleString('ro-RO')} RON
      </p>
      <p className="text-gray-500 text-xs mt-0.5 font-medium">{item.payload.percent}% din total</p>
    </div>
  );
}

// componenta principala a ecranului de departamente
// primesc initialDept de la App.jsx cand se face drill-down din Overview
// il folosesc ca valoare initiala a filtrului ca sa pre-selectez departamentul corect
function DepartmentAnalysis({ onNavigate, initialDept = '' }) {
  // aici preiau departamentul trimis din tab-ul de overview ca sa pun filtrul automat
  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [year,         setYear]         = useState('2025');

  // filtrez datele pe anul si departamentul selectat, plus anul precedent pentru comparatie
  const facts = useMemo(() =>
    filterFacts({ year, departmentId: selectedDept || null }),
  [year, selectedDept]);

  const factsPrev = useMemo(() =>
    filterFacts({ year: String(parseInt(year) - 1), departmentId: selectedDept || null }),
  [year, selectedDept]);

  const kpis = useMemo(() => computeKPIs(facts, factsPrev), [facts, factsPrev]);

  // datele pentru graficul de comparatie 2024 vs 2025
  const facts2025all = useMemo(() => filterFacts({ year: '2025' }), []);
  const facts2024all = useMemo(() => filterFacts({ year: '2024' }), []);

  const comparisonData = useMemo(() => {
    const d25 = aggregateByDepartment(facts2025all);
    const d24 = aggregateByDepartment(facts2024all);
    return d25.map((d, i) => ({
      name:     d.name,
      cost2025: d.netCost,
      cost2024: d24[i].netCost,
    }));
  }, [facts2025all, facts2024all]);

  // datele pentru graficul tip inel cu ponderea fiecarui departament
  const donutData = useMemo(() => {
    const depts = aggregateByDepartment(filterFacts({ year }));
    const total = depts.reduce((s, d) => s + d.netCost, 0);
    return depts.map((d, i) => ({
      name:    d.name,
      value:   d.netCost,
      fill:    DEPT_COLORS[i],
      percent: total > 0 ? Math.round((d.netCost / total) * 100) : 0,
    }));
  }, [year]);

  // pregatesc randurile pentru tabelul rezumat cu toate departamentele
  const summaryRows = useMemo(() => {
    const d25   = aggregateByDepartment(facts2025all);
    const d24   = aggregateByDepartment(facts2024all);
    const total = d25.reduce((s, d) => s + d.netCost, 0);
    return d25.map((d, i) => {
      const meta  = dimDepartment[i];
      const yoy   = d24[i].netCost > 0
        ? Math.round(((d.netCost - d24[i].netCost) / d24[i].netCost) * 100)
        : 0;
      return {
        id:         meta.department_id,
        name:       d.name,
        costCenter: meta.cost_center,
        team:       meta.team,
        manager:    meta.manager,
        cost2025:   d.netCost,
        cost2024:   d24[i].netCost,
        yoy,
        share:      total > 0 ? Math.round((d.netCost / total) * 100) : 0,
        status:     deptStatus(yoy),
      };
    });
  }, [facts2025all, facts2024all]);

  // daca am ales un departament, scot lista de servicii folosite de el
  const serviceRows = useMemo(() => {
    if (!selectedDept) return [];
    const deptFacts = filterFacts({ year, departmentId: selectedDept });
    return getServiceTableData(deptFacts);
  }, [year, selectedDept]);

  const selectedDeptName = dimDepartment.find(
    d => String(d.department_id) === String(selectedDept)
  )?.dept_name ?? 'Toate departamentele';

  const prevYear = String(parseInt(year) - 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar activeScreen="departments" onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-6 pb-16 pt-8 space-y-8">

        {/* antetul paginii cu titlu si selectorul de an */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Alocare Costuri pe Departamente
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
             Analiză detaliată a cheltuielilor cloud pe echipă, cu comparație anuală și distribuție pe servicii.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">An fiscal</label>
            <select className="select-input" value={year} onChange={e => setYear(e.target.value)}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        {/* randul cu cei 3 indicatori cheie */}
        <section>
          <SectionLabel
            title="Indicatori cheie"
            subtitle={`Rezumat financiar pentru ${selectedDeptName.toLowerCase()}, ${year}`}
          />
          <div className="grid grid-cols-3 gap-6">
            <KpiCard
              accent="blue"
              label="Cost total net"
              value={`${kpis.totalNet.toLocaleString('ro-RO')} RON`}
              trend={kpis.deltaVsPrev !== null
                ? `${kpis.deltaVsPrev > 0 ? '▲' : '▼'} ${Math.abs(kpis.deltaVsPrev)}% față de ${prevYear}`
                : null}
              trendColor={kpis.deltaVsPrev > 0 ? 'text-red-500' : 'text-emerald-600'}
              subtitle="Cost net total perioadă selectată"
            />
            <KpiCard
              accent={kpis.deltaVsPrev > 0 ? 'amber' : 'green'}
              label="Variație anuală"
              value={kpis.deltaVsPrev !== null
                ? `${kpis.deltaVsPrev > 0 ? '+' : ''}${kpis.deltaVsPrev}%`
                : '-'}
              trend={kpis.deltaVsPrev !== null
                ? `Comparativ cu ${prevYear}`
                : 'Date insuficiente'}
              trendColor="text-gray-500"
              subtitle={kpis.deltaVsPrev > 0
                ? 'Cheltuielile au crescut față de anul anterior'
                : 'Cheltuielile au scăzut față de anul anterior'}
            />
            <KpiCard
              accent="green"
              label="Economii realizate"
              value={`${kpis.totalDiscount.toLocaleString('ro-RO')} RON`}
              trend={`${kpis.discountPct}% din costul brut`}
              trendColor="text-emerald-600"
              subtitle="Reduceri aplicate de furnizori cloud"
            />
          </div>
        </section>

        {/* randul cu cele doua grafice: comparatie si distributie */}
        <section>
          <SectionLabel
            title="Comparație și distribuție"
            subtitle="Evoluția anuală și ponderea fiecărui departament în cheltuielile totale"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* graficul cu bare grupate: 2024 langa 2025 */}
            <div className="card p-6">
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
                  Comparație 2024 vs 2025
                </p>
                <p className="text-xs text-gray-500 font-medium">Cost net per departament - ambii ani</p>
              </div>
              <div className="min-h-[280px]">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 8, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                    <Bar dataKey="cost2024" name="cost2024" fill="#cbd5e1" radius={[5,5,0,0]} maxBarSize={32} />
                    <Bar dataKey="cost2025" name="cost2025" radius={[5,5,0,0]} maxBarSize={32}>
                      {comparisonData.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-50">
                <span className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" /> 2024
                </span>
                {comparisonData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: DEPT_COLORS[i] }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>

            {/* graficul tip inel cu procentele pe departament */}
            <div className="card p-6">
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
                  Distribuție costuri {year}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Ponderea fiecărui departament în totalul cheltuielilor
                </p>
              </div>
              <div className="min-h-[280px]">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-50">
                {donutData.map(item => (
                  <span key={item.name} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.fill }} />
                    <span className="truncate">{item.name}</span>
                    <span className="text-gray-500 ml-auto font-mono">{item.percent}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* tabelul cu datele, are doua moduri: rezumat sau detaliat */}
        <section>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 tracking-tight">
                Alocare costuri pe departamente
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {selectedDept
                  ? `Servicii cloud utilizate de echipa ${selectedDeptName}`
                  : 'Rezumat financiar complet - toate departamentele'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Filtrare departament</label>
              <select
                className="select-input"
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
              >
                <option value="">Toate departamentele</option>
                {dimDepartment.map(d => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.dept_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card p-6">
            <div className="overflow-x-auto">

              {/* vederea rezumat: toate departamentele intr-un tabel */}
              {!selectedDept && (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Departament', 'Centru de cost', 'Echipă', 'Manager',
                        'Cost 2025', 'Cost 2024', 'Variație', 'Pondere', 'Statut'].map(col => (
                        <th
                          key={col}
                          className="text-left text-[10px] text-gray-500 font-semibold uppercase tracking-widest pb-3 pr-4 last:pr-0"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map(row => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-50 hover:bg-slate-50/80 transition-colors duration-100"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                  style={{ background: DEPT_COLORS[row.id - 1] }} />
                            <span className="font-semibold text-gray-800 text-xs">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-600 font-mono">{row.costCenter}</td>
                        <td className="py-3 pr-4 text-xs text-gray-600">{row.team}</td>
                        <td className="py-3 pr-4 text-xs text-gray-700 font-medium">{row.manager}</td>
                        <td className="py-3 pr-4 text-xs font-mono font-semibold text-gray-800">
                          {row.cost2025.toLocaleString('ro-RO')} RON
                        </td>
                        <td className="py-3 pr-4 text-xs font-mono text-gray-600">
                          {row.cost2024.toLocaleString('ro-RO')} RON
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-semibold font-mono ${
                            row.yoy > 0 ? 'text-red-500' : 'text-emerald-600'
                          }`}>
                            {row.yoy > 0 ? '+' : ''}{row.yoy}%
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${row.share}%`, background: DEPT_COLORS[row.id - 1] }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 w-7 text-right">
                              {row.share}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3"><StatusBadge status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* vederea detaliata: serviciile unui singur departament */}
              {selectedDept && (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ background: DEPT_COLORS[parseInt(selectedDept) - 1] }} />
                    <span className="text-xs font-semibold text-gray-700">
                      Servicii utilizate - {selectedDeptName}
                    </span>
                    <button
                      onClick={() => setSelectedDept('')}
                      className="ml-auto text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                    >
                      ← Înapoi la toate departamentele
                    </button>
                  </div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Serviciu', 'Provider', 'Tip serviciu', 'Status', 'Cost lunar mediu'].map(col => (
                          <th
                            key={col}
                            className="text-left text-[10px] text-gray-500 font-semibold uppercase tracking-widest pb-3 pr-4 last:pr-0 last:text-right"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {serviceRows.map(row => (
                        <tr
                          key={row.service_id}
                          className="border-b border-gray-50 hover:bg-slate-50/80 transition-colors duration-100"
                        >
                          <td className="py-3 pr-4 font-medium text-gray-800 text-xs">{row.name}</td>
                          <td className="py-3 pr-4 text-xs text-gray-600 font-medium">{row.provider}</td>
                          <td className="py-3 pr-4 text-xs text-gray-600">{row.serviceType}</td>
                          <td className="py-3 pr-4"><StatusBadge status={row.status} /></td>
                          <td className="py-3 text-right font-mono font-semibold text-xs text-gray-800">
                            {row.monthlyCost.toLocaleString('ro-RO')} RON
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default DepartmentAnalysis;
