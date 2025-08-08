import { retrieveContext } from './dist/rag/retrieve.js';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeRAGData() {
  console.log('🔍 ANALIZANDO QUÉ ENCUENTRA EL RAG ACTUALMENTE\n');

  const testQueries = [
    {
      name: 'Tos + Sueño (Tu consulta original)',
      query: 'No duermo bien por la tos, ¿qué puedo hacer en casa?',
      language: 'Español',
    },
    {
      name: 'Solo Tos',
      query: 'Tengo tos',
      language: 'Español',
    },
    {
      name: 'Solo Sueño',
      query: 'No puedo dormir',
      language: 'Español',
    },
    {
      name: 'Ansiedad',
      query: 'Me siento ansioso',
      language: 'Español',
    },
    {
      name: 'Resfriado',
      query: 'Tengo resfriado',
      language: 'Español',
    },
    {
      name: 'English Cold',
      query: 'I have a cold',
      language: 'English',
    },
  ];

  for (const testCase of testQueries) {
    console.log(`\n🎯 CONSULTA: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Idioma: ${testCase.language}`);

    try {
      const results = await retrieveContext(
        testCase.query,
        testCase.language,
        5, // Buscar más documentos para ver qué hay
      );

      console.log(`\n📚 DOCUMENTOS ENCONTRADOS (${results.length}):`);

      if (results.length === 0) {
        console.log('❌ No se encontraron documentos');
        continue;
      }

      results.forEach((doc, index) => {
        const docText = doc.text.toLowerCase();

        // Análisis de relevancia
        const hasCough = docText.includes('tos') || docText.includes('cough');
        const hasSleep =
          docText.includes('dormir') ||
          docText.includes('sleep') ||
          docText.includes('sueño');
        const hasAnxiety =
          docText.includes('ansiedad') || docText.includes('anxiety');
        const hasCold =
          docText.includes('resfriado') ||
          docText.includes('cold') ||
          docText.includes('gripe');
        const hasHoney = docText.includes('miel') || docText.includes('honey');
        const hasGinger =
          docText.includes('jengibre') || docText.includes('ginger');
        const hasLavender =
          docText.includes('lavanda') || docText.includes('lavender');
        const hasExercise =
          docText.includes('ejercicio') || docText.includes('exercise');

        console.log(`\n  📄 Documento ${index + 1}:`);
        console.log(`     Texto: ${doc.text}`);
        console.log(`     Fuente: ${doc.source} (${doc.year})`);
        console.log(`     Longitud: ${doc.text.length} caracteres`);
        console.log(`     Relevancia:`);
        console.log(`       • Tos: ${hasCough ? '✅' : '❌'}`);
        console.log(`       • Sueño: ${hasSleep ? '✅' : '❌'}`);
        console.log(`       • Ansiedad: ${hasAnxiety ? '✅' : '❌'}`);
        console.log(`       • Resfriado: ${hasCold ? '✅' : '❌'}`);
        console.log(`       • Miel: ${hasHoney ? '✅' : '❌'}`);
        console.log(`       • Jengibre: ${hasGinger ? '✅' : '❌'}`);
        console.log(`       • Lavanda: ${hasLavender ? '✅' : '❌'}`);
        console.log(`       • Ejercicio: ${hasExercise ? '✅' : '❌'}`);
      });

      // Análisis general
      const totalCough = results.filter(
        (doc) =>
          doc.text.toLowerCase().includes('tos') ||
          doc.text.toLowerCase().includes('cough'),
      ).length;

      const totalSleep = results.filter(
        (doc) =>
          doc.text.toLowerCase().includes('dormir') ||
          doc.text.toLowerCase().includes('sleep'),
      ).length;

      console.log(`\n📊 ANÁLISIS GENERAL:`);
      console.log(`   • Documentos sobre tos: ${totalCough}/${results.length}`);
      console.log(
        `   • Documentos sobre sueño: ${totalSleep}/${results.length}`,
      );
      console.log(
        `   • Relevancia para la consulta: ${totalCough > 0 || totalSleep > 0 ? 'ALTA' : 'BAJA'}`,
      );
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
  }
}

analyzeRAGData().catch(console.error);
