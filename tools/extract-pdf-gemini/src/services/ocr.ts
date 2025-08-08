import { createWorker } from "tesseract.js";
import { LANG, logger, TEMP_DIR } from "../config";
import fs from "fs";
import path from "path";
import { saveToJSONL } from "./export";

// Procesar imagen con OCR
export async function processImageWithOCR(imagePath: string): Promise<string> {
  let worker = null;
  let lastProgress = 0;
  try {
    logger.info(`Iniciando OCR para: ${imagePath}`);

    // Inicializar el worker con configuración específica
    worker = await createWorker({
      logger: (m) => {
        // Solo mostrar progreso cuando cambie significativamente
        if (m.status === "recognizing text" && m.progress) {
          const progress = Math.floor(m.progress * 100);
          if (progress > lastProgress + 9) {
            // Mostrar cada 10%
            logger.info(`Progreso OCR: ${progress}%`);
            lastProgress = progress;
          }
        }
      },
      errorHandler: (err) => logger.error("Error en worker:", err),
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
    logger.error(`Error en OCR para ${imagePath}:`, error);
    throw error;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        logger.error("Error al terminar worker:", error);
      }
    }
  }
}

// Procesamiento paralelo con límite de concurrencia
export async function processImagesInParallel(imageFiles: string[]): Promise<string[]> {
  const results: string[] = [];
  const chunkSize = 4; // MAX_WORKERS

  for (let i = 0; i < imageFiles.length; i += chunkSize) {
    const chunk = imageFiles.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (imagePath) => {
      try {
        return await processImageWithOCR(imagePath);
      } catch (error) {
        logger.error(`Error procesando ${imagePath}:`, error);
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

// Procesamiento de imágenes existentes
export async function processExistingImages(
  startPage: number = 1,
  endPage: number = 0
): Promise<void> {
  const allFiles = fs.readdirSync(TEMP_DIR);
  logger.info(`Archivos encontrados: ${allFiles.length}`);
  logger.info("Primeros 5 archivos:", allFiles.slice(0, 5));

  const validFiles = allFiles
    .filter((file) => {
      const matches = file.match(/^page-%d-\d+\.png$/);
      if (!matches) {
        logger.debug(`Archivo no coincide con el patrón: ${file}`);
      }
      return matches;
    })
    .map((file) => path.join(TEMP_DIR, file))
    .sort((a, b) => {
      // Extract the number after the last hyphen
      const numA = parseInt(path.basename(a).split("-").pop()?.replace(".png", "") || "0");
      const numB = parseInt(path.basename(b).split("-").pop()?.replace(".png", "") || "0");
      return numA - numB;
    });

  logger.info(`Archivos válidos encontrados: ${validFiles.length}`);
  if (validFiles.length > 0) {
    logger.info(
      "Primeros 5 archivos válidos:",
      validFiles.slice(0, 5).map((f) => path.basename(f))
    );
  }

  const filteredFiles =
    endPage > 0
      ? validFiles.filter((file) => {
          // Extract the number after the last hyphen
          const pageNum = parseInt(
            path.basename(file).split("-").pop()?.replace(".png", "") || "0"
          );
          logger.debug(`Evaluando archivo ${path.basename(file)}: número de página ${pageNum}`);
          return pageNum >= startPage && pageNum <= endPage;
        })
      : validFiles;

  logger.info(`Archivos filtrados por rango: ${filteredFiles.length}`);
  if (filteredFiles.length > 0) {
    logger.info(
      "Primeros 5 archivos filtrados:",
      filteredFiles.slice(0, 5).map((f) => path.basename(f))
    );
  }

  if (filteredFiles.length === 0) {
    throw new Error("No se encontraron imágenes válidas para procesar");
  }

  const allTexts = await processImagesInParallel(filteredFiles);
  const outputPath = path.join(__dirname, "../../ocr_results.jsonl");
  saveToJSONL(allTexts, outputPath);
}
