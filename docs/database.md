# Base de datos

PostgreSQL (Supabase) gestionada con Prisma. Esquema en [`prisma/schema.prisma`](../prisma/schema.prisma).

## Entidades

| Modelo | Rol |
|---|---|
| `User` | Identidad. Espeja `auth.users` de Supabase por `id`. Campo `role` (`ADMIN`/`CLIENT`). |
| `Client` | Datos comerciales del cliente. Se vincula a `User` (`userId`) al aceptar la invitación. |
| `Order` | Pedido: estado actual, fechas estimadas, snapshot de pagos. |
| `OrderItem` | Camiseta del pedido (talle, versión, estampado, parches, precio) + propietario interno. |
| `Shipment` | Envío internacional (1–1 con `Order`): código, zona de sync, próxima sincronización. |
| `TrackingEvent` | Evento **crudo** de 17Track. Permanente. Idempotente por `@@unique([shipmentId, dedupeHash])`. |
| `OrderStatusHistory` | Estados de **negocio** traducidos (lo que ve el cliente). |
| `Payment` | Movimientos financieros (seña / saldo / ajuste). Ledger para el futuro panel financiero. |
| `Notification` | Registro de envíos. `dedupeKey` único garantiza "un email por evento". |
| `AuditLog` | Quién hizo qué, cuándo, con `before`/`after`. |
| `Branch` / `Destination` | Preparación multi-sucursal / multi-ciudad. |
| `AppConfig` | Configuración runtime (frecuencias de sync). |

## Snapshot de pagos

`Order` guarda `totalAmount`, `depositAmount`, `balanceAmount` y `paymentStatus` como
**snapshot** para mostrar rápido. La fuente de verdad es la tabla `Payment`; el snapshot se
recalcula con `recomputePayments()` (en `modules/orders/actions.ts`) tras cada cambio.

## Estados y progreso

Definidos en [`src/shared/config/order-status.ts`](../src/shared/config/order-status.ts):
progresión no uniforme (0 → 25 → 65 → 75 → 82 → 90 → 98 → 100), etiquetas en español,
ayuda contextual y a qué mapa corresponde cada estado.

## Comandos

```bash
npm run db:migrate     # desarrollo (crea migración + aplica)
npm run db:deploy      # producción (aplica migraciones existentes)
npm run db:push        # empujar el esquema sin migración (prototipado)
npm run db:seed        # datos iniciales
npm run db:studio      # explorador visual
```

> Prisma lee la conexión desde `.env` (`DATABASE_URL` pooled, `DIRECT_URL` directa para migrar).
