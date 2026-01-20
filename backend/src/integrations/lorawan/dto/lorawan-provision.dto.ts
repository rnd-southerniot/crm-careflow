import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LorawanDeviceDto {
  @ApiProperty({ description: 'Device provisioning ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Device serial number' })
  @IsString()
  deviceSerial: string;

  @ApiProperty({ description: 'Device type/hardware name' })
  @IsString()
  deviceType: string;

  @ApiProperty({ description: 'Firmware version' })
  @IsString()
  firmwareVersion: string;

  @ApiProperty({ description: 'Hardware catalog ID', required: false })
  @IsOptional()
  @IsString()
  hardwareId?: string;

  @ApiProperty({ description: '16-char hex Device EUI', required: false })
  @IsOptional()
  @IsString()
  devEui?: string;

  @ApiProperty({ description: '32-char hex Application Key', required: false })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LorawanGatewayDto {
  @ApiProperty({ description: 'Gateway device ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Gateway serial number' })
  @IsString()
  deviceSerial: string;

  @ApiProperty({ description: 'Gateway type' })
  @IsString()
  deviceType: string;

  @ApiProperty({ description: 'Firmware version' })
  @IsString()
  firmwareVersion: string;

  @ApiProperty({ description: '16-char hex Device EUI', required: false })
  @IsOptional()
  @IsString()
  devEui?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LorawanProvisionPayloadDto {
  @ApiProperty({ description: 'Event type identifier' })
  @IsString()
  eventType: string;

  @ApiProperty({ description: 'Onboarding task ID' })
  @IsString()
  taskId: string;

  @ApiProperty({ description: 'Client/tenant name for ChirpStack' })
  @IsString()
  clientName: string;

  @ApiProperty({ description: 'Client address' })
  @IsString()
  clientAddress: string;

  @ApiProperty({ description: 'Product name for ChirpStack application' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Product code' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: 'LoRaWAN region', required: false, example: 'EU868' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'Devices to provision', type: [LorawanDeviceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LorawanDeviceDto)
  devices?: LorawanDeviceDto[];

  @ApiProperty({ description: 'Gateway device', type: LorawanGatewayDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LorawanGatewayDto)
  gateway?: LorawanGatewayDto;

  @ApiProperty({ description: 'Contact email', required: false })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({ description: 'Contact phone', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: 'Gateway installation latitude', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Gateway installation longitude', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
