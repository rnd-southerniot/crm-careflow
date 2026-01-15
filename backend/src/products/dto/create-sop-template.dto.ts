import { IsUUID, IsArray, ValidateNested, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SOPStepDto {
  @ApiProperty({ example: 'step-1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Site Survey' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Conduct initial site assessment' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({ example: 'IMPLEMENTATION_LEAD', required: false })
  @IsOptional()
  @IsString()
  requiredRole?: string;
}

export class CreateSOPTemplateDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: [SOPStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SOPStepDto)
  steps: SOPStepDto[];

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  version?: number;
}