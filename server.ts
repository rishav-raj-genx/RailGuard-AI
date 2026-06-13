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
let trainDatabase = [
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
  },
  {
    id: "IR-224",
    name: "Vande Bharat Express [22436]",
    route: "New Delhi ↔ Varanasi",
    origin: "New Delhi",
    destination: "Varanasi",
    status: "Optimal",
    delayMinutes: 0,
    currentSpeed: 130,
    powerEfficiency: 95.8,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 78,
    safetyAlert: "Clear",
    riskScore: 5,
    sector: "Sector IND-N1",
    currentStation: "Kanpur Central",
    nextStop: "Prayagraj Jn",
    eta: "12:00",
    departureTime: "06:00",
    arrivalTime: "14:00",
    carCrowds: [55, 68, 80, 85, 75, 70, 65, 50],
    routeLegs: [
      { station: "New Delhi Station", time: "06:00", status: "passed" },
      { station: "Kanpur Central Platform 1", time: "10:10", status: "current" },
      { station: "Prayagraj Jn", time: "12:00", status: "upcoming" },
      { station: "Varanasi Junction", time: "14:00", status: "upcoming" }
    ],
    aiRecommendation: "Maintain nominal cruise at 130 km/h. Forward blocks clear through Prayagraj sector.",
    aiReasoning: "Excellent track ballast conditions and optimal motor temperatures reported on all 16 coaches of the rake."
  },
  {
    id: "IR-129",
    name: "Mumbai Rajdhani Express [12952]",
    route: "New Delhi ↔ Mumbai Central",
    origin: "New Delhi",
    destination: "Mumbai Central",
    status: "Optimal",
    delayMinutes: 8,
    currentSpeed: 120,
    powerEfficiency: 92.4,
    activeFaults: 0,
    crowdLevel: "High",
    crowdPercent: 92,
    safetyAlert: "Clear",
    riskScore: 14,
    sector: "Sector IND-W4",
    currentStation: "Ratlam Jn",
    nextStop: "Vadodara Jn",
    eta: "05:15",
    departureTime: "16:55",
    arrivalTime: "08:35",
    carCrowds: [88, 92, 95, 96, 94, 90, 85, 70],
    routeLegs: [
      { station: "New Delhi Hazarat Nizamuddin", time: "16:55", status: "passed" },
      { station: "Kota Junction", time: "21:40", status: "passed" },
      { station: "Ratlam Junction Platform 3", time: "01:15", status: "current" },
      { station: "Vadodara Junction", time: "05:15", status: "upcoming" },
      { station: "Mumbai Central Gare", time: "08:35", status: "upcoming" }
    ]
  },
  {
    id: "IR-120",
    name: "Howrah Duronto Express [12246]",
    route: "Bengaluru ↔ Howrah",
    origin: "Bengaluru",
    destination: "Howrah",
    status: "Advisory",
    delayMinutes: 15,
    currentSpeed: 110,
    powerEfficiency: 89.1,
    activeFaults: 1,
    crowdLevel: "High",
    crowdPercent: 86,
    safetyAlert: "Clear",
    riskScore: 28,
    sector: "Sector IND-E2",
    carCrowds: [70, 80, 85, 90, 88, 82, 75, 60],
    routeLegs: [
      { station: "Siddharoodha Swamiji Hubballi", time: "11:00", status: "passed" },
      { station: "Vijayawada Junction", time: "22:30", status: "passed" },
      { station: "Visakhapatnam Junction Platform 8", time: "04:15", status: "current" },
      { station: "Bhubaneswar Terminal", time: "11:20", status: "upcoming" },
      { station: "Howrah Station", time: "16:15", status: "upcoming" }
    ],
    aiRecommendation: "Acknowledge 15-minute dwell delay due to signal line scheduling and minor coach power grid fluctuations.",
    aiReasoning: "Main alternator backup 2 active. Heavy passenger load of 86% increases air-conditioning compression overhead."
  },
  {
    id: "IR-201",
    name: "Bhopal Shatabdi Express [12002]",
    route: "New Delhi ↔ Bhopal Junction",
    origin: "New Delhi",
    destination: "Bhopal Junction",
    status: "Optimal",
    delayMinutes: 0,
    currentSpeed: 150,
    powerEfficiency: 96.5,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 62,
    safetyAlert: "Clear",
    riskScore: 4,
    sector: "Sector IND-C2",
    currentStation: "Agra Cantt",
    nextStop: "Gwalior Jn",
    eta: "08:15",
    departureTime: "06:00",
    arrivalTime: "14:40",
    carCrowds: [45, 55, 68, 70, 65, 60, 52, 40],
    routeLegs: [
      { station: "New Delhi Station", time: "06:00", status: "passed" },
      { station: "Agra Cantt Platform 1", time: "07:50", status: "current" },
      { station: "Gwalior Junction", time: "09:30", status: "upcoming" },
      { station: "Jhansi Junction", time: "10:45", status: "upcoming" },
      { station: "Bhopal Junction Terminal", time: "14:40", status: "upcoming" }
    ],
    aiRecommendation: "Nominal telemetry profile. Auto-catenary tensioning parameters within green tolerances in central sector.",
    aiReasoning: "Standard passenger density and high performance on all LHB coaches evaluated."
  },
  {
    id: "IR-205",
    name: "Gatimaan Express [12050]",
    route: "Nizamuddin ↔ Jhansi Junction",
    origin: "Hazrat Nizamuddin",
    destination: "Jhansi Junction",
    status: "Optimal",
    delayMinutes: 0,
    currentSpeed: 160,
    powerEfficiency: 97.2,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 55,
    safetyAlert: "Clear",
    riskScore: 3,
    sector: "Sector IND-N2",
    currentStation: "Hazrat Nizamuddin",
    nextStop: "Agra Cantt",
    eta: "09:50",
    departureTime: "08:10",
    arrivalTime: "12:35",
    carCrowds: [40, 50, 60, 65, 58, 52, 48, 35],
    routeLegs: [
      { station: "Hazrat Nizamuddin Platform 5", time: "08:10", status: "current" },
      { station: "Agra Cantt", time: "09:50", status: "upcoming" },
      { station: "Gwalior Junction", time: "11:15", status: "upcoming" },
      { station: "Jhansi Junction Terminal", time: "12:35", status: "upcoming" }
    ],
    aiRecommendation: "Authorize max cruise speed of 160 km/h as the Hazrat-Agra direct corridor reports no maintenance log blocks.",
    aiReasoning: "WAP-5 high-speed locomotive working with nominal traction values."
  },
  {
    id: "IR-210",
    name: "Deccan Queen [12124]",
    route: "Pune ↔ Mumbai CSMT",
    origin: "Pune",
    destination: "Mumbai CSMT",
    status: "Optimal",
    delayMinutes: 2,
    currentSpeed: 105,
    powerEfficiency: 94.0,
    activeFaults: 0,
    crowdLevel: "High",
    crowdPercent: 89,
    safetyAlert: "Clear",
    riskScore: 11,
    sector: "Sector IND-W1",
    currentStation: "Lonavala",
    nextStop: "Karjat",
    eta: "08:35",
    departureTime: "07:15",
    arrivalTime: "10:25",
    carCrowds: [80, 88, 92, 95, 90, 85, 78, 60],
    routeLegs: [
      { station: "Pune Junction", time: "07:15", status: "passed" },
      { station: "Shivajinagar", time: "07:25", status: "passed" },
      { station: "Lonavala Platform 2", time: "08:15", status: "current" },
      { station: "Karjat Junction", time: "09:05", status: "upcoming" },
      { station: "Kalyan Junction", time: "09:45", status: "upcoming" },
      { station: "Mumbai Chhatrapati Shivaji Maharaj Terminus", time: "10:25", status: "upcoming" }
    ],
    aiRecommendation: "Monitor braking hydraulic indices closely when descending Bhor Ghat incline sectors.",
    aiReasoning: "Heavy load factor of 89% adds load overhead to pushing-pulling dual-engine configuration."
  },
  {
    id: "IR-701",
    name: "MA-HSR Bullet Train [NHSRCL-01]",
    route: "Mumbai ↔ Ahmedabad",
    origin: "Mumbai",
    destination: "Ahmedabad",
    status: "Optimal",
    delayMinutes: 1,
    currentSpeed: 320,
    powerEfficiency: 99.4,
    activeFaults: 0,
    crowdLevel: "Low",
    crowdPercent: 35,
    safetyAlert: "Clear",
    riskScore: 2,
    sector: "Sector IND-HSR",
    currentStation: "Surat",
    nextStop: "Vadodara",
    eta: "14:50",
    departureTime: "13:45",
    arrivalTime: "15:45",
    carCrowds: [25, 30, 38, 42, 35, 30, 25, 20],
    routeLegs: [
      { station: "Mumbai Bandra Kurla Complex HSR", time: "13:45", status: "passed" },
      { station: "Thane HSR", time: "13:58", status: "passed" },
      { station: "Surat HSR Platform 3", time: "14:32", status: "current" },
      { station: "Vadodara HSR", time: "14:50", status: "upcoming" },
      { station: "Ahmedabad Sabarmati HSR Terminal", time: "15:45", status: "upcoming" }
    ],
    aiRecommendation: "Cruise locked at 320 km/h. Automated slab track temperature monitoring reporting ideal thresholds.",
    aiReasoning: "Japan-collaborative E5 Series Shinkansen platform demonstrating flawless power and overhead line interface parameters."
  },
  {
    id: "IR-215",
    name: "Tejas Express [22672]",
    route: "Madurai ↔ Chennai Egmore",
    origin: "Madurai",
    destination: "Chennai Egmore",
    status: "Optimal",
    delayMinutes: 4,
    currentSpeed: 110,
    powerEfficiency: 93.8,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 70,
    safetyAlert: "Clear",
    riskScore: 6,
    sector: "Sector IND-S3",
    currentStation: "Trichy",
    nextStop: "Villupuram",
    eta: "18:10",
    departureTime: "15:00",
    arrivalTime: "21:15",
    carCrowds: [50, 60, 75, 82, 70, 65, 55, 45],
    routeLegs: [
      { station: "Madurai Junction", time: "15:00", status: "passed" },
      { station: "Dindigul Junction", time: "15:45", status: "passed" },
      { station: "Tiruchirappalli Junction Platform 4", time: "17:00", status: "current" },
      { station: "Villupuram Junction", time: "18:10", status: "upcoming" },
      { station: "Chennai Egmore Terminal", time: "21:15", status: "upcoming" }
    ],
    aiRecommendation: "Nominal scheduling performance. Track clearances ahead verified.",
    aiReasoning: "Excellent safety metric logging from onboard microprocessors."
  },
  {
    id: "IR-101",
    name: "Howrah Rajdhani Express [12301]",
    route: "Howrah ↔ New Delhi",
    origin: "Howrah Junction",
    destination: "New Delhi",
    status: "Optimal",
    delayMinutes: 0,
    currentSpeed: 130,
    powerEfficiency: 96.1,
    activeFaults: 0,
    crowdLevel: "High",
    crowdPercent: 88,
    safetyAlert: "Clear",
    riskScore: 5,
    sector: "Sector IND-E1",
    currentStation: "Dhanbad Jn",
    nextStop: "Gaya Jn",
    eta: "20:05",
    departureTime: "16:50",
    arrivalTime: "10:00",
    carCrowds: [75, 82, 88, 90, 85, 80, 75, 60],
    routeLegs: [
      { station: "Howrah Junction Platform 9", time: "16:50", status: "passed" },
      { station: "Dhanbad Junction Platform 2", time: "19:50", status: "current" },
      { station: "Gaya Junction", time: "22:15", status: "upcoming" },
      { station: "Prayagraj Junction", time: "02:10", status: "upcoming" },
      { station: "New Delhi Station Terminal", time: "10:00", status: "upcoming" }
    ],
    aiRecommendation: "Cruise optimized at 130 km/h. Automated interlocking logs report absolute clearance throughout NCR line blocks.",
    aiReasoning: "HOG (Head-On-Generation) system optimal, relieving standard active hotel-load generator friction coefficients."
  },
  {
    id: "IR-208",
    name: "Patna Vande Bharat Express [22348]",
    route: "Patna ↔ Howrah",
    origin: "Patna Junction",
    destination: "Howrah Junction",
    status: "Optimal",
    delayMinutes: 3,
    currentSpeed: 110,
    powerEfficiency: 95.2,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 68,
    safetyAlert: "Clear",
    riskScore: 4,
    sector: "Sector IND-M5",
    currentStation: "Asansol Jn",
    nextStop: "Howrah Junction",
    eta: "14:35",
    departureTime: "08:00",
    arrivalTime: "14:35",
    carCrowds: [40, 52, 60, 68, 70, 65, 58, 48],
    routeLegs: [
      { station: "Patna Junction Platform 1", time: "08:00", status: "passed" },
      { station: "Mokama Junction", time: "09:05", status: "passed" },
      { station: "Jasidih Junction", time: "11:10", status: "passed" },
      { station: "Asansol Junction Platform 5", time: "12:35", status: "current" },
      { station: "Howrah Junction Terminal", time: "14:35", status: "upcoming" }
    ],
    aiRecommendation: "Apply +5 km/h auxiliary traction drive through Raniganj mining zone track block corridors.",
    aiReasoning: "Nominal braking temperatures on LHB disk assemblies allow high thermal buffer on current descent."
  },
  {
    id: "IR-122",
    name: "Pune Duronto Express [12222]",
    route: "Howrah ↔ Pune Junction",
    origin: "Howrah Junction",
    destination: "Pune Junction",
    status: "Advisory",
    delayMinutes: 22,
    currentSpeed: 95,
    powerEfficiency: 88.4,
    activeFaults: 1,
    crowdLevel: "High",
    crowdPercent: 82,
    safetyAlert: "Clear",
    riskScore: 24,
    sector: "Sector IND-C8",
    currentStation: "Nagpur Jn",
    nextStop: "Bhusaval Jn",
    eta: "14:15",
    departureTime: "08:20",
    arrivalTime: "09:45",
    carCrowds: [62, 70, 80, 85, 88, 86, 78, 60],
    routeLegs: [
      { station: "Howrah Junction Platform 21", time: "08:20", status: "passed" },
      { station: "Bilaspur Junction", time: "15:45", status: "passed" },
      { station: "Nagpur Junction Platform 3", time: "22:10", status: "current" },
      { station: "Bhusaval Junction", time: "03:55", status: "upcoming" },
      { station: "Pune Junction Terminal", time: "09:45", status: "upcoming" }
    ],
    aiRecommendation: "Maintain active thermal sensor polling on Car 3 traction secondary motor. Set advisory delay tracking to +22m.",
    aiReasoning: "Vibration frequency reports minor ball-bearing noise under heavy passenger weight of 82%."
  },
  {
    id: "RG-502",
    name: "Eurostar High-Speed [ES-901]",
    route: "London ↔ Paris",
    origin: "London",
    destination: "Paris",
    status: "Optimal",
    delayMinutes: 0,
    currentSpeed: 290,
    powerEfficiency: 98.2,
    activeFaults: 0,
    crowdLevel: "Medium",
    crowdPercent: 64,
    safetyAlert: "Clear",
    riskScore: 3,
    sector: "Sector Channel-E3",
    currentStation: "Calais-Fréthun",
    nextStop: "Paris Nord",
    eta: "18:30",
    departureTime: "16:20",
    arrivalTime: "18:30",
    carCrowds: [40, 50, 65, 74, 68, 60, 55, 30],
    routeLegs: [
      { station: "London St Pancras Intl", time: "16:20", status: "passed" },
      { station: "Ashford International", time: "16:50", status: "passed" },
      { station: "Channel Tunnel Ingress", time: "17:15", status: "passed" },
      { station: "Calais-Fréthun Platform A", time: "17:50", status: "current" },
      { station: "Paris Gare du Nord Terminal", time: "18:30", status: "upcoming" }
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

const BASELINE_TRAINS = JSON.parse(JSON.stringify(trainDatabase));
const BASELINE_ALERTS = JSON.parse(JSON.stringify(priorityAlerts));

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

// POST a brand new custom train (Simulated telemetry feed integration)
app.post("/api/trains", (req, res) => {
  const { id, name, route, origin, destination, status, currentSpeed, crowdPercent, sector } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: "id and name are crucial properties for telemetry validation." });
  }

  // Check if exists
  if (trainDatabase.some(t => t.id === id)) {
    return res.status(400).json({ error: "Train ID already exists in Active ledger database." });
  }

  const newTrain = {
    id,
    name,
    route: route || `${origin || 'Gare'} → ${destination || 'Station'}`,
    origin: origin || "Paris",
    destination: destination || "Berlin",
    status: status || "Optimal",
    delayMinutes: 0,
    currentSpeed: Number(currentSpeed) || 120,
    powerEfficiency: 95.0,
    activeFaults: status === "Critical" ? 1 : 0,
    crowdLevel: crowdPercent > 70 ? "High" : crowdPercent > 35 ? "Medium" : "Low",
    crowdPercent: Number(crowdPercent) || 50,
    safetyAlert: status === "Critical" ? "Critical" : "Clear",
    riskScore: status === "Critical" ? 80 : 10,
    sector: sector || "Sector X",
    currentStation: origin || "Paris",
    nextStop: destination || "Berlin",
    eta: "17:40",
    departureTime: "12:00",
    arrivalTime: "18:00",
    carCrowds: Array.from({ length: 8 }, () => Math.floor(Math.random() * (crowdPercent || 50))),
    routeLegs: [
      { station: origin || "Paris", time: "12:00", status: "passed" },
      { station: destination || "Berlin", time: "18:00", status: "upcoming" }
    ]
  };

  trainDatabase.push(newTrain);
  res.status(201).json({ message: "Custom train successfully added into active telemetry flow.", train: newTrain });
});

