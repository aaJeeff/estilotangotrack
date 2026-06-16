# Integración con 17Track

Todo el acoplamiento a 17Track vive en el adaptador
[`seventeen-track.adapter.ts`](../src/modules/tracking/infrastructure/seventeen-track.adapter.ts),
detrás del puerto `TrackingProvider`. El resto del sistema no conoce 17Track.

## API key

En [api.17track.net](https://api.17track.net) obtené tu API key y cargala en
`SEVENTEENTRACK_API_KEY`. El adaptador la envía en el header `17token`.

## Flujo

1. El admin carga el código de seguimiento en un pedido → `assignTrackingAction`
   crea el `Shipment` y llama a `register()` (endpoint `/register` de 17Track).
2. La sincronización (`syncShipment`) obtiene eventos, los normaliza a `RawTrackingEvent`,
   los guarda de forma **idempotente** (`dedupeHash`) y corre el **motor de traducción**.
3. El estado del pedido solo **avanza** (monotonía); eventos viejos o desconocidos no lo
   hacen retroceder y no se muestran al cliente.

## Disparadores de sincronización

- **Webhook (principal):** configurá en 17Track la URL
  `https://TU_DOMINIO/api/webhooks/17track?secret=SEVENTEENTRACK_WEBHOOK_SECRET`.
- **Cron (respaldo):** `/api/cron/tracking-sync` procesa los envíos cuyo `nextSyncAt` venció.
- **Manual:** botón "Actualizar ahora" en el detalle del pedido.

## Frecuencia (control de costos)

Configurable en `AppConfig` (`sync_frequencies_hours`), por zona:
China 12 h · Argentina 6 h · Cerca de entrega 2 h. El polling es selectivo (solo lo vencido).

## Motor de traducción

[`event-translation-engine.ts`](../src/modules/tracking/domain/event-translation-engine.ts)
mapea descripciones/códigos/país a estados de negocio mediante reglas ordenadas.
Está cubierto por tests (`npm run test`). **Ajustá las reglas con payloads reales** de tus
envíos: agregá regex o códigos a `RULES` y un test que lo respalde.
