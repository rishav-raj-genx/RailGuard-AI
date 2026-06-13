export interface TrainRouteLeg {
  station: string;
  platform?: string;
  time: string;
  status: 'passed' | 'current' | 'upcoming';
  delayNotes?: string;
}

export interface Train {
  id: string; // e.g. "RG-204"
  name: string; // e.g. "InterCity Express [IC-402]"
  route: string; // e.g. "Paris → Berlin"
  origin: string;
  destination: string;
  status: 'Optimal' | 'Advisory' | 'Critical';
  delayMinutes: number; // positive for delay, negative for ahead of schedule
  currentSpeed: number; // in km/h
  powerEfficiency: number; // e.g. 94.2
  activeFaults: number;
  crowdLevel: string; // "Low" | "Medium" | "High"
  crowdPercent: number; // e.g. 42
  safetyAlert: string; // "Clear" | "Advisory" | "Critical"
  riskScore: number; // out of 100
  sector: string; // e.g. "Sector 7G"
  currentStation: string;
  nextStop: string;
  eta: string;
  departureTime: string;
  arrivalTime: string;
  carCrowds: number[]; // array of 8 percentages for different cars
  routeLegs: TrainRouteLeg[];
  aiRecommendation?: string;
  aiReasoning?: string;
}

export interface PriorityAlert {
  id: string;
  type: 'engineering' | 'groups' | 'alt_route';
  title: string;
  description: string;
  criticality: 'High' | 'Mid' | 'Low';
  associatedTrainId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  cardData?: {
    title: string;
    isCritical?: boolean;
    recommendation: string;
    reasoning: string;
    associatedTrainId?: string;
    showRerouteButton?: boolean;
  };
  timelineData?: {
    title: string;
    delayLabel: string;
    steps: { time: string; type: string; desc: string; icon: string }[];
    statusNote: string;
  };
}