// PUT to edit or modify live feed credentials for an existing train
app.put("/api/trains/:id", (req, res) => {
  const train = trainDatabase.find(t => t.id === req.params.id);
  if (!train) {
    return res.status(404).json({ error: "Specified Train ID is not present." });
  }

  const { status, currentSpeed, crowdPercent, delayMinutes, sector, riskScore, activeFaults, currentStation, nextStop, eta, route } = req.body;

  if (status !== undefined) {
    train.status = status;
    train.safetyAlert = status === "Critical" ? "Critical" : "Clear";
  }
  if (currentSpeed !== undefined) train.currentSpeed = Number(currentSpeed);
  if (crowdPercent !== undefined) {
    train.crowdPercent = Number(crowdPercent);
    train.crowdLevel = train.crowdPercent > 70 ? "High" : train.crowdPercent > 35 ? "Medium" : "Low";
    train.carCrowds = Array.from({ length: 8 }, () => Math.floor(Math.random() * train.crowdPercent));
  }
  if (delayMinutes !== undefined) train.delayMinutes = Number(delayMinutes);
  if (sector !== undefined) train.sector = sector;
  if (riskScore !== undefined) train.riskScore = Number(riskScore);
  if (activeFaults !== undefined) train.activeFaults = Number(activeFaults);
  if (currentStation !== undefined) {
    train.currentStation = currentStation;
    // Update the pass/upcoming routeLegs status if it exists
    if (train.routeLegs) {
      let passedCurrent = false;
      train.routeLegs = train.routeLegs.map(leg => {
        if (leg.station.toLowerCase().includes(currentStation.toLowerCase())) {
          passedCurrent = true;
          return { ...leg, status: 'current' as const };
        }
        return { ...leg, status: passedCurrent ? ('upcoming' as const) : ('passed' as const) };
      });
    }
  }
  if (nextStop !== undefined) {
    train.nextStop = nextStop;
    if (train.routeLegs) {
      // make sure nextStop is in the upcoming or similar
    }
  }
  if (eta !== undefined) train.eta = eta;
  if (route !== undefined) train.route = route;

  res.json({ message: "Telemetry feed modified successfully.", train });
});

// DELETE a train from the active display
app.delete("/api/trains/:id", (req, res) => {
  const index = trainDatabase.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Train ID not found." });
  }
  const deleted = trainDatabase.splice(index, 1)[0];
  res.json({ message: `Successfully deleted train telemetry stream for ${deleted.id}.` });
});

// POST to create custom simulated priority safety alert
app.post("/api/alerts", (req, res) => {
  const { title, description, criticality, associatedTrainId } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "title and description are required for priority warning codes." });
  }

  const newAlert = {
    id: `alert-${Date.now()}`,
    type: "engineering",
    title,
    description,
    criticality: criticality || "High",
    associatedTrainId: associatedTrainId || undefined
  };

  priorityAlerts.unshift(newAlert);
  res.status(201).json({ message: "Safety alert injected successfully.", alert: newAlert });
});

// POST to reset database metrics to pure pristine defaults
app.post("/api/reset-data", (req, res) => {
  trainDatabase = JSON.parse(JSON.stringify(BASELINE_TRAINS));
  priorityAlerts = JSON.parse(JSON.stringify(BASELINE_ALERTS));
  res.json({ message: "All simulation database metrics recoded back to initial layout seed values.", trains: trainDatabase, alerts: priorityAlerts });
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
