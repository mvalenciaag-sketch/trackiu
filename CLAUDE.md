# CLAUDE.md — TrackIU

> Memoria persistente del proyecto. Léeme al inicio de cada sesión.
> Si algo aquí contradice una petición puntual, pregunta antes de romper convenciones.

---

## 1. Qué es TrackIU

**TrackIU** es una app **mobile-first (PWA)** de seguimiento de entrenamiento de gimnasio.
El objetivo es que el usuario tenga control total y personalización completa sobre:

1. **Biblioteca de ejercicios propios** con atributos ricos (rol, mecánica, grupos musculares…).
2. **Días/plantillas de rutina** (push, pull, upper, legs…) construidos a partir de esos ejercicios.
3. **Calendario** donde se asignan esos días a fechas.
4. **Registro de sesión en vivo**: series, kilos, reps y opciones avanzadas (RIR, RPE, ROM, tempo, descanso).
5. **Seguimiento histórico** del progreso (volumen, PRs, evolución por ejercicio).

Filosofía de producto: **intuitiva, funcional y 100% personalizable**. El usuario no debe sentirse encajado en un tipo de rutina concreto.

El desarrollo es **incremental por fases**. Se irán añadiendo prompts posteriores. No implementes funciones de fases futuras salvo que se pidan explícitamente.

---

## 2. Stack tecnológico

- **Framework**: Next.js 14 (App Router) + TypeScript (strict).
- **UI**: Tailwind CSS + Framer Motion (animaciones y microinteracciones).
- **Backend / DB**: Supabase (Postgres + Auth + RLS + Realtime + Storage).
- **PWA**: instalable, mobile-first, con soporte offline para el registro de sesiones.
- **Estado**: React Context / Zustand para la sesión de entreno activa; React Query (TanStack) o Server Components + Server Actions para datos remotos.
- **Iconos**: lucide-react.

Acceso a Supabase vía **MCP**: usa las herramientas MCP para crear y aplicar migraciones, listar tablas y verificar RLS. No edites el esquema a mano sin migración.

---

## 3. Convenciones de código

- **TypeScript estricto**, sin `any` salvo justificación. Tipos derivados del esquema Supabase (`supabase gen types`).
- **Idioma**: UI y dominio de negocio **en español** (nombres de ejercicios, días, etc.). Código, nombres de variables, funciones y comentarios técnicos en **inglés**.
- **Naming**:
  - Componentes: `PascalCase` (`ExerciseCard.tsx`).
  - Hooks: `useCamelCase` (`useActiveSession.ts`).
  - Tablas y columnas SQL: `snake_case`.
  - Rutas: `kebab-case`.
- **Server Components por defecto**; `"use client"` solo cuando haya interactividad o estado.
- **Sin librerías de UI pesadas** (nada de Material UI). Componentes propios con Tailwind.
- **Mobile-first siempre**: diseñar a 375–430px de ancho primero, escalar hacia arriba después.
- **Accesibilidad táctil**: targets mínimos de 44×44px, navegación inferior con el pulgar en mente.
- **Animaciones**: Framer Motion con duraciones cortas (150–250ms), `prefer-reduced-motion` respetado.
- No introducir dependencias nuevas sin justificarlo en el chat.

---

## 4. Glosario de dominio (importante para no confundir conceptos)

| Término | Significado en TrackIU |
|---|---|
| **Ejercicio** (`exercise`) | Entrada de la biblioteca personal del usuario. Reutilizable. |
| **Rol** (`role`) | `principal` \| `secundario` \| `accesorio`. Importancia del ejercicio en una rutina. |
| **Mecánica** (`mechanics`) | `compuesto` (= "complejo", multiarticular) \| `aislado` (monoarticular). |
| **Grupo muscular** (`muscle_group`) | Músculo trabajado. Un ejercicio puede tener varios como `primary` o `secondary`. |
| **Día / Plantilla** (`routine_day`) | Plantilla reutilizable tipo "Push", "Legs", "Upper". Contiene ejercicios ordenados. |
| **Entrada de calendario** (`scheduled_session`) | Asignación de un día a una fecha concreta. |
| **Sesión** (`workout_session`) | Ejecución real de un día en una fecha. Contiene los registros de series. |
| **Serie** (`set_log`) | Registro de una serie: peso, reps + campos avanzados. |
| **RIR** | Reps In Reserve (reps que quedan en el tanque). |
| **RPE** | Rate of Perceived Exertion (1–10). |
| **ROM** | Range Of Motion: `completo` \| `parcial` \| `lengthened` \| `corto`. |
| **Tempo** | Cadencia, p. ej. "3-1-1-0" (excéntrica-pausa-concéntrica-pausa). |

> "Día" en el contexto de rutina = plantilla, NO una fecha del calendario. La fecha es `scheduled_session`.

---

## 5. Modelo de datos (Supabase / Postgres)

Todas las tablas de usuario llevan `user_id uuid references auth.users` y **RLS activado** (cada usuario solo ve/edita lo suyo). `id uuid default gen_random_uuid()`, `created_at`, `updated_at`.

- **`muscle_groups`** — músculos. Los `is_default = true` (`user_id` null) son globales; el usuario puede crear los suyos.
- **`exercises`** — biblioteca. Campos: `name`, `role`, `mechanics`, `equipment`, `notes`. Relación con músculos vía join.
- **`exercise_muscle_groups`** — join `exercise_id` ↔ `muscle_group_id` + `relation` (`primary`/`secondary`).
- **`routine_days`** — plantillas. Campos: `name`, `description`, `color`, `position`.
- **`routine_day_exercises`** — ejercicios dentro de un día: `routine_day_id`, `exercise_id`, `position`, `target_sets`, `notes`.
- **`scheduled_sessions`** — calendario: `routine_day_id`, `date`, `status` (`planned`/`completed`/`skipped`).
- **`workout_sessions`** — ejecución: `routine_day_id` (nullable para ad-hoc), `scheduled_session_id` (nullable), `date`, `started_at`, `completed_at`, `notes`.
- **`set_logs`** — series: `session_id`, `exercise_id`, `set_number`, `set_type` (`warmup`/`working`/`drop`/`failure`), `weight_kg`, `reps`, `rir`, `rpe`, `rom`, `tempo`, `rest_seconds`, `is_completed`, `notes`.

> El esquema SQL completo y listo para migrar está en el prompt de la Fase 1.

---

## 6. Estructura de carpetas (orientativa)

```
/app
  /(auth)            -> login / registro
  /ejercicios        -> biblioteca CRUD
  /dias              -> plantillas de rutina
  /calendario        -> vista calendario
  /sesion/[id]       -> registro de sesión en vivo
  /perfil
/components
  /ui                -> primitivos (Button, Sheet, Input, Chip...)
  /exercises
  /routine-days
  /calendar
  /session
/lib
  /supabase          -> clientes (server/client), tipos generados
  /hooks
  /utils
/stores              -> estado de sesión activa
```

---

## 7. Reglas de Supabase

- Cada tabla nueva → migración + política RLS en la misma migración.
- RLS: `auth.uid() = user_id` para select/insert/update/delete del propietario. `muscle_groups` por defecto visibles para todos en lectura.
- Regenerar tipos TS tras cada cambio de esquema.
- Realtime: por ahora **no** es necesario (se valorará en fases sociales/multi-dispositivo).

---

## 8. Autenticación

> ⚠️ **Confirmación de email DESACTIVADA temporalmente** (desarrollo).
> `signUp()` devuelve sesión directa → el usuario entra sin confirmar correo.
> **Reactivar antes de producción**: toggle "Confirm email" en Supabase → Authentication → Providers → Email + restaurar pantalla "revisa tu correo" en `app/(auth)/registro/page.tsx` (ver historial git).


