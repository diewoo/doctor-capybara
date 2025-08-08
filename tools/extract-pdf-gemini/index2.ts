import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";
import { exec } from "child_process";
import { promisify } from "util";
import process from "process";
import crypto from "crypto";
import winston from "winston";

const execAsync = promisify(exec);

// Configuración
const TEMP_DIR = path.join(__dirname, "temp");
const CACHE_DIR = path.join(__dirname, "cache");
const DPI = 300;
const LANG = "spa"; // Idioma para OCR (español)
const MAX_WORKERS = 4;
const MAX_RETRIES = 3;

// Configurar logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: "medical-ocr.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Interfaces
interface MedicalInfo {
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

interface QualityMetrics {
  completeness: number;
  medicalRelevance: number;
  readability: number;
  dataBalance: { [specialty: string]: number };
  totalCases: number;
  validCases: number;
}

interface ProcessingMetrics {
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  averageProcessingTime: number;
  startTime: Date;
  endTime?: Date;
  medicalCasesFound: number;
}

interface TrainingExample {
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

// Cache para resultados OCR
const ocrCache = new Map<string, string>();

// Asegurar que los directorios existen
[TEMP_DIR, CACHE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Función para obtener hash de archivo
async function getFileHash(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

// Preprocesamiento de imagen para mejor OCR
async function preprocessImage(imagePath: string): Promise<string> {
  try {
    const outputPath = imagePath.replace(".png", "_processed.png");

    // Mejorar calidad de imagen para OCR
    await execAsync(
      `convert "${imagePath}" -enhance -sharpen 0x1 -contrast-stretch 0.15x0.05% "${outputPath}"`
    );

    return outputPath;
  } catch (error) {
    logger.warn(`Error en preprocesamiento de ${imagePath}, usando original`);
    return imagePath;
  }
}

// Convertir PDF a imágenes usando poppler
async function convertPDFToImages(pdfPath: string): Promise<string[]> {
  try {
    console.log("Convirtiendo PDF a imágenes...");
    const outputPattern = path.join(TEMP_DIR, "page-%d.png");

    // Usar pdftoppm para convertir PDF a imágenes
    await execAsync(`pdftoppm -png -r ${DPI} "${pdfPath}" "${outputPattern.replace(".png", "")}"`);

    // Obtener lista de archivos generados
    const files = fs
      .readdirSync(TEMP_DIR)
      .filter((file) => file.startsWith("page-") && file.endsWith(".png"))
      .sort((a, b) => {
        const numA = parseInt(path.basename(a).replace("page-", "").replace(".png", ""));
        const numB = parseInt(path.basename(b).replace("page-", "").replace(".png", ""));
        return numA - numB;
      })
      .map((file) => path.join(TEMP_DIR, file));

    console.log(`Se generaron ${files.length} imágenes`);
    return files;
  } catch (error) {
    console.error("Error al convertir PDF a imágenes:", error);
    throw error;
  }
}

// Procesar imagen con OCR
async function processImageWithOCR(imagePath: string): Promise<string> {
  let worker = null;
  let lastProgress = 0;
  try {
    console.log(`Iniciando OCR para: ${path.basename(imagePath)}`);

    // Inicializar el worker con configuración específica
    worker = await createWorker({
      logger: (m) => {
        // Solo mostrar progreso cuando cambie significativamente
        if (m.status === "recognizing text" && m.progress) {
          const progress = Math.floor(m.progress * 100);
          if (progress > lastProgress + 9) {
            // Mostrar cada 10%
            console.log(`Progreso OCR: ${progress}%`);
            lastProgress = progress;
          }
        }
      },
      errorHandler: (err) => console.error("Error en worker:", err),
    });

    // Cargar el idioma
    await worker.loadLanguage(LANG);
    await worker.initialize(LANG);

    // Procesar la imagen
    const {
      data: { text },
    } = await worker.recognize(imagePath);

    return text;
  } catch (error) {
    console.error(`Error en OCR para ${path.basename(imagePath)}:`, error);
    throw error;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error("Error al terminar worker:", error);
      }
    }
  }
}

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

// Extracción de información médica avanzada
function extractAdvancedMedicalInfo(text: string): MedicalInfo {
  const normalizedText = text.toLowerCase();

  console.log("\n=== Proceso de Extracción ===");
  console.log("Longitud del texto:", text.length);
  console.log("Primeras 100 caracteres:", text.substring(0, 100));

  const result = {
    symptoms: extractWithContext(
      text,
      ["presenta", "refiere", "aqueja", "manifiesta", "dolor", "siente"],
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
      ]
    ),

    diagnosis: extractWithContext(
      text,
      ["diagnóstico", "impresión", "cuadro", "patología", "enfermedad"],
      ["diabetes", "hipertensión", "gastritis", "bronquitis", "neumonía", "alergia", "infección"]
    ),

    medications: extractWithContext(
      text,
      ["medicamento", "fármaco", "prescripción", "receta", "tratamiento"],
      ["mg", "ml", "comprimido", "cápsula", "jarabe", "inyección", "cada", "horas", "días"]
    ),

    vitalSigns: extractVitalSigns(text),

    allergies: extractWithContext(
      text,
      ["alergia", "alérgico", "intolerancia", "reacción"],
      ["penicilina", "aspirina", "látex", "mariscos", "nueces", "polen"]
    ),

    medicalHistory: extractWithContext(
      text,
      ["antecedente", "historia", "previo", "familiar"],
      ["diabetes", "hipertensión", "cáncer", "cardíaco", "quirúrgico"]
    ),

    recommendations: extractWithContext(
      text,
      ["recomendación", "indicación", "consejo", "debe"],
      ["reposo", "dieta", "ejercicio", "control", "seguimiento"]
    ),

    warningSigns: extractWithContext(
      text,
      ["alerta", "urgencia", "emergencia", "grave", "peligro"],
      ["dificultad", "dolor", "sangrado", "fiebre", "pérdida"]
    ),

    patientInfo: extractPatientInfo(text),
  };

