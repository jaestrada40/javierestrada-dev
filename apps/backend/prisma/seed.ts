import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedSkill {
  name: string;
  level: number;
  icon: string;
  featured?: boolean;
}

const categories: { name: string; gradient: string; skills: SeedSkill[] }[] = [
  {
    name: 'Frontend',
    gradient: 'violet',
    skills: [
      { name: 'Angular', level: 90, icon: 'angular', featured: true },
      { name: 'TypeScript', level: 90, icon: 'typescript', featured: true },
      { name: 'TailwindCSS', level: 85, icon: 'tailwindcss' },
      { name: 'Next.js', level: 80, icon: 'nextjs' },
      { name: 'React', level: 75, icon: 'react' },
    ],
  },
  {
    name: 'Backend',
    gradient: 'ocean',
    skills: [
      { name: 'NestJS', level: 88, icon: 'nestjs', featured: true },
      { name: 'Node.js', level: 85, icon: 'nodejs' },
      { name: 'Prisma', level: 82, icon: 'prisma' },
    ],
  },
  {
    name: 'Bases de datos',
    gradient: 'sunset',
    skills: [
      { name: 'PostgreSQL', level: 85, icon: 'postgresql', featured: true },
      { name: 'MySQL', level: 80, icon: 'mysql' },
    ],
  },
  {
    name: 'DevOps & Tools',
    gradient: 'lime',
    skills: [
      { name: 'Docker', level: 80, icon: 'docker' },
      { name: 'Git', level: 88, icon: 'git' },
      { name: 'Linux', level: 75, icon: 'linux' },
    ],
  },
];

async function main(): Promise<void> {
  const username = process.env.ADMIN_USERNAME ?? 'javier';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, password: hash },
  });

  const existingProfile = await prisma.profile.findFirst();
  if (!existingProfile) {
    await prisma.profile.create({
      data: {
        name: 'Javier Estrada',
        tagline: 'Desarrollador Full Stack',
        bio: 'Construyo aplicaciones web modernas con Angular, NestJS y más. Apasionado por crear productos con buen diseño y código limpio.',
        email: 'javiera.estradag@gmail.com',
        githubUrl: 'https://github.com/jaestrada40',
      },
    });
  }

  for (let c = 0; c < categories.length; c++) {
    const cat = categories[c];
    const category = await prisma.skillCategory.upsert({
      where: { name: cat.name },
      update: { gradient: cat.gradient, sortOrder: c },
      create: { name: cat.name, gradient: cat.gradient, sortOrder: c },
    });
    for (let s = 0; s < cat.skills.length; s++) {
      const skill = cat.skills[s];
      const existing = await prisma.skill.findFirst({
        where: { name: skill.name, categoryId: category.id },
      });
      if (!existing) {
        await prisma.skill.create({
          data: { ...skill, sortOrder: s, categoryId: category.id },
        });
      }
    }
  }
  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
