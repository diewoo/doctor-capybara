import { retrieveContext } from './retrieve';

async function testRAG() {
  console.log('🧪 Probando RAG con Supabase...\n');

  const testQueries = [
    'Tengo dolor de cabeza',
    '¿Qué hacer si tengo fiebre?',
    'Síntomas de gripe',
    'Remedios caseros para el resfriado',
    'Dolor de garganta',
  ];

  for (const query of testQueries) {
    console.log(`🔍 Consulta: "${query}"`);
    try {
      const results = await retrieveContext(query, 'Español', 2);
      console.log(`✅ Encontrados ${results.length} documentos relevantes:`);
      results.forEach((doc, i) => {
        console.log(`  ${i + 1}. ${doc.text.substring(0, 100)}...`);
        console.log(`     Fuente: ${doc.source} (${doc.year})`);
      });
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
    console.log('');
  }
}

testRAG().catch(console.error);
