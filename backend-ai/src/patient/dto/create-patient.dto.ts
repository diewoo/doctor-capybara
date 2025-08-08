import { PatientInfoInput } from '../interfaces/patient-profile.interface';

export class CreatePatientDto {
  // Puede ser string libre o un objeto perfilado
  patientInfo: PatientInfoInput;
}
