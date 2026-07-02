# javierestrada.dev — Página personal

**Fecha:** 2026-07-02
**Estado:** Aprobado por Javier

## Objetivo

Página personal en `javierestrada.dev` con diseño colorido/creativo, centrada en mostrar
skills/tecnologías. Todo el contenido visible se administra desde un panel `/admin` con
login, sin tocar código.

## Stack

- **Frontend:** Angular 18+ (standalone components, signals), TailwindCSS. Servido por nginx.
- **Backend:** NestJS (TypeScript), Prisma ORM, JWT para autenticación del admin.
- **Base de datos:** PostgreSQL 16 en Docker con volumen persistente.
- **Infra:** Docker Compose (postgres + backend + frontend). Monorepo:

```
javierestrada.dev/
├── docker-compose.yml
├── .env / .env.example
├── apps/
│   ├── backend/     # NestJS + Prisma
│   └── frontend/    # Angular + Tailwind
```

## Modelo de datos

| Tabla | Campos |
|---|---|
| `profile` (1 fila) | id, name, tagline, bio, email, github_url, linkedin_url, avatar_url, updated_at |
| `skill_category` | id, name, gradient (slug de gradiente predefinido), sort_order |
| `skill` | id, name, category_id (FK), level (0–100), icon (slug Devicon/Simple Icons), featured (bool), sort_order |
| `user` | id, username, password (bcrypt) |

Borrar una categoría requiere que no tenga skills (o cascada explícita — se decide en el plan).

## API

| Endpoint | Auth | Descripción |
|---|---|---|
| `GET /api/profile` | público | Perfil |
| `GET /api/skills` | público | Skills agrupadas por categoría, ordenadas |
| `POST /api/auth/login` | público | `{ username, password }` → `{ access_token }` |
| `PATCH /api/profile` | JWT | Editar perfil |
| `POST/PATCH/DELETE /api/categories(/:id)` | JWT | CRUD categorías |
| `POST/PATCH/DELETE /api/skills(/:id)` | JWT | CRUD skills |

Errores en formato `{ statusCode, message, error }`. Sin `any` en TypeScript.

## Frontend público (una página)

Dirección visual: **colorido/creativo** — gradientes vivos, animaciones, tipografía grande,
personalidad fuerte.

1. **Hero:** nombre en tipografía enorme con gradiente animado, tagline, links sociales,
   blobs/formas de color con movimiento sutil de fondo.
2. **Skills (protagonista):** secciones por categoría, cada una con su gradiente de acento;
   tarjetas con ícono de la tecnología, barra/indicador de nivel, animación de entrada al
   hacer scroll (IntersectionObserver) y efecto hover.
3. **Footer:** contacto y links.

## Panel admin (`/admin`)

- Login (username + password → JWT en localStorage, interceptor + guard).
- Diseño sobrio (el creativo es solo el sitio público).
- Pantallas: editar perfil, gestionar categorías, gestionar skills (CRUD + nivel + orden + destacada).

## Seed

Script de seed: crea el admin (credenciales desde `.env`) y precarga perfil + skills reales
de Javier (Angular, NestJS, Next.js, TypeScript, Prisma, PostgreSQL, Docker, etc.).

## Seguridad

- Password del admin con bcrypt; JWT con secret desde `.env`.
- Guard JWT en todos los endpoints de escritura.
- Rate limiting básico en `/api/auth/login`.
- El backend nunca devuelve el hash de password.

## Fuera de alcance (YAGNI)

- Blog, proyectos/portfolio, multi-usuario, i18n, analytics — se pueden agregar después.
