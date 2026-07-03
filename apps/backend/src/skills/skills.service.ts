import { Injectable } from '@nestjs/common';
import { Skill, SkillCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';

export type GroupedSkills = (SkillCategory & { skills: Skill[] })[];

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllGrouped(): Promise<GroupedSkills> {
    return this.prisma.skillCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { skills: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  create(dto: CreateSkillDto): Promise<Skill> {
    return this.prisma.skill.create({ data: dto });
  }

  update(id: number, dto: UpdateSkillDto): Promise<Skill> {
    return this.prisma.skill.update({ where: { id }, data: dto });
  }

  remove(id: number): Promise<Skill> {
    return this.prisma.skill.delete({ where: { id } });
  }
}
