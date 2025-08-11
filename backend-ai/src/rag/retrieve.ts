import * as pg from 'pg';
import * as dotenv from 'dotenv';
import { EmbeddingService } from './embedding-service';
import { embedQuery as embedQueryLegacy } from './embed';
import { embedQuerySimple } from './embed-simple';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });
const embeddingService = new EmbeddingService();

export type Retrieved = {
  id: string;
  text: string;
  source: string;
  year: number;
  category?: string;
  categoria?: string;
  symptom?: string;
  sintoma?: string;
};

// Función para detectar categoría médica de la consulta
function detectMedicalCategory(userQuery: string): string | null {
  const queryLower = userQuery.toLowerCase();

  const medicalCategories = [
    'fiebre',
    'fever',
    'temperatura',
    'temperature',
    'dolor',
    'pain',
    'ache',
    'hurt',
    'tos',
    'cough',
    'toser',
    'dolor de cabeza',
    'headache',
    'migraña',
    'migraine',
    'náusea',
    'nausea',
    'nauseous',
    'vómito',
    'vomit',
    'vomiting',
    'diarrea',
    'diarrhea',
    'diarrhoea',
    'fatiga',
    'fatigue',
    'cansancio',
    'tired',
    'ansiedad',
    'anxiety',
    'nervioso',
    'nervous',
    'depresión',
    'depression',
    'triste',
    'sad',
    'insomnio',
    'insomnia',
    'no puedo dormir',
    "can't sleep",
    'alergia',
    'allergy',
    'alérgico',
    'allergic',
    'asma',
    'asthma',
    'respirar',
    'breathing',
    'diabetes',
    'azúcar',
    'sugar',
    'hipertensión',
    'hypertension',
    'presión',
    'pressure',
  ];

  return medicalCategories.find((cat) => queryLower.includes(cat)) || null;
}

export async function retrieveContext(
  userQuery: string,
  language: 'Español' | 'English',
  topK = 10, // Aumentado para tener más opciones
): Promise<Retrieved[]> {
  let vec: number[];

  try {
    // Prefer worker-based embeddings (ESM-safe)
    vec = await embeddingService.embed(userQuery);
  } catch (workerError) {
    console.error('Error embedding query with worker:', workerError);
    try {
      // Fallback to legacy (dynamic import path) if available
      vec = await embedQueryLegacy(userQuery);
    } catch (legacyError) {
      console.error('Error embedding query with legacy method:', legacyError);
      // Last resort fallback (lower quality)
      vec = embedQuerySimple(userQuery);
    }
  }

  // Convert array to PostgreSQL vector format
  const vectorString = `[${vec.join(',')}]`;

  // Detectar categoría médica si existe
  const detectedCategory = detectMedicalCategory(userQuery);

  let sql: string;
  let params: any[];

  if (detectedCategory) {
    // Consulta híbrida: filtrado por categoría + similitud vectorial
    sql = `
      SELECT id, text, source, year, category, categoria, symptom, sintoma
      FROM docs
      WHERE language = $1
        AND (
          LOWER(category) LIKE $2 
          OR LOWER(categoria) LIKE $2
          OR LOWER(symptom) LIKE $2
          OR LOWER(sintoma) LIKE $2
          OR LOWER(text) LIKE $2
        )
      ORDER BY embedding <#> $3::vector
      LIMIT $4
    `;
    params = [language, `%${detectedCategory}%`, vectorString, topK];

    console.log(
      `🔍 RAG inteligente: Filtrado por categoría "${detectedCategory}" + similitud vectorial`,
    );
  } else {
    // Consulta tradicional: solo similitud vectorial
    sql = `
      SELECT id, text, source, year, category, categoria, symptom, sintoma
      FROM docs
      WHERE language = $1
      ORDER BY embedding <#> $2::vector
      LIMIT $3
    `;
    params = [language, vectorString, topK];

    console.log(`🔍 RAG tradicional: Solo similitud vectorial`);
  }

  const { rows } = await pool.query(sql, params);

  // Log para debugging
  if (rows.length > 0) {
    console.log(`📚 Documentos recuperados: ${rows.length}`);
    console.log(`📋 Primer documento: ${rows[0].text.substring(0, 100)}...`);
  }

  return rows as Retrieved[];
}
