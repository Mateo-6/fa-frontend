# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React / Next.js

## Users

Personas que quieren hacer seguimiento diario de sus finanzas personales: registrar gastos fijos, variables, pagos con tarjeta de crédito y otros movimientos de dinero, para tener claridad de su situación financiera real.

## Product Purpose

Aplicación web que permite registrar, categorizar y monitorear ingresos y gastos personales. Integra gastos recurrentes, métodos de pago (tarjetas de crédito, cuentas bancarias, efectivo), estados de cuenta, presupuestos con alertas y notificaciones, todo sobre una base de autenticación JWT.

## Positioning

Centraliza en una sola interfaz web el seguimiento de cash flow, crédito y presupuestos personales, conectando directamente con una API REST existente que ya modela toda la lógica financiera.

## Operating Context

- Uso principal en navegadores de escritorio y móviles (web responsive).
- Autenticación con email y password; sesión gestionada mediante JWT.
- Backend API REST ya existente en `../api` (documentada en `Financial-App-API.postman_collection.json`).
- Endpoints principales: Auth, Dashboard, Users, Categories, Transactions, Recurring Expenses, Payment Methods, Credit Cards, Notifications, Budgets.
- Flujo esperado: login → dashboard → registro/visualización de transacciones, tarjetas, presupuestos.

## Capabilities and Constraints

- Login: `POST /auth/login` con `email` y `password`; responde `token` JWT y objeto `user`.
- Logout: `POST /auth/logout` con token en header `Authorization: Bearer <token>`.
- Resumen financiero: `GET /summary` retorna balance, ingresos, gastos, transacciones recientes y próximos pagos.
- CRUD de usuarios, categorías, transacciones, gastos recurrentes, métodos de pago, tarjetas de crédito y presupuestos (requieren autenticación).
- Notificaciones push vía registro de Expo tokens.
- Sin marca, logo, colores corporativos ni copy legal/regulatorio definidos aún.
- Stack confirmado: React / Next.js.

## Brand Commitments

Ninguno confirmado. No hay nombre comercial, logo, paleta, tipografía ni voz de marca establecidos todavía.

## Evidence on Hand

- Colección Postman completa de la API: `../api/Financial-App-API.postman_collection.json`.
- Backend API funcional con autenticación JWT y todos los servicios documentados.

## Product Principles

1. **Claridad financiera primero.** Cada pantalla debe responder "¿cuánto tengo, cuánto debo y a dónde se va mi dinero?" sin ruido.
2. **Verdad centralizada.** Ingresos, gastos, tarjetas de crédito y presupuestos conviven en un solo lugar, reflejando la API real.
3. **Seguridad desde el primer contacto.** El login debe transmitir confianza y proteger la sesión con JWT.
4. **Registro sin fricción.** Añadir un gasto, un ingreso o revisar el dashboard debe ser rápido e intuitivo.
5. **Sin inventar datos.** El frontend no fabricará información; consumirá y mostrará lo que la API entrega.
