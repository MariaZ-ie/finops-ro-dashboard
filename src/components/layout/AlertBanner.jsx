import { useMemo } from 'react';
import { filterFacts, aggregateByMonth } from '../../data/mockData';

const BUDGET = 33000;

function AlertBanner() {
  const facts = useMemo(() => filterFacts({ year: '2025' }), []);

  const alerts = useMemo(() => {
    try {
      const luni = aggregateByMonth(facts, '2025');
      if (!luni || luni.length === 0) return [];
      return luni
        .filter(l => l && l.netCost > BUDGET)
        .map(l => ({
          luna:     l.month,
          depasire: Math.round(((l.netCost - BUDGET) / BUDGET) * 100),
          cost:     l.netCost,
        }));
    } catch {
      return [];
    }
  }, [facts]);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-red-300 bg-red-100 px-5 py-4 shadow-sm">
      <div className="flex items-start gap-4">

        {/* iconita de avertizare, am facut-o mai mare ca sa iasa in evidenta */}
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-red-200
                        flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"/>
          </svg>
        </div>

        {/* textul cu lunile care au depasit bugetul */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-red-800 leading-snug">
            Alertă buget pentru anul 2025 -{' '}
            {alerts.length === 1
              ? '1 lună a depășit'
              : `${alerts.length} luni au depășit`}{' '}
            limita de{' '}
            <span className="font-mono">33.000 RON</span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {alerts.map(a => (
              <span key={a.luna} className="text-xs text-red-700 font-mono">
                {a.luna}:{' '}
                <span className="font-bold text-red-800">+{a.depasire}%</span>
                <span className="text-red-600/80 ml-1">
                  ({a.cost.toLocaleString('ro-RO')} RON)
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* eticheta cu anul, in coltul din dreapta */}
        <span className="text-[10px] font-bold text-red-500 whitespace-nowrap
                         flex-shrink-0 mt-0.5 uppercase tracking-wider bg-red-200
                         px-2 py-1 rounded-md">
          Anul 2025
        </span>

      </div>
    </div>
  );
}

export default AlertBanner;
