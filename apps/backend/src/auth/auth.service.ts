import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

export interface SessionToken {
  accessToken: string;
  expiresInMs: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(username: string, password: string): Promise<
    | { mfaRequired: true; challengeToken: string }
    | { mfaRequired: false; session: SessionToken }
  > {
    const user = await this.prisma.user.findUnique({ where: { username } });
    const valid = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !valid) throw new UnauthorizedException('Credenciales inválidas');

    if (user.mfaEnabled && user.mfaSecret) {
      return {
        mfaRequired: true,
        challengeToken: this.jwtService.sign(
          { sub: user.id, purpose: 'mfa-challenge', version: user.tokenVersion },
          { expiresIn: '5m' },
        ),
      };
    }
    return { mfaRequired: false, session: this.createSession(user) };
  }

  async verifyMfa(challengeToken: string, code: string): Promise<SessionToken> {
    let payload: { sub: number; purpose: string; version: number };
    try {
      payload = await this.jwtService.verifyAsync(challengeToken);
    } catch {
      throw new UnauthorizedException('El desafío MFA expiró');
    }
    if (payload.purpose !== 'mfa-challenge') throw new UnauthorizedException('Desafío inválido');
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.mfaEnabled || !user.mfaSecret || user.tokenVersion !== payload.version) {
      throw new UnauthorizedException('Desafío inválido');
    }

    const secret = this.decrypt(user.mfaSecret);
    const totp = code.replace(/\s/g, '');
    const result = /^\d{6}$/.test(totp) ? await verify({ secret, token: totp }) : { valid: false };
    if (!result.valid && !(await this.consumeRecoveryCode(user, code))) {
      throw new UnauthorizedException('Código de verificación inválido');
    }
    return this.createSession(user);
  }

  async createMfaSetup(userId: number): Promise<{ secret: string; qrCode: string; setupToken: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = generateSecret();
    const uri = generateURI({ issuer: 'javierestrada.dev', label: user.username, secret });
    const qrCode = await QRCode.toDataURL(uri, { width: 260, margin: 1 });
    const setupToken = this.jwtService.sign(
      { sub: user.id, purpose: 'mfa-setup', secret },
      { expiresIn: '10m' },
    );
    return { secret, qrCode, setupToken };
  }

  async enableMfa(userId: number, setupToken: string, code: string): Promise<{ recoveryCodes: string[] }> {
    let payload: { sub: number; purpose: string; secret: string };
    try {
      payload = await this.jwtService.verifyAsync(setupToken);
    } catch {
      throw new UnauthorizedException('La configuración MFA expiró');
    }
    if (payload.sub !== userId || payload.purpose !== 'mfa-setup') {
      throw new UnauthorizedException('Configuración MFA inválida');
    }
    const result = await verify({ secret: payload.secret, token: code });
    if (!result.valid) throw new UnauthorizedException('Código MFA inválido');

    const recoveryCodes = Array.from({ length: 8 }, () => randomBytes(6).toString('hex').toUpperCase());
    const hashes = await Promise.all(recoveryCodes.map((item) => bcrypt.hash(item, 10)));
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: this.encrypt(payload.secret),
        mfaEnabled: true,
        recoveryCodes: JSON.stringify(hashes),
        tokenVersion: { increment: 1 },
      },
    });
    return { recoveryCodes };
  }

  async sessionStatus(userId: number): Promise<{ authenticated: true; mfaEnabled: boolean }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { authenticated: true, mfaEnabled: user.mfaEnabled };
  }

  async logout(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  private createSession(user: Pick<User, 'id' | 'username' | 'tokenVersion'>): SessionToken {
    const expiresInMs = 30 * 60 * 1000;
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        username: user.username,
        version: user.tokenVersion,
        purpose: 'admin-session',
      }, { expiresIn: '30m' }),
      expiresInMs,
    };
  }

  private async consumeRecoveryCode(user: User, code: string): Promise<boolean> {
    const hashes: string[] = user.recoveryCodes ? JSON.parse(user.recoveryCodes) : [];
    const normalized = code.replace(/[\s-]/g, '').toUpperCase();
    for (let index = 0; index < hashes.length; index++) {
      if (await bcrypt.compare(normalized, hashes[index])) {
        hashes.splice(index, 1);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { recoveryCodes: JSON.stringify(hashes) },
        });
        return true;
      }
    }
    return false;
  }

  private encryptionKey(): Buffer {
    const source = this.config.get<string>('MFA_ENCRYPTION_KEY') ?? this.config.getOrThrow<string>('JWT_SECRET');
    return createHash('sha256').update(source).digest();
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
  }

  private decrypt(value: string): string {
    const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}
