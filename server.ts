import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "dns";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure local host resolution is fast
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini client successfully initialized.");
} else {
  console.warn("WARNING: GEMINI_API_KEY is not set or using placeholder value. AI Assistant will operate in fallback mock mode.");
}

// In-Memory Railway State Database
const trainDatabase = [
  {
    id: "RG-204",
    name: "InterCity Express [IC-402]",
    route: "Paris → Berlin",
    origin: "Paris",
    destination: "Berlin",
    status: "Optimal",
    delayMinutes: 5,
    currentSpeed: 184,
    powerEfficiency: 94.2,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 58,
    safetyAlert: "Clear",
    riskScore: 12,
    sector: "Sector 7G",
    currentStation: "Grand Central",
    nextStop: "Oakwood St.",
    eta: "14:22",
    departureTime: "08:00",
    arrivalTime: "15:30",
    carCrowds: [30, 45, 88, 95, 55, 25, 15, 10],
    routeLegs: [
      { station: "Paris Gare du Nord", time: "08:00", status: "passed" },
      { station: "Brussels South", time: "09:45", status: "passed", delayNotes: "On Time" },
      { station: "Köln Hbf", time: "11:30", status: "passed", delayNotes: "+2m minor queue" },
      { station: "Grand Central Interchange", platform: "Platform 4", time: "13:15", status: "current" },
      { station: "Oakwood St.", time: "14:22", status: "upcoming", delayNotes: "Est. 14:22 (+5m)" },
      { station: "Berlin Hbf", time: "15:30", status: "upcoming" }
    ],
    aiRecommendation: "Acknowledge routine speed optimizer of +4 km/h through Sector 8 to recover remainder of the 5-minute minor dwell lag.",
    aiReasoning: "No mechanical friction anomalies. Track dry friction index is high. Forward clearances are verified via Sector 8 signal automation."
  },
  {
    id: "RG-882",
    name: "Caledonian Voyager [CV-082]",
    route: "London → Edinburgh",
    origin: "London",
    destination: "Edinburgh",
    status: "Optimal",
    delayMinutes: 0,
    currentSpeed: 210,
    powerEfficiency: 96.8,
    activeFaults: 0,
    crowdLevel: "Low",
    crowdPercent: 42,
    safetyAlert: "Clear",
    riskScore: 8,
    sector: "Sector 2A",
    currentStation: "Newcastle",
    nextStop: "Berwick-upon-Tweed",
    eta: "16:45",
    departureTime: "13:30",
    arrivalTime: "18:15",
    carCrowds: [20, 25, 30, 45, 50, 42, 28, 14],
    routeLegs: [
      { station: "London King's Cross", time: "13:30", status: "passed" },
      { station: "York", time: "15:10", status: "passed" },
      { station: "Newcastle Interchange", platform: "Platform 1", time: "16:15", status: "current" },
      { station: "Berwick-upon-Tweed", time: "16:45", status: "upcoming" },
      { station: "Edinburgh Waverley", time: "18:15", status: "upcoming" }
    ]
  },
  {
    id: "RG-401",
    name: "Trans-European Express [TE-990]",
    route: "Paris → Berlin",
    origin: "Paris",
    destination: "Berlin",
    status: "Critical",
    delayMinutes: 18,
    currentSpeed: 145,
    powerEfficiency: 82.1,
    activeFaults: 2,
    crowdLevel: "High",
    crowdPercent: 94,
    safetyAlert: "Critical",
    riskScore: 84,
    sector: "Sector 4G",
    currentStation: "Aachen West",
    nextStop: "Hannover Hbf",
    eta: "19:10",
    departureTime: "12:15",
    arrivalTime: "20:45",
    carCrowds: [85, 92, 98, 99, 94, 88, 72, 60],
    routeLegs: [
      { station: "Paris Gare de l'Est", time: "12:15", status: "passed" },
      { station: "Aachen West Terminal", platform: "Platform 2", time: "16:20", status: "current" },
      { station: "Hannover Hbf", time: "19:10", status: "upcoming", delayNotes: "delayed by track diagnostics" },
      { station: "Berlin Hbf", time: "20:45", status: "upcoming" }
    ],
    aiRecommendation: "Initiate immediate Level 2 axle thermal evaluation. Route non-essential cargo trains to northern bypass immediately.",
    aiReasoning: "Predictive monitoring indicates extreme 14% increase in axle vibrations and high heat indices on Carriage 4."
  },
  {
    id: "RG-112",
    name: "Shinkansen Bullet [SH-112]",
    route: "Tokyo → Osaka",
    origin: "Tokyo",
    destination: "Osaka",
    status: "Optimal",
    delayMinutes: 0,
    currentSpeed: 300,
    powerEfficiency: 98.9,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 68,
    safetyAlert: "Clear",
    riskScore: 2,
    sector: "Sector 12J",
    currentStation: "Nagoya",
    nextStop: "Kyoto",
    eta: "11:55",
    departureTime: "10:15",
    arrivalTime: "12:35",
    carCrowds: [50, 60, 65, 75, 78, 68, 55, 40],
    routeLegs: [
      { station: "Tokyo Station", time: "10:15", status: "passed" },
      { station: "Shin-Yokohama", time: "10:33", status: "passed" },
      { station: "Nagoya Platform 14", time: "11:35", status: "current" },
      { station: "Kyoto", time: "11:55", status: "upcoming" },
      { station: "Shin-Osaka", time: "12:35", status: "upcoming" }
    ]
  }
];

