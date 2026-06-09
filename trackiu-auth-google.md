# TrackIU — Autenticación con Google (OAuth)

> Prompt para Claude Code. Lee primero `CLAUDE.md`.
> Objetivo: permitir registrarse e iniciar sesión con una cuenta de Google, manteniendo
> intacto el login por email/contraseña actual. Con OAuth, el mismo botón sirve para
> registrarse (primera vez) e iniciar sesión.

---

## ⚠️ PARTE A — Configuración manual (la hace Marcos, NO Claude Code)

Estos pasos llevan credenciales y secretos y se hacen en los paneles de Google y Supabase.
Claude Code no puede hacerlos por MCP. Hazlos tú **antes** de probar el código.

### A.1 — Google Cloud Console
1. Crea o selecciona un proyecto en https://console.cloud.google.com
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo "Externo", rellena nombre de la app (TrackIU), correo de soporte y dominios.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**.
4. **Orígenes de JavaScript autorizados**:
   - `http://localhost:3000`
   - tu dominio de producción (cuando lo tengas)
5. **URIs de redirección autorizados** (apunta al callback de Supabase, NO al de tu app):
   - `https://<TU-PROJECT-REF>.supabase.co/auth/v1/callback`
6. Copia el **Client ID** y el **Client Secret**.

### A.2 — Panel de Supabase
1. **Authentication → Providers → Google**: actívalo y pega el Client ID y el Client Secret.
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (en dev) / tu dominio (en prod).
   - **Redirect URLs**: añade `http://localhost:3000/auth/callback` y `https://tu-dominio.com/auth/callback`.
3. (Opcional) Decide si quieres **vincular cuentas con el mismo email** (si alguien se registró con email/contraseña y luego entra con Google usando ese mismo correo). Déjalo en el comportamiento por defecto salvo que quieras lo contrario.

> Dame el `PROJECT-REF` y confírmame que has activado el provider antes de que probemos el flujo.

---

## PARTE B — Código (lo hace Claude Code)

### B.1 — Cliente y dependencias
- Usa `@supabase/ssr` para los clientes (browser y server). Si no está, instálalo.
- Asegúrate de que el flujo de auth usa **PKCE** (por defecto en `@supabase/ssr`).

### B.2 — Botón "Continuar con Google"
- Añade el botón en las pantallas de **login** y **registro**, separado del formulario de email/contraseña por un divisor ("o").
- Estilo coherente con la paleta de TrackIU (tokens de color ya definidos), con el logo de Google y buen contraste. Target táctil ≥44px.
- Al pulsarlo (client component):

```ts
const supabase = createClient() // browser client
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
})
```

### B.3 — Ruta de callback
Crea `app/auth/callback/route.ts` que intercambie el código por sesión y redirija a la app:

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/calendario'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
```

### B.4 — Sesión y rutas protegidas
- Verifica que el **middleware/refresh de sesión** de `@supabase/ssr` está en marcha para que la sesión persista tras el OAuth (refrescar la cookie).
- Tras login con Google, el usuario debe entrar igual que con email/contraseña y respetar la protección de rutas existente.
- Si el callback falla, mostrar un error legible en la pantalla de login (`?error=oauth`).

### B.5 — Coherencia de datos
- Un usuario que entra por Google debe tener la misma experiencia que uno de email/contraseña (RLS por `auth.uid()` ya cubre esto; no hace falta esquema nuevo).
- Si en el registro por email guardabas algún dato extra (p. ej. username), define qué pasa con usuarios de Google que no lo tienen: o lo pides en un paso de onboarding posterior, o lo dejas opcional. **Pregúntame antes de decidir esto.**

---

## Criterios de aceptación

- [ ] Botón "Continuar con Google" en login y registro, con la estética de TrackIU.
- [ ] Al pulsarlo se abre el consentimiento de Google y, al volver, el usuario queda logueado.
- [ ] Primera vez con Google = cuenta creada; siguientes veces = inicio de sesión.
- [ ] La sesión persiste al recargar y respeta las rutas protegidas.
- [ ] El login por email/contraseña sigue funcionando igual que antes.
- [ ] Errores de OAuth se muestran de forma legible.

---

## Notas

- No toques el esquema de Supabase ni adelantes otras fases.
- Actualiza `CLAUDE.md` para anotar que la auth ahora soporta email/contraseña + Google.
- Para probar en local hace falta que las URLs de redirección de Supabase incluyan `localhost:3000`.
