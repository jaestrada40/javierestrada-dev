import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const prisma = {
    skillCategory: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('create() delega en prisma con los datos', async () => {
    prisma.skillCategory.create.mockResolvedValue({ id: 1 });
    await service.create({ name: 'Frontend', gradient: 'violet', sortOrder: 0 });
    expect(prisma.skillCategory.create).toHaveBeenCalledWith({
      data: { name: 'Frontend', gradient: 'violet', sortOrder: 0 },
    });
  });

  it('update() actualiza por id', async () => {
    prisma.skillCategory.update.mockResolvedValue({ id: 2 });
    await service.update(2, { name: 'Backend' });
    expect(prisma.skillCategory.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { name: 'Backend' },
    });
  });

  it('remove() elimina por id', async () => {
    prisma.skillCategory.delete.mockResolvedValue({ id: 3 });
    await service.remove(3);
    expect(prisma.skillCategory.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });
});
