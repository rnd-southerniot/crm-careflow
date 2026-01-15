import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
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
}