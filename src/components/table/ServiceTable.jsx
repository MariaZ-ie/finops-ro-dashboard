import { useMemo } from 'react';
import { filterFacts, getServiceTableData } from '../../data/mockData';

const STATUS_CONFIG = {
  critical: { cls: 'badge-critical', dot: 'bg-red-500',    label: 'Critical' },
  warning:  { cls: 'badge-warning',  dot: 'bg-amber-400',  label: 'Warning'  },
  online:   { cls: 'badge-online',   dot: 'bg-emerald-500 pulse-dot', label: 'Online' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.online;
  return (
    <span className={cfg.cls}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ServiceTable({ providerFilter = '', onProviderChange }) {
  const facts    = useMemo(() => filterFacts({ year: '2025' }), []);
  const tableData = useMemo(() =>
    getServiceTableData(facts, providerFilter || null),
  [facts, providerFilter]);

  return (
    <div className="card p-6">
      {/* titlul tabelului si filtrul pe provider */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
            Stare servicii
          </p>
          <p className="text-xs text-gray-500 font-medium">Top servicii sortate după cost lunar</p>
        </div>
        <select
          className="select-input"
          value={providerFilter}
          onChange={e => onProviderChange(e.target.value)}
        >
          <option value="">Toți providerii</option>
          <option value="AWS">AWS</option>
          <option value="Azure">Azure</option>
          <option value="GCP">GCP</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {['Serviciu', 'Provider', 'Tip', 'Status', 'Cost/lună'].map(col => (
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
            {tableData.map(row => (
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
      </div>
    </div>
  );
}

export default ServiceTable;
