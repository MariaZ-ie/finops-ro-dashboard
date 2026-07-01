
//  Date simulate cu trenduri realiste si variate


//dimensiunea Date - genereaza toate lunile din 2024 si 2025
export const dimDate = [];
const MONTH_NAMES = [
  'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'
];
const MONTH_SHORT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

let dateId = 1;
[2024, 2025].forEach(year => {
  for (let month = 1; month <= 12; month++) {
    dimDate.push({
      date_id:     dateId++,
      full_date:   `${year}-${String(month).padStart(2,'0')}-01`,
      day:         1,
      month,
      month_name:  MONTH_NAMES[month - 1],
      month_short: MONTH_SHORT[month - 1],
      quarter:     Math.ceil(month / 3),
      year,
    });
  }
});

//dimensiunea departament- cele 4 departamente utilizate
export const dimDepartment = [
  { department_id: 1, dept_name: 'Engineering', cost_center: 'CC-ENG-01', team: 'Backend',   manager: 'Andrei Ionescu'   },
  { department_id: 2, dept_name: 'DevOps',      cost_center: 'CC-OPS-02', team: 'Platform',  manager: 'Maria Constantin' },
  { department_id: 3, dept_name: 'Data',        cost_center: 'CC-DAT-03', team: 'Analytics', manager: 'Radu Popescu'     },
  { department_id: 4, dept_name: 'Security',    cost_center: 'CC-SEC-04', team: 'InfoSec',   manager: 'Elena Dumitrescu' },
];

//dimensiunea serviciu - 10 servicii cloud grupate pe cei 3 furnizori
export const dimService = [
  { service_id: 1,  service_name: 'EC2 Compute',   service_type: 'Compute',  category: 'Infrastructure', provider_name: 'AWS'   },
  { service_id: 2,  service_name: 'Azure VMs',      service_type: 'Compute',  category: 'Infrastructure', provider_name: 'Azure' },
  { service_id: 3,  service_name: 'GCP Kubernetes', service_type: 'Compute',  category: 'Infrastructure', provider_name: 'GCP'   },
  { service_id: 4,  service_name: 'S3 Storage',     service_type: 'Storage',  category: 'Storage',        provider_name: 'AWS'   },
  { service_id: 5,  service_name: 'Azure Blob',     service_type: 'Storage',  category: 'Storage',        provider_name: 'Azure' },
  { service_id: 6,  service_name: 'RDS Database',   service_type: 'Database', category: 'Data',           provider_name: 'AWS'   },
  { service_id: 7,  service_name: 'GCP BigQuery',   service_type: 'Database', category: 'Data',           provider_name: 'GCP'   },
  { service_id: 8,  service_name: 'CloudFront CDN', service_type: 'Network',  category: 'Network',        provider_name: 'AWS'   },
  { service_id: 9,  service_name: 'GuardDuty',      service_type: 'Security', category: 'Security',       provider_name: 'AWS'   },
  { service_id: 10, service_name: 'SageMaker AI',   service_type: 'AI/ML',    category: 'AI',             provider_name: 'AWS'   },
];

//dimensiunea provider - AWS, Azure, GCP
export const dimProvider = [
  { provider_id: 1, provider_name: 'AWS',   account_id: 'aws-123456789', environment: 'production'  },
  { provider_id: 2, provider_name: 'Azure', account_id: 'az-987654321',  environment: 'production'  },
  { provider_id: 3, provider_name: 'GCP',   account_id: 'gcp-456789123', environment: 'development' },
];

