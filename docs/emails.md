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
| Estado → **Despachado desde China** | Actualización de estado |
| Estado → **Llegó a Argentina** | Actualización de estado |
| Estado → **Recibido por nosotros** | Actualización de estado |

Qué estados notifican está marcado con `notify: true` en
[`order-status.ts`](../src/shared/config/order-status.ts).

## Idempotencia

`notifyStatusChange()` ([send.ts](../src/modules/notifications/send.ts)) reclama un slot en
`Notification.dedupeKey` (`orderId:status:EMAIL`) antes de enviar. Aunque el webhook y el cron
coincidan, **cada email se envía una sola vez**. Los fallos quedan en estado `FAILED` con el error.

## Futuro: WhatsApp

Implementá un `WhatsAppSender` que cumpla `NotificationSender` y usá `channel = WHATSAPP`.
El dominio y los servicios no cambian.
