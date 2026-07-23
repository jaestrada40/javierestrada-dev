# Diseño: Interfaz bilingüe (ES/EN) y traducción del contenido del CV/portfolio

## Contexto

El sitio (`javierestrada.dev`) es actualmente monolingüe en español: interfaz fija (labels,
botones) y contenido dinámico (perfil, experiencia, proyectos, skills) almacenado en la base
de datos vía Prisma. Se quiere ofrecer una versión en inglés tanto de la interfaz como del
contenido del portfolio y del CV descargable (`/cv`, que usa `window.print()`).

## Objetivo

Permitir a un visitante alternar entre español e inglés en el sitio público y en el CV
descargable, y darle al admin (único usuario) una forma de generar y editar la traducción
al inglés del contenido sin tener que escribirla desde cero.

## Alcance

- Interfaz de usuario (textos fijos: botones, labels, encabezados de sección).
- Contenido traducible de: `Profile.tagline`, `Profile.bio`, `Experience.title`,
  `Experience.description`, `Project.description`.
- Selector de idioma en el header/nav del sitio público.
- Botón "Traducir a inglés" en el panel `/admin` para los campos anteriores, usando la API
  de DeepL, con el resultado editable antes de guardar.
- Fuera de alcance: nombres de empresa/organización, nombres y stack de proyectos, nombres
  de skills y categorías de skills — se consideran términos técnicos/nombres propios que no
  se traducen.
- Fuera de alcance: rutas separadas por idioma (`/en/...`) — el cambio de idioma es en
  cliente, vía signal, sin recarga de página ni build separado.

## Arquitectura

Tres piezas independientes:

1. **i18n de interfaz**: diccionario ES/EN en el frontend, sin tocar el backend.
2. **Traducción de contenido**: campos duplicados en la base de datos + endpoint backend que
   llama a DeepL bajo demanda (disparado manualmente desde el admin, nunca automático).
3. **Selector de idioma**: `LanguageService` con `signal<'es' | 'en'>`, persistido en
   `localStorage`, consultado por las otras dos piezas.

## Modelo de datos (Prisma)

Se agregan columnas `*En` nullable a los campos de texto libre que tiene sentido traducir:

```prisma
model Profile {
  // ...existentes
  taglineEn String? @map("tagline_en")
  bioEn     String? @map("bio_en")
}

model Experience {
  // ...existentes
  titleEn       String? @map("title_en")
  descriptionEn String? @map("description_en")
}

model Project {
  // ...existentes
  descriptionEn String? @map("description_en")
}
```

Migración nueva, nullable, no rompe datos existentes ni el seed actual.

## Backend

- `POST /api/translate`, protegido con `JwtAuthGuard` (solo admin autenticado).
  - Request: `{ text: string }`
  - Response: `{ translated: string }`
  - Llama a la API de DeepL usando `DEEPL_API_KEY` (nueva variable en `.env`/`.env.example`).
  - No persiste nada — solo traduce. El guardado del campo `*En` lo hace el mismo endpoint
    `PATCH` que ya existe para cada entidad (`/api/profile`, `/api/experience/:id`,
    `/api/projects/:id`), agregando el campo `*En` a sus DTOs.
  - Rate-limit con `@Throttle` (mismo patrón que `auth.controller.ts`) para evitar llamadas
    accidentales repetidas.

## Frontend

- `LanguageService` (nuevo, `core/services/`):
  - `signal<'es' | 'en'>('es')`, inicializado desde `localStorage`, persiste en cada cambio.
  - Expone un método/computed para leer "el valor correcto" de un par `{ es, en }` con
    fallback a español si `en` está vacío o no existe.
- Diccionario de UI (`i18n/strings.ts` o similar), consultado en templates vía un pipe o
  método `t('clave')`. Cubre labels/botones/encabezados de: header público, `LoginComponent`
  (ya tiene MFA), `CvComponent`, secciones de home.
- Toggle "ES | EN" visible en el header/nav del sitio público.
- **Admin** (`profile-edit`, `experience-admin`, `projects-admin`): cada campo traducible
  muestra dos textareas (ES arriba, EN abajo) + botón "Traducir a inglés" que llama a
  `POST /api/translate`, llena el textarea EN (editable), sin guardar automáticamente — el
  guardado sigue siendo el botón "Guardar" existente de cada formulario.
- **Sitio público y `CvComponent`**: cada campo traducible se resuelve vía el
  `LanguageService` (`campoEn || campo` cuando el idioma activo es `'en'`).
- `Descargar PDF` no cambia: sigue siendo `window.print()`; imprime lo que esté renderizado
  en el idioma activo en ese momento.

## Manejo de errores

- Si `POST /api/translate` falla (API de DeepL caída, límite excedido, red): mostrar mensaje
  de error inline en el admin ("No se pudo traducir, inténtalo de nuevo") sin bloquear el
  guardado manual del campo EN.
- Si un campo `*En` está vacío y el idioma activo es inglés: fallback silencioso al campo en
  español (nunca un hueco vacío en la UI pública ni en el CV).

## Testing

- Backend: test unitario de `POST /api/translate` mockeando la llamada HTTP a DeepL (mismo
  patrón que `auth.service.spec.ts` mockea `bcrypt`).
- Frontend: verificación manual en navegador — toggle ES/EN en header, botón "Traducir a
  inglés" en cada formulario admin, fallback cuando falta `*En`, y descarga de PDF en inglés
  desde `/cv`.
