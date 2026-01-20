
import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import MainDashboard from './components/MainDashboard';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial application setup / data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4500); // 4.5 seconds for demo purposes

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <MainDashboard onReset={() => setIsLoading(true)} />
      )}
    </div>
  );
};

export default App;
