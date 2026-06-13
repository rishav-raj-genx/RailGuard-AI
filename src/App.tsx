import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ControlCenter from './components/ControlCenter';
import PassengerApp from './components/PassengerApp';
import StaffRoom from './components/StaffRoom';
import { Train, PriorityAlert } from './types';
import { INITIAL_TRAINS, INITIAL_ALERTS, INITIAL_CHAT } from './data';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'control-center' | 'passenger-app' | 'staff-ai'>('landing');
  const [trains, setTrains] = useState<Train[]>(INITIAL_TRAINS);
  const [alerts, setAlerts] = useState<PriorityAlert[]>(INITIAL_ALERTS);

  // Sync state functions
  const fetchTrains = async () => {
    try {
      const res = await fetch('/api/trains');
      if (res.ok) {
        const data = await res.json();
        setTrains(data);
      }
    } catch (err) {
      console.warn("Express API offline, operating with in-memory offline state.");
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.warn("Express API offline, operating with in-memory offline state.");
    }
  };

  const handleReroute = async (trainId: string) => {
    try {
      const res = await fetch(`/api/trains/${trainId}/reroute`, { method: 'POST' });
      const data = await res.json();
      console.log(data.message);
      fetchTrains();
      fetchAlerts();
    } catch (err) {
      // Local fallback modifier
      setTrains(prev => prev.map(t => {
        if (t.id === trainId) {
          return {
            ...t,
            status: 'Optimal',
            safetyAlert: 'Clear',
            riskScore: Math.max(2, Math.floor(t.riskScore / 5)),
            activeFaults: 0,
            delayMinutes: Math.max(0, t.delayMinutes - 10)
          };
        }
        return t;
      }));
      setAlerts(prev => prev.filter(a => a.associatedTrainId !== trainId));
    }
  };

  const handleEmergencyHalt = async (trainId: string) => {
    try {
      const res = await fetch(`/api/trains/${trainId}/emergency`, { method: 'POST' });
      const data = await res.json();
      console.log(data.message);
      fetchTrains();
      fetchAlerts();
    } catch (err) {
      // Local fallback modifier
      setTrains(prev => prev.map(t => {
        if (t.id === trainId) {
          return {
            ...t,
            currentSpeed: 0,
            status: 'Critical',
            safetyAlert: 'Critical',
            riskScore: 98,
            activeFaults: t.activeFaults + 1
          };
        }
        return t;
      }));
      setAlerts(prev => [
        {
          id: `alert-${Date.now()}`,
          type: 'engineering',
          title: `EMERGENCYHALT: ${trainId}`,
          description: `Manual Emergency halt triggered locally for track safety.`,
          criticality: 'High',
          associatedTrainId: trainId
        },
        ...prev
      ]);
    }
  };

  const handleEmergencyHaltAll = async () => {
    try {
      const res = await fetch('/api/emergency-halt-all', { method: 'POST' });
      const data = await res.json();
      console.log(data.message);
      fetchTrains();
      fetchAlerts();
    } catch (err) {
      // Local fallback components
      setTrains(prev => prev.map(t => ({
        ...t,
        currentSpeed: 0,
        status: 'Critical',
        safetyAlert: 'Critical',
        riskScore: 99
      })));
      setAlerts(prev => [
        {
          id: `alert-${Date.now()}`,
          type: 'engineering',
          title: "GLOBAL EMERGENCY SHUTDOWN",
          description: "System-wide automated halts deployed locally. All transit stopped.",
          criticality: 'High'
        },
        ...prev
      ]);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
      }
    } catch (err) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  };

  // Poll state parameters every 5 seconds to animate train positions
  useEffect(() => {
    fetchTrains();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchTrains();
      fetchAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-neutral-950 font-sans antialiased text-white selection:bg-teal-500 selection:text-black">
      {activeTab === 'landing' && (
        <LandingPage 
          onNavigate={setActiveTab} 
          trainCount={trains.length} 
          alertCount={alerts.length} 
        />
      )}

      {activeTab === 'control-center' && (
        <ControlCenter 
          trains={trains} 
          alerts={alerts} 
          onBack={() => setActiveTab('landing')} 
          onReroute={handleReroute}
          onEmergencyHalt={handleEmergencyHalt}
          onEmergencyHaltAll={handleEmergencyHaltAll}
          onDismissAlert={handleDismissAlert}
        />
      )}

      {activeTab === 'passenger-app' && (
        <PassengerApp 
          trains={trains} 
          onBack={() => setActiveTab('landing')} 
        />
      )}

      {activeTab === 'staff-ai' && (
        <StaffRoom 
          trains={trains} 
          initialChat={INITIAL_CHAT} 
          onBack={() => setActiveTab('landing')} 
          onReroute={handleReroute}
        />
      )}
    </div>
  );
}
