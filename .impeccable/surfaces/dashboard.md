---
version: 1
slug: "dashboard"
primary_target: "dashboard"
related_targets: []
---

# /summary

## Mode

Operate

## Scope

Página principal posterior al login. Muestra un resumen financiero del usuario: balance total, ingresos, gastos, disponible, transacciones recientes, próximos pagos y un vistazo a sus tarjetas de crédito.

## Audience and job

Usuario autenticado de la app de gastos personales. Su trabajo: entender rápidamente su situación financiera y detectar movimientos importantes en un solo vistazo.

## Action / task

Ver el resumen financiero, revisar transacciones recientes, identificar próximos pagos y consultar el estado de sus tarjetas de crédito. Desde aquí puede cerrar sesión.

## Proof / content

- **Resumen financiero:** balance total, ingresos del mes, gastos del mes, disponible en cuentas y efectivo.
- **Transacciones recientes:** hasta 10 movimientos del mes actual con descripción, categoría, fecha y monto.
- **Próximos pagos:** hasta 10 gastos recurrentes activos ordenados por fecha de vencimiento.
- **Tarjetas de crédito:** hasta 3 tarjetas con balance actual, límite, porcentaje de uso y días hasta el pago.
- **Estados:** carga, error (con reintentar), vacío (sin datos) y redirección a `/` si no hay sesión o el token es inválido.

## Constraints

- Consume `GET /summary` con autenticación Bearer JWT.
- Los cálculos son server-side; el frontend solo muestra lo que la API entrega.
- Debe ser escaneable rápidamente: jerarquía clara, métricas visibles, listas legibles.
- Hereda el mundo visual Glass Ledger de `/login` y `/register`.
- Diseño responsive: tarjetas de resumen en grid, contenido principal en dos columnas en desktop, una columna en móvil.

## Chosen direction

Glass Ledger: fondo pizarra profundo, paneles esmerilados, acento sky frío, tipografía Inter limpia. Para el resumen se añaden colores semánticos discretos: verde para ingresos, rojo para gastos, índigo para tarjetas.

## Memorable moment

El usuario entra y en menos de un segundo ve su balance total, el ritmo de ingresos/gastos del mes y cualquier pago o tarjeta que requiera atención, todo organizado en una sola pantalla sin ruido.

## Unresolved decisions

- No hay navegación a otras secciones (transacciones, categorías, presupuestos) todavía.
- No hay acciones sobre transacciones o tarjetas desde el resumen; es solo lectura.
