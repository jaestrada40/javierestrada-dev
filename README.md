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

Para publicar en `javierestrada.dev`: apuntar el DNS al servidor y poner un reverse proxy
con TLS (Caddy o nginx + certbot) delante del puerto 8080.

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
