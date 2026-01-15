import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { TaskStatus } from '@prisma/client';

describe('Workflow Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let salesToken: string;
  let implementationToken: string;
  let hardwareToken: string;

  // Test data IDs
  let adminUserId: string;
  let salesUserId: string;
  let implementationUserId: string;
  let hardwareUserId: string;
  let productId: string;
  let onboardingTaskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up any existing test data
    await cleanupTestData();

    // Set up test data
    await setupTestData();

    // Get authentication tokens
    await authenticateUsers();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    // Clean up in reverse dependency order
    await prisma.deviceProvisioning.deleteMany({
      where: {
        task: {
          clientName: {
            startsWith: 'client-'
          }
        }
      }
    });
    await prisma.technicalReport.deleteMany({
      where: {
        task: {
          clientName: {
            startsWith: 'client-'
          }
        }
      }
    });
    await prisma.onboardingTask.deleteMany({
      where: {
        clientName: {
          startsWith: 'client-'
        }
      }
    });
    await prisma.reportSchema.deleteMany({
      where: {
        product: {
          code: {
            startsWith: 'TEST-'
          }
        }
      }
    });
    await prisma.sOPTemplate.deleteMany({
      where: {
        product: {
          code: {
            startsWith: 'TEST-'
          }
        }
      }
    });
    await prisma.product.deleteMany({
      where: {
        code: {
          startsWith: 'TEST-'
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin-test@arits.ltd', 'sales-test@arits.ltd', 'impl-test@arits.ltd', 'hardware-test@arits.ltd']
        }
      }
    });
    // Don't delete roles - reuse existing ones from seed data
  }

  async function setupTestData() {
    // Find existing roles from seed data
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const salesRole = await prisma.role.findUnique({ where: { name: 'SALES' } });
    const implementationRole = await prisma.role.findUnique({ where: { name: 'IMPLEMENTATION_LEAD' } });
    const hardwareRole = await prisma.role.findUnique({ where: { name: 'HARDWARE_ENGINEER' } });

    if (!adminRole || !salesRole || !implementationRole || !hardwareRole) {
      throw new Error('Required roles not found in database. Please run seed data first.');
    }

    // Create test users
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin-test@arits.ltd',
        passwordHash: hashedPassword,
        fullName: 'Admin Test User',
        roleId: adminRole.id,
      },
    });

    const salesUser = await prisma.user.create({
      data: {
        email: 'sales-test@arits.ltd',
        passwordHash: hashedPassword,
        fullName: 'Sales Test User',
        roleId: salesRole.id,
      },
    });

    const implementationUser = await prisma.user.create({
      data: {
        email: 'impl-test@arits.ltd',
        passwordHash: hashedPassword,
        fullName: 'Implementation Test User',
        roleId: implementationRole.id,
      },
    });

    const hardwareUser = await prisma.user.create({
      data: {
        email: 'hardware-test@arits.ltd',
        passwordHash: hashedPassword,
        fullName: 'Hardware Test User',
        roleId: hardwareRole.id,
      },
    });

    // Store user IDs
    adminUserId = adminUser.id;
    salesUserId = salesUser.id;
    implementationUserId = implementationUser.id;
    hardwareUserId = hardwareUser.id;

    // Create test product with SOP template and report schema
    const product = await prisma.product.create({
      data: {
        name: 'Test IoT Device',
        code: 'TEST-IOT-001',
        description: 'Test IoT device for integration testing',
      },
    });

    productId = product.id;
    console.log('Created product with ID:', productId);

    // Create SOP template
    await prisma.sOPTemplate.create({
      data: {
        productId: product.id,
        steps: [
          {
            id: 'step-1',
            title: 'Site Survey',
            description: 'Conduct initial site assessment',
            order: 1,
            estimatedDuration: 30,
            requiredRole: 'IMPLEMENTATION_LEAD',
          },
          {
            id: 'step-2',
            title: 'Signal Testing',
            description: 'Test cellular signal strength',
            order: 2,
            estimatedDuration: 15,
            requiredRole: 'IMPLEMENTATION_LEAD',
          },
          {
            id: 'step-3',
            title: 'Device Installation',
            description: 'Install and configure the device',
            order: 3,
            estimatedDuration: 45,
            requiredRole: 'HARDWARE_ENGINEER',
          },
        ],
        version: 1,
      },
    });

    // Create report schema
    await prisma.reportSchema.create({
      data: {
        productId: product.id,
        formStructure: [
          {
            id: 'field-1',
            name: 'signalStrength',
            label: 'Signal Strength (dBm)',
            type: 'number',
            required: true,
            validation: [
              {
                type: 'min',
                value: -120,
                message: 'Signal strength must be above -120 dBm',
              },
            ],
            order: 1,
          },
          {
            id: 'field-2',
            name: 'installationLocation',
            label: 'Installation Location',
            type: 'select',
            required: true,
            options: [
              { value: 'indoor', label: 'Indoor' },
              { value: 'outdoor', label: 'Outdoor' },
            ],
            order: 2,
          },
          {
            id: 'field-3',
            name: 'notes',
            label: 'Installation Notes',
            type: 'textarea',
            required: false,
            order: 3,
          },
        ],
        version: 1,
      },
    });
  }

  async function authenticateUsers() {
    // Authenticate admin user
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-test@arits.ltd',
        password: 'testpassword123',
      })
      .expect(201);
    adminToken = adminResponse.body.access_token;

    // Authenticate sales user
    const salesResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'sales-test@arits.ltd',
        password: 'testpassword123',
      })
      .expect(201);
    salesToken = salesResponse.body.access_token;

    // Authenticate implementation user
    const implementationResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'impl-test@arits.ltd',
        password: 'testpassword123',
      })
      .expect(201);
    implementationToken = implementationResponse.body.access_token;

    // Authenticate hardware user
    const hardwareResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'hardware-test@arits.ltd',
        password: 'testpassword123',
      })
      .expect(201);
    hardwareToken = hardwareResponse.body.access_token;
  }

  describe('Complete Workflow Cycle', () => {
    it('should complete a full workflow from initialization to installation', async () => {
      // Step 1: Sales creates onboarding task (INITIALIZATION)
      const createTaskResponse = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-test-001',
          clientEmail: 'test@example.com',
          clientPhone: '555-0100',
          clientAddress: '123 Test St',
          contactPerson: 'Test Contact',
          productId: productId,
        });

      expect(createTaskResponse.status).toBe(201);
      onboardingTaskId = createTaskResponse.body.id;
      expect(createTaskResponse.body.currentStatus).toBe(TaskStatus.INITIALIZATION);

      // Step 2: Implementation Lead schedules visit (SCHEDULED_VISIT)
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 7);

      const scheduleResponse = await request(app.getHttpServer())
        .put(`/workflow/tasks/${onboardingTaskId}/status/${TaskStatus.SCHEDULED_VISIT}`)
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          scheduledDate: scheduleDate.toISOString(),
        });

      expect(scheduleResponse.status).toBe(200);
      expect(scheduleResponse.body.currentStatus).toBe(TaskStatus.SCHEDULED_VISIT);
      expect(scheduleResponse.body.scheduledDate).toBeDefined();

      // Step 3: Implementation Lead submits technical report (REQUIREMENTS_COMPLETE)
      // First, submit the report
      const reportResponse = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: onboardingTaskId,
          submissionData: {
            signalStrength: -75,
            installationLocation: 'outdoor',
            notes: 'Good signal strength, outdoor installation recommended',
          },
        });
      expect(reportResponse.status).toBe(201);

      // Then, update status
      const reqCompleteResponse = await request(app.getHttpServer())
        .put(`/workflow/tasks/${onboardingTaskId}/status/${TaskStatus.REQUIREMENTS_COMPLETE}`)
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({});

      expect(reqCompleteResponse.status).toBe(200);
      expect(reqCompleteResponse.body.currentStatus).toBe(TaskStatus.REQUIREMENTS_COMPLETE);

      // Step 4: Hardware Engineer submits hardware list (HARDWARE_PROCUREMENT_COMPLETE)
      const hardwareList = [
        { deviceSerial: 'TEST-DEV-001', deviceType: 'Gateway', firmwareVersion: '1.0.0' },
        { deviceSerial: 'TEST-DEV-002', deviceType: 'Sensor', firmwareVersion: '1.0.0' }
      ];

      const procurementResponse = await request(app.getHttpServer())
        .put(`/workflow/tasks/${onboardingTaskId}/status/${TaskStatus.HARDWARE_PROCUREMENT_COMPLETE}`)
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({ hardwareList });

      expect(procurementResponse.status).toBe(200);
      expect(procurementResponse.body.currentStatus).toBe(TaskStatus.HARDWARE_PROCUREMENT_COMPLETE);
      expect(procurementResponse.body.deviceProvisionings).toHaveLength(2);

      // Step 5: Hardware Engineer marks prepared (HARDWARE_PREPARED_COMPLETE)
      const preparedResponse = await request(app.getHttpServer())
        .put(`/workflow/tasks/${onboardingTaskId}/status/${TaskStatus.HARDWARE_PREPARED_COMPLETE}`)
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({});

      expect(preparedResponse.status).toBe(200);
      expect(preparedResponse.body.currentStatus).toBe(TaskStatus.HARDWARE_PREPARED_COMPLETE);

      // Step 6: Hardware Engineer marks ready (READY_FOR_INSTALLATION) - Triggers QR
      const readyResponse = await request(app.getHttpServer())
        .put(`/workflow/tasks/${onboardingTaskId}/status/${TaskStatus.READY_FOR_INSTALLATION}`)
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({});

      expect(readyResponse.status).toBe(200);
      expect(readyResponse.body.currentStatus).toBe(TaskStatus.READY_FOR_INSTALLATION);

      // Verify QR codes generated
      const devices = readyResponse.body.deviceProvisionings;
      expect(devices[0].qrCode).toContain('QR-TEST-DEV-001');
      expect(devices[1].qrCode).toContain('QR-TEST-DEV-002');
    });
  });

  describe('Role-Based Access Control Integration', () => {
    beforeEach(async () => {
      // Create a fresh task for each test
      const createTaskResponse = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-rbac-test',
          clientEmail: 'rbac@example.com',
          clientPhone: '555-0101',
          clientAddress: '123 RBAC St',
          contactPerson: 'RBAC user',
          productId: productId,
        })
        .expect(201);
      onboardingTaskId = createTaskResponse.body.id;
    });

    it('should enforce role-based access for task creation', async () => {
      // Implementation Lead should NOT be able to create tasks
      await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          clientName: 'client-unauthorized',
          clientEmail: 'unauth@example.com',
          clientPhone: '555-0102',
          clientAddress: '123 Unauth St',
          contactPerson: 'Unauthorized User',
          productId: productId,
        })
        .expect(403);

      // Hardware Engineer should NOT be able to create tasks
      await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({
          clientId: 'client-unauthorized',
          productId: productId,
        })
        .expect(403);
    });

    it('should enforce role-based access for report submission', async () => {
      // Sales should NOT be able to submit reports
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          taskId: onboardingTaskId,
          submissionData: {
            signalStrength: -80,
            installationLocation: 'indoor',
          },
        })
        .expect(403);

      // Hardware Engineer should NOT be able to submit reports
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({
          taskId: onboardingTaskId,
          submissionData: {
            signalStrength: -80,
            installationLocation: 'indoor',
          },
        })
        .expect(403);
    });

    it('should enforce role-based access for device provisioning', async () => {
      // Sales should NOT be able to provision devices
      await request(app.getHttpServer())
        .post('/hardware/provision')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          taskId: onboardingTaskId,
          deviceSerial: 'UNAUTHORIZED-001',
          deviceType: 'IoT Sensor',
          firmwareVersion: '1.0.0',
        })
        .expect(403);

      // Implementation Lead should NOT be able to provision devices
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: onboardingTaskId,
          submissionData: {
            signalStrength: -80,
            installationLocation: 'indoor',
          },
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/hardware/provision')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: onboardingTaskId,
          deviceSerial: 'UNAUTHORIZED-002',
          deviceType: 'IoT Sensor',
          firmwareVersion: '1.0.0',
        })
        .expect(403);
    });
  });

  describe('Task Assignment Logic', () => {
    it('should assign tasks based on workflow stage and role requirements', async () => {
      // Create task as sales user
      const createTaskResponse = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-assignment-test',
          clientEmail: 'assign@example.com',
          clientPhone: '555-0103',
          clientAddress: '123 Assign St',
          contactPerson: 'Assign User',
          productId: productId,
        })
        .expect(201);

      const taskId = createTaskResponse.body.id;

      // Task should initially be unassigned or assigned to sales
      expect(createTaskResponse.body.assignedUserId).toBeNull();

      // When implementation lead submits report, task should be assigned to them
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: taskId,
          submissionData: {
            signalStrength: -85,
            installationLocation: 'indoor',
          },
        })
        .expect(201);

      // Schedule visit first
      await request(app.getHttpServer())
        .put(`/workflow/tasks/${taskId}/status/${TaskStatus.SCHEDULED_VISIT}`)
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          scheduledDate: new Date().toISOString(),
        })
        .expect(200);

      // Update status manually
      await request(app.getHttpServer())
        .put(`/workflow/tasks/${taskId}/status/${TaskStatus.REQUIREMENTS_COMPLETE}`)
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({})
        .expect(200);

      // Check task assignment after report submission
      const taskAfterReport = await prisma.onboardingTask.findUnique({
        where: { id: taskId },
        include: { assignedUser: true },
      });

      expect(taskAfterReport.currentStatus).toBe(TaskStatus.REQUIREMENTS_COMPLETE);

      // When hardware engineer provisions device (via status update), task should be assigned to them
      await request(app.getHttpServer())
        .put(`/workflow/tasks/${taskId}/status/${TaskStatus.HARDWARE_PROCUREMENT_COMPLETE}`)
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({
          hardwareList: [{
            deviceSerial: 'ASSIGNMENT-TEST-001',
            deviceType: 'IoT Sensor',
            firmwareVersion: '1.0.0'
          }]
        })
        .expect(200);

      // Advance to READY_FOR_INSTALLATION
      await request(app.getHttpServer())
        .put(`/workflow/tasks/${taskId}/status/${TaskStatus.HARDWARE_PREPARED_COMPLETE}`)
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({})
        .expect(200);

      await request(app.getHttpServer())
        .put(`/workflow/tasks/${taskId}/status/${TaskStatus.READY_FOR_INSTALLATION}`)
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({})
        .expect(200);

      // Check final task assignment
      const finalTask = await prisma.onboardingTask.findUnique({
        where: { id: taskId },
        include: { assignedUser: true },
      });

      expect(finalTask.currentStatus).toBe(TaskStatus.READY_FOR_INSTALLATION);
    });
  });

  describe('Data Consistency Verification', () => {
    it('should maintain referential integrity across all operations', async () => {
      // Create complete workflow
      const createTaskResponse = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-consistency-test',
          clientEmail: 'consist@example.com',
          clientPhone: '555-0104',
          clientAddress: '123 Consist St',
          contactPerson: 'Consist User',
          productId: productId,
        })
        .expect(201);

      const taskId = createTaskResponse.body.id;

      // Submit report
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: taskId,
          submissionData: {
            signalStrength: -70,
            installationLocation: 'outdoor',
            notes: 'Excellent signal strength',
          },
        })
        .expect(201);

      // Provision device
      await request(app.getHttpServer())
        .post('/hardware/provision')
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({
          taskId: taskId,
          deviceSerial: 'CONSISTENCY-TEST-001',
          deviceType: 'IoT Sensor',
          firmwareVersion: '1.0.0',
          notes: 'Device tested and ready',
        })
        .expect(201);

      // Verify all relationships are maintained
      const completeTask = await prisma.onboardingTask.findUnique({
        where: { id: taskId },
        include: {
          product: {
            include: {
              sopTemplate: true,
              reportSchema: true,
            },
          },
          technicalReports: {
            include: {
              submitter: {
                include: {
                  role: true,
                },
              },
            },
          },
          deviceProvisionings: {
            include: {
              provisioner: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      });

      // Verify all relationships exist and are correct
      expect(completeTask).toBeDefined();
      expect(completeTask.product).toBeDefined();
      expect(completeTask.product.sopTemplate).toBeDefined();
      expect(completeTask.product.reportSchema).toBeDefined();
      expect(completeTask.technicalReports).toHaveLength(1);
      expect(completeTask.deviceProvisionings).toHaveLength(1);

      // Verify user roles are correct
      expect(completeTask.technicalReports[0].submitter.role.name).toBe('IMPLEMENTATION_LEAD');
      expect(completeTask.deviceProvisionings[0].provisioner.role.name).toBe('HARDWARE_ENGINEER');

      // Verify JSONB data integrity
      expect(completeTask.sopSnapshot).toHaveLength(3);
      expect(completeTask.technicalReports[0].submissionData).toEqual({
        signalStrength: -70,
        installationLocation: 'outdoor',
        notes: 'Excellent signal strength',
      });

      // Verify foreign key constraints
      expect(completeTask.productId).toBe(productId);
      expect(completeTask.technicalReports[0].taskId).toBe(taskId);
      expect(completeTask.deviceProvisionings[0].taskId).toBe(taskId);
    });

    it('should handle concurrent operations without data corruption', async () => {
      // Create multiple tasks concurrently
      const taskPromises = Array.from({ length: 3 }, (_, i) =>
        request(app.getHttpServer())
          .post('/workflow/tasks')
          .set('Authorization', `Bearer ${salesToken}`)
          .send({
            clientName: `client-concurrent-${i}`,
            clientEmail: `concurrent-${i}@example.com`,
            clientPhone: `555-0105-${i}`,
            clientAddress: `123 Concurrent St ${i}`,
            contactPerson: `Concurrent User ${i}`,
            productId: productId,
          })
      );

      const taskResponses = await Promise.all(taskPromises);

      // Verify all tasks were created successfully
      taskResponses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.currentStatus).toBe(TaskStatus.INITIALIZATION);
      });

      // Submit reports concurrently
      const reportPromises = taskResponses.map((response, i) =>
        request(app.getHttpServer())
          .post('/reports')
          .set('Authorization', `Bearer ${implementationToken}`)
          .send({
            taskId: response.body.id,
            submissionData: {
              signalStrength: -75 - i,
              installationLocation: i % 2 === 0 ? 'indoor' : 'outdoor',
              notes: `Concurrent test ${i}`,
            },
          })
      );

      const reportResponses = await Promise.all(reportPromises);

      // Verify all reports were submitted successfully
      reportResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Update status for all tasks
      const statusUpdatePromises = taskResponses.map(async response => {
        // First Schedule
        await request(app.getHttpServer())
          .put(`/workflow/tasks/${response.body.id}/status/${TaskStatus.SCHEDULED_VISIT}`)
          .set('Authorization', `Bearer ${implementationToken}`)
          .send({ scheduledDate: new Date().toISOString() })
          .expect(200);

        // Then Complete Requirements
        return request(app.getHttpServer())
          .put(`/workflow/tasks/${response.body.id}/status/${TaskStatus.REQUIREMENTS_COMPLETE}`)
          .set('Authorization', `Bearer ${implementationToken}`)
          .send({})
          .expect(200);
      });

      await Promise.all(statusUpdatePromises);

      // Verify all tasks have correct status
      const taskIds = taskResponses.map(r => r.body.id);
      const updatedTasks = await prisma.onboardingTask.findMany({
        where: { id: { in: taskIds } },
        include: { technicalReports: true },
      });

      updatedTasks.forEach(task => {
        expect(task.currentStatus).toBe(TaskStatus.REQUIREMENTS_COMPLETE);
        expect(task.technicalReports).toHaveLength(1);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid workflow transitions', async () => {
      // Create task
      const createTaskResponse = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-invalid-transition',
          clientEmail: 'invalid@example.com',
          clientPhone: '555-0106',
          clientAddress: '123 Invalid St',
          contactPerson: 'Invalid User',
          productId: productId,
        })
        .expect(201);

      const taskId = createTaskResponse.body.id;

      // Try to jump straight to HARDWARE_PROCUREMENT_COMPLETE without previous steps
      await request(app.getHttpServer())
        .put(`/workflow/tasks/${taskId}/status/${TaskStatus.HARDWARE_PROCUREMENT_COMPLETE}`)
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({
          hardwareList: [{ deviceSerial: 'INVALID', deviceType: 'T', firmwareVersion: '1' }]
        })
        .expect(400); // Should fail due to invalid status transition (INITIALIZATION -> HARDWARE_PROCUREMENT_COMPLETE not allowed)
    });

    it('should handle duplicate device serial numbers', async () => {
      // Create two tasks
      const task1Response = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-duplicate-1',
          clientEmail: 'dup1@example.com',
          clientPhone: '555-0107',
          clientAddress: '123 Dup St',
          contactPerson: 'Dup User 1',
          productId: productId,
        })
        .expect(201);

      const task2Response = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-duplicate-2',
          clientEmail: 'dup2@example.com',
          clientPhone: '555-0108',
          clientAddress: '456 Dup St',
          contactPerson: 'Dup User 2',
          productId: productId,
        })
        .expect(201);

      // Submit reports for both tasks
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: task1Response.body.id,
          submissionData: {
            signalStrength: -80,
            installationLocation: 'indoor',
          },
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: task2Response.body.id,
          submissionData: {
            signalStrength: -85,
            installationLocation: 'outdoor',
          },
        })
        .expect(201);

      // Provision device for first task
      await request(app.getHttpServer())
        .post('/hardware/provision')
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({
          taskId: task1Response.body.id,
          deviceSerial: 'DUPLICATE-SERIAL-001',
          deviceType: 'IoT Sensor',
          firmwareVersion: '1.0.0',
        })
        .expect(201);

      // Try to provision device with same serial for second task
      await request(app.getHttpServer())
        .post('/hardware/provision')
        .set('Authorization', `Bearer ${hardwareToken}`)
        .send({
          taskId: task2Response.body.id,
          deviceSerial: 'DUPLICATE-SERIAL-001', // Same serial number
          deviceType: 'IoT Sensor',
          firmwareVersion: '1.0.0',
        })
        .expect(409); // Should fail due to unique constraint
    });

    it('should validate form data against report schema', async () => {
      // Create task
      const createTaskResponse = await request(app.getHttpServer())
        .post('/workflow/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          clientName: 'client-validation-test',
          clientEmail: 'validation@example.com',
          clientPhone: '555-0109',
          clientAddress: '123 Val St',
          contactPerson: 'Val User',
          productId: productId,
        })
        .expect(201);

      const taskId = createTaskResponse.body.id;

      // Try to submit report with invalid data
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: taskId,
          submissionData: {
            signalStrength: -130, // Below minimum (-120)
            installationLocation: 'invalid_location', // Not in options
            notes: 'This should fail validation',
          },
        })
        .expect(400);

      // Try to submit report with missing required field
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${implementationToken}`)
        .send({
          taskId: taskId,
          submissionData: {
            // Missing signalStrength (required)
            installationLocation: 'indoor',
            notes: 'Missing required field',
          },
        })
        .expect(400);
    });
  });
});