let priorityAlerts = [
  {
    id: "alert-001",
    type: "engineering",
    title: "Track Inspection Needed",
    description: "Vibration sensors at Sector 4G reporting anomalies outside safety thresholds.",
    criticality: "High",
    associatedTrainId: "RG-401"
  },
  {
    id: "alert-002",
    type: "groups",
    title: "Platform Overcrowding",
    description: "Platform 9 is at 115% capacity. Suggested passenger flow redirection active.",
    criticality: "Mid"
  },
  {
    id: "alert-003",
    type: "alt_route",
    title: "Route Congestion",
    description: "Minor bottleneck forming at junction KB-9 due to weather-related speed limits.",
    criticality: "Low"
  }
];

// ---- REST API ENDPOINTS ----

// GET current active trains
app.get("/api/trains", (req, res) => {
  res.json(trainDatabase);
});

// GET custom train by ID
app.get("/api/trains/:id", (req, res) => {
  const train = trainDatabase.find(t => t.id === req.params.id);
  if (train) {
    res.json(train);
  } else {
    res.status(404).json({ error: "Train not found." });
  }
});

// POST to reroute or optimize a train (recovers it to optimal status)
app.post("/api/trains/:id/reroute", (req, res) => {
  const train = trainDatabase.find(t => t.id === req.params.id);
  if (!train) {
    return res.status(404).json({ error: "Train not found" });
  }
  train.status = "Optimal";
  train.safetyAlert = "Clear";
  train.riskScore = Math.max(2, Math.floor(train.riskScore / 5));
  train.activeFaults = 0;
  train.delayMinutes = Math.max(0, train.delayMinutes - 10);
  
  // Also clean up any priority alert associated with this train
  priorityAlerts = priorityAlerts.filter(a => a.associatedTrainId !== train.id);
  
  res.json({ message: `Train ${train.id} successfully rerouted and optimized via AI-assisted plan.`, train });
});

// POST to issue an emergency halt on a train
app.post("/api/trains/:id/emergency", (req, res) => {
  const train = trainDatabase.find(t => t.id === req.params.id);
  if (!train) {
    return res.status(404).json({ error: "Train not found" });
  }
  train.currentSpeed = 0;
  train.status = "Critical";
  train.safetyAlert = "Critical";
  train.riskScore = 98;
  train.activeFaults += 1;
  
  // Add an alert
  const alertId = `alert-${Date.now()}`;
  priorityAlerts.unshift({
    id: alertId,
    type: "engineering",
    title: `EMERGENCYHALT: ${train.id}`,
    description: `Manual Emergency halt triggered for ${train.name}. Train has stopped with active alert systems.`,
    criticality: "High",
    associatedTrainId: train.id
  });

  res.json({ message: `Emergency halt successfully transmitted. Train ${train.id} is static.`, train });
});

// POST to trigger global emergency shutdown
app.post("/api/emergency-halt-all", (req, res) => {
  trainDatabase.forEach(train => {
    train.currentSpeed = 0;
    train.status = "Critical";
    train.safetyAlert = "Critical";
    train.riskScore = 99;
  });

  priorityAlerts.unshift({
    id: `alert-${Date.now()}`,
    type: "engineering",
    title: "GLOBAL EMERGENCY SHUTDOWN",
    description: "System-wide automated halts deployed. All fleets have been commanded to complete emergency stops.",
    criticality: "High"
  });

  res.json({ message: "Global emergency halt commands broadcasted. All train modules set to static.", trains: trainDatabase });
});

