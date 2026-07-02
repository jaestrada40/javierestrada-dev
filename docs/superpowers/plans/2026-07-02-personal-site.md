# javierestrada.dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página personal en javierestrada.dev centrada en skills, con panel admin para editar todo el contenido sin tocar código.

**Architecture:** Monorepo con `apps/backend` (NestJS + Prisma + PostgreSQL, API REST con JWT) y `apps/frontend` (Angular standalone + signals + Tailwind, página pública creativa + panel `/admin` sobrio). Docker Compose orquesta postgres + backend + frontend(nginx).

**Tech Stack:** Angular 18+, NestJS 10, Prisma, PostgreSQL 16, TailwindCSS, Docker Compose, JWT (@nestjs/jwt), bcrypt, @nestjs/throttler.

**Spec:** `docs/superpowers/specs/2026-07-02-personal-site-design.md`

---

### Task 1: Estructura del monorepo

**Files:**
- Create: `.gitignore`, `.env.example`, `.env`, `docker-compose.yml`, `README.md`

- [ ] **Step 1: Crear `.gitignore`** (node_modules, dist, .env, .angular)
- [ ] **Step 2: Crear `.env.example` y `.env`:**

```env
DATABASE_URL=postgresql://javier:devpass123@localhost:5432/personal?schema=public
POSTGRES_USER=javier
POSTGRES_PASSWORD=devpass123
POSTGRES_DB=personal
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES_IN=8h
ADMIN_USERNAME=javier
ADMIN_PASSWORD=Admin1234!
PORT=3000
```

- [ ] **Step 3: Crear `docker-compose.yml`:**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      retries: 10
  backend:
    build: ./apps/backend
    ports: ["3000:3000"]
    env_file: .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
    depends_on:
      postgres: { condition: service_healthy }
  frontend:
    build: ./apps/frontend
    ports: ["8080:80"]
    depends_on: [backend]
volumes:
  pgdata:
```

- [ ] **Step 4: Commit** `chore: estructura del monorepo + docker compose`

### Task 2: Backend scaffold + Prisma schema

**Files:**
- Create: `apps/backend/` (NestJS scaffold), `apps/backend/prisma/schema.prisma`

- [ ] **Step 1:** `npx @nestjs/cli new backend --package-manager npm --skip-git` en `apps/`
- [ ] **Step 2:** Instalar deps: `prisma @prisma/client @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt @nestjs/throttler class-validator class-transformer @nestjs/config` (+ types dev)
- [ ] **Step 3: `schema.prisma`:**

```prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model Profile {
  id          Int      @id @default(autoincrement())
  name        String
  tagline     String
  bio         String
  email       String
  githubUrl   String?  @map("github_url")
  linkedinUrl String?  @map("linkedin_url")
  avatarUrl   String?  @map("avatar_url")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("profile")
}

model SkillCategory {
  id        Int     @id @default(autoincrement())
  name      String  @unique
  gradient  String  @default("violet")
  sortOrder Int     @default(0) @map("sort_order")
  skills    Skill[]
  @@map("skill_category")
}

model Skill {
  id         Int           @id @default(autoincrement())
  name       String
  level      Int           @default(80)
  icon       String?
  featured   Boolean       @default(false)
  sortOrder  Int           @default(0) @map("sort_order")
  categoryId Int           @map("category_id")
  category   SkillCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  @@map("skill")
}

model User {
  id       Int    @id @default(autoincrement())
  username String @unique
  password String
  @@map("user")
}
```

Decisión de spec: borrar categoría = cascada (borra sus skills), explícito en el panel admin con confirmación.

- [ ] **Step 4:** Levantar postgres (`docker compose up -d postgres`), `npx prisma migrate dev --name init`
- [ ] **Step 5: Commit** `feat(backend): scaffold NestJS + schema Prisma con migración inicial`

### Task 3: PrismaService + configuración global

**Files:**
- Create: `apps/backend/src/prisma/prisma.service.ts`, `prisma.module.ts` (global)
- Modify: `apps/backend/src/main.ts` (ValidationPipe global, CORS, prefix `api`), `app.module.ts` (ConfigModule.forRoot global, ThrottlerModule 60 req/min)

- [ ] Step 1: PrismaService estándar (extends PrismaClient, onModuleInit → $connect)
- [ ] Step 2: main.ts con `app.setGlobalPrefix('api')`, `enableCors()`, ValidationPipe `{ whitelist: true, transform: true }`
- [ ] Step 3: Compilar `npm run build` → PASS
- [ ] Step 4: Commit `feat(backend): PrismaService + validación global + throttler`

### Task 4: Auth (JWT login) — TDD

**Files:**
- Create: `src/auth/auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `dto/login.dto.ts`
- Test: `src/auth/auth.service.spec.ts`

