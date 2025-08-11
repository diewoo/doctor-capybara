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
  getPatientTitleDescPrompt,
  getPatientChatPrompt,
  PatientAnalysisResponse,
} from '../utils/prompts';
import {
  processAndCleanPatientInfo,
  patientProfileToNarrative,
  buildMissingProfileQuestions,
} from '../utils/text-processor';
import { retrieveContext } from '../rag/retrieve';

// Constants for rate limiting and validation
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES_PER_MINUTE = 10;
const MAX_PATIENT_INFO_LENGTH = 5000;

@Injectable()
export class PatientService {
  private patients: Map<string, Patient> = new Map();
  private genAI: GoogleGenerativeAI;
  private messageCounts: Map<string, { count: number; timestamp: number }> =
    new Map();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
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
    const patientRate = this.messageCounts.get(patientId);

    if (patientRate) {
      if (patientRate.timestamp < minuteAgo) {
        // Reset if more than a minute has passed
        this.messageCounts.set(patientId, { count: 1, timestamp: now });
      } else if (patientRate.count >= MAX_MESSAGES_PER_MINUTE) {
        throw new HttpException(
          'Rate limit exceeded. Please wait before sending more messages.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        patientRate.count++;
        this.messageCounts.set(patientId, patientRate);
      }
    } else {
      this.messageCounts.set(patientId, { count: 1, timestamp: now });
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

      const onboardingQuestions = buildMissingProfileQuestions(
        typeof patient.info === 'object'
          ? (patient.info as Record<string, unknown>)
          : undefined,
      );

      // Obtener contexto RAG basado en la consulta del usuario
      let ragContext = '';
      // Usar idioma preferido si existe; de lo contrario, detectar y fijar
      let detectedLanguage: 'Español' | 'English' =
        patient.preferredLanguage ?? 'English';
      let retrievedDocs: any[] = []; // Default empty array

      try {
        // Determinar idioma solo si aún no está establecido
        if (!patient.preferredLanguage) {
          detectedLanguage = this.detectLanguage(chatMessageDto.message);
          patient.preferredLanguage = detectedLanguage;
        }
        console.log(
          `Detected language: ${detectedLanguage} for query: "${chatMessageDto.message}"`,
        );

        retrievedDocs = await retrieveContext(
          chatMessageDto.message,
          detectedLanguage,
          10, // Aumentado para mejor cobertura
        );

        // RAG mejorado ya filtra por categorías automáticamente
        // Solo limitar a los 3 documentos más relevantes
        retrievedDocs = retrievedDocs.slice(0, 3);

        if (retrievedDocs.length > 0) {
          ragContext =
            '\n\n📚 INFORMACIÓN MÉDICA RELEVANTE:\n' +
            retrievedDocs
              .map(
                (doc) => `• ${doc.text} (Fuente: ${doc.source}, ${doc.year})`,
              )
              .join('\n');
        }
      } catch (error) {
        console.error('Error retrieving RAG context:', error);
        // Continuar sin RAG si falla
      }

      const prompt = getPatientChatPrompt(
        patient.title,
        processedInfo,
        chatMessageDto.message,
        patient.chat,
        onboardingQuestions,
        patient.chat.length === 0,
        ragContext, // Pasar el contexto RAG
        detectedLanguage,
      );

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
      const aiResponse = result.response.text();
      if (typeof aiResponse !== 'string') {
        throw new Error('Invalid response from model');
      }

      // Generar sugerencias de seguimiento
      const { getFollowupSuggestionsPrompt } = await import('../utils/prompts');
      let suggestions: string[] = [];
      try {
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
          detectedLanguage,
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
        console.error('Error generating followup suggestions:', error);
        suggestions = [];
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

    this.validateMessage(chatMessageDto.message);
    this.checkRateLimit(id);

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

      const onboardingQuestions = buildMissingProfileQuestions(
        typeof patient.info === 'object'
          ? (patient.info as Record<string, unknown>)
          : undefined,
      );

      // Obtener contexto RAG basado en la consulta del usuario
      let ragContext = '';
      let detectedLanguage: 'Español' | 'English' =
        patient.preferredLanguage ?? 'English';
      let retrievedDocs: any[] = []; // Default empty array

      try {
        if (!patient.preferredLanguage) {
          detectedLanguage = this.detectLanguage(chatMessageDto.message);
          patient.preferredLanguage = detectedLanguage;
        }
        console.log(
          `Detected language: ${detectedLanguage} for query: "${chatMessageDto.message}"`,
        );

        retrievedDocs = await retrieveContext(
          chatMessageDto.message,
          detectedLanguage,
          6,
        );
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

        if (retrievedDocs.length > 0) {
          ragContext =
            '\n\n📚 INFORMACIÓN MÉDICA RELEVANTE:\n' +
            retrievedDocs
              .map(
                (doc) => `• ${doc.text} (Fuente: ${doc.source}, ${doc.year})`,
              )
              .join('\n');
        }
      } catch (error) {
        console.error('Error retrieving RAG context:', error);
      }

      const prompt = getPatientChatPrompt(
        patient.title,
        processedInfo,
        chatMessageDto.message,
        patient.chat,
        onboardingQuestions,
        patient.chat.length === 0,
        ragContext,
        detectedLanguage,
      );

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
          await onDelta(text);
        }
      }

      // If client aborted, skip suggestions and persistence
      if (shouldContinue && !shouldContinue()) {
        return;
      }

      // After stream completes, generate follow-up suggestions
      let suggestions: string[] = [];
      try {
        const { getFollowupSuggestionsPrompt } = await import(
          '../utils/prompts'
        );
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
          detectedLanguage,
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
    const onboardingQuestions = buildMissingProfileQuestions(
      typeof patient.info === 'object'
        ? (patient.info as Record<string, unknown>)
        : undefined,
    );

    const prompt = getPatientChatPrompt(
      patient.title,
      processedInfo,
      chatMessageDto.message,
      historyBefore,
      onboardingQuestions,
      false,
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

  private detectLanguage(text: string): 'Español' | 'English' {
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
      'te',
      'lo',
      'le',
      'da',
      'su',
      'por',
      'son',
      'con',
      'para',
      'al',
      'del',
      'los',
      'las',
      'una',
      'como',
      'más',
      'pero',
      'sus',
      'me',
      'hasta',
      'hay',
      'donde',
      'han',
      'quien',
      'están',
      'estado',
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
      'e',
      'esto',
      'mí',
      'antes',
      'algunos',
      'qué',
      'unos',
      'yo',
      'otro',
      'otras',
      'otra',
      'él',
      'tanto',
      'esa',
      'estos',
      'mucho',
      'quienes',
      'nada',
      'muchos',
      'cual',
      'poco',
      'ella',
      'estar',
      'estas',
      'algunas',
      'algo',
      'nosotros',
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
      'no',
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
