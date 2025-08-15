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

// Configuración configurable del sistema RAG
export interface RAGConfig {
  thresholds: number[]; // Thresholds de similitud a probar
  defaultCategory: string; // Categoría por defecto
  defaultScore: number; // Score por defecto para fallback
  minThreshold: number; // Threshold mínimo absoluto
  maxThreshold: number; // Threshold máximo absoluto
}

// Configuración por defecto que se puede personalizar
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  thresholds: [0.6, 0.5, 0.4, 0.3], // Empezar alto, bajar gradualmente
  defaultCategory: 'general', // Categoría por defecto
  defaultScore: 0.0, // Score por defecto para fallback
  minThreshold: 0.3, // Threshold mínimo absoluto
  maxThreshold: 0.8, // Threshold máximo absoluto
};

/**
 * Interfaz para la respuesta de categorización de la IA
 */
export interface AIAnalysisResponse {
  translation: string;
  category: string;
  conditions: string[];
  relevance_score: number;
  language: 'Español' | 'English';
}

/**
 * Filtrado post-búsqueda inteligente usando similitud semántica
 * Evalúa si los documentos encontrados son realmente relevantes para la consulta
 * Ajusta dinámicamente el threshold basado en la distribución de similitudes
 */
async function filterBySemanticRelevance(
  results: RetrievedAdvanced[],
  userQuery: string,
  threshold: number = 0.5,
): Promise<RetrievedAdvanced[]> {
  if (results.length === 0) return results;

  console.log(
    '🔍 Iniciando filtrado post-búsqueda por relevancia semántica...',
  );
  console.log(`🔍 Threshold inicial: ${threshold}`);

  try {
    // Generar embedding de la consulta del usuario
    const { EmbeddingService } = await import('./embedding-service');
    const embeddingService = new EmbeddingService();
    const queryEmbedding = await embeddingService.embed(userQuery);

    console.log('🔍 Embedding de consulta generado, evaluando documentos...');

    // Evaluar similitud semántica de cada documento
    const scoredResults = await Promise.all(
      results.map(async (doc) => {
        try {
          // Crear texto del documento para embedding (category + text)
          const docText = `${doc.category} ${doc.text}`;
          const docEmbedding = await embeddingService.embed(docText);

          // Calcular similitud coseno
          const similarity = calculateCosineSimilarity(
            queryEmbedding,
            docEmbedding,
          );

          return {
            ...doc,
            semanticScore: similarity,
          };
        } catch (error) {
          console.error('🔍 Error evaluando documento:', error);
          // Si hay error, mantener el documento pero marcarlo como no relevante
          return {
            ...doc,
            semanticScore: 0,
          };
        }
      }),
    );

    // Ordenar por score semántico para analizar la distribución
    const sortedResults = scoredResults.sort(
      (a, b) => (b.semanticScore || 0) - (a.semanticScore || 0),
    );

    // Mostrar todas las similitudes para debugging
    sortedResults.forEach((doc, index) => {
      console.log(
        `🔍 ${index + 1}. ${doc.category} - Similitud: ${(doc.semanticScore || 0).toFixed(3)}`,
      );
    });

    // Calcular threshold dinámico basado en la distribución de similitudes
    const similarities = sortedResults.map((doc) => doc.semanticScore || 0);
    const maxSimilarity = Math.max(...similarities);
    const minSimilarity = Math.min(...similarities);
    const avgSimilarity =
      similarities.reduce((a, b) => a + b, 0) / similarities.length;

    // Threshold adaptativo: usar el percentil 75% o la media, lo que sea más bajo
    const adaptiveThreshold = Math.min(
      avgSimilarity,
      maxSimilarity * 0.3, // 30% del máximo
      0.15, // Threshold mínimo absoluto
    );

    console.log(`🔍 Estadísticas de similitud:`);
    console.log(`🔍   Máxima: ${maxSimilarity.toFixed(3)}`);
    console.log(`🔍   Mínima: ${minSimilarity.toFixed(3)}`);
    console.log(`🔍   Promedio: ${avgSimilarity.toFixed(3)}`);
    console.log(`🔍   Threshold adaptativo: ${adaptiveThreshold.toFixed(3)}`);

    // Usar el threshold más bajo entre el original y el adaptativo
    const finalThreshold = Math.min(threshold, adaptiveThreshold);
    console.log(`🔍   Threshold final: ${finalThreshold.toFixed(3)}`);

    // Filtrar por relevancia usando el threshold adaptativo
    const relevantResults = sortedResults.filter(
      (doc) => (doc.semanticScore || 0) > finalThreshold,
    );

    console.log(`🔍 Filtrado completado:`);
    console.log(`🔍 Documentos originales: ${results.length}`);
    console.log(`🔍 Documentos relevantes: ${relevantResults.length}`);
    console.log(
      `🔍 Documentos filtrados: ${results.length - relevantResults.length}`,
    );

    // Si no hay resultados relevantes, retornar al menos el top 2 más similares
    if (relevantResults.length === 0 && sortedResults.length > 0) {
      console.log(
        '🔍 No hay resultados relevantes, retornando top 2 más similares...',
      );
      return sortedResults.slice(0, 2);
    }

    return relevantResults;
  } catch (error) {
    console.error(
      '🔍 Error en filtrado semántico, retornando resultados originales:',
      error,
    );
    return results; // Fallback: retornar todos los resultados si falla el filtrado
  }
}

