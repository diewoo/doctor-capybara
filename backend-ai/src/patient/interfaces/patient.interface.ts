import { PatientInfoInput } from './patient-profile.interface';
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[]; // optional follow-up chips for AI messages
}

export interface Patient {
  id: string;
  info: PatientInfoInput;
  title: string;
  htmlDescription: string;
  chat: ChatMessage[];
  results: any[];
  createdAt: string;
  updatedAt: string;
}
