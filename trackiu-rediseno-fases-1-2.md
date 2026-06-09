# TrackIU — Rediseño de navegación (Fases 1 y 2)

> Prompt para Claude Code. Lee primero `CLAUDE.md`.
> Rediseño de la estructura de navegación inspirado en los **patrones de layout** de
> Symmetry (barra superior con badges, botón central destacado, pestaña "Entrenar" con
> tarjetas deslizables). NO copiar su marca, logo ni imágenes: usar la identidad y la
> **paleta de TrackIU** (tokens ya definidos). Mantén el contenedor mobile-first ya existente.

---

## Contexto

Estamos rediseñando cómo se navega y se accede a las acciones principales. Esto se hace en dos fases. Implementa **solo la fase indicada** y para entre fases para revisar. No toques el modelo de datos.

**Barra inferior propuesta (5 huecos)** — confírmamela antes de empezar si tienes dudas:

`Calendario · Progreso · [ + ] · Entrenar · Perfil`

La gestión de **Días** y **Ejercicios** queda accesible desde el botón **+** y desde la pestaña **Entrenar** (Fase 2). Si Marcos prefiere otros huecos, pregúntale.

---

## FASE 1 — Barra superior y barra inferior (estructura)

Rediseña **los dos márgenes**: la barra superior (header) y la barra inferior (nav), siguiendo el patrón de Symmetry pero con la estética de TrackIU.

### 1.1 — Barra superior (header)
- **Izquierda**: nombre de la app **"TrackIU"** como wordmark/logo provisional, en tipografía destacada (negrita). Déjalo como componente aislado (`<Logo />`) para poder sustituirlo por el logo real más adelante.
- **Derecha** (cluster de iconos, como en la referencia):
  - **Badge PRO**: pastilla pequeña con borde/acento.
  - **Racha** (streak): icono de llama + número (de momento puede mostrar `0`; la lógica de racha se definirá después). Usa `--accent` para la llama.
  - **Menú de opciones**: icono de ajustes (engranaje) que abre los ajustes.
- Fondo `--bg-base`, contenido alineado, alturas y targets táctiles cómodos (≥44px). Header fijo dentro del contenedor de móvil.

### 1.2 — Barra inferior (nav) con FAB central
- Rediseña la nav inferior con un **botón central "+" destacado y elevado** (círculo que sobresale por encima de la barra, como el botón blanco de Symmetry, pero en `--accent` / degradado `--accent`→`--accent-strong`, con el "+" en `--text-on-accent`).
- A los lados del **+**, los huecos de navegación (según la barra propuesta arriba), con icono + etiqueta pequeña; el activo resaltado en `--accent`.
- Al pulsar el **+** se abre un `BottomSheet` con dos acciones claras:
  - **Añadir ejercicio** → abre el formulario de ejercicio (de la biblioteca).
  - **Añadir día / rutina** → abre el formulario de día (estos días albergan los ejercicios ya creados).
- Microinteracciones suaves al abrir el sheet y al pulsar el FAB (Framer Motion, respetar `prefers-reduced-motion`).

> Fase 1 es solo la **estructura de los dos márgenes** y el menú del FAB. El contenido entre medias (pantallas existentes) se mantiene por ahora.

---

## FASE 2 — Pestaña "Entrenar"

Crea la pantalla de la pestaña **Entrenar** (a la derecha del botón **+**). Es la pantalla principal para empezar a entrenar.

### 2.1 — Carrusel de días/rutinas (parte superior)
- Tarjetas **deslizables horizontalmente** (swipe), una por cada `routine_day` que el usuario haya creado.
- Cada tarjeta muestra: **nombre del día** (p. ej. "PIERNAS"), nº de ejercicios, y una estimación o dato resumen (p. ej. duración estimada o nº de series objetivo). Como los días tienen `color` y no foto, usa un **fondo con degradado basado en el color del día** (no uses imágenes de stock).
- **Al pulsar una tarjeta → ir directamente al seguimiento de ese día**: crea/abre la `workout_session` de ese día y abre la pantalla de registro en vivo (reutiliza el flujo "Empezar entreno" que ya existe).
- Indicador de paginación (puntos) bajo el carrusel.
- **Estado vacío**: si no hay días creados aún, muestra una tarjeta-CTA que invite a crear el primer día.

### 2.2 — Acciones (debajo del carrusel)
- Lista de opciones tipo Symmetry ("Tus Entrenamientos"), con icono a la izquierda y etiqueta:
  - **Añadir ejercicio** (icono +) → formulario de ejercicio.
  - **Añadir rutina / día** (icono de rutina) → formulario de día.
- Filas con `--bg-surface`, buen espaciado y feedback táctil.

### 2.3 — Coherencia
- Todo con los tokens de color de TrackIU. Mobile-first. Legible y entendible de un vistazo.
- No dupliques lógica: el carrusel y las acciones reutilizan los formularios y el flujo de sesión que ya existen.

---

## Criterios de aceptación

**Fase 1**
- [ ] Header con wordmark "TrackIU" (en componente aislado), badge PRO, racha con llama, y menú de opciones.
- [ ] Nav inferior rediseñada con FAB central "+" elevado en color de acento.
- [ ] El "+" abre un sheet con "Añadir ejercicio" y "Añadir día/rutina".

**Fase 2**
- [ ] Pestaña "Entrenar" con carrusel deslizable de los días creados.
- [ ] Pulsar una tarjeta abre directamente el seguimiento de ese día.
- [ ] Estado vacío cuando no hay días.
- [ ] Debajo, acciones "Añadir ejercicio" y "Añadir rutina".
- [ ] Todo con la paleta y el contenedor mobile-first de TrackIU.

---

## Fuera de alcance
- No tocar el esquema de Supabase ni la lógica de auth.
- No copiar marca, logo ni imágenes de Symmetry; solo se toma el patrón de layout.
- La lógica real de PRO y de racha se definirá en fases posteriores (de momento, visual/placeholder).
