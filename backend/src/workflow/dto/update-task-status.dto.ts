import { IsString, IsOptional, IsDateString, ValidateNested, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for hardware procurement items (HARDWARE_PROCUREMENT_COMPLETE step)
 * Contains hardwareId and quantity - no serial numbers yet
 */
class HardwareProcurementItem {
    @ApiProperty({ example: 'cm123abc', description: 'ID of the hardware catalog item' })
    @IsString()
    hardwareId: string;

    @ApiProperty({ example: 2, description: 'Quantity to procure' })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ example: 'Urgent requirement', description: 'Notes about the procurement', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * DTO for device preparation items (HARDWARE_PREPARED_COMPLETE step)
 * Contains actual device details with serial numbers and firmware versions
 */
class DevicePreparationItem {
    @ApiProperty({ example: 'cm123abc', description: 'ID of the hardware catalog item' })
    @IsString()
    hardwareId: string;

    @ApiProperty({ example: 'SOLAR-GW-001-DEVICE-1', description: 'Unique device serial number' })
    @IsString()
    deviceSerial: string;

    @ApiProperty({ example: 'v1.0.2', description: 'Firmware version' })
    @IsString()
    firmwareVersion: string;

    @ApiProperty({ example: 'Device tested and working', description: 'Notes about the device', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateTaskStatusDto {
    @ApiProperty({ example: '2024-03-25T10:00:00Z', description: 'Scheduled date for visit', required: false })
    @IsOptional()
    @IsDateString()
    scheduledDate?: string;

    @ApiProperty({ type: [HardwareProcurementItem], description: 'List of hardware to procure (for HARDWARE_PROCUREMENT_COMPLETE)', required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HardwareProcurementItem)
    hardwareList?: HardwareProcurementItem[];

    @ApiProperty({ type: [DevicePreparationItem], description: 'List of prepared devices (for HARDWARE_PREPARED_COMPLETE)', required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DevicePreparationItem)
    deviceList?: DevicePreparationItem[];

    @ApiProperty({ description: 'Technical report data to submit', required: false })
    @IsOptional()
    reportData?: Record<string, any>;
}
