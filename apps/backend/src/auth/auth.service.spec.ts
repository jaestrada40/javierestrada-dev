import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verify: jest.fn(),
}));
jest.mock('qrcode', () => ({ toDataURL: jest.fn() }));

describe('AuthService', () => {
  let service: AuthService;
  const prisma = { user: { findUnique: jest.fn() } };
  const jwt = { sign: jest.fn().mockReturnValue('token123'), verifyAsync: jest.fn() };
  const config = { get: jest.fn(), getOrThrow: jest.fn().mockReturnValue('test-secret') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('crea una sesión segura con credenciales válidas', async () => {
    const hash = await bcrypt.hash('secreta', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 1, username: 'javier', password: hash, mfaEnabled: false, mfaSecret: null, tokenVersion: 0,
    });
    const result = await service.login('javier', 'secreta');
    expect(result).toEqual({
      mfaRequired: false,
      session: { accessToken: 'token123', expiresInMs: 1_800_000 },
    });
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 1, username: 'javier', version: 0, purpose: 'admin-session' },
      { expiresIn: '30m' },
    );
  });

  it('lanza Unauthorized con password inválida', async () => {
    const hash = await bcrypt.hash('secreta', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 1, username: 'javier', password: hash, mfaEnabled: false, mfaSecret: null, tokenVersion: 0,
    });
    await expect(service.login('javier', 'mala')).rejects.toThrow(UnauthorizedException);
  });

  it('lanza Unauthorized si el usuario no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('nadie', 'x')).rejects.toThrow(UnauthorizedException);
  });
});
