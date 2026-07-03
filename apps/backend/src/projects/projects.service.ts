import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({ data: dto });
  }

  update(id: number, dto: UpdateProjectDto): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  remove(id: number): Promise<Project> {
    return this.prisma.project.delete({ where: { id } });
  }
}
