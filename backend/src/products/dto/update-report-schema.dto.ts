import { IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FormFieldDto } from './create-report-schema.dto';

export class UpdateReportSchemaDto {
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
