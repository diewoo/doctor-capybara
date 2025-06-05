export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface Patient {
  id: string;
  info: any;
  title: string;
  htmlDescription: string;
  chat: ChatMessage[];
  results: any[];
  createdAt: string;
  updatedAt: string;
}
