import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
}

export const chatService = {
  // Process new patient information
  processPatientInfo: async (patientInfo: any) => {
    const response = await axios.post(`${API_URL}/api/gemini/patient`, { patientInfo });
    return response.data;
  },

  // Get patient by ID
  getPatient: async (id: string) => {
    const response = await axios.get(`${API_URL}/api/gemini/patient/${id}`);
    return response.data;
  },

  // Send chat message
  sendMessage: async (patientId: string, message: string) => {
    const response = await axios.post(`${API_URL}/api/gemini/patient/${patientId}/chat`, { message });
    return response.data;
  },

  // Get conversation history
  getConversation: async (patientId: string) => {
    const response = await axios.get(`${API_URL}/api/gemini/patient/${patientId}/conversation`);
    console.log('API Response:', response.data);
    return response.data;
  },

  // List all patients
  listPatients: async () => {
    const response = await axios.get(`${API_URL}/api/gemini/patient`);
    return response.data;
  },

  // Update patient
  updatePatient: async (patientId: string, patientInfo: any) => {
    const response = await axios.put(`${API_URL}/api/gemini/patient/${patientId}`, { patientInfo });
    return response.data;
  }
}; 