/**
 * Calcular similitud coseno entre dos vectores
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    console.warn('🔍 Vectores de diferentes longitudes, retornando 0');
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);

  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Búsqueda avanzada con filtros por metadatos
 */
export async function retrieveContextAdvanced(
  userQuery: string,
  language: 'Español' | 'English',
  filters?: AdvancedFilters,
  topK: number = 10,
  config: RAGConfig = DEFAULT_RAG_CONFIG,
): Promise<RetrievedAdvanced[]> {
  try {
    // Generar embedding de la consulta para búsqueda vectorial
    const { EmbeddingService } = await import('./embedding-service');
    const embeddingService = new EmbeddingService();
    const embedding = await embeddingService.embed(userQuery);
    const vectorString = `[${embedding.join(',')}]`;

    // Sistema de threshold adaptativo para evitar alucinaciones
    const thresholds = config.thresholds; // Configurable
    let rows: any[] = [];
    let usedThreshold = config.maxThreshold;

    for (const threshold of thresholds) {
      const sql = `
        SELECT
          id, text, source, year,
          $5 as category,
          similarity
        FROM similarity_search($1::vector, $2, $3, $4)
      `;

      const params: any[] = [
        vectorString,
        threshold,
        topK,
        language,
        config.defaultCategory,
      ];
      console.log(`🔍 Trying threshold ${threshold}...`);

      try {
        const result = await pool.query(sql, params);
        rows = result.rows;
        usedThreshold = threshold;

        if (rows.length > 0) {
          console.log(
            `✅ Found ${rows.length} results with threshold ${threshold}`,
          );
          break;
        } else {
          console.log(
            `⚠️ No results with threshold ${threshold}, trying next...`,
          );
        }
      } catch (error) {
        console.error(`❌ Error with threshold ${threshold}:`, error);
        continue;
      }
    }

    console.log(`🔍 Final threshold used: ${usedThreshold}`);
    console.log(`🔍 Total results found: ${rows.length}`);
    console.log('🔍 Raw results from similarity_search:', rows.length);
    if (rows.length === 0) {
      console.log(
        '⚠️ No results found with similarity_search. This could mean:',
      );
      console.log('   - No documents in the database');
      console.log('   - No documents in language:', language);
      console.log('   - Threshold too high (current:', usedThreshold, ')');
      console.log('   - Embeddings are NULL in database');
    }

    // Aplicar filtros de categoría post-query
    let filteredRows = rows;
    if (filters?.category && filters.category.length > 0) {
      // Necesitamos hacer una consulta adicional para obtener el domain de cada resultado
      const ids = rows.map((row) => row.id);
      if (ids.length > 0) {
        const domainQuery = `
          SELECT id, domain 
          FROM docs 
          WHERE id = ANY($1)
        `;
        const domainResult = await pool.query(domainQuery, [ids]);

        // Crear un mapa de id -> domain
        const domainMap = new Map(
          domainResult.rows.map((row) => [row.id, row.domain]),
        );

        // Filtrar por categorías permitidas
        filteredRows = rows.filter((row) => {
          const domain = domainMap.get(row.id);
          return domain && filters.category!.includes(domain);
        });
      }
    }

    // Mapear resultados usando 'similarity' en lugar de 'score'
    const mappedRows = filteredRows.map((row) => ({
      ...row,
      score: row.similarity, // Convertir similarity a score para compatibilidad
    }));

    return mappedRows as RetrievedAdvanced[];
  } catch (error) {
    console.error('Error in advanced RAG:', error);
    // Fallback: usar la función original de retrieve.ts
    try {
      console.log('🔄 Fallback: usando retrieveContext original...');
      const { retrieveContext } = await import('./retrieve');
      const fallbackResults = await retrieveContext(userQuery, language, topK);

      // Convertir formato de Retrieved a RetrievedAdvanced
      return fallbackResults.map((doc) => ({
        id: doc.id,
        text: doc.text,
        source: doc.source,
        year: doc.year,
        category: doc.domain || config.defaultCategory,
        score: config.defaultScore, // Score por defecto configurable
      }));
    } catch (fallbackError) {
      console.error('Error en fallback también:', fallbackError);
      return [];
    }
  }
}

/**
 * Búsqueda inteligente que usa categorización automática de la IA
 * La IA categoriza el mensaje y el sistema usa esa información para RAG inteligente
 */
