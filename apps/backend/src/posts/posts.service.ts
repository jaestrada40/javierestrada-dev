import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  findAll(): Promise<Post[]> {
    return this.prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post || !post.published) throw new NotFoundException('Post no encontrado');
    return post;
  }

  create(dto: CreatePostDto): Promise<Post> {
    return this.prisma.post.create({
      data: {
        ...dto,
        slug: slugify(dto.title),
        publishedAt: dto.published ? new Date() : null,
      },
    });
  }

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post no encontrado');
    const data: Record<string, unknown> = { ...dto };
    if (dto.title) data['slug'] = slugify(dto.title);
    if (dto.published && !existing.publishedAt) data['publishedAt'] = new Date();
    return this.prisma.post.update({ where: { id }, data });
  }

  remove(id: number): Promise<Post> {
    return this.prisma.post.delete({ where: { id } });
  }
}
