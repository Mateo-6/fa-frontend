---
version: 1
slug: "payment-methods"
primary_target: "payment-methods"
related_targets: ["cards"]
---

---
version: 1
slug: "payment-methods"
primary_target: "payment-methods"
related_targets: ["cards"]
---

# /payment-methods

## Mode

Operate

## Scope

Pantalla de gestión de métodos de pago (antigua "Tarjetas", placeholder en `/cards`). CRUD completo de tarjetas de crédito, cuentas bancarias y efectivo, cada uno con su detalle polimórfico, más el toggle de exención de GMF para cuentas.

## Audience and job

Usuario autenticado de la app de gastos personales. Su trabajo: mantener actualizados los medios con los que paga y recibe dinero, y de un vistazo conocer su dinero disponible, su deuda en tarjetas, y cuáles cuentas están exentas del 4x1000.

## Action / task

Ver todos sus métodos agrupados por tipo, revisar el resumen (disponible, deuda en tarjetas, métodos, exentas de GMF), crear/editar/eliminar un método y alternar la exención de GMF desde la propia fila.

## Proof / content

- **Resumen:** disponible (cuentas + efectivo), deuda en tarjetas (suma de saldos actuales), número de métodos registrados y cuentas exentas de GMF. Los totales son usados por moneda; ante varias monedas se muestra la dominante y una nota.
- **Grupos:** Tarjetas de crédito (últimos 4 dígitos, día de corte y pago, límite, saldo, barra de utilización), Cuentas bancarias (banco, tipo ahorros/corriente, últimos 4, saldo, switch GMF), Efectivo (monto).
- **Estados:** carga (skeleton), error (con reintentar), vacío (con CTA), y redirección a `/` si no hay sesión o el token es inválido.
- **CRUD:** crear y editar en diálogo con formulario dinámico por tipo; eliminar con confirmación. Tipo fijo en edición.

## Constraints

- Consume `GET/POST/PUT/DELETE /payment-methods` y `PATCH /payment-methods/:id/gmf-exempt` con autenticación Bearer JWT.
- `is_gmf_exempt` solo persiste de forma fiable vía el endpoint dedicado de GMF; `PUT` lo descarta.
- El tipo no cambia al editar; cambiar de tipo implica crear otro y eliminar el previo.
- La API exige identificadores de 4 dígitos (tarjeta/cuenta) y días de corte/pago entre 1 y 31.
- Hereda el mundo visual Glass Ledger. `/cards` redirige aquí.
- Responsive: resumen en 2 columnas (4 en desktop), grupos apilados.

## Chosen direction

Glass Ledger, mismo lenguaje que dashboard y transacciones: fondo pizarra profundo, paneles esmerilados, acento sky. La pantalla se organiza por tipo de método con una franja de resumen arriba; las tarjetas de crédito llevan la barra de utilización de la familia.

## Memorable moment

El usuario responde "¿cuánto tengo, cuánto debo y en qué está mi dinero?" en un solo vistazo: la franja de resumen contesta las dos primeras preguntas y los grupos, con su saldo y su barra de uso, la tercera.

## Unresolved decisions

- No hay orden manual de los métodos (se ordenan alfabéticamente dentro de cada tipo).
- No hay tasas de conversión entre monedas; el resumen nunca suma monedas distintas.
