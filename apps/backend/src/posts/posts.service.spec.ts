import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;
  const prisma = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [PostsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PostsService);
  });

  it('findPublished() solo devuelve publicados, más recientes primero', async () => {
    prisma.post.findMany.mockResolvedValue([]);
    await service.findPublished();
    expect(prisma.post.findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });
  });

  it('findBySlug() devuelve el post publicado', async () => {
    const post = { id: 1, slug: 'hola', published: true };
    prisma.post.findUnique.mockResolvedValue(post);
    await expect(service.findBySlug('hola')).resolves.toEqual(post);
  });

  it('findBySlug() lanza NotFound si no existe o no está publicado', async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    await expect(service.findBySlug('nada')).rejects.toThrow(NotFoundException);
    prisma.post.findUnique.mockResolvedValue({ id: 1, slug: 'draft', published: false });
    await expect(service.findBySlug('draft')).rejects.toThrow(NotFoundException);
  });

  it('create() genera slug desde el título y fija publishedAt al publicar', async () => {
    prisma.post.create.mockResolvedValue({ id: 1 });
    await service.create({ title: 'Mi Primer Póst!', excerpt: 'x', content: 'y', published: true });
    const arg = prisma.post.create.mock.calls[0][0];
    expect(arg.data.slug).toBe('mi-primer-post');
    expect(arg.data.publishedAt).toBeInstanceOf(Date);
  });

  it('update() fija publishedAt cuando se publica por primera vez', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 1, published: false, publishedAt: null });
    prisma.post.update.mockResolvedValue({ id: 1 });
    await service.update(1, { published: true });
    const arg = prisma.post.update.mock.calls[0][0];
    expect(arg.data.publishedAt).toBeInstanceOf(Date);
  });
});
