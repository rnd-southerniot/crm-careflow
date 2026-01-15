import { Test, TestingModule } from '@nestjs/testing';
import { HardwareController } from './hardware.controller';
import { HardwareService } from './hardware.service';
import { QrCodeService } from './qr-code.service';
import { DeviceTrackingService } from './device-tracking.service';


describe('HardwareController', () => {
  let controller: HardwareController;
  let hardwareService: HardwareService;
  let qrCodeService: QrCodeService;
  let deviceTrackingService: DeviceTrackingService;

  const mockHardwareService = {
    create: jest.fn(),
    findByTaskId: jest.fn(),
    findBySerial: jest.fn(),
  };

  const mockQrCodeService = {
    generateUniqueSerial: jest.fn(),
    generateDeviceQRCode: jest.fn(),
  };

  const mockDeviceTrackingService = {
    isSerialUnique: jest.fn(),
    getDeviceHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HardwareController],
      providers: [
        {
          provide: HardwareService,
          useValue: mockHardwareService,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
        {
          provide: DeviceTrackingService,
          useValue: mockDeviceTrackingService,
        },
      ],
    }).compile();

    controller = module.get<HardwareController>(HardwareController);
    hardwareService = module.get<HardwareService>(HardwareService);
    qrCodeService = module.get<QrCodeService>(QrCodeService);
    deviceTrackingService = module.get<DeviceTrackingService>(DeviceTrackingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });


});