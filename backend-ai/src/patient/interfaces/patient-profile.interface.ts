export interface PatientProfile {
  // Datos demográficos
  age?: number;
  gender?: string; // e.g., "male", "female", "non-binary", etc.
  lifeStage?: string; // e.g., "adolescence", "adult", "pregnancy"

  // Historia y condiciones
  medicalHistory?: string; // resumen libre
  currentHealthConditions?: string; // condiciones actuales relevantes
  geneticFamilyHistory?: string; // predisposiciones / antecedentes familiares

  // Estilo de vida
  lifestyle?: {
    diet?: string;
    physicalActivity?: string;
    sleepHabits?: string;
    stressLevels?: string;
    substanceUse?: string; // alcohol, tabaco, etc.
  };

  // Preferencias y objetivos
  personalGoals?: string;
  preferences?: string; // restricciones, preferencias de tratamiento

  // Medicación y suplementos
  medications?: string;
  supplements?: string;

  // Entorno y social
  environmentalFactors?: string; // trabajo, exposición ambiental
  socialFactors?: string; // soporte social, situación laboral
}

export type PatientInfoInput = string | PatientProfile;
