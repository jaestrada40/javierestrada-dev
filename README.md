# javierestrada.dev

Página personal con panel de administración. Angular + NestJS + Prisma + PostgreSQL.

## Estructura

```
apps/backend/    NestJS + Prisma (API REST, JWT)
apps/frontend/   Angular + Tailwind (página pública + /admin)
```

## Desarrollo local

```bash
cp .env.example .env        # editar JWT_SECRET y ADMIN_PASSWORD
docker compose up -d postgres

cd apps/backend
npm install
npx prisma migrate dev
npx prisma db seed          # crea admin + perfil + skills iniciales
npm run start:dev           # API en http://localhost:3000

cd ../frontend
npm install
npm start                   # http://localhost:4200 (proxy /api → 3000)
```

## Producción (Docker Compose)

```bash
docker compose up --build -d
```

- Sitio: http://localhost:8080 (nginx sirve Angular y proxy `/api` al backend)
- Las migraciones se aplican automáticamente al arrancar el backend.
- La primera vez, ejecutar el seed: `docker compose exec backend npx prisma db seed`
  (requiere ts-node; alternativamente correr el seed desde local apuntando `DATABASE_URL` al contenedor).

## Deploy con Coolify (VPS Hostinger)

1. En Coolify: **+ New → Resource → Docker Compose**, conectar este repo de GitHub
   (`jaestrada40/javierestrada-dev`, rama `main`). Coolify detecta `docker-compose.yml`.
2. En **Environment Variables** del recurso, definir las mismas variables de `.env.example`
   (`POSTGRES_*`, `JWT_SECRET` nuevo con `openssl rand -hex 32`, `ADMIN_USERNAME`,
   `ADMIN_PASSWORD` fuerte).
3. En el servicio **frontend**, asignar el dominio `javierestrada.dev` (puerto interno 80).
   Coolify emite el certificado TLS automáticamente. Quitar los `ports` públicos de
   postgres/backend si no se necesitan fuera.
4. Deploy. Las migraciones corren solas al arrancar el backend.
5. Primera vez: abrir terminal del contenedor backend en Coolify y correr
   `npx prisma db seed` (o insertar el admin manualmente).
6. Auto-deploy: activar la opción de webhook de GitHub en Coolify para que cada push a
   `main` despliegue solo.

### Analytics (opcional)

En Coolify: **+ New → Service → Umami**, asignarle un subdominio (ej. `stats.javierestrada.dev`),
crear el sitio en Umami y pegar su `<script>` de tracking en `apps/frontend/src/index.html`.

## Panel admin

`/admin` — usuario y contraseña definidos en `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`,
aplicados por el seed). Desde ahí se edita el perfil, las categorías y las skills sin tocar código.

## Tests

```bash
cd apps/backend && npm test
```

## API

| Método | Ruta | Auth |
|---|---|---|
| GET | `/api/profile` | — |
| GET | `/api/skills` | — |
| POST | `/api/auth/login` | — |
| PATCH | `/api/profile` | JWT |
| POST/PATCH/DELETE | `/api/categories(/:id)` | JWT |
| POST/PATCH/DELETE | `/api/skills(/:id)` | JWT |
