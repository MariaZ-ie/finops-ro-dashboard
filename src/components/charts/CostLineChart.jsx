import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { filterFacts, aggregateByMonth } from '../../data/mockData';

const BUDGET = 33000;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const val  = payload[0].value;
  const over = val > BUDGET;
  return (
    <div className="chart-tooltip">
      <p className="text-xs text-gray-500 font-medium mb-1.5">{label}</p>
      <p className="text-gray-900 font-mono font-semibold text-sm">
        {val.toLocaleString('ro-RO')} RON
      </p>
      {over && (
        <p className="text-red-500 text-xs mt-1 font-semibold">
          ▲ +{Math.round(((val - BUDGET) / BUDGET) * 100)}% față de buget
        </p>
      )}
    </div>
  );
}

function CostLineChart() {
  const [year,     setYear]     = useState('2025');
  const [provider, setProvider] = useState('');

  const facts = useMemo(() =>
    filterFacts({ year, providerId: provider || null }),
  [year, provider]);

  const chartData = useMemo(() => aggregateByMonth(facts, year), [facts, year]);

  const maxValue = useMemo(() =>
    Math.max(...chartData.map(d => d.netCost), BUDGET),
  [chartData]);

  return (
    <div className="card p-6">
      {/* titlul graficului si dropdown-urile de filtrare */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
            Evoluția costurilor lunare
          </p>
          <p className="text-xs text-gray-500 font-medium">Cost net vs. limita buget lunar</p>
        </div>
        <div className="flex gap-2">
          <select className="select-input" value={year} onChange={e => setYear(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <select className="select-input" value={provider} onChange={e => setProvider(e.target.value)}>
            <option value="">Toți providerii</option>
            <option value="1">AWS</option>
            <option value="2">Azure</option>
            <option value="3">GCP</option>
          </select>
        </div>
      </div>

      {/* graficul propriu-zis cu linia de cost si linia de buget */}
      <div className="min-h-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 60, left: 8, bottom: 5 }}>
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${Math.round(v / 1000)}k`}
              domain={[0, Math.ceil(maxValue * 1.15 / 1000) * 1000]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={BUDGET}
              stroke="#fca5a5"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: 'Buget 33k RON',
                fill: '#f87171',
                fontSize: 10,
                fontFamily: 'Inter',
                position: 'right',
              }}
            />
            <Line
              type="monotone"
              dataKey="netCost"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* legenda de sub grafic */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-50">
        <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
          <span className="w-5 h-[2.5px] rounded-full bg-blue-500 inline-block" />
          Cost net lunar
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
          <span className="w-5 inline-block border-t-2 border-dashed border-red-300" />
          Limită buget 33k RON
        </span>
      </div>
    </div>
  );
}

export default CostLineChart;
