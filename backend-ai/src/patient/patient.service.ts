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
import { processAndCleanPatientInfo } from '../utils/text-processor';

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

  private validatePatientInfo(info: string): void {
    if (!info || typeof info !== 'string') {
      throw new HttpException(
        'Patient information is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (info.length > MAX_PATIENT_INFO_LENGTH) {
      throw new HttpException(
        `Patient information exceeds maximum length of ${MAX_PATIENT_INFO_LENGTH} characters`,
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
    this.validatePatientInfo(createPatientDto.patientInfo);

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
      const prompt = getPatientTitleDescPrompt(createPatientDto.patientInfo);
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
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new HttpException(
          `Failed to parse model response: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const patient: Patient = {
        id: uuidv4(),
        info: createPatientDto.patientInfo,
        title: response.title,
        htmlDescription: response.htmlDescription,
        chat: [],
        results: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

    patient.info = updatePatientDto.patientInfo as string;
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

      const processedInfo = processAndCleanPatientInfo(patient.info);
      const prompt = getPatientChatPrompt(
        patient.title,
        processedInfo,
        chatMessageDto.message,
        patient.chat,
      );

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();
      if (typeof aiResponse !== 'string') {
        throw new Error('Invalid response from model');
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
