import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { Patient, ChatMessage } from './interfaces/patient.interface';
import {
  PatientInfoInput,
  PatientProfile,
} from './interfaces/patient-profile.interface';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import {
  processAndCleanPatientInfo,
  patientProfileToNarrative,
  buildMissingProfileQuestions,
} from '../utils/text-processor';
import {
  getPatientChatPrompt,
  getPatientTitleDescPrompt,
  PatientAnalysisResponse,
} from '../utils/prompts';
import { SimpleSemanticSearch } from '../utils/semantic-search';
import {
  retrieveContextSmart,
  AIAnalysisResponse,
} from '../rag/retrieve-advanced';

// Constants for rate limiting and validation
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES_PER_MINUTE = 10;
const MAX_PATIENT_INFO_LENGTH = 5000;

@Injectable()
export class PatientService {
  private patients: Map<string, Patient> = new Map();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> =
    new Map();
  private genAI: GoogleGenerativeAI;
  private semanticSearch: SimpleSemanticSearch;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.semanticSearch = new SimpleSemanticSearch();
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
      return false;
    }
    const proto = Object.getPrototypeOf(value as object) as object | null;
    return proto === Object.prototype || proto === null;
  }

  private isPatientProfile(value: unknown): value is PatientProfile {
    if (!this.isPlainObject(value)) return false;
    const v = value;
    // Shallow type checks for known keys
    const checkString = (x: unknown) =>
      x === undefined || typeof x === 'string';
    const checkNumber = (x: unknown) =>
      x === undefined || typeof x === 'number';
    const lifestyle: unknown = v['lifestyle'];
    let lifestyleOk = true;
    if (lifestyle !== undefined) {
      if (this.isPlainObject(lifestyle)) {
        const l = lifestyle;
        lifestyleOk = [
          'diet',
          'physicalActivity',
          'sleepHabits',
          'stressLevels',
          'substanceUse',
        ].every((k) => checkString(l[k]));
      } else {
        lifestyleOk = false;
      }
    }

    return (
      checkNumber(v['age']) &&
      checkString(v['gender']) &&
      checkString(v['lifeStage']) &&
      checkString(v['medicalHistory']) &&
      checkString(v['currentHealthConditions']) &&
      checkString(v['geneticFamilyHistory']) &&
      checkString(v['personalGoals']) &&
      checkString(v['preferences']) &&
      checkString(v['medications']) &&
      checkString(v['supplements']) &&
      checkString(v['environmentalFactors']) &&
      checkString(v['socialFactors']) &&
      lifestyleOk
    );
  }

  private isPatientInfoInput(value: unknown): value is PatientInfoInput {
    return typeof value === 'string' || this.isPatientProfile(value);
  }

  private validatePatientInfo(info: PatientInfoInput): void {
    if (info === undefined || info === null) {
      throw new HttpException(
        'Patient information is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (typeof info === 'string') {
      // Permitir strings vacíos para pacientes iniciales
      if (info.length > MAX_PATIENT_INFO_LENGTH) {
        throw new HttpException(
          `Patient information exceeds maximum length of ${MAX_PATIENT_INFO_LENGTH} characters`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } else if (typeof info === 'object') {
      const serialized = JSON.stringify(info);
      if (serialized.length > MAX_PATIENT_INFO_LENGTH) {
        throw new HttpException(
          `Patient profile exceeds maximum serialized length of ${MAX_PATIENT_INFO_LENGTH} characters`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      throw new HttpException(
        'Invalid patient information format',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateMessage(message: string): void {
    if (!message || typeof message !== 'string') {
      throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new HttpException(
        `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private checkRateLimit(patientId: string): void {
    const now = Date.now();
    const minuteAgo = now - 60000;
    const patientRate = this.rateLimitMap.get(patientId);

    if (patientRate) {
      if (patientRate.resetTime < minuteAgo) {
        // Reset if more than a minute has passed
        this.rateLimitMap.set(patientId, { count: 1, resetTime: now });
      } else if (patientRate.count >= MAX_MESSAGES_PER_MINUTE) {
        throw new HttpException(
          'Rate limit exceeded. Please wait before sending more messages.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        patientRate.count++;
        this.rateLimitMap.set(patientId, patientRate);
      }
    } else {
      this.rateLimitMap.set(patientId, { count: 1, resetTime: now });
    }
  }

  async processPatientInfo(
    createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    console.log('🔍 processPatientInfo called with:', createPatientDto);
    console.log('🌍 Language received:', createPatientDto.language);

    const rawInfo = createPatientDto.patientInfo;
    console.log('Raw info:', rawInfo, 'Type:', typeof rawInfo);

    if (!this.isPatientInfoInput(rawInfo)) {
      console.log('Invalid patient info input');
      throw new HttpException(
        'Invalid patient information format',
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log('Patient info validation passed');
    this.validatePatientInfo(rawInfo);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    });

    try {
      console.log('Starting AI processing...');
      const baseInfoNarrativeRaw =
        typeof rawInfo === 'string'
          ? rawInfo
          : patientProfileToNarrative(rawInfo);
      console.log('Base info narrative raw:', baseInfoNarrativeRaw);
      const baseInfoNarrative = baseInfoNarrativeRaw.trim().length
        ? baseInfoNarrativeRaw
        : 'El usuario aún no ha compartido detalles. Genera un título breve y una descripción HTML inicial con saludo cordial, explicación de que harás algunas preguntas para personalizar consejos, y recordatorio de acudir a un médico presencial ante señales de alarma.';
      console.log('Base info narrative final:', baseInfoNarrative);
      const prompt = getPatientTitleDescPrompt(baseInfoNarrative);
      console.log('Generated prompt:', prompt);
      console.log('Calling Gemini API...');
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      console.log('Gemini API response received');
      const responseText = result.response.text();
      console.log('Response text:', responseText);
      let response: PatientAnalysisResponse;

      try {
        response = JSON.parse(responseText) as PatientAnalysisResponse;
        if (!response.title || !response.htmlDescription) {
          throw new Error('Invalid response format');
        }
      } catch {
        // Fallback seguro si el modelo no devolvió JSON válido
        const userLanguage = createPatientDto.language || 'Español'; // Default to Spanish
        response = {
          title: this.generateInitialTitle(userLanguage),
          htmlDescription: this.generateWelcomeMessage(userLanguage),
        };
      }

      const nowIso = new Date().toISOString();
      const patient: Patient = {
        id: uuidv4(),
        info: rawInfo,
        title: response.title,
        htmlDescription: response.htmlDescription,
        chat: [
          {
            role: 'ai',
            content: response.htmlDescription,
            timestamp: nowIso,
          },
        ],
        results: [],
        preferredLanguage: 'English',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.patients.set(patient.id, patient);
      return patient;
    } catch (error) {
      console.error('Error in processPatientInfo:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Check if it's a Gemini API quota error
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message?: string }).message;
        if (
          (errorMessage && errorMessage.includes('quota')) ||
          errorMessage?.includes('429')
        ) {
          console.log('Gemini API quota exceeded, using fallback response');
          // Use fallback response when Gemini API is not available
          const userLanguage = createPatientDto.language || 'Español';
          const fallbackResponse: PatientAnalysisResponse = {
            title: this.generateInitialTitle(userLanguage),
            htmlDescription: this.generateWelcomeMessage(userLanguage),
          };

          const nowIso = new Date().toISOString();
          const patient: Patient = {
            id: uuidv4(),
            info: rawInfo,
            title: fallbackResponse.title,
            htmlDescription: fallbackResponse.htmlDescription,
            chat: [
              {
                role: 'ai',
                content: fallbackResponse.htmlDescription,
                timestamp: nowIso,
              },
            ],
            results: [],
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          this.patients.set(patient.id, patient);
          return patient;
        }
      }

      throw new HttpException(
        'Failed to process patient information',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getPatient(id: string): Patient {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    return patient;
  }

  listPatients(): Patient[] {
    return Array.from(this.patients.values());
  }

  updatePatient(id: string, updatePatientDto: UpdatePatientDto): Patient {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const rawInfo: unknown = updatePatientDto.patientInfo as unknown;
    if (!this.isPatientInfoInput(rawInfo)) {
      throw new HttpException(
        'Invalid patient information format',
        HttpStatus.BAD_REQUEST,
      );
    }
    this.validatePatientInfo(rawInfo);
    patient.info = rawInfo;
    this.patients.set(id, patient);
    return patient;
  }

  async sendMessage(
    id: string,
    chatMessageDto: ChatMessageDto,
  ): Promise<ChatMessage> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }

    this.validateMessage(chatMessageDto.message);
    this.checkRateLimit(id);

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      const extractor = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
          responseMimeType: 'application/json',
        },
      });

      const baseInfoNarrative =
        typeof patient.info === 'string'
          ? patient.info
          : patientProfileToNarrative(patient.info);
      const processedInfo = processAndCleanPatientInfo(baseInfoNarrative);
      // Intentar extraer información de perfil del mensaje del usuario y fusionar
      const { getProfileExtractionPrompt } = await import('../utils/prompts');
      try {
        const extractRes = await extractor.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                { text: getProfileExtractionPrompt(chatMessageDto.message) },
              ],
            },
          ],
        });
        const extractText = extractRes.response.text();
        const extracted = JSON.parse(extractText) as Partial<PatientProfile>;
        if (this.isPatientProfile(extracted) || this.isPlainObject(extracted)) {
          const currentProfile: Record<string, unknown> =
            typeof patient.info === 'object' && this.isPlainObject(patient.info)
              ? patient.info
              : {};
          // merge superficial (sin arrays)
          const merged = {
            ...currentProfile,
            ...extracted,
          } as PatientInfoInput;
          patient.info = merged;
        }
      } catch (error) {
        console.error('Error extracting profile information:', error);
        // Si falla la extracción, continuamos sin bloquear el chat
      }

      // Detectar idioma y categorizar el mensaje del usuario
      const aiAnalysis = await this.detectLanguageAndCategorize(
        chatMessageDto.message,
      );
      const detectedLanguage = aiAnalysis.language;

      const onboardingQuestions = buildMissingProfileQuestions(
        typeof patient.info === 'object'
          ? (patient.info as Record<string, unknown>)
          : undefined,
        detectedLanguage, // ← Pasar el idioma detectado
      );

      // Obtener contexto RAG
      let retrievedDocs: any[] = []; // Default empty array
      let ragContext = '';
      try {
        // Usar búsqueda avanzada con metadatos en lugar de búsqueda semántica básica

        retrievedDocs = await retrieveContextSmart(
          chatMessageDto.message,
          aiAnalysis,
          5,
        );

        // RAG mejorado ya filtra por categorías automáticamente
        // Solo limitar a los 3 documentos más relevantes
        retrievedDocs = retrievedDocs.slice(0, 3);

        // SOLO usar contexto RAG si encontramos documentos en el idioma del usuario
        if (retrievedDocs.length > 0) {
          ragContext =
            '\n\nBasándome en información médica disponible:\n' +
            retrievedDocs.map((doc) => `${doc.text}`).join('\n');

          console.log(
            `✅ RAG: Usando ${retrievedDocs.length} documentos en ${detectedLanguage}`,
          );
        } else {
          console.log(
            `⚠️ RAG: No se encontraron documentos en ${detectedLanguage}, continuando sin contexto`,
          );
          ragContext = ''; // Asegurar que esté vacío
        }
      } catch (error) {
        console.error('Error retrieving RAG context:', error);
        // Continuar sin RAG si falla
        ragContext = '';
      }

      // Prompt optimizado que incluye respuesta + sugerencias en una sola llamada
      const prompt =
        getPatientChatPrompt(
          detectedLanguage,
          patient.title,
          processedInfo,
          chatMessageDto.message,
          patient.chat,
          onboardingQuestions,
          patient.chat.length === 0,
          ragContext,
        ) +
        `

IMPORTANTE: Responde en este formato JSON exacto:
{
  "response": "Tu respuesta principal aquí...",
  "suggestions": ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3", "Sugerencia 4"]
}

🔹 FORMATO OBLIGATORIO DE SUGERENCIAS:
- Si haces preguntas → genera RESPUESTAS directas a esas preguntas
- Si das consejos → genera sugerencias para aprender más sobre esos consejos
- Las sugerencias deben ser lo que el usuario querría RESPONDER o HACER

❌ PROHIBIDO:
- NO generes instrucciones como "Describe", "Indica", "Comparte"
- NO uses verbos imperativos
- NO generes preguntas adicionales
- NO uses markdown
- Solo JSON puro


✅ GENERA:
- 4 sugerencias contextuales a tu respuesta
- En el MISMO IDIOMA de la conversación
- Que sean respuestas directas o acciones específicas`;

      // Log prompt details for validation
      this.logPromptDetails(
        'sendMessage',
        detectedLanguage,
        chatMessageDto.message,
        ragContext,
        prompt,
        retrievedDocs,
      );

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      if (typeof responseText !== 'string') {
        throw new Error('Invalid response from model');
      }

      // Parsear respuesta combinada (respuesta + sugerencias)
      let aiResponse = '';
      let suggestions: string[] = [];

      try {
        // Limpiar markdown antes de parsear JSON
        let cleanResponse = responseText;
        if (cleanResponse.includes('```json')) {
          cleanResponse = cleanResponse
            .replace(/```json\s*/, '')
            .replace(/\s*```$/, '');
        } else if (cleanResponse.includes('```')) {
          cleanResponse = cleanResponse
            .replace(/```\s*/, '')
            .replace(/\s*```$/, '');
        }

        // Intentar parsear como JSON
        const parsed = JSON.parse(cleanResponse);
        if (parsed.response && Array.isArray(parsed.suggestions)) {
          aiResponse = parsed.response;
          suggestions = parsed.suggestions.slice(0, 4);
        } else {
          // Fallback: usar respuesta completa como texto
          aiResponse = responseText;
          suggestions = [];
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        // Fallback: usar respuesta completa como texto
        aiResponse = responseText;
        suggestions = [];
        console.log('Response was not JSON, using as plain text');
      }

      const userMessage: ChatMessage = {
        role: 'user',
        content: chatMessageDto.message,
        timestamp: new Date().toISOString(),
      };

      const aiMessage: ChatMessage = {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        suggestions,
      };

      patient.chat.push(userMessage, aiMessage);
      patient.updatedAt = new Date().toISOString();
      this.patients.set(id, patient);

      return aiMessage;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendMessageStream(
    id: string,
    chatMessageDto: ChatMessageDto,
    onDelta: (delta: string) => Promise<void> | void,
    shouldContinue?: () => boolean,
  ): Promise<void> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }

    // Función para limpiar HTML de chunks individuales
    const cleanChunk = (chunk: string): string => {
      if (!chunk) return chunk;

      let cleanedChunk = chunk;

      // Limpiar markdown si aparece
      if (cleanedChunk.includes('```')) {
        cleanedChunk = cleanedChunk
          .replace(/```\w*\s*/, '')
          .replace(/\s*```$/, '');
      }

      // Limpiar caracteres de control y espacios extra
      cleanedChunk = cleanedChunk
        .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
        .trim();

      return cleanedChunk;
    };

    this.validateMessage(chatMessageDto.message);
    this.checkRateLimit(id);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        // Removido responseMimeType para permitir HTML natural
      },
    });

    const extractor = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 300,
        responseMimeType: 'application/json',
      },
    });

    try {
      const baseInfoNarrative =
        typeof patient.info === 'string'
          ? patient.info
          : patientProfileToNarrative(patient.info);
      const processedInfo = processAndCleanPatientInfo(baseInfoNarrative);

      // Non-blocking attempt to enrich profile from user message
      try {
        const { getProfileExtractionPrompt } = await import('../utils/prompts');
        const extractRes = await extractor.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                { text: getProfileExtractionPrompt(chatMessageDto.message) },
              ],
            },
          ],
        });
        const extractText = extractRes.response.text();
        const extracted = JSON.parse(extractText) as Partial<PatientProfile>;
        if (this.isPatientProfile(extracted) || this.isPlainObject(extracted)) {
          const currentProfile: Record<string, unknown> =
            typeof patient.info === 'object' && this.isPlainObject(patient.info)
              ? patient.info
              : {};
          const merged = {
            ...currentProfile,
            ...extracted,
          } as PatientInfoInput;
          patient.info = merged;
        }
      } catch (error) {
        // ignore extraction failures
        console.error('Profile extraction failed (non-fatal):', error);
      }

      // Detectar idioma del mensaje actual del usuario
      const detectedLanguage = await this.detectLanguageWithAI(
        chatMessageDto.message,
      );

      const onboardingQuestions = buildMissingProfileQuestions(
        typeof patient.info === 'object'
          ? (patient.info as Record<string, unknown>)
          : undefined,
        detectedLanguage, // ← Pasar el idioma detectado
      );

      // Obtener contexto RAG basado en la consulta del usuario
      let ragContext = '';
      let retrievedDocs: any[] = []; // Default empty array

      try {
        // Usar búsqueda avanzada con metadatos en lugar de búsqueda semántica básica
        console.log('🔍 DEBUG STREAM: Llamando a retrieveContextSmart...');
        console.log('🔍 DEBUG STREAM: Query:', chatMessageDto.message);
        console.log('🔍 DEBUG STREAM: Language:', detectedLanguage);

        const aiAnalysisStream = await this.detectLanguageAndCategorize(
          chatMessageDto.message,
        );

        retrievedDocs = await retrieveContextSmart(
          chatMessageDto.message,
          aiAnalysisStream,
          6,
        );

        console.log(
          '🔍 DEBUG STREAM: retrieveContextSmart retornó:',
          retrievedDocs.length,
          'documentos',
        );
        console.log('🔍 DEBUG STREAM: Primer documento:', retrievedDocs[0]);
        // Filtrado inteligente por categorías y síntomas para máxima relevancia
        const queryLower = chatMessageDto.message.toLowerCase();

        // Detectar categoría médica de la consulta
        const medicalCategories = [
          'fiebre',
          'fever',
          'dolor',
          'pain',
          'tos',
          'cough',
          'dolor de cabeza',
          'headache',
          'náusea',
          'nausea',
          'vómito',
          'vomit',
          'diarrea',
          'diarrhea',
          'fatiga',
          'fatigue',
          'ansiedad',
          'anxiety',
          'depresión',
          'depression',
          'insomnio',
          'insomnia',
          'alergia',
          'allergy',
          'asma',
          'asthma',
          'diabetes',
          'hipertensión',
          'hypertension',
        ];

        const detectedCategory = medicalCategories.find((cat) =>
          queryLower.includes(cat.toLowerCase()),
        );

        // Filtrar documentos por categoría y síntoma si se detecta
        if (detectedCategory) {
          retrievedDocs = retrievedDocs.filter((doc) => {
            const docText = doc.text.toLowerCase();
            const docCategory = (
              doc.category ||
              doc.categoria ||
              ''
            ).toLowerCase();
            const docSymptom = (doc.symptom || doc.sintoma || '').toLowerCase();

            // Priorizar documentos que coincidan en categoría o síntoma
            const categoryMatch =
              docCategory.includes(detectedCategory.toLowerCase()) ||
              docSymptom.includes(detectedCategory.toLowerCase());

            // También considerar coincidencias en el texto principal
            const textMatch = docText.includes(detectedCategory.toLowerCase());

            return categoryMatch || textMatch;
          });
        }

        // Limitar a los 3 documentos más relevantes
        retrievedDocs = retrievedDocs.slice(0, 3);

        // SOLO usar contexto RAG si encontramos documentos en el idioma del usuario
        if (retrievedDocs.length > 0) {
          ragContext =
            '\n\nBasándome en información médica disponible:\n' +
            retrievedDocs.map((doc) => `${doc.text}`).join('\n');

          console.log(
            `✅ RAG Stream: Usando ${retrievedDocs.length} documentos en ${detectedLanguage}`,
          );
        } else {
          console.log(
            `⚠️ RAG Stream: No se encontraron documentos en ${detectedLanguage}`,
          );

          // FALLBACK: Si es español y no hay documentos, traducir al inglés e intentar RAG
          if (detectedLanguage === 'Español') {
            try {
              console.log(
                '🔄 RAG Fallback: Traduciendo consulta al inglés para búsqueda...',
              );

              // Traducir la consulta al inglés usando el modelo
              const translationPrompt = `Traduce la siguiente consulta médica del español al inglés. Solo responde con la traducción, sin explicaciones adicionales:

Consulta: "${chatMessageDto.message}"

Traducción:`;

              const translationRes =
                await model.generateContent(translationPrompt);
              const translatedQuery = translationRes.response.text().trim();

              console.log(
                `🔄 RAG Fallback: Consulta traducida: "${translatedQuery}"`,
              );

              // Intentar RAG con la consulta traducida
              const fallbackDocs = await retrieveContextSmart(
                translatedQuery,
                aiAnalysisStream,
                6,
              );

              if (fallbackDocs.length > 0) {
                // Filtrar por categoría si se detectó
                if (detectedCategory) {
                  fallbackDocs.filter((doc) => {
                    const docText = doc.text.toLowerCase();
                    const docCategory = (doc.category || '').toLowerCase();

                    const categoryMatch = docCategory.includes(
                      detectedCategory.toLowerCase(),
                    );

                    const textMatch = docText.includes(
                      detectedCategory.toLowerCase(),
                    );

                    return categoryMatch || textMatch;
                  });
                }

                // Limitar a los 3 documentos más relevantes
                const finalDocs = fallbackDocs.slice(0, 3);

                if (finalDocs.length > 0) {
                  ragContext =
                    '\n\nBasándome en información médica disponible:\n' +
                    finalDocs.map((doc) => `${doc.text}`).join('\n');

                  console.log(
                    `✅ RAG Fallback: Usando ${finalDocs.length} documentos en inglés como fallback`,
                  );
                } else {
                  console.log(
                    '⚠️ RAG Fallback: No se encontraron documentos relevantes después de la traducción',
                  );
                  ragContext = '';
                }
              } else {
                console.log(
                  '⚠️ RAG Fallback: No se encontraron documentos después de la traducción',
                );
                ragContext = '';
              }
            } catch (fallbackError) {
              console.error('Error en fallback de RAG:', fallbackError);
              ragContext = '';
            }
          } else {
            console.log('⚠️ RAG Stream: Continuando sin contexto RAG');
            ragContext = '';
          }
        }
      } catch (error) {
        console.error('Error retrieving RAG context:', error);
      }

      // Prompt optimizado para respuesta directa en HTML
      const prompt =
        getPatientChatPrompt(
          detectedLanguage,
          patient.title,
          processedInfo,
          chatMessageDto.message,
          patient.chat,
          onboardingQuestions,
          patient.chat.length === 0,
          ragContext,
        ) +
        `

IMPORTANTE: Responde DIRECTAMENTE en HTML limpio, NO en formato JSON.

🔹 FORMATO OBLIGATORIO:
- Usa SOLO HTML limpio: <div>, <p>, <ul>, <li>, <strong>
- NO uses JSON, markdown, ni bloques de código
- Responde de forma natural y conversacional
- Incluye la información médica disponible si la hay

✅ EJEMPLO DE RESPUESTA CORRECTA:
<div style="margin:10px">
  <p><strong>Basándome en información médica disponible:</strong></p>
  <p>Según estudios médicos, la aromaterapia con lavanda puede ayudar a reducir la ansiedad.</p>
  <ul>
    <li>Prueba aceite esencial de lavanda</li>
    <li>Practica respiración profunda</li>
  </ul>
</div>

❌ NO HACER:
- NO uses formato JSON
- NO uses markdown
- NO uses bloques de código`;

      // Log prompt details for validation
      this.logPromptDetails(
        'sendMessageStream',
        detectedLanguage,
        chatMessageDto.message,
        ragContext,
        prompt,
        retrievedDocs,
      );

      const streamResult = await model.generateContentStream(prompt);
      let aiResponse = '';
      for await (const chunk of streamResult.stream) {
        if (shouldContinue && !shouldContinue()) {
          break;
        }
        const text = chunk.text();
        if (text) {
          aiResponse += text;

          // Limpiar markdown del chunk ANTES de enviarlo al frontend
          const cleanText = cleanChunk(text);

          await onDelta(cleanText);
        }
      }

      // If client aborted, skip suggestions and persistence
      if (shouldContinue && !shouldContinue()) {
        return;
      }

      // Limpiar la respuesta final de markdown si aparece
      let cleanResponse = aiResponse;
      if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse
          .replace(/```\w*\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
      }

      // Generar sugerencias inteligentes basadas en la respuesta
      let suggestions: string[] = [];
      try {
        const suggestionsPrompt = `
          Basándote en esta respuesta del asistente médico, genera 4 sugerencias de respuesta que el usuario podría enviar a continuación.
          
          Respuesta del asistente:
          ${cleanResponse}
          
          Reglas:
          - Solo responde con un array JSON de 4 strings
          - Cada sugerencia debe ser una respuesta natural (máx 80 caracteres)
          - En el mismo idioma de la respuesta (${detectedLanguage})
          - NO uses signos de interrogación, deben ser respuestas, no preguntas
          - Si el asistente pidió información, ofrece respuestas a esa información
          
          Ejemplo de formato:
          ["Tengo 25 años", "No tomo medicamentos", "Duermo 6 horas", "Me siento estresado"]
          
          Sugerencias:`;

        const suggestionsResult =
          await model.generateContent(suggestionsPrompt);
        const suggestionsText = suggestionsResult.response.text();

        // Limpiar y parsear sugerencias
        let cleanSuggestions = suggestionsText;
        if (cleanSuggestions.includes('```json')) {
          cleanSuggestions = cleanSuggestions
            .replace(/```json\s*/, '')
            .replace(/\s*```$/, '');
        } else if (cleanSuggestions.includes('```')) {
          cleanSuggestions = cleanSuggestions
            .replace(/```\s*/, '')
            .replace(/\s*```$/, '');
        }

        try {
          const parsedSuggestions = JSON.parse(cleanSuggestions);
          if (Array.isArray(parsedSuggestions)) {
            suggestions = parsedSuggestions.slice(0, 4);
          }
        } catch {
          console.log(
            'No se pudieron parsear las sugerencias, usando fallback',
          );
        }
      } catch {
        console.log('Error generando sugerencias, usando fallback');
      }

      // Fallback: sugerencias básicas si falla la generación
      if (suggestions.length === 0) {
        if (detectedLanguage === 'Español') {
          suggestions = [
            'Tengo 30 años',
            'No tomo medicamentos',
            'Duermo 7 horas por noche',
            'Me siento bien en general',
          ];
        } else {
          suggestions = [
            'I am 30 years old',
            "I don't take any medications",
            'I sleep 7 hours per night',
            'I feel generally well',
          ];
        }
      }

      const userMessage: ChatMessage = {
        role: 'user',
        content: chatMessageDto.message,
        timestamp: new Date().toISOString(),
      };
      const aiMessage: ChatMessage = {
        role: 'ai',
        content: cleanResponse, // Usar la respuesta limpia
        timestamp: new Date().toISOString(),
        suggestions,
      };

      patient.chat.push(userMessage, aiMessage);
      patient.updatedAt = new Date().toISOString();
      this.patients.set(id, patient);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process message (stream)',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendEditedLastMessageStream(
    id: string,
    chatMessageDto: ChatMessageDto,
    onDelta: (delta: string) => Promise<void> | void,
    shouldContinue?: () => boolean,
  ): Promise<void> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }

    this.validateMessage(chatMessageDto.message);
    this.checkRateLimit(id);

    // Find last user turn (user + optional following ai)
    const lastUserIdx = [...patient.chat]
      .map((m) => m.role)
      .lastIndexOf('user');
    if (lastUserIdx === -1) {
      throw new HttpException(
        'No user message to edit',
        HttpStatus.BAD_REQUEST,
      );
    }

    const historyBefore = patient.chat.slice(0, lastUserIdx);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const baseInfoNarrative =
      typeof patient.info === 'string'
        ? patient.info
        : patientProfileToNarrative(patient.info);
    const processedInfo = processAndCleanPatientInfo(baseInfoNarrative);

    // Detectar idioma del mensaje editado
    const detectedLanguage = await this.detectLanguageWithAI(
      chatMessageDto.message,
    );

    const onboardingQuestions = buildMissingProfileQuestions(
      typeof patient.info === 'object'
        ? (patient.info as Record<string, unknown>)
        : undefined,
      detectedLanguage, // ← Pasar el idioma detectado
    );

    const prompt = getPatientChatPrompt(
      detectedLanguage,
      patient.title,
      processedInfo,
      chatMessageDto.message,
      historyBefore,
      onboardingQuestions,
      false,
      undefined, // ragContext
    );

    const streamResult = await model.generateContentStream(prompt);
    let aiResponse = '';
    for await (const chunk of streamResult.stream) {
      if (shouldContinue && !shouldContinue()) {
        break;
      }
      const text = chunk.text();
      if (text) {
        aiResponse += text;
        await onDelta(text);
      }
    }

    if (shouldContinue && !shouldContinue()) {
      return;
    }

    // Generate follow-up suggestions
    let suggestions: string[] = [];
    try {
      const { getFollowupSuggestionsPrompt } = await import('../utils/prompts');
      const suggModel = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 200,
          responseMimeType: 'application/json',
        },
      });
      const suggPrompt = getFollowupSuggestionsPrompt(
        patient.title,
        processedInfo,
        chatMessageDto.message,
        aiResponse,
      );
      const suggRes = await suggModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: suggPrompt }] }],
      });
      const text = suggRes.response.text();
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) {
        suggestions = (parsed as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 4);
      }
    } catch (error) {
      console.error(
        'Followup suggestion generation failed (non-fatal):',
        error,
      );
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatMessageDto.message,
      timestamp: new Date().toISOString(),
    };
    const aiMessage: ChatMessage = {
      role: 'ai',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      suggestions,
    };

    // Replace last turn: historyBefore + edited user + ai
    patient.chat = [...historyBefore, userMessage, aiMessage];
    patient.updatedAt = new Date().toISOString();
    this.patients.set(id, patient);
  }

  getConversation(id: string): ChatMessage[] {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    return patient.chat;
  }

  private detectLanguageFallback(text: string): 'Español' | 'English' {
    // Simple language detection based on common words
    const spanishWords = [
      'el',
      'la',
      'de',
      'que',
      'y',
      'en',
      'un',
      'es',
      'se',
      'no',
    ];
    const englishWords = [
      'the',
      'be',
      'to',
      'of',
      'and',
      'a',
      'in',
      'that',
      'have',
      'i',
    ];

    const words = text.toLowerCase().split(/\s+/);
    let spanishCount = 0;
    let englishCount = 0;

    for (const word of words) {
      if (spanishWords.includes(word)) spanishCount++;
      if (englishWords.includes(word)) englishCount++;
    }

    return spanishCount >= englishCount ? 'Español' : 'English';
  }

  private async detectLanguageWithAI(
    text: string,
  ): Promise<'Español' | 'English'> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
      You are a language detection expert. Analyze this text and determine if it's Spanish or English.

      Text: "${text}"

      CRITICAL RULES:
      - If the text contains ANY English words (the, and, I, you, etc.) → respond: {"language": "English"}
      - If the text contains ANY Spanish words (el, la, de, que, etc.) → respond: {"language": "Español"}
      - If the text is clearly English (even with simple words) → respond: {"language": "English"}
      - If the text is clearly Spanish → respond: {"language": "Español"}
      - Be VERY strict about English detection
      - Only respond with the JSON, nothing else

      Examples:
      - "I sleep well" → {"language": "English"}
      - "Duermo bien" → {"language": "Español"}
      - "Exactly, and I want to keep it that way" → {"language": "English"}
      - "I don't sleep well" → {"language": "English"}
      - "No duermo bien" → {"language": "Español"}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const parsed = JSON.parse(responseText);
        if (parsed.language === 'Español' || parsed.language === 'English') {
          console.log(
            `🔍 AI detected language: ${parsed.language} for text: "${text}"`,
          );
          return parsed.language;
        }
      } catch (parseError) {
        console.error(
          'Failed to parse AI language detection response:',
          parseError,
        );
      }

      // Fallback simple si la IA falla
      return this.detectLanguageFallback(text);
    } catch (error) {
      console.error('AI language detection failed, using fallback:', error);
      return this.detectLanguageFallback(text);
    }
  }

  /**
   * Usa la IA para detectar idioma Y categorizar automáticamente el mensaje del usuario
   * Una sola llamada que hace ambas cosas para optimizar costos y velocidad
   */
  private async detectLanguageAndCategorize(
    message: string,
  ): Promise<AIAnalysisResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
      You are a medical AI assistant that detects language AND categorizes user messages in ONE response.

      User message: "${message}"

      RESPOND WITH THIS EXACT JSON FORMAT:
      {
        "translation": "English translation if Spanish, or same if English",
        "category": "Mental Health|Natural Medicine|Wellness|Physical Health|General",
        "conditions": ["condition1", "condition2", "condition3"],
        "relevance_score": 0.95,
        "language": "Español|English"
      }

      LANGUAGE DETECTION RULES:
      - If the text contains ANY English words (the, and, I, you, etc.) → "English"
      - If the text contains ANY Spanish words (el, la, de, que, etc.) → "Español"
      - Be VERY strict about English detection

      CATEGORY RULES:
      - Mental Health: anxiety, depression, stress, insomnia, mood, psychology
      - Natural Medicine: herbs, essential oils, natural remedies, aromatherapy
      - Wellness: exercise, nutrition, sleep, general health, lifestyle
      - Physical Health: pain, fever, symptoms, specific medical conditions
      - General: unclear or mixed topics

      CONDITION EXAMPLES:
      - "Tengo ansiedad" → ["anxiety", "stress", "mental health"]
      - "No duermo bien" → ["insomnia", "sleep", "sleep quality"]
      - "Lavanda para relajarme" → ["lavender", "relaxation", "aromatherapy"]
      - "Ejercicio para bajar de peso" → ["exercise", "weight loss", "fitness"]

      Be specific and relevant. Only respond with the JSON.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const parsed = JSON.parse(responseText) as AIAnalysisResponse;

        // Validar que tenga todos los campos requeridos
        if (
          parsed.translation &&
          parsed.category &&
          Array.isArray(parsed.conditions) &&
          (parsed.language === 'Español' || parsed.language === 'English')
        ) {
          console.log(
            `🤖 AI detected language: ${parsed.language} and categorized: ${parsed.category} - ${parsed.conditions.join(', ')}`,
          );
          return parsed;
        }
      } catch (parseError) {
        console.error(
          'Failed to parse AI language detection and categorization response:',
          parseError,
        );
      }

      // Fallback si la IA falla
      return this.detectLanguageAndCategorizeFallback(message);
    } catch (error) {
      console.error(
        'AI language detection and categorization failed, using fallback:',
        error,
      );
      return this.detectLanguageAndCategorizeFallback(message);
    }
  }

  /**
   * Fallback para cuando la IA falla en detección y categorización
   */
  private detectLanguageAndCategorizeFallback(
    message: string,
  ): AIAnalysisResponse {
    // Detección simple de idioma
    const spanishBasic = [
      'el',
      'la',
      'de',
      'que',
      'y',
      'en',
      'un',
      'es',
      'se',
      'no',
    ];
    const englishBasic = [
      'the',
      'be',
      'to',
      'of',
      'and',
      'a',
      'in',
      'that',
      'have',
      'i',
    ];

    const words = message.toLowerCase().split(/\s+/);
    let spanishCount = 0;
    let englishCount = 0;

    for (const word of words) {
      if (spanishBasic.includes(word)) spanishCount++;
      if (englishBasic.includes(word)) englishCount++;
    }

    const detectedLanguage =
      spanishCount >= englishCount ? 'Español' : 'English';

    // Categorización simple basada en palabras clave
    const messageLower = message.toLowerCase();
    let category = 'General';
    let conditions: string[] = [];

    if (
      messageLower.includes('ansiedad') ||
      messageLower.includes('anxiety') ||
      messageLower.includes('depresión') ||
      messageLower.includes('depression') ||
      messageLower.includes('estrés') ||
      messageLower.includes('stress') ||
      messageLower.includes('insomnio') ||
      messageLower.includes('insomnia')
    ) {
      category = 'Mental Health';
      conditions = ['mental health', 'wellness'];
    } else if (
      messageLower.includes('lavanda') ||
      messageLower.includes('lavender') ||
      messageLower.includes('manzanilla') ||
      messageLower.includes('chamomile')
    ) {
      category = 'Natural Medicine';
      conditions = ['natural remedies', 'herbs'];
    } else if (
      messageLower.includes('ejercicio') ||
      messageLower.includes('exercise') ||
      messageLower.includes('nutrición') ||
      messageLower.includes('nutrition')
    ) {
      category = 'Wellness';
      conditions = ['wellness', 'lifestyle'];
    }

    console.log(
      `🔍 Fallback detected language: ${detectedLanguage} and category: ${category}`,
    );

    return {
      translation: message,
      category: category,
      conditions: conditions,
      relevance_score: 0.5,
      language: detectedLanguage,
    };
  }

  private generateWelcomeMessage(language: 'Español' | 'English'): string {
    if (language === 'English') {
      return '<div><p><strong>Hello</strong> 👋 I\'m your self-care assistant. To better guide you, I\'ll ask you some brief questions and then share safe advice.</p><div style="margin:10px" /><p>If you experience intense or sudden symptoms, please see a doctor in person.</p></div>';
    }

    return '<div><p><strong>Hola</strong> 👋 Soy tu asistente de autocuidado. Para orientarte mejor, te haré algunas preguntas breves y luego te compartiré consejos seguros.</p><div style="margin:10px" /><p>Si presentas síntomas intensos o repentinos, por favor acude a un médico presencial.</p></div>';
  }

  private generateInitialTitle(language: 'Español' | 'English'): string {
    if (language === 'English') {
      return 'Initial Consultation';
    }
    return 'Consulta Inicial';
  }

  private logPromptDetails(
    method: string,
    detectedLanguage: string,
    userMessage: string,
    ragContext: string,
    prompt: string,
    retrievedDocs?: any[],
  ) {
    console.log('\n' + '='.repeat(80));
    console.log(`🔍 PROMPT VALIDATION - ${method.toUpperCase()}`);
    console.log('='.repeat(80));

    console.log('\n📝 USER MESSAGE:');
    console.log(`"${userMessage}"`);

    console.log('\n🌐 LANGUAGE DETECTION:');
    console.log(`Detected: ${detectedLanguage}`);

    if (retrievedDocs && retrievedDocs.length > 0) {
      console.log('\n📚 RAG CONTEXT RETRIEVED:');
      retrievedDocs.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.text}`);
        console.log(`   Source: ${doc.source} (${doc.year})`);
      });
    }

    console.log('\n🔗 RAG CONTEXT FORMATTED:');
    console.log(ragContext || 'No RAG context available');

    console.log('\n🤖 FULL PROMPT GENERATED:');
    console.log('─'.repeat(60));
    console.log(prompt);
    console.log('─'.repeat(60));

    console.log('\n📊 PROMPT STATISTICS:');
    console.log(`- Total characters: ${prompt.length}`);
    console.log(`- Lines: ${prompt.split('\n').length}`);
    console.log(`- RAG context length: ${ragContext.length}`);
    console.log(`- User message length: ${userMessage.length}`);

    console.log('\n' + '='.repeat(80) + '\n');
  }

  private tokenizeForFilter(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Záéíóúñü0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !this.stopwords.has(w));
  }

  private getNegativeTermsForQuery(queryTokens: string[]): string[] {
    // Si la consulta habla de fiebre, evita documentos sobre depresión, etc.
    const negatives: string[] = [];
    const hasFever =
      queryTokens.includes('fiebre') || queryTokens.includes('fever');
    if (hasFever) {
      negatives.push('depresion', 'depression');
    }
    return negatives;
  }

  private stopwords: Set<string> = new Set([
    // ES
    'el',
    'la',
    'los',
    'las',
    'de',
    'del',
    'que',
    'y',
    'en',
    'un',
    'una',
    'es',
    'se',
    'no',
    'lo',
    'por',
    'con',
    'para',
    'al',
    'como',
    'mas',
    'más',
    'pero',
    'sus',
    'me',
    'hasta',
    'hay',
    'donde',
    'han',
    'quien',
    'estan',
    'están',
    'desde',
    'todo',
    'nos',
    'durante',
    'todos',
    'uno',
    'les',
    'ni',
    'contra',
    'otros',
    'ese',
    'eso',
    'ante',
    'ellos',
    'esto',
    'mi',
    'mí',
    'antes',
    'algunos',
    'unos',
    'yo',
    'otra',
    'otro',
    'otras',
    'mucho',
    'nada',
    'muchos',
    'cual',
    'cuales',
    'poco',
    'ella',
    'estar',
    'estas',
    'algunas',
    'algo',
    'nosotros',
    'tu',
    'tú',
    'te',
    'debe',
    'debes',
    'puedo',
    'puedes',
    'puede',
    'hacer',
    'hago',
    'haces',
    'hace',
    // EN
    'the',
    'be',
    'to',
    'of',
    'and',
    'a',
    'in',
    'that',
    'have',
    'i',
    'it',
    'for',
    'not',
    'on',
    'with',
    'he',
    'as',
    'you',
    'do',
    'at',
    'this',
    'but',
    'his',
    'by',
    'from',
    'they',
    'we',
    'say',
    'her',
    'she',
    'or',
    'an',
    'will',
    'my',
    'one',
    'all',
    'would',
    'there',
    'their',
    'what',
    'so',
    'up',
    'out',
    'if',
    'about',
    'who',
    'get',
    'which',
    'go',
    'me',
    'when',
    'make',
    'can',
    'like',
    'time',
    'just',
    'him',
    'know',
    'take',
    'people',
    'into',
    'year',
    'your',
    'good',
    'some',
    'could',
    'them',
    'see',
    'other',
    'than',
    'then',
    'now',
    'look',
    'only',
    'come',
    'its',
    'over',
    'think',
    'also',
    'back',
    'after',
    'use',
    'two',
    'how',
    'our',
    'work',
    'first',
    'well',
    'way',
    'even',
    'new',
    'want',
    'because',
    'any',
    'these',
    'give',
    'day',
    'most',
    'us',
  ]);
}