export async function retrieveContextSmart(
  userQuery: string, // Query original del usuario
  aiAnalysis: AIAnalysisResponse, // Análisis de la IA con categorización
  topK: number = 10,
): Promise<RetrievedAdvanced[]> {
  console.log('🚀 retrieveContextSmart iniciado');
  console.log('🚀 Query original:', userQuery);
  console.log('🚀 Análisis de la IA:', aiAnalysis);
  console.log('🚀 TopK:', topK);

  // Usar el idioma detectado por la IA
  const detectedLanguage = aiAnalysis.language;
  console.log('🌍 Idioma detectado por la IA:', detectedLanguage);

  // BÚSQUEDA INTELIGENTE BASADA EN CATEGORIZACIÓN DE LA IA
  console.log('🔍 Iniciando búsqueda basada en categorización de la IA...');

  let results: RetrievedAdvanced[] = [];

  // 1. BÚSQUEDA POR CATEGORÍA DETECTADA POR LA IA
  if (aiAnalysis.category) {
    console.log(`🔍 Buscando en categoría detectada: ${aiAnalysis.category}`);
    const categoryResults = await retrieveContextAdvanced(
      aiAnalysis.translation, // Usar la traducción de la IA
      detectedLanguage,
      { category: [aiAnalysis.category] },
      Math.ceil(topK * 0.7), // 70% de resultados de la categoría principal
    );
    results = [...results, ...categoryResults];
    console.log(
      `✅ Encontrados ${categoryResults.length} resultados en categoría ${aiAnalysis.category}`,
    );
  }

  // 2. BÚSQUEDA POR CONDICIONES ESPECÍFICAS DETECTADAS POR LA IA
  if (aiAnalysis.conditions.length > 0 && results.length < topK) {
    console.log(
      '🔍 Buscando por condiciones específicas detectadas por la IA...',
    );
    const remainingCount = topK - results.length;

    // Búsqueda vectorial pura y luego filtrar por condiciones
    const conditionResults = await retrieveContextAdvanced(
      aiAnalysis.translation,
      detectedLanguage,
      undefined, // Sin filtros de categoría
      remainingCount * 2, // Buscar más para poder filtrar
    );

    // Filtrar por condiciones detectadas por la IA
    const filteredConditionResults = conditionResults.filter((doc) =>
      aiAnalysis.conditions.some(
        (condition) =>
          doc.text.toLowerCase().includes(condition.toLowerCase()) ||
          doc.category.toLowerCase().includes(condition.toLowerCase()),
      ),
    );

    // Tomar solo los necesarios
    const neededResults = filteredConditionResults.slice(0, remainingCount);
    results = [...results, ...neededResults];
    console.log(
      `✅ Encontrados ${neededResults.length} resultados por condiciones específicas`,
    );
  }

  // 3. BÚSQUEDA VECTORIAL COMO FALLBACK
  if (results.length < topK) {
    console.log('🔍 Búsqueda vectorial como fallback...');
    const remainingCount = topK - results.length;
    const vectorResults = await retrieveContextAdvanced(
      aiAnalysis.translation,
      detectedLanguage,
      undefined, // Sin filtros
      remainingCount,
    );
    results = [...results, ...vectorResults];
    console.log(
      `✅ Encontrados ${vectorResults.length} resultados por búsqueda vectorial`,
    );
  }

  // 4. BÚSQUEDA EN OTRO IDIOMA SI ES NECESARIO
  if (results.length < topK) {
    const otherLanguage =
      detectedLanguage === 'Español' ? 'English' : 'Español';
    const remainingCount = topK - results.length;

    console.log(
      `🔄 Buscando ${remainingCount} resultados adicionales en ${otherLanguage}`,
    );

    const otherResults = await retrieveContextAdvanced(
      aiAnalysis.translation,
      otherLanguage,
      undefined,
      remainingCount,
    );

    console.log(
      `✅ Encontrados ${otherResults.length} resultados adicionales en ${otherLanguage}`,
    );
    results = [...results, ...otherResults];
  }

  // Eliminar duplicados por ID
  results = results.filter(
    (doc, index, self) => index === self.findIndex((d) => d.id === doc.id),
  );

  console.log(`🎯 Total de resultados únicos: ${results.length}`);

  // Mostrar los documentos encontrados antes del filtrado
  console.log('📚 DOCUMENTOS ENCONTRADOS ANTES DEL FILTRADO:');
  results.forEach((doc, index) => {
    console.log(`  ${index + 1}. ${doc.category} - Score: ${doc.score}`);
    console.log(`     Texto: ${doc.text.substring(0, 80)}...`);
    console.log(`     Fuente: ${doc.source || 'N/A'}`);
  });

  // Aplicar filtrado post-búsqueda por relevancia semántica
  console.log(
    '🚀 Aplicando filtrado post-búsqueda por relevancia semántica...',
  );
  const filteredResults = await filterBySemanticRelevance(
    results,
    aiAnalysis.translation, // Usar la traducción de la IA para el filtrado
    0.25,
  );

  console.log(
    `🎯 Resultados finales después del filtrado: ${filteredResults.length}`,
  );
  return filteredResults;
}
