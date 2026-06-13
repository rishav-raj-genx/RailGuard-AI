import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Train, AlertTriangle, Cpu, RefreshCw, Zap, Users, Signal, ArrowLeft, 
  Trash2, Sliders, CheckCircle2, Play, CircleAlert, MapPin, Eye, Check,
  Volume2, VolumeX, Terminal as TerminalIcon,
  Lock, Unlock, ShieldAlert, Fingerprint, ShieldCheck, Key
} from 'lucide-react';
import { Train as TrainType, PriorityAlert } from '../types';
import { sounds } from '../utils/audio';

interface ControlCenterProps {
  trains: TrainType[];
  alerts: PriorityAlert[];
  onBack: () => void;
  onReroute: (trainId: string) => void;
  onEmergencyHalt: (trainId: string) => void;
  onEmergencyHaltAll: () => void;
  onDismissAlert: (alertId: string) => void;
  onUpdateTrain: (trainId: string, updatedFields: Partial<TrainType>) => void;
}

export default function ControlCenter({
  trains,
  alerts,
  onBack,
  onReroute,
  onEmergencyHalt,
  onEmergencyHaltAll,
  onDismissAlert,
  onUpdateTrain
}: ControlCenterProps) {
  // OCC Operator Authentication Barrier State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('occ_authorized') === 'true';
  });
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [tempSessionCode, setTempSessionCode] = useState<string>('');
  const [isScanningBiometric, setIsScanningBiometric] = useState<boolean>(false);
  const [biometricProgress, setBiometricProgress] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  // Generator overrides/live updates state
  const [activePanelTab, setActivePanelTab] = useState<'commands' | 'override'>('commands');
  const [overrideSpeed, setOverrideSpeed] = useState<number>(0);
  const [overrideDelay, setOverrideDelay] = useState<number>(0);
  const [overrideCrowd, setOverrideCrowd] = useState<number>(0);
  const [overrideStation, setOverrideStation] = useState<string>('');
  const [overrideNextStop, setOverrideNextStop] = useState<string>('');
  const [overrideEta, setOverrideEta] = useState<string>('');
  const [overrideStatus, setOverrideStatus] = useState<'Optimal' | 'Advisory' | 'Critical'>('Optimal');
  const [overrideRiskScore, setOverrideRiskScore] = useState<number>(0);
  const [isSavingOverride, setIsSavingOverride] = useState<boolean>(false);

  // Generate dynamic session OTP code on mount
  useEffect(() => {
    if (!tempSessionCode) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setTempSessionCode(code);
    }
  }, [tempSessionCode]);

  const [selectedTrainId, setSelectedTrainId] = useState<string>('RG-204');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cliInput, setCliInput] = useState<string>('');
  const [actionLog, setActionLog] = useState<string[]>([
    '[08:00] RailGuard AI System Core initialized.',
    '[09:42] Verified sector block automated interlocks.'
  ]);
  const cliBottomRef = useRef<HTMLDivElement>(null);

  const selectedTrain = trains.find(t => t.id === selectedTrainId) || trains[0];

  // Sync state when selectedTrainId or selectedTrain details change
  useEffect(() => {
    if (selectedTrain) {
      setOverrideSpeed(selectedTrain.currentSpeed);
      setOverrideDelay(selectedTrain.delayMinutes);
      setOverrideCrowd(selectedTrain.crowdPercent);
      setOverrideStation(selectedTrain.currentStation || '');
      setOverrideNextStop(selectedTrain.nextStop || '');
      setOverrideEta(selectedTrain.eta || '');
      setOverrideStatus((selectedTrain.status || 'Optimal') as 'Optimal' | 'Advisory' | 'Critical');
      setOverrideRiskScore(selectedTrain.riskScore || 0);
    }
  }, [selectedTrainId]);

  const handleAction = async (type: 'reroute' | 'halt' | 'halt-all') => {
    setIsProcessing(true);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
    
    if (type === 'halt-all') {
      sounds.playHalt();
    } else if (type === 'halt') {
      sounds.playError();
    } else {
      sounds.playPing();
    }

    setTimeout(() => {
      if (type === 'reroute') {
        onReroute(selectedTrain.id);
        setActionLog(prev => [`[${timestamp}] Transmitted AI rerouting sequence for ${selectedTrain.id}. Velocity optimized.`, ...prev]);
        sounds.playSuccess();
      } else if (type === 'halt') {
        onEmergencyHalt(selectedTrain.id);
        setActionLog(prev => [`[${timestamp}] EMERGENCY STOP COMMITTED FOR ${selectedTrain.id}. Kinetic feedback brakes locked inside ${selectedTrain.sector}.`, ...prev]);
        sounds.playError();
      } else if (type === 'halt-all') {
        onEmergencyHaltAll();
        setActionLog(prev => [`[${timestamp}] SYSTEM-WIDE EMERGENCY BLOCK LOCK SEQUENCE INSTANTIATED. ALL TRANSITS CEASED OPERATION.`, ...prev]);
      }
      setIsProcessing(false);
    }, 800);
  };

  const logTrackPing = () => {
    sounds.playPing();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
    setActionLog(prev => [`[${timestamp}] Frictional track alignment ping completed for ${selectedTrain.id} over ${selectedTrain.sector}. Margin stable.`, ...prev]);
  };

  const handleApplyOverride = async () => {
    setIsSavingOverride(true);
    sounds.playPing();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);

    const patch: Partial<TrainType> = {
      currentSpeed: overrideSpeed,
      delayMinutes: overrideDelay,
      crowdPercent: overrideCrowd,
      currentStation: overrideStation,
      nextStop: overrideNextStop,
      eta: overrideEta,
      status: overrideStatus,
      riskScore: overrideRiskScore
    };

    setTimeout(() => {
      onUpdateTrain(selectedTrain.id, patch);
      setActionLog(prev => [
        `[${timestamp}] Live overrides patched on ${selectedTrain.id}: Speed=${overrideSpeed} km/h, Delay=+${overrideDelay}m, Crowd=${overrideCrowd}%, Station="${overrideStation}", NextStop="${overrideNextStop}", ETA="${overrideEta}", Status="${overrideStatus}", Risk=${overrideRiskScore}%`,
        ...prev
      ]);
      sounds.playSuccess();
      setIsSavingOverride(false);
    }, 600);
  };

  // Handle typed CLI instructions
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmdStr = cliInput.trim().toLowerCase();
    if (!cmdStr) return;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
    setActionLog(prev => [`>$ ${cliInput}`, ...prev]);
    setCliInput('');

    // command parser
    const args = cmdStr.split(' ');
    const primaryCmd = args[0];
    const target = args[1]?.toUpperCase();

    if (primaryCmd === 'help') {
      sounds.playTap();
      setActionLog(prev => [
        `[HELP] Commands:`,
        `  • reroute [id] - Triggers bypass plan`,
        `  • halt [id]    - Commits emergency brakes`,
        `  • ping [id]    - Tests ground alignments`,
        `  • halt-all     - Full system lockdown`,
        `  • clear        - Flushes action history`,
        ...prev
      ]);
    } else if (primaryCmd === 'clear') {
      sounds.playTap();
      setActionLog([]);
    } else if (primaryCmd === 'halt-all') {
      sounds.playHalt();
      onEmergencyHaltAll();
      setActionLog(prev => [`[${timestamp}] GLOBAL HALT sequence deployed. Keys locked.`, ...prev]);
    } else if (primaryCmd === 'reroute' || primaryCmd === 'halt' || primaryCmd === 'ping') {
      const train = trains.find(t => t.id === target || t.id.replace('RG-', '') === target);
      if (!train) {
        sounds.playError();
        setActionLog(prev => [`[ERROR] Train ID '${args[1] || ''}' not found in active ledger records. Use (e.g. RG-204)`, ...prev]);
        return;
      }

      if (primaryCmd === 'reroute') {
        sounds.playPing();
        onReroute(train.id);
        setActionLog(prev => [`[${timestamp}] CLI Order: Advancing ${train.id} with rerouting blocks.`, ...prev]);
        setTimeout(() => sounds.playSuccess(), 400);
      } else if (primaryCmd === 'halt') {
        sounds.playError();
        onEmergencyHalt(train.id);
        setActionLog(prev => [`[${timestamp}] CLI Order: HARD STOP deployment verified for ${train.id}.`, ...prev]);
      } else if (primaryCmd === 'ping') {
        sounds.playPing();
        setActionLog(prev => [`[${timestamp}] Telemetry ping: Track cohesion at ${train.sector} for ${train.id} is 98.4%.`, ...prev]);
      }
    } else {
      sounds.playError();
      setActionLog(prev => [`command not found: '${primaryCmd}'. Type 'help' for options.`, ...prev]);
    }
  };

  useEffect(() => {
    cliBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [actionLog]);

  // Passcode authentication helpers
  const handlePasscodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = passcode.trim().toLowerCase();
    // Validate master password or dynamic session OTP
    if (clean === 'admin' || clean === 'railguard2026' || clean === '2026' || clean === tempSessionCode) {
      sounds.playSuccess();
      localStorage.setItem('occ_authorized', 'true');
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      sounds.playError();
      setAuthError('INVALID SECURE COCKPIT PASSCODE. ACCESS DENIED.');
      setPasscode('');
      setTimeout(() => setAuthError(null), 2500);
    }
  };

  const handleKeypadPress = (val: string) => {
    sounds.playTap();
    if (val === 'clear') {
      setPasscode('');
    } else if (val === 'enter') {
      handlePasscodeSubmit();
    } else {
      if (passcode.length < 12) {
        setPasscode(prev => prev + val);
      }
    }
  };

  const startBiometricScan = () => {
    if (isScanningBiometric) return;
    setIsScanningBiometric(true);
    setScanStatus('scanning');
    setBiometricProgress(0);
    sounds.playPing();

    const interval = setInterval(() => {
      setBiometricProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanStatus('success');
          sounds.playSuccess();
          setTimeout(() => {
            localStorage.setItem('occ_authorized', 'true');
            setIsAuthenticated(true);
            setIsScanningBiometric(false);
          }, 850);
          return 100;
        }
        if (prev % 20 === 0) {
          sounds.playTap();
        }
        return prev + 5;
      });
    }, 45);
  };

  // Compute stats
  const criticalCount = trains.filter(t => t.status === 'Critical').length;
  const dispatchCount = trains.length;
  const averageDelay = Math.round(trains.reduce((sum, t) => sum + t.delayMinutes, 0) / trains.length);
  const aggregateRisk = Math.round(trains.reduce((sum, t) => sum + t.riskScore, 0) / trains.length);

  if (!isAuthenticated) {
    return (
      <div id="occ-gated-gate" className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between selection:bg-teal-500 selection:text-black relative">
        {/* Background circuit grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />
        
        {/* Top Header */}
        <nav className="relative z-10 border-b border-neutral-900 bg-neutral-900/40 backdrop-blur-md px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              type="button"
              onClick={onBack}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer border border-neutral-850"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase block">SECURE ENCLAVE PROMPT</span>
              <h1 className="text-sm font-bold tracking-tight text-white font-mono uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-500" /> OCC Security Gate G-H6
              </h1>
            </div>
          </div>
          <span className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400">
            TLS SAFE LINKED
          </span>
        </nav>

        {/* Main interactive security terminal */}
        <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Security context, system metrics & active OTP generation */}
            <div className="md:col-span-5 bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-teal-400 animate-pulse" />
                  <span className="text-[11px] font-mono tracking-widest text-zinc-400 font-semibold uppercase">IDENTITY AUDIT</span>
                </div>

                <h2 className="text-lg font-bold text-white tracking-tight">Operator Authentication Required</h2>
                <p className="text-xs text-neutral-400 leading-relaxed mt-2.5">
                  The Operator Control Center allows manual route modifiers, microclimate forecasting diagnostics, and global priority shutdowns. Full biometric or passcode authorization is strictly logged.
                </p>

                <div className="mt-6 border-t border-b border-neutral-800/80 py-4 space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">CLEARANCE ZONE:</span>
                    <span className="text-zinc-300 font-semibold">SOVEREIGN TRANSPORT (S-1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">AUTHORIZATION CODE:</span>
                    <span className="text-emerald-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                      OTP-{tempSessionCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">HOST INTEGRITY:</span>
                    <span className="text-sky-400 font-semibold uppercase">SECURE CONTAINER</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setPasscode(tempSessionCode);
                  }}
                  className="w-full py-2 bg-teal-950/40 hover:bg-teal-950/80 border border-teal-900/40 hover:border-teal-500/30 text-teal-400 text-[10px] font-mono rounded-lg transition-all uppercase tracking-wider font-semibold cursor-pointer"
                >
                  Autofill Credentials
                </button>
                <p className="text-[10px] text-zinc-500 font-mono text-center">
                  Or enter master credential <span className="text-neutral-400 font-bold">admin</span>
                </p>
              </div>
            </div>

            {/* Right Column: Keypad interactive passcode & fingerprint layout */}
            <div className="md:col-span-7 bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800/80 flex flex-col justify-between backdrop-blur-sm">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold uppercase">SECKEY INPUT METHOD</span>
                  <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" /> KEYPAD OR TYPED
                  </span>
                </div>

                {/* Secure password display screen */}
                <div className="relative mb-5">
                  <input
                    type="password"
                    placeholder="ENTER PASSCODE..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePasscodeSubmit();
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-center font-bold font-mono tracking-[0.6em] text-teal-400 placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-teal-500 transition-all"
                  />
                  
                  {/* Validation feedback block */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-950 text-red-200 flex items-center justify-center text-[10px] font-mono px-3.5 py-2.5 rounded-xl border border-red-500/40 text-center font-bold shadow-lg uppercase"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-400 mr-2 animate-bounce" />
                        {authError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  {/* Digital tactile keypad */}
                  <div className="col-span-7 grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'].map((key) => {
                      let keyLabel = key;
                      let btnStyle = "bg-neutral-950 border border-neutral-850 hover:border-neutral-700 text-zinc-400 hover:text-white";
                      if (key === 'clear') {
                        keyLabel = 'C';
                        btnStyle = "bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/80 hover:text-white";
                      } else if (key === 'enter') {
                        keyLabel = '✔';
                        btnStyle = "bg-teal-950/40 border border-teal-900/40 text-teal-400 hover:bg-teal-500/20 hover:text-white";
                      }

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeypadPress(key)}
                          className={`h-11 font-mono font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer ${btnStyle}`}
                        >
                          {keyLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* Fingerprint biometric laser verification simulation module */}
                  <div className="col-span-5 flex flex-col items-center justify-center bg-neutral-950/80 border border-neutral-850 rounded-xl p-4 text-center">
                    <button
                      type="button"
                      onClick={startBiometricScan}
                      disabled={isScanningBiometric}
                      className={`relative w-20 h-20 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        scanStatus === 'scanning'
                          ? 'border-cyan-500/80 bg-cyan-950/20 shadow-lg shadow-cyan-950'
                          : scanStatus === 'success'
                          ? 'border-emerald-500/80 bg-emerald-950/20'
                          : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700'
                      }`}
                    >
                      {/* Interactive scanning feedback lines */}
                      {scanStatus === 'scanning' && (
                        <motion.div 
                          className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-md shadow-cyan-400/80 z-10"
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      
                      {scanStatus === 'success' ? (
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <Fingerprint className={`w-8 h-8 transition-colors ${
                          scanStatus === 'scanning' ? 'text-cyan-400 animate-pulse' : 'text-zinc-500 hover:text-zinc-300'
                        }`} />
                      )}
                    </button>

                    <div className="mt-3.5 border-t border-neutral-900 pt-2 w-full">
                      <span className="text-[8px] font-mono tracking-wider block text-zinc-500 uppercase">BIOMETRIC FIELD</span>
                      <button
                        type="button"
                        onClick={startBiometricScan}
                        disabled={isScanningBiometric}
                        className="text-[9.5px] font-mono text-zinc-300 font-semibold underline hover:text-white mt-1 cursor-pointer block mx-auto"
                      >
                        {scanStatus === 'scanning' ? `SCANNING ${biometricProgress}%` : scanStatus === 'success' ? 'AUTHORIZED' : 'SCAN BIOMETRIC'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security policy footnote */}
              <div className="mt-6 border-t border-neutral-850 pt-4 text-center">
                <span className="text-[8px] font-mono text-zinc-650 block uppercase">
                  IP LOC LOGGED • SECURE ENCRYPTED ENVIRONMENT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-neutral-900 py-6 text-center text-zinc-600 text-[10px] font-mono relative z-10">
          <p>© RailGuard Cybersecurity Protocol G-H6. Authorized Personnels Only.</p>
        </footer>
      </div>
    );
  }

  return (
    <div id="control-center-root" className="min-h-screen bg-neutral-950 text-white pb-16 selection:bg-teal-500 selection:text-black">
      {/* Top Banner and Navigation bar */}
      <div id="dashboard-header" className="border-b border-neutral-900 bg-neutral-900/40 backdrop-blur-md px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={onBack}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-900">SYSTEM COCKPIT</span>
              <span className="text-neutral-500 text-xs font-mono">• Live Telemetry Link</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Operator Control Center</h1>
          </div>
        </div>

        {/* Global Urgent Halt Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            title={isMuted ? "Unmute Audio Diagnostics" : "Mute Audio Diagnostics"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-teal-400 animate-pulse" />}
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playHalt();
              localStorage.removeItem('occ_authorized');
              setIsAuthenticated(false);
            }}
            className="p-2 bg-neutral-850 hover:bg-red-950/40 rounded-lg border border-neutral-800 hover:border-red-900/50 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
            title="Lock Operational Control Interface"
          >
            <Lock className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAction('halt-all')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/20 active:scale-95 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            Global Emergency Stop All Runs
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - System stats, AI Circular indicators and warnings */}
        <div id="dashboard-left" className="lg:col-span-4 space-y-6">
          
          {/* Section A: Live Risk metrics Gauges */}
          <section id="risk-score-gauge-card" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest flex items-center justify-between">
              <span>Selected Unit: {selectedTrain.id}</span>
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-teal-400" /> AI Score Card</span>
            </h2>

            {/* Visual Gauge of selected train risk */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Gauge Background circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-neutral-800 fill-none"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="68"
                    className={`stroke-none fill-none ${
                      selectedTrain.riskScore > 60 ? 'stroke-red-500' :
                      selectedTrain.riskScore > 30 ? 'stroke-amber-500' :
                      'stroke-teal-400'
                    }`}
                    strokeWidth="12"
                    strokeDasharray={427}
                    initial={{ strokeDashoffset: 427 }}
                    animate={{ strokeDashoffset: 427 - (427 * selectedTrain.riskScore) / 100 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </svg>
                {/* Center text representing the current index score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {selectedTrain.riskScore}%
                  </span>
                  <span className={`text-[10px] uppercase font-mono tracking-widest mt-1 ${
                    selectedTrain.riskScore > 60 ? 'text-red-400 font-bold' :
                    selectedTrain.riskScore > 30 ? 'text-amber-400' :
                    'text-teal-400'
                  }`}>
                    {selectedTrain.riskScore > 60 ? 'CRITICAL RISK' :
                     selectedTrain.riskScore > 30 ? 'ADVISORY WARNING' :
                     'LOW RISK STATE'}
                  </span>
                </div>
              </div>

              {/* Auxiliary telemetry scores */}
              <div className="grid grid-cols-2 gap-4 w-full mt-4 text-center border-t border-neutral-800/80 pt-4">
                <div>
                  <span className="text-neutral-500 text-[10px] font-mono block uppercase">Power Efficiency</span>
                  <div className="flex items-center justify-center gap-1 mt-0.5 text-white font-bold text-sm">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    <span>{selectedTrain.powerEfficiency}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] font-mono block uppercase">Active System Faults</span>
                  <span className={`text-sm mt-0.5 font-bold block ${selectedTrain.activeFaults > 0 ? 'text-red-400' : 'text-neutral-400'}`}>
                    0{selectedTrain.activeFaults} Warnings
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section B: System Statistics Grid */}
          <section id="system-statistics-grid" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
              NETWORK PERFORMANCE
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                <span className="text-neutral-500 text-[10px] font-mono uppercase block">Active Fleets</span>
                <span className="text-xl font-bold block mt-0.5">{dispatchCount} units</span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                <span className="text-neutral-500 text-[10px] font-mono uppercase block">Critical Alerts</span>
                <span className={`text-xl font-bold block mt-0.5 ${criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-neutral-300'}`}>
                  {criticalCount} active
                </span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                <span className="text-neutral-500 text-[10px] font-mono uppercase block">Average Offsets</span>
                <span className={`text-xl font-bold block mt-0.5 ${averageDelay > 10 ? 'text-amber-500' : 'text-emerald-400'}`}>
                  +{averageDelay} mins
                </span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                <span className="text-neutral-500 text-[10px] font-mono uppercase block">Aggregate Risk</span>
                <span className="text-xl font-bold block mt-0.5 text-teal-400">{aggregateRisk}% index</span>
              </div>
            </div>
          </section>

          {/* Section C: Alerts dispatcher pane */}
          <section id="alerts-pane" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                PRIORITY SYSTEM ALARMS ({alerts.length})
              </h2>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {alerts.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-teal-500" />
                    <span>All signal networks and rails operating optimum parameters. No warnings active.</span>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`p-3.5 rounded-xl border flex gap-3 text-left relative ${
                        alert.criticality === 'High' ? 'bg-red-950/25 border-red-900/50' :
                        alert.criticality === 'Mid' ? 'bg-amber-950/25 border-amber-900/50' :
                        'bg-zinc-900/50 border-neutral-800'
                      }`}
                    >
                      <div className="mt-0.5">
                        {alert.criticality === 'High' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : (
                          <CircleAlert className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-xs font-bold text-neutral-200 truncate">{alert.title}</h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">{alert.description}</p>
                        {alert.associatedTrainId && (
                          <span className="inline-block mt-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-neutral-400">
                            Train Connection: {alert.associatedTrainId}
                          </span>
                        )}
                      </div>

                      {/* Dismiss Action Button */}
                      <button
                        type="button"
                        onClick={() => onDismissAlert(alert.id)}
                        className="absolute right-2.5 top-2.5 p-1 bg-neutral-900 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
                        title="Acknowledge & Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

        </div>

        {/* Right Column - Fleet spreadsheet table & actions */}
        <div id="dashboard-right" className="lg:col-span-8 space-y-6">
          
          {/* Main Monitor Table */}
          <section id="fleet-table-card" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4">
              ACTIVE FLEET TELEMETRY MONITOR
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[10px]">
                    <th className="pb-3 pl-3">Train / Run</th>
                    <th className="pb-3">Route Vector</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Dynamic Velocity</th>
                    <th className="pb-3 text-center">Delay</th>
                    <th className="pb-3 text-center">Risk Index</th>
                    <th className="pb-3 text-right pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {trains.map((train) => (
                    <tr 
                      key={train.id}
                      onClick={() => setSelectedTrainId(train.id)}
                      className={`hover:bg-neutral-800/40 transition-colors cursor-pointer ${
                        selectedTrainId === train.id ? 'bg-teal-950/20 border-l-2 border-l-teal-500' : ''
                      }`}
                    >
                      <td className="py-3.5 pl-3">
                        <div className="flex items-center gap-2">
                          <Train className={`w-4 h-4 ${
                            train.status === 'Critical' ? 'text-red-400' :
                            train.status === 'Advisory' ? 'text-amber-400' :
                            'text-teal-400'
                          }`} />
                          <div>
                            <span className="font-bold text-white block">{train.id}</span>
                            <span className="text-[10px] text-neutral-500 font-mono block">{train.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-medium text-neutral-300">
                        {train.route}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          train.status === "Optimal" ? "bg-emerald-950 text-emerald-400 border border-emerald-900" :
                          train.status === "Advisory" ? "bg-amber-950 text-amber-400 border border-amber-900" :
                          "bg-red-950 text-red-500 border border-red-900 animate-pulse"
                        }`}>
                          {train.status}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono">
                        {train.currentSpeed === 0 ? (
                          <span className="text-red-500 font-bold">STATIC (0 km/h)</span>
                        ) : (
                          <span>{train.currentSpeed} km/h</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center font-mono">
                        {train.delayMinutes === 0 ? (
                          <span className="text-emerald-400">On Time</span>
                        ) : (
                          <span className="text-amber-400">+{train.delayMinutes}m</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`font-bold font-mono ${
                          train.riskScore > 60 ? 'text-red-400' :
                          train.riskScore > 30 ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {train.riskScore}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-3">
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono text-[10px] flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-teal-400" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Diagnostics and Action plan Control unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Operator Actions Card */}
            <section id="operator-actions-pane" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-teal-400" /> Operational Controls: {selectedTrain.id}
                  </h2>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed mb-4">
                  Manage active train dispatch logs, override route metrics or deploy automated braking commands.
                </p>

                {/* Aesthetic Interactive Tab Selector */}
                <div className="flex border-b border-neutral-800 mb-5 font-mono text-[10px] tracking-wider">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setActivePanelTab('commands');
                    }}
                    className={`pb-2 px-3 focus:outline-none transition-all border-b-2 cursor-pointer uppercase ${
                      activePanelTab === 'commands'
                        ? 'border-teal-400 text-teal-400 font-extrabold'
                        : 'border-transparent text-neutral-450 hover:text-neutral-205'
                    }`}
                  >
                    COMMAND COGNITION
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setActivePanelTab('override');
                    }}
                    className={`pb-2 px-3 focus:outline-none transition-all border-b-2 cursor-pointer uppercase flex items-center gap-1.5 ${
                      activePanelTab === 'override'
                        ? 'border-yellow-500 text-yellow-500 font-extrabold'
                        : 'border-transparent text-neutral-450 hover:text-neutral-205'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                    LIVE COCKPIT OVERRIDE
                  </button>
                </div>

                {activePanelTab === 'commands' ? (
                  <div className="space-y-3">
                    {/* Action 1: Reroute */}
                    <button
                      type="button"
                      onClick={() => handleAction('reroute')}
                      disabled={isProcessing}
                      className="w-full text-left p-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-teal-500/50 flex justify-between items-center group cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block group-hover:text-teal-400 transition-colors">Deploy AI Rerouting Scheme</span>
                        <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">Optimize speed curves and bypass obstacles</span>
                      </div>
                      <RefreshCw className="w-4 h-4 text-teal-400 group-hover:rotate-180 transition-transform duration-500" />
                    </button>

                    {/* Action 2: Emergency Braking Halt */}
                    <button
                      type="button"
                      onClick={() => handleAction('halt')}
                      disabled={isProcessing || selectedTrain.currentSpeed === 0}
                      className={`w-full text-left p-3.5 rounded-xl border flex justify-between items-center group cursor-pointer active:scale-[0.98] transition-all ${
                        selectedTrain.currentSpeed === 0 ? 'bg-neutral-950/40 border-neutral-900 opacity-60 cursor-not-allowed' : 'bg-neutral-950 hover:bg-neutral-850 border-neutral-800 hover:border-red-900'
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-bold block ${selectedTrain.currentSpeed === 0 ? 'text-neutral-500' : 'text-neutral-300 group-hover:text-red-400 transition-colors'}`}>
                          Commit Emergency Rail Braking Halt
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">Bring locomotive run to immediate static halt</span>
                      </div>
                      <AlertTriangle className={`w-4 h-4 ${selectedTrain.currentSpeed === 0 ? 'text-neutral-600' : 'text-red-500 animate-pulse'}`} />
                    </button>

                    {/* Action 3: Track alignment ping */}
                    <button
                      type="button"
                      onClick={logTrackPing}
                      disabled={isProcessing}
                      className="w-full text-left p-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 flex justify-between items-center group cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block group-hover:text-emerald-400 transition-colors">Audit Ground Sensor Alignment</span>
                        <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">Poll track friction coefficient logs</span>
                      </div>
                      <Signal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 font-mono text-[11px] bg-neutral-950/50 p-4 rounded-xl border border-neutral-850">
                    {/* Status Toggle buttons */}
                    <div>
                      <span className="text-neutral-500 text-[9px] block uppercase mb-1.5">SAFETY STATUS ALERT LEDGER</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['Optimal', 'Advisory', 'Critical'].map((st) => {
                          const isActive = overrideStatus === st;
                          let activeStyle = "";
                          if (isActive) {
                            activeStyle = st === 'Optimal' ? "bg-emerald-950 text-emerald-400 border border-emerald-500" :
                                          st === 'Advisory' ? "bg-amber-950 text-amber-400 border border-amber-500" :
                                          "bg-red-950 text-red-400 border border-red-500 animate-pulse";
                          } else {
                            activeStyle = "bg-neutral-900 border border-transparent text-neutral-450 hover:text-white";
                          }
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => { sounds.playTap(); setOverrideStatus(st as any); }}
                              className={`py-1.5 rounded text-[10px] font-bold text-center border cursor-pointer uppercase transition-all ${activeStyle}`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Compact sliders grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <div className="flex justify-between text-[9px] text-neutral-400">
                          <span>VELOCITY LIMIT</span>
                          <span className="text-teal-400 font-bold">{overrideSpeed} KM/H</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="160"
                          value={overrideSpeed}
                          onChange={(e) => setOverrideSpeed(Number(e.target.value))}
                          className="w-full accent-teal-400 mt-1 cursor-pointer bg-neutral-800 h-1.5 rounded-lg appearance-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-neutral-400">
                          <span>PASSENGER OCCUPANCY</span>
                          <span className="text-teal-400 font-bold">{overrideCrowd}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={overrideCrowd}
                          onChange={(e) => setOverrideCrowd(Number(e.target.value))}
                          className="w-full accent-teal-400 mt-1 cursor-pointer bg-neutral-800 h-1.5 rounded-lg appearance-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-neutral-400">
                          <span>DELAY MINUTES</span>
                          <span className={`font-bold ${overrideDelay > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>+{overrideDelay}M</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="120"
                          value={overrideDelay}
                          onChange={(e) => setOverrideDelay(Number(e.target.value))}
                          className="w-full accent-amber-500 mt-1 cursor-pointer bg-neutral-800 h-1.5 rounded-lg appearance-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-neutral-400">
                          <span>RISK SCORE INDEX</span>
                          <span className={`font-bold ${overrideRiskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{overrideRiskScore}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={overrideRiskScore}
                          onChange={(e) => setOverrideRiskScore(Number(e.target.value))}
                          className="w-full accent-red-500 mt-1 cursor-pointer bg-neutral-800 h-1.5 rounded-lg appearance-none"
                        />
                      </div>
                    </div>

                    {/* Text fields for Stations & ETA */}
                    <div className="space-y-2 border-t border-neutral-900 pt-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <span className="text-zinc-500 text-[8px] block uppercase">CURRENT STATION</span>
                          <input
                            type="text"
                            value={overrideStation}
                            onChange={(e) => setOverrideStation(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-850 focus:border-yellow-500/50 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-700 outline-none transition-all"
                            placeholder="e.g. Nagpur Jn"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-zinc-500 text-[8px] block uppercase">NEXT DESTINATION STOP</span>
                          <input
                            type="text"
                            value={overrideNextStop}
                            onChange={(e) => setOverrideNextStop(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-850 focus:border-yellow-500/50 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-700 outline-none transition-all"
                            placeholder="e.g. Pune Jn"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[8px] block uppercase">ESTIMATED ARRIVAL TIME (ETA)</span>
                        <input
                          type="text"
                          value={overrideEta}
                          onChange={(e) => setOverrideEta(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-850 focus:border-yellow-500/50 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-705 outline-none transition-all"
                          placeholder="HH:MM (e.g. 14:15)"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={handleApplyOverride}
                      disabled={isSavingOverride}
                      className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-neutral-950 font-extrabold uppercase rounded-lg text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-950/20 active:scale-95 disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingOverride ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          TRANSMITTING TELEMETRY PATCH...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          TRANSMIT TELEMETRY PATCH OVERRIDES
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {selectedTrain.aiRecommendation && activePanelTab === 'commands' && (
                <div className="mt-5 p-3.5 rounded-xl bg-teal-950/20 border border-teal-900/50">
                  <span className="text-[10px] font-mono uppercase text-teal-400 block tracking-wider font-semibold">AI Recommendation Plan</span>
                  <p className="text-[11px] text-neutral-300 leading-relaxed mt-1 font-mono">{selectedTrain.aiRecommendation}</p>
                </div>
              )}
            </section>

            {/* Simulated Live Block Sector Status Grid Map */}
            <section id="sector-map-pane" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                    Interactive Grid schematic
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-mono text-teal-400 uppercase">SVG Topology</span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
                  Select nodes to inspect localized sector tracks and synchronize signal relays.
                </p>

                {/* Micro-Schema Active Vector Rail Grid Map */}
                <div className="relative border border-neutral-800 bg-neutral-950 rounded-xl p-2.5 overflow-hidden">
                  <svg viewBox="0 0 400 180" className="w-full h-auto select-none">
                    {/* Background diagnostic network grids */}
                    <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeOpacity="0.015" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                    <defs>
                      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.6" / >
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>

                    {/* SVG Paths for multiple Train Tracks */}
                    {/* Track 1: Outer Loop Circular */}
                    <path 
                      id="outer-track"
                      d="M 40 40 L 360 40 C 390 40, 390 140, 360 140 L 40 140 C 10 140, 10 40, 40 40 Z" 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth="5" 
                      strokeLinecap="round" 
                    />
                    <path 
                      d="M 40 40 L 360 40 C 390 40, 390 140, 360 140 L 40 140 C 10 140, 10 40, 40 40 Z" 
                      fill="none" 
                      stroke="#0f766e" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 8"
                      className="opacity-30"
                    />

                    {/* Track 2: Center Fast Bypass */}
                    <path 
                      d="M 40 40 Q 200 90, 360 40" 
                      fill="none" 
                      stroke="#222" 
                      strokeWidth="4" 
                      strokeDasharray="5 5" 
                    />

                    {/* Station Interchanges circles */}
                    <g id="station-nodes" className="opacity-80">
                      {/* Nord station */}
                      <circle cx="40" cy="40" r="5" fill="#111" stroke="#475569" strokeWidth="1.5" />
                      <text x="35" y="28" fill="#64748b" fontSize="8" fontFamily="monospace">STN_N</text>

                      {/* Central Station Interchange */}
                      <circle cx="200" cy="40" r="6" fill="#115e59" stroke="#2dd4bf" strokeWidth="1.5" />
                      <text x="185" y="28" fill="#2dd4bf" fontSize="8" fontFamily="monospace" fontWeight="bold">CENTRAL_HUB</text>

                      {/* South Station */}
                      <circle cx="200" cy="140" r="5" fill="#111" stroke="#475569" strokeWidth="1.5" />
                      <text x="182" y="154" fill="#64748b" fontSize="8" fontFamily="monospace">STN_S</text>

                      {/* East Terminal */}
                      <circle cx="360" cy="90" r="5" fill="#111" stroke="#475569" strokeWidth="1.5" />
                      <text x="345" y="104" fill="#64748b" fontSize="8" fontFamily="monospace">EAST_TERM</text>
                    </g>

                    {/* Train Nodes */}
                    {trains.map((train, i) => {
                      // Custom positions along our vector layout for representational purposes
                      const getVisualPos = (id: string) => {
                        if (id === 'RG-204') return { x: 120, y: 40, color: '#2dd4bf' };
                        if (id === 'RG-401') return { x: 280, y: 40, color: '#f59e0b' };
                        if (id === 'RG-882') return { x: 200, y: 140, color: '#10b981' };
                        return { x: 100, y: 140, color: '#6366f1' };
                      };

                      const pos = getVisualPos(train.id);
                      const isSelected = selectedTrainId === train.id;

                      return (
                        <g 
                          key={train.id}
                          className="cursor-pointer group"
                          onClick={() => {
                            setSelectedTrainId(train.id);
                            sounds.playTap();
                          }}
                        >
                          {/* Pulsing ring filter for selected train */}
                          {isSelected && (
                            <circle 
                              cx={pos.x} 
                              cy={pos.y} 
                              r="15" 
                              fill="none" 
                              stroke={pos.color} 
                              strokeWidth="1.5" 
                              className="animate-ping opacity-25" 
                            />
                          )}
                          
                          {/* Outer node glow block */}
                          <circle 
                            cx={pos.x} 
                            cy={pos.y} 
                            r={isSelected ? "9" : "6.5"} 
                            fill={isSelected ? pos.color : "#111111"} 
                            stroke={pos.color} 
                            strokeWidth="2.5" 
                            className="transition-all duration-300 group-hover:scale-125"
                          />

                          {/* Inner core core */}
                          {isSelected && (
                            <circle 
                              cx={pos.x} 
                              cy={pos.y} 
                              r="3.5" 
                              fill="#000000" 
                            />
                          )}

                          {/* Float text identifier */}
                          <text 
                            x={pos.x + 11} 
                            y={pos.y + 3} 
                            fill={isSelected ? "#ffffff" : "#94a3b8"} 
                            fontSize={isSelected ? "9" : "7.5"} 
                            fontFamily="monospace"
                            fontWeight={isSelected ? "bold" : "normal"}
                            className="pointer-events-none transition-all"
                          >
                            {train.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Ground Status legends */}
                  <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 mt-2 px-1 border-t border-neutral-900/40 pt-2">
                    <span>SECTOR STABILITY: OPTIMUM</span>
                    <span>ACTIVE FAULT SHUTTLE: CLEAR</span>
                  </div>
                </div>
              </div>

              {/* Operator Command Line shell and Output History */}
              <div className="mt-4 bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden flex flex-col h-48 justify-between">
                <div className="p-3 overflow-y-auto space-y-1.5 flex-1 font-mono text-[10px] text-zinc-400 select-text">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-1 mb-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-teal-400 block">Autonomous CLI Command Shell</span>
                    <span className="text-[8px] bg-teal-950 text-teal-400 px-1.5 py-0.2 rounded border border-teal-900 font-mono">PORT: 3000 CORE</span>
                  </div>
                  <div className="space-y-1">
                    {actionLog.slice().reverse().map((log, index) => {
                      const isInput = log.startsWith('>$');
                      return (
                        <p key={index} className={isInput ? "text-teal-400 font-bold" : "text-neutral-300"}>
                          {log}
                        </p>
                      );
                    })}
                    <div ref={cliBottomRef} />
                  </div>
                </div>

                <form onSubmit={handleCliSubmit} className="border-t border-neutral-800 bg-neutral-900/60 p-2.5 flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-teal-400 animate-pulse shrink-0" />
                  <input
                    type="text"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    placeholder="Type a command... (e.g. 'help', 'ping rg-204', 'reroute rg-401')"
                    className="flex-1 bg-transparent text-white font-mono text-[11px] focus:outline-none placeholder:text-neutral-600"
                  />
                  <button type="submit" className="px-3 py-1 bg-teal-400 hover:bg-teal-500 text-black font-extrabold font-mono text-[10px] rounded uppercase cursor-pointer transition-colors shrink-0">
                    EXEC
                  </button>
                </form>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
