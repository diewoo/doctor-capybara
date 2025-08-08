import path from "path";
import { ensureDirectories, convertPDFToImages } from "./utils/pdf";
import { processImagesInParallel, processExistingImages } from "./services/ocr";
import { saveToJSONL } from "./services/export";
import { logger } from "./config";

async function main() {
  try {
    const useExistingImages = process.argv.includes("--use-existing");
    const startPage = parseInt(
      process.argv.find((arg) => arg.startsWith("--start="))?.split("=")[1] || "1"
    );
    const endPage = parseInt(
      process.argv.find((arg) => arg.startsWith("--end="))?.split("=")[1] || "0"
    );

    // Asegurar que los directorios existen
    ensureDirectories();

    if (useExistingImages) {
      logger.info("Usando imágenes existentes...");
      if (endPage > 0) {
        logger.info(`Procesando páginas del ${startPage} al ${endPage}`);
      }
      await processExistingImages(startPage, endPage);
    } else {
      const pdfPath = path.join(__dirname, "../test/data/manual.pdf");
      logger.info(`Procesando nuevo PDF: ${pdfPath}`);

      // Convertir PDF a imágenes
      const imageFiles = await convertPDFToImages(pdfPath);

      // Procesar cada imagen con OCR
      const allText = await processImagesInParallel(imageFiles);

      // Guardar resultados
      const outputPath = path.join(__dirname, "../ocr_results.jsonl");
      saveToJSONL(allText, outputPath);
    }
  } catch (error) {
    logger.error("Error en el proceso principal:", error);
  }
}

// Ejecutar el programa
main();
