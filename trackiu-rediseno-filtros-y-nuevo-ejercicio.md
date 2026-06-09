# TrackIU — Rediseño de filtros y pantalla de "Nuevo ejercicio"

> Prompt para Claude Code. Lee primero `CLAUDE.md`.
> Rediseño puramente de UI/UX de la sección **Ejercicios**: el sistema de filtrado y el
> formulario de nuevo ejercicio. NO toques el modelo de datos: los atributos (rol,
> mecánica, grupos musculares) ya existen. Usa los tokens de color de TrackIU y respeta
> el contenedor mobile-first.

---

## Contexto / problemas actuales

1. **Filtros**: hoy hay dos filas de chips separadas (una con "Todos · Principal · Secundario · Accesorio" y otra con "Todos · Compuesto · Aislado"), apelotonadas y desbordando en horizontal, con dos "Todos" distintos. Es confuso y poco legible.
2. **Nuevo ejercicio**: el modal no cabe en la pantalla de móvil, se desborda por abajo y el botón de guardar queda fuera de alcance. Los grupos musculares se muestran como una rejilla enorme de chips (primarios + secundarios) que ocupa muchísimo.

---

## TAREA 1 — Sistema de filtrado unificado

Sustituye las dos filas de chips por **un único sistema de filtrado** claro y contenido.

### 1.1 — Disposición
- Mantén la **barra de búsqueda** arriba.
- Junto a la búsqueda, un botón **"Filtros"** con un contador de filtros activos (p. ej. "Filtros · 2"). Al pulsarlo abre un `BottomSheet`.
- Bajo la búsqueda, muestra los **filtros activos como chips eliminables** (con una "x"), para quitarlos de un toque sin abrir el sheet. Si no hay filtros activos, no se muestra nada ahí.

### 1.2 — Contenido del sheet de filtros
Secciones claramente etiquetadas, cada una con sus chips:
- **Rol**: Principal · Secundario · Accesorio (selección única; sin selección = todos).
- **Mecánica**: Compuesto · Aislado (selección única; sin selección = todos).
- **Grupos musculares**: chips de todos los grupos (los por defecto + los del usuario), **selección múltiple**.
- Botones del sheet: **"Limpiar"** (resetea todo) y **"Aplicar"**.

### 1.3 — Comportamiento
- Los filtros se **combinan** (Rol Y Mecánica Y grupos musculares seleccionados).
- Estado seleccionado de los chips: relleno `--accent`, texto `--text-on-accent`. No seleccionados: `--bg-surface`/`--bg-elevated` con texto `--text-secondary`.
- Si el resultado del filtro queda vacío, muestra un **estado vacío** claro ("No hay ejercicios con estos filtros") con opción de limpiar.

> Resultado: ya no hay dos "Todos" sueltos ni filas desbordando; hay un solo punto de entrada de filtros, ordenado y mobile-friendly.

---

## TAREA 2 — Pantalla "Nuevo ejercicio" (rediseño)

Reconstruye el formulario para que **quepa en la pantalla de móvil**, sea visual, organizado y fácil de usar.

### 2.1 — Estructura (clave para que quepa)
- `BottomSheet` / panel a **alto completo dentro del contenedor de móvil** (no un modal ancho que se desborda), con:
  - **Cabecera fija (sticky)**: título "Nuevo ejercicio" + botón de cerrar (X).
  - **Cuerpo scrollable** con las secciones.
  - **Pie fijo (sticky)**: botón primario **"Guardar"** (relleno `--accent`, texto `--text-on-accent`) siempre visible y alcanzable, con "Cancelar" secundario.
- Nada de que el botón de guardar quede fuera de pantalla.

### 2.2 — Secciones del formulario (jerarquía visual clara)
1. **Nombre**: input de texto con placeholder ("p. ej. Press de banca").
2. **Rol**: control segmentado de 3 opciones (Principal / Secundario / Accesorio). La opción activa **claramente destacada** con `--accent` y texto oscuro (ahora el seleccionado casi no se distingue).
3. **Mecánica**: control segmentado de 2 opciones (Compuesto / Aislado), mismo estilo de selección.
4. **Grupos musculares** — compacto, no una rejilla gigante:
   - Dos subsecciones: **Primarios** y **Secundarios**.
   - En cada una, un botón **"+ Añadir músculos"** que abre un **picker buscable** (sheet) con todos los grupos; permite **crear uno nuevo** al vuelo.
   - Los músculos seleccionados se muestran como **chips eliminables** dentro de su subsección (primarios destacados con `--accent`, secundarios con `--accent-soft`).
   - Así el formulario no muestra de golpe toda la lista de músculos dos veces; solo lo seleccionado + el botón de añadir.

### 2.3 — Acabado visual
- Tokens de color de TrackIU en todo; espaciado generoso entre secciones; etiquetas legibles.
- Targets táctiles ≥44px; transiciones suaves (Framer Motion, `prefers-reduced-motion`).
- Reutiliza este mismo formulario para **editar** un ejercicio (precargado).

### 2.4 — Validación
- Nombre obligatorio. Rol y mecánica con valor por defecto. Mensajes de error claros e inline.

---

## Criterios de aceptación

**Filtros**
- [ ] Un único sistema de filtrado (búsqueda + botón "Filtros" con contador + chips activos eliminables).
- [ ] El sheet permite filtrar por rol, mecánica y grupos musculares (estos múltiples), combinables.
- [ ] No quedan las dos filas de chips desbordando ni dos "Todos".

**Nuevo ejercicio**
- [ ] El formulario cabe en la pantalla de móvil, con cabecera y botón "Guardar" siempre visibles.
- [ ] Rol y mecánica con la opción activa claramente destacada.
- [ ] Grupos musculares con selector buscable + chips eliminables (sin rejilla gigante inline).
- [ ] Sirve también para editar. Validación de nombre obligatorio.
- [ ] Todo con la paleta y el contenedor mobile-first de TrackIU.

---

## Fuera de alcance
- No tocar el esquema de Supabase ni la lógica de datos (los atributos ya existen).
- No cambiar otras pantallas; solo filtros y formulario de ejercicio.
