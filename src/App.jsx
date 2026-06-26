import { useState, useCallback } from 'react';
import Dashboard            from './components/layout/Dashboard';
import DepartmentAnalysis   from './components/layout/DepartmentAnalysis';
import ResourceOptimization from './components/layout/ResourceOptimization';

function App() {
  // ecranul activ - overview | departments | optimization
  const [screen, setScreen] = useState('overview');

  // parametri optionali trimisi odata cu navigarea (de ex. departamentul pre-selectat)
  // ii resetez la {} de fiecare data cand se navigheaza fara parametri expliciți
  const [navParams, setNavParams] = useState({});

  // functia unica de navigare pe care o trimit in jos la toate componentele
  // accepta un id de ecran si, optional, un obiect de parametri
  // exemplu: navigate('departments', { dept: '3' })
  const navigate = useCallback((screenId, params = {}) => {
    setNavParams(params);
    setScreen(screenId);
  }, []);

  if (screen === 'departments') {
    // trimit si departamentul pre-selectat daca a venit prin drill-down din Overview
    return (
      <DepartmentAnalysis
        onNavigate={navigate}
        initialDept={navParams.dept ?? ''}
      />
    );
  }

  if (screen === 'optimization') {
    return <ResourceOptimization onNavigate={navigate} />;
  }

  return <Dashboard onNavigate={navigate} />;
}

export default App;
