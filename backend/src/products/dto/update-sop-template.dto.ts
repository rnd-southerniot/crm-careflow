import { IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SOPStepDto } from './create-sop-template.dto';

export class UpdateSOPTemplateDto {
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