//configurez trendurile ca sa nu iasa datele plate - sezonalitate si crestere în 2025
const SEASON = [0.82, 0.78, 0.88, 0.95, 1.02, 1.08, 1.15, 1.22, 1.18, 1.28, 1.42, 1.38];
const GROWTH_2025 = { 1: 1.25, 2: 1.15, 3: 1.40, 4: 1.05 };
const BASE_MONTHLY = { 1: 14500, 2: 10200, 3: 7800, 4: 4200 };
const SERVICE_W = {
  1: [0.30, 0.18, 0.04, 0.12, 0.06, 0.14, 0.02, 0.06, 0.02, 0.06],
  2: [0.25, 0.20, 0.12, 0.10, 0.08, 0.08, 0.04, 0.08, 0.04, 0.01],
  3: [0.06, 0.04, 0.08, 0.08, 0.05, 0.18, 0.28, 0.02, 0.01, 0.20],
  4: [0.12, 0.10, 0.02, 0.05, 0.04, 0.06, 0.01, 0.08, 0.48, 0.04],
};
const DISCOUNT_BASE = { 'AWS': 0.09, 'Azure': 0.06, 'GCP': 0.04 };

function sr(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

//  FACT_COSTS 
export const factCosts = [];
let costId = 1;

dimDate.forEach(dateRow => {
  dimDepartment.forEach(dept => {
    dimService.forEach((svc, sIdx) => {
      const weight     = SERVICE_W[dept.department_id][sIdx];
      const seas       = SEASON[dateRow.month - 1];
      const grow       = dateRow.year === 2025 ? GROWTH_2025[dept.department_id] : 1.0;
      const noise      = 0.92 + sr(costId * 17 + sIdx * 31) * 0.16;
      const costAmount = BASE_MONTHLY[dept.department_id] * weight * seas * grow * noise;

      if (costAmount < 3) { costId++; return; }

      const discRate    = DISCOUNT_BASE[svc.provider_name] + sr(costId * 3 + 99) * 0.04;
      const discountAmt = costAmount * discRate;
      const netCost     = costAmount - discountAmt;
      const usageBase   = svc.service_type === 'Compute' ? 450 : svc.service_type === 'Database' ? 280 : svc.service_type === 'Storage' ? 820 : 120;
      const usageQty    = usageBase * (0.7 + sr(costId * 11) * 0.6);
      const provMap     = { 'AWS': 1, 'Azure': 2, 'GCP': 3 };

      factCosts.push({
        cost_id:         costId,
        date_id:         dateRow.date_id,
        service_id:      svc.service_id,
        department_id:   dept.department_id,
        provider_id:     provMap[svc.provider_name],
        cost_amount:     parseFloat(costAmount.toFixed(2)),
        usage_quantity:  parseFloat(usageQty.toFixed(2)),
        discount_amount: parseFloat(discountAmt.toFixed(2)),
        net_cost:        parseFloat(netCost.toFixed(2)),
        currency:        'RON',
      });
      costId++;
    });
  });
});

//functiile helper pe care le folosesc in toate componentele, pentru filtrare si agregare

export function filterFacts({ year, quarter, departmentId, providerId }) {
  const validDateIds = new Set(
    dimDate.filter(d =>
      (!year    || d.year    === parseInt(year))   &&
      (!quarter || d.quarter === parseInt(quarter))
    ).map(d => d.date_id)
  );
  const validSvcIds = providerId
    ? new Set(dimService.filter(s => {
        const p = dimProvider.find(p => p.provider_id === parseInt(providerId));
        return p && s.provider_name === p.provider_name;
      }).map(s => s.service_id))
    : null;
  return factCosts.filter(f =>
    validDateIds.has(f.date_id) &&
    (!departmentId || f.department_id === parseInt(departmentId)) &&
    (!validSvcIds  || validSvcIds.has(f.service_id))
  );
}

export function aggregateByMonth(facts, year) {
  return dimDate.filter(d => d.year === parseInt(year)).map(d => {
    const s = facts.filter(f => f.date_id === d.date_id);
    return {
      month:     d.month_short,
      fullName:  d.month_name,
      quarter:   `Q${d.quarter}`,
      netCost:   Math.round(s.reduce((a, f) => a + f.net_cost, 0)),
      grossCost: Math.round(s.reduce((a, f) => a + f.cost_amount, 0)),
      discount:  Math.round(s.reduce((a, f) => a + f.discount_amount, 0)),
    };
  });
}

export function aggregateByDepartment(facts) {
  return dimDepartment.map(dept => {
    const s = facts.filter(f => f.department_id === dept.department_id);
    return {
      name:      dept.dept_name,
      manager:   dept.manager,
      netCost:   Math.round(s.reduce((a, f) => a + f.net_cost, 0)),
      grossCost: Math.round(s.reduce((a, f) => a + f.cost_amount, 0)),
    };
  });
}

export function aggregateByServiceType(facts) {
  const types = ['Compute', 'Storage', 'Database', 'Network', 'Security', 'AI/ML'];
  return types.map(type => {
    const ids   = new Set(dimService.filter(s => s.service_type === type).map(s => s.service_id));
    const value = Math.round(facts.filter(f => ids.has(f.service_id)).reduce((a, f) => a + f.net_cost, 0));
    return { name: type, value };
  }).filter(x => x.value > 0);
}

export function aggregateByProvider(facts) {
  return dimProvider.map(prov => {
    const ids      = new Set(dimService.filter(s => s.provider_name === prov.provider_name).map(s => s.service_id));
    const netCost  = Math.round(facts.filter(f => ids.has(f.service_id)).reduce((a, f) => a + f.net_cost, 0));
    const discounts= Math.round(facts.filter(f => ids.has(f.service_id)).reduce((a, f) => a + f.discount_amount, 0));
    return { name: prov.provider_name, netCost, discounts };
  });
}

export function computeKPIs(facts, factsCompare = null) {
  const totalNet      = Math.round(facts.reduce((a, f) => a + f.net_cost, 0));
  const totalGross    = Math.round(facts.reduce((a, f) => a + f.cost_amount, 0));
  const totalDiscount = Math.round(facts.reduce((a, f) => a + f.discount_amount, 0));
  const activeDates   = new Set(facts.map(f => f.date_id)).size || 1;
  const avgPerMonth   = Math.round(totalNet / activeDates);
  const activeServices= new Set(facts.map(f => f.service_id)).size;
  const discountPct   = totalGross > 0 ? parseFloat(((totalDiscount / totalGross) * 100).toFixed(1)) : 0;
  const compareCost   = factsCompare ? Math.round(factsCompare.reduce((a, f) => a + f.net_cost, 0)) : null;
  const deltaVsPrev   = compareCost ? parseFloat((((totalNet - compareCost) / compareCost) * 100).toFixed(1)) : null;
  const BUGET_ANUAL   = 33000 * activeDates;
  const bugetRamas    = BUGET_ANUAL - totalNet;
  const bugetDepasit  = bugetRamas < 0;
  return {
    totalNet, totalGross, totalDiscount, avgPerMonth, activeServices,
    discountPct, deltaVsPrev,
    bugetRamas:  Math.abs(bugetRamas),
    bugetDepasit,
  };
}

export function getServiceTableData(facts, providerFilter = null) {
  const uniqueDates = new Set(facts.map(f => f.date_id)).size || 1;
  return dimService
    .filter(s => !providerFilter || s.provider_name === providerFilter)
    .map(svc => {
      const s          = facts.filter(f => f.service_id === svc.service_id);
      const monthlyCost= Math.round(s.reduce((a, f) => a + f.net_cost, 0) / uniqueDates);
      const prov       = dimProvider.find(p => p.provider_name === svc.provider_name);
      const avgAll     = facts.reduce((a, f) => a + f.net_cost, 0) / Math.max(1, new Set(facts.map(f => f.service_id)).size) / uniqueDates;
      const status = monthlyCost > avgAll * 1.8 ?
        'critical' : monthlyCost > avgAll * 1.3 ? 'warning' : 'online';
      return {
        service_id:  svc.service_id,
        name:        svc.service_name,
        serviceType: svc.service_type,
        provider:    svc.provider_name,
        environment: prov?.environment ?? 'production',
        monthlyCost,
        status,
      };
    })
    .filter(s => s.monthlyCost > 0)
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
}
