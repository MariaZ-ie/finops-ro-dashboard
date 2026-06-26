import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import { filterFacts, aggregateByDepartment } from '../../data/mockData';

const DEPT_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-xs text-gray-500 font-medium mb-1.5">{label}</p>
      <p className="text-gray-900 font-mono font-semibold text-sm">
        {payload[0].value.toLocaleString('ro-RO')} RON
      </p>
    </div>
  );
}

function DeptBarChart() {
  const [year,    setYear]    = useState('2025');
  const [quarter, setQuarter] = useState('');

  const facts = useMemo(() =>
    filterFacts({ year, quarter: quarter || null }),
  [year, quarter]);

  const chartData = useMemo(() => aggregateByDepartment(facts), [facts]);

  return (
    <div className="card p-6">
      {/* titlul si filtrele pe an si trimestru */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
            Cost per departament
          </p>
          <p className="text-xs text-gray-500 font-medium">Costuri nete agregate pe echipă</p>
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

      {/* graficul cu bare, fiecare departament are culoarea lui */}
      <div className="min-h-[260px]">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 8, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
            />
            <Bar dataKey="netCost" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* legenda cu numele departamentelor */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-gray-50">
        {chartData.map((item, index) => (
          <span key={item.name} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: DEPT_COLORS[index % DEPT_COLORS.length] }}
            />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default DeptBarChart;
