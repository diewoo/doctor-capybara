import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";

// Inicializar Gemini
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}
console.log(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function estimateTokens(text: string) {
  return Math.round(text.length / 4); // aproximación común
}

// Leer y dividir el PDF
async function extractTextFromPDF(filePath: string) {
  try {
    console.log("Leyendo PDF...");
    const dataBuffer = fs.readFileSync(filePath);

    // Configuración específica para pdf-parse
    const options = {
      max: 0, // Sin límite de páginas
      pagerender: function (pageData: any) {
        // Intentar extraer texto de la página
        return pageData.getTextContent().then(function (textContent: any) {
          let lastY,
            text = "";
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += "\n" + item.str;
            }
            lastY = item.transform[5];
          }
          return text;
        });
      },
    };

    const pdfData = await pdfParse(dataBuffer, options);

    console.log(`PDF cargado con ${pdfData.numpages} páginas`);
    console.log(`Longitud del texto extraído: ${pdfData.text.length} caracteres`);
    console.log("Primeros 200 caracteres:", pdfData.text.substring(0, 200));

    // Split and log intermediate steps
    const rawSplits = pdfData.text.split(/\n+/);
    console.log(`Número de splits: ${rawSplits.length}`);

    // Log a few sample splits
    console.log("Ejemplos de splits (primeros 3):", rawSplits.slice(0, 3));

    // Mejorar el filtrado de párrafos
    const paragraphs = rawSplits
      .map((p: string) => p.trim())
      .filter((p: string) => {
        // Filtrar líneas que son solo espacios o caracteres especiales
        const hasContent = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(p);
        return p.length > 0 && hasContent;
      });

    console.log(`Número de párrafos no vacíos: ${paragraphs.length}`);

    // Log a few sample paragraphs
    console.log("Ejemplos de párrafos (primeros 3):", paragraphs.slice(0, 3));

    const filteredParagraphs = paragraphs.filter((p: string) => p.length > 20 && p.length < 1000);

    console.log(`Número de párrafos después del filtrado: ${filteredParagraphs.length}`);

    // Estimar tokens para cada párrafo
    const totalTokens = filteredParagraphs.reduce((sum, p) => sum + estimateTokens(p), 0);
    console.log(`Estimación total de tokens: ${totalTokens}`);
    console.log(
      `Promedio de tokens por párrafo: ${Math.round(totalTokens / filteredParagraphs.length)}`
    );

    return filteredParagraphs;
  } catch (error) {
    console.error(`Error leyendo el archivo PDF en ${filePath}:`, error);
    throw error;
  }
}

// Preparar datos para Vertex AI fine-tuning usando Gemini
async function prepareVertexAIData(paragraphs: string[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const trainingData = [];

  console.log("Generando ejemplos de entrenamiento con Gemini...");

  for (let i = 0; i < paragraphs.length; i++) {
    try {
      const prompt = `Genera un ejemplo de entrenamiento en formato JSON para el siguiente texto. 
      El JSON debe tener exactamente dos campos:
      - input_text: el texto original
      - output_text: una respuesta útil y relevante basada en el texto
      
      Texto: ${paragraphs[i]}
      
      IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional, sin backticks, sin markdown.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();

      // Limpiar la respuesta de posibles caracteres no deseados
      const cleanResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/`/g, "")
        .trim();

      console.log("Respuesta de Gemini:", cleanResponse);

      const jsonResponse = JSON.parse(cleanResponse);

      // Validar que tenga los campos requeridos
      if (!jsonResponse.input_text || !jsonResponse.output_text) {
        throw new Error("Respuesta no contiene los campos requeridos");
      }

      trainingData.push(jsonResponse);

      if (i % 10 === 0) {
        console.log(`Procesados ${i} párrafos...`);
      }
    } catch (error) {
      console.error(`Error procesando párrafo ${i}:`, error);
      // Si hay error, usamos un formato básico
      trainingData.push({
        input_text: paragraphs[i],
        output_text: `Ejemplo de respuesta para el texto ${i + 1}`,
      });
    }
  }

  // Guardar en formato JSONL
  const outputPath = path.join(__dirname, "vertex_ai_training.jsonl");
  const outputStream = fs.createWriteStream(outputPath);

  for (const example of trainingData) {
    outputStream.write(JSON.stringify(example) + "\n");
  }

  outputStream.end();
  console.log(`✅ Datos de entrenamiento guardados en ${outputPath}`);
  return outputPath;
}

// Procesar texto con Gemini
async function processWithGemini(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Analiza el siguiente texto y proporciona un resumen conciso:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error al procesar con Gemini:", error);
    throw error;
  }
}

// Loop principal
async function main() {
  try {
    const pdfPath = path.join(__dirname, "test", "data", "cv.pdf");
    console.log(`Leyendo PDF desde: ${pdfPath}`);
    const paragraphs = await extractTextFromPDF(pdfPath);
    console.log(`Se leyeron exitosamente ${paragraphs.length} párrafos del PDF`);

    // Procesar los primeros 3 párrafos con Gemini como ejemplo
    console.log("\nProcesando párrafos con Gemini...");
    // for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
    //   console.log(`\nProcesando párrafo ${i + 1}:`);
    //   console.log("Texto original:", paragraphs[i].substring(0, 100) + "...");
    //   const analysis = await processWithGemini(paragraphs[i]);
    //   console.log("Análisis de Gemini:", analysis);
    // }

    // Preparar datos para Vertex AI
    const trainingDataPath = await prepareVertexAIData(paragraphs);
    console.log(`Datos de entrenamiento preparados en: ${trainingDataPath}`);
  } catch (error) {
    console.error("Error en la función main:", error);
  }
}

main();
