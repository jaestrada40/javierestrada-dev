import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  let service: SkillsService;
  const prisma = {
    skillCategory: { findMany: jest.fn() },
    skill: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [SkillsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(SkillsService);
  });

  it('findAllGrouped() devuelve categorías con skills ordenadas', async () => {
    const grouped = [{ id: 1, name: 'Frontend', skills: [] }];
    prisma.skillCategory.findMany.mockResolvedValue(grouped);
    await expect(service.findAllGrouped()).resolves.toEqual(grouped);
    expect(prisma.skillCategory.findMany).toHaveBeenCalledWith({
      orderBy: { sortOrder: 'asc' },
      include: { skills: { orderBy: { sortOrder: 'asc' } } },
    });
  });

  it('create() delega en prisma', async () => {
    prisma.skill.create.mockResolvedValue({ id: 1 });
    await service.create({ name: 'Angular', level: 90, categoryId: 1 });
    expect(prisma.skill.create).toHaveBeenCalledWith({
      data: { name: 'Angular', level: 90, categoryId: 1 },
    });
  });

  it('update() y remove() delegan por id', async () => {
    prisma.skill.update.mockResolvedValue({ id: 5 });
    prisma.skill.delete.mockResolvedValue({ id: 5 });
    await service.update(5, { level: 70 });
    await service.remove(5);
    expect(prisma.skill.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { level: 70 } });
    expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});
