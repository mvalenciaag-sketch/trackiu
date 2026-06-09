## 10. Flujo de trabajo Claude Design ↔ Claude Code

> Cómo iterar diseño e implementación en paralelo sin que se pisen. Pegar/mantener esta sección en `CLAUDE.md`.

**Vinculación**
- El código se enlaza en Claude Design **vía GitHub** (no carpeta local), para que sea un bucle vivo y no instantáneas sueltas.
- Tras cada merge, en Design pulsar **"Sync now"** para que vea los componentes reales actualizados.

**Bucle por trozos (no un handoff gigante)**
1. Diseñar **una pieza completa** en Design (una fase / pantalla).
2. **Export → Hand off to Claude Code** (preferir **Claude Code Web** para seguir diseñando en paralelo; local si se quiere control total).
3. Claude Code implementa el trozo en **una rama propia → PR → revisar → merge**.
4. En Design, **Sync now** y diseñar el siguiente trozo sobre la versión ya actualizada.
5. Repetir.

**Reglas para no chocar**
- **Lo transversal primero**: contenedor mobile-first, tokens de color y nav se implementan y fusionan ANTES que las pantallas; el resto construye encima.
- **No editar el mismo archivo por los dos lados a la vez** (si hay un handoff de la nav en curso en Code, no rediseñar la nav en Design en paralelo). Trabajar en trozos que toquen archivos distintos.
- Documentar las **decisiones de diseño en el chat de Design** y **nombrar los componentes con claridad**: esos nombres y razones viajan en el handoff.
- Antes de cada handoff, cubrir **estados límite**: vacío, error, carga, distintos volúmenes de datos.

**Prompt base para pegar en Claude Code tras un handoff**
> Lee CLAUDE.md. Implementa este handoff respetando los **tokens de color** y los **componentes existentes** (intégralo en lo que ya hay, no crees un sistema de UI paralelo). Mantén el **contenedor mobile-first**. **NO toques el esquema de Supabase ni la lógica de auth**. Hazme un plan breve, trabaja en una rama, y para a revisar antes de fusionar.

**Invariantes que ningún handoff debe romper**
- Paleta/tokens de color de TrackIU.
- Contenedor mobile-first.
- Esquema de Supabase, RLS y auth (email/contraseña + Google).
- Convenciones de naming/idioma de la sección 3.
