import { IsString, IsOptional, IsUUID, IsBoolean, IsIn } from 'class-validator';
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

  @ApiProperty({ example: false, required: false, description: 'Whether this product uses LoRaWAN connectivity' })
  @IsOptional()
  @IsBoolean()
  isLorawanProduct?: boolean;

  @ApiProperty({
    example: 'EU868',
    required: false,
    description: 'LoRaWAN region for the product',
    enum: ['EU868', 'US915', 'AU915', 'AS923', 'KR920', 'IN865'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['EU868', 'US915', 'AU915', 'AS923', 'KR920', 'IN865'])
  lorawanRegion?: string;
}