- **Métodos**: email/contraseña + Google OAuth (PKCE via `@supabase/ssr`).
- **Callback route**: `app/auth/callback/route.ts` — intercambia code → session, detecta primer login con Google.
- **Onboarding**: primer login con Google → `/onboarding` para elegir nombre (guardado en `user_metadata.username`). Logins posteriores → `/calendario` directamente.
- **Middleware** (`lib/supabase/middleware.ts`): `/auth/callback` y `/onboarding` son rutas especiales; rutas protegidas redirigen a `/login` si no hay sesión.
- **Email/contraseña**: login en `/login`, registro en `/registro` (flujo original intacto).

---

## 9. Roadmap por fases

- **Fase 1 (actual)** — Fundación: auth, biblioteca de ejercicios, grupos musculares, días/plantillas, calendario y registro de sesión con campos avanzados. Vista de progreso básica.
- **Fase 2** — Analítica de progreso: volumen por grupo muscular, PRs, gráficas de evolución por ejercicio, e1RM estimado.
- **Fase 3** — Offline-first completo (sincronización en segundo plano) + plantillas duplicables y reordenables.
- **Fase 4** — Descanso/temporizadores, supersets/circuitos, notas por sesión, mediciones corporales.
- **Fase 5+** — Social / compartir rutinas (a definir).

> No te adelantes a fases futuras. Si una decisión de Fase 1 condiciona una fase futura, déjalo anotado pero no lo implementes.

---

## 9. Qué NO hacer

- No usar `localStorage` como fuente de verdad persistente (solo caché de sesión activa). La verdad vive en Supabase.
- No crear esquemas sin RLS.
- No meter librerías de componentes pesadas.
- No diseñar desktop-first.
- No implementar funciones de fases futuras sin pedirlo.
- No romper convenciones de naming/idioma de la sección 3.

---

## 10. Flujo de trabajo Claude Design ↔ Claude Code

> Cómo iterar diseño e implementación en paralelo sin que se pisen.

**Vinculación**
- El código se enlaza en Claude Design vía GitHub (no carpeta local), para que sea un bucle vivo y no instantáneas sueltas.
- Tras cada merge, en Design pulsar "Sync now" para que vea los componentes reales actualizados.

**Bucle por trozos (no un handoff gigante)**
1. Diseñar una pieza completa en Design (una fase / pantalla).
2. Export → Hand off to Claude Code (preferir Claude Code Web para seguir diseñando en paralelo; local si se quiere control total).
3. Claude Code implementa el trozo en una rama propia → PR → revisar → merge.
4. En Design, Sync now y diseñar el siguiente trozo sobre la versión ya actualizada.
5. Repetir.

**Reglas para no chocar**
- Lo transversal primero: contenedor mobile-first, tokens de color y nav se implementan y fusionan ANTES que las pantallas; el resto construye encima.
- No editar el mismo archivo por los dos lados a la vez. Trabajar en trozos que toquen archivos distintos.
- Documentar las decisiones de diseño en el chat de Design y nombrar los componentes con claridad: esos nombres y razones viajan en el handoff.
- Antes de cada handoff, cubrir estados límite: vacío, error, carga, distintos volúmenes de datos.

**Prompt base para pegar en Claude Code tras un handoff**
> Lee CLAUDE.md. Implementa este handoff respetando los tokens de color y los componentes existentes (intégralo en lo que ya hay, no crees un sistema de UI paralelo). Mantén el contenedor mobile-first. NO toques el esquema de Supabase ni la lógica de auth. Hazme un plan breve, trabaja en una rama, y para a revisar antes de fusionar.

**Invariantes que ningún handoff debe romper**
- Paleta/tokens de color de TrackIU.
- Contenedor mobile-first.
- Esquema de Supabase, RLS y auth (email/contraseña + Google).
- Convenciones de naming/idioma de la sección 3.
