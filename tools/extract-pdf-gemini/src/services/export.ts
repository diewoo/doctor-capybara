import fs from "fs";
import path from "path";
import type { TrainingExample, QualityMetrics } from "../types";
import { logger } from "../config";
import { extractAdvancedMedicalInfo } from "./medical-extractor";
import { generateTrainingPrompt } from "./medical-extractor";

// Guardar resultados en JSONL mejorado
export function saveAdvancedJSONL(
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

// Función para guardar resultados en JSONL para Gemini
export function saveToJSONL(texts: string[], outputPath: string) {
  const jsonlContent = texts
    .map((text) => {
      const medicalInfo = extractAdvancedMedicalInfo(text);

      // Mostrar el contenido extraído
      logger.info("\n=== Contenido Extraído ===");
      logger.info("Texto original:", text.substring(0, 200) + "...");
      logger.info("\nInformación médica extraída:");
      logger.info("Síntomas:", medicalInfo.symptoms);
      logger.info("Diagnóstico:", medicalInfo.diagnosis);
      logger.info("Medicamentos:", medicalInfo.medications);
      logger.info("Signos vitales:", medicalInfo.vitalSigns);
      logger.info("Alergias:", medicalInfo.allergies);
      logger.info("Historia médica:", medicalInfo.medicalHistory);
      logger.info("Recomendaciones:", medicalInfo.recommendations);
      logger.info("Signos de advertencia:", medicalInfo.warningSigns);
      logger.info("Información del paciente:", medicalInfo.patientInfo);
      logger.info("========================\n");

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
