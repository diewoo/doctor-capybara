import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { Patient, ChatMessage } from './interfaces/patient.interface';
import type { Response } from 'express';

@Controller('/api/gemini/patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  async processPatientInfo(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    console.log('Received request:', createPatientDto);
    try {
      return await this.patientService.processPatientInfo(createPatientDto);
    } catch (error: unknown) {
      console.error('Error in controller:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  getPatient(@Param('id') id: string): Patient {
    try {
      return this.patientService.getPatient(id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  @Get()
  listPatients(): Patient[] {
    try {
      return this.patientService.listPatients();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  updatePatient(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Patient {
    try {
      return this.patientService.updatePatient(id, updatePatientDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  @Post(':id/chat')
  async sendMessage(
    @Param('id') id: string,
    @Body() chatMessageDto: ChatMessageDto,
  ): Promise<ChatMessage> {
    try {
      return await this.patientService.sendMessage(id, chatMessageDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/conversation')
  getConversation(@Param('id') id: string): ChatMessage[] {
    try {
      return this.patientService.getConversation(id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  @Post(':id/chat/stream')
  async sendMessageStream(
    @Param('id') id: string,
    @Body() chatMessageDto: ChatMessageDto,
    @Res() res: Response,
  ) {
    // Setup Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const writeEvent = (data: unknown) =>
      new Promise<void>((resolve, reject) => {
        try {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

    try {
      let active = true;
      res.on?.('close', () => {
        active = false;
      });
      await this.patientService.sendMessageStream(
        id,
        chatMessageDto,
        async (delta: string) => {
          await writeEvent({ type: 'delta', delta });
        },
        () => active,
      );

      // Completed. Frontend will refresh conversation; we still signal done.
      await writeEvent({ type: 'done' });
      res.end();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      try {
        await writeEvent({ type: 'error', error: errorMessage });
      } finally {
        res.end();
      }
    }
  }

  @Post(':id/chat/edit/stream')
  async editLastMessageStream(
    @Param('id') id: string,
    @Body() chatMessageDto: ChatMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const writeEvent = (data: unknown) =>
      new Promise<void>((resolve, reject) => {
        try {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

    try {
      let active = true;
      res.on?.('close', () => {
        active = false;
      });
      await this.patientService.sendEditedLastMessageStream(
        id,
        chatMessageDto,
        async (delta: string) => {
          await writeEvent({ type: 'delta', delta });
        },
        () => active,
      );
      await writeEvent({ type: 'done' });
      res.end();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      try {
        await writeEvent({ type: 'error', error: errorMessage });
      } finally {
        res.end();
      }
    }
  }
}
