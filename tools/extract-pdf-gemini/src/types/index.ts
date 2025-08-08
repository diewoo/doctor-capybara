export interface MedicalInfo {
  symptoms: string[];
  diagnosis: string[];
  medications: string[];
  vitalSigns: string[];
  allergies: string[];
  medicalHistory: string[];
  recommendations: string[];
  warningSigns: string[];
  patientInfo: string[];
}

export interface QualityMetrics {
  completeness: number;
  medicalRelevance: number;
  readability: number;
  dataBalance: { [specialty: string]: number };
  totalCases: number;
  validCases: number;
}

export interface ProcessingMetrics {
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  averageProcessingTime: number;
  startTime: Date;
  endTime?: Date;
  medicalCasesFound: number;
}

export interface TrainingExample {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  metadata?: {
    specialty: string;
    confidence: number;
    taskType: string;
  };
}
