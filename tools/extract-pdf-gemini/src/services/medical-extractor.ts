import type { MedicalInfo } from "../types";
import { logger } from "../config";

// Extracción médica mejorada con contexto
function extractWithContext(text: string, triggers: string[], targets: string[]): string[] {
  const sentences = text.split(/[.!?]+/);
  const results: string[] = [];

  sentences.forEach((sentence) => {
    const normalizedSentence = sentence.toLowerCase().trim();

    const hasTrigger = triggers.some((trigger) =>
      normalizedSentence.includes(trigger.toLowerCase())
    );
    const hasTarget = targets.some((target) => normalizedSentence.includes(target.toLowerCase()));

    if (hasTrigger && hasTarget && sentence.length > 10) {
      results.push(sentence.trim());
    }
  });

  return results;
}

// Extraer signos vitales
function extractVitalSigns(text: string): string[] {
  const vitalPatterns = [
    /presión arterial:?\s*\d+\/\d+/gi,
    /pa:?\s*\d+\/\d+/gi,
    /temperatura:?\s*\d+[.,]\d+[°]?/gi,
    /temp:?\s*\d+[.,]\d+[°]?/gi,
    /frecuencia cardíaca:?\s*\d+/gi,
    /fc:?\s*\d+/gi,
    /peso:?\s*\d+[.,]?\d*\s*kg/gi,
    /talla:?\s*\d+[.,]?\d*\s*[cm|m]/gi,
  ];

  const results: string[] = [];
  vitalPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches.map((m) => m.trim()));
    }
  });

  return results;
}

// Extraer información del paciente
function extractPatientInfo(text: string): string[] {
  const patientPatterns = [
    /nombre:?\s*[\w\s]+/gi,
    /edad:?\s*\d+\s*años?/gi,
    /género:?\s*(?:masculino|femenino|m|f)/gi,
    /sexo:?\s*(?:masculino|femenino|m|f)/gi,
    /ocupación:?\s*[\w\s]+/gi,
    /dni:?\s*\d+/gi,
    /fecha de nacimiento:?\s*\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
  ];

  const results: string[] = [];
  patientPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches.map((m) => m.trim()));
    }
  });

  return results;
}

// Extracción de información médica avanzada
export function extractAdvancedMedicalInfo(text: string): MedicalInfo {
  const normalizedText = text.toLowerCase();

  logger.info("\n=== Proceso de Extracción ===");
  logger.info("Longitud del texto:", text.length);
  logger.info("Primeras 100 caracteres:", text.substring(0, 100));

  const result = {
    symptoms: extractWithContext(
      text,
      ["presenta", "refiere", "aqueja", "manifiesta", "dolor", "siente", "indicado para"],
      [
        "dolor",
        "molestia",
        "malestar",
        "síntoma",
        "fiebre",
        "tos",
        "náusea",
        "mareo",
        "fatiga",
        "cefalea",
        "inflamación",
        "digestión",
        "estrés",
        "ansiedad",
        "insomnio",
      ]
    ),

    diagnosis: extractWithContext(
      text,
      ["diagnóstico", "impresión", "cuadro", "patología", "enfermedad", "indicaciones"],
      [
        "diabetes",
        "hipertensión",
        "gastritis",
        "bronquitis",
        "neumonía",
        "alergia",
        "infección",
        "inflamación",
        "digestivo",
        "respiratorio",
        "nervioso",
        "circulatorio",
      ]
    ),

    medications: extractWithContext(
      text,
      [
        "medicamento",
        "fármaco",
        "prescripción",
        "receta",
        "tratamiento",
        "planta",
        "hierba",
        "preparación",
      ],
      [
        "mg",
        "ml",
        "comprimido",
        "cápsula",
        "jarabe",
        "inyección",
        "cada",
        "horas",
        "días",
        "infusión",
        "tintura",
        "extracto",
        "decocción",
      ]
    ),

    vitalSigns: extractVitalSigns(text),

    allergies: extractWithContext(
      text,
      ["alergia", "alérgico", "intolerancia", "reacción", "contraindicaciones"],
      ["penicilina", "aspirina", "látex", "mariscos", "nueces", "polen", "plantas"]
    ),

    medicalHistory: extractWithContext(
      text,
      ["antecedente", "historia", "previo", "familiar", "tradicional", "usos"],
      ["diabetes", "hipertensión", "cáncer", "cardíaco", "quirúrgico", "medicinal"]
    ),

    recommendations: extractWithContext(
      text,
      ["recomendación", "indicación", "consejo", "debe", "uso", "aplicación"],
      ["reposo", "dieta", "ejercicio", "control", "seguimiento", "preparación", "dosificación"]
    ),

    warningSigns: extractWithContext(
      text,
      ["alerta", "urgencia", "emergencia", "grave", "peligro", "precaución"],
      ["dificultad", "dolor", "sangrado", "fiebre", "pérdida", "toxicidad", "efectos secundarios"]
    ),

    patientInfo: extractPatientInfo(text),
  };

  logger.info("\nResultados de extracción:");
  Object.entries(result).forEach(([key, value]) => {
    logger.info(`${key}: ${value.length} elementos encontrados`);
  });
  logger.info("========================\n");

  return result;
}

