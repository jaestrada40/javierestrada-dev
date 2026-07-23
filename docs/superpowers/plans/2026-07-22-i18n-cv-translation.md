# Interfaz bilingüe (ES/EN) y traducción de contenido — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un toggle ES/EN al sitio público y al CV, con textos de interfaz traducidos, y un botón "Traducir a inglés" en el panel admin que llama a la API de DeepL para generar (editable) las versiones en inglés de bio, tagline, experiencia y proyectos.

**Architecture:** Backend agrega columnas `*En` nullable a `Profile`, `Experience` y `Project`, más un endpoint `POST /api/translate` (protegido por JWT) que llama a DeepL y devuelve texto traducido sin persistir nada. Frontend agrega un `LanguageService` (signal + localStorage) que decide qué campo mostrar (`*En` con fallback a español), un diccionario de textos de interfaz, un toggle en el header público, y botones "Traducir a inglés" en los formularios admin que llaman al endpoint y rellenan un textarea editable.

**Tech Stack:** NestJS 11 + Prisma + PostgreSQL (backend), Angular 19 standalone components + signals (frontend), DeepL API (fetch nativo de Node, sin librerías nuevas).

## Global Constraints

- No se traduce: nombre del perfil, organización/empresa, nombre y stack de proyectos, nombres de skills/categorías (spec: "Alcance").
- La traducción a inglés NUNCA se dispara automáticamente para un visitante del sitio — solo el admin la dispara manualmente desde `/admin` (spec: "Backend").
- Si un campo `*En` está vacío, la UI pública y el CV deben mostrar el campo en español como fallback silencioso — nunca un hueco vacío (spec: "Manejo de errores").
- `POST /api/translate` requiere `JwtAuthGuard` y debe tener `@Throttle` (mismo patrón que `auth.controller.ts`).
- `DEEPL_API_KEY` va en `.env` / `.env.example`, nunca hardcodeada.
- Seguir el patrón existente del repo: componentes standalone Angular con `signal`/`input`, DTOs de NestJS con `class-validator`, Prisma con `@map` para snake_case.

---

## Task 1: Migración de Prisma — columnas de traducción

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/20260722000000_content_translations/migration.sql`

**Interfaces:**
- Produces: campos `taglineEn`, `bioEn` en el modelo `Profile`; `titleEn`, `descriptionEn` en `Experience`; `descriptionEn` en `Project`. Todos `String?` nullable, usados por las Tasks 3, 9, 10, 11.

- [ ] **Step 1: Editar el schema de Prisma**

En `apps/backend/prisma/schema.prisma`, dentro de `model Profile`, agregar después de `bio`:

```prisma
model Profile {
  id          Int      @id @default(autoincrement())
  name        String
  tagline     String
  taglineEn   String?  @map("tagline_en")
  bio         String
  bioEn       String?  @map("bio_en")
  email       String
  githubUrl   String?  @map("github_url")
  linkedinUrl String?  @map("linkedin_url")
  avatarUrl   String?  @map("avatar_url")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("profile")
}
```

Dentro de `model Experience`, agregar después de `title` y después de `description`:

```prisma
model Experience {
  id            Int     @id @default(autoincrement())
  kind          String
  title         String
  titleEn       String? @map("title_en")
  organization  String
  startYear     Int     @map("start_year")
  endYear       Int?    @map("end_year")
  description   String
  descriptionEn String? @map("description_en")
  sortOrder     Int     @default(0) @map("sort_order")

  @@map("experience")
}
```

Dentro de `model Project`, agregar después de `description`:

```prisma
model Project {
  id            Int     @id @default(autoincrement())
  name          String
  description   String
  descriptionEn String? @map("description_en")
  stack         String
  githubUrl     String? @map("github_url")
  demoUrl       String? @map("demo_url")
  featured      Boolean @default(false)
  sortOrder     Int     @default(0) @map("sort_order")

  @@map("project")
}
```

- [ ] **Step 2: Escribir la migración SQL a mano**

Crear `apps/backend/prisma/migrations/20260722000000_content_translations/migration.sql`:

```sql
ALTER TABLE "profile"
  ADD COLUMN "tagline_en" TEXT,
  ADD COLUMN "bio_en" TEXT;

ALTER TABLE "experience"
  ADD COLUMN "title_en" TEXT,
  ADD COLUMN "description_en" TEXT;

ALTER TABLE "project"
  ADD COLUMN "description_en" TEXT;
```

- [ ] **Step 3: Regenerar el cliente de Prisma y verificar que la migración aplica**

Run: `cd apps/backend && npx prisma generate && npx prisma migrate deploy`
Expected: `3 migrations found` (o el número correspondiente) y salida terminando en
`All migrations have been successfully applied.` sin errores. Requiere que
`docker compose up -d postgres` esté corriendo con el `DATABASE_URL` de `.env`.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/20260722000000_content_translations/migration.sql
git commit -m "feat(db): agregar columnas de traducción a Profile, Experience y Project"
```

---

## Task 2: Endpoint backend `POST /api/translate`

**Files:**
- Create: `apps/backend/src/translate/translate.module.ts`
- Create: `apps/backend/src/translate/translate.controller.ts`
- Create: `apps/backend/src/translate/translate.service.ts`
- Create: `apps/backend/src/translate/dto/translate.dto.ts`
- Create: `apps/backend/src/translate/translate.service.spec.ts`
- Modify: `apps/backend/src/app.module.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `TranslateService.translate(text: string): Promise<string>`, endpoint
  `POST /api/translate` body `{ text: string }` → `{ translated: string }`, protegido con
  `JwtAuthGuard`. Consumido por el frontend en la Task 4 (`ApiService.translate`).
- Consumes: `ConfigService.getOrThrow<string>('DEEPL_API_KEY')` (patrón igual a
  `JWT_SECRET` en `auth.module.ts`), `JwtAuthGuard` de `../auth/jwt-auth.guard`.

- [ ] **Step 1: DTO con validación**

Crear `apps/backend/src/translate/dto/translate.dto.ts`:

```typescript
import { IsString, MinLength } from 'class-validator';

export class TranslateDto {
  @IsString()
  @MinLength(1)
  text!: string;
}
```

- [ ] **Step 2: Escribir el test del servicio (falla primero)**

Crear `apps/backend/src/translate/translate.service.spec.ts`:

```typescript
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TranslateService } from './translate.service';

