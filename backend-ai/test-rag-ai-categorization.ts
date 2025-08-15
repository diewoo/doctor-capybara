import {
  retrieveContextSmart,
  AIAnalysisResponse,
} from './src/rag/retrieve-advanced';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAICategorizationRAG() {
  console.log('🧪 Probando RAG con Categorización Automática de la IA...\n');

  // Simular respuesta de la IA para "Tengo ansiedad"
  const aiAnalysis: AIAnalysisResponse = {
    translation: 'I have anxiety',
    category: 'Mental Health',
    conditions: ['anxiety', 'stress', 'mental health'],
    relevance_score: 0.95,
    language: 'English',
  };

  console.log('🔍 Query: "Tengo ansiedad"');
  console.log('🤖 Análisis de la IA:', aiAnalysis);

  try {
    const results = await retrieveContextSmart('Tengo ansiedad', aiAnalysis, 5);

    console.log(`📚 Resultados encontrados: ${results.length}`);

    if (results.length > 0) {
      results.forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.category} - Score: ${result.score}`,
        );
        console.log(`     Texto: ${result.text.substring(0, 80)}...`);
        console.log(`     Fuente: ${result.source || 'N/A'}`);
      });
    } else {
      console.log('  ❌ No se encontraron resultados');
    }
  } catch (error) {
    console.error(
      `  ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

testAICategorizationRAG().catch(console.error);
