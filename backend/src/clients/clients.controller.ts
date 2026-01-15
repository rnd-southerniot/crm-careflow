import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard, RequirePermissions } from '../auth/guards/permissions.guard';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all clients' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'List of clients retrieved successfully' })
    @RequirePermissions('clients', ['read'])
    async findAll(@Query('includeInactive') includeInactive?: string) {
        return this.clientsService.findAll(includeInactive === 'true');
    }

    @Get('search')
    @ApiOperation({ summary: 'Search clients by name, address, or notes' })
    @ApiQuery({ name: 'q', required: true, type: String })
    @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
    @RequirePermissions('clients', ['read'])
    async search(@Query('q') query: string) {
        return this.clientsService.search(query || '');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get client by ID' })
    @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @RequirePermissions('clients', ['read'])
    async findById(@Param('id') id: string) {
        return this.clientsService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new client' })
    @ApiResponse({ status: 201, description: 'Client created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'Client with this name already exists' })
    @RequirePermissions('clients', ['create'])
    async create(@Body() createClientDto: CreateClientDto) {
        return this.clientsService.create(createClientDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a client' })
    @ApiResponse({ status: 200, description: 'Client updated successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @ApiResponse({ status: 409, description: 'Client name already in use' })
    @RequirePermissions('clients', ['update'])
    async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
        return this.clientsService.update(id, updateClientDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a client (soft delete if has tasks)' })
    @ApiResponse({ status: 200, description: 'Client deleted successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @RequirePermissions('clients', ['delete'])
    async delete(@Param('id') id: string) {
        return this.clientsService.delete(id);
    }

    @Post(':id/reactivate')
    @ApiOperation({ summary: 'Reactivate a soft-deleted client' })
    @ApiResponse({ status: 200, description: 'Client reactivated successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @ApiResponse({ status: 400, description: 'Client is already active' })
    @RequirePermissions('clients', ['update'])
    async reactivate(@Param('id') id: string) {
        return this.clientsService.reactivate(id);
    }
}
