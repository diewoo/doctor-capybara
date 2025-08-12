import { EmbeddingService } from '../rag/embedding-service';

export interface SearchResult {
  id: string;
  text: string;
  source: string;
  year: number;
  score: number;
  searchType: 'semantic' | 'keyword';
}

export class SimpleSemanticSearch {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Búsqueda semántica simple usando embeddings
   */
  async semanticSearch(
    query: string,
    language: 'Español' | 'English',
    topK: number = 5,
  ): Promise<SearchResult[]> {
    try {
      // 1. Generar embedding de la consulta
      const queryEmbedding = await this.embeddingService.embed(query);

      // 2. Buscar documentos similares en la base de datos
      const results = await this.searchSimilarDocuments(
        queryEmbedding,
        language,
        topK,
      );

      console.log(
        `🔍 Semantic search found ${results.length} results for "${query}" in ${language}`,
      );

      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      // Fallback: retornar array vacío, el sistema principal usará keywords
      return [];
    }
  }

  /**
   * Búsqueda híbrida: combina semántica + keywords
   */
  async hybridSearch(
    query: string,
    language: 'Español' | 'English',
    topK: number = 5,
  ): Promise<SearchResult[]> {
    try {
      // 1. Búsqueda semántica
      const semanticResults = await this.semanticSearch(
        query,
        language,
        Math.ceil(topK / 2),
      );

      // 2. Búsqueda por keywords (usando el sistema existente)
      const keywordResults = await this.keywordSearch(
        query,
        language,
        Math.ceil(topK / 2),
      );

      // 3. Combinar y rankear resultados
      const combined = [...semanticResults, ...keywordResults];

      // 4. Eliminar duplicados y ordenar por score
      const uniqueResults = this.removeDuplicates(combined);
      const rankedResults = uniqueResults.sort((a, b) => b.score - a.score);

      return rankedResults.slice(0, topK);
    } catch (error) {
      console.error('Hybrid search failed:', error);
      return await this.keywordSearch(query, language, topK);
    }
  }

  /**
   * Búsqueda por keywords (fallback)
   */
  async keywordSearch(
    query: string,
    language: 'Español' | 'English',
    topK: number = 5,
  ): Promise<SearchResult[]> {
    // Importar dinámicamente para evitar dependencias circulares
    const { retrieveContext } = await import('../rag/retrieve');

    try {
      const results = await retrieveContext(query, language, topK);

      return results.map((result) => ({
        ...result,
        searchType: 'keyword' as const,
        score: 0.5, // Score base para keywords
      }));
    } catch (error) {
      console.error('Keyword search failed:', error);
      return [];
    }
  }

  /**
   * Buscar documentos similares en la base de datos
   */
  private async searchSimilarDocuments(
    queryEmbedding: number[],
    language: string,
    topK: number,
  ): Promise<SearchResult[]> {
    // Por ahora, usamos el sistema existente pero con embeddings
    // En el futuro, esto se puede conectar a una base de datos vectorial

    const { retrieveContext } = await import('../rag/retrieve');
    const keywordResults = await retrieveContext(
      '',
      language as 'Español' | 'English',
      topK * 2,
    ); // Más resultados para filtrar

    // Simular búsqueda semántica calculando similitud
    const scoredResults = await Promise.all(
      keywordResults.map(async (doc) => {
        try {
          const docEmbedding = await this.embeddingService.embed(doc.text);
          const similarity = this.calculateCosineSimilarity(
            queryEmbedding,
            docEmbedding,
          );

          return {
            ...doc,
            score: similarity,
          };
        } catch (error) {
          console.error('Error calculating cosine similarity:', error);
          return { ...doc, score: 0 };
        }
      }),
    );

    // Filtrar por threshold y ordenar por score
    return scoredResults
      .filter((result) => result.score >= 0.5) // Threshold fijo y simple
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((result) => ({
        ...result,
        searchType: 'semantic' as const,
      }));
  }

  /**
   * Calcular similitud coseno entre dos vectores
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Eliminar duplicados basándose en ID del documento
   */
  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });
  }
}
