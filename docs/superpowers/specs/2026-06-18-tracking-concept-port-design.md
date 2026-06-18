# Porte fiel del tracking conceptual al portal real

## Objetivo

Reemplazar la implementación actual de `/portal/orders/[id]` por una adaptación fiel de la última versión de `concept/tracking-concept.html`.

El concepto es la fuente visual y funcional de verdad. Los componentes anteriores `GlobeMap`, `ArgentinaMap` y `ShipmentMap` no se utilizarán como base de la nueva experiencia.

Login y Mis pedidos quedan fuera de este reemplazo y deben continuar funcionando con su integración actual.

## Diferencias que corrige este porte

La implementación actual sólo conserva un globo genérico de `react-globe.gl`, un SVG nacional simplificado y una composición inspirada en el concepto. Faltan:

- el renderer Three.js directo y su modelo GLB con fallback texturizado;
- atmósfera mediante shader, iluminación, estrellas, océano y calibración geográfica;
- ruta internacional tridimensional, tramo recorrido, pulso, avión y banderas;
- tour automático, manipulación manual y retorno progresivo de cámara;
- el mapa nacional real de MapLibre;
- ruta Buenos Aires–Rosario obtenida desde OSRM con fallback local;
- paleta personalizada, nubes, marcadores, regiones y etiquetas;
- landmarks STL del Obelisco y Monumento a la Bandera;
- variantes visuales de aduana, tránsito nacional y distribución local;
- sheet móvil arrastrable y movimiento de cámara sincronizado;
- layout desktop full-screen con panel flotante;
- animaciones de progreso, detalles y estados del timeline.

## Arquitectura

### Página servidor

`/portal/orders/[id]/page.tsx` continuará resolviendo autenticación, autorización y consulta del pedido en el servidor.

La página transformará el resultado en un objeto serializable `TrackingExperienceData` y lo entregará a una frontera cliente. Ningún acceso a Prisma, Supabase ni secretos se moverá al navegador.

### Experiencia cliente

Un componente cliente `TrackingExperience` será responsable de:

- seleccionar la escena a partir del estado real;
- renderizar el layout completo del concepto;
- coordinar mapa/globo, sheet, cámara y responsive;
- liberar renderers, mapas, geometrías, materiales, observers y listeners al desmontarse.

La experiencia se dividirá en unidades acotadas:

1. `InternationalGlobe`: renderer Three.js, GLB/fallback, shaders, luces, ruta, flags, avión, tour e interacción.
2. `NationalTrackingMap`: MapLibre, estilo CARTO, OSRM/fallback, nubes, marcadores, regiones y landmarks STL.
3. `TrackingSheet`: estado, progreso, timeline, entrega, productos y resumen económico con datos reales.
4. `tracking-state.ts`: función pura que transforma cada estado de dominio en una escena visual.

## Mapeo de estados

| Estado real | Escena |
|---|---|
| `CONFIRMED` | Globo internacional, progreso inicial |
| `DISPATCHED_CHINA` | Globo internacional y recorrido activo |
| `ARRIVED_ARGENTINA` | Mapa real, foco en Buenos Aires |
| `CUSTOMS_PROCESSING` | Mapa real, estado aduana |
| `DECLARED` | Mapa real, aduana/liberación |
| `EN_ROUTE_ROSARIO` | Mapa real, ruta Buenos Aires–Rosario |
| `RECEIVED_BY_US` | Mapa real, foco y distribución en Rosario |
| `DELIVERED` | Rosario, recorrido completo y estado entregado |
| `CANCELLED` | Estado terminal sin animación de recorrido activo |

Los porcentajes continuarán saliendo de `ORDER_STATUS_META`; no se inventará GPS ni ubicación en tiempo real.

## Controles conceptuales excluidos

El switcher `Globo / Real aduana / Real ruta / Real Rosario` no se portará al producto.

Tampoco se expondrán:

- parámetros `view`, `localStatus`, `look`, `debug` o calibración;
- HUD de depuración;
- enlaces para forzar escenas visuales.

La escena será consecuencia exclusiva del estado real del pedido.

## Assets y dependencias

Los assets necesarios se servirán desde `public/tracking/`:

- texturas terrestres de `concept/assets/earth/`;
- `globo-terraqueo-mapa-fisico.glb`;
- STL del Obelisco;
- STL del Monumento a la Bandera.

Se conservarán en documentación las atribuciones y licencias existentes. El Monumento a la Bandera tiene licencia de atribución no comercial y se mantendrá identificado como tal.

`maplibre-gl` se instalará como dependencia local. El producto no importará MapLibre desde `esm.sh` ni cargará su CSS desde `unpkg`.

El globo usará directamente la dependencia `three` existente. `react-globe.gl` dejará de participar en tracking y podrá eliminarse si queda sin consumidores.

## Fidelidad visual

Los estilos se trasladarán a un CSS Module exclusivo para evitar contaminación global. Se preservarán:

- composición full-screen de desktop;
- escena superior y sheet móvil colapsado/expandido;
- tamaños, pesos y tracking tipográfico;
- superficies, blur, bordes y sombras Liquid Glass;
- rutas, marcadores, halos, nubes y capas atmosféricas;
- timings y curvas de las animaciones;
- adaptación a `prefers-reduced-motion`;
- movimiento de cámara vinculado a la apertura del sheet.

La cabecera global del portal no debe duplicarse encima de la escena. La ruta de tracking podrá usar un shell inmersivo específico conservando navegación hacia Mis pedidos y salida de sesión.

## Datos reales

El sheet mostrará:

- número y estado del pedido;
- porcentaje real;
- historial real y ayuda del estado actual;
- fechas estimadas disponibles;
- productos, talle, versión, estampado y cantidad;
- total, seña, saldo y estado de pago.

Si falta una fecha o dato opcional se mostrará una alternativa explícita; nunca se copiarán valores ficticios del prototipo.

## Tolerancia a fallos

- Si falla el GLB, se usará la esfera texturizada del concepto.
- Si falla OSRM, se usará la ruta GeoJSON incluida localmente.
- Si falla el estilo remoto de CARTO, se mostrará una escena nacional estática coherente en lugar de un panel vacío.
- Si falla un STL, el mapa seguirá funcionando con los marcadores y rutas restantes.
- Un error visual no debe impedir leer el pedido ni navegar.

## Rendimiento y limpieza

- Three.js y MapLibre se cargarán únicamente en el componente cliente de tracking.
- Sólo se inicializará la escena correspondiente al estado actual.
- El pixel ratio se limitará como en el concepto.
- Geometrías regeneradas se descartarán antes de reemplazarse.
- Todos los loops de animación, timers, mapas y listeners tendrán cleanup.

## Verificación

1. Tests unitarios del mapeo de los nueve estados.
2. Comprobación de globo internacional con datos reales.
3. Comprobación de aduana, ruta y Rosario sin controles manuales de escena.
4. Verificación del fallback de ruta y del fallback del globo.
5. Sheet móvil: tap, drag, expansión, scroll y cámara.
6. Desktop: panel, ruta, interacción del globo y mapa.
7. Navegación, autenticación, productos, timeline y pagos.
8. Ausencia del switcher conceptual y HUD de debug.
9. `npm run lint`, `npm run test`, `npx tsc --noEmit` y `npm run build`.
10. Prueba final en localhost sin errores de consola ni overflow horizontal.

