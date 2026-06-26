import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { filterFacts, aggregateByServiceType } from '../../data/mockData';

const SERVICE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ef4444', '#06b6d4',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
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

function ServicePieChart() {
  const [department, setDepartment] = useState('');

  const facts = useMemo(() =>
    filterFacts({ year: '2025', departmentId: department || null }),
  [department]);

  const rawData = useMemo(() => aggregateByServiceType(facts), [facts]);

  const total = useMemo(() =>
    rawData.reduce((s, i) => s + i.value, 0),
  [rawData]);

  const chartData = useMemo(() =>
    rawData.map((item, index) => ({
      ...item,
      fill:    SERVICE_COLORS[index % SERVICE_COLORS.length],
      percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
    })),
  [rawData, total]);

  return (
    <div className="card p-6">
      {/* titlul si filtrul pe departament */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
            Distribuție servicii
          </p>
          <p className="text-xs text-gray-500 font-medium">Cost net pe tip de serviciu cloud</p>
        </div>
        <select className="select-input" value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">Toate departamentele</option>
          <option value="1">Engineering</option>
          <option value="2">DevOps</option>
          <option value="3">Data</option>
          <option value="4">Security</option>
        </select>
      </div>

      {/* graficul tip inel (donut) cu tipurile de servicii */}
      <div className="min-h-[260px]">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={100}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* legenda cu procentele pe fiecare tip de serviciu */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-50">
        {chartData.map(item => (
          <span key={item.name} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.fill }} />
            <span className="truncate">{item.name}</span>
            <span className="text-gray-500 ml-auto font-mono">{item.percent}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default ServicePieChart;
