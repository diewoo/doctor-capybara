import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { TEMP_DIR, DPI, logger } from "../config";

const execAsync = promisify(exec);

// Asegurar que los directorios existen
export function ensureDirectories() {
  [TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Convertir PDF a imágenes usando poppler
export async function convertPDFToImages(pdfPath: string): Promise<string[]> {
  try {
    logger.info("Convirtiendo PDF a imágenes...");
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

    logger.info(`Se generaron ${files.length} imágenes`);
    return files;
  } catch (error) {
    logger.error("Error al convertir PDF a imágenes:", error);
    throw error;
  }
}

// Preprocesamiento de imagen para mejor OCR
export async function preprocessImage(imagePath: string): Promise<string> {
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
