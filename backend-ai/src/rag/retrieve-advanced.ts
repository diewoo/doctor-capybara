import * as pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });

export interface AdvancedFilters {
  category?: string[];
  year_range?: { min?: number; max?: number };
}

export interface RetrievedAdvanced {
  id: string;
  text: string;
  source: string;
  year: number;
  category: string;
  score: number;
}

/**
 * Búsqueda avanzada con filtros por metadatos
 */
export async function retrieveContextAdvanced(
  userQuery: string,
  language: 'Español' | 'English',
  filters?: AdvancedFilters,
  topK: number = 10,
): Promise<RetrievedAdvanced[]> {
  try {
    // Construir la consulta SQL dinámicamente
    let sql = `
      SELECT 
        id, text, source, year, 
        COALESCE(domain, 'general') as category,
        1.0 as score
      FROM docs
      WHERE language = $1
    `;

    const params: any[] = [language];
    let paramIndex = 2;

    // Agregar filtros de categoría
    if (filters?.category && filters.category.length > 0) {
      sql += ` AND domain = ANY($${paramIndex})`;
      params.push(filters.category);
      paramIndex++;
    }

    // Agregar filtros de año
    if (filters?.year_range) {
      if (filters.year_range.min) {
        sql += ` AND year >= $${paramIndex}`;
        params.push(filters.year_range.min);
        paramIndex++;
      }
      if (filters.year_range.max) {
        sql += ` AND year <= $${paramIndex}`;
        params.push(filters.year_range.max);
        paramIndex++;
      }
    }

    // Ordenar por relevancia (priorizar evidencia A, luego B, etc.)
    sql += `
      ORDER BY 
        year DESC
      LIMIT $${paramIndex}
    `;

    params.push(topK);

    console.log('🔍 Advanced RAG query:', sql);
    console.log('🔍 Parameters:', params);

    const { rows } = await pool.query(sql, params);

    console.log(
      `✅ Advanced RAG found ${rows.length} results for "${userQuery}" in ${language}`,
    );

    return rows as RetrievedAdvanced[];
  } catch (error) {
    console.error('Error in advanced RAG:', error);
    // Fallback: retornar array vacío
    return [];
  }
}

/**
 * Búsqueda inteligente que detecta idioma y busca en ambos idiomas
 */
export async function retrieveContextSmart(
  userQuery: string, // Query original del usuario
  topK: number = 10,
): Promise<RetrievedAdvanced[]> {
  console.log('🚀 retrieveContextSmart iniciado');
  console.log('🚀 Query original:', userQuery);
  console.log('🚀 TopK:', topK);

  // Detectar idioma de la consulta
  const detectedLanguage = detectLanguage(userQuery);
  console.log('🌍 Idioma detectado:', detectedLanguage);

  // Detectar categoría médica
  const detectedCategory = detectMedicalCategory(userQuery);
  console.log('🚀 Categoría detectada:', detectedCategory);

  // Crear filtros si detectamos categoría
  const filters: AdvancedFilters | undefined = detectedCategory
    ? {
        category: [detectedCategory],
        year_range: { min: 2020, max: 2023 }, // Assuming a recent year range for context
      }
    : undefined;

  console.log('🚀 Filtros aplicados:', filters);

  // Buscar primero en el idioma original del usuario
  let results = await retrieveContextAdvanced(
    userQuery,
    detectedLanguage,
    filters,
    Math.ceil(topK * 0.7), // 70% de resultados del idioma original
  );

  console.log(
    `✅ Encontrados ${results.length} resultados en ${detectedLanguage}`,
  );

  // Si no hay suficientes resultados, buscar en el otro idioma
  if (results.length < topK) {
    const otherLanguage =
      detectedLanguage === 'Español' ? 'English' : 'Español';
    const remainingCount = topK - results.length;

    console.log(
      `🔄 Buscando ${remainingCount} resultados adicionales en ${otherLanguage}`,
    );

    const otherResults = await retrieveContextAdvanced(
      userQuery,
      otherLanguage,
      filters,
      remainingCount,
    );

    console.log(
      `✅ Encontrados ${otherResults.length} resultados adicionales en ${otherLanguage}`,
    );

    // Combinar resultados, priorizando el idioma original
    results = [...results, ...otherResults];
  }

  console.log(`🎯 Total de resultados: ${results.length}`);
  return results;
}

