import { Injectable } from '@nestjs/common';
import { IAuthService } from './interfaces/auth-service.interface';
import { LocalAuthService } from './local-auth.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService implements IAuthService {
  constructor(private readonly localAuthService: LocalAuthService) { }

  /**
   * Validates a user based on email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns The user object if validation is successful, or null otherwise.
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    return this.localAuthService.validateUser(email, password);
  }

  /**
   * Generates a JWT access token for a user.
   *
   * @param user - The user object.
   * @returns A signed JWT string.
   */
  async generateToken(user: User): Promise<string> {
    return this.localAuthService.generateToken(user);
  }

  /**
   * Validates a JWT token and returns the associated user.
   *
   * @param token - The JWT token to validate.
   * @returns The user object if the token is valid, or null otherwise.
   */
  async validateToken(token: string): Promise<User | null> {
    return this.localAuthService.validateToken(token);
  }

  /**
   * Refreshes an existing JWT token.
   *
   * @param token - The existing JWT token.
   * @returns A new signed JWT string.
   */
  async refreshToken(token: string): Promise<string> {
    return this.localAuthService.refreshToken(token);
  }
}