- [ ] **Step 1: Test failing** — `auth.service.spec.ts`: `login()` con credenciales válidas devuelve `{ access_token }`; con password inválida lanza `UnauthorizedException`; con usuario inexistente lanza `UnauthorizedException`. Mock de PrismaService y JwtService.
- [ ] **Step 2:** Run `npm test -- auth` → FAIL
- [ ] **Step 3:** Implementar AuthService (bcrypt.compare, jwtService.sign `{ sub, username }`), controller `POST /api/auth/login` con Throttle estricto (5/min), JwtStrategy (secret desde config), JwtAuthGuard.
- [ ] **Step 4:** Run `npm test -- auth` → PASS
- [ ] **Step 5: Commit** `feat(backend): auth JWT con login`

### Task 5: Profile module — TDD

**Files:**
- Create: `src/profile/profile.module.ts`, `profile.controller.ts`, `profile.service.ts`, `dto/update-profile.dto.ts`
- Test: `src/profile/profile.service.spec.ts`

- [ ] Step 1: Test failing — `get()` devuelve la primera fila; `update()` hace upsert de la fila única. Mock PrismaService.
- [ ] Step 2: FAIL → Step 3: implementar. `GET /api/profile` público; `PATCH /api/profile` con `@UseGuards(JwtAuthGuard)`. DTO con validadores (`@IsEmail`, `@IsUrl` opcionales, `@IsString`).
- [ ] Step 4: PASS → Step 5: Commit `feat(backend): módulo profile`

### Task 6: Categories + Skills modules — TDD

**Files:**
- Create: `src/categories/*` (CRUD), `src/skills/*` (CRUD + público agrupado)
- Test: `src/skills/skills.service.spec.ts`, `src/categories/categories.service.spec.ts`

- [ ] Step 1: Tests failing — categories: create/update/remove delegan en prisma con datos correctos; skills: `findAllGrouped()` devuelve categorías ordenadas por sortOrder con skills anidadas ordenadas.
- [ ] Step 2: FAIL → Step 3: implementar.
  - Público: `GET /api/skills` → `prisma.skillCategory.findMany({ orderBy: { sortOrder: 'asc' }, include: { skills: { orderBy: { sortOrder: 'asc' } } } })`
  - JWT: `POST/PATCH/DELETE /api/categories(/:id)`, `POST/PATCH/DELETE /api/skills(/:id)`
  - DTOs: nombre requerido, level `@Min(0) @Max(100)`, gradient dentro de lista permitida (`@IsIn(['violet','sunset','ocean','lime','candy'])`)
- [ ] Step 4: PASS → Step 5: Commit `feat(backend): módulos categories y skills`

### Task 7: Seed

**Files:**
- Create: `apps/backend/prisma/seed.ts`; Modify: `package.json` (prisma.seed)

- [ ] Step 1: seed.ts — upsert user admin (username/password desde env, bcrypt 10 rounds), upsert profile de Javier, categorías (Frontend/Backend/Bases de datos/DevOps & Tools) con gradientes, skills reales (Angular, TypeScript, TailwindCSS, Next.js, React / NestJS, Node.js, Prisma / PostgreSQL, MySQL / Docker, Git, Linux…) con íconos Devicon.
- [ ] Step 2: `npx prisma db seed` → verificar filas con un query.
- [ ] Step 3: Commit `feat(backend): seed con admin, perfil y skills iniciales`

### Task 8: Frontend scaffold + Tailwind + servicios core

**Files:**
- Create: `apps/frontend/` (ng new, standalone, routing, scss→css), Tailwind config, `src/app/core/services/{api,auth}.service.ts`, `core/interceptors/jwt.interceptor.ts`, `core/guards/auth.guard.ts`, `src/app/models.ts` (interfaces Profile, SkillCategory, Skill)
- Modify: `proxy.conf.json` (dev proxy `/api` → `localhost:3000`)

- [ ] Step 1: `npx @angular/cli new frontend --style=css --ssr=false --skip-git`
- [ ] Step 2: Tailwind (`tailwindcss postcss autoprefixer`), fuente Inter + display font (Clash/Outfit vía Google Fonts) en index.html
- [ ] Step 3: ApiService (HttpClient tipado), AuthService (login → localStorage token, signal `isLoggedIn`), interceptor funcional (Bearer en `/api`), guard funcional (redirige a `/admin/login`)
- [ ] Step 4: Build `npm run build` → PASS → Commit `feat(frontend): scaffold Angular + Tailwind + core`

### Task 9: Página pública (hero + skills + footer)

**Files:**
- Create: `src/app/features/home/home.component.ts`, `hero.component.ts`, `skills-section.component.ts`, `skill-card.component.ts`, `footer.component.ts`
- Modify: `app.routes.ts`, `styles.css` (gradientes, keyframes, blobs)

- [ ] Step 1: Diseño colorido/creativo: hero con nombre en clamp(3rem,10vw,8rem) y gradiente animado (background-position keyframes), blobs blur-3xl animados, tagline, links sociales. Skills por categoría: heading con gradiente de la categoría, grid de tarjetas con ícono (CDN Devicon), barra de nivel animada, reveal on scroll (IntersectionObserver directive), hover lift + glow.
- [ ] Step 2: Datos desde `GET /api/profile` y `GET /api/skills` con signals + estados de carga.
- [ ] Step 3: Verificar con preview (servidor dev + backend corriendo): snapshot + screenshot, consola sin errores, responsive mobile.
- [ ] Step 4: Commit `feat(frontend): página pública con hero y skills`

### Task 10: Panel admin

**Files:**
- Create: `features/admin/login/login.component.ts`, `features/admin/layout/admin-layout.component.ts`, `features/admin/profile-edit/profile-edit.component.ts`, `features/admin/skills-admin/skills-admin.component.ts` (categorías + skills en una pantalla gestionable)
- Modify: `app.routes.ts` (rutas `/admin` con guard, lazy)

- [ ] Step 1: Login sobrio (card centrada) → guarda token, redirige a `/admin`.
- [ ] Step 2: Layout admin con nav lateral simple (Perfil, Skills, Ver sitio, Salir).
- [ ] Step 3: Perfil: formulario reactivo con todos los campos + guardar (PATCH). Skills: lista de categorías con sus skills, crear/editar inline o modal, eliminar con confirmación (aviso de cascada), campos nombre/nivel/ícono/orden/destacada/gradiente.
- [ ] Step 4: Verificar flujo completo con preview: login → editar → reflejo en página pública.
- [ ] Step 5: Commit `feat(frontend): panel admin completo`

### Task 11: Dockerfiles + README + verificación final

**Files:**
- Create: `apps/backend/Dockerfile` (multi-stage: build + prisma generate + migrate deploy en entrypoint), `apps/frontend/Dockerfile` (build Angular → nginx), `apps/frontend/nginx.conf` (SPA fallback + proxy `/api` → backend:3000)

- [ ] Step 1: Dockerfiles + nginx.conf.
- [ ] Step 2: README con setup (env, docker compose up, seed, URLs, cómo apuntar javierestrada.dev).
- [ ] Step 3: `docker compose up --build` (si Docker disponible) o verificación dev completa: tests backend PASS, builds PASS, flujo en preview OK.
- [ ] Step 4: Commit `chore: dockerfiles, nginx y README`

## Self-Review

- Cobertura de spec: profile/skills/categorías/auth/seed/seguridad/página pública/admin/docker ✓ (rate limit en Task 3+4, cascada decidida en Task 2).
- Tipos: modelos Prisma ↔ interfaces `models.ts` ↔ DTOs alineados por tarea.
- Gradientes permitidos definidos en Task 6 y usados en Task 7/9.