describe('TranslateService', () => {
  let service: TranslateService;
  const config = { getOrThrow: jest.fn().mockReturnValue('fake-deepl-key') };
  const originalFetch = global.fetch;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [TranslateService, { provide: ConfigService, useValue: config }],
    }).compile();
    service = module.get(TranslateService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('devuelve el texto traducido que responde DeepL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translations: [{ text: 'Hello world' }] }),
    }) as unknown as typeof fetch;

    const result = await service.translate('Hola mundo');

    expect(result).toBe('Hello world');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-free.deepl.com/v2/translate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lanza un error si DeepL responde con fallo', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 456,
      text: () => Promise.resolve('Quota exceeded'),
    }) as unknown as typeof fetch;

    await expect(service.translate('Hola mundo')).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Ejecutar el test y confirmar que falla**

Run: `cd apps/backend && npx jest translate.service.spec.ts`
Expected: FAIL — `Cannot find module './translate.service'`

- [ ] **Step 4: Implementar el servicio**

Crear `apps/backend/src/translate/translate.service.ts`:

```typescript
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslateService {
  constructor(private readonly config: ConfigService) {}

  async translate(text: string): Promise<string> {
    const apiKey = this.config.getOrThrow<string>('DEEPL_API_KEY');
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], source_lang: 'ES', target_lang: 'EN-US' }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new BadGatewayException(`No se pudo traducir: ${detail}`);
    }

    const data = (await response.json()) as { translations: { text: string }[] };
    return data.translations[0].text;
  }
}
```

- [ ] **Step 5: Ejecutar el test y confirmar que pasa**

Run: `cd apps/backend && npx jest translate.service.spec.ts`
Expected: PASS — 2 tests

- [ ] **Step 6: Controller y módulo**

Crear `apps/backend/src/translate/translate.controller.ts`:

```typescript
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TranslateDto } from './dto/translate.dto';
import { TranslateService } from './translate.service';

@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async translate(@Body() dto: TranslateDto): Promise<{ translated: string }> {
    const translated = await this.translateService.translate(dto.text);
    return { translated };
  }
}
```

Crear `apps/backend/src/translate/translate.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';

@Module({
  controllers: [TranslateController],
  providers: [TranslateService],
})
export class TranslateModule {}
```

- [ ] **Step 7: Registrar el módulo en `app.module.ts`**

En `apps/backend/src/app.module.ts`, agregar el import y agregarlo al arreglo `imports`:

```typescript
import { TranslateModule } from './translate/translate.module';
```

```typescript
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    ProfileModule,
    CategoriesModule,
    SkillsModule,
    ProjectsModule,
    ExperienceModule,
    PostsModule,
    TranslateModule,
  ],
```

- [ ] **Step 8: Agregar `DEEPL_API_KEY` a `.env.example` y `.env`**

En `.env.example`, agregar al final:

```
# API key de DeepL (https://www.deepl.com/account/summary) — usada solo por el botón
# "Traducir a inglés" del panel admin, nunca en peticiones públicas.
DEEPL_API_KEY=
```

Agregar la clave real (la que ya creaste en DeepL) a tu `.env` local — este archivo no se
commitea.

- [ ] **Step 9: Correr toda la suite del backend**

Run: `cd apps/backend && npm test`
Expected: todos los tests pasan, incluyendo los 2 nuevos de `TranslateService`.

- [ ] **Step 10: Commit**

```bash
git add apps/backend/src/translate apps/backend/src/app.module.ts .env.example
git commit -m "feat(backend): agregar endpoint POST /api/translate vía DeepL"
```

---

## Task 3: DTOs de Profile, Experience y Project — aceptar campos `*En`

**Files:**
- Modify: `apps/backend/src/profile/dto/update-profile.dto.ts`
- Modify: `apps/backend/src/experience/dto/experience.dto.ts`
- Modify: `apps/backend/src/projects/dto/project.dto.ts`

**Interfaces:**
- Produces: los `PATCH /api/profile`, `POST|PATCH /api/experience`, `POST|PATCH /api/projects`
  ahora aceptan y persisten `taglineEn`, `bioEn`, `titleEn`, `descriptionEn` (todos
  opcionales). Los servicios (`profile.service.ts`, `experience.service.ts`,
  `projects.service.ts`) ya pasan el DTO completo a Prisma (`data: dto`), así que no
  requieren cambios — Prisma persiste cualquier campo presente en el DTO validado.

- [ ] **Step 1: Actualizar `UpdateProfileDto`**

En `apps/backend/src/profile/dto/update-profile.dto.ts`, agregar después de `tagline` y
después de `bio`:

```typescript
import { IsEmail, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  taglineEn?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  bioEn?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:\/[a-zA-Z0-9][a-zA-Z0-9._/-]*|https:\/\/[^\s]+)$/, {
    message: 'avatarUrl debe ser una ruta local segura o una URL HTTPS',
  })
  avatarUrl?: string;
}
```

- [ ] **Step 2: Actualizar `CreateExperienceDto` y `UpdateExperienceDto`**

En `apps/backend/src/experience/dto/experience.dto.ts`, agregar `titleEn` y
`descriptionEn` opcionales a ambas clases:

```typescript
import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExperienceDto {
  @IsIn(['work', 'education'])
  kind!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsString()
  @MinLength(1)
  organization!: string;

  @IsInt()
  startYear!: number;

  @IsOptional()
  @IsInt()
  endYear?: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateExperienceDto {
  @IsOptional()
  @IsIn(['work', 'education'])
  kind?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  organization?: string;

  @IsOptional()
  @IsInt()
  startYear?: number;

  @IsOptional()
  @IsInt()
  endYear?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
```

- [ ] **Step 3: Actualizar `CreateProjectDto` y `UpdateProjectDto`**

En `apps/backend/src/projects/dto/project.dto.ts`, agregar `descriptionEn` opcional a
ambas clases:

```typescript
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsString()
  stack!: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  stack?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
```

- [ ] **Step 4: Correr la suite del backend**

