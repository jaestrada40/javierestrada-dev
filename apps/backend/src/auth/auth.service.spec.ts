import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = { user: { findUnique: jest.fn() } };
  const jwt = { sign: jest.fn().mockReturnValue('token123') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('devuelve access_token con credenciales válidas', async () => {
    const hash = await bcrypt.hash('secreta', 10);
    prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'javier', password: hash });
    const result = await service.login('javier', 'secreta');
    expect(result).toEqual({ access_token: 'token123' });
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 1, username: 'javier' });
  });

  it('lanza Unauthorized con password inválida', async () => {
    const hash = await bcrypt.hash('secreta', 10);
    prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'javier', password: hash });
    await expect(service.login('javier', 'mala')).rejects.toThrow(UnauthorizedException);
  });

  it('lanza Unauthorized si el usuario no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('nadie', 'x')).rejects.toThrow(UnauthorizedException);
  });
});
