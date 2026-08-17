---
version: 1
slug: "register"
primary_target: "register"
related_targets: []
---

# /register

## Mode

Operate

## Scope

Página de registro de nuevos usuarios. Captura los datos necesarios para crear una cuenta, crea las categorías por defecto en el backend, inicia sesión automáticamente y redirige al dashboard.

## Audience and job

Nuevo usuario de la app de gastos personales. Su trabajo: crear una cuenta para empezar a registrar sus finanzas. Espera claridad, confianza y un camino corto hasta el primer uso.

## Action / task

Completar el formulario de registro (nombre de usuario, nombre completo, correo, teléfono, contraseña y confirmación), aceptar términos, enviar. Tras crear la cuenta, el sistema debe iniciar sesión automáticamente y redirigir a `/dashboard`.

## Proof / content

- Campos: username, name, email, phone, password, confirmPassword.
- Validación cliente según las reglas del backend:
  - username, name, phone: obligatorios, máximo 100 caracteres.
  - email: formato válido.
  - password: mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial.
  - confirmPassword: debe coincidir con password.
  - acceptTerms: debe aceptarse.
- Errores: mensajes inline por campo; error genérico del servidor cuando aplica.
- Estados: campo vacío, foco, error, carga, éxito.
- Después del registro exitoso, llama a `POST /auth/login` para obtener JWT y redirige a `/dashboard`.
- Enlace secundario: "Iniciar sesión".

## Constraints

- El backend espera `POST /users` con `{ username, name, email, password, phone }` y responde `201` con el usuario creado.
- El backend crea automáticamente las categorías por defecto al registrar.
- Debe funcionar en escritorio y móvil.
- Hereda el mundo visual Glass Ledger de `/login`.

## Chosen direction

Glass Ledger: tarjeta de vidrio esmerilado sobre fondo pizarra profundo, tipografía sans geométrica limpia, acento frío calmado.

## Memorable moment

El formulario de registro se despliega con la misma calma que el login; al completarse, la transición al dashboard es inmediata, sin fricción, con las categorías por defecto ya listas.

## Unresolved decisions

- Los textos de términos y condiciones y política de privacidad son enlaces de placeholder.