  console.log("\nResultados de extracción:");
  Object.entries(result).forEach(([key, value]) => {
    console.log(`${key}: ${value.length} elementos encontrados`);
  });
  console.log("========================\n");

  return result;
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

// Validación médica mejorada
function isValidMedicalCase(medicalInfo: MedicalInfo): boolean {
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

// Determinación de especialidad médica mejorada
function determineMedicalSpecialty(medicalInfo: MedicalInfo): string {
  const specialties = {
    Cardiología: [
      "corazón",
      "cardíaco",
      "presión arterial",
      "hipertensión",
      "arritmia",
      "infarto",
      "angina",
      "palpitaciones",
      "electrocardiograma",
      "ecg",
    ],
    Neumología: [
      "respiratorio",
      "pulmón",
      "bronquitis",
      "neumonía",
      "tos",
      "asma",
      "disnea",
      "esputo",
      "radiografía",
      "oxígeno",
    ],
    Gastroenterología: [
      "estómago",
      "digestivo",
      "intestino",
      "gastritis",
      "úlcera",
      "náusea",
      "vómito",
      "diarrea",
      "estreñimiento",
      "abdomen",
    ],
    Neurología: [
      "cerebro",
      "nervioso",
      "migraña",
      "convulsión",
      "epilepsia",
      "cefalea",
      "mareo",
      "vértigo",
      "parálisis",
      "neurológico",
    ],
    Dermatología: [
      "piel",
      "dermatológico",
      "erupción",
      "acné",
      "eczema",
      "psoriasis",
      "dermatitis",
      "lesión",
      "mancha",
      "picazón",
    ],
    Endocrinología: [
      "diabetes",
      "tiroides",
      "hormona",
      "glucosa",
      "insulina",
      "endocrino",
      "metabolismo",
      "obesidad",
      "colesterol",
      "triglicéridos",
    ],
    Oftalmología: [
      "ojo",
      "vista",
      "visión",
      "oftálmico",
      "catarata",
      "glaucoma",
      "miopía",
      "astigmatismo",
      "retina",
      "conjuntivitis",
    ],
    Otorrinolaringología: [
      "oído",
      "nariz",
      "garganta",
      "otitis",
      "sinusitis",
      "amigdalitis",
      "faringitis",
      "laringitis",
      "rinitis",
      "audición",
    ],
    Ginecología: [
      "ginecológico",
      "útero",
      "ovario",
      "menstruación",
      "embarazo",
      "parto",
      "cesárea",
      "anticonceptivo",
      "citología",
      "mamografía",
    ],
    Pediatría: [
      "niño",
      "niña",
      "pediátrico",
      "infantil",
      "desarrollo",
      "crecimiento",
      "vacuna",
      "lactancia",
      "adolescente",
      "recién nacido",
    ],
    Psiquiatría: [
      "depresión",
      "ansiedad",
      "psiquiátrico",
      "mental",
      "estrés",
      "psicológico",
      "antidepresivo",
      "trastorno",
      "psicosis",
      "bipolar",
    ],
    Traumatología: [
      "fractura",
      "hueso",
      "articulación",
      "trauma",
      "lesión",
      "esguince",
      "luxación",
      "ortopédico",
      "yeso",
      "rehabilitación",
    ],
  };

  const scores: { [key: string]: number } = {};
  const allText = JSON.stringify(medicalInfo).toLowerCase();

  // Calcular puntuaciones por especialidad
  Object.entries(specialties).forEach(([specialty, keywords]) => {
    scores[specialty] = keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      const matches = allText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  });

  // Encontrar la especialidad con mayor puntuación
  const maxScore = Math.max(...Object.values(scores));
  const bestSpecialty = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];

  return maxScore > 0 ? bestSpecialty! : "Medicina General";
}

// Generación de ejemplos de entrenamiento avanzados
function generateAdvancedTrainingExamples(
  medicalInfo: MedicalInfo,
  specialty: string
): TrainingExample[] {
  const examples: TrainingExample[] = [];

  // Tarea 1: Clasificación de especialidad
  const classificationPrompt = `
CASO CLÍNICO:
Síntomas: ${medicalInfo.symptoms.join(", ")}
Diagnóstico: ${medicalInfo.diagnosis.join(", ")}
Medicamentos: ${medicalInfo.medications.join(", ")}

¿A qué especialidad médica corresponde este caso?
  `.trim();

  examples.push({
    messages: [
      { role: "user", content: classificationPrompt },
      { role: "assistant", content: specialty },
    ],
    metadata: {
      specialty,
      confidence: 0.9,
      taskType: "classification",
    },
  });

  // Tarea 2: Extracción de síntomas
  if (medicalInfo.symptoms.length > 0) {
    examples.push({
      messages: [
        {
          role: "user",
          content: `Extrae los síntomas principales de este caso médico:\n\n${medicalInfo.symptoms.join(
            "\n"
          )}`,
        },
        {
          role: "assistant",
          content: `Síntomas principales identificados:\n${medicalInfo.symptoms
            .map((s) => `• ${s}`)
            .join("\n")}`,
        },
      ],
      metadata: {
        specialty,
        confidence: 0.8,
        taskType: "symptom_extraction",
      },
    });
  }

  // Tarea 3: Recomendaciones de tratamiento
  if (medicalInfo.recommendations.length > 0) {
    examples.push({
      messages: [
        {
          role: "user",
          content: `Basándose en este caso, ¿cuáles son las recomendaciones de tratamiento?\n\nCaso: ${medicalInfo.recommendations.join(
            " "
          )}`,
        },
        {
          role: "assistant",
          content: `Recomendaciones de tratamiento:\n${medicalInfo.recommendations
            .map((r) => `• ${r}`)
            .join("\n")}`,
        },
      ],
      metadata: {
        specialty,
        confidence: 0.8,
        taskType: "treatment_recommendation",
      },
    });
  }

  return examples.filter(
    (example) => example.messages[0].content.length > 50 && example.messages[1].content.length > 20
  );
}

// Validación de calidad del dataset
function validateDatasetQuality(
  allCases: { medicalInfo: MedicalInfo; specialty: string }[]
): QualityMetrics {
  const metrics: QualityMetrics = {
    completeness: 0,
    medicalRelevance: 0,
    readability: 0,
    dataBalance: {},
    totalCases: allCases.length,
    validCases: 0,
  };

  let totalCompleteness = 0;
  let totalRelevance = 0;

  allCases.forEach(({ medicalInfo, specialty }) => {
    // Calcular completeness
    const sections = [
      medicalInfo.symptoms,
      medicalInfo.diagnosis,
      medicalInfo.medications,
      medicalInfo.recommendations,
    ];
    const completeness = sections.filter((s) => s.length > 0).length / sections.length;
    totalCompleteness += completeness;

    // Calcular relevancia médica
    const relevance = isValidMedicalCase(medicalInfo) ? 1 : 0;
    totalRelevance += relevance;

    if (relevance > 0) {
      metrics.validCases++;
    }

    // Balance por especialidad
    metrics.dataBalance[specialty] = (metrics.dataBalance[specialty] || 0) + 1;
  });

  metrics.completeness = totalCompleteness / allCases.length;
  metrics.medicalRelevance = totalRelevance / allCases.length;
  metrics.readability = 0.8; // Placeholder - podría implementarse con métricas de legibilidad

  return metrics;
}

// Balanceo inteligente del dataset
function balanceDataset(
  allCases: { medicalInfo: MedicalInfo; specialty: string; examples: TrainingExample[] }[]
): TrainingExample[] {
  const specialtyGroups = allCases.reduce((groups, caseItem) => {
    const { specialty, examples } = caseItem;
    if (!groups[specialty]) {
      groups[specialty] = [];
    }
    groups[specialty].push(...examples);
    return groups;
  }, {} as { [key: string]: TrainingExample[] });

  // Encontrar el tamaño objetivo (promedio de las especialidades más representadas)
  const counts = Object.values(specialtyGroups).map((group) => group.length);
  const targetSize = Math.floor(
    counts
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((a, b) => a + b, 0) / 3
  );

  const balancedExamples: TrainingExample[] = [];

  Object.entries(specialtyGroups).forEach(([specialty, examples]) => {
    if (examples.length >= targetSize) {
      // Sampling estratificado para especialidades sobre-representadas
      const sampledExamples = examples.sort(() => Math.random() - 0.5).slice(0, targetSize);
      balancedExamples.push(...sampledExamples);
    } else {
      // Incluir todos los ejemplos de especialidades sub-representadas
      balancedExamples.push(...examples);

      // Data augmentation básica (duplicar con variaciones menores)
      const needed = Math.min(targetSize - examples.length, examples.length);
      for (let i = 0; i < needed; i++) {
        const original = examples[i % examples.length];
        const augmented = {
          ...original,
          messages: original.messages.map((msg) => ({
            ...msg,
            content: msg.content + (Math.random() > 0.5 ? " (caso similar)" : " (variante)"),
          })),
        };
        balancedExamples.push(augmented);
      }
    }
  });

  logger.info(`Dataset balanceado: ${balancedExamples.length} ejemplos`);
  return balancedExamples;
}

// Guardar resultados en JSONL mejorado
function saveAdvancedJSONL(
  examples: TrainingExample[],
  outputPath: string,
  metrics: QualityMetrics
) {
  const jsonlContent = examples.map((example) => JSON.stringify(example)).join("\n");

  fs.writeFileSync(outputPath, jsonlContent);

  // Guardar métricas por separado
  const metricsPath = outputPath.replace(".jsonl", "_metrics.json");
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  logger.info(`Dataset JSONL guardado: ${outputPath}`);
  logger.info(`Métricas guardadas: ${metricsPath}`);
  logger.info(`Total de ejemplos: ${examples.length}`);
}

// Procesamiento paralelo con límite de concurrencia
async function processImagesInParallel(imageFiles: string[]): Promise<string[]> {
  const results: string[] = [];
  const chunkSize = MAX_WORKERS;

  for (let i = 0; i < imageFiles.length; i += chunkSize) {
    const chunk = imageFiles.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (imagePath) => {
      try {
        return await processImageWithOCR(imagePath);
      } catch (error) {
        logger.error(`Error procesando ${path.basename(imagePath)}:`, error);
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...(chunkResults.filter(Boolean) as string[]));

    logger.info(
      `Procesado chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(imageFiles.length / chunkSize)}`
    );
  }

  return results;
}

// Procesamiento de imágenes existentes mejorado
async function processExistingImages(startPage: number = 1, endPage: number = 0): Promise<void> {
  const metrics: ProcessingMetrics = {
    totalPages: 0,
    successfulPages: 0,
    failedPages: 0,
    averageProcessingTime: 0,
    startTime: new Date(),
    medicalCasesFound: 0,
  };

  try {
    const allFiles = fs.readdirSync(TEMP_DIR);
    logger.info(`Archivos encontrados: ${allFiles.length}`);

    // Filtrar y validar archivos
    const validFiles = allFiles
      .filter((file) => file.match(/^page-%d-\d+\.png$/) || file.match(/^page-\d+\.png$/))
      .map((file) => path.join(TEMP_DIR, file))
      .filter((fullPath) => {
        try {
          const stats = fs.statSync(fullPath);
          return stats.size > 1000; // Filtrar archivos muy pequeños
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const numA = parseInt(path.basename(a).match(/\d+/)?.[0] || "0");
        const numB = parseInt(path.basename(b).match(/\d+/)?.[0] || "0");
        return numA - numB;
      });

    // Aplicar filtro de páginas si se especificó
    const filteredFiles =
      endPage > 0
        ? validFiles.filter((file) => {
            const pageNum = parseInt(path.basename(file).match(/\d+/)?.[0] || "0");
            return pageNum >= startPage && pageNum <= endPage;
          })
        : validFiles;

    metrics.totalPages = filteredFiles.length;

    if (metrics.totalPages === 0) {
      throw new Error("No se encontraron imágenes válidas para procesar");
    }

    logger.info(`Procesando ${metrics.totalPages} imágenes...`);

    // Procesar imágenes en paralelo
    const startTime = Date.now();
    const allTexts = await processImagesInParallel(filteredFiles);
    const endTime = Date.now();

    metrics.successfulPages = allTexts.length;
    metrics.failedPages = metrics.totalPages - metrics.successfulPages;
    metrics.averageProcessingTime = (endTime - startTime) / metrics.totalPages;
    metrics.endTime = new Date();

    logger.info(
      `Procesamiento completado. Éxito: ${metrics.successfulPages}, Fallos: ${metrics.failedPages}`
    );

    // Procesar información médica
    const medicalCases = allTexts
      .map((text) => {
        const medicalInfo = extractAdvancedMedicalInfo(text);
        return { text, medicalInfo };
      })
      .filter(({ medicalInfo }) => isValidMedicalCase(medicalInfo))
      .map(({ medicalInfo }) => {
        const specialty = determineMedicalSpecialty(medicalInfo);
        return { medicalInfo, specialty };
      });

    // Validación de calidad del dataset
    const qualityMetrics = validateDatasetQuality(medicalCases);

    // Guardar resultados
    const outputPath = path.join(__dirname, "ocr_results.jsonl");
    saveToJSONL(allTexts, outputPath);

    // Guardar métricas
    const metricsPath = outputPath.replace(".jsonl", "_metrics.json");
    fs.writeFileSync(metricsPath, JSON.stringify(qualityMetrics, null, 2));

    logger.info(`Métricas guardadas: ${metricsPath}`);
  } catch (error) {
    logger.error("Error en el proceso de procesamiento de imágenes existentes:", error);
  }
}

// Función para guardar resultados en JSONL para Gemini
function saveToJSONL(texts: string[], outputPath: string) {
  const jsonlContent = texts
    .map((text) => {
      const medicalInfo = extractAdvancedMedicalInfo(text);

      // Mostrar el contenido extraído
      console.log("\n=== Contenido Extraído ===");
      console.log("Texto original:", text.substring(0, 200) + "...");
      console.log("\nInformación médica extraída:");
      console.log("Síntomas:", medicalInfo.symptoms);
      console.log("Diagnóstico:", medicalInfo.diagnosis);
      console.log("Medicamentos:", medicalInfo.medications);
      console.log("Signos vitales:", medicalInfo.vitalSigns);
      console.log("Alergias:", medicalInfo.allergies);
      console.log("Historia médica:", medicalInfo.medicalHistory);
      console.log("Recomendaciones:", medicalInfo.recommendations);
      console.log("Signos de advertencia:", medicalInfo.warningSigns);
      console.log("Información del paciente:", medicalInfo.patientInfo);
      console.log("========================\n");

      const structuredText = generateTrainingPrompt(medicalInfo);

      // Solo incluir si hay información médica relevante, el texto no es muy largo
      // y es un caso médico válido
      if (!structuredText || structuredText.length > 1000) {
        return null;
      }

      // Crear el ejemplo de entrenamiento para Gemini
      const trainingExample = {
        messages: [
          {
            role: "user",
            content: `TRANSCRIPT: \n${structuredText}\n\n LABEL:`,
          },
          {
            role: "model",
            content: "Allergy / Immunology",
          },
        ],
      };

      return JSON.stringify(trainingExample);
    })
    .filter(Boolean) // Eliminar entradas nulas
    .join("\n");

  fs.writeFileSync(outputPath, jsonlContent);
  logger.info(`Resultados JSONL para Gemini guardados en: ${outputPath}`);
}

// Función para generar el prompt de entrenamiento
function generateTrainingPrompt(
  medicalInfo: ReturnType<typeof extractAdvancedMedicalInfo>
): string {
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

// Función principal
async function main() {
  try {
    const useExistingImages = process.argv.includes("--use-existing");
    const startPage = parseInt(
      process.argv.find((arg) => arg.startsWith("--start="))?.split("=")[1] || "1"
    );
    const endPage = parseInt(
      process.argv.find((arg) => arg.startsWith("--end="))?.split("=")[1] || "0"
    );

    if (useExistingImages) {
      logger.info("Usando imágenes existentes...");
      if (endPage > 0) {
        logger.info(`Procesando páginas del ${startPage} al ${endPage}`);
      }
      await processExistingImages(startPage, endPage);
    } else {
      const pdfPath = path.join(__dirname, "test", "data", "manual.pdf");
      logger.info(`Procesando nuevo PDF: ${pdfPath}`);

      // Convertir PDF a imágenes
      const imageFiles = await convertPDFToImages(pdfPath);

      // Procesar cada imagen con OCR
      const allText: string[] = [];
      for (const imageFile of imageFiles) {
        const text = await processImageWithOCR(imageFile);
        allText.push(text);
      }

      // Guardar resultados
      const outputPath = path.join(__dirname, "ocr_results.jsonl");
      saveToJSONL(allText, outputPath);
    }
  } catch (error) {
    logger.error("Error en el proceso principal:", error);
  }
}

// Ejecutar el programa
main();
