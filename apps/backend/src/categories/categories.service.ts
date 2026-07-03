import { Injectable } from '@nestjs/common';
import { SkillCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCategoryDto): Promise<SkillCategory> {
    return this.prisma.skillCategory.create({ data: dto });
  }

  update(id: number, dto: UpdateCategoryDto): Promise<SkillCategory> {
    return this.prisma.skillCategory.update({ where: { id }, data: dto });
  }

  remove(id: number): Promise<SkillCategory> {
    return this.prisma.skillCategory.delete({ where: { id } });
  }
}
