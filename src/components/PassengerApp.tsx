import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Train, Clock, MapPin, QrCode, Ticket, 
  AlertOctagon, Check, Send, Sparkles, Activity, Layers, Wifi, Camera, XCircle, Minimize2, RefreshCw
} from 'lucide-react';
import { Train as TrainType } from '../types';
import { sounds } from '../utils/audio';

interface PassengerAppProps {
  trains: TrainType[];
  onBack: () => void;
}

export default function PassengerApp({ trains, onBack }: PassengerAppProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrainId, setSelectedTrainId] = useState<string>('RG-204');
  const [sosStatus, setSosStatus] = useState<'idle' | 'reporting' | 'reported'>('idle');
  const [sosDescription, setSosDescription] = useState<string>('');
  const [sosAlertMessage, setSosAlertMessage] = useState<string>('');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    station: string;
    platform: string;
    gate: string;
    time: string;
    verificationCode: string;
  } | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);

  // Seat management state
  const [selectedCarIndex, setSelectedCarIndex] = useState<number>(2); // Car 3 default
  const [reservedSeat, setReservedSeat] = useState<{ car: number; seat: string } | null>(null);

  const selectedTrain = trains.find(t => t.id === selectedTrainId) || trains[0];

  // Filter trains for search selector
  const filteredTrains = trains.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.currentStation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const triggerSOS = (e: React.FormEvent) => {
    e.preventDefault();
    setSosStatus('reporting');
    sounds.playAlert();
    setTimeout(() => {
      setSosStatus('reported');
      setSosAlertMessage(`SOS Red Distress signal acknowledged. Direct beacon active for ${selectedTrain.id} over block sector ${selectedTrain.sector}. Emergency safety conductors dispatched.`);
      setSosDescription('');
      sounds.playError();
    }, 1200);
  };

  return (
    <div id="passenger-root" className="min-h-screen bg-neutral-950 text-white pb-16 selection:bg-emerald-500 selection:text-black">
      {/* Top Bar Navigation */}
      <div className="border-b border-neutral-900 bg-neutral-900/40 backdrop-blur-md px-6 py-4 flex justify-between items-center">
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
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">PASSENGER PORTAL</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Passenger Portal</h1>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 font-mono text-xs text-neutral-400">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>ONBOARD RAIL Wi-Fi CONNECTED</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Train lookup / Search results */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-3">
              Journey Search &amp; tracking
            </h2>
            
            {/* Search filter input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              <input 
                type="text" 
                placeholder="Search Train, City (e.g. Paris)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
            </div>

            {/* List results */}
            <div className="mt-4 space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredTrains.map((train) => (
                <button
                  key={train.id}
                  type="button"
                  onClick={() => setSelectedTrainId(train.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    train.id === selectedTrain.id 
                      ? 'bg-emerald-950/20 border-emerald-800 shadow-lg shadow-emerald-950/10' 
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      train.id === selectedTrain.id ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-400'
                    }`}>
                      <Train className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{train.id}</span>
                      <span className="text-[10px] text-neutral-400 font-mono block">{train.route}</span>
                    </div>
                  </div>
                  <div>
                    {train.delayMinutes > 0 ? (
                      <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                        +{train.delayMinutes}m delay
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                        On Time
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Digital Mobile Ticket Section */}
          <div className="bg-neutral-900 border border-neutral-805 rounded-2xl p-5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            
            <div id="ticket-header" className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
              <div className="flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-mono font-semibold uppercase text-neutral-300">Onboard Wallet Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScanning(prev => !prev);
                  if (isScanning) {
                    setScanResult(null);
                    setIsProcessingScan(false);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold uppercase transition-all duration-200 cursor-pointer border ${
                  isScanning 
                    ? 'bg-red-950/40 text-red-400 border-red-900/40 hover:bg-red-900/20' 
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/20'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isScanning ? 'Close Scanner' : 'Scan'}</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="scanner-container"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-5 flex flex-col"
                >
                  {scanResult ? (
                    /* Display scan success summary block */
                    <div className="p-4 bg-gradient-to-br from-emerald-950/40 to-neutral-950 border border-emerald-900/60 rounded-xl text-center space-y-4">
                      <div className="py-2 flex flex-col items-center">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-550/20 mb-2 animate-bounce">
                          <Check className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white tracking-tight">QR Verification Successful</h4>
                        <span className="text-[9px] text-emerald-400 font-mono uppercase bg-emerald-950/60 px-2 py-0.5 rounded mt-1 border border-emerald-900/40">
                          Decrypted Block Signal Verified
                        </span>
                      </div>

                      <div className="border-t border-b border-dashed border-neutral-800/80 py-3 space-y-2 text-left font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">STATION LOCATION:</span>
                          <span className="text-white font-bold">{scanResult.station}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">ASSIGNED PLATFORM:</span>
                          <span className="text-emerald-400 font-bold">{scanResult.platform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">INTERLOCK GATE:</span>
                          <span className="text-neutral-300">{scanResult.gate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">TIMESTAMP:</span>
                          <span className="text-neutral-300">{scanResult.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">SHA-256 SIGNATURE:</span>
                          <span className="text-[9px] text-zinc-400 select-all font-bold tracking-wider truncate max-w-[150px]">{scanResult.verificationCode}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setScanResult(null)}
                          className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg font-semibold transition-colors border border-neutral-805 cursor-pointer"
                        >
                          Scan Another
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsScanning(false);
                            setScanResult(null);
                          }}
                          className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Finish Scan
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* The actual scanning viewfinder simulation */
                    <div className="space-y-4">
                      <div className="relative aspect-square sm:aspect-video rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex flex-col items-center justify-center text-center">
                        {/* Shimmering Scan Lasers */}
                        <motion.div
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                          className="absolute left-0 right-0 h-[2.5px] bg-emerald-500 shadow-[0_0_12px_#10b981] z-10 pointer-events-none"
                        />

                        {/* Outer framing indicators to make it real high-tech */}
                        <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl pointer-events-none" />
                        <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr pointer-events-none" />
                        <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl pointer-events-none" />
                        <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br pointer-events-none" />

                        {/* Lens reflection ring background */}
                        <div className="absolute inset-4 rounded-lg bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/10 via-neutral-950/60 to-neutral-950/90 pointer-events-none" />

                        {isProcessingScan ? (
                          <div className="flex flex-col items-center space-y-2.5 z-20">
                            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                            <div className="font-mono text-xs text-neutral-300">
                              <span className="block font-bold">DECRYPTING RAIL SIGNAL...</span>
                              <span className="text-[10px] text-neutral-500">Verifying secure checksum hashes</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center p-4 z-20 space-y-3">
                            {/* Live REC badge blinking */}
                            <div className="flex items-center space-x-1.5 bg-neutral-900/85 border border-neutral-800 px-2 py-0.5 rounded-full font-mono text-[9px] text-neutral-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>CAMERA FEED ACTIVE</span>
                            </div>
                            
                            {/* Dummy station graphics inside viewfinder */}
                            <div className="w-16 h-16 border-2 border-neutral-800 border-dashed rounded-lg flex items-center justify-center bg-neutral-900/20 text-neutral-600">
                              <QrCode className="w-8 h-8 animate-pulse text-emerald-500/40" />
                            </div>

                            <p className="text-[10px] text-neutral-400 font-mono leading-relaxed max-w-[240px]">
                              Align physical station check-in QR code or tap a simulation below to auto-capture.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Simulation Presets Block */}
                      <div className="space-y-2">
                        <span className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                          Simulated QR Targets:
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isProcessingScan}
                            onClick={() => {
                              setIsProcessingScan(true);
                              sounds.playPing();
                              setTimeout(() => {
                                setIsProcessingScan(false);
                                sounds.playSuccess();
                                setScanResult({
                                  station: `${selectedTrain.origin} Gare Terminal`,
                                  platform: "Platform 12 (North)",
                                  gate: "Interlock Sector A-3",
                                  time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                                  verificationCode: "SHA256_E8F432A_8820B"
                                });
                              }, 900);
                            }}
                            className="p-2 text-left bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/40 rounded-xl font-mono text-[10px] transition-colors cursor-pointer group disabled:opacity-50"
                          >
                            <span className="font-bold text-white block group-hover:text-emerald-400">Scan Origin QR</span>
                            <span className="text-[9px] text-neutral-500 block truncate">{selectedTrain.origin} Hub</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessingScan}
                            onClick={() => {
                              setIsProcessingScan(true);
                              sounds.playPing();
                              setTimeout(() => {
                                setIsProcessingScan(false);
                                sounds.playSuccess();
                                setScanResult({
                                  station: `${selectedTrain.destination} Central Station`,
                                  platform: "Platform 3-C Main",
                                  gate: "Interlock Sector G-9",
                                  time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                                  verificationCode: "SHA256_F98C02B_4021D"
                                });
                              }, 900);
                            }}
                            className="p-2 text-left bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/40 rounded-xl font-mono text-[10px] transition-colors cursor-pointer group disabled:opacity-50"
                          >
                            <span className="font-bold text-white block group-hover:text-emerald-400">Scan Terminal QR</span>
                            <span className="text-[9px] text-neutral-500 block truncate">{selectedTrain.destination} Station</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Simulated QR Code Wallet */
                <motion.div
                  key="ticket-card-details"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="mt-5 p-5 bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 rounded-xl relative flex flex-col items-center"
                >
                  <div className="w-full flex justify-between text-[10px] font-mono text-neutral-400 border-b border-dashed border-neutral-800 pb-3">
                    <div>
                      <span>LOCOMOTIVE PASS</span>
                      <span className="font-bold text-white block mt-0.5">{selectedTrain.id}</span>
                    </div>
                    {reservedSeat && (
                      <div className="text-center px-2 py-0.5 bg-teal-950/30 border border-teal-900/60 rounded animate-pulse">
                        <span className="text-[8px] text-teal-400 block uppercase font-mono">SEAT LAYOUT</span>
                        <span className="font-bold text-teal-400 block mt-0.5">CAR {reservedSeat.car} • {reservedSeat.seat}</span>
                      </div>
                    )}
                    <div className="text-right">
                      <span>FARECLASS</span>
                      <span className="font-bold text-emerald-400 block mt-0.5">SPEEDFIRST FLEX</span>
                    </div>
                  </div>

                  <div className="flex justify-between w-full my-4 font-mono text-center">
                    <div className="text-left">
                      <span className="text-[9px] text-neutral-500 block uppercase">Boarding station</span>
                      <span className="text-sm font-bold block">{selectedTrain.origin}</span>
                    </div>
                    <div className="text-center font-bold text-neutral-600 self-center">
                      ➔
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-neutral-500 block uppercase">Arrival destination</span>
                      <span className="text-sm font-bold block">{selectedTrain.destination}</span>
                    </div>
                  </div>

                  {/* Central Vector Barcode Placeholder */}
                  <div className="p-3 bg-white rounded-xl mb-4 self-center shadow-lg">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>

                  <div className="text-center font-mono text-[9px] text-neutral-500">
                    <span>BARCODE ID_882942_G81</span>
                    <span className="block mt-1 bg-neutral-900/40 px-2.5 py-1 rounded text-neutral-300 text-[10px] border border-neutral-800">
                      Platform entry guaranteed • Scan at interchange
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column - Beautiful Simulated Mobile viewport of Mockup 2 */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
            {/* Visual Header Grid resembling a phone screen status line */}
            <div className="flex justify-between items-center text-xs text-neutral-500 font-mono pb-4 border-b border-neutral-800/50">
              <span className="font-semibold text-neutral-400">09:41 AM UTC</span>
              <div className="flex items-center space-x-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">5G LINK</span>
              </div>
            </div>

            {/* Dynamic Station Header */}
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black block tracking-tight text-white">
                  Train {selectedTick(selectedTrain.id)} {selectedTrain.id}
                </h1>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  selectedTrain.status === 'Optimal' ? "bg-emerald-950 text-emerald-400 border border-emerald-900" :
                  selectedTrain.status === 'Advisory' ? "bg-amber-950 text-amber-400 border border-amber-900" :
                  "bg-red-950 text-red-500 border border-red-900 animate-pulse"
                }`}>
                  • {selectedTrain.status === 'Optimal' ? 'En Route' : 'Delays on Route'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Current Station: <strong className="text-neutral-200">{selectedTrain.currentStation}</strong></span>
                </div>
                {selectedTrain.routeLegs.find(l => l.status === 'current')?.platform && (
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded">
                    {selectedTrain.routeLegs.find(l => l.status === 'current')?.platform}
                  </span>
                )}
                <div>
                  <span>Next stop: <strong className="text-emerald-300">{selectedTrain.nextStop}</strong></span>
                </div>
              </div>
            </div>

            {/* Delay offset indicator and details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-center">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase">Operational Delta</span>
                <span className={`text-xl font-extrabold tracking-tight mt-1 ml-1 inline-block ${
                  selectedTrain.delayMinutes > 0 ? 'text-amber-500' : 'text-emerald-400'
                }`}>
                  {selectedTrain.delayMinutes > 0 ? `Delayed +${selectedTrain.delayMinutes}m` : 'Optimized / Ahead'}
                </span>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-center">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase">System Alerts</span>
                <span className={`text-xl font-extrabold tracking-tight mt-1 inline-block ${
                  selectedTrain.activeFaults > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                }`}>
                  {selectedTrain.activeFaults > 0 ? `${selectedTrain.activeFaults} Active` : 'Clear'}
                </span>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-center">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase">Instant Speed</span>
                <span className="text-xl font-extrabold tracking-tight text-white mt-1 inline-block">
                  {selectedTrain.currentSpeed} km/h
                </span>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-center">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase font-bold text-center">Safety Status</span>
                <span className={`text-xl font-extrabold tracking-tight mt-1 inline-block ${
                  selectedTrain.status === 'Critical' ? 'text-red-500' :
                  selectedTrain.status === 'Advisory' ? 'text-amber-400' : 'text-teal-400'
                }`}>
                  {selectedTrain.status}
                </span>
              </div>

            </div>

            {/* Custom Interactive Crowd Level Per Carriage Monitor */}
            {/* Labeled Car 1 to 8, with live percentages as requested in Mockup 2! */}
            <div id="crowd-monitor-card" className="mt-8 bg-neutral-950 p-5 rounded-3xl border border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Onboard Crowd Levels per Carriage</h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Real-time thermal sensor feedback loops. Click any carriage block to view local seat layouts.</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/35 text-amber-400 border border-amber-900/50">
                  Aggregate: {selectedTrain.crowdPercent}% Capacity
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3.5 mt-2">
                {selectedTrain.carCrowds.map((capacity, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedCarIndex(i);
                      sounds.playTap();
                    }}
                    className={`flex flex-col items-center p-1.5 rounded-2xl transition-all cursor-pointer ${
                      selectedCarIndex === i 
                        ? 'bg-neutral-900 border border-teal-500/40 ring-1 ring-teal-500/25 scale-[1.01]' 
                        : 'bg-transparent border border-transparent hover:bg-neutral-900/45'
                    }`}
                  >
                    {/* Visual carriage block representation */}
                    <div className="w-full h-16 bg-neutral-900 rounded-xl relative overflow-hidden border border-neutral-800 flex items-end">
                      {/* Height representing occupancy */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${capacity}%` }}
                        transition={{ duration: 0.6 }}
                        className={`w-full transition-all ${
                          capacity >= 85 ? 'bg-gradient-to-t from-red-600 to-red-400' :
                          capacity >= 50 ? 'bg-gradient-to-t from-amber-600 to-amber-400' :
                          'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        }`} 
                      />
                      {/* Labeled text center */}
                      <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[10px] text-white mix-blend-difference">
                        {capacity}%
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 mt-2 block text-center font-bold">Car {i+1}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Cabin Seat Layout Heatmap */}
              <div className="mt-6 border-t border-dashed border-neutral-900 pt-5">
                <div className="flex justify-between items-center mb-3.5">
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                      Carriage {selectedCarIndex + 1} Seat Occupancy Matrix
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Click any unallocated seat (green outline) to lock in your digital boarding reservation.</p>
                  </div>
                  {reservedSeat && reservedSeat.car === (selectedCarIndex + 1) && (
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-900/50 animate-bounce">
                      Currently Assigned: {reservedSeat.seat}
                    </span>
                  )}
                </div>

                {/* Grid representing physical seat positioning in a sleek visual format */}
                <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-900 flex flex-col items-center">
                  {/* Front Locomotive Driver Cabin Indicator */}
                  <div className="w-1/2 text-center py-1 bg-neutral-900/60 rounded-md border border-neutral-850 font-mono text-[9px] text-neutral-500 mb-4 tracking-wider">
                    === DIRECTION OF TRAVEL ===
                  </div>

                  {/* 16 Seat configuration (4 rows x 4 columns with central aisle) */}
                  <div className="grid grid-cols-5 gap-3 max-w-sm w-full font-mono text-[10px]">
                    {[...Array(16)].map((_, seatIdx) => {
                      // Determine seat row letter and column index
                      const rowLetter = String.fromCharCode(65 + Math.floor(seatIdx / 4)); // A, B, C, D
                      const colNum = (seatIdx % 4) + 1; // 1, 2, 3, 4
                      const seatCode = `${rowLetter}${colNum}`;

                      // Generate deterministic occupied status based on seat index, car index, and train ID hash
                      const idNum = parseInt(selectedTrain.id.replace('RG-', '')) || 204;
                      const isOccupied = (seatIdx * 7 + selectedCarIndex * 13 + idNum) % 3 !== 0; 
                      const isMe = reservedSeat && reservedSeat.car === (selectedCarIndex + 1) && reservedSeat.seat === seatCode;

                      // Central aisle placement at column Index 2 (before col 3)
                      const isAisleColumn = seatIdx % 4 === 2;

                      return (
                        <React.Fragment key={seatIdx}>
                          {isAisleColumn && <div className="w-4 h-full self-center flex items-center justify-center text-neutral-800 text-[10px] font-bold">||</div>}
                          
                          <button
                            type="button"
                            disabled={isOccupied && !isMe}
                            onClick={() => {
                              if (isMe) {
                                setReservedSeat(null);
                                sounds.playError();
                              } else {
                                setReservedSeat({ car: selectedCarIndex + 1, seat: seatCode });
                                sounds.playSuccess();
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-center transition-all duration-150 cursor-pointer ${
                              isMe 
                                ? 'bg-teal-400 text-black border-teal-300 font-extrabold shadow-md shadow-teal-500/20 animate-pulse' 
                                : isOccupied 
                                  ? 'bg-neutral-900/40 text-neutral-600 border-neutral-900 cursor-not-allowed text-[9px]'
                                  : 'bg-neutral-950 text-emerald-400 border-emerald-950/40 hover:border-emerald-500/40 hover:bg-emerald-950/10'
                            }`}
                          >
                            {seatCode}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Seat legends */}
                  <div className="flex flex-wrap gap-4 mt-4 font-mono text-[9px] text-neutral-500 justify-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-neutral-900 border border-neutral-900" />
                      <span>Occupied</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-neutral-950 border border-emerald-950/40" />
                      <span>Vacant / Bookable</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 animate-pulse" />
                      <span>Your Seat</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Station Route Journey Timeline */}
            <div id="route-timeline-tracker" className="mt-8 border-t border-neutral-800/80 pt-6">
              <h3 className="text-sm font-bold text-white mb-4">Live Journey Progress Timeline</h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                {selectedTrain.routeLegs.map((leg, index) => {
                  return (
                    <div key={index} className="relative flex justify-between items-start gap-4">
                      {/* Timeline dot circle */}
                      <span className={`absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${
                        leg.status === 'passed' ? 'bg-emerald-500 ring-emerald-950/40' :
                        leg.status === 'current' ? 'bg-teal-400 ring-teal-950/80 animate-pulse' :
                        'bg-neutral-700 ring-neutral-950'
                      }`} />

                      <div className="text-left">
                        <h4 className={`text-xs font-bold ${
                          leg.status === 'upcoming' ? 'text-neutral-500' : 'text-white'
                        }`}>
                          {leg.station}
                        </h4>
                        {leg.delayNotes && (
                          <span className="text-[10px] font-mono text-amber-500 block mt-0.5">{leg.delayNotes}</span>
                        )}
                      </div>

                      <div className="text-right font-mono text-[10px] text-neutral-400">
                        <span>Expected</span>
                        <span className="block font-bold text-neutral-200 mt-0.5">{leg.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passenger SOS beacon Dispatcher Form */}
            <div id="sos-beacon-card" className="mt-8 p-5 rounded-3xl bg-red-950/15 border border-red-900/50">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <AlertOctagon className="w-4.5 h-4.5 animate-pulse" /> Urgent Passenger SOS Alarm Beacon
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Report absolute safety distress coordinates of locomotive carriage runs. System relays the report to diagnostic central operators instantly.
              </p>

              <AnimatePresence mode="wait">
                {sosStatus === 'idle' ? (
                  <form onSubmit={triggerSOS} className="mt-4 flex flex-wrap gap-2">
                    <input 
                      type="text"
                      required
                      placeholder="Specify urgency (medical alert, object on rails, sensor buzz)..."
                      value={sosDescription}
                      onChange={(e) => setSosDescription(e.target.value)}
                      className="flex-1 min-w-[200px] bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-4 text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-4 bg-red-600 hover:bg-red-700 font-bold font-mono text-xs uppercase tracking-wider text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Launch Distress SOS
                    </button>
                  </form>
                ) : sosStatus === 'reporting' ? (
                  <div className="mt-4 py-3 flex items-center justify-center space-x-2 text-xs font-mono text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
                    <span>BROADCASTING DISTRESS COORDINATES...</span>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-300"
                  >
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider">
                      <Check className="w-4 h-4 bg-red-500 text-black rounded-full p-0.5" /> Distress Signal Transmitted
                    </div>
                    <p>{sosAlertMessage}</p>
                    <button
                      type="button"
                      onClick={() => setSosStatus('idle')}
                      className="mt-3.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer text-[10px]"
                    >
                      Report another issue
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

function selectedTick(id: string) {
  if (id === 'RG-204') return '🚇';
  if (id === 'RG-401') return '⚡';
  if (id === 'RG-882') return '🚆';
  return '🚈';
}
