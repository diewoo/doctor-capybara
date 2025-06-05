import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { Patient, ChatMessage } from './interfaces/patient.interface';

@Controller('/api/gemini/patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  async processPatientInfo(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    try {
      return await this.patientService.processPatientInfo(createPatientDto);
    } catch (error: unknown) {
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
}
