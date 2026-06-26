// cardul asta il refolosesc pentru fiecare indicator KPI
// primeste eticheta, valoarea, variatia procentuala si culoarea de accent din stanga
const ACCENT = {
  blue:   'border-l-blue-400',
  red:    'border-l-red-400',
  green:  'border-l-emerald-400',
  amber:  'border-l-amber-400',
  violet: 'border-l-violet-400',
};

function KpiCard({
  label,
  value,
  delta,
  deltaPositiveIsGood = false,
  subtitle,
  accentColor = 'blue',
}) {
  const hasDelta = delta !== null && delta !== undefined;

  const deltaGood = hasDelta
    ? (delta > 0 ? deltaPositiveIsGood : !deltaPositiveIsGood)
    : null;

  const deltaColor = !hasDelta
    ? ''
    : deltaGood
    ? 'text-emerald-600'
    : 'text-red-500';

  const deltaSymbol = delta > 0 ? '▲' : '▼';

  return (
    <div
      className={[
        'card p-5 border-l-4 hover:shadow-card-hover transition-all duration-200',
        ACCENT[accentColor] ?? ACCENT.blue,
      ].join(' ')}
    >
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
        {label}
      </p>
      <p className="text-3xl font-bold font-mono text-gray-900 leading-none">
        {value}
      </p>
      {hasDelta && (
        <p className={`text-xs font-semibold mt-2.5 ${deltaColor}`}>
          {deltaSymbol} {Math.abs(delta)}% vs. anul anterior
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default KpiCard;
