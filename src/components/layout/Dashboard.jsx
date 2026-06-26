import { useState } from 'react';
import TopBar          from './TopBar';
import AlertBanner     from './AlertBanner';
import KpiGrid         from '../kpi/KpiGrid';
import AiInsightPanel  from '../ai/AiInsightPanel';
import CostLineChart   from '../charts/CostLineChart';
import ServicePieChart from '../charts/ServicePieChart';
import DeptBarChart    from '../charts/DeptBarChart';
import ProviderBarChart from '../charts/ProviderBarChart';
import ServiceTable    from '../table/ServiceTable';

// eticheta de sectiune pe care o refolosesc pe toate cele 3 ecrane
function SectionLabel({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-gray-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
    </div>
  );
}

function Dashboard({ onNavigate }) {
  // filtrul de provider comun pentru grafic si tabel - il tin aici ca sa fie sincronizate
  const [providerFilter, setProviderFilter] = useState('');

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar activeScreen="overview" onNavigate={onNavigate} />

      <main className="max-w-[1440px] mx-auto px-6 pb-16 pt-8 space-y-8">

        {/* banner-ul cu alertele de depasire a bugetului */}
        <AlertBanner />

        {/* randul cu cei 4 indicatori KPI */}
        <section>
          <KpiGrid />
        </section>

        {/* panoul cu insight-urile generate automat */}
        <section>
          <SectionLabel
            title="Quick Insights"
            subtitle="Analiză automată a tendințelor și abaterilor de cost"
          />
          {/* trimit onNavigate ca sa pot face drill-down din cardul de departamente */}
          <AiInsightPanel onNavigate={onNavigate} />
        </section>

        {/* graficul cu evolutia lunara a costurilor */}
        <section>
          <SectionLabel
            title="Evoluție lunară"
            subtitle="Tendința cheltuielilor cloud față de pragul bugetar lunar"
          />
          <CostLineChart />
        </section>

        {/* randul cu distributia costurilor: servicii si departamente */}
        <section>
          <SectionLabel
            title="Distribuție costuri"
            subtitle="Structura costurilor pe categorii de servicii și echipe"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServicePieChart />
            <DeptBarChart />
          </div>
        </section>

        {/* randul cu providerii si tabelul de stare a serviciilor */}
        <section>
          <SectionLabel
            title="Provideri & stare servicii"
            subtitle="Ponderea furnizorilor cloud și starea operațională a serviciilor active"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProviderBarChart providerFilter={providerFilter} />
            <ServiceTable providerFilter={providerFilter} onProviderChange={setProviderFilter} />
          </div>
        </section>

      </main>
    </div>
  );
}

export default Dashboard;
