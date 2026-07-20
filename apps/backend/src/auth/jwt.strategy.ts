import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  username: string;
  version: number;
  purpose: string;
}

function cookieExtractor(request: Request): string | null {
  const cookies = request.headers.cookie?.split(';').map((item) => item.trim()) ?? [];
  const session = cookies.find((item) =>
    item.startsWith('__Host-je_session=') || item.startsWith('je_session='),
  );
  return session ? decodeURIComponent(session.slice(session.indexOf('=') + 1)) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({ jwtFromRequest: cookieExtractor, secretOrKey: config.getOrThrow<string>('JWT_SECRET') });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.purpose !== 'admin-session') throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.version) throw new UnauthorizedException();
    return payload;
  }
}
