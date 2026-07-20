import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService, SessionToken } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './jwt.strategy';
import { LoginDto, MfaEnableDto, MfaVerifyDto } from './dto/login.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ default: { ttl: 15 * 60_000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto.username, dto.password);
    if (!result.mfaRequired) this.setSessionCookie(response, result.session);
    return result.mfaRequired
      ? { mfaRequired: true, challengeToken: result.challengeToken }
      : { mfaRequired: false, authenticated: true };
  }

  @Post('mfa/verify')
  @Throttle({ default: { ttl: 15 * 60_000, limit: 5 } })
  async verifyMfa(@Body() dto: MfaVerifyDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.verifyMfa(dto.challengeToken, dto.code);
    this.setSessionCookie(response, session);
    return { authenticated: true };
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  session(@Req() request: AuthenticatedRequest) {
    return this.authService.sessionStatus(request.user.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.user.sub);
    response.clearCookie(this.cookieName(), {
      path: '/', secure: this.isProduction(), sameSite: 'strict',
    });
    return { authenticated: false };
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 15 * 60_000, limit: 3 } })
  setupMfa(@Req() request: AuthenticatedRequest) {
    return this.authService.createMfaSetup(request.user.sub);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 15 * 60_000, limit: 5 } })
  async enableMfa(
    @Req() request: AuthenticatedRequest,
    @Body() dto: MfaEnableDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.enableMfa(request.user.sub, dto.setupToken, dto.code);
    response.clearCookie(this.cookieName(), {
      path: '/', secure: this.isProduction(), sameSite: 'strict',
    });
    return { ...result, reauthenticationRequired: true };
  }

  private setSessionCookie(response: Response, session: SessionToken): void {
    response.cookie(this.cookieName(), session.accessToken, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'strict',
      path: '/',
      maxAge: session.expiresInMs,
    });
    response.setHeader('Cache-Control', 'no-store');
  }

  private isProduction(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private cookieName(): string {
    return this.isProduction() ? '__Host-je_session' : 'je_session';
  }
}
