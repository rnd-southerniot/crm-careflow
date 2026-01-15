import { Test, TestingModule } from '@nestjs/testing';
import { QrCodeService } from './qr-code.service';

describe('QrCodeService', () => {
  let service: QrCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrCodeService],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a QR code data URL', async () => {
    const testData = 'test-data';
    const qrCode = await service.generateQRCode(testData);
    
    expect(qrCode).toBeDefined();
    expect(qrCode).toMatch(/^data:image\/png;base64,/);
  });

  it('should generate device QR code with proper structure', async () => {
    const deviceSerial = 'DEV-TEST-123';
    const taskId = 'task-123';
    
    const qrCode = await service.generateDeviceQRCode(deviceSerial, taskId);
    
    expect(qrCode).toBeDefined();
    expect(qrCode).toMatch(/^data:image\/png;base64,/);
  });

  it('should generate unique device serials', () => {
    const serial1 = service.generateUniqueSerial();
    const serial2 = service.generateUniqueSerial();
    
    expect(serial1).toBeDefined();
    expect(serial2).toBeDefined();
    expect(serial1).not.toBe(serial2);
    expect(serial1).toMatch(/^DEV-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(serial2).toMatch(/^DEV-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it('should generate multiple unique serials', () => {
    const serials = new Set();
    
    // Generate 100 serials to test uniqueness
    for (let i = 0; i < 100; i++) {
      const serial = service.generateUniqueSerial();
      expect(serials.has(serial)).toBe(false);
      serials.add(serial);
    }
    
    expect(serials.size).toBe(100);
  });
});