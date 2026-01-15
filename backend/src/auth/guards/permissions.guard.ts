import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (resource: string, actions: string[]) =>
  (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(PERMISSIONS_KEY, { resource, actions },
      propertyKey ? target[propertyKey] : target);
  };

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<{ resource: string, actions: string[] }>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user?.role?.permissions) {
      return false;
    }

    const userPermissions = user.role.permissions;

    const resourcePermissions = userPermissions[requiredPermissions.resource];

    if (!resourcePermissions) {
      return false;
    }

    return requiredPermissions.actions.every(action =>
      resourcePermissions.includes(action)
    );
  }
}