Run: `cd apps/backend && npm test`
Expected: todos los tests pasan (no se rompe nada existente — los campos nuevos son
opcionales).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/profile/dto/update-profile.dto.ts apps/backend/src/experience/dto/experience.dto.ts apps/backend/src/projects/dto/project.dto.ts
git commit -m "feat(backend): aceptar campos *En en los DTOs de perfil, experiencia y proyectos"
```

---

## Task 4: Frontend — modelos y `ApiService`

**Files:**
- Modify: `apps/frontend/src/app/models.ts`
- Modify: `apps/frontend/src/app/core/services/api.service.ts`

**Interfaces:**
- Produces: `Profile.taglineEn`, `Profile.bioEn`, `Experience.titleEn`,
  `Experience.descriptionEn`, `Project.descriptionEn` (todos `string | null`).
  `ApiService.translate(text: string): Observable<{ translated: string }>`. Consumido por
  las Tasks 5–11.

- [ ] **Step 1: Agregar los campos `*En` a los modelos**

En `apps/frontend/src/app/models.ts`, modificar las interfaces:

```typescript
export interface Profile {
  id: number;
  name: string;
  tagline: string;
  taglineEn: string | null;
  bio: string;
  bioEn: string | null;
  email: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
}
```

```typescript
export interface Project {
  id: number;
  name: string;
  description: string;
  descriptionEn: string | null;
  stack: string;
  githubUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  sortOrder: number;
}
```

```typescript
export interface Experience {
  id: number;
  kind: 'work' | 'education';
  title: string;
  titleEn: string | null;
  organization: string;
  startYear: number;
  endYear: number | null;
  description: string;
  descriptionEn: string | null;
  sortOrder: number;
}
```

- [ ] **Step 2: Agregar `translate()` y actualizar los métodos que destructuran campos**

En `apps/frontend/src/app/core/services/api.service.ts`, agregar el método nuevo:

```typescript
  translate(text: string): Observable<{ translated: string }> {
    return this.http.post<{ translated: string }>('/api/translate', { text });
  }
}
```

(agregarlo justo antes del `}` de cierre de la clase, después de `deletePost`).

Modificar `updateProject` y `updateExperience`, que hoy destructuran campos explícitos y
perderían silenciosamente los nuevos si no se agregan:

```typescript
  updateProject(id: number, data: Partial<Project>): Observable<Project> {
    const { name, description, descriptionEn, stack, githubUrl, demoUrl, featured, sortOrder } = data;
    return this.http.patch<Project>(`/api/projects/${id}`, {
      name, description, descriptionEn, stack,
      githubUrl: githubUrl || undefined,
      demoUrl: demoUrl || undefined,
      featured, sortOrder,
    });
  }
```

```typescript
  updateExperience(id: number, data: Partial<Experience>): Observable<Experience> {
    const { kind, title, titleEn, organization, startYear, endYear, description, descriptionEn, sortOrder } = data;
    return this.http.patch<Experience>(`/api/experience/${id}`, {
      kind, title, titleEn, organization, startYear,
      endYear: endYear ?? undefined,
      description, descriptionEn, sortOrder,
    });
  }
```

`createProject` y `createExperience` reciben `Partial<Project>`/`Partial<Experience>` y los
mandan completos en el `POST` sin destructurar — no requieren cambios.
`updateProfile` manda `data` completo sin destructurar — tampoco requiere cambios.

- [ ] **Step 3: Verificar que el frontend compila**

Run: `cd apps/frontend && npx ng build --configuration development`
Expected: `Application bundle generation complete.` sin errores de tipos.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/models.ts apps/frontend/src/app/core/services/api.service.ts
git commit -m "feat(frontend): agregar campos *En a los modelos y ApiService.translate"
```

---

## Task 5: `LanguageService` y diccionario de textos de interfaz

**Files:**
- Create: `apps/frontend/src/app/core/services/language.service.ts`
- Create: `apps/frontend/src/app/core/i18n/ui-strings.ts`

**Interfaces:**
- Produces: `LanguageService.lang: Signal<'es' | 'en'>`, `LanguageService.toggle(): void`,
  `LanguageService.pick(es: string, en: string | null | undefined): string`,
  `LanguageService.t(key: keyof typeof UI_STRINGS['es']): string`. Consumido por las Tasks
  6, 7 y 8.

- [ ] **Step 1: Diccionario de textos de interfaz**

Crear `apps/frontend/src/app/core/i18n/ui-strings.ts`:

```typescript
export const UI_STRINGS = {
  es: {
    'nav.projects': 'Proyectos',
    'nav.skills': 'Tecnologías',
    'nav.certifications': 'Certificaciones',
    'nav.experience': 'Experiencia',
    'cv.back': 'Inicio',
    'cv.download': 'Descargar PDF',
    'cv.experienceHeading': 'Experiencia & Formación',
    'cv.projectsHeading': 'Proyectos',
    'cv.skillsHeading': 'Skills',
    'cv.present': 'actualidad',
    'projects.heading': 'Proyectos seleccionados',
    'projects.eyebrow': 'Trabajo reciente',
    'projects.featured': 'Destacado',
    'projects.code': 'Código →',
    'projects.demo': 'Demo →',
    'experience.heading': 'Experiencia & Formación',
    'experience.present': 'actualidad',
    'experience.work': 'Trabajo',
    'experience.education': 'Formación',
  },
  en: {
    'nav.projects': 'Projects',
    'nav.skills': 'Skills',
    'nav.certifications': 'Certifications',
    'nav.experience': 'Experience',
    'cv.back': 'Home',
    'cv.download': 'Download PDF',
    'cv.experienceHeading': 'Experience & Education',
    'cv.projectsHeading': 'Projects',
    'cv.skillsHeading': 'Skills',
    'cv.present': 'present',
    'projects.heading': 'Selected projects',
    'projects.eyebrow': 'Recent work',
    'projects.featured': 'Featured',
    'projects.code': 'Code →',
    'projects.demo': 'Demo →',
    'experience.heading': 'Experience & Education',
    'experience.present': 'present',
    'experience.work': 'Work',
    'experience.education': 'Education',
  },
} as const;

export type UiStringKey = keyof typeof UI_STRINGS.es;
```

- [ ] **Step 2: `LanguageService`**

Crear `apps/frontend/src/app/core/services/language.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { UI_STRINGS, UiStringKey } from '../i18n/ui-strings';

const STORAGE_KEY = 'lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<'es' | 'en'>(this.readStored());

  private readStored(): 'es' | 'en' {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return stored === 'en' ? 'en' : 'es';
  }

  toggle(): void {
    const next = this.lang() === 'es' ? 'en' : 'es';
    this.lang.set(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  pick(es: string, en: string | null | undefined): string {
    return this.lang() === 'en' && en ? en : es;
  }

  t(key: UiStringKey): string {
    return UI_STRINGS[this.lang()][key];
  }
}
```

- [ ] **Step 3: Verificar que compila**

Run: `cd apps/frontend && npx ng build --configuration development`
Expected: `Application bundle generation complete.` sin errores (el servicio aún no se usa
en ningún componente, así que solo valida sintaxis/tipos).

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/core/services/language.service.ts apps/frontend/src/app/core/i18n/ui-strings.ts
git commit -m "feat(frontend): agregar LanguageService y diccionario de textos ES/EN"
```

---

## Task 6: Toggle de idioma en el header público

**Files:**
- Modify: `apps/frontend/src/app/features/home/hero.component.ts`

**Interfaces:**
- Consumes: `LanguageService` de la Task 5.

- [ ] **Step 1: Inyectar el servicio y agregar el toggle al nav**

En `apps/frontend/src/app/features/home/hero.component.ts`, agregar el import y la
inyección:

```typescript
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile } from '../../models';
import { LanguageService } from '../../core/services/language.service';
```

```typescript
export class HeroComponent {
  readonly profile = input.required<Profile>();
  readonly language = inject(LanguageService);
```

En el `<nav>`, reemplazar los enlaces fijos y agregar el toggle al final:

```html
<nav class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-navy-700">
  <a href="#inicio" class="font-display font-bold text-lg tracking-tight">Javier Estrada<span class="text-accent">.</span></a>
  <div class="hidden md:flex items-center gap-7 text-sm text-ink-dim">
    <a href="#proyectos" class="hover:text-accent">{{ language.t('nav.projects') }}</a>
    <a href="#skills" class="hover:text-accent">{{ language.t('nav.skills') }}</a>
    <a href="#certificaciones" class="hover:text-accent">{{ language.t('nav.certifications') }}</a>
    <a href="#experiencia" class="hover:text-accent">{{ language.t('nav.experience') }}</a>
    <button
      type="button"
      (click)="language.toggle()"
      class="font-mono text-xs border border-navy-700 rounded-full px-3 py-1 hover:border-accent hover:text-accent"
    >
      {{ language.lang() === 'es' ? 'EN' : 'ES' }}
    </button>
  </div>
</nav>
```

También actualizar el `bio` mostrado en el hero para usar el fallback:

```html
<p class="mt-8 text-lg text-ink-dim leading-relaxed max-w-2xl">{{ language.pick(profile().bio, profile().bioEn) }}</p>
```

- [ ] **Step 2: Levantar el frontend y verificar visualmente**

Run: `cd apps/frontend && npm start`
Expected: en `http://localhost:4200`, el botón "EN" aparece en el nav; al hacer clic
cambia a "ES" y los labels del nav cambian de idioma; recargar la página mantiene el
idioma elegido (persistido en `localStorage`).

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/features/home/hero.component.ts
git commit -m "feat(frontend): agregar toggle ES/EN al header público"
```

---

## Task 7: Contenido bilingüe en secciones de experiencia y proyectos

**Files:**
- Modify: `apps/frontend/src/app/features/home/experience-section.component.ts`
- Modify: `apps/frontend/src/app/features/home/projects-section.component.ts`

**Interfaces:**
- Consumes: `LanguageService` de la Task 5.

- [ ] **Step 1: `ExperienceSectionComponent`**

En `apps/frontend/src/app/features/home/experience-section.component.ts`:

```typescript
import { Component, inject, input } from '@angular/core';
import { Experience } from '../../models';
import { RevealDirective } from '../../shared/reveal.directive';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-experience-section',
  imports: [RevealDirective],
  template: `
    @if (items().length) {
      <section id="experiencia" class="max-w-6xl mx-auto px-6 py-16">
        <h2
          class="font-bold text-ink text-3xl mb-12 tracking-tight"
          style="font-family: var(--font-display)"
        >
          {{ language.t('experience.heading') }}
        </h2>

        <div class="border-l border-navy-700 pl-8 space-y-10">
          @for (item of items(); track item.id) {
            <div appReveal class="relative">
              <span class="absolute -left-[37px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent"></span>
              <p class="font-mono text-xs uppercase tracking-widest text-ink-dim mb-1">
                {{ item.startYear }}–{{ item.endYear ?? language.t('experience.present') }} ·
                {{ item.kind === 'education' ? language.t('experience.education') : language.t('experience.work') }}
              </p>
              <h3 class="font-bold text-ink" style="font-family: var(--font-display)">
                {{ language.pick(item.title, item.titleEn) }}
              </h3>
              <p class="text-sm text-accent mb-2">{{ item.organization }}</p>
              <p class="text-sm text-ink-dim leading-relaxed max-w-2xl">{{ language.pick(item.description, item.descriptionEn) }}</p>
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class ExperienceSectionComponent {
  readonly items = input.required<Experience[]>();
  readonly language = inject(LanguageService);
}
```

- [ ] **Step 2: `ProjectsSectionComponent`**

En `apps/frontend/src/app/features/home/projects-section.component.ts`:

```typescript
import { Component, inject, input } from '@angular/core';
import { Project } from '../../models';
import { RevealDirective } from '../../shared/reveal.directive';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-projects-section',
  imports: [RevealDirective],
  template: `
    @if (projects().length) {
      <section id="proyectos" class="max-w-6xl mx-auto px-6 py-16">
        <div class="flex items-end justify-between gap-6 mb-10">
          <div>
            <p class="font-mono text-xs text-accent tracking-[.2em] uppercase mb-3">{{ language.t('projects.eyebrow') }}</p>
            <h2 class="font-display font-bold text-3xl tracking-tight">{{ language.t('projects.heading') }}</h2>
          </div>
          <span class="hidden sm:block font-mono text-xs text-ink-dim">Diseño · Código · Producción</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (project of projects(); track project.id) {
            <article
              appReveal
              class="border border-navy-700 rounded-2xl p-7 bg-white hover:border-accent/60 hover:-translate-y-1 hover:shadow-xl transition flex flex-col min-h-72"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <h3 class="font-bold text-lg text-ink" style="font-family: var(--font-display)">
                  {{ project.name }}
                </h3>
                @if (project.featured) {
                  <span class="font-mono text-[10px] uppercase tracking-wider text-accent bg-accent-soft rounded-full px-2.5 py-1 shrink-0">{{ language.t('projects.featured') }}</span>
                }
              </div>

              <p class="text-ink-dim text-sm leading-relaxed flex-1">{{ language.pick(project.description, project.descriptionEn) }}</p>

              <div class="mt-4 flex flex-wrap gap-2">
                @for (tech of stackList(project); track tech) {
                  <span class="font-mono text-xs text-ink-dim bg-warm rounded-md px-2.5 py-1">{{ tech }}</span>
                }
              </div>

              <div class="mt-5 flex gap-4 font-mono text-sm">
                @if (project.githubUrl) {
                  <a [href]="project.githubUrl" target="_blank" rel="noopener" class="text-accent hover:underline">{{ language.t('projects.code') }}</a>
                }
                @if (project.demoUrl) {
                  <a [href]="project.demoUrl" target="_blank" rel="noopener" class="text-accent hover:underline">{{ language.t('projects.demo') }}</a>
                }
              </div>
            </article>
          }
        </div>
      </section>
    }
  `,
})
export class ProjectsSectionComponent {
  readonly projects = input.required<Project[]>();
  readonly language = inject(LanguageService);

  stackList(project: Project): string[] {
    return project.stack.split(',').map((s) => s.trim()).filter(Boolean);
  }
}
```

- [ ] **Step 3: Verificar visualmente**

Con `npm start` corriendo, cambiar el toggle ES/EN del header y confirmar que los
encabezados de "Experiencia & Formación" / "Proyectos seleccionados" y las descripciones
cambian de idioma (mostrando español como fallback si algún proyecto/experiencia todavía
no tiene traducción guardada).

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/features/home/experience-section.component.ts apps/frontend/src/app/features/home/projects-section.component.ts
git commit -m "feat(frontend): mostrar experiencia y proyectos en el idioma seleccionado"
```

---

## Task 8: `CvComponent` bilingüe

**Files:**
- Modify: `apps/frontend/src/app/features/cv/cv.component.ts`

**Interfaces:**
- Consumes: `LanguageService` de la Task 5.

- [ ] **Step 1: Reescribir el template y la clase**

En `apps/frontend/src/app/features/cv/cv.component.ts`:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Experience, Profile, Project, SkillCategory } from '../../models';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-cv',
  imports: [RouterLink],
  styles: [
    `
      @media print {
        .no-print { display: none; }
        :host { color: #111; }
      }
    `,
  ],
  template: `
    <div class="cv-page max-w-3xl mx-auto px-6 py-16 print:py-0 bg-white text-slate-900 min-h-screen">
      <div class="no-print flex justify-between items-center mb-10">
        <a routerLink="/" class="font-mono text-sm text-slate-500 hover:text-slate-900">← {{ language.t('cv.back') }}</a>
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="language.toggle()"
            class="font-mono text-xs border border-slate-300 rounded-full px-3 py-1 hover:border-slate-900"
          >
            {{ language.lang() === 'es' ? 'EN' : 'ES' }}
          </button>
          <button
            type="button"
            (click)="print()"
            class="px-5 py-2 rounded-md bg-slate-900 text-white font-semibold"
          >
            {{ language.t('cv.download') }}
          </button>
        </div>
      </div>

      @if (profile(); as p) {
        <header class="border-b-2 border-slate-900 pb-4 mb-8">
          <h1 class="text-4xl font-black tracking-tight" style="font-family: var(--font-display)">
            {{ p.name }}
          </h1>
          <p class="font-mono text-sm text-slate-600 mt-2">
            {{ language.pick(p.tagline, p.taglineEn) }} · Guatemala · {{ p.email }}
            @if (p.githubUrl) { · {{ p.githubUrl }} }
          </p>
        </header>

        <p class="text-slate-700 leading-relaxed mb-8">{{ language.pick(p.bio, p.bioEn) }}</p>
      }

      @if (experience().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4">{{ language.t('cv.experienceHeading') }}</h2>
        @for (item of experience(); track item.id) {
          <div class="mb-5">
            <div class="flex justify-between items-baseline">
              <h3 class="font-bold" style="font-family: var(--font-display)">{{ language.pick(item.title, item.titleEn) }} — {{ item.organization }}</h3>
              <span class="font-mono text-xs text-slate-500">{{ item.startYear }}–{{ item.endYear ?? language.t('cv.present') }}</span>
            </div>
            <p class="text-sm text-slate-600 mt-1">{{ language.pick(item.description, item.descriptionEn) }}</p>
          </div>
        }
      }

      @if (projects().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4 mt-8">{{ language.t('cv.projectsHeading') }}</h2>
        @for (project of projects(); track project.id) {
          <div class="mb-4">
            <h3 class="font-bold" style="font-family: var(--font-display)">{{ project.name }}</h3>
            <p class="text-sm text-slate-600">{{ language.pick(project.description, project.descriptionEn) }}</p>
            <p class="font-mono text-xs text-slate-500 mt-1">{{ project.stack }}</p>
          </div>
        }
      }

      @if (categories().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4 mt-8">{{ language.t('cv.skillsHeading') }}</h2>
        @for (category of categories(); track category.id) {
          <p class="text-sm mb-1">
            <span class="font-bold">{{ category.name }}:</span>
            <span class="text-slate-600"> {{ skillNames(category) }}</span>
          </p>
        }
      }
    </div>
  `,
})
export class CvComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly language = inject(LanguageService);

  readonly profile = signal<Profile | null>(null);
  readonly categories = signal<SkillCategory[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly experience = signal<Experience[]>([]);

  ngOnInit(): void {
    this.api.getProfile().subscribe((p) => this.profile.set(p));
    this.api.getSkills().subscribe((c) => this.categories.set(c));
    this.api.getProjects().subscribe((p) => this.projects.set(p));
    this.api.getExperience().subscribe((e) => this.experience.set(e));
  }

  skillNames(category: SkillCategory): string {
    return category.skills.map((s) => s.name).join(', ');
  }

  print(): void {
    window.print();
  }
}
```

- [ ] **Step 2: Verificar visualmente**

Con `npm start` corriendo, ir a `http://localhost:4200/cv`, cambiar a "EN" y confirmar que
los encabezados y el contenido (con fallback a español donde falte `*En`) cambian, y que
"Descargar PDF" abre el diálogo de impresión con el contenido en el idioma activo.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/features/cv/cv.component.ts
git commit -m "feat(frontend): CV bilingüe con toggle ES/EN y descarga en el idioma activo"
```

---

## Task 9: Botón "Traducir a inglés" en el formulario de Perfil

**Files:**
- Modify: `apps/frontend/src/app/features/admin/profile-edit/profile-edit.component.ts`

**Interfaces:**
- Consumes: `ApiService.translate(text: string): Observable<{ translated: string }>` de la
  Task 4.

- [ ] **Step 1: Agregar campos EN reactivos y el flujo de traducción**

En `apps/frontend/src/app/features/admin/profile-edit/profile-edit.component.ts`,
reemplazar el archivo completo:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile-edit',
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Perfil</h1>

    <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-4">
      @for (field of fields; track field.key) {
        <div>
          <label class="block text-sm text-slate-300 mb-1" [for]="field.key">{{ field.label }}</label>
          @if (field.key === 'bio') {
            <textarea
              [id]="field.key"
              [formControlName]="field.key"
              rows="4"
              class="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
            ></textarea>
          } @else {
            <input
              [id]="field.key"
              [formControlName]="field.key"
              [type]="field.key === 'email' ? 'email' : field.key.includes('Url') ? 'url' : 'text'"
              class="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
            />
          }
        </div>
      }

      <div class="border-t border-slate-800 pt-4 grid gap-4">
        <p class="font-mono text-xs uppercase tracking-widest text-slate-500">Versión en inglés</p>
        @for (field of translatableFields; track field.key) {
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm text-slate-300" [for]="field.enKey">{{ field.label }} (EN)</label>
              <button
                type="button"
                (click)="translateField(field)"
                [disabled]="translating() === field.key"
                class="text-xs text-emerald-400 hover:underline disabled:opacity-50"
              >
                {{ translating() === field.key ? 'Traduciendo…' : 'Traducir a inglés' }}
              </button>
            </div>
            <textarea
              [id]="field.enKey"
              [formControlName]="field.enKey"
              rows="3"
              class="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
            ></textarea>
          </div>
        }
        @if (translateError()) {
          <p class="text-sm text-rose-400">{{ translateError() }}</p>
        }
      </div>

      <div class="flex items-center gap-4 mt-2">
        <button
          type="submit"
          [disabled]="form.invalid || saving()"
          class="rounded-lg bg-accent px-5 py-2.5 font-semibold text-navy-950 disabled:opacity-50"
        >
          {{ saving() ? 'Guardando…' : 'Guardar' }}
        </button>
        @if (message()) {
          <span class="text-sm" [class]="saveError() ? 'text-rose-400' : 'text-emerald-400'">{{ message() }}</span>
        }
      </div>
    </form>
  `,
})
export class ProfileEditComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly fields = [
    { key: 'name', label: 'Nombre' },
    { key: 'tagline', label: 'Tagline' },
    { key: 'bio', label: 'Bio' },
    { key: 'email', label: 'Email' },
    { key: 'githubUrl', label: 'GitHub URL' },
    { key: 'linkedinUrl', label: 'LinkedIn URL' },
    { key: 'avatarUrl', label: 'Avatar URL' },
  ] as const;

  readonly translatableFields = [
    { key: 'tagline' as const, enKey: 'taglineEn' as const, label: 'Tagline' },
    { key: 'bio' as const, enKey: 'bioEn' as const, label: 'Bio' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    tagline: ['', Validators.required],
    taglineEn: [''],
    bio: ['', Validators.required],
    bioEn: [''],
    email: ['', [Validators.required, Validators.email]],
    githubUrl: [''],
    linkedinUrl: [''],
    avatarUrl: [''],
  });

  readonly saving = signal(false);
  readonly message = signal('');
  readonly saveError = signal(false);
  readonly translating = signal<string | null>(null);
  readonly translateError = signal('');

  ngOnInit(): void {
    this.api.getProfile().subscribe((p) =>
      this.form.patchValue({
        name: p.name,
        tagline: p.tagline,
        taglineEn: p.taglineEn ?? '',
        bio: p.bio,
        bioEn: p.bioEn ?? '',
        email: p.email,
        githubUrl: p.githubUrl ?? '',
        linkedinUrl: p.linkedinUrl ?? '',
        avatarUrl: p.avatarUrl ?? '',
      }),
    );
  }

  translateField(field: { key: 'tagline' | 'bio'; enKey: 'taglineEn' | 'bioEn' }): void {
    const text = this.form.controls[field.key].value.trim();
    if (!text) return;
    this.translating.set(field.key);
    this.translateError.set('');
    this.api.translate(text).subscribe({
      next: ({ translated }) => {
        this.form.controls[field.enKey].setValue(translated);
        this.translating.set(null);
      },
      error: () => {
        this.translating.set(null);
        this.translateError.set('No se pudo traducir, inténtalo de nuevo.');
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.message.set('');
    this.saveError.set(false);
    const v = this.form.getRawValue();
    this.api
      .updateProfile({
        name: v.name,
        tagline: v.tagline,
        taglineEn: v.taglineEn || null,
        bio: v.bio,
        bioEn: v.bioEn || null,
        email: v.email,
        githubUrl: this.normalizeUrl(v.githubUrl),
        linkedinUrl: this.normalizeUrl(v.linkedinUrl),
        avatarUrl: v.avatarUrl || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('✓ Guardado');
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.saveError.set(true);
          this.message.set(
            error.status === 401
              ? 'Tu sesión expiró. Sal y vuelve a ingresar.'
              : error.status === 400
                ? 'Revisa que los enlaces y el correo tengan un formato válido.'
                : 'No se pudo guardar. Intenta nuevamente.',
          );
        },
      });
  }

  private normalizeUrl(value: string): string | null {
    const normalized = value.trim();
    if (!normalized) return null;
    return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  }
}
```

- [ ] **Step 2: Verificar visualmente**

Con `npm start` y el backend corriendo (con `DEEPL_API_KEY` configurada), entrar a
`/admin`, presionar "Traducir a inglés" junto a Bio, confirmar que el textarea EN se llena,
editarlo si se quiere, y "Guardar" — recargar la página y confirmar que el valor EN
persistió.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/features/admin/profile-edit/profile-edit.component.ts
git commit -m "feat(admin): botón Traducir a inglés para tagline y bio del perfil"
```

---

## Task 10: Botón "Traducir a inglés" en el formulario de Experiencia

**Files:**
- Modify: `apps/frontend/src/app/features/admin/experience-admin/experience-admin.component.ts`

**Interfaces:**
- Consumes: `ApiService.translate` de la Task 4.

- [ ] **Step 1: Agregar campos EN y botones de traducción al formulario**

En `apps/frontend/src/app/features/admin/experience-admin/experience-admin.component.ts`,
reemplazar el archivo completo:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Experience } from '../../../models';

