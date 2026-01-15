import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTechnicalReportDto {
  @ApiProperty({ example: 'cmk3iyuap0008455egxd0mdae' })
  @IsString()
  taskId: string;

  @ApiProperty({ 
    example: { 
      signalStrength: -85, 
      installationLocation: 'rooftop',
      solarPanelWattage: 100,
      notes: 'Installation completed successfully'
    } 
  })
  @IsObject()
  submissionData: Record<string, any>;
}