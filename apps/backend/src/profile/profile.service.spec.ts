import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  const prisma = {
    profile: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [ProfileService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ProfileService);
  });

  it('get() devuelve la primera fila del perfil', async () => {
    const row = { id: 1, name: 'Javier' };
    prisma.profile.findFirst.mockResolvedValue(row);
    await expect(service.get()).resolves.toEqual(row);
  });

  it('update() actualiza la fila existente', async () => {
    prisma.profile.findFirst.mockResolvedValue({ id: 1 });
    prisma.profile.update.mockResolvedValue({ id: 1, name: 'Nuevo' });
    const result = await service.update({ name: 'Nuevo' });
    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Nuevo' },
    });
    expect(result).toEqual({ id: 1, name: 'Nuevo' });
  });

  it('update() crea la fila si no existe', async () => {
    prisma.profile.findFirst.mockResolvedValue(null);
    prisma.profile.create.mockResolvedValue({ id: 1, name: 'Nuevo' });
    await service.update({ name: 'Nuevo' });
    expect(prisma.profile.create).toHaveBeenCalled();
  });
});
