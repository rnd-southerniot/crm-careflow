import { IsUUID, IsArray, ValidateNested, IsNumber, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  TEXTAREA = 'textarea',
  CHECKBOX = 'checkbox',
  DATE = 'date',
}

export enum ValidationType {
  MIN = 'min',
  MAX = 'max',
  PATTERN = 'pattern',
  CUSTOM = 'custom',
}

export class SelectOptionDto {
  @ApiProperty({ example: 'indoor' })
  @IsString()
  value: string;

  @ApiProperty({ example: 'Indoor' })
  @IsString()
  label: string;
}

export class ValidationRuleDto {
  @ApiProperty({ enum: ValidationType, example: ValidationType.MIN })
  @IsEnum(ValidationType)
  type: ValidationType;

  @ApiProperty({ example: -120 })
  value: any;

  @ApiProperty({ example: 'Signal strength must be above -120 dBm' })
  @IsString()
  message: string;
}

export class FormFieldDto {
  @ApiProperty({ example: 'field-1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'signalStrength' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Signal Strength (dBm)' })
  @IsString()
  label: string;

  @ApiProperty({ enum: FieldType, example: FieldType.NUMBER })
  @IsEnum(FieldType)
  type: FieldType;

  @ApiProperty({ example: true })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ type: [ValidationRuleDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleDto)
  validation?: ValidationRuleDto[];

  @ApiProperty({ type: [SelectOptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectOptionDto)
  options?: SelectOptionDto[];

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;
}

export class CreateReportSchemaDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: [FormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  formStructure: FormFieldDto[];

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  version?: number;
}