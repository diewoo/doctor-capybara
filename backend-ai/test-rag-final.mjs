/* eslint-disable */
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8080';
const PATIENT_ID = '185604e7-9bd8-485e-b08f-c6d0392d7d54';

async function testRAGChat() {
  console.log('🤖 Probando Chat con RAG - Doctor Capybara\n');

  const testQueries = [
    {
      query: '¿Cómo puedo mejorar mi sueño?',
      description: 'Consulta en español sobre sueño'
    },
    {
      query: 'What natural remedies help with anxiety?',
      description: 'Consulta en inglés sobre ansiedad'
    },
    {
      query: '¿Hay remedios naturales para el dolor de cabeza?',
      description: 'Consulta en español sobre dolor de cabeza'
    },
    {
      query: 'How to manage diabetes naturally?',
      description: 'Consulta en inglés sobre diabetes'
    },
    {
      query: '¿Qué ejercicios ayudan a reducir la ansiedad?',
      description: 'Consulta en español sobre ejercicios'
    }
  ];

  for (const { query, description } of testQueries) {
    console.log(`📝 ${description}:`);
    console.log(`   Consulta: "${query}"`);
    console.log('⏳ Enviando al servidor...\n');

    try {
      const response = await fetch(`${API_BASE}/api/gemini/patient/${PATIENT_ID}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🤖 Respuesta del Doctor Capybara:`);
        
        // Extraer solo el texto de la respuesta (sin HTML)
        const textContent = data.content.replace(/<[^>]*>/g, '').trim();
        console.log(textContent.substring(0, 300) + (textContent.length > 300 ? '...' : ''));
        
        if (data.suggestions && data.suggestions.length > 0) {
          console.log('\n💡 Sugerencias:');
          data.suggestions.forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion}`);
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error HTTP: ${response.status}`);
        console.log(`Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
    }

    console.log('\n' + '─'.repeat(80));
    console.log('');
    
    // Esperar un poco entre consultas
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log('🎉 Pruebas completadas. El sistema RAG está funcionando correctamente!');
}

testRAGChat().catch(console.error);