// GET current priority alerts
app.get("/api/alerts", (req, res) => {
  res.json(priorityAlerts);
});

// POST to dismiss an alert
app.post("/api/alerts/:id/dismiss", (req, res) => {
  priorityAlerts = priorityAlerts.filter(a => a.id !== req.params.id);
  res.json({ message: "Alert dismissed.", alerts: priorityAlerts });
});

// POST to talk to the RailGuard Intelligence chatbot (Staff AI)
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages history." });
  }

  // Construct a super rich system prompt based on the in-memory database so the AI knows real-time state!
  const systemInstruction = `You are RailGuard Intelligence, the onboard agentic AI co-pilot for the RailGuard AI rail infrastructure, passenger dispatch, and autonomous safety system.
You are talkative, polite, professional, extremely analytical, and focus on absolute rail safety.
Here is the LIVE network state of the railway network:
${JSON.stringify(trainDatabase, null, 2)}

Active Alarms:
${JSON.stringify(priorityAlerts, null, 2)}

Users will ask you questions about train schedules, delays, congestion, or safety protocols.
Guidelines:
1. Reference active train IDs such as RG-204, RG-401, RG-882, RG-112 specifically when relevant.
2. Provide technical, crisp reasons using railway terms (axle thermal breach, pneumatic brake pressure, track friction coefficient, scheduling margins, platform overcrowding).
3. If they ask about delayed trains or high risk trains, analyze the data above. For example, RG-401 currently has a high risk score of 84% and status "Critical" at Aachen West due to axle vibration. Suggest action points.
4. Keep answers concise, highly structured, scannable, and styled beautifully using clean Markdown.
5. If the user asks you to write code, design sheets o else, refuse humorously, as you are a dedicated industrial train controller.`;

  try {
    if (!ai) {
      // Mock / fallback response if GEMINI_API_KEY is not configured
      const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || "";
      let mockReply = "";
      
      if (lastUserMessage.includes("risk")) {
        mockReply = `### Live Risk Assessment

Immediate Attention Required: **Train RG-401 (Trans-European Express)**
- **Sector**: 4G (Aachen West Terminal)
- **Axle Vibration Offset**: +14% above threshold
- **AI Recommendation**: Initiate Level 2 axle thermal sensor inspection. Promptly divert non-essential commercial vehicles through the northern loop to maintain peak scheduling tolerances.`;
      } else if (lastUserMessage.includes("delay") || lastUserMessage.includes("12004") || lastUserMessage.includes("401")) {
        mockReply = `### delay analysis: train RG-401
- **Current Station**: Aachen West (+18m delay)
- **Logistics Breakdown**:
  1. *08:45 AM*: Direct track maintenance on pathing interchange 4 delayed initial platform exit.
  2. *09:10 AM*: Automated recovery plan initiated. Speed increased by +12 km/h, securing a estimated 6-minute return of track margin before reaching Hannover.
- **Resolution Plan**: Rerouting advisory is ready for deployment.`;
      } else {
        mockReply = `### RailGuard Core Services Operational
I am currently operating in **Diagnostic Mode** (Fallback). 
- All standard network modules are **active**. 
- Live telemetry is synchronized on all active runs (**RG-204**, **RG-882**, **RG-401**, and **RG-112**). 
Ask me about delayed trains, passenger congestion, or safety metrics, and I will analyze the in-memory telemetry database instantly!`;
      }
      return res.json({ reply: mockReply });
    }

    // Format chat history for Gemini SDK
    // The google genai SDK takes { contents: [{ role: 'user', parts: [{ text: '...' }] }] } or similar chat format.
    // Let's use Chat session
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    // Feed message history
    let lastResponse;
    const history = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];

    // Let's just generate directly to keep it simple and ultra robust
    const promptParts = [];
    promptParts.push({ text: `System context: This is the historical thread. Maintain continuity.\n` });
    
    messages.forEach((m: any) => {
      promptParts.push({ text: `${m.sender === "user" ? "User" : "RailGuard Intelligence"}: ${m.text || ""}\n` });
    });

    promptParts.push({ text: `Analyze the context and write a comprehensive, beautifully structured response as RailGuard Intelligence:` });

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptParts,
    });

    res.json({ reply: result.text || "I was unable to analyze the data. Telemetry is stable." });

  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    res.status(500).json({ error: "Gemini AI core failed to respond. Telemetry connection is offline.", details: error.message });
  }
});


// ---- EMBED VITE DEVELOPER SERVER OR SERVE DIST ----

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RailGuard AI Server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
