/* eslint-disable */
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8080';

async function testChatWithRAG() {
  console.log('🤖 Probando chat con RAG...\n');

  const testQueries = [
    '¿Cómo puedo mejorar mi sueño?',
    'Tengo ansiedad y estrés, ¿qué puedo hacer?',
    '¿Hay remedios naturales para el dolor de cabeza?',
    '¿Cómo puedo manejar la diabetes de forma natural?',
    '¿Qué ejercicios ayudan a reducir la ansiedad?',
  ];

  for (const query of testQueries) {
    console.log(`📝 Consulta: "${query}"`);
    console.log('⏳ Enviando al servidor...\n');

    try {
      const response = await fetch(
        `${API_BASE}/api/gemini/patient/test-patient-123/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: query,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`🤖 Respuesta del chat:`);
        console.log(data.message);
        console.log('');
      } else {
        console.log(`❌ Error HTTP: ${response.status}`);
        const errorText = await response.text();
        console.log(`Error: ${errorText}\n`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}\n`);
    }

    console.log('─'.repeat(80));
    console.log('');

    // Esperar un poco entre consultas
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Verificar si el servidor está corriendo
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      console.log('✅ Servidor NestJS está corriendo');
      return true;
    }
  } catch (error) {
    console.log('❌ Servidor NestJS no está disponible');
    console.log(
      'Asegúrate de que el servidor esté corriendo en http://localhost:8080',
    );
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testChatWithRAG();
  }
}

main().catch(console.error);
