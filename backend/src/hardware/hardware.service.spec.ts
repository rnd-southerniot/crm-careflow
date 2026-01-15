import { Test, TestingModule } from '@nestjs/testing';
import { HardwareService } from './hardware.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

describe('HardwareService', () => {
  let service: HardwareService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;

  const mockPrismaService = {
    deviceProvisioning: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    onboardingTask: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationsService = {
    notifyDeviceProvisioned: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HardwareService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<HardwareService>(HardwareService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


});