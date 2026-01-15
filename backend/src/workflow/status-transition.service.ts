import { Injectable, BadRequestException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

export interface StatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  requiredRole?: string;
  requiredAction?: string;
}

@Injectable()
export class StatusTransitionService {
  private readonly validTransitions: StatusTransition[] = [
    {
      from: TaskStatus.INITIALIZATION,
      to: TaskStatus.SCHEDULED_VISIT,
      requiredRole: 'IMPLEMENTATION_LEAD',
      requiredAction: 'set_schedule',
    },
    {
      from: TaskStatus.SCHEDULED_VISIT,
      to: TaskStatus.REQUIREMENTS_COMPLETE,
      requiredRole: 'IMPLEMENTATION_LEAD',
      requiredAction: 'submit_technical_report',
    },
    {
      from: TaskStatus.REQUIREMENTS_COMPLETE,
      to: TaskStatus.HARDWARE_PROCUREMENT_COMPLETE,
      requiredRole: 'HARDWARE_ENGINEER',
      requiredAction: 'submit_hardware_list',
    },
    {
      from: TaskStatus.HARDWARE_PROCUREMENT_COMPLETE,
      to: TaskStatus.HARDWARE_PREPARED_COMPLETE,
      requiredRole: 'HARDWARE_ENGINEER',
    },
    {
      from: TaskStatus.HARDWARE_PREPARED_COMPLETE,
      to: TaskStatus.READY_FOR_INSTALLATION,
      requiredRole: 'HARDWARE_ENGINEER',
      requiredAction: 'generate_qr',
    },
  ];

  // Reverse transitions (ADMIN only) - allows reverting to previous status
  private readonly reverseTransitions: StatusTransition[] = [
    {
      from: TaskStatus.SCHEDULED_VISIT,
      to: TaskStatus.INITIALIZATION,
      requiredRole: 'ADMIN',
    },
    {
      from: TaskStatus.REQUIREMENTS_COMPLETE,
      to: TaskStatus.SCHEDULED_VISIT,
      requiredRole: 'ADMIN',
    },
    {
      from: TaskStatus.HARDWARE_PROCUREMENT_COMPLETE,
      to: TaskStatus.REQUIREMENTS_COMPLETE,
      requiredRole: 'ADMIN',
    },
    {
      from: TaskStatus.HARDWARE_PREPARED_COMPLETE,
      to: TaskStatus.HARDWARE_PROCUREMENT_COMPLETE,
      requiredRole: 'ADMIN',
    },
    {
      from: TaskStatus.READY_FOR_INSTALLATION,
      to: TaskStatus.HARDWARE_PREPARED_COMPLETE,
      requiredRole: 'ADMIN',
    },
  ];

  /**
   * Checks if a transition between two statuses is valid (forward direction).
   *
   * @param from - The starting task status.
   * @param to - The target task status.
   * @returns `true` if the transition is allowed, `false` otherwise.
   */
  isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    return this.validTransitions.some(
      transition => transition.from === from && transition.to === to
    );
  }

  /**
   * Checks if a reverse transition (revert) between two statuses is valid.
   *
   * @param from - The starting task status.
   * @param to - The target task status.
   * @returns `true` if the reverse transition is allowed, `false` otherwise.
   */
  isValidReverseTransition(from: TaskStatus, to: TaskStatus): boolean {
    return this.reverseTransitions.some(
      transition => transition.from === from && transition.to === to
    );
  }

  /**
   * Retrieves the previous valid status for a given status (used for linear workflows).
   *
   * @param currentStatus - The current task status.
   * @returns The previous status if one exists, or `null`.
   */
  getPreviousStatus(currentStatus: TaskStatus): TaskStatus | null {
    const reverseTransition = this.reverseTransitions.find(
      t => t.from === currentStatus
    );
    return reverseTransition?.to || null;
  }

  /**
   * Retrieves a list of valid next statuses for a given status.
   *
   * @param currentStatus - The current task status.
   * @returns A list of valid next statuses.
   */
  getNextValidStatuses(currentStatus: TaskStatus): TaskStatus[] {
    return this.validTransitions
      .filter(transition => transition.from === currentStatus)
      .map(transition => transition.to);
  }

  /**
   * Gets the required role for a specific transition.
   *
   * @param from - The starting task status.
   * @param to - The target task status.
   * @returns The required role name (e.g., 'IMPLEMENTATION_LEAD'), or `null` if none.
   */
  getRequiredRoleForTransition(from: TaskStatus, to: TaskStatus): string | null {
    const transition = this.validTransitions.find(
      t => t.from === from && t.to === to
    );
    return transition?.requiredRole || null;
  }

  /**
   * Gets the required action key for a specific transition.
   *
   * @param from - The starting task status.
   * @param to - The target task status.
   * @returns The required action key (e.g., 'submit_technical_report'), or `null` if none.
   */
  getRequiredActionForTransition(from: TaskStatus, to: TaskStatus): string | null {
    const transition = this.validTransitions.find(
      t => t.from === from && t.to === to
    );
    return transition?.requiredAction || null;
  }

  /**
   * Validates if a transition is allowed for a user with a specific role.
   * Throws an exception if the transition is invalid or authorized.
   *
   * @param from - The starting task status.
   * @param to - The target task status.
   * @param userRole - The role of the user attempting the transition.
   * @throws BadRequestException if the transition is invalid or the user lacks permission.
   */
  validateTransition(from: TaskStatus, to: TaskStatus, userRole?: string): void {
    // Check for forward transition
    if (this.isValidTransition(from, to)) {
      const requiredRole = this.getRequiredRoleForTransition(from, to);
      if (requiredRole && userRole !== requiredRole && userRole !== 'ADMIN') {
        throw new BadRequestException(
          `Status transition from ${from} to ${to} requires ${requiredRole} role`
        );
      }
      return;
    }

    // Check for reverse transition (ADMIN only)
    if (this.isValidReverseTransition(from, to)) {
      if (userRole !== 'ADMIN') {
        throw new BadRequestException(
          `Reverting status from ${from} to ${to} requires ADMIN role`
        );
      }
      return;
    }

    // Neither forward nor reverse transition is valid
    throw new BadRequestException(
      `Invalid status transition from ${from} to ${to}. Valid next statuses: ${this.getNextValidStatuses(from).join(', ')}`
    );
  }

  /**
   * Checks if a user is permitted to perform a specific transition.
   *
   * @param from - The starting task status.
   * @param to - The target task status.
   * @param userRole - The role of the user.
   * @returns `true` if access is granted, `false` otherwise.
   */
  canUserTransition(from: TaskStatus, to: TaskStatus, userRole: string): boolean {
    if (!this.isValidTransition(from, to)) {
      return false;
    }

    const requiredRole = this.getRequiredRoleForTransition(from, to);
    if (!requiredRole) {
      return true; // No role requirement
    }

    return userRole === requiredRole || userRole === 'ADMIN';
  }

  /**
   * Returns a list of all defined workflow stages with descriptions and roles.
   *
   * @returns An array of workflow stage objects.
   */
  getWorkflowStages(): { status: TaskStatus; description: string; requiredRole?: string }[] {
    return [
      {
        status: TaskStatus.INITIALIZATION,
        description: 'Task created, awaiting assignment',
        requiredRole: 'SALES',
      },
      {
        status: TaskStatus.SCHEDULED_VISIT,
        description: 'Site visit scheduled',
        requiredRole: 'IMPLEMENTATION_LEAD',
      },
      {
        status: TaskStatus.REQUIREMENTS_COMPLETE,
        description: 'Technical requirements gathered',
        requiredRole: 'IMPLEMENTATION_LEAD',
      },
      {
        status: TaskStatus.HARDWARE_PROCUREMENT_COMPLETE,
        description: 'Hardware list submitted',
        requiredRole: 'HARDWARE_ENGINEER',
      },
      {
        status: TaskStatus.HARDWARE_PREPARED_COMPLETE,
        description: 'Hardware preparation complete',
        requiredRole: 'HARDWARE_ENGINEER',
      },
      {
        status: TaskStatus.READY_FOR_INSTALLATION,
        description: 'Ready for installation with QR codes',
        requiredRole: 'HARDWARE_ENGINEER',
      },
    ];
  }
}