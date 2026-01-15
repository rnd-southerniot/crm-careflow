import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
    @ApiProperty({ example: 'Acme Corporation', description: 'Organization/Company name' })
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name: string;

    @ApiProperty({ example: '123 Main St, City, Country', description: 'Primary billing/shipping address' })
    @IsString()
    @MinLength(5)
    address: string;

    @ApiPropertyOptional({ example: 'Key client for industrial sensors', description: 'Optional notes about the client' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}
