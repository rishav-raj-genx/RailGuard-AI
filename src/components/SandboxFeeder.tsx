import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, Plus, BellRing, Sparkles, RefreshCw, X, Flame, 
  CheckCircle, Database, Trash2, SlidersHorizontal, Settings, HardHat
} from 'lucide-react';
import { Train, PriorityAlert } from '../types';
import { sounds } from '../utils/audio';

interface SandboxFeederProps {
  trains: Train[];
  alerts: PriorityAlert[];
  onRefresh: () => void;
}

export default function SandboxFeeder({ trains, alerts, onRefresh }: SandboxFeederProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'modify' | 'add' | 'alert' | 'quick-chaos'>('modify');
  
  // Tab 1: Modify state
  const [selectedTrainId, setSelectedTrainId] = useState<string>(trains[0]?.id || 'RG-204');
  const selectedTrain = trains.find(t => t.id === selectedTrainId) || trains[0];
  
  const [speed, setSpeed] = useState<number>(selectedTrain?.currentSpeed || 150);
  const [crowd, setCrowd] = useState<number>(selectedTrain?.crowdPercent || 50);
  const [delay, setDelay] = useState<number>(selectedTrain?.delayMinutes || 0);
  const [status, setStatus] = useState<'Optimal' | 'Advisory' | 'Critical'>(selectedTrain?.status || 'Optimal');
  const [risk, setRisk] = useState<number>(selectedTrain?.riskScore || 10);
  const [faults, setFaults] = useState<number>(selectedTrain?.activeFaults || 0);
  const [sector, setSector] = useState<string>(selectedTrain?.sector || 'Sector X');

  // Tab 2: Code integration fields (Commission train)
  const [newId, setNewId] = useState('RG-777');
  const [newName, setNewName] = useState('Quantum Velocity [QV-777]');
  const [newOrigin, setNewOrigin] = useState('London');
  const [newDestination, setNewDestination] = useState('Paris');
  const [newSpeed, setNewSpeed] = useState(190);
  const [newCrowd, setNewCrowd] = useState(65);
  const [newStatus, setNewStatus] = useState<'Optimal' | 'Advisory' | 'Critical'>('Optimal');
  const [newSector, setNewSector] = useState('Sector 12B');

  // Tab 3: Create custom Alert field
  const [alertTitle, setAlertTitle] = useState('Overhead Wire Degradation');
  const [alertDesc, setAlertDesc] = useState('Excessive localized friction points spotted under Sector 3A catenary cables.');
  const [alertCriticality, setAlertCriticality] = useState<'High' | 'Mid' | 'Low'>('High');
  const [alertTrainId, setAlertTrainId] = useState('');

  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const triggerNotification = (msg: string, isError: boolean = false) => {
    setNotification({ message: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync state sliders when dropdown switches
  const handleTrainSelect = (id: string) => {
    const train = trains.find(t => t.id === id);
    if (train) {
      setSelectedTrainId(id);
      setSpeed(train.currentSpeed);
      setCrowd(train.crowdPercent);
      setDelay(train.delayMinutes);
      setStatus(train.status);
      setRisk(train.riskScore);
      setFaults(train.activeFaults);
      setSector(train.sector);
      sounds.playTap();
    }
  };

  // Submit PUT to modify train parameters
  const updateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainId) return;
    sounds.playPing();
    try {
      const res = await fetch(`/api/trains/${selectedTrainId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          currentSpeed: speed,
          crowdPercent: crowd,
          delayMinutes: delay,
          sector,
          riskScore: risk,
          activeFaults: faults
        })
      });
      if (res.ok) {
        triggerNotification(`Active telemetry stream modified for ${selectedTrainId}.`);
        onRefresh();
        sounds.playSuccess();
      } else {
        const errData = await res.json();
        triggerNotification(errData.error || "Failed feedback synchronization.", true);
        sounds.playError();
      }
    } catch (err) {
      triggerNotification("Express pipeline offline. Falling back to frontend simulated layout updates.", true);
      sounds.playError();
    }
  };

  // Add simulated railway commission
  const commissionTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) {
      triggerNotification("Crucial properties omitted.", true);
      return;
    }
    sounds.playPing();
    try {
      const res = await fetch('/api/trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          name: newName,
          origin: newOrigin,
          destination: newDestination,
          status: newStatus,
          currentSpeed: newSpeed,
          crowdPercent: newCrowd,
          sector: newSector
        })
      });
      if (res.ok) {
        triggerNotification(`Fleet telemetry configured! ${newId} initialized on track.`);
        onRefresh();
        // Reset inputs
        setNewId(`RG-${Math.floor(100 + Math.random() * 899)}`);
        sounds.playSuccess();
      } else {
        const errData = await res.json();
        triggerNotification(errData.error || "Failed database insertion.", true);
        sounds.playError();
      }
    } catch (err) {
      triggerNotification("Backend error. Simulation offline.", true);
    }
  };

  // Dismiss / delete active train
  const removeTrain = async () => {
    if (!selectedTrainId) return;
    if (confirm(`Remove custom live stream telemetry for ${selectedTrainId}?`)) {
      sounds.playHalt();
      try {
        const res = await fetch(`/api/trains/${selectedTrainId}`, { method: 'DELETE' });
        if (res.ok) {
          triggerNotification(`Archived train ledger for ${selectedTrainId}.`);
          onRefresh();
          // Pick next available train
          const remaining = trains.filter(t => t.id !== selectedTrainId);
          if (remaining.length > 0) {
            handleTrainSelect(remaining[0].id);
          }
        }
      } catch (err) {
        triggerNotification("Could not contact server.", true);
      }
    }
  };

  // Inject Custom Alert Alarm
  const injectAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playAlert();
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: alertTitle,
          description: alertDesc,
          criticality: alertCriticality,
          associatedTrainId: alertTrainId || undefined
        })
      });
      if (res.ok) {
        triggerNotification("Urgent safety alarm injected successfully.");
        onRefresh();
        sounds.playSuccess();
      }
    } catch (err) {
      triggerNotification("Failed connection.", true);
    }
  };

  // Chaos generator - selects one random train and disrupts it
  const triggerChaos = async () => {
    if (trains.length === 0) return;
    sounds.playAlert();
    const randTrain = trains[Math.floor(Math.random() * trains.length)];
    
    // Anomaly datasets
    const anomalies = [
      {
        title: "Track Switch Block Disruption",
        desc: `Interlocking sensor failures reported around ${randTrain.sector} on track switch K-1. Deflection risk high.`,
        criticality: "High" as const
      },
      {
        title: "Pneumatic Brakes Friction Rise",
        desc: `Carriage thermal coupler exceeds 180°C on ${randTrain.id} axle structures inside ${randTrain.sector}.`,
        criticality: "High" as const
      },
      {
        title: "Crowd Ingress Breach Alert",
        desc: `Extreme high-volume boarding detected at ${randTrain.currentStation}. Redundant platform security overrides required.`,
        criticality: "Mid" as const
      },
      {
        title: "Voltage Sag Disruption",
        desc: `Localized catenary line power drops to 68% over ${randTrain.sector}. Speed cap recommendation active.`,
        criticality: "Low" as const
      }
    ];
    
    const anomaly = anomalies[Math.floor(Math.random() * anomalies.length)];

    try {
      // Modify train speed, status, and faults
      await fetch(`/api/trains/${randTrain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: anomaly.criticality === "High" ? "Critical" : "Advisory",
          currentSpeed: Math.max(0, Math.floor(randTrain.currentSpeed / 2.5)),
          activeFaults: randTrain.activeFaults + (anomaly.criticality === "High" ? 2 : 1),
          riskScore: anomaly.criticality === "High" ? 88 : 45
        })
      });

      // Inject safety alert
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${anomaly.title} (${randTrain.id})`,
          description: anomaly.desc,
          criticality: anomaly.criticality,
          associatedTrainId: randTrain.id
        })
      });

      triggerNotification(`⚠️ CRITICAL COLLISION/ANOMALY TRIGGERED ON FLEET ${randTrain.id}! Check telemetry maps and safety chat counselor.`, true);
      onRefresh();
      sounds.playError();
    } catch (err) {
      triggerNotification("Offline fallbacks active.", true);
    }
  };

  // Full reset back to seed baseline
  const resetSimulation = async () => {
    sounds.playHalt();
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        triggerNotification("Baseline telemetry completely restored.");
        onRefresh();
        sounds.playSuccess();
      }
    } catch (err) {
      triggerNotification("Failed database connection.", true);
    }
  };

  return (
    <>
      {/* Floating Tactical Orb Launch Badge */}
      <div id="sandbox-badge-anchor" className="fixed bottom-6 right-6 z-50">
        <motion.button
          id="sandbox-trigger-btn"
          onClick={() => {
            setIsOpen(!isOpen);
            sounds.playTap();
          }}
          whileHover={{ scale: 1.06, rotate: 2 }}
          whileTap={{ scale: 0.94 }}
          className="relative group p-4 bg-zinc-950/90 text-white rounded-full border border-teal-500/40 shadow-2xl flex items-center gap-2 cursor-pointer transition-all duration-300 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-tr before:from-teal-400 before:to-emerald-500 before:opacity-0 group-hover:before:opacity-10"
        >
          {/* Diagnostic beacon indicator dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-teal-400 border border-black rounded-full animate-pulse z-10 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-black rounded-full" />
          </span>

          <Database className="w-5 h-5 text-teal-400 animate-spin-slow group-hover:text-cyan-300" />
          <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-zinc-300 group-hover:text-teal-400">
            SIM_SANDBOX
          </span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark glass screen overlay block */}
            <motion.div
              id="sandbox-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-neutral-950 z-50 backdrop-blur-xs cursor-pointer"
            />

            {/* Neon Glitched Slider Control deck Drawer */}
            <motion.div
              id="sandbox-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-neutral-900 border-l border-teal-500/20 shadow-2xl shadow-cyan-950/20 z-50 overflow-y-auto font-sans flex flex-col justify-between"
            >
              {/* Drawer Top Header Area */}
              <div className="border-b border-neutral-800 p-5 bg-neutral-950/80 sticky top-0 z-10 flex justify-between items-center bg-gradient-to-r from-neutral-950 via-teal-950/15 to-neutral-950">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/30">
                    <Sliders className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                      Simulation Control Deck
                    </h2>
                    <p className="text-[10px] text-teal-400 font-mono">
                      GEN-V FEEDING CONTROL PANEL
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    sounds.playTap();
                  }}
                  className="p-1.5 bg-neutral-800 hover:bg-red-950/50 hover:text-red-400 text-neutral-400 rounded-lg border border-neutral-750 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer main tab container scroll panel */}
              <div className="p-5 flex-1 space-y-5">
                {/* Visual indicator alert notification banner inside sandbox */}
                {notification && (
                  <motion.div
                    id="sandbox-alert-banner"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-[10px] font-mono border ${
                      notification.isError 
                        ? 'bg-red-950/50 border-red-900/50 text-red-300' 
                        : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
                    }`}
                  >
                    <div className="flex gap-2 items-start">
                      <span className="font-bold shrink-0">
                        {notification.isError ? "[ERROR]" : "[SYSTEM LOG]"}
                      </span>
                      <p className="leading-normal">{notification.message}</p>
                    </div>
                  </motion.div>
                )}

                {/* Cyber-Tabs selectors */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-850">
                  {(['modify', 'add', 'alert', 'quick-chaos'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        sounds.playTap();
                      }}
                      className={`py-2 text-[8px] font-extrabold uppercase font-mono rounded-lg tracking-wider transition-all cursor-pointer ${
                        activeTab === tab
                          ? 'bg-teal-400 text-black shadow' 
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40'
                      }`}
                    >
                      {tab === 'quick-chaos' ? '💥 CHAOS' : tab}
                    </button>
                  ))}
                </div>

                {/* Tab content implementation */}
                <AnimatePresence mode="wait">
                  {activeTab === 'modify' && (
                    <motion.div
                      key="modify-tab"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="space-y-4"
                    >
                      <div className="bg-neutral-950/40 border border-neutral-850/60 p-4 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                            Select Train to Feed:
                          </label>
                          <button
                            type="button"
                            onClick={removeTrain}
                            className="bg-red-950/20 hover:bg-red-500 hover:text-white border border-red-950/60 p-1.5 rounded-lg text-red-400 transition-colors cursor-pointer"
                            title="Remove train data feed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <select
                          value={selectedTrainId}
                          onChange={(e) => handleTrainSelect(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-teal-400 focus:outline-none focus:border-teal-500"
                        >
                          {trains.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.id} - {t.name} ({t.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedTrain && (
                        <form onSubmit={updateTelemetry} className="space-y-4">
                          {/* Live Track Region Sector */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono mb-1.5">
                              <span className="text-neutral-400 uppercase">Track Sector Block</span>
                              <span className="text-teal-400 font-bold">{sector}</span>
                            </div>
                            <input
                              type="text"
                              value={sector}
                              onChange={(e) => setSector(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-teal-500/60"
                              placeholder="e.g. Sector 4G, Sector 1A"
                            />
                          </div>

                          {/* Real-time slider metrics: SPEED */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono mb-1.5">
                              <span className="text-neutral-400 uppercase font-bold">Speed Velocity</span>
                              <span className="text-cyan-400 font-extrabold">{speed} km/h</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="350"
                              value={speed}
                              onChange={(e) => setSpeed(Number(e.target.value))}
                              className="w-full accent-teal-400 cursor-ew-resize bg-neutral-950 rounded-lg appearance-none h-1.5"
                            />
                            <div className="flex justify-between text-[8px] font-mono text-neutral-600 mt-1">
                              <span>0 (Static)</span>
                              <span>210 (Voyager)</span>
                              <span>350 (Ultra Bullet)</span>
                            </div>
                          </div>

                          {/* Dynamic delay minutes */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono mb-1.5">
                              <span className="text-neutral-400 uppercase font-bold">Delay Minutes</span>
                              <span className={`font-extrabold ${delay > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                                {delay === 0 ? 'On Time' : `${delay} min delay`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="120"
                              value={delay}
                              onChange={(e) => setDelay(Number(e.target.value))}
                              className="w-full accent-amber-400 cursor-ew-resize bg-neutral-950 rounded-lg appearance-none h-1.5"
                            />
                          </div>

                          {/* Passenger capacity crowd percentage */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono mb-1.5">
                              <span className="text-neutral-400 uppercase font-bold text-teal-400">Onboard Crowd Load</span>
                              <span className="text-emerald-400 font-extrabold">{crowd}% Load</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={crowd}
                              onChange={(e) => setCrowd(Number(e.target.value))}
                              className="w-full accent-emerald-400 cursor-ew-resize bg-neutral-950 rounded-lg appearance-none h-1.5"
                            />
                          </div>

                          {/* Active Fault counts inside simulation */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono mb-1.5">
                              <span className="text-neutral-400 uppercase font-bold">Unresolved Mechanical Faults</span>
                              <span className={`font-extrabold ${faults > 0 ? 'text-red-400' : 'text-neutral-500'}`}>
                                {faults} active fault{faults !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={faults}
                              onChange={(e) => setFaults(Number(e.target.value))}
                              className="w-full accent-red-500 cursor-ew-resize bg-neutral-950 rounded-lg appearance-none h-1.5"
                            />
                          </div>

                          {/* Risk safety index score out of 100 */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono mb-1.5">
                              <span className="text-neutral-400 uppercase font-bold">Autonomous Risk Factor</span>
                              <span className={`font-extrabold ${risk > 60 ? 'text-red-400 animate-pulse' : risk > 25 ? 'text-amber-400' : 'text-teal-400'}`}>
                                {risk}% Risk Index
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={risk}
                              onChange={(e) => setRisk(Number(e.target.value))}
                              className="w-full accent-red-400 cursor-ew-resize bg-neutral-950 rounded-lg appearance-none h-1.5"
                            />
                          </div>

                          {/* Main Safety Status enum toggler */}
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400 uppercase mb-1.5 block font-bold">
                              Live Status Indicator
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {(['Optimal', 'Advisory', 'Critical'] as const).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    setStatus(s);
                                    sounds.playTap();
                                  }}
                                  className={`py-2 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                    status === s
                                      ? s === 'Optimal'
                                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                                        : s === 'Advisory'
                                          ? 'bg-amber-950/80 border-amber-500 text-amber-400'
                                          : 'bg-red-950/80 border-red-600 text-red-400 ring-2 ring-red-900/30'
                                      : 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-950 hover:text-neutral-300 text-neutral-500'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Push updates button */}
                          <button
                            type="submit"
                            className="w-full mt-2 py-3 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                          >
                            <SlidersHorizontal className="w-4 h-4 shrink-0" />
                            Feed Edited Telemetry
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'add' && (
                    <motion.div
                      key="add-tab"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <form onSubmit={commissionTrain} className="space-y-4">
                        <p className="text-[10px] leading-relaxed text-neutral-400 font-mono bg-neutral-950/50 p-3 rounded-xl border border-neutral-850">
                          Commission an entirely new dynamic train on the active tracks under-the-hood. It automatically generates cabin matrices and route details.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Simulated Train ID
                            </label>
                            <input
                              type="text"
                              value={newId}
                              onChange={(e) => setNewId(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-teal-400 focus:outline-none focus:border-teal-500"
                              placeholder="e.g. RG-330"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Sector Block
                            </label>
                            <input
                              type="text"
                              value={newSector}
                              onChange={(e) => setNewSector(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
                              placeholder="e.g. Sector 12B"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                            Train Full Name
                          </label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
                            placeholder="e.g. Hyperloop Pioneer [HL-09]"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Terminal Origin
                            </label>
                            <input
                              type="text"
                              value={newOrigin}
                              onChange={(e) => setNewOrigin(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Gare Destination
                            </label>
                            <input
                              type="text"
                              value={newDestination}
                              onChange={(e) => setNewDestination(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Velocity Speed (km/h)
                            </label>
                            <input
                              type="number"
                              value={newSpeed}
                              onChange={(e) => setNewSpeed(Number(e.target.value))}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Starting Load Cap %
                            </label>
                            <input
                              type="number"
                              value={newCrowd}
                              onChange={(e) => setNewCrowd(Number(e.target.value))}
                              max="100"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                            Status Profile
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['Optimal', 'Advisory', 'Critical'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setNewStatus(st)}
                                className={`py-2 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                  newStatus === st 
                                    ? 'bg-teal-400 text-black border-teal-400' 
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Push commission action */}
                        <button
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5 mt-4"
                        >
                          <Plus className="w-4 h-4" />
                          Commission Dynamic Fleet Express
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {activeTab === 'alert' && (
                    <motion.div
                      key="alert-tab"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <form onSubmit={injectAlert} className="space-y-4">
                        <p className="text-[10px] text-neutral-400 font-mono bg-neutral-950/50 p-3 rounded-xl border border-neutral-850 leading-relaxed">
                          Inject custom priority danger or advisory codes. The AI Diagnostic consultant immediately digests these records during chat queries.
                        </p>

                        <div>
                          <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                            Danger Alert Title
                          </label>
                          <input
                            type="text"
                            value={alertTitle}
                            onChange={(e) => setAlertTitle(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-teal-400/40"
                            placeholder="e.g. Wildlife intrusion on track"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                            Safety Description
                          </label>
                          <textarea
                            value={alertDesc}
                            onChange={(e) => setAlertDesc(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 h-20 text-xs font-mono text-zinc-300 focus:outline-none focus:border-teal-400/40"
                            placeholder="Provide deep telemetry parameters or diagnostic events details..."
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Criticality Degree
                            </label>
                            <select
                              value={alertCriticality}
                              onChange={(e) => setAlertCriticality(e.target.value as any)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-teal-400 focus:outline-none"
                            >
                              <option value="High">⚠️ High (Red Alarm)</option>
                              <option value="Mid">🟡 Mid (Yellow Warn)</option>
                              <option value="Low">🔵 Low (Blue Detail)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Assigned Fleet ID (Optional)
                            </label>
                            <select
                              value={alertTrainId}
                              onChange={(e) => setAlertTrainId(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-teal-400 focus:outline-none"
                            >
                              <option value="">Non-specific / Global</option>
                              {trains.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.id} - {t.name.split('[')[0]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-teal-400 to-amber-500 hover:from-teal-300 hover:to-amber-400 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5 mt-4"
                        >
                          <BellRing className="w-4 h-4 shrink-0 animate-bounce" />
                          Deploy Safety Threat Alarm
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {activeTab === 'quick-chaos' && (
                    <motion.div
                      key="chaos-tab"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-red-950/15 border border-red-900/45 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="w-4 h-4 text-red-400 animate-pulse" />
                          <h4 className="text-xs font-bold text-red-400 font-mono uppercase tracking-wider">
                            Localized Anomaly Chaos Event
                          </h4>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                          Triggers a sudden random railway block structural disruption on any of the live fleets (voltage sag, catenary wire arc, friction threshold breaches, over-boarding jams). 
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={triggerChaos}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-red-950/40 cursor-pointer flex items-center justify-center gap-2 active:scale-97 border border-red-500/20"
                      >
                        <Sparkles className="w-4 h-4 animate-spin-slow shrink-0" />
                        TRIGGER RANDOM NETWORK anomaly
                      </button>

                      <p className="text-[9px] text-neutral-500 text-center font-mono mt-2">
                        Pushes active logs inside the Control center terminal automatically.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Drawer Bottom Actions Deck */}
              <div className="border-t border-neutral-800 p-5 bg-neutral-950/90 flex gap-3.5 static bottom-0">
                <button
                  type="button"
                  onClick={resetSimulation}
                  className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-805 text-zinc-300 font-extrabold text-[10px] tracking-wider rounded-xl border border-neutral-800 transition-colors uppercase cursor-pointer flex items-center justify-center gap-1.5"
                  title="Wipe database changes and restore default telemetry matrix"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                  Reset telemetries
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onRefresh();
                    sounds.playSuccess();
                    triggerNotification("Recalculated active feeds.");
                  }}
                  className="px-4 py-2.5 bg-teal-400/10 hover:bg-teal-400/20 text-teal-400 font-mono font-bold text-[10px] rounded-xl border border-teal-500/25 transition-colors cursor-pointer"
                >
                  REFRESH FEEDS
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
