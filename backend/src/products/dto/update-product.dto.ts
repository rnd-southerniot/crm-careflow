import { IsString, IsOptional, IsUUID, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiProperty({ example: 'Solar Gateway Pro Updated', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'SOLAR-GW-PRO-002', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'parent-product-uuid', required: false })
  @IsOptional()
  @IsUUID()
  parentProductId?: string;

  @ApiProperty({ example: true, required: false, description: 'Enable or disable the product' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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