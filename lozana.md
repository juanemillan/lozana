# Lozana — Guía de construcción y estado del proyecto

## Identidad de marca (definida)
- Wordmark: `lozana` minúscula, "lo" bold Fraunces sage (#4F6B55), "zana" italic Fraunces terracota (#B08064)
- Ícono: arco grueso terracota dentro de círculo sage (basado en B9-2) — **falta dibujar el SVG final a mano**
- Tipografía: Fraunces (display, con italic), Inter (cuerpo), IBM Plex Mono (datos/fechas)
- Paleta (Tailwind v4, vía `@theme` en `globals.css`, no `tailwind.config.ts`):
  papel `#ECE7DA`, papel claro `#F7F4EC`, sage `#4F6B55`, sage medio `#8FA888`,
  menta `#D8E4D2`, verde pálido `#EAF0E4`, arcilla `#B08064`, ciruela `#8B5A66`, tinta `#2A281F`,
  + variantes `-deep` de sage/clay/plum para texto pequeño (contraste WCAG)
- Pills: `border-radius:10px` (no `rounded-full`), inline junto al nombre, no en línea aparte

## Stack técnico (decidido)
- Next.js (App Router) + TypeScript + Tailwind v4 (config CSS-first, sin `.ts`)
- Supabase (Postgres + Auth + Storage)
- Rutas reales por sección (no tabs de estado local): `/`, `/productos`, `/alimentacion`, `/ejercicio`, `/bitacora`
- Navegación responsive: sidebar en desktop (`md:`), bottom bar fija en mobile (con `safe-area-inset-bottom`)
- Compresión de imágenes en cliente (`browser-image-compression`) antes de subir a Supabase Storage

---

## ✅ Fase 1 — Setup del proyecto (completa)
1.1 Proyecto Next.js creado · 1.2 Dependencias base · 1.3 Fuentes conectadas (`next/font/google`) · 1.4 GitHub

## ✅ Fase 2 — Base de datos (completa)
Tablas creadas: `users`, `products`, `foods`, `exercises`, `checklist_entries`, `photos`, `log_entries`.
Migración en `supabase/migrations/001_init.sql` (en la raíz del proyecto, no en `src`).
`products` tiene además `description` y `price` (agregado sobre la marcha).

## ✅ Fase 3 — CRUD conectado a Supabase (completa)
Componentes `Productos.tsx`, `Alimentacion.tsx`, `Ejercicio.tsx`, `Bitacora.tsx` con fetch/insert/update/delete reales.
**Pendiente dentro de esta fase:** UI de edición (✎) — hoy solo hay alta y borrado.

## ✅ Fase 4 — Subida de imágenes (completa)
Bucket `photos` (público, límite 5MB). Compresión a máx. 1600px / ~300KB antes de subir.

## ✅ Fase 5 — Checklist diario (completa)
Componente `Checklist.tsx` en `/` (Hoy): marca AM/PM por producto activo, calcula racha de días seguidos.

## 🔄 Fase 6 — Diseño final (en progreso)
- 6.0 (nuevo) Navegación responsive + rutas reales — **hecho** (sidebar/bottom bar, App Router)
- 6.1 Base visual: tokens completos + componentes UI (`Card`, `Pill`, `Button`, `Field`, `SectionTitle`, `IconButton`, `EmptyState`) — **hecho**
- 6.2 Aplicar la base visual a las 4 secciones existentes — **hecho**
- 6.3 Panel Resumen con métricas (los 4 contadores del prototipo HTML) — **hecho** (`Resumen.tsx` en `/`)
- 6.4 Edición (✎) en las 4 secciones — **hecho**. Productos ganó además su formulario de alta,
  que no existía. El estado ahora se cambia desde el form (Activo/Pendiente/Pausado) y ya no
  con el botón Activar/Desactivar, que escribía "Inactivo" y no cuadraba con las métricas.
- 6.5 Dibujar el ícono SVG final (arco + círculo) a mano — **pendiente**
- 6.6 Pantalla de inicio/splash con movimiento sutil — **pendiente**

## 🔄 Fase 7 (nueva, insertada) — Autenticación y RLS real
**Se decidió hacer esto antes del deploy, no después.**
- 7.1 Auth simple con Supabase (email/password) — **código hecho**
  (`AuthProvider.tsx`, `LoginForm.tsx` con login + registro, `AppShell.tsx`; gate de sesión
  y botón de salir en el header)
- 7.2 Policies reales con `auth.uid() = user_id` — **SQL escrito, falta correrlo**
  (`supabase/migrations/002_auth_rls.sql`)
- 7.3 Cada `insert` del cliente escribe el `user_id` de la sesión — **hecho**
  (`foods`, `exercises`, `log_entries`, `checklist_entries`; `products` todavía no tiene alta)

- 7.4 Perfil de usuario + onboarding — **código hecho**
  (`004_profile_storage.sql`, `Onboarding.tsx` de 3 pasos saltable, `Perfil.tsx` en `/perfil`,
  botón de avatar arriba a la derecha, recordatorio en el Resumen si el perfil está incompleto)
- 7.5 Bucket `photos` privado + URLs firmadas — **código hecho** (en `004`, `uploadImage.ts`,
  `useSignedUrl.ts`). `products.image_url` pasó a llamarse `image_path`: ahora guarda un path
  de Storage, no una URL, porque con el bucket privado no hay URL estable.

**Para cerrar la fase, en orden:**
1. Correr `002_auth_rls.sql` en el SQL Editor
2. Correr `004_profile_storage.sql`
3. Registrarte desde la app (botón "Registrarme" en la pantalla de inicio) y completar el onboarding
4. Correr `003_backfill_user_id.sql` — le asigna las filas viejas a tu usuario
5. Apagar el registro público: Authentication → Providers → Email → *Enable sign ups* en off
6. Reverificar que la anon key ya no lee nada

**Ojo:** la app no funciona hasta que corran 002 y 004. `image_path` y los campos de perfil
no existen todavía en la base.

## Fase 8 — Deploy en Vercel
- 8.1 Conectar repo de GitHub a Vercel
- 8.2 Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel (hoy solo están en `.env.local`)
- 8.3 Deploy y prueba en el teléfono como PWA

## Fase 9 — Push notifications
- 9.1 Service worker / Web Push · 9.2 Recordatorios programados · 9.3 Checks rápidos desde la notificación

## Fase 10 — Integración con Claude API
- 10.1 Definir tools (`addProduct`, `updateProduct`, `deleteProduct`, `addLogEntry`, etc.)
- 10.2 Ruta `/api/assistant` que llama a Claude con esas tools
- 10.3 Ejecutar la función correspondiente contra Supabase según la respuesta
- 10.4 Conectar chat/input de texto (y opcionalmente voz)

## Fase 11 (opcional) — Extras
- Modo reacción · Notificación inteligente redactada por Claude
- Integración con Mercado Libre (autocompletar desde link)
- Categorías nuevas de ejercicio (kegel, cuello, elongación, postura)

---

**Dónde estamos ahora:** Fase 7 con el código listo y la migración pendiente de correr.
Después vuelve Fase 6 (Resumen 6.3, edición 6.4, SVG del ícono 6.5, splash 6.6) y recién ahí el deploy.

**Cómo avanzar:** ve paso por paso. Si te trabas, pégame el error o dime en qué parte estás.