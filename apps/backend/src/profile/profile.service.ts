import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<Profile> {
    const profile = await this.prisma.profile.findFirst();
    if (!profile) throw new NotFoundException('Perfil no configurado');
    return profile;
  }

  async update(dto: UpdateProfileDto): Promise<Profile> {
    const existing = await this.prisma.profile.findFirst();
    if (existing) {
      return this.prisma.profile.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.profile.create({
      data: {
        name: dto.name ?? '',
        tagline: dto.tagline ?? '',
        bio: dto.bio ?? '',
        email: dto.email ?? '',
        githubUrl: dto.githubUrl,
        linkedinUrl: dto.linkedinUrl,
        avatarUrl: dto.avatarUrl,
      },
    });
  }
}
