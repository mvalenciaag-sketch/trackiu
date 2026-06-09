# TrackIU — Fase 1: Fundación

> Prompt para Claude Code. Lee primero `CLAUDE.md`. Trabaja con Supabase vía MCP.
> Implementa **solo** lo descrito en este documento. No te adelantes a fases futuras.

---

## Objetivo de la fase

Dejar funcionando el núcleo de TrackIU: el usuario puede crear su biblioteca de ejercicios personalizados, montar días/plantillas con ellos, asignarlos a fechas en un calendario, ejecutar una sesión registrando series con campos avanzados, y ver el historial básico. Todo con una interfaz **mobile-first, intuitiva y fluida**.

---

## Alcance (qué entra en Fase 1)

1. Setup del proyecto + PWA + Supabase + auth.
2. Esquema de base de datos completo (migraciones + RLS).
3. Grupos musculares (semilla por defecto + custom).
4. Biblioteca de ejercicios (CRUD con atributos).
5. Días / plantillas de rutina (CRUD + ejercicios ordenados).
6. Calendario (asignar días a fechas).
7. Registro de sesión en vivo (series, kilos, reps + avanzados).
8. Historial básico de sesiones.

**Fuera de alcance** (NO hacer ahora): analítica/gráficas avanzadas, offline-first completo, supersets, temporizadores de descanso, funciones sociales. Quedan para fases posteriores.

---

## Tarea 0 — Setup

1. Inicializa Next.js 14 (App Router) + TypeScript strict + Tailwind.
2. Configura como **PWA** instalable (manifest, iconos, service worker básico, `theme-color`). Mobile-first.
3. Configura clientes de Supabase (server y client) y variables de entorno.
4. Crea los primitivos de UI en `/components/ui`: `Button`, `Input`, `Select`, `Chip`, `BottomSheet`, `Card`, `EmptyState`, `BottomNav`. Estética limpia, oscura por defecto, táctil (targets ≥44px), microinteracciones con Framer Motion.
5. Navegación inferior con: **Calendario · Días · Ejercicios · Perfil**.

---

## Tarea 1 — Autenticación

- Email/contraseña con Supabase Auth.
- Pantallas de login y registro.
- Protección de rutas: usuario no autenticado → login.
- Al registrarse, sembrar para ese usuario nada extra (los grupos musculares por defecto son globales, ver Tarea 2).

---

## Tarea 2 — Esquema de base de datos

Crea las migraciones vía Supabase MCP. Aplica RLS en cada tabla de usuario (`auth.uid() = user_id` para CRUD del propietario). Activa `updated_at` con trigger. SQL base:

```sql
-- Helper de timestamps (crear una vez)
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- GRUPOS MUSCULARES
create table muscle_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade, -- null = global/default
  name text not null,
  slug text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EJERCICIOS (biblioteca)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  role text not null default 'principal'
    check (role in ('principal','secundario','accesorio')),
  mechanics text not null default 'compuesto'
    check (mechanics in ('compuesto','aislado')),
  equipment text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- JOIN ejercicio <-> grupo muscular
create table exercise_muscle_groups (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises on delete cascade,
  muscle_group_id uuid not null references muscle_groups on delete cascade,
  relation text not null default 'primary'
    check (relation in ('primary','secondary')),
  unique (exercise_id, muscle_group_id, relation)
);

-- DÍAS / PLANTILLAS
create table routine_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  description text,
  color text default '#6366f1',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EJERCICIOS DENTRO DE UN DÍA
create table routine_day_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references routine_days on delete cascade,
  exercise_id uuid not null references exercises on delete cascade,
  position int not null default 0,
  target_sets int default 3,
  notes text,
  created_at timestamptz not null default now()
);

-- CALENDARIO
create table scheduled_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  routine_day_id uuid references routine_days on delete set null,
  date date not null,
  status text not null default 'planned'
    check (status in ('planned','completed','skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SESIÓN EJECUTADA
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  routine_day_id uuid references routine_days on delete set null,
  scheduled_session_id uuid references scheduled_sessions on delete set null,
  date date not null default current_date,
  started_at timestamptz default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- REGISTRO DE SERIES
create table set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions on delete cascade,
  exercise_id uuid not null references exercises on delete cascade,
  set_number int not null,
  set_type text not null default 'working'
    check (set_type in ('warmup','working','drop','failure')),
  weight_kg numeric(6,2),
  reps int,
  rir int,
  rpe numeric(3,1),
  rom text check (rom in ('completo','parcial','lengthened','corto')),
  tempo text,
  rest_seconds int,
  is_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
```

**RLS**: activa en todas. Política de propietario en `exercises`, `routine_days`, `routine_day_exercises` (vía join al día), `scheduled_sessions`, `workout_sessions`, `set_logs` (vía join a la sesión). `muscle_groups`: lectura pública de los `is_default`, CRUD propio de los del usuario.

