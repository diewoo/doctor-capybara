import { retrieveContext } from './dist/rag/retrieve.js';
import { getPatientChatPrompt } from './dist/utils/prompts.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSleepQuery() {
  console.log('😴 TESTING SLEEP QUERY PROMPT\n');

  const userQuery = 'No puedo dormir, ¿qué remedio natural me recomiendas?';
  const language = 'Español';

  console.log(`🔍 Query: "${userQuery}"`);
  console.log(`🌐 Language: ${language}`);

  try {
    // Get RAG context
    const retrievedDocs = await retrieveContext(userQuery, language, 3);

    console.log(`\n📚 RAG DOCUMENTS FOUND (${retrievedDocs.length}):`);
    retrievedDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.text}`);
      console.log(`     Source: ${doc.source} (${doc.year})`);
    });

    // Build RAG context
    const ragContext =
      retrievedDocs.length > 0
        ? '\n\n📚 INFORMACIÓN MÉDICA RELEVANTE:\n' +
          retrievedDocs
            .map((doc) => `• ${doc.text} (Fuente: ${doc.source}, ${doc.year})`)
            .join('\n')
        : '';

    console.log(`\n🔗 RAG CONTEXT LENGTH: ${ragContext.length} characters`);

    // Generate full prompt
    const mockPatient = {
      title: 'Consulta de Sueño',
      chat: [
        {
          role: 'ai',
          content:
            '<div><p><strong>Hola</strong> 👋 Soy tu asistente de autocuidado. ¿En qué puedo ayudarte hoy?</p></div>',
          timestamp: '2025-08-08T20:00:00.000Z',
        },
      ],
      info: 'Usuario con problemas de sueño',
    };

    const prompt = getPatientChatPrompt(
      mockPatient.title,
      'Usuario busca remedios naturales para dormir',
      userQuery,
      mockPatient.chat,
      [], // No pending questions
      false, // Not first turn
      ragContext,
    );

    console.log('\n🤖 FULL PROMPT GENERATED:');
    console.log('─'.repeat(80));
    console.log(prompt);
    console.log('─'.repeat(80));

    console.log('\n📊 PROMPT STATISTICS:');
    console.log(`- Total characters: ${prompt.length}`);
    console.log(`- Lines: ${prompt.split('\n').length}`);
    console.log(
      `- RAG context included: ${prompt.includes('📚 INFORMACIÓN MÉDICA RELEVANTE') ? 'YES' : 'NO'}`,
    );
    console.log(
      `- User query included: ${prompt.includes(userQuery) ? 'YES' : 'NO'}`,
    );
    console.log(
      `- Sleep-related terms: ${prompt.toLowerCase().includes('dormir') || prompt.toLowerCase().includes('sleep') ? 'YES' : 'NO'}`,
    );
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testSleepQuery().catch(console.error);
