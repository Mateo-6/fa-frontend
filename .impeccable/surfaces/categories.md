---
version: 1
slug: "categories"
primary_target: "categories"
related_targets: []
---

# /categories

## Mode

Operate

## Scope

Pantalla de gestión de categorías (reemplaza el placeholder `ComingSoon`). CRUD completo de categorías con tipo (gastos, ingresos, transferencias), color y icono, alimentado por la API real de categorías.

## Audience and job

Usuario autenticado de la app de gastos personales. Su trabajo: mantener el vocabulario con el que clasifica sus movimientos — nombres claros, colores e iconos que le permitan identificar una categoría de un vistazo.

## Action / task

Ver sus categorías agrupadas por tipo (Gastos e Ingresos siempre visibles; Transferencias solo si existen), reconocer cada una por color e icono, y crear, editar o eliminar categorías desde un diálogo.

## Proof / content

- **Grupos:** Gastos e Ingresos como pilares permanentes (con su conteo y estado vacío con CTA por tipo); Transferencias aparece solo si hay categorías de ese tipo. Orden alfabético dentro de cada grupo.
- **Identidad por categoría:** badge redondeado con el color de la categoría al 10% de opacidad + icono en color sólido (fallback neutro `Tag` si no hay icono ni color). La paleta curada (12 colores) e los iconos (33 de lucide) viven en `category-options.ts`.
- **Estados:** carga (skeleton), error (con reintentar), vacío total (con CTA), grupos con estado vacío individual.
- **CRUD:** crear y editar en diálogo (tipo fijo en edición); eliminar con confirmación. Toast de éxito/error.

## Constraints

- Consume `GET/POST/PUT/DELETE /categories` con autenticación Bearer JWT.
- La API valida: `name` 1–100, `description` 1–255 (opcional, no nulo; se omite si está vacía), `type` income|expense|transfer, `color` `#RRGGBB` nullable (null la limpia), `icon` string ≤60 nullable.
- No se inventan datos: los totales por categoría no se muestran porque la API no los expone; el frontend no fabrica estadísticas.
- Cualquier `color`/`icon` existente fuera de la paleta curada se conserva y se muestra como opción "Personalizado" en edición.
- Hereda el mundo visual Glass Ledger. Responsive: grupos apilados, filas con acciones al hover en desktop.

## Chosen direction

Glass Ledger, mismo lenguaje que dashboard y métodos de pago: fondo pizarra profundo, paneles esmerilados, acento sky. La pantalla introduce la identidad por color e icono como dato del contenido, respetando el token no-hardcode: los swatches son datos de categoría, no chrome de interfaz.

## Memorable moment

El usuario reconoce cada categoría por su color e icono al registrar un movimiento: el badge coloreado de la fila es el mismo que verá al clasificar gastos e ingresos, haciendo el etiquetado casi automático.

## Unresolved decisions

- No hay orden manual de categorías; se ordenan alfabéticamente dentro de cada tipo.
- Al eliminar una categoría no se informa si las transacciones asociadas se conservan; la API no expone esa relación en el flujo de borrado.
- El icono se almacena como nombre de string; si la API devuelve nombres fuera del set curado, se muestran con fallback `Tag`.
