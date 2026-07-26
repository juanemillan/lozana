# Lozana — Guía de construcción y estado del proyecto

## Identidad de marca (definida)
- Wordmark: `lozana` minúscula, "lo" bold Fraunces sage (#4F6B55), "zana" italic Fraunces terracota (#B08064)
- Ícono: arco grueso terracota dentro de círculo sage (basado en B9-2) — **falta dibujar el SVG final a mano**
- Tipografía: Fraunces (display, con italic), Inter (cuerpo), IBM Plex Mono (datos/fechas)
- Paleta (Tailwind v4, vía `@theme` en `globals.css`, no `tailwind.config.ts`):
  papel `#ECE7DA`, superficie `#FBF9F3`, tinta `#2A281F`, tinta suave `#6B674F`,
  líneas `#D8D0BC` / `#C2B89C`, sage `#4F6B55`, arcilla `#B08064`, ciruela `#8B5A66`, arena `#DDD6C8`,
  cada acento con su par `-tint` (fondo) y `-deep` (texto). El `-deep` es el único que pasa
  contraste AA sobre su `-tint`: para texto de 10px es obligatorio.
- Pills: `border-radius:10px` (no `rounded-full`), inline junto al nombre, no en línea aparte

## Idioma
- **Español neutro, nunca variante argentina.** Aplica a las respuestas y a los textos de la app.
- **Deuda conocida:** los textos actuales de la interfaz están en argentino ("Registrate",
  "¿Cómo te llamás?", "Agregá algunos en Productos"). Se corrigen junto con el i18n, no antes,
  para no hacer el trabajo dos veces.
- Inglés como segundo idioma: detección por header `Accept-Language`, español de respaldo,
  selector manual guardado en cookie. **Sin geolocalización** — el país es peor señal que el
  idioma configurado (alguien en EE.UU. puede preferir español).
- Ojo al implementarlo: Next 16 renombró `middleware.ts` a `proxy.ts`; hay que verificar que la
  biblioteca de i18n que se use ya lo soporte.

## Stack técnico (decidido)
- Next.js 16 (App Router) + TypeScript + Tailwind v4 (config CSS-first, sin `.ts`)
- Supabase (Postgres + Auth + Storage)
- Rutas reales por sección: `/`, `/productos`, `/alimentacion`, `/ejercicio`, `/bitacora`, `/perfil`
- Navegación responsive: sidebar en desktop (`md:`), bottom bar fija en mobile
- Compresión de imágenes en cliente (`browser-image-compression`) antes de subir a Storage

---

## ✅ Fase 1 — Setup del proyecto (completa)
1.1 Proyecto Next.js · 1.2 Dependencias base · 1.3 Fuentes (`next/font/google`) · 1.4 GitHub

## ✅ Fase 2 — Base de datos (completa)
Tablas: `users`, `products`, `foods`, `exercises`, `checklist_entries`, `photos`, `log_entries`.
Migraciones en `supabase/migrations/`.

## ✅ Fase 3 — CRUD conectado a Supabase (completa)
`Productos.tsx`, `Alimentacion.tsx`, `Ejercicio.tsx`, `Bitacora.tsx`, las cuatro con alta,
edición y borrado. Productos tuvo el formulario de alta más tarde que las otras: originalmente
solo tenía borrado y un botón de activar/desactivar.

## ✅ Fase 4 — Subida de imágenes (completa)
Bucket `photos` **privado**. Las políticas de `storage.objects` cuelgan de la convención de ruta
`{user_id}/{carpeta}/{archivo}`, validando `storage.foldername(name)[1] = auth.uid()`.

Como ya no hay URL pública estable, `products.image_url` pasó a llamarse **`image_path`** y
guarda una ruta, no un enlace. Al mostrar la imagen se firma la URL en el momento
(`useSignedUrl.ts`, vence en una hora). Tres orígenes convergen en el mismo almacenamiento:
cámara (`capture` en móvil), archivo del dispositivo, y —cuando se haga 10.2— descarga desde la
web hecha por el servidor.

## ✅ Fase 5 — Checklist diario (completa)
`Checklist.tsx` en `/` (Hoy): marca AM/PM por producto activo, calcula racha de días seguidos.

## 🔄 Fase 6 — Diseño final
- 6.0 Navegación responsive + rutas reales — **hecho**
- 6.1 Base visual: tokens + componentes UI — **hecho**
- 6.2 Base visual aplicada a las secciones — **hecho**
- 6.3 Resumen con métricas — **hecho** (`Resumen.tsx`)
- 6.4 Edición (✎) en las 4 secciones — **hecho**
- 6.5 Dibujar el ícono SVG final (arco + círculo) a mano — **pendiente**
- 6.6 Pantalla de inicio/splash con movimiento sutil — **pendiente**
- 6.7 (nuevo) Transiciones y movimiento — **hecho**. Ver sección aparte abajo.
- 6.8 Tarjetas de Productos compactas y expandibles — **hecho**. La vista inicial prioriza
  foto, marca/línea, nombre, horario y frecuencia; el resto y las acciones aparecen al expandir.

## ✅ Fase 7 — Autenticación y RLS real
- 7.1 Auth email/password — **hecho** (`AuthProvider`, `LoginForm` con login y registro, `AppShell`)
- 7.2 Policies con `auth.uid() = user_id` en las 6 tablas — **hecho** (`002`, corrida)
- 7.3 Cada `insert` escribe el `user_id` de la sesión — **hecho**
- 7.4 Perfil + onboarding de 3 pasos saltable — **hecho** (`004`, corrida)
- 7.5 Bucket `photos` privado + URLs firmadas — **hecho** (`004`, `uploadImage.ts`, `useSignedUrl.ts`).
  `products.image_url` pasó a `image_path`: guarda un path de Storage, no una URL.
- 7.6 Backfill de `user_id` — **reportado como ejecutado, sin verificación técnica** (`003`)

**Pendiente de la fase:** apagar el registro público en Supabase
(Authentication → Providers → Email → *Enable sign ups* en off). Con RLS una cuenta ajena entra
a un espacio vacío y no ve nada tuyo, pero consume cuota de correos y deja gente dando vueltas.

## ✅ Fase 8 — Deploy en Vercel
- 8.1 Repo conectado — **hecho**
- 8.2 Variables de entorno en Vercel — **hecho**
- 8.3 Site URL de Supabase apuntando al dominio de Vercel — **hecho**
  (Authentication → URL Configuration. `localhost:3000/**` sigue en Redirect URLs para desarrollo.)
- 8.4 Registro y confirmación de correo probados en producción — **hecho**

## Fase 9 — Push notifications
- 9.1 Service worker / Web Push · 9.2 Recordatorios programados · 9.3 Checks desde la notificación
- Insumo ya disponible: `repurchase` + `opened_at` + `pao_months` permiten avisar
  "se te acaba" y "está por vencer" sin pedirle nada al usuario.

## Fase 10 — Integración con Claude API
Todo esto va en Route Handlers del lado del servidor. **La `ANTHROPIC_API_KEY` nunca lleva
prefijo `NEXT_PUBLIC_`**: ese prefijo la incrusta en el bundle del navegador, y a diferencia de la
anon key de Supabase —protegida por RLS— una clave de Anthropic expuesta la usa cualquiera.

- 10.1 Prellenar el formulario desde un link de compra — **pendiente**.
  El usuario pega la URL, el modelo lee esa página y devuelve marca / línea / nombre / tamaño /
  precio con salida estructurada. Degradar bien: si el sitio bloquea el acceso, buscar por
  nombre; si tampoco, dejar el formulario a mano.
- 10.2 Foto del producto desde la web — **pendiente**. Claude encuentra la *dirección* de la
  imagen; **descargarla la hace el servidor** y la sube al bucket, para que se comporte igual que
  la cámara y el archivo local (misma compresión, misma URL firmada, mismas policies).
  Claude no genera ni devuelve imágenes.
- 10.3 Análisis de rutina: conflictos entre activos y alternativas — **pendiente**.
  Es el mejor uso de los tres: razonamiento sobre conocimiento, no consulta de datos en vivo.
  El perfil (tipo de piel, preocupaciones, sensibilidades, objetivo) ya es el contexto.
  Presentarlo como orientación, **no como consulta dermatológica**.
- 10.4 Escaneo de foto de producto (etiqueta → datos) — **pendiente**
- 10.5 Asistente conversacional con tools — **pendiente**

**Modelo por tarea** (mismo SDK, solo cambia un string): Opus para visión y razonamiento,
Sonnet para diálogo con herramientas, Haiku para tareas simples. No mezclar proveedores: la
integración cuesta más que lo que ahorra, y los planes gratuitos suelen entrenar con tus datos
— aquí eso son fotos de la cara de alguien y notas de salud.

## Fase 11 (opcional) — Extras
- Modo reacción · Notificación redactada por Claude
- Categorías nuevas de ejercicio (kegel, cuello, elongación, postura)

---

## Movimiento (implementado)
Tokens en `globals.css`, calibrables sin tocar reglas:
- `--duracion-vista: 650ms` — el cruce entre secciones, lo más largo de la interfaz a propósito
- `--duracion-entrada: 380ms` / `--duracion-salida: 180ms` — la salida siempre más rápida
- `--escalon-lista: 45ms` — separación entre tarjetas al entrar
- `--retraso-esqueleto: 400ms` — cuánto espera el esqueleto antes de aparecer

Decisiones que conviene no deshacer sin querer:
- **Las transiciones de vista corren superpuestas, no encadenadas.** Encadenarlas deja un
  intervalo con la pantalla vacía, y ese hueco es lo que se percibe como un corte.
- **El desenfoque de 5px no es adorno:** durante el cruce hay dos capas a media opacidad y el
  texto de ambas se lee duplicado. Difuminarlas es lo que da la sensación de suavidad.
- **La sidebar, la barra inferior y el encabezado están anclados** con `viewTransitionName` y
  animación anulada. Si el armazón se moviera, se perdería el punto de referencia.
- **El esqueleto arranca invisible.** Mostrarlo y retirarlo en 100ms produce un parpadeo de
  tarjetas fantasma que molesta más que no mostrar nada.
- **Se respeta `prefers-reduced-motion`**: mismos cambios de estado, sin desplazamientos.

## Decisiones de producto tomadas
- **Sin catálogo compartido de productos, y sin IA que lo rellene.** Un autocompletado
  equivocado es peor que ninguno: prellenado desde "la base" se acepta sin verificar. Un modelo
  generando fichas sin fuente inventa variantes y PAOs plausibles pero falsos, y esos errores
  quedan indistinguibles de los aciertos. Además el catálogo es función multiusuario y hoy hay uno.
  - Lo que sí se hizo: **autocompletado desde el propio historial** (`Autocomplete.tsx` +
    `lib/sugerencias.ts`), cierto por construcción.
  - Si algún día hay varios usuarios: catálogo alimentado por confirmaciones, con el modelo
    **normalizando** ("CeraVe" / "cerave"), nunca inventando.
- **Precios y ofertas: bajo demanda, no rastreo de fondo.** Los sitios cambian y muchos bloquean
  el acceso automatizado. Un botón "¿bajó de precio?" sí; un cron diario no.
- **Verificar autenticidad con IA: descartado.** Un modelo no puede hacerlo y produciría una
  conjetura con tono seguro. Los dos errores son caros: aprobar una falsificación que va a la
  cara, o descartar un producto genuino. En su lugar, guardar `purchase_url` y enlazar al
  verificador oficial de la marca.
- **Vencimiento: aritmética, no IA.** Una consulta lo resuelve al instante, gratis y sin
  equivocarse (`lib/vencimiento.ts`).
- **Marca / línea / nombre son campos separados.** La regla útil no es reproducir la jerarquía
  oficial de cada marca sino guardar **lo que se repite entre tus productos**. Ejemplo real:
  K-SECRET (marca) · Seoul 1988 (línea) · Eye Cream Retinal Liposome 4% (nombre).
  Mientras el corte sea consistente, el autocompletado agrupa bien.

## Campos de producto
Además de los originales: `brand`, `product_line`, `purchase_url`, `pao_months`, `expires_at`,
`repurchase`, `currency_code`, `size_value`, `size_unit`.
- `repurchase` admite **null a propósito**: "todavía no lo decidí" no es lo mismo que "no lo
  repetiría", y esa distinción importa para el calendario y las notificaciones.
- `pao_months` se combina con `opened_at` (que existía sin usarse desde `001`). En cosmética el
  vencimiento que manda suele ser el de apertura, no el impreso: un retinal se oxida en meses
  aunque la fecha impresa diga dos años.
- `currency_code` es ISO 4217 de tres letras. **Obligatorio solo si hay precio**, y con un
  constraint `NOT VALID`: se exige al insertar y al editar, pero no se les inventa moneda a los
  registros anteriores a `007`. El formato lo hace `Intl.NumberFormat`, que ya sabe que CLP y
  JPY no llevan decimales.
- `size_value` + `size_unit` (ml, g, unidad) reemplazan a `size_ml`. **ml y g no son
  equivalentes**: son magnitudes distintas y el precio por unidad ya no las mezcla.
  La unidad es obligatoria solo si hay cantidad.
- `size_ml` quedó **obsoleta** tras `007`, que trasladó sus valores a `size_value` con unidad
  `ml`. La app ya no la lee ni la escribe; se conserva como respaldo del traslado y se puede
  eliminar en una migración posterior cuando esté confirmado.
- Se llama `product_line` y no `line` porque `line` es un tipo geométrico de Postgres.

## Foto de producto
Se elige dentro del formulario, en alta y en edición, con previsualización local antes de
guardar (`URL.createObjectURL`). **No se sube al seleccionar.** El orden importa: en un alta no
existe todavía el id al que asociar la imagen, así que primero se guarda el producto, se toma su
id con `.select('id').single()`, y recién entonces se sube. Si no se elige foto nueva,
`image_path` no se toca.

Si el producto se guarda pero la subida falla, el formulario **se cierra igual** —el producto ya
existe y reintentar crearía un duplicado— y el aviso explica qué faltó. El control de foto que
antes vivía en la tarjeta se quitó: duplicaba la acción y subía sin confirmación.

---

## Estado de las migraciones

Tres estados distintos, que conviene no confundir:
**escrita** (el `.sql` existe en el repo) · **aplicada** (verificada contra Supabase) ·
**sin verificar** (reportada como corrida, pero no comprobable desde fuera).

| Archivo | Qué hace | Estado |
|---|---|---|
| `001_init.sql` | Tablas base | ✅ aplicada |
| `002_auth_rls.sql` | RLS con `auth.uid() = user_id` en las 6 tablas | ✅ aplicada |
| `003_backfill_user_id.sql` | Asigna filas huérfanas y aplica `NOT NULL` | ⚠️ sin verificar |
| `004_profile_storage.sql` | Campos de perfil, bucket privado, `image_url`→`image_path` | ✅ aplicada |
| `005_producto_compra_vencimiento.sql` | brand, purchase_url, size_ml, pao_months, expires_at, repurchase | ✅ aplicada |
| `006_producto_linea.sql` | product_line | ✅ aplicada |
| `007_producto_moneda_unidad.sql` | currency_code, size_value, size_unit | ✅ aplicada |

**Cómo se comprobó** (2026-07-26, con la anon key desde fuera de la app):
- Existencia de columnas: PostgREST devuelve *400 column does not exist* aunque RLS oculte las
  filas, así que se puede consultar el esquema sin ver datos. Todas las columnas de 004, 005 y
  006 responden 200. `image_url` ya no existe, lo que confirma el renombrado de 004.
- RLS: anon lee 0 filas en las 6 tablas y un insert anónimo devuelve 401.
- **`003` no es verificable así**: su efecto observable es el `NOT NULL` sobre `user_id`, que
  se leería del esquema OpenAPI de PostgREST, y ese endpoint exige autenticación (401 con la
  anon key). Queda como reportada por el usuario, no confirmada.
- **`007`**: sus tres columnas responden 200 y el usuario confirmó haber corrido el archivo.
  Los **constraints no son verificables desde fuera** (no hay forma de leer `pg_constraint` con
  la anon key, y RLS impide provocar una violación a propósito), así que esa parte queda
  respaldada por la ejecución, no por comprobación.

---

**Dónde estamos ahora:** desplegado en Vercel, con auth y RLS cerrados y verificados. El esquema
está al día: `product_line` completo de punta a punta y la app guardando productos.

Pendiente inmediato:
1. Apagar el registro público (Authentication → Providers → Email → *Enable sign ups* en off)
2. Confirmar si `003` se aplicó (revisar en el SQL Editor si `products.user_id` es `NOT NULL`)

Después, decidir rumbo: Fase 10 (IA), el i18n con la corrección al español neutro, o cerrar
Fase 6 (ícono SVG y splash).

**Cómo avanzar:** ve paso por paso. Si te trabas, pega el error o di en qué parte estás.
