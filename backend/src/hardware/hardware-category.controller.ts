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
import { HardwareCategoryService, CreateHardwareCategoryDto, UpdateHardwareCategoryDto } from './hardware-category.service';

@Controller('hardware-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HardwareCategoryController {
    constructor(private readonly categoryService: HardwareCategoryService) { }

    @Get()
    async findAll(@Query('includeInactive') includeInactive?: string) {
        return this.categoryService.findAll(includeInactive === 'true');
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.categoryService.findById(id);
    }

    @Post()
    @Roles('ADMIN')
    async create(@Body() data: CreateHardwareCategoryDto) {
        return this.categoryService.create(data);
    }

    @Put(':id')
    @Roles('ADMIN')
    async update(@Param('id') id: string, @Body() data: UpdateHardwareCategoryDto) {
        return this.categoryService.update(id, data);
    }

    @Delete(':id')
    @Roles('ADMIN')
    async delete(@Param('id') id: string) {
        return this.categoryService.delete(id);
    }

    @Post(':id/reactivate')
    @Roles('ADMIN')
    async reactivate(@Param('id') id: string) {
        return this.categoryService.reactivate(id);
    }
}
