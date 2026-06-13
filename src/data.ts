import { Train, PriorityAlert, ChatMessage } from './types';

export const INITIAL_TRAINS: Train[] = [
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

export const INITIAL_ALERTS: PriorityAlert[] = [
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

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "chat-001",
    sender: "user",
    text: "Which train is most at risk today?",
    timestamp: "09:14 AM"
  },
  {
    id: "chat-002",
    sender: "ai",
    text: "",
    timestamp: "09:14 AM",
    cardData: {
      title: "Immediate Attention Required: Train RG-401",
      isCritical: true,
      recommendation: "Initiate a Level 2 safety inspection at Sector 4G (Aachen West) and reroute non-essential freight via the northern loop.",
      reasoning: "Predictive sensors indicate a 14% increase in axle vibration and a pending thermal threshold breach on carriage 4. Peak congestion at 11:00 AM creates a high-collision probability if standard route is maintained.",
      associatedTrainId: "RG-401",
      showRerouteButton: true
    }
  },
  {
    id: "chat-003",
    sender: "user",
    text: "Why is Train RG-401 delayed? Give me the specific logistics breakdown.",
    timestamp: "09:16 AM"
  },
  {
    id: "chat-004",
    sender: "ai",
    text: "",
    timestamp: "09:16 AM",
    timelineData: {
      title: "Operational Delay Breakdown: RG-401",
      delayLabel: "+18M DELAY",
      steps: [
        { time: "08:45 AM", type: "EXTERNAL FACTOR", desc: "Unscheduled maintenance check on Track 4 prevented timely platform clearing.", icon: "construction" },
        { time: "09:10 AM", type: "RECOVERY PROTOCOL", desc: "RailGuard AI suggested localized speed optimization (+12km/h) to recover 6 minutes of the lost window.", icon: "speed" }
      ],
      statusNote: "Crew notified. Automatic switch logs locked and updated for optimized 19:10 arrival at Hannover."
    }
  }
];
