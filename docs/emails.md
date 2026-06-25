# Sistema de emails

Emails transaccionales con **Resend** + **React Email**. El puerto `NotificationSender`
([application/notification-sender.ts](../src/modules/notifications/application/notification-sender.ts))
desacopla el dominio del proveedor; la implementación actual es
[`ResendNotificationSender`](../src/modules/notifications/infrastructure/resend-sender.ts).

## Configuración

1. Cuenta en [resend.com](https://resend.com), verificá tu dominio.
2. `RESEND_API_KEY` y `EMAIL_FROM` en `.env`.

## Plantillas

En `src/modules/notifications/templates/` (componentes React, responsive, con branding):

- `InvitationEmail` — invitación al crear un cliente.
- `StatusUpdateEmail` — actualización de estado.

Previsualización local: `npm run email:dev`.

## Cuándo se envía

| Disparador | Email |
|---|---|
| Alta de cliente | Invitación para definir contraseña |
| Estado → **En vuelo internacional** | Actualización de estado |
| Estado → **En aduana** | Actualización de estado |
| Estado → **En distribución local** | Actualización de estado |

Qué estados notifican está marcado con `notify: true` en
[`order-status.ts`](../src/shared/config/order-status.ts).

## Idempotencia

`notifyStatusChange()` ([send.ts](../src/modules/notifications/send.ts)) reclama un slot en
`Notification.dedupeKey` (`orderId:status:EMAIL`) antes de enviar. Aunque el webhook y el cron
coincidan, **cada email se envía una sola vez**. Los fallos quedan en estado `FAILED` con el error.

## Reintentos operativos

En `/admin/orders/[id]`, la tarjeta **Emails y notificaciones** muestra los emails de estado
registrados para ese pedido. Si un email quedó `FAILED` (por ejemplo, por `RESEND_API_KEY`
inválida), el admin puede usar **Reintentar email** después de corregir la configuración.

El reintento reutiliza la misma fila `Notification`: pasa a `PENDING`, intenta enviar, y termina en
`SENT` o vuelve a `FAILED` con el nuevo error. No crea duplicados ni saltea permisos de admin.

Las invitaciones de cliente todavía se envían de forma best-effort desde el alta o desde
**Reenviar invitación** en la ficha del cliente. Su auditoría persistente queda como mejora futura
porque el modelo actual de `Notification` está asociado a pedidos (`orderId`).

## Futuro: WhatsApp

Implementá un `WhatsAppSender` que cumpla `NotificationSender` y usá `channel = WHATSAPP`.
El dominio y los servicios no cambian.