// Validación médica mejorada
export function isValidMedicalCase(medicalInfo: MedicalInfo): boolean {
  const allContent = [
    ...medicalInfo.symptoms,
    ...medicalInfo.diagnosis,
    ...medicalInfo.medications,
    ...medicalInfo.medicalHistory,
  ]
    .join(" ")
    .toLowerCase();

  // Criterios de validación más estrictos
  const medicalKeywords = [
    "paciente",
    "síntoma",
    "diagnóstico",
    "tratamiento",
    "medicamento",
    "dolor",
    "fiebre",
    "tos",
    "presión",
    "corazón",
    "respiración",
    "consulta",
    "examen",
    "análisis",
    "receta",
    "prescripción",
  ];

  const keywordCount = medicalKeywords.filter((keyword) => allContent.includes(keyword)).length;

  // Debe tener al menos 3 palabras clave médicas
  const hasMinKeywords = keywordCount >= 3;

  // Debe tener al menos una sección con contenido
  const hasContent = Object.values(medicalInfo).some(
    (section) => Array.isArray(section) && section.length > 0
  );

  // No debe ser muy corto
  const hasMinLength = allContent.length > 100;

  // No debe ser contenido histórico
  const isNotHistorical =
    !allContent.includes("siglo") &&
    !allContent.includes("a.c.") &&
    !allContent.includes("historia de la medicina");

  return hasMinKeywords && hasContent && hasMinLength && isNotHistorical;
}

// Función para generar el prompt de entrenamiento
export function generateTrainingPrompt(medicalInfo: MedicalInfo): string {
  // Primero validar si el contenido parece ser un caso médico real
  const allContent = [
    ...medicalInfo.symptoms,
    ...medicalInfo.diagnosis,
    ...medicalInfo.medications,
    ...medicalInfo.medicalHistory,
    ...medicalInfo.recommendations,
    ...medicalInfo.warningSigns,
  ].join(" ");

  if (!isValidMedicalCase(medicalInfo)) {
    logger.info("Contenido no válido:", allContent.substring(0, 100) + "...");
    return "";
  }

  const sections = [
    {
      title: "CHIEF COMPLAINT",
      content: medicalInfo.symptoms,
    },
    {
      title: "PAST MEDICAL HISTORY",
      content: medicalInfo.medicalHistory,
    },
    {
      title: "MEDICATIONS",
      content: medicalInfo.medications,
    },
    {
      title: "PHYSICAL EXAMINATION",
      content: medicalInfo.symptoms,
    },
    {
      title: "MEDICAL DECISION MAKING",
      content: medicalInfo.recommendations,
    },
  ];

  // Filtrar secciones que tienen contenido
  const validSections = sections.filter((section) => section.content.length > 0);

  if (validSections.length === 0) {
    return "";
  }

  // Generar el texto estructurado
  const structuredText = validSections
    .map((section) => {
      const items = section.content.map((item) => `  ${item}`).join("\n");
      return `${section.title}:,\n${items}`;
    })
    .join("\n\n");

  return structuredText;
}