interface ExperienceForm {
  id: number | null;
  kind: 'work' | 'education';
  title: string;
  titleEn: string;
  organization: string;
  startYear: number;
  endYear: number | null;
  description: string;
  descriptionEn: string;
  sortOrder: number;
}

const EMPTY: ExperienceForm = {
  id: null, kind: 'work', title: '', titleEn: '', organization: '',
  startYear: new Date().getFullYear(), endYear: null, description: '', descriptionEn: '', sortOrder: 0,
};

@Component({
  selector: 'app-experience-admin',
  imports: [FormsModule],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Experiencia & Formación</h1>

    <form (ngSubmit)="save()" class="rounded-2xl border border-navy-700 p-5 mb-8 grid gap-3">
      <p class="font-mono text-xs uppercase tracking-widest text-ink-dim">
        {{ form.id ? 'Editar entrada' : 'Nueva entrada' }}
      </p>
      <div class="grid grid-cols-2 gap-3">
        <select name="kind" [(ngModel)]="form.kind" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2">
          <option value="work">Trabajo</option>
          <option value="education">Formación</option>
        </select>
        <input name="organization" [(ngModel)]="form.organization" placeholder="Organización" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      </div>
      <input name="title" [(ngModel)]="form.title" placeholder="Título / puesto / carrera" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <div class="grid grid-cols-2 gap-3">
        <input type="number" name="startYear" [(ngModel)]="form.startYear" placeholder="Año inicio" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
        <input type="number" name="endYear" [(ngModel)]="form.endYear" placeholder="Año fin (vacío = actualidad)" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      </div>
      <textarea name="description" [(ngModel)]="form.description" placeholder="Descripción" rows="2" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"></textarea>

      <div class="border-t border-navy-700/60 pt-3 grid gap-2">
        <div class="flex items-center justify-between">
          <p class="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Título (EN)</p>
          <button type="button" (click)="translateTitle()" [disabled]="translating() === 'title'" class="text-xs text-accent hover:underline disabled:opacity-50">
            {{ translating() === 'title' ? 'Traduciendo…' : 'Traducir a inglés' }}
          </button>
        </div>
        <input name="titleEn" [(ngModel)]="form.titleEn" placeholder="Title / role / degree" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
        <div class="flex items-center justify-between">
          <p class="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Descripción (EN)</p>
          <button type="button" (click)="translateDescription()" [disabled]="translating() === 'description'" class="text-xs text-accent hover:underline disabled:opacity-50">
            {{ translating() === 'description' ? 'Traduciendo…' : 'Traducir a inglés' }}
          </button>
        </div>
        <textarea name="descriptionEn" [(ngModel)]="form.descriptionEn" placeholder="Description" rows="2" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"></textarea>
        @if (translateError()) { <p class="text-sm text-rose-400">{{ translateError() }}</p> }
      </div>

      <div class="flex items-center gap-4">
        <button type="submit" [disabled]="!form.title.trim() || !form.organization.trim()" class="rounded-lg bg-accent px-4 py-2 font-semibold text-navy-950 disabled:opacity-50">
          {{ form.id ? 'Guardar cambios' : 'Agregar' }}
        </button>
        @if (form.id) {
          <button type="button" (click)="reset()" class="text-sm text-ink-dim hover:text-ink">Cancelar</button>
        }
      </div>
    </form>

    @for (item of items(); track item.id) {
      <div class="flex items-center gap-3 border-t border-navy-700/60 py-3">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-ink">{{ item.title }} — {{ item.organization }}</p>
          <p class="font-mono text-xs text-ink-dim">
            {{ item.kind === 'education' ? 'Formación' : 'Trabajo' }} · {{ item.startYear }}–{{ item.endYear ?? 'actualidad' }}
          </p>
        </div>
        <button type="button" (click)="edit(item)" class="text-sm text-accent hover:underline">Editar</button>
        <button type="button" (click)="remove(item)" class="text-sm text-rose-400 hover:text-rose-300">Eliminar</button>
      </div>
    }
    @if (message()) { <p class="mt-4 text-sm text-emerald-400">{{ message() }}</p> }
  `,
})
export class ExperienceAdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly items = signal<Experience[]>([]);
  readonly message = signal('');
  readonly translating = signal<'title' | 'description' | null>(null);
  readonly translateError = signal('');
  form: ExperienceForm = { ...EMPTY };

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.api.getExperience().subscribe((e) => this.items.set(e));
  }

  private flash(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 2500);
  }

  reset(): void {
    this.form = { ...EMPTY };
  }

  edit(item: Experience): void {
    this.form = { ...item, titleEn: item.titleEn ?? '', descriptionEn: item.descriptionEn ?? '' };
  }

  translateTitle(): void {
    const text = this.form.title.trim();
    if (!text) return;
    this.translating.set('title');
    this.translateError.set('');
    this.api.translate(text).subscribe({
      next: ({ translated }) => {
        this.form.titleEn = translated;
        this.translating.set(null);
      },
      error: () => {
        this.translating.set(null);
        this.translateError.set('No se pudo traducir, inténtalo de nuevo.');
      },
    });
  }

  translateDescription(): void {
    const text = this.form.description.trim();
    if (!text) return;
    this.translating.set('description');
    this.translateError.set('');
    this.api.translate(text).subscribe({
      next: ({ translated }) => {
        this.form.descriptionEn = translated;
        this.translating.set(null);
      },
      error: () => {
        this.translating.set(null);
        this.translateError.set('No se pudo traducir, inténtalo de nuevo.');
      },
    });
  }

  save(): void {
    const data = {
      kind: this.form.kind,
      title: this.form.title.trim(),
      titleEn: this.form.titleEn.trim() || undefined,
      organization: this.form.organization.trim(),
      startYear: Number(this.form.startYear),
      endYear: this.form.endYear ? Number(this.form.endYear) : undefined,
      description: this.form.description,
      descriptionEn: this.form.descriptionEn.trim() || undefined,
      sortOrder: this.form.sortOrder,
    };
    const req = this.form.id
      ? this.api.updateExperience(this.form.id, data as Partial<Experience>)
      : this.api.createExperience(data);
    req.subscribe(() => {
      this.reset();
      this.reload();
      this.flash('✓ Guardado');
    });
  }

  remove(item: Experience): void {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    this.api.deleteExperience(item.id).subscribe(() => {
      this.reload();
      this.flash('✓ Eliminado');
    });
  }
}
```

- [ ] **Step 2: Verificar visualmente**

En `/admin/experience`, editar una entrada, presionar "Traducir a inglés" en título y
descripción, confirmar que se llenan los campos EN, guardar y recargar para confirmar que
persiste.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/features/admin/experience-admin/experience-admin.component.ts
git commit -m "feat(admin): botón Traducir a inglés para título y descripción de experiencia"
```

---

## Task 11: Botón "Traducir a inglés" en el formulario de Proyectos

**Files:**
- Modify: `apps/frontend/src/app/features/admin/projects-admin/projects-admin.component.ts`

**Interfaces:**
- Consumes: `ApiService.translate` de la Task 4.

- [ ] **Step 1: Agregar campo EN y botón de traducción**

En `apps/frontend/src/app/features/admin/projects-admin/projects-admin.component.ts`,
reemplazar el archivo completo:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Project } from '../../../models';

interface ProjectForm {
  id: number | null;
  name: string;
  description: string;
  descriptionEn: string;
  stack: string;
  githubUrl: string;
  demoUrl: string;
  featured: boolean;
  sortOrder: number;
}

const EMPTY: ProjectForm = {
  id: null, name: '', description: '', descriptionEn: '', stack: '',
  githubUrl: '', demoUrl: '', featured: false, sortOrder: 0,
};

@Component({
  selector: 'app-projects-admin',
  imports: [FormsModule],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Proyectos</h1>

    <form (ngSubmit)="save()" class="rounded-2xl border border-navy-700 p-5 mb-8 grid gap-3">
      <p class="font-mono text-xs uppercase tracking-widest text-ink-dim">
        {{ form.id ? 'Editar proyecto' : 'Nuevo proyecto' }}
      </p>
      <input name="name" [(ngModel)]="form.name" placeholder="Nombre" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <textarea name="description" [(ngModel)]="form.description" placeholder="Descripción" rows="3" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"></textarea>

      <div class="border-t border-navy-700/60 pt-3 grid gap-2">
        <div class="flex items-center justify-between">
          <p class="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Descripción (EN)</p>
          <button type="button" (click)="translateDescription()" [disabled]="translating()" class="text-xs text-accent hover:underline disabled:opacity-50">
            {{ translating() ? 'Traduciendo…' : 'Traducir a inglés' }}
          </button>
        </div>
        <textarea name="descriptionEn" [(ngModel)]="form.descriptionEn" placeholder="Description" rows="3" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"></textarea>
        @if (translateError()) { <p class="text-sm text-rose-400">{{ translateError() }}</p> }
      </div>

      <input name="stack" [(ngModel)]="form.stack" placeholder="Stack (separado por comas)" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <div class="grid grid-cols-2 gap-3">
        <input name="githubUrl" [(ngModel)]="form.githubUrl" placeholder="GitHub URL (opcional)" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
        <input name="demoUrl" [(ngModel)]="form.demoUrl" placeholder="Demo URL (opcional)" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      </div>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm text-ink-dim">
          <input type="checkbox" name="featured" [(ngModel)]="form.featured" /> Destacado
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-dim">
          Orden
          <input type="number" name="sortOrder" [(ngModel)]="form.sortOrder" class="w-16 rounded bg-slate-900 border border-slate-800 px-2 py-1" />
        </label>
        <button type="submit" [disabled]="!form.name.trim()" class="ml-auto rounded-lg bg-accent px-4 py-2 font-semibold text-navy-950 disabled:opacity-50">
          {{ form.id ? 'Guardar cambios' : 'Crear proyecto' }}
        </button>
        @if (form.id) {
          <button type="button" (click)="reset()" class="text-sm text-ink-dim hover:text-ink">Cancelar</button>
        }
      </div>
    </form>

    @for (project of projects(); track project.id) {
      <div class="flex items-center gap-3 border-t border-navy-700/60 py-3">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-ink">
            {{ project.name }}
            @if (project.featured) { <span class="font-mono text-[10px] text-accent">★</span> }
          </p>
          <p class="text-sm text-ink-dim truncate">{{ project.stack }}</p>
        </div>
        <button type="button" (click)="edit(project)" class="text-sm text-accent hover:underline">Editar</button>
        <button type="button" (click)="remove(project)" class="text-sm text-rose-400 hover:text-rose-300">Eliminar</button>
      </div>
    }
    @if (message()) { <p class="mt-4 text-sm text-emerald-400">{{ message() }}</p> }
  `,
})
export class ProjectsAdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly projects = signal<Project[]>([]);
  readonly message = signal('');
  readonly translating = signal(false);
  readonly translateError = signal('');
  form: ProjectForm = { ...EMPTY };

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.api.getProjects().subscribe((p) => this.projects.set(p));
  }

  private flash(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 2500);
  }

  reset(): void {
    this.form = { ...EMPTY, sortOrder: this.projects().length };
  }

  edit(project: Project): void {
    this.form = {
      id: project.id,
      name: project.name,
      description: project.description,
      descriptionEn: project.descriptionEn ?? '',
      stack: project.stack,
      githubUrl: project.githubUrl ?? '',
      demoUrl: project.demoUrl ?? '',
      featured: project.featured,
      sortOrder: project.sortOrder,
    };
  }

  translateDescription(): void {
    const text = this.form.description.trim();
    if (!text) return;
    this.translating.set(true);
    this.translateError.set('');
    this.api.translate(text).subscribe({
      next: ({ translated }) => {
        this.form.descriptionEn = translated;
        this.translating.set(false);
      },
      error: () => {
        this.translating.set(false);
        this.translateError.set('No se pudo traducir, inténtalo de nuevo.');
      },
    });
  }

  save(): void {
    const data = {
      name: this.form.name.trim(),
      description: this.form.description,
      descriptionEn: this.form.descriptionEn.trim() || undefined,
      stack: this.form.stack,
      githubUrl: this.form.githubUrl.trim() || undefined,
      demoUrl: this.form.demoUrl.trim() || undefined,
      featured: this.form.featured,
      sortOrder: this.form.sortOrder,
    };
    const req = this.form.id
      ? this.api.updateProject(this.form.id, data as Partial<Project>)
      : this.api.createProject(data);
    req.subscribe(() => {
      this.reset();
      this.reload();
      this.flash('✓ Guardado');
    });
  }

  remove(project: Project): void {
    if (!confirm(`¿Eliminar "${project.name}"?`)) return;
    this.api.deleteProject(project.id).subscribe(() => {
      this.reload();
      this.flash('✓ Eliminado');
    });
  }
}
```

- [ ] **Step 2: Verificar visualmente**

En `/admin/projects`, editar un proyecto, presionar "Traducir a inglés" en la descripción,
confirmar que se llena el campo EN, guardar y recargar para confirmar que persiste.
Después, revisar en `/` y `/cv` con el toggle en "EN" que el proyecto muestra la
descripción traducida.

- [ ] **Step 3: Correr el build completo de frontend y backend una última vez**

Run: `cd apps/frontend && npx ng build --configuration development && cd ../backend && npm test`
Expected: ambos comandos terminan sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/features/admin/projects-admin/projects-admin.component.ts
git commit -m "feat(admin): botón Traducir a inglés para la descripción de proyectos"
```
