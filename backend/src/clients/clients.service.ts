import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Client, Prisma } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Retrieves all clients.
     *
     * @param includeInactive - Whether to include inactive clients in the result. Defaults to false.
     * @returns A list of clients.
     */
    async findAll(includeInactive = false): Promise<Client[]> {
        return this.prisma.client.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { onboardingTasks: true },
                },
            },
        });
    }

    /**
     * Retrieves a single client by ID.
     *
     * @param id - The ID of the client to retrieve.
     * @returns The client object including onboarding tasks and task counts.
     * @throws NotFoundException if the client is not found.
     */
    async findById(id: string): Promise<any> {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                onboardingTasks: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        assignedUser: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                _count: {
                    select: { onboardingTasks: true },
                },
            },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        return client;
    }

    /**
     * Finds a client by name.
     *
     * @param name - The name of the client.
     * @returns The client object if found, or null otherwise.
     */
    async findByName(name: string): Promise<Client | null> {
        return this.prisma.client.findUnique({
            where: { name },
        });
    }

    /**
     * Creates a new client.
     *
     * @param data - The data for the new client.
     * @returns The created client object.
     * @throws ConflictException if a client with the same name already exists.
     */
    async create(data: CreateClientDto): Promise<Client> {
        // Check if client with same name exists
        const existing = await this.findByName(data.name);
        if (existing) {
            throw new ConflictException(`Client with name "${data.name}" already exists`);
        }

        return this.prisma.client.create({
            data: {
                name: data.name,
                address: data.address,
                notes: data.notes,
            },
            include: {
                _count: {
                    select: { onboardingTasks: true },
                },
            },
        });
    }

    /**
     * Updates an existing client.
     *
     * @param id - The ID of the client to update.
     * @param data - The data to update.
     * @returns The updated client object.
     * @throws NotFoundException if the client is not found.
     * @throws ConflictException if the new name is already taken by another client.
     */
    async update(id: string, data: UpdateClientDto): Promise<Client> {
        // Check if client exists
        await this.findById(id);

        // If updating name, check for conflicts
        if (data.name) {
            const existing = await this.findByName(data.name);
            if (existing && existing.id !== id) {
                throw new ConflictException(`Client with name "${data.name}" already exists`);
            }
        }

        return this.prisma.client.update({
            where: { id },
            data,
            include: {
                _count: {
                    select: { onboardingTasks: true },
                },
            },
        });
    }

    /**
     * Deletes a client. Soft deletes if the client has associated tasks, otherwise hard deletes.
     *
     * @param id - The ID of the client to delete.
     * @returns The deleted client object.
     * @throws NotFoundException if the client is not found.
     */
    async delete(id: string): Promise<Client> {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { onboardingTasks: true },
                },
            },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        // Check if client has associated tasks
        if (client._count.onboardingTasks > 0) {
            // Soft delete by setting isActive to false
            return this.prisma.client.update({
                where: { id },
                data: { isActive: false },
                include: {
                    _count: {
                        select: { onboardingTasks: true },
                    },
                },
            });
        }

        // Hard delete if no tasks
        return this.prisma.client.delete({
            where: { id },
        });
    }

    /**
     * Reactivates a soft-deleted client.
     *
     * @param id - The ID of the client to reactivate.
     * @returns The reactivated client object.
     * @throws NotFoundException if the client is not found.
     * @throws BadRequestException if the client is already active.
     */
    async reactivate(id: string): Promise<Client> {
        const client = await this.prisma.client.findUnique({
            where: { id },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        if (client.isActive) {
            throw new BadRequestException('Client is already active');
        }

        return this.prisma.client.update({
            where: { id },
            data: { isActive: true },
            include: {
                _count: {
                    select: { onboardingTasks: true },
                },
            },
        });
    }

    /**
     * Searches for clients by query string.
     *
     * @param query - The search query (matches name, address, or notes).
     * @returns A list of matching clients.
     */
    async search(query: string): Promise<Client[]> {
        return this.prisma.client.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { address: { contains: query, mode: 'insensitive' } },
                    { notes: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { name: 'asc' },
            take: 20,
        });
    }
}
