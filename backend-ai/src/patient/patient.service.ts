import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { Patient, ChatMessage } from './interfaces/patient.interface';
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
import {
  PatientInfoInput,
  PatientProfile,
} from './interfaces/patient-profile.interface';

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
    const rawInfo: unknown = createPatientDto.patientInfo as unknown;
    if (!this.isPatientInfoInput(rawInfo)) {
      throw new HttpException(
        'Invalid patient information format',
        HttpStatus.BAD_REQUEST,
      );
    }
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
      const baseInfoNarrativeRaw =
        typeof rawInfo === 'string'
          ? rawInfo
          : patientProfileToNarrative(rawInfo);
      const baseInfoNarrative = baseInfoNarrativeRaw.trim().length
        ? baseInfoNarrativeRaw
        : 'El usuario aún no ha compartido detalles. Genera un título breve y una descripción HTML inicial con saludo cordial, explicación de que harás algunas preguntas para personalizar consejos, y recordatorio de acudir a un médico presencial ante señales de alarma.';
      const prompt = getPatientTitleDescPrompt(baseInfoNarrative);
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const responseText = result.response.text();
      let response: PatientAnalysisResponse;

      try {
        response = JSON.parse(responseText) as PatientAnalysisResponse;
        if (!response.title || !response.htmlDescription) {
          throw new Error('Invalid response format');
        }
      } catch {
        // Fallback seguro si el modelo no devolvió JSON válido
        response = {
          title: 'Consulta inicial',
          htmlDescription:
            '<div><p><strong>Hola</strong> 👋 Soy tu asistente de autocuidado. Para orientarte mejor, te haré algunas preguntas breves y luego te compartiré consejos seguros.</p><div style="margin:10px" /><p>Si presentas síntomas intensos o repentinos, por favor acude a un médico presencial.</p></div>',
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
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.patients.set(patient.id, patient);
      return patient;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
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
      } catch {
        // Si falla la extracción, continuamos sin bloquear el chat
      }

      const onboardingQuestions = buildMissingProfileQuestions(
        typeof patient.info === 'object'
          ? (patient.info as Record<string, unknown>)
          : undefined,
      );
      const prompt = getPatientChatPrompt(
        patient.title,
        processedInfo,
        chatMessageDto.message,
        patient.chat,
        onboardingQuestions,
        patient.chat.length === 0,
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
      } catch {
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

  getConversation(id: string): ChatMessage[] {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    return patient.chat;
  }
}
