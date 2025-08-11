import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: string;
  suggestions?: string[];
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
  processPatientInfo: async (patientInfo: any, language?: string) => {
    console.log("Sending patientInfo:", patientInfo, "Language:", language);
    console.log("Request payload:", { patientInfo, language });
    try {
      const response = await axios.post(`${API_URL}/api/gemini/patient`, {
        patientInfo,
        language,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error in processPatientInfo:", error);
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Get patient by ID
  getPatient: async (id: string) => {
    const response = await axios.get(`${API_URL}/api/gemini/patient/${id}`);
    return response.data;
  },

  // Send chat message
  sendMessage: async (patientId: string, message: string) => {
    const response = await axios.post(`${API_URL}/api/gemini/patient/${patientId}/chat`, {
      message,
    });
    return response.data;
  },

  // Stream chat message response via SSE
  streamMessage: (
    patientId: string,
    message: string,
    handlers: {
      onDelta: (delta: string) => void;
      onDone?: () => void;
      onError?: (err: unknown) => void;
    }
  ) => {
    const url = `${API_URL}/api/gemini/patient/${patientId}/chat/stream`;
    const controller = new AbortController();

    // We use fetch to initiate the stream and read the body as text
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE-style events: lines with "data: {json}\n\n"
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            const json = line.slice(6);
            try {
              const evt = JSON.parse(json);
              if (evt.type === "delta" && typeof evt.delta === "string") {
                handlers.onDelta(evt.delta);
              } else if (evt.type === "done") {
                handlers.onDone?.();
              } else if (evt.type === "error") {
                handlers.onError?.(evt.error);
              }
            } catch {
              // ignore malformed JSON
            }
          }
        }
      })
      .catch((err) => {
        handlers.onError?.(err);
      });

    return () => controller.abort();
  },

  // Stream edited last user message
  streamEditLastMessage: (
    patientId: string,
    message: string,
    handlers: {
      onDelta: (delta: string) => void;
      onDone?: () => void;
      onError?: (err: unknown) => void;
    }
  ) => {
    const url = `${API_URL}/api/gemini/patient/${patientId}/chat/edit/stream`;
    const controller = new AbortController();

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            const json = line.slice(6);
            try {
              const evt = JSON.parse(json);
              if (evt.type === "delta" && typeof evt.delta === "string") {
                handlers.onDelta(evt.delta);
              } else if (evt.type === "done") {
                handlers.onDone?.();
              } else if (evt.type === "error") {
                handlers.onError?.(evt.error);
              }
            } catch {}
          }
        }
      })
      .catch((err) => handlers.onError?.(err));

    return () => controller.abort();
  },

  // Get conversation history
  getConversation: async (patientId: string) => {
    const response = await axios.get(`${API_URL}/api/gemini/patient/${patientId}/conversation`);
    console.log("API Response:", response.data);
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
  },
};
