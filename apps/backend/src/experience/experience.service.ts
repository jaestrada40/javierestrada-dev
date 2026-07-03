import { Injectable } from '@nestjs/common';
import { Experience } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Experience[]> {
    return this.prisma.experience.findMany({
      orderBy: [{ sortOrder: 'asc' }, { startYear: 'desc' }],
    });
  }

  create(dto: CreateExperienceDto): Promise<Experience> {
    return this.prisma.experience.create({ data: dto });
  }

  update(id: number, dto: UpdateExperienceDto): Promise<Experience> {
    return this.prisma.experience.update({ where: { id }, data: dto });
  }

  remove(id: number): Promise<Experience> {
    return this.prisma.experience.delete({ where: { id } });
  }
}