**Semilla de grupos musculares por defecto** (`is_default = true`, `user_id` null): Pecho, Espalda (dorsal), Trapecio, Hombro anterior, Hombro lateral, Hombro posterior, Bíceps, Tríceps, Antebrazo, Cuádriceps, Femoral/Isquios, Glúteo, Gemelo, Abdomen, Lumbar.

Regenera los tipos TypeScript al terminar.

---

## Tarea 3 — Biblioteca de ejercicios

Pantalla `/ejercicios`:
- Lista de ejercicios del usuario con búsqueda y filtro por grupo muscular / rol / mecánica.
- Cada tarjeta muestra nombre, chips de rol y mecánica, y grupos musculares (primarios destacados).
- **Crear/editar** en un `BottomSheet` con:
  - Nombre (texto).
  - Rol: principal / secundario / accesorio (selector tipo segmented).
  - Mecánica: compuesto / aislado.
  - Grupos musculares **primarios** y **secundarios** (multi-select de chips; permite crear un grupo nuevo al vuelo).
  - Equipo (opcional) y notas (opcional).
- Eliminar con confirmación.

UX: flujo de crear un ejercicio en < 10 segundos. Todo accesible con el pulgar.

---

## Tarea 4 — Días / plantillas

Pantalla `/dias`:
- Lista de días (plantillas) con su color y nº de ejercicios.
- Crear día: nombre (p. ej. "Push", "Legs", "Upper"), descripción opcional, color.
- Dentro de un día: **añadir ejercicios** desde la biblioteca, **reordenarlos** (drag o flechas), definir `target_sets` por ejercicio, y notas.
- Editar y eliminar día.

---

## Tarea 5 — Calendario

Pantalla `/calendario`:
- Vista de mes mobile-first, con indicadores en los días que tienen sesión asignada (color del día/plantilla).
- Tocar una fecha → asignar un día/plantilla (o varios), o marcar como descanso.
- Estado visual: planificado / completado / saltado.
- Desde una fecha con día asignado: botón **"Empezar entreno"** → crea `workout_session` y abre la sesión en vivo.
- Permitir también iniciar una sesión ad-hoc (sin plantilla) desde el calendario.

---

## Tarea 6 — Registro de sesión en vivo (núcleo)

Pantalla `/sesion/[id]`:
- Lista de ejercicios del día (orden de la plantilla). Para cada ejercicio:
  - Filas de series con: nº de serie, **peso (kg)**, **reps**, y check de completada.
  - Botón "**Añadir serie**" (precarga valores de la serie anterior).
  - **Opciones avanzadas por serie** (plegables, ocultas por defecto): RIR, RPE, ROM, tempo, descanso (s), tipo de serie (warmup/working/drop/failure).
  - Mostrar como referencia el registro de la **última vez** que se hizo ese ejercicio (último peso×reps), para progresión.
- Guardado **optimista e inmediato** de cada serie (no perder datos a media sesión). Mantén el estado de la sesión activa en un store local y sincroniza a Supabase.
- Notas de sesión.
- Botón "**Terminar entreno**" → marca `completed_at`, actualiza la `scheduled_session` a `completed`.

Este es el flujo más usado: tiene que ser **rápido, con el pulgar, sin fricción**, números fáciles de tocar/ajustar (steppers + teclado numérico).

---

## Tarea 7 — Historial básico

Pantalla en `/perfil` o `/historial`:
- Lista de sesiones completadas (fecha, día, nº de series, volumen total simple = Σ peso×reps).
- Detalle de una sesión: ejercicios y series registradas.
- (Analítica avanzada y gráficas → Fase 2, no ahora.)

---

## Requisitos transversales de UX

- **Mobile-first** real (375–430px primero). Navegación inferior con el pulgar.
- Microinteracciones suaves con Framer Motion; respeta `prefers-reduced-motion`.
- Estados vacíos cuidados (con CTA claro) para cada pantalla sin datos.
- Feedback inmediato en cada acción (optimistic UI + toasts discretos).
- Modo oscuro por defecto.
- Todo el dominio en español; código en inglés.

---

## Criterios de aceptación

- [ ] Usuario se registra, inicia sesión y solo ve sus datos (RLS verificado).
- [ ] Puede crear, editar, filtrar y borrar ejercicios con todos sus atributos.
- [ ] Puede crear un día (p. ej. "Push") con ejercicios ordenados de su biblioteca.
- [ ] Puede asignar ese día a una fecha del calendario.
- [ ] Puede empezar el entreno de esa fecha y registrar series con peso, reps y campos avanzados, sin perder datos.
- [ ] Al terminar, la sesión queda en el historial y la fecha marcada como completada.
- [ ] Toda la app es fluida y usable a una mano en móvil.

---

## Notas para Claude Code

- Crea las migraciones con Supabase MCP y verifica las políticas RLS tras aplicarlas.
- Regenera los tipos TS tras cambios de esquema.
- Cuando el contexto crezca demasiado, haz checkpoint en `CLAUDE.md` (sección "estado actual") antes de `/clear`.
- Si una decisión de Fase 1 condiciona una fase futura, anótala en `CLAUDE.md` pero no la implementes.
