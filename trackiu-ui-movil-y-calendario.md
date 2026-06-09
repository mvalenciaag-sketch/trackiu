# TrackIU — Refinamiento UI: mobile-first, paleta y calendario

> Prompt para Claude Code. Lee primero `CLAUDE.md`.
> Esta tarea NO añade lógica nueva: ajusta layout responsive, define el sistema de color
> y rediseña el calendario para que sea visual y fácil de entender. No toques el modelo de datos.

---

## Contexto / problema actual

La app se está renderizando a todo el ancho en escritorio, así que no parece una app de móvil: el calendario se estira y queda plano y poco legible. TrackIU es **mobile-first**: debe verse y sentirse como una app de móvil en cualquier pantalla.

---

## Tarea 1 — Contenedor mobile-first global

1. Envuelve todo el layout de la app en un **contenedor centrado con ancho máximo de móvil** (`max-w-[480px] mx-auto`, alto `min-h-dvh`), de modo que en escritorio se vea como un móvil centrado, no estirado.
2. El fondo **fuera** de ese contenedor (el "marco" en escritorio) usa un tono más oscuro que el fondo base, para que el contenido de la app destaque como una pantalla.
3. La **navegación inferior** (Calendario · Días · Ejercicios · Progreso · Perfil) debe quedar fija dentro de ese ancho de móvil, no a todo el ancho de la ventana.
4. Revisa todas las pantallas para que respeten ese contenedor y no se desborden. Diseña pensando en 375–430px de ancho.
5. Targets táctiles mínimos de 44×44px en todo lo interactivo.

---

## Tarea 2 — Sistema de color (paleta)

Define estos colores como **design tokens** (variables CSS + extensión del theme de Tailwind). Úsalos en TODA la app; nada de colores hardcodeados sueltos. Puedes derivar tonos intermedios respetando la oscuridad y temperatura de cada color.

```css
:root {
  /* Fondos (de más oscuro a más claro) */
  --bg-base:      #1C1C1C; /* fondo principal de la app */
  --bg-surface:   #242424; /* tarjetas y superficies (derivado, entre base y elevated) */
  --bg-elevated:  #424242; /* elementos elevados, sheets, divisores, estados inactivos */
  --bg-frame:     #121212; /* marco exterior en escritorio (más oscuro que base) */

  /* Acento naranja */
  --accent:        #ED8434; /* naranja principal: acción primaria, "hoy", nav activa */
  --accent-soft:   #EDA46D; /* naranja claro: realces, hover, fills suaves, badges */
  --accent-strong: #CC5E0E; /* naranja oscuro: estados pulsados/activos, sombras, gradientes */

  /* Texto */
  --text-primary:   #F5F5F5; /* texto principal sobre fondo oscuro */
  --text-secondary: #A0A0A0; /* texto secundario / etiquetas / días inactivos */
  --text-on-accent: #1C1C1C; /* texto OSCURO sobre naranja brillante, para legibilidad */

  /* Bordes */
  --border: #3A3A3A;
}
```

Reglas de uso:
- **Acción primaria / CTA**: relleno `--accent` (o degradado `--accent` → `--accent-strong`), texto `--text-on-accent`. Estado pulsado: `--accent-strong`.
- **Acento secundario / realces suaves**: `--accent-soft`.
- **Tarjetas**: `--bg-surface` sobre `--bg-base`, borde `--border`.
- **Sheets / modales**: `--bg-elevated`.
- Mantén el modo oscuro como único tema por ahora. Contraste de texto AA mínimo.

---

## Tarea 3 — Rediseño del calendario (más visual y dinámico)

Reconstruye la pantalla de **Calendario** para que sea inmediata de entender. Requisitos:

**Cabecera**
- Mes y año grandes y centrados, con flechas ‹ › a los lados (ya existen, mejóralas con área táctil amplia).
- Botón "**Hoy**" que vuelve al mes actual y selecciona el día de hoy.

**Cuadrícula**
- Semana empezando en lunes (L M X J V S D) — mantener.
- Celdas cuadradas, espaciadas y con buen tamaño táctil. Nada de números flotando sueltos: cada día es una celda tocable con feedback al pulsar.
- Días de otros meses (relleno de la cuadrícula) atenuados con `--text-secondary`.

**Estados visuales de cada día** (clave para la legibilidad):
- **Hoy**: círculo/celda con relleno `--accent` y número en `--text-on-accent`.
- **Día seleccionado**: borde o anillo en `--accent` (distinto de "hoy", para que se diferencien).
- **Con rutina planificada**: punto o barra inferior con el **color de la rutina/día asignado** (cada `routine_day` tiene su `color`); si hay varias, varios puntos.
- **Completado**: celda con relleno suave `--accent-strong` o un check pequeño, para distinguirlo de lo planificado.
- **Saltado / descanso**: tono neutro `--bg-elevated`.
- Incluye una **leyenda** discreta de estos estados.

**Dinamismo**
- **Swipe horizontal** para cambiar de mes (arrastre con Framer Motion) además de las flechas.
- **Transición animada** al cambiar de mes (deslizamiento suave, 200–250ms, respetando `prefers-reduced-motion`).
- Al **tocar un día**: abrir un `BottomSheet` con lo que tenga ese día (rutina asignada, estado) y acciones: asignar día/plantilla, marcar como descanso, o "Empezar entreno" si toca.
- Microinteracciones al pulsar celdas (escala/ripple sutil).

**Resumen opcional (si encaja sin recargar)**
- Una franja superior compacta tipo "semana actual" o un pequeño contador del mes (entrenos completados / planificados) usando los tonos de acento. Solo si queda limpio.

---

## Criterios de aceptación

- [ ] En escritorio, la app se ve como un móvil centrado (ancho máx. ~480px), con marco exterior más oscuro.
- [ ] Toda la UI usa los tokens de color; no hay colores hardcodeados sueltos.
- [ ] La nav inferior queda dentro del ancho de móvil.
- [ ] El calendario distingue de un vistazo: hoy, día seleccionado, planificado, completado y descanso.
- [ ] Se puede cambiar de mes con swipe y con flechas, con transición animada.
- [ ] Tocar un día abre el sheet con sus acciones.
- [ ] Todo es cómodo de usar a una mano en móvil.

---

## Fuera de alcance

No añadir lógica de negocio nueva, ni tocar el esquema de Supabase, ni adelantar fases. Solo layout, color y experiencia visual del calendario.
