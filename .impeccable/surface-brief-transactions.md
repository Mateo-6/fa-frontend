# /transactions

## Mode

Operate

## Scope

Pantalla de gestión completa de transacciones: listado filtrable con resumen del período, creación, edición (modal) y eliminación (con confirmación). Ruta hermana `/transactions/new` para registrar una transacción. Sustituye los placeholders `ComingSoon` previos y el estado parcial de `TransactionRow` del dashboard.

## Audience and job

Usuario autenticado que quiere registrar movimientos diarios y responder rápido "¿cuánto ingresé, cuánto gasté y a dónde se fue mi dinero?". Trabajo: crear una transacción en segundos, encontrar movimientos por filtros, corregirlos o eliminarlos sin fricción.

## Action / task

- Ver el histórico del mes (y otros períodos) con resumen inline de ingresos, gastos, transferencias y neto.
- Filtrar por rango de fechas, tipo (ingreso/gasto/transferencia), categoría y método de pago.
- Crear una transacción desde `/transactions/new` o el CTA del encabezado.
- Editar desde un modal sobre la lista; eliminar desde un diálogo de confirmación destructiva.
- Paginación incremental ("Cargar más") hasta el total reportado por la API.

## Proof / content

- **Tipos de transacción:** INCOME, EXPENSE y TRANSFER de la API real (`TRANSFER` con origen→destino y restricciones del backend: destino no puede ser tarjeta de crédito; EXPENSE requiere método de pago; INCOME no acepta tarjetas).
- **Filtros:** startDate/endDate (default: inicio del mes → hoy), type, categoryId, paymentMethodId.
- **Resumen:** calculado client-side sobre los movimientos cargados; ingresos (verde), gastos (rojo), transferencias (índigo), neto (verde/rojo según signo).
- **Formulario compartido** (crear y editar): tipo en segmented control, descripción (≤500 chars), importe, fecha, categoría filtrada por tipo, método de pago o origen/destino según tipo, y "Opciones avanzadas" con budgetAmount opcional (0 = excluye de presupuestos).
- **Estados:** carga (skeletons), error con reintentar, vacío (con CTA según haya filtros activos), 401 → redirect a `/`.
- **Feedback:** toasts de éxito/error en cada mutación; errores de API en español bajo el formulario.

## Constraints

- Consume la API REST existente: `GET /transactions/history`, `POST /transactions/manual`, `PUT /transactions/:id`, `DELETE /transactions/:id`, más `GET /categories` y `GET /payment-methods`. Sin nuevas dependencias; selects/inputs nativos estilizados con los tokens existentes.
- Autenticación JWT; header Bearer en todas las llamadas (incluida la creación).
- Hereda el mundo visual Glass Ledger: paneles esmerilados, acento sky escaso, colores semánticos solo para dinero.
- Responsive: filtros en grid 2→5 columnas; filas de lista en flex (móvil) → columnas de tabla (desktop, acciones al hover); sin scroll horizontal (columna `min-w-0` en el shell).

## Chosen direction

Glass Ledger "modo instrumento": la lista se lee como una página de registro contable — cabecera de columnas discretas, filas con línea separadora translúcida, monto alineado a la derecha en el semántico del tipo, y acciones que aparecen al hover en desktop para mantener las filas escaneables. El formulario centraliza el tipo (segmented) para que las categorías y métodos de pago cambien de contexto sin fricción.

## Memorable moment

El usuario llega, ve la barra de filtros, en un vistazo el neto del período, y registra o corrige un movimiento en dos pasos sin salir del contexto; cada acción responde con un toast y la lista se refresca de inmediato.

## Unresolved decisions

- Búsqueda libre por descripción (no lo soporta el endpoint; hoy se puede paginar con "Cargar más").
- Parse-intent (texto natural vía `POST /transactions/parse-intent`) diferido.
- Filtro `excludeCardPayments` aún no expuesto en la UI.
- Ordenar por columnas (hoy viene ordenado por fecha desc desde el backend).