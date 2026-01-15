import { IsString, IsEmail, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOnboardingTaskDto {
  @ApiPropertyOptional({ example: 'cmk3iyuap0008455egxd0mdae', description: 'Existing client ID from dropdown' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'Client/Organization name (optional if clientId provided)' })
  @ValidateIf(o => !o.clientId)
  @IsString()
  clientName?: string;

  @ApiProperty({ example: 'contact@acme.com', description: 'Contact person email address' })
  @IsEmail()
  clientEmail: string;

  @ApiProperty({ example: '+1234567890', description: 'Contact person phone number' })
  @IsString()
  clientPhone: string;

  @ApiProperty({ example: '123 Main St, City, Country', description: 'Client address (can override client default)' })
  @ValidateIf(o => !o.clientId)
  @IsString()
  clientAddress?: string;

  @ApiProperty({ example: 'John Doe', description: 'Contact person name' })
  @IsString()
  contactPerson: string;

  @ApiProperty({ example: 'cmk3iyuap0008455egxd0mdae', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 'cmk3iyuap0008455egxd0mdae' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}