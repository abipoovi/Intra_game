import React from 'react';
import { MysteryProvider, useMystery } from './context/MysteryContext';
import { LandingPage } from './components/LandingPage';
import { PlayerLoginPage } from './components/PlayerLoginPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { PlayerWaitingDashboard } from './components/PlayerWaitingDashboard';
import { PlayerGameDashboard } from './components/PlayerGameDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PlayerResultsPage } from './components/PlayerResultsPage';
import { Shield } from 'lucide-react';

function AppContent() {
  const { currentView, isLoading } = useMystery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <span className="font-mono text-xs text-zinc-400 tracking-widest uppercase">
            Loading Case Network...
          </span>
        </div>
      </div>
    );
  }

  switch (currentView) {
    case 'landing':
      return <LandingPage />;
    case 'player-login':
      return <PlayerLoginPage />;
    case 'admin-login':
      return <AdminLoginPage />;
    case 'player-waiting':
      return <PlayerWaitingDashboard />;
    case 'player-game':
      return <PlayerGameDashboard />;
    case 'player-results':
      return <PlayerResultsPage />;
    case 'admin-dashboard':
      return <AdminDashboard />;
    default:
      return <LandingPage />;
  }
}

export default function App() {
  return (
    <MysteryProvider>
      <AppContent />
    </MysteryProvider>
  );
}