/**
 * Detectar idioma de la consulta del usuario
 */
function detectLanguage(text: string): 'Español' | 'English' {
  const queryLower = text.toLowerCase();

  // Patrones típicos del español
  const spanishPattern = /[áéíóúñü]/i;
  const spanishWords = [
    'me',
    'te',
    'se',
    'le',
    'nos',
    'os',
    'les',
    'que',
    'de',
    'el',
    'la',
    'los',
    'las',
    'tengo',
    'tiene',
    'dolor',
    'duele',
    'problema',
    'síntoma',
    'enfermedad',
    'tratamiento',
  ];

  // Si tiene caracteres especiales del español o palabras comunes
  if (
    spanishPattern.test(text) ||
    spanishWords.some((word) => queryLower.includes(word))
  ) {
    return 'Español';
  }

  return 'English';
}

/**
 * Detectar categoría médica de la consulta usando las 3 categorías principales
 */
function detectMedicalCategory(userQuery: string): string | null {
  const queryLower = userQuery.toLowerCase();

  console.log('🔍 DEBUG: detectMedicalCategory iniciado');
  console.log('🔍 DEBUG: Query original:', userQuery);
  console.log('🔍 DEBUG: Query en minúsculas:', queryLower);

  // Solo las 3 categorías principales que me diste
  const medicalCategories = [
    // Natural Medicine / Medicina Natural
    {
      keywords: [
        'natural',
        'herbal',
        'plant',
        'tea',
        'essential oil',
        'aromatherapy',
        'natural',
        'herbal',
        'planta',
        'té',
        'aceite esencial',
        'aromaterapia',
        'chamomile',
        'ginger',
        'lavender',
        'peppermint',
        'arnica',
        'aloe',
        'manzanilla',
        'jengibre',
        'lavanda',
        'menta',
        'árnica',
        'sábila',
        'herbs',
        'supplements',
        'remedies',
        'hierbas',
        'suplementos',
        'remedios',
      ],
      category: 'Natural Medicine',
    },
    // Mental Health / Salud Mental
    {
      keywords: [
        'anxiety',
        'depression',
        'stress',
        'mental',
        'psychology',
        'mood',
        'ansiedad',
        'depresión',
        'estrés',
        'mental',
        'psicología',
        'ánimo',
        'meditation',
        'mindfulness',
        'therapy',
        'counseling',
        'meditación',
        'atención plena',
        'terapia',
        'consejería',
        'panic',
        'fear',
        'worry',
        'pánico',
        'miedo',
        'preocupación',
        'sleep',
        'insomnia',
        'sueño',
        'insomnio',
        'dormir',
      ],
      category: 'Mental Health',
    },
    // Wellness / Bienestar
    {
      keywords: [
        'wellness',
        'health',
        'fitness',
        'nutrition',
        'diet',
        'exercise',
        'bienestar',
        'salud',
        'fitness',
        'nutrición',
        'dieta',
        'ejercicio',
        'hydration',
        'lifestyle',
        'prevention',
        'prevención',
        'hidratación',
        'estilo de vida',
        'weight',
        'peso',
        'activity',
        'physical',
        'físico',
        'cardio',
        'strength',
        'fuerza',
        'flexibility',
      ],
      category: 'Wellness',
    },
  ];

  for (const { keywords, category } of medicalCategories) {
    console.log('🔍 DEBUG: Probando categoría:', category);
    console.log('🔍 DEBUG: Keywords:', keywords);

    const hasMatch = keywords.some((keyword) => queryLower.includes(keyword));
    console.log('🔍 DEBUG: ¿Hay match?', hasMatch);

    if (hasMatch) {
      console.log('🎯 DEBUG: ¡Categoría encontrada!', category);
      return category;
    }
  }

  console.log('❌ DEBUG: No se encontró ninguna categoría');
  return null;
}
