import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Radar, Train, Users, Terminal, Activity, Bell, Compass, ArrowRight, Server, Clock } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: 'control-center' | 'passenger-app' | 'staff-ai') => void;
  trainCount: number;
  alertCount: number;
}

export default function LandingPage({ onNavigate, trainCount, alertCount }: LandingPageProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const parsed = new Date().toLocaleTimeString('en-US', { hour12: false });
      setTime(parsed);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="landing-root" className="min-h-screen bg-neutral-950 text-white selection:bg-teal-500 selection:text-black">
      {/* Visual background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

      {/* Header */}
      <header id="landing-header" className="relative z-10 border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40">
            <Radar className="w-6 h-6 text-black animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              RailGuard AI
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Autonomous Rail Infrastructure</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 font-mono text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM ACTIVE</span>
          </div>
          <div className="bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700/50 flex items-center space-x-2 font-mono text-xs text-teal-400">
            <Clock className="w-3.5 h-3.5" />
            <span>UTC {time || "00:00:00"}</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
            <span className="font-mono text-xs text-teal-400 tracking-wider uppercase">Version 3.4 Connected</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
            Predictive Safety &amp; Autonomous Logistics <br/>
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Powered by RailGuard Agents
            </span>
          </h1>

          <p className="text-neutral-400 text-base md:text-lg mb-10 max-w-2xl mx-auto">
            A next-generation central infrastructure orchestration layer tracking thermal axle breaches, 
            predicting scheduling margins, monitoring crowd densities, and safeguarding system-wide transit tracks.
          </p>
        </motion.div>

        {/* Primary Screen Navigation Hub */}
        <div id="navigation-panels" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-6">
          
          {/* Card 1: Control Center */}
          <motion.div 
            whileHover={{ y: -5, borderColor: '#0d9488' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="group relative bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
            onClick={() => onNavigate('control-center')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-800/40 flex items-center justify-center text-teal-400 mb-5">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">Operator Control Center</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                Inspect active locomotives, review real-time AI danger margins, manage block signal queues, and override routing parameters.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80 mt-auto">
              <span className="text-[11px] font-mono text-neutral-500 uppercase">{trainCount} trains tracked currently</span>
              <span className="text-xs text-teal-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Card 2: Passenger Portal */}
          <motion.div 
            whileHover={{ y: -5, borderColor: '#10b981' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="group relative bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
            onClick={() => onNavigate('passenger-app')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">Passenger Intelligence</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                Live carriage crowd graphs, scheduling timeline updates for RG-204, simulated ticket barcode generation, and instant SOS signals.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80 mt-auto">
              <span className="text-[11px] font-mono text-neutral-500 uppercase">Live Journey Trackers</span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Launch Portal <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Card 3: Staff room */}
          <motion.div 
            whileHover={{ y: -5, borderColor: '#06b6d4' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="group relative bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
            onClick={() => onNavigate('staff-ai')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mb-5">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">Agentic Staff Room</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                Consult with RailGuard Core Intelligence using Gemini to draft mitigation routes, solve sector delays, and simulate emergency procedures.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80 mt-auto">
              <span className="text-[11px] font-mono text-neutral-500 uppercase">{alertCount} Active Alerts to solve</span>
              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Consult Gemini AI <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Key Performance Benchmarks */}
        <div id="stats-section" className="mt-20 border-t border-neutral-800/80 pt-12">
          <h4 className="text-[11px] tracking-widest text-neutral-500 uppercase font-mono mb-8">
            Platform Operations Benchmarks &amp; Reliability
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <span className="block text-2xl md:text-3xl font-extrabold text-teal-400">99.98%</span>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mt-1">Platform Uptime</span>
            </div>
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <span className="block text-2xl md:text-3xl font-extrabold text-teal-400">4.2 min</span>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mt-1">Mean-Time-To-Resolve</span>
            </div>
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <span className="block text-2xl md:text-3xl font-extrabold text-teal-400">94.1%</span>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mt-1">AI Risk Mitigation</span>
            </div>
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <span className="block text-2xl md:text-3xl font-extrabold text-teal-400">&lt; 15 ms</span>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mt-1">Telemetry Latency</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 text-center text-neutral-600 text-xs font-mono relative z-10">
        <p>© 2026 RailGuard Artificial Intelligence Inc. Secured via Autonomous Signal Protocol G-H6.</p>
      </footer>
    </div>
  );
}
