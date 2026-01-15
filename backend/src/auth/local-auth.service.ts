import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { IAuthService } from './interfaces/auth-service.interface';

@Injectable()
export class LocalAuthService implements IAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Validates a user based on email and password using the UsersService.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns The user object if validation is successful, or null otherwise.
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    return null;
  }

  /**
   * Generates a signed JWT access token for a user.
   *
   * @param user - The user object.
   * @returns A signed JWT string containing email, sub (id), and roleId.
   */
  async generateToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user.id, roleId: user.roleId };
    return this.jwtService.sign(payload);
  }

  /**
   * Validates a JWT token and retrieves the associated user.
   *
   * @param token - The JWT token to validate.
   * @returns The user object if the token is valid, or null if invalid/expired.
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.usersService.findById(payload.sub);
    } catch {
      return null;
    }
  }

  /**
   * Refreshes an existing JWT token by validating it and generating a new one.
   *
   * @param token - The existing JWT token.
   * @returns A new signed JWT string.
   * @throws Error if the token is invalid.
   */
  async refreshToken(token: string): Promise<string> {
    const user = await this.validateToken(token);
    if (user) {
      return this.generateToken(user);
    }
    throw new Error('Invalid token');
  }
}