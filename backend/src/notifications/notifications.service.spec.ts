import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService, WhatsAppMessage } from './notifications.service';
import axios from 'axios';
import * as fc from 'fast-check';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let configService: ConfigService;

  const mockConfig = {
    WHATSAPP_API_URL: 'https://graph.facebook.com/v18.0',
    WHATSAPP_ACCESS_TOKEN: 'test-token',
    WHATSAPP_PHONE_NUMBER_ID: 'test-phone-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWhatsAppMessage', () => {
    it('should send message successfully on first attempt', async () => {
      const phoneNumber = '+1234567890';
      const message: WhatsAppMessage = {
        to: '',
        type: 'text',
        text: { body: 'Test message' },
      };

      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.sendWhatsAppMessage(phoneNumber, message);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test-phone-id/messages',
        {
          ...message,
          to: phoneNumber,
          messaging_product: 'whatsapp',
        },
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
    });

    it('should retry on failure and eventually succeed', async () => {
      const phoneNumber = '+1234567890';
      const message: WhatsAppMessage = {
        to: '',
        type: 'text',
        text: { body: 'Test message' },
      };

      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.sendWhatsAppMessage(phoneNumber, message);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retry attempts', async () => {
      const phoneNumber = '+1234567890';
      const message: WhatsAppMessage = {
        to: '',
        type: 'text',
        text: { body: 'Test message' },
      };

      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await service.sendWhatsAppMessage(phoneNumber, message);

      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should return false when credentials are not configured', async () => {
      // Create service with missing credentials
      const moduleWithoutCreds: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => ''), // Return empty string for all config values
            },
          },
        ],
      }).compile();

      const serviceWithoutCreds = moduleWithoutCreds.get<NotificationsService>(NotificationsService);
      
      const result = await serviceWithoutCreds.sendWhatsAppMessage('+1234567890', {
        to: '',
        type: 'text',
        text: { body: 'Test' },
      });

      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('notification templates', () => {
    it('should send task created notification', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.notifyTaskCreated('+1234567890', 'John Doe', 'IoT Device');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: {
            body: 'Hello John Doe! Your onboarding task for IoT Device has been created. Our team will contact you soon to schedule the next steps.',
          },
        }),
        expect.any(Object)
      );
    });

    it('should send report submitted notification', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.notifyReportSubmitted('+1234567890', 'Jane Smith', 'task-123');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: {
            body: 'Hello Jane Smith! Technical report for task task-123 has been submitted. We\'re now preparing your hardware for installation.',
          },
        }),
        expect.any(Object)
      );
    });

    it('should send device provisioned notification', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.notifyDeviceProvisioned('+1234567890', 'Bob Wilson', 'DEV-001');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: {
            body: 'Hello Bob Wilson! Your device (Serial: DEV-001) has been provisioned and is ready for installation. Our team will contact you to schedule the installation.',
          },
        }),
        expect.any(Object)
      );
    });

    it('should send task completed notification', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.notifyTaskCompleted('+1234567890', 'Alice Brown', 'Smart Sensor');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: {
            body: 'Hello Alice Brown! Your Smart Sensor installation has been completed successfully. Thank you for choosing our services!',
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe('checkWhatsAppApiHealth', () => {
    it('should return true when API is healthy', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.checkWhatsAppApiHealth();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test-phone-id',
        {
          headers: {
            'Authorization': 'Bearer test-token',
          },
          timeout: 5000,
        }
      );
    });

    it('should return false when API is unhealthy', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      const result = await service.checkWhatsAppApiHealth();

      expect(result).toBe(false);
    });

    it('should return false when credentials are not configured', async () => {
      const moduleWithoutCreds: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => ''),
            },
          },
        ],
      }).compile();

      const serviceWithoutCreds = moduleWithoutCreds.get<NotificationsService>(NotificationsService);
      
      const result = await serviceWithoutCreds.checkWhatsAppApiHealth();

      expect(result).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  // Property-based tests
  describe('Property-based tests', () => {
    // Feature: crm-workflow-system, Property 20: External Service Integration
    it('should handle any valid phone number and message combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 15 }).map(s => '+' + s.replace(/[^0-9]/g, '')),
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (phoneNumber, messageBody, clientName) => {
            // Mock successful response
            mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

            const result = await service.notifyTaskCreated(phoneNumber, clientName, 'Test Product');

            // Should always return boolean
            expect(typeof result).toBe('boolean');
            
            if (result) {
              // If successful, axios should have been called
              expect(mockedAxios.post).toHaveBeenCalled();
            }

            // Reset mock for next iteration
            mockedAxios.post.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: crm-workflow-system, Property 20: External Service Integration
    it('should maintain retry logic consistency for any error scenario', async () => {
      // Create a test service with shorter delays for testing
      const testModule: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => mockConfig[key]),
            },
          },
        ],
      }).compile();

      const testService = testModule.get<NotificationsService>(NotificationsService);
      
      // Override the delay method to make it faster for testing
      (testService as any).delay = jest.fn().mockResolvedValue(undefined);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 15 }).map(s => '+' + s.replace(/[^0-9]/g, '')),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (phoneNumber, messageBody) => {
            // Mock consistent failure
            mockedAxios.post.mockRejectedValue(new Error('Network error'));

            const message: WhatsAppMessage = {
              to: '',
              type: 'text',
              text: { body: messageBody },
            };

            const result = await testService.sendWhatsAppMessage(phoneNumber, message);

            // Should always return false on consistent failure
            expect(result).toBe(false);
            // Should always retry exactly 3 times
            expect(mockedAxios.post).toHaveBeenCalledTimes(3);

            // Reset mock for next iteration
            mockedAxios.post.mockClear();
          }
        ),
        { numRuns: 10 } // Reduced runs for faster execution
      );
    }, 10000); // 10 second timeout

    // Feature: crm-workflow-system, Property 20: External Service Integration
    it('should handle successful API responses consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 15 }).map(s => '+' + s.replace(/[^0-9]/g, '')),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (phoneNumber, clientName, productName) => {
            // Mock successful response
            mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

            const result = await service.notifyTaskCreated(phoneNumber, clientName, productName);

            // Should always return true on success
            expect(result).toBe(true);
            // Should call API exactly once
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);

            // Verify message structure
            const callArgs = mockedAxios.post.mock.calls[0];
            expect(callArgs[1]).toMatchObject({
              to: phoneNumber,
              messaging_product: 'whatsapp',
              type: 'text',
              text: {
                body: expect.stringContaining(clientName),
              },
            });

            // Reset mock for next iteration
            mockedAxios.post.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});