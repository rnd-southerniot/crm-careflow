import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles with permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        onboarding: ['create', 'read', 'update', 'delete'],
        reports: ['create', 'read', 'update', 'delete'],
        hardware: ['create', 'read', 'update', 'delete'],
        clients: ['create', 'read', 'update', 'delete'],
      },
    },
    create: {
      name: 'ADMIN',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        onboarding: ['create', 'read', 'update', 'delete'],
        reports: ['create', 'read', 'update', 'delete'],
        hardware: ['create', 'read', 'update', 'delete'],
        clients: ['create', 'read', 'update', 'delete'],
      },
    },
  });

  const salesRole = await prisma.role.upsert({
    where: { name: 'SALES' },
    update: {
      permissions: {
        products: ['read'],
        onboarding: ['create', 'read', 'update'],
        reports: ['read'],
        clients: ['create', 'read'],
      },
    },
    create: {
      name: 'SALES',
      permissions: {
        products: ['read'],
        onboarding: ['create', 'read', 'update'],
        reports: ['read'],
        clients: ['create', 'read'],
      },
    },
  });

  const implementationRole = await prisma.role.upsert({
    where: { name: 'IMPLEMENTATION_LEAD' },
    update: {
      permissions: {
        products: ['read'],
        onboarding: ['read', 'update'],
        reports: ['create', 'read', 'update'],
        clients: ['read'],
      },
    },
    create: {
      name: 'IMPLEMENTATION_LEAD',
      permissions: {
        products: ['read'],
        onboarding: ['read', 'update'],
        reports: ['create', 'read', 'update'],
        clients: ['read'],
      },
    },
  });

  const hardwareRole = await prisma.role.upsert({
    where: { name: 'HARDWARE_ENGINEER' },
    update: {
      permissions: {
        products: ['read'],
        onboarding: ['read', 'update'],
        hardware: ['create', 'read', 'update'],
        clients: ['read'],
      },
    },
    create: {
      name: 'HARDWARE_ENGINEER',
      permissions: {
        products: ['read'],
        onboarding: ['read', 'update'],
        hardware: ['create', 'read', 'update'],
        clients: ['read'],
      },
    },
  });

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@southerneleven.com' },
    update: {},
    create: {
      email: 'admin@southerneleven.com',
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      roleId: adminRole.id,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@southerneleven.com' },
    update: {},
    create: {
      email: 'sales@southerneleven.com',
      passwordHash: hashedPassword,
      fullName: 'Sales Representative',
      roleId: salesRole.id,
    },
  });

  const implUser = await prisma.user.upsert({
    where: { email: 'impl@southerneleven.com' },
    update: {},
    create: {
      email: 'impl@southerneleven.com',
      passwordHash: hashedPassword,
      fullName: 'Implementation Lead',
      roleId: implementationRole.id,
    },
  });

  const hardwareUser = await prisma.user.upsert({
    where: { email: 'hardware@southerneleven.com' },
    update: {},
    create: {
      email: 'hardware@southerneleven.com',
      passwordHash: hashedPassword,
      fullName: 'Hardware Engineer',
      roleId: hardwareRole.id,
    },
  });

  // Create sample products with SOP templates and report schemas
  const solarGateway = await prisma.product.upsert({
    where: { code: 'SOLAR-GW-001' },
    update: {},
    create: {
      name: 'Solar Gateway',
      code: 'SOLAR-GW-001',
      description: 'IoT gateway for solar panel monitoring',
    },
  });

  const indoorSensor = await prisma.product.upsert({
    where: { code: 'INDOOR-SENS-001' },
    update: {},
    create: {
      name: 'Indoor Environmental Sensor',
      code: 'INDOOR-SENS-001',
      description: 'Indoor temperature and humidity sensor',
    },
  });

  // Create product variations to demonstrate parent-child relationships
  const solarGatewayPro = await prisma.product.upsert({
    where: { code: 'SOLAR-GW-001-PRO' },
    update: {},
    create: {
      name: 'Solar Gateway Pro',
      code: 'SOLAR-GW-001-PRO',
      description: 'Enhanced IoT gateway with advanced monitoring capabilities',
      parentProductId: solarGateway.id,
    },
  });

  const solarGatewayLite = await prisma.product.upsert({
    where: { code: 'SOLAR-GW-001-LITE' },
    update: {},
    create: {
      name: 'Solar Gateway Lite',
      code: 'SOLAR-GW-001-LITE',
      description: 'Basic IoT gateway for simple solar monitoring',
      parentProductId: solarGateway.id,
    },
  });

  const outdoorSensor = await prisma.product.upsert({
    where: { code: 'OUTDOOR-SENS-001' },
    update: {},
    create: {
      name: 'Outdoor Environmental Sensor',
      code: 'OUTDOOR-SENS-001',
      description: 'Weather-resistant outdoor temperature and humidity sensor',
      parentProductId: indoorSensor.id,
    },
  });

  // Create SOP templates for all products
  await prisma.sOPTemplate.upsert({
    where: { productId: solarGateway.id },
    update: {},
    create: {
      productId: solarGateway.id,
      steps: [
        {
          id: 'step-1',
          title: 'Site Survey',
          description: 'Conduct initial site assessment for solar installation',
          order: 1,
          estimatedDuration: 45,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Signal Testing',
          description: 'Test cellular signal strength at installation location',
          order: 2,
          estimatedDuration: 20,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-3',
          title: 'Power Assessment',
          description: 'Verify power requirements and solar panel capacity',
          order: 3,
          estimatedDuration: 30,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
      version: 1,
    },
  });

  await prisma.sOPTemplate.upsert({
    where: { productId: indoorSensor.id },
    update: {},
    create: {
      productId: indoorSensor.id,
      steps: [
        {
          id: 'step-1',
          title: 'Location Assessment',
          description: 'Identify optimal sensor placement location',
          order: 1,
          estimatedDuration: 15,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Network Configuration',
          description: 'Configure WiFi or cellular connectivity',
          order: 2,
          estimatedDuration: 25,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
      version: 1,
    },
  });

  // SOP templates for product variations
  await prisma.sOPTemplate.upsert({
    where: { productId: solarGatewayPro.id },
    update: {},
    create: {
      productId: solarGatewayPro.id,
      steps: [
        {
          id: 'step-1',
          title: 'Advanced Site Survey',
          description: 'Comprehensive site assessment with advanced monitoring requirements',
          order: 1,
          estimatedDuration: 60,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Signal Testing',
          description: 'Test cellular signal strength and backup connectivity options',
          order: 2,
          estimatedDuration: 30,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-3',
          title: 'Power Assessment',
          description: 'Verify power requirements for enhanced features',
          order: 3,
          estimatedDuration: 45,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-4',
          title: 'Advanced Configuration',
          description: 'Configure advanced monitoring and alerting features',
          order: 4,
          estimatedDuration: 30,
          requiredRole: 'HARDWARE_ENGINEER',
        },
      ],
      version: 1,
    },
  });

  await prisma.sOPTemplate.upsert({
    where: { productId: solarGatewayLite.id },
    update: {},
    create: {
      productId: solarGatewayLite.id,
      steps: [
        {
          id: 'step-1',
          title: 'Basic Site Survey',
          description: 'Quick site assessment for basic solar monitoring',
          order: 1,
          estimatedDuration: 20,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Signal Testing',
          description: 'Basic cellular signal strength test',
          order: 2,
          estimatedDuration: 10,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
      version: 1,
    },
  });

  await prisma.sOPTemplate.upsert({
    where: { productId: outdoorSensor.id },
    update: {},
    create: {
      productId: outdoorSensor.id,
      steps: [
        {
          id: 'step-1',
          title: 'Outdoor Location Assessment',
          description: 'Identify optimal outdoor sensor placement with weather protection',
          order: 1,
          estimatedDuration: 20,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Weather Protection Setup',
          description: 'Install weather protection and mounting hardware',
          order: 2,
          estimatedDuration: 30,
          requiredRole: 'HARDWARE_ENGINEER',
        },
        {
          id: 'step-3',
          title: 'Network Configuration',
          description: 'Configure cellular connectivity for outdoor deployment',
          order: 3,
          estimatedDuration: 20,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
      version: 1,
    },
  });

  // Create report schemas with comprehensive field types
  await prisma.reportSchema.upsert({
    where: { productId: solarGateway.id },
    update: {},
    create: {
      productId: solarGateway.id,
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
            {
              type: 'max',
              value: -30,
              message: 'Signal strength must be below -30 dBm',
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
            { value: 'rooftop', label: 'Rooftop' },
            { value: 'ground_mount', label: 'Ground Mount' },
            { value: 'pole_mount', label: 'Pole Mount' },
            { value: 'wall_mount', label: 'Wall Mount' },
          ],
          order: 2,
        },
        {
          id: 'field-3',
          name: 'solarPanelWattage',
          label: 'Solar Panel Wattage (W)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: 10,
              message: 'Minimum 10W solar panel required',
            },
            {
              type: 'max',
              value: 500,
              message: 'Maximum 500W solar panel supported',
            },
          ],
          order: 3,
        },
        {
          id: 'field-4',
          name: 'installationDate',
          label: 'Installation Date',
          type: 'date',
          required: true,
          order: 4,
        },
        {
          id: 'field-5',
          name: 'weatherProofing',
          label: 'Weather Proofing Applied',
          type: 'checkbox',
          required: true,
          order: 5,
        },
        {
          id: 'field-6',
          name: 'notes',
          label: 'Installation Notes',
          type: 'textarea',
          required: false,
          validation: [
            {
              type: 'max',
              value: 500,
              message: 'Notes must be less than 500 characters',
            },
          ],
          order: 6,
        },
        {
          id: 'field-7',
          name: 'customerEmail',
          label: 'Customer Email',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'pattern',
              value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
              message: 'Please enter a valid email address',
            },
          ],
          order: 7,
        },
      ],
      version: 1,
    },
  });

  await prisma.reportSchema.upsert({
    where: { productId: indoorSensor.id },
    update: {},
    create: {
      productId: indoorSensor.id,
      formStructure: [
        {
          id: 'field-1',
          name: 'roomDimensions',
          label: 'Room Dimensions (sq ft)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Room size must be at least 1 sq ft',
            },
            {
              type: 'max',
              value: 10000,
              message: 'Room size must be less than 10,000 sq ft',
            },
          ],
          order: 1,
        },
        {
          id: 'field-2',
          name: 'wifiNetwork',
          label: 'WiFi Network Name',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'WiFi network name is required',
            },
            {
              type: 'max',
              value: 32,
              message: 'WiFi network name must be less than 32 characters',
            },
          ],
          order: 2,
        },
        {
          id: 'field-3',
          name: 'mountingHeight',
          label: 'Mounting Height (feet)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: 6,
              message: 'Minimum mounting height is 6 feet',
            },
            {
              type: 'max',
              value: 12,
              message: 'Maximum mounting height is 12 feet',
            },
          ],
          order: 3,
        },
        {
          id: 'field-4',
          name: 'roomType',
          label: 'Room Type',
          type: 'select',
          required: true,
          options: [
            { value: 'office', label: 'Office' },
            { value: 'warehouse', label: 'Warehouse' },
            { value: 'retail', label: 'Retail Space' },
            { value: 'manufacturing', label: 'Manufacturing Floor' },
            { value: 'other', label: 'Other' },
          ],
          order: 4,
        },
        {
          id: 'field-5',
          name: 'hvacSystem',
          label: 'HVAC System Present',
          type: 'checkbox',
          required: false,
          order: 5,
        },
        {
          id: 'field-6',
          name: 'installationDate',
          label: 'Installation Date',
          type: 'date',
          required: true,
          order: 6,
        },
        {
          id: 'field-7',
          name: 'specialRequirements',
          label: 'Special Requirements',
          type: 'textarea',
          required: false,
          validation: [
            {
              type: 'max',
              value: 1000,
              message: 'Special requirements must be less than 1000 characters',
            },
          ],
          order: 7,
        },
      ],
      version: 1,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Test users created:');
  console.log('   - admin@southerneleven.com (password: password123)');
  console.log('   - sales@southerneleven.com (password: password123)');
  console.log('   - impl@southerneleven.com (password: password123)');
  console.log('   - hardware@southerneleven.com (password: password123)');
  console.log('📦 Sample products created: Solar Gateway, Indoor Sensor');
  console.log('🔄 Product variations created: Solar Gateway Pro, Solar Gateway Lite, Outdoor Sensor');

  // Report schemas for product variations
  await prisma.reportSchema.upsert({
    where: { productId: solarGatewayPro.id },
    update: {},
    create: {
      productId: solarGatewayPro.id,
      formStructure: [
        {
          id: 'field-1',
          name: 'signalStrength',
          label: 'Primary Signal Strength (dBm)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: -120,
              message: 'Signal strength must be above -120 dBm',
            },
            {
              type: 'max',
              value: -30,
              message: 'Signal strength must be below -30 dBm',
            },
          ],
          order: 1,
        },
        {
          id: 'field-2',
          name: 'backupSignalStrength',
          label: 'Backup Signal Strength (dBm)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: -120,
              message: 'Backup signal strength must be above -120 dBm',
            },
          ],
          order: 2,
        },
        {
          id: 'field-3',
          name: 'installationLocation',
          label: 'Installation Location',
          type: 'select',
          required: true,
          options: [
            { value: 'rooftop', label: 'Rooftop' },
            { value: 'ground_mount', label: 'Ground Mount' },
            { value: 'pole_mount', label: 'Pole Mount' },
            { value: 'wall_mount', label: 'Wall Mount' },
          ],
          order: 3,
        },
        {
          id: 'field-4',
          name: 'solarPanelWattage',
          label: 'Solar Panel Wattage (W)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: 50,
              message: 'Minimum 50W solar panel required for Pro version',
            },
            {
              type: 'max',
              value: 1000,
              message: 'Maximum 1000W solar panel supported',
            },
          ],
          order: 4,
        },
        {
          id: 'field-5',
          name: 'advancedFeatures',
          label: 'Advanced Features Enabled',
          type: 'checkbox',
          required: true,
          order: 5,
        },
        {
          id: 'field-6',
          name: 'monitoringInterval',
          label: 'Monitoring Interval (minutes)',
          type: 'select',
          required: true,
          options: [
            { value: '1', label: '1 minute' },
            { value: '5', label: '5 minutes' },
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
          ],
          order: 6,
        },
        {
          id: 'field-7',
          name: 'installationDate',
          label: 'Installation Date',
          type: 'date',
          required: true,
          order: 7,
        },
        {
          id: 'field-8',
          name: 'notes',
          label: 'Installation Notes',
          type: 'textarea',
          required: false,
          order: 8,
        },
      ],
      version: 1,
    },
  });

  await prisma.reportSchema.upsert({
    where: { productId: solarGatewayLite.id },
    update: {},
    create: {
      productId: solarGatewayLite.id,
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
            { value: 'rooftop', label: 'Rooftop' },
            { value: 'ground_mount', label: 'Ground Mount' },
          ],
          order: 2,
        },
        {
          id: 'field-3',
          name: 'solarPanelWattage',
          label: 'Solar Panel Wattage (W)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: 10,
              message: 'Minimum 10W solar panel required',
            },
            {
              type: 'max',
              value: 100,
              message: 'Maximum 100W solar panel for Lite version',
            },
          ],
          order: 3,
        },
        {
          id: 'field-4',
          name: 'installationDate',
          label: 'Installation Date',
          type: 'date',
          required: true,
          order: 4,
        },
      ],
      version: 1,
    },
  });

  await prisma.reportSchema.upsert({
    where: { productId: outdoorSensor.id },
    update: {},
    create: {
      productId: outdoorSensor.id,
      formStructure: [
        {
          id: 'field-1',
          name: 'locationCoordinates',
          label: 'GPS Coordinates',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'pattern',
              value: '^-?\\d+\\.\\d+,-?\\d+\\.\\d+$',
              message: 'Please enter coordinates in format: latitude,longitude',
            },
          ],
          order: 1,
        },
        {
          id: 'field-2',
          name: 'weatherProtection',
          label: 'Weather Protection Rating',
          type: 'select',
          required: true,
          options: [
            { value: 'ip65', label: 'IP65 - Dust tight, water resistant' },
            { value: 'ip67', label: 'IP67 - Dust tight, waterproof' },
            { value: 'ip68', label: 'IP68 - Dust tight, submersible' },
          ],
          order: 2,
        },
        {
          id: 'field-3',
          name: 'mountingHeight',
          label: 'Mounting Height (feet)',
          type: 'number',
          required: true,
          validation: [
            {
              type: 'min',
              value: 8,
              message: 'Minimum mounting height is 8 feet for outdoor sensors',
            },
            {
              type: 'max',
              value: 20,
              message: 'Maximum mounting height is 20 feet',
            },
          ],
          order: 3,
        },
        {
          id: 'field-4',
          name: 'temperatureRange',
          label: 'Operating Temperature Range',
          type: 'select',
          required: true,
          options: [
            { value: 'standard', label: 'Standard (-20°C to +60°C)' },
            { value: 'extended', label: 'Extended (-40°C to +80°C)' },
          ],
          order: 4,
        },
        {
          id: 'field-5',
          name: 'powerSource',
          label: 'Power Source',
          type: 'select',
          required: true,
          options: [
            { value: 'battery', label: 'Battery Only' },
            { value: 'solar', label: 'Solar + Battery' },
            { value: 'external', label: 'External Power' },
          ],
          order: 5,
        },
        {
          id: 'field-6',
          name: 'installationDate',
          label: 'Installation Date',
          type: 'date',
          required: true,
          order: 6,
        },
        {
          id: 'field-7',
          name: 'environmentalNotes',
          label: 'Environmental Considerations',
          type: 'textarea',
          required: false,
          validation: [
            {
              type: 'max',
              value: 1000,
              message: 'Environmental notes must be less than 1000 characters',
            },
          ],
          order: 7,
        },
      ],
      version: 1,
    },
  });

  // Create sample onboarding tasks in various workflow states
  const sampleTask1 = await prisma.onboardingTask.upsert({
    where: { id: 'sample-task-1' },
    update: {},
    create: {
      id: 'sample-task-1',
      clientName: 'Acme Corp',
      clientEmail: 'contact@acme.com',
      clientPhone: '+1-555-0101',
      clientAddress: '123 Acme Way, Tech City',
      contactPerson: 'Alice Smith',
      productId: solarGateway.id,
      currentStatus: 'INITIALIZATION',
      assignedUserId: salesUser.id,
      sopSnapshot: [
        {
          id: 'step-1',
          title: 'Site Survey',
          description: 'Conduct initial site assessment for solar installation',
          order: 1,
          estimatedDuration: 45,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Signal Testing',
          description: 'Test cellular signal strength at installation location',
          order: 2,
          estimatedDuration: 20,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-3',
          title: 'Power Assessment',
          description: 'Verify power requirements and solar panel capacity',
          order: 3,
          estimatedDuration: 30,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
    },
  });

  const sampleTask2 = await prisma.onboardingTask.upsert({
    where: { id: 'sample-task-2' },
    update: {},
    create: {
      id: 'sample-task-2',
      clientName: 'Globex Corporation',
      clientEmail: 'info@globex.com',
      clientPhone: '+1-555-0102',
      clientAddress: '456 Globex St, Business Park',
      contactPerson: 'Bob Jones',
      productId: indoorSensor.id,
      currentStatus: 'REQUIREMENTS_COMPLETE',
      assignedUserId: implUser.id,
      sopSnapshot: [
        {
          id: 'step-1',
          title: 'Location Assessment',
          description: 'Identify optimal sensor placement location',
          order: 1,
          estimatedDuration: 15,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Network Configuration',
          description: 'Configure WiFi or cellular connectivity',
          order: 2,
          estimatedDuration: 25,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
    },
  });

  const sampleTask3 = await prisma.onboardingTask.upsert({
    where: { id: 'sample-task-3' },
    update: {},
    create: {
      id: 'sample-task-3',
      clientName: 'Soylent Corp',
      clientEmail: 'sales@soylent.com',
      clientPhone: '+1-555-0103',
      clientAddress: '789 Industrial Ave, Factory Zone',
      contactPerson: 'Carol White',
      productId: solarGateway.id,
      currentStatus: 'READY_FOR_INSTALLATION',
      assignedUserId: hardwareUser.id,
      sopSnapshot: [
        {
          id: 'step-1',
          title: 'Site Survey',
          description: 'Conduct initial site assessment for solar installation',
          order: 1,
          estimatedDuration: 45,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Signal Testing',
          description: 'Test cellular signal strength at installation location',
          order: 2,
          estimatedDuration: 20,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-3',
          title: 'Power Assessment',
          description: 'Verify power requirements and solar panel capacity',
          order: 3,
          estimatedDuration: 30,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
    },
  });

  // Create additional sample tasks for better testing coverage
  const sampleTask4 = await prisma.onboardingTask.upsert({
    where: { id: 'sample-task-4' },
    update: {},
    create: {
      id: 'sample-task-4',
      clientName: 'Umbrella Corp',
      clientEmail: 'security@umbrella.com',
      clientPhone: '+1-555-0104',
      clientAddress: '101 Research Blvd, Raccoon City',
      contactPerson: 'David Black',
      productId: indoorSensor.id,
      currentStatus: 'INITIALIZATION',
      assignedUserId: salesUser.id,
      sopSnapshot: [
        {
          id: 'step-1',
          title: 'Location Assessment',
          description: 'Identify optimal sensor placement location',
          order: 1,
          estimatedDuration: 15,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Network Configuration',
          description: 'Configure WiFi or cellular connectivity',
          order: 2,
          estimatedDuration: 25,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
    },
  });

  const sampleTask5 = await prisma.onboardingTask.upsert({
    where: { id: 'sample-task-5' },
    update: {},
    create: {
      id: 'sample-task-5',
      clientName: 'Cyberdyne Systems',
      clientEmail: 'future@cyberdyne.com',
      clientPhone: '+1-555-0105',
      clientAddress: '2029 Skynet Dr, Future City',
      contactPerson: 'Sarah Connor',
      productId: solarGateway.id,
      currentStatus: 'REQUIREMENTS_COMPLETE',
      assignedUserId: implUser.id,
      sopSnapshot: [
        {
          id: 'step-1',
          title: 'Site Survey',
          description: 'Conduct initial site assessment for solar installation',
          order: 1,
          estimatedDuration: 45,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-2',
          title: 'Signal Testing',
          description: 'Test cellular signal strength at installation location',
          order: 2,
          estimatedDuration: 20,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
        {
          id: 'step-3',
          title: 'Power Assessment',
          description: 'Verify power requirements and solar panel capacity',
          order: 3,
          estimatedDuration: 30,
          requiredRole: 'IMPLEMENTATION_LEAD',
        },
      ],
    },
  });

  // Create sample technical reports with comprehensive data
  await prisma.technicalReport.upsert({
    where: { id: 'sample-report-1' },
    update: {},
    create: {
      id: 'sample-report-1',
      taskId: sampleTask2.id,
      submittedBy: implUser.id,
      submissionData: {
        roomDimensions: 150,
        wifiNetwork: 'ClientWiFi-5G',
        mountingHeight: 8,
        roomType: 'office',
        hvacSystem: true,
        installationDate: '2024-01-15',
        specialRequirements: 'Requires after-hours installation due to business operations',
      },
    },
  });

  await prisma.technicalReport.upsert({
    where: { id: 'sample-report-2' },
    update: {},
    create: {
      id: 'sample-report-2',
      taskId: sampleTask5.id,
      submittedBy: implUser.id,
      submissionData: {
        signalStrength: -75,
        installationLocation: 'rooftop',
        solarPanelWattage: 100,
        installationDate: '2024-01-20',
        weatherProofing: true,
        notes: 'Excellent signal strength, optimal solar exposure. Installation completed without issues.',
        customerEmail: 'client005@example.com',
      },
    },
  });

  // Create sample device provisionings with comprehensive data
  await prisma.deviceProvisioning.upsert({
    where: { deviceSerial: 'DEV-SOLAR-001' },
    update: {},
    create: {
      taskId: sampleTask3.id,
      deviceSerial: 'DEV-SOLAR-001',
      deviceType: 'Solar Gateway',
      firmwareVersion: 'v2.1.0',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEV-SOLAR-001',
      provisionedBy: hardwareUser.id,
      notes: 'Device provisioned with latest firmware, tested and ready for deployment',
    },
  });

  await prisma.deviceProvisioning.upsert({
    where: { deviceSerial: 'DEV-SENSOR-001' },
    update: {},
    create: {
      taskId: sampleTask2.id,
      deviceSerial: 'DEV-SENSOR-001',
      deviceType: 'Indoor Environmental Sensor',
      firmwareVersion: 'v1.5.2',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEV-SENSOR-001',
      provisionedBy: hardwareUser.id,
      notes: 'Sensor calibrated and configured for office environment monitoring',
    },
  });

  // ==================== Hardware Categories ====================
  console.log('📦 Creating hardware categories...');

  const microcontrollerCategory = await prisma.hardwareCategory.upsert({
    where: { name: 'Microcontroller' },
    update: {},
    create: {
      name: 'Microcontroller',
      description: 'Microcontroller boards and chips',
      icon: 'cpu',
    },
  });

  const sensorCategory = await prisma.hardwareCategory.upsert({
    where: { name: 'Sensor' },
    update: {},
    create: {
      name: 'Sensor',
      description: 'Environmental and measurement sensors',
      icon: 'thermometer',
    },
  });

  const moduleCategory = await prisma.hardwareCategory.upsert({
    where: { name: 'Module' },
    update: {},
    create: {
      name: 'Module',
      description: 'Communication and expansion modules',
      icon: 'wifi',
    },
  });

  // ==================== Hardware Catalog ====================
  console.log('🔧 Creating hardware catalog...');

  const arduinoUno = await prisma.hardware.upsert({
    where: { code: 'ARD-UNO-R3' },
    update: {},
    create: {
      name: 'Arduino UNO R3',
      code: 'ARD-UNO-R3',
      description: 'Classic microcontroller board based on ATmega328P',
      categoryId: microcontrollerCategory.id,
      manufacturer: 'Arduino',
    },
  });

  const esp32 = await prisma.hardware.upsert({
    where: { code: 'ESP32-WROOM-32' },
    update: {},
    create: {
      name: 'ESP32-WROOM-32',
      code: 'ESP32-WROOM-32',
      description: 'WiFi and Bluetooth enabled microcontroller module',
      categoryId: microcontrollerCategory.id,
      manufacturer: 'Espressif',
    },
  });

  const esp8266 = await prisma.hardware.upsert({
    where: { code: 'ESP8266-12E' },
    update: {},
    create: {
      name: 'ESP8266-12E',
      code: 'ESP8266-12E',
      description: 'Low-cost WiFi microcontroller',
      categoryId: microcontrollerCategory.id,
      manufacturer: 'Espressif',
    },
  });

  const rpiPico = await prisma.hardware.upsert({
    where: { code: 'RPI-PICO' },
    update: {},
    create: {
      name: 'Raspberry Pi Pico',
      code: 'RPI-PICO',
      description: 'RP2040 based microcontroller board',
      categoryId: microcontrollerCategory.id,
      manufacturer: 'Raspberry Pi',
    },
  });

  const dht22 = await prisma.hardware.upsert({
    where: { code: 'DHT22' },
    update: {},
    create: {
      name: 'DHT22 Temperature & Humidity Sensor',
      code: 'DHT22',
      description: 'Digital temperature and humidity sensor',
      categoryId: sensorCategory.id,
      manufacturer: 'Aosong',
    },
  });

  const hx711 = await prisma.hardware.upsert({
    where: { code: 'HX711' },
    update: {},
    create: {
      name: 'HX711 Load Cell Amplifier',
      code: 'HX711',
      description: '24-bit ADC for load cells',
      categoryId: moduleCategory.id,
      manufacturer: 'Avia Semiconductor',
    },
  });

  const gsmModule = await prisma.hardware.upsert({
    where: { code: 'SIM800L' },
    update: {},
    create: {
      name: 'SIM800L GSM Module',
      code: 'SIM800L',
      description: 'Quad-band GSM/GPRS module',
      categoryId: moduleCategory.id,
      manufacturer: 'SIMCom',
    },
  });

  console.log('🔗 Creating product-hardware configurations...');

  // Solar Gateway can use ESP32 (default) or Arduino UNO
  await prisma.productHardwareConfig.upsert({
    where: {
      productId_hardwareId: {
        productId: solarGateway.id,
        hardwareId: esp32.id,
      },
    },
    update: {},
    create: {
      productId: solarGateway.id,
      hardwareId: esp32.id,
      firmwareVersion: 'v2.1.0',
      isDefault: true,
      notes: 'Recommended for WiFi connectivity',
    },
  });

  await prisma.productHardwareConfig.upsert({
    where: {
      productId_hardwareId: {
        productId: solarGateway.id,
        hardwareId: arduinoUno.id,
      },
    },
    update: {},
    create: {
      productId: solarGateway.id,
      hardwareId: arduinoUno.id,
      firmwareVersion: 'v1.8.0',
      isDefault: false,
      notes: 'Use with separate GSM module for cellular connectivity',
    },
  });

  // Solar Gateway Pro uses ESP32 only with latest firmware
  await prisma.productHardwareConfig.upsert({
    where: {
      productId_hardwareId: {
        productId: solarGatewayPro.id,
        hardwareId: esp32.id,
      },
    },
    update: {},
    create: {
      productId: solarGatewayPro.id,
      hardwareId: esp32.id,
      firmwareVersion: 'v3.0.0-pro',
      isDefault: true,
      notes: 'Pro version with advanced monitoring features',
    },
  });

  // Solar Gateway Lite uses ESP8266 for cost efficiency
  await prisma.productHardwareConfig.upsert({
    where: {
      productId_hardwareId: {
        productId: solarGatewayLite.id,
        hardwareId: esp8266.id,
      },
    },
    update: {},
    create: {
      productId: solarGatewayLite.id,
      hardwareId: esp8266.id,
      firmwareVersion: 'v1.0.0-lite',
      isDefault: true,
      notes: 'Budget-friendly option with basic monitoring',
    },
  });

  // Indoor Sensor uses Arduino UNO or Raspberry Pi Pico
  await prisma.productHardwareConfig.upsert({
    where: {
      productId_hardwareId: {
        productId: indoorSensor.id,
        hardwareId: arduinoUno.id,
      },
    },
    update: {},
    create: {
      productId: indoorSensor.id,
      hardwareId: arduinoUno.id,
      firmwareVersion: 'v1.5.2',
      isDefault: true,
      notes: 'Standard indoor sensor setup',
    },
  });

  await prisma.productHardwareConfig.upsert({
    where: {
      productId_hardwareId: {
        productId: indoorSensor.id,
        hardwareId: rpiPico.id,
      },
    },
    update: {},
    create: {
      productId: indoorSensor.id,
      hardwareId: rpiPico.id,
      firmwareVersion: 'v2.0.0-pico',
      isDefault: false,
      notes: 'Higher performance option with more memory',
    },
  });

  // Outdoor Sensor uses ESP32 for weather resistance and WiFi
  await prisma.productHardwareConfig.upsert({
    where: {
      productId_hardwareId: {
        productId: outdoorSensor.id,
        hardwareId: esp32.id,
      },
    },
    update: {},
    create: {
      productId: outdoorSensor.id,
      hardwareId: esp32.id,
      firmwareVersion: 'v1.2.0-outdoor',
      isDefault: true,
      notes: 'Weatherproof enclosure with WiFi connectivity',
    },
  });

  console.log('📋 Sample onboarding tasks created in various workflow states:');
  console.log('   - Task 1: Solar Gateway (INITIALIZATION) - Assigned to Sales');
  console.log('   - Task 2: Indoor Sensor (REQUIREMENTS_COMPLETE) - Assigned to Implementation');
  console.log('   - Task 3: Solar Gateway (READY_FOR_INSTALLATION) - Assigned to Hardware');
  console.log('   - Task 4: Indoor Sensor (INITIALIZATION) - Assigned to Sales');
  console.log('   - Task 5: Solar Gateway (REQUIREMENTS_COMPLETE) - Assigned to Implementation');
  console.log('📊 Sample technical reports and device provisionings created');
  console.log('🔧 Hardware catalog with 7 items created');
  console.log('🔗 Product-hardware configurations created');
  console.log('🎯 Database ready for comprehensive testing and development');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });