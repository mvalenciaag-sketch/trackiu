# TrackIU — Desactivar confirmación de email en el registro (temporal)

> Prompt para Claude Code. Lee primero `CLAUDE.md`.
> Objetivo: que registrarse con email + contraseña cree la cuenta y entre directo,
> SIN tener que confirmar el correo. Es un cambio **temporal** para desarrollo;
> habrá que reactivar la confirmación antes de producción.

---

## ⚠️ PARTE A — Configuración manual (la hace Marcos, NO Claude Code)

El que de verdad quita la verificación es un ajuste del panel de Supabase:

1. En tu proyecto de Supabase ve a **Authentication → Providers → Email**
   (según la versión del panel puede aparecer como *Sign In / Up → Email*).
2. **Desactiva** la opción **"Confirm email"** (el toggle que obliga a verificar el correo).
3. Guarda.

A partir de ahí, al registrarse, Supabase devuelve **sesión directamente** (el usuario queda logueado sin confirmar nada).

> Hazlo antes de probar el código de la Parte B.

---

## PARTE B — Código (lo hace Claude Code)

Con la confirmación desactivada, `supabase.auth.signUp()` ya devuelve una sesión activa. Ajusta el flujo de registro en consecuencia:

1. **Tras el registro correcto**, si la respuesta de `signUp` incluye sesión, **redirige al usuario directamente a la app** (p. ej. `/calendario`), igual que tras un login normal. No lo mandes a ninguna pantalla de "revisa tu correo".
2. **Elimina o desactiva** cualquier pantalla, mensaje o redirección de "verifica tu email / hemos enviado un correo de confirmación" en el flujo de registro.
3. **Quita cualquier bloqueo** que impida usar la app a un usuario no verificado (guards, comprobaciones de `email_confirmed_at`, etc.), si existen.
4. Mantén el manejo de errores legible: email ya registrado, contraseña débil/corta, formato inválido.
5. No toques el modelo de datos ni el login con Google. El email/contraseña debe seguir funcionando, solo que ahora sin paso de confirmación.

### Importante (reversibilidad)
- Este cambio es **temporal**. No borres lógica de forma que sea difícil reactivar la confirmación más adelante; basta con no bloquear y no redirigir a la pantalla de verificación. Si quitas componentes de verificación, déjalo anotado.
- Deja una nota en `CLAUDE.md`: "Confirmación de email DESACTIVADA temporalmente en desarrollo. Reactivar (toggle 'Confirm email' en Supabase + restaurar flujo) antes de producción."

---

## Criterios de aceptación

- [ ] Registrarse con email + contraseña crea la cuenta y entra directo a la app, sin pedir confirmación.
- [ ] No aparece ninguna pantalla ni mensaje de "revisa tu correo".
- [ ] El login con cuenta ya existente sigue funcionando.
- [ ] El login con Google sigue funcionando.
- [ ] Errores de registro (email duplicado, contraseña inválida) se muestran de forma clara.
