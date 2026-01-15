import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.authService.generateToken(user);
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: (user as any).role, // Return the complete role object with id, name, and permissions
      },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async profile(@Req() req: any) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    // Avoid leaking password hashes.
    const { passwordHash, ...safe } = user;
    return safe;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  async refresh(@Req() req: any): Promise<LoginResponseDto> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    const token = await this.authService.generateToken(user);
    const { passwordHash, ...safe } = user;
    return {
      access_token: token,
      user: safe,
    } as any;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (stateless)' })
  async logout() {
    // JWT is stateless; client clears token.
    return { success: true };
  }
}
