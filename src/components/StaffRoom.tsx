import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, AlertCircle, Clock, ArrowLeft, Bot, User, HelpCircle, 
  Terminal, ShieldCheck, Activity, Brain, RefreshCw
} from 'lucide-react';
import { ChatMessage, Train as TrainType } from '../types';

interface StaffRoomProps {
  trains: TrainType[];
  initialChat: ChatMessage[];
  onBack: () => void;
  onReroute: (trainId: string) => void;
}

export default function StaffRoom({ trains, initialChat, onBack, onReroute }: StaffRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Pre-cooked prompt blocks
  const PRESET_QUERIES = [
    { label: "Analyse high risk fleets", prompt: "Which train is most at risk today? Provide a detailed safety index." },
    { label: "Analyse RG-401 axle vibration delay", prompt: "Why is Train RG-401 delayed? Give me the specific logistics breakdown." },
    { label: "Optimize sector clearance layout", prompt: "Draft an inspection schedule for Sector 4G anomalies." }
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}-user`,
      sender: 'user',
      text: text,
      timestamp: timestamp
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      // POST the conversation history to the server's Gemini chat route
      const historyToSend = [...messages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: historyToSend })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages(prev => [...prev, {
          id: `chat-${Date.now()}-ai`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error || "Telemetry connection failed.");
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `chat-${Date.now()}-ai`,
        sender: 'ai',
        text: `### System Communications Interrupted\nUnable to establish direct satellite link with **RailGuard Agent Core**. \n*   **Telemetry status**: Stable offline cache\n*   **Reason**: ${err.message || 'Diagnostic socket timeout'}. Please check your environment variables or try again.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePresetClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div id="staff-ai-root" className="min-h-screen bg-neutral-950 text-white pb-16 selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <div id="chat-header" className="border-b border-neutral-900 bg-neutral-900/40 backdrop-blur-md px-6 py-4 flex justify-between items-center">
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
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-900">GEMINI AI ASSISTANT</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">RailGuard Intelligence Room</h1>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-3 text-xs font-mono text-neutral-400 bg-neutral-900 px-3.5 py-1.5 rounded-lg border border-neutral-800">
          <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>MODEL: GEMINI-3.5-FLASH</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Diagnostics and Quick Queries */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Quick Analytical Audits</span>
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            </h2>
            <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
              Select an automated diagnostic prompt block to consult RailGuard Intelligence's neural network about active runs.
            </p>

            <div className="space-y-2">
              {PRESET_QUERIES.map((query, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetClick(query.prompt)}
                  className="w-full text-left p-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-900 text-xs transition-colors flex items-start gap-2.5 group cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-neutral-200 block group-hover:text-cyan-300 transition-colors">{query.label}</span>
                    <span className="text-[10px] text-neutral-500 font-mono block mt-0.5 line-clamp-1">{query.prompt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active fleet context ledger */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-3">CONCURRENT AI LEDGER DATA</h3>
            <p className="text-[10px] text-neutral-500 leading-relaxed mb-4">The following trains are currently injected inside the model's system context context loop:</p>

            <div className="space-y-2">
              {trains.map(t => (
                <div key={t.id} className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold block">{t.id}</span>
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">{t.route}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    t.status === 'Optimal' ? 'bg-emerald-950/40 text-emerald-400' :
                    t.status === 'Advisory' ? 'bg-amber-950/40 text-amber-400' :
                    'bg-red-950/40 text-red-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Fully functional Chat Workspace */}
        <div className="lg:col-span-8 flex flex-col h-[70vh] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
          
          {/* Chat scrolling viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3.5 max-w-[85%] ${isAi ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                >
                  {/* Portrait icons */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isAi ? 'bg-cyan-950 border border-cyan-800 text-cyan-400' : 'bg-neutral-850 border border-neutral-700 text-neutral-200'
                  }`}>
                    {isAi ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 font-mono uppercase block">{msg.sender} • {msg.timestamp}</span>

                    {/* Standard text messages */}
                    {msg.text && (
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                        isAi 
                          ? 'bg-neutral-950 border-neutral-850 text-neutral-200' 
                          : 'bg-cyan-950 text-white border-cyan-800/60'
                      }`}>
                        {/* Render simple markdown structures or formatting safely */}
                        <div className="markdown-body space-y-2 whitespace-pre-line font-mono select-text">
                          {msg.text}
                        </div>
                      </div>
                    )}

                    {/* Highly stylized CardData blocks for preset answer output */}
                    {msg.cardData && (
                      <div className="p-4 rounded-2xl bg-neutral-950 border-2 border-dashed border-red-900/60 text-xs text-left max-w-md shadow-lg shadow-red-950/10">
                        <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider mb-2 font-mono">
                          <AlertCircle className="w-4 h-4 animate-pulse" />
                          <span>{msg.cardData.title}</span>
                        </div>
                        
                        <div className="mt-2 text-neutral-300 space-y-2 ml-1">
                          <p><strong>Recommendation Override Plan:</strong> {msg.cardData.recommendation}</p>
                          <p className="text-[11px] text-neutral-400 leading-relaxed font-mono"><strong>Underlying Reasoning:</strong> {msg.cardData.reasoning}</p>
                        </div>

                        {msg.cardData.showRerouteButton && msg.cardData.associatedTrainId && (
                          <div className="mt-4 pt-3.5 border-t border-neutral-900 flex justify-between items-center">
                            <span className="text-[10px] font-mono text-neutral-500">Telemetry reference: {msg.cardData.associatedTrainId}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (msg.cardData?.associatedTrainId) {
                                  onReroute(msg.cardData.associatedTrainId);
                                  alert(`AI routing plan committed. Signal blocks cleared.`);
                                }
                              }}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Commit Bypass Plan
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prepopulated Timeline breakdown log card */}
                    {msg.timelineData && (
                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-left max-w-md">
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-850 mb-3 font-mono">
                          <span className="font-bold text-cyan-400 uppercase tracking-wider">{msg.timelineData.title}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-500 font-bold border border-amber-900/50">
                            {msg.timelineData.delayLabel}
                          </span>
                        </div>

                        <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-[1px] before:bg-neutral-800">
                          {msg.timelineData.steps.map((step, idx) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-5 top-1 bg-amber-500 w-1.5 h-1.5 rounded-full" />
                              <div className="font-mono text-[10px] text-neutral-500 text-left">
                                {step.time} • <strong className="text-amber-500 uppercase">{step.type}</strong>
                              </div>
                              <p className="text-neutral-300 text-[11px] mt-0.5 font-mono">{step.desc}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-neutral-900 font-mono text-[10px] text-neutral-500">
                          {msg.timelineData.statusNote}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Generation state animation loader */}
            {isGenerating && (
              <div className="flex gap-3.5 mr-auto text-left max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-cyan-950 border border-cyan-800 text-cyan-400 animate-pulse">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase block">ai is generating...</span>
                  <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-200"></span>
                    <span className="text-[11px] font-mono text-neutral-400 ml-1.5">Analyzing sector blocks, signal loops, and active transits...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Form and presets panel */}
          <div className="bg-neutral-950 border-t border-neutral-800 p-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex gap-2"
            >
              <input 
                type="text"
                disabled={isGenerating}
                placeholder="Ask RailGuard AI (e.g., Explain why Train RG-112 is running so fast...)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:border-cyan-500 text-white font-mono placeholder:text-neutral-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isGenerating || !inputText.trim()}
                className="px-5 py-3.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-neutral-850 disabled:text-neutral-500 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-4.5 h-4.5" /> Send
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
