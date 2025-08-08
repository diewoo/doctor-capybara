import path from "path";
import winston from "winston";

// Configuración de directorios
export const TEMP_DIR = path.join(__dirname, "../../temp");
export const CACHE_DIR = path.join(__dirname, "../../cache");

// Configuración de OCR
export const DPI = 300;
export const LANG = "spa"; // Idioma para OCR (español)
export const MAX_WORKERS = 4;
export const MAX_RETRIES = 3;

// Configurar logging
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: "medical-ocr.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
