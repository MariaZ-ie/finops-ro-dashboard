import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, ResponsiveContainer, LabelList,
} from 'recharts';
import { filterFacts, aggregateByProvider } from '../../data/mockData';

const PROVIDER_COLORS = {
  AWS:   '#FF9900',
  Azure: '#0078D4',
  GCP:   '#4285F4',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(entry => (
        <p key={entry.name} className="text-xs text-gray-600 mb-0.5 font-medium">
          {entry.name === 'netCost' ? 'Cost net' : 'Economii'}:{' '}
          <span className="font-mono font-semibold text-gray-700">
            {entry.value.toLocaleString('ro-RO')} RON
          </span>
        </p>
      ))}
    </div>
  );
}

function ProviderBarChart({ providerFilter = '' }) {
  const [year,    setYear]    = useState('2025');
  const [quarter, setQuarter] = useState('');

  const facts = useMemo(() =>
    filterFacts({ year, quarter: quarter || null }),
  [year, quarter]);

  const chartData = useMemo(() => aggregateByProvider(facts), [facts]);

  const total = useMemo(() =>
    chartData.reduce((s, d) => s + d.netCost, 0),
  [chartData]);

  return (
    <div className="card p-6">
      {/* titlul si filtrele pe an si trimestru */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
            Cost per provider
          </p>
          <p className="text-xs text-gray-500 font-medium">Distribuție cost net pe furnizor cloud</p>
        </div>
        <div className="flex gap-2">
          <select className="select-input" value={year} onChange={e => setYear(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <select className="select-input" value={quarter} onChange={e => setQuarter(e.target.value)}>
            <option value="">Toate trim.</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
      </div>

      {/* graficul cu bare orizontale pe fiecare provider */}
      <div className="min-h-[200px]">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 88, left: 8, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${Math.round(v / 1000)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 500, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
            />
            <Bar dataKey="netCost" name="netCost" radius={[0, 6, 6, 0]} maxBarSize={30}>
              {chartData.map(entry => (
                <Cell
                  key={entry.name}
                  fill={PROVIDER_COLORS[entry.name]}
                  fillOpacity={!providerFilter || entry.name === providerFilter ? 1 : 0.25}
                />
              ))}
              <LabelList
                dataKey="netCost"
                position="right"
                style={{
                  fill: '#64748b',
                  fontSize: 11,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
                formatter={v => `${Math.round(v / 1000)}k RON`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* barele de progres care arata ponderea fiecarui provider din total */}
      <div className="mt-5 space-y-3 pt-4 border-t border-gray-50">
        {chartData.map(item => {
          const pct = total > 0 ? Math.round((item.netCost / total) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 font-semibold w-12">{item.name}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                  width: `${pct}%`,
                  background: PROVIDER_COLORS[item.name],
                  opacity: !providerFilter || item.name === providerFilter ? 1 : 0.25,
                }}
                />
              </div>
              <span className="text-xs font-mono text-gray-500 w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProviderBarChart;
