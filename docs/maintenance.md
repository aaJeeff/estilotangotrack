# Mantenimiento y operación

## Tareas frecuentes

| Necesidad | Dónde |
|---|---|
| Ajustar frecuencia de sync | `AppConfig.sync_frequencies_hours` (Prisma Studio) |
| Afinar traducción de eventos | `modules/tracking/domain/event-translation-engine.ts` + test |
| Cambiar textos de ayuda / etiquetas / progreso | `shared/config/order-status.ts` |
| Agregar un admin | Crear en Supabase Auth con `app_metadata.role=ADMIN` + fila en `User`, o ampliar el seed |
| Revisar emails fallidos | Tabla `Notification` con `status=FAILED` |
| Reintentar email fallido | `/admin/orders/[id]` → **Emails y notificaciones** → **Reintentar email** |
| Revisar eventos crudos | `/admin/orders/[id]` → **Seguimiento** → **Eventos recientes** |
| Auditar cambios | Tabla `AuditLog` |

## Diagnóstico

- `GET /api/health` para verificar que la app responde.
- Logs de Vercel para errores de Server Actions / cron / webhook.
- `npm run db:studio` para inspeccionar datos.
- Un envío que no avanza: revisá `Shipment.lastSyncedAt`, `nextSyncAt` y sus `TrackingEvent`.
  Forzá con "Actualizar ahora"; si el evento existe pero no avanza, falta una regla en el motor.

## Calidad

- `npm run test` antes de tocar el motor de traducción.
- `npx tsc --noEmit` para chequeo de tipos.
- `npm run lint`.

## Escalabilidad (ya contemplada en el diseño)

| Expansión | Cómo |
|---|---|
| WhatsApp | `WhatsAppSender` que cumpla `NotificationSender` + `channel=WHATSAPP` |
| Mercado Pago | Tabla `Payment` (`type`/`method`) ya preparada; agregar adaptador de cobro |
| Multi-sucursal / multi-ciudad | Tablas `Branch` / `Destination` ya presentes |
| Panel financiero / reportes | Ledger en `Payment` + `AuditLog` |
| Otro proveedor de tracking | Nueva implementación de `TrackingProvider` |
| Otro scheduler | Reemplazar el disparador del cron; el caso de uso no cambia |

## Backups

Supabase ofrece backups automáticos según el plan. Para datos críticos, programá exportaciones
periódicas (pg_dump) además del backup gestionado.
