import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('Hardware Role Validation', () => {
  let rolesGuard: RolesGuard;
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    permissionsGuard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('RolesGuard', () => {
    it('should allow HARDWARE_ENGINEER role for hardware operations', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: {
                name: 'HARDWARE_ENGINEER',
              },
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['HARDWARE_ENGINEER']);

      const result = rolesGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should deny non-HARDWARE_ENGINEER roles for hardware operations', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: {
                name: 'SALES',
              },
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['HARDWARE_ENGINEER']);

      const result = rolesGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should allow access when no roles are required', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: {
                name: 'SALES',
              },
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = rolesGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('PermissionsGuard', () => {
    it('should allow users with hardware create permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: {
                permissions: {
                  hardware: ['create', 'read', 'update'],
                },
              },
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        resource: 'hardware',
        actions: ['create'],
      });

      const result = permissionsGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should deny users without hardware create permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: {
                permissions: {
                  hardware: ['read'], // Missing 'create' permission
                },
              },
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        resource: 'hardware',
        actions: ['create'],
      });

      const result = permissionsGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should deny users without hardware resource permissions', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: {
                permissions: {
                  products: ['read'], // No hardware permissions
                },
              },
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        resource: 'hardware',
        actions: ['create'],
      });

      const result = permissionsGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should allow access when no permissions are required', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: {
                permissions: {
                  products: ['read'],
                },
              },
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = permissionsGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});