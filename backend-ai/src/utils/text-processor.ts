import { PatientProfile } from '../patient/interfaces/patient-profile.interface';
export const cleanPatientInfo = (rawText: string): string => {
  return rawText
    .replace(/<[^>]*>/g, ' ') // Quita etiquetas HTML
    .replace(/\s+/g, ' ') // Colapsa espacios
    .replace(/[^\w\s.,;:!?\-/]/g, '') // Quita caracteres especiales
    .trim()
    .substring(0, 10000); // Limita a 10k
};

export const splitTextIntoChunks = (
  text: string,
  chunkSize: number = 2000,
  overlap: number = 200,
): string[] => {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // Si no estamos al final del texto, intentamos encontrar un buen punto de corte
    if (endIndex < text.length) {
      // Buscar el último espacio o punto antes del chunkSize
      const lastSpace = text.lastIndexOf(' ', endIndex);
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastBreak = Math.max(lastSpace, lastPeriod);

      if (lastBreak > startIndex) {
        endIndex = lastBreak + 1;
      }
    }

    chunks.push(text.slice(startIndex, endIndex));
    startIndex = endIndex - overlap;
  }

  return chunks;
};

export const processAndCleanPatientInfo = (patientInfo: string): string => {
  const cleaned = cleanPatientInfo(patientInfo);
  const chunks = splitTextIntoChunks(cleaned);
  return chunks.length > 1 ? chunks.join('\n\n----\n\n') : cleaned;
};

export const patientProfileToNarrative = (input: unknown): string => {
  try {
    if (!input || typeof input !== 'object') {
      return typeof input === 'string' ? input : '';
    }

    const profile = input as Partial<PatientProfile>;
    const {
      age,
      gender,
      lifeStage,
      medicalHistory,
      currentHealthConditions,
      geneticFamilyHistory,
      lifestyle,
      personalGoals,
      preferences,
      medications,
      supplements,
      environmentalFactors,
      socialFactors,
    } = profile;

    const parts: string[] = [];

    const demographics: string[] = [];
    if (typeof age === 'number') demographics.push(`${age} años`);
    if (gender) demographics.push(`género: ${gender}`);
    if (lifeStage) demographics.push(`etapa de vida: ${lifeStage}`);
    if (demographics.length)
      parts.push(`Datos demográficos: ${demographics.join(', ')}.`);

    if (medicalHistory) parts.push(`Historia médica: ${medicalHistory}.`);
    if (currentHealthConditions)
      parts.push(`Condiciones actuales: ${currentHealthConditions}.`);
    if (geneticFamilyHistory)
      parts.push(`Antecedentes familiares/genéticos: ${geneticFamilyHistory}.`);

    if (lifestyle && typeof lifestyle === 'object') {
      const lParts: string[] = [];
      if (lifestyle.diet) lParts.push(`dieta: ${lifestyle.diet}`);
      if (lifestyle.physicalActivity)
        lParts.push(`actividad física: ${lifestyle.physicalActivity}`);
      if (lifestyle.sleepHabits) lParts.push(`sueño: ${lifestyle.sleepHabits}`);
      if (lifestyle.stressLevels)
        lParts.push(`estrés: ${lifestyle.stressLevels}`);
      if (lifestyle.substanceUse)
        lParts.push(`sustancias: ${lifestyle.substanceUse}`);
      if (lParts.length) parts.push(`Estilo de vida: ${lParts.join(', ')}.`);
    }

    if (personalGoals) parts.push(`Objetivos personales: ${personalGoals}.`);
    if (preferences) parts.push(`Preferencias: ${preferences}.`);
    if (medications) parts.push(`Medicaciones: ${medications}.`);
    if (supplements) parts.push(`Suplementos: ${supplements}.`);
    if (environmentalFactors)
      parts.push(`Factores ambientales: ${environmentalFactors}.`);
    if (socialFactors) parts.push(`Factores sociales: ${socialFactors}.`);

    const narrative = parts.join(' ');
    return narrative || '';
  } catch {
    return '';
  }
};

export const buildMissingProfileQuestions = (input: unknown): string[] => {
  const questions: string[] = [];
  const isBlank = (v: unknown) =>
    v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

  if (!input || typeof input !== 'object') {
    // No structured profile: ask high-level onboarding questions
    return [
      '¿Podrías contarme tu edad y con qué género te identificas?',
      '¿Tienes alguna condición de salud actual o antecedentes médicos importantes?',
      '¿Cómo describirías tu estilo de vida en cuanto a alimentación, actividad física, sueño y estrés?',
      '¿Tomas medicamentos o suplementos actualmente?',
      '¿Hay antecedentes familiares relevantes de salud?',
      '¿Qué objetivos personales o preferencias tienes respecto a tu bienestar?',
    ];
  }

  const profile = input as Partial<PatientProfile>;

  if (isBlank(profile.age)) questions.push('¿Cuál es tu edad?');
  if (isBlank(profile.gender)) {
    questions.push('¿Con qué género te identificas?');
  }
  if (isBlank(profile.lifeStage))
    questions.push(
      '¿En qué etapa de vida te encuentras (por ejemplo, adultez, embarazo, etc.)?',
    );
  if (isBlank(profile.medicalHistory))
    questions.push('¿Tienes antecedentes médicos que debamos tener en cuenta?');
  if (isBlank(profile.currentHealthConditions))
    questions.push('¿Cuentas con condiciones de salud actuales relevantes?');
  if (isBlank(profile.geneticFamilyHistory))
    questions.push('¿Hay antecedentes familiares de importancia en tu salud?');

  const lifestyle: Partial<NonNullable<PatientProfile['lifestyle']>> =
    profile.lifestyle ?? {};
  if (isBlank(lifestyle.diet))
    questions.push('¿Cómo describirías tu alimentación habitual?');
  if (isBlank(lifestyle.physicalActivity))
    questions.push('¿Qué nivel de actividad física realizas?');
  if (isBlank(lifestyle.sleepHabits))
    questions.push('¿Cómo duermes normalmente (horas y calidad)?');
  if (isBlank(lifestyle.stressLevels))
    questions.push('¿Cómo calificarías tus niveles de estrés?');
  if (isBlank(lifestyle.substanceUse))
    questions.push('¿Consumes alcohol, tabaco u otras sustancias?');

  if (isBlank(profile.personalGoals))
    questions.push(
      '¿Qué objetivos personales de bienestar te gustaría alcanzar?',
    );
  if (isBlank(profile.preferences))
    questions.push(
      '¿Tienes preferencias o restricciones para tu cuidado o recomendaciones?',
    );
  if (isBlank(profile.medications))
    questions.push('¿Tomas algún medicamento actualmente?');
  if (isBlank(profile.supplements)) {
    questions.push('¿Usas suplementos? ¿Cuáles?');
  }
  if (isBlank(profile.environmentalFactors))
    questions.push(
      '¿Hay factores ambientales de tu entorno (trabajo, exposición) a considerar?',
    );
  if (isBlank(profile.socialFactors))
    questions.push(
      '¿Cómo es tu entorno social y apoyo (familia, trabajo, amigos)?',
    );

  return questions;
};
