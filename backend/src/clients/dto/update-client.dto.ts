import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto {
    @ApiPropertyOptional({ example: 'Acme Corporation Updated', description: 'Organization/Company name' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name?: string;

    @ApiPropertyOptional({ example: '456 New St, City, Country', description: 'Primary billing/shipping address' })
    @IsOptional()
    @IsString()
    @MinLength(5)
    address?: string;

    @ApiPropertyOptional({ example: 'Updated notes', description: 'Optional notes about the client' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;

    @ApiPropertyOptional({ example: true, description: 'Whether the client is active' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
