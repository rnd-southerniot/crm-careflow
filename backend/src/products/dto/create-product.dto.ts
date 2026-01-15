import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Solar Gateway Pro' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SOLAR-GW-PRO-001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Advanced IoT gateway for solar panel monitoring with enhanced features' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'parent-product-uuid', required: false })
  @IsOptional()
  @IsUUID()
  parentProductId?: string;
}