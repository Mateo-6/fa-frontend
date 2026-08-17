---
version: 1
slug: "login"
primary_target: "login"
related_targets: []
---

# /login

## Mode

Operate

## Scope

Página de inicio de sesión única: un visitante existente entra con email y contraseña para acceder a su panel financiero personal.

## Audience and job

Usuario principal de la app de gastos personales. Su trabajo: acceder de forma segura a su información financiera. Espera claridad, confianza y rapidez.

## Action / task

Completar el formulario de email y contraseña, enviarlo y, si las credenciales son válidas, ser redirigido al dashboard con la sesión JWT activa.

## Proof / content

- Campos: email y contraseña.
- Validación cliente: email con formato válido, contraseña no vacía.
- Errores: mensaje genérico "Credenciales inválidas" cuando el backend responde 401; errores de validación inline.
- Estados: campo vacío, foco, error, carga, éxito.
- Enlace secundario: "Crear cuenta" (fuera de scope de implementación por ahora).

## Constraints

- No se permite login social ni 2FA en este alcance.
- El backend espera `POST /auth/login` con `{ email, password }` y responde `{ token, refreshToken, user }`.
- Tras login exitoso se redirige a `/dashboard`.
- Debe funcionar en escritorio y móvil.

## Chosen direction

Glass Ledger: tarjeta de vidrio esmerilado sobre fondo pizarra profundo, tipografía sans geométrica limpia, acento frío calmado. Confianza mediante precisión, no ornamento.

## Memorable moment

La tarjeta de vidrio se eleva sutilmente y el campo activo revela su foco con una luz estructural precisa; el botón primario brilla con un shimmer contenido mientras espera la respuesta del servidor.

## Unresolved decisions

- Flujos de registro y recuperación de contraseña quedan fuera del login; solo se reservan enlaces.
- Nombre comercial y logo del producto aún no existen; se usará un wordmark tipográfico provisional.
