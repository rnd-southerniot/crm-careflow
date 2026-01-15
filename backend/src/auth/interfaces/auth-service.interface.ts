import { User } from '@prisma/client';

export interface IAuthService {
  validateUser(email: string, password: string): Promise<User | null>;
  generateToken(user: User): Promise<string>;
  validateToken(token: string): Promise<User | null>;
  refreshToken(token: string): Promise<string>;
}