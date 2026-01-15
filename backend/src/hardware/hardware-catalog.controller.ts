import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HardwareCatalogService, CreateHardwareDto, UpdateHardwareDto } from './hardware-catalog.service';

@Controller('hardware-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HardwareCatalogController {
    constructor(private readonly hardwareCatalogService: HardwareCatalogService) { }

    @Get()
    async findAll(@Query('includeInactive') includeInactive?: string) {
        return this.hardwareCatalogService.findAll(includeInactive === 'true');
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.hardwareCatalogService.findById(id);
    }

    @Post()
    @Roles('ADMIN')
    async create(@Body() data: CreateHardwareDto) {
        return this.hardwareCatalogService.create(data);
    }

    @Put(':id')
    @Roles('ADMIN')
    async update(@Param('id') id: string, @Body() data: UpdateHardwareDto) {
        return this.hardwareCatalogService.update(id, data);
    }

    @Delete(':id')
    @Roles('ADMIN')
    async delete(@Param('id') id: string, @Query('hard') hard?: string) {
        if (hard === 'true') {
            return this.hardwareCatalogService.hardDelete(id);
        }
        return this.hardwareCatalogService.delete(id);
    }

    @Get('by-category/:categoryId')
    async getByCategoryId(@Param('categoryId') categoryId: string) {
        return this.hardwareCatalogService.getByCategoryId(categoryId);
    }
}

