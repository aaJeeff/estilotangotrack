# Corrección definitiva de la integración del tracking

## Objetivo

Corregir `/portal/orders/[id]` para que la experiencia activa sea una adaptación fiel de la última versión local de `concept/tracking-concept.html`, sin mezclar componentes, datos visuales ni comportamientos del tracking anterior.

## Fuente de verdad

- `concept/tracking-concept.html` define composición visual, escenas, cámaras, marcadores, rutas, iluminación, animaciones, panel Liquid Glass y comportamiento responsive.
- Los datos reales del pedido, la autenticación y los permisos continúan siendo responsabilidad de la página servidor y de los módulos de dominio existentes.
- Los controles utilizados únicamente para probar estados en el prototipo no aparecen en el flujo productivo.
- Los cambios locales existentes en el concepto y en el resto del árbol de trabajo se preservan.

## Modelo visible de seguimiento

La interfaz presenta exclusivamente estas siete etapas, en este orden:

1. Pedido confirmado
2. En preparación
3. En vuelo internacional
4. En aduana
5. En camino a Rosario
6. En distribución local
7. Entregado

Los estados técnicos de base de datos permanecen intactos. Una única función de adaptación los convierte a estas etapas visibles. Esa etapa derivada controla simultáneamente el timeline, textos, porcentaje, escena, progresión de ruta, cámara y animaciones, evitando divergencias entre desktop y mobile.

## Arquitectura

La página de App Router permanece como Server Component: valida acceso, consulta el pedido y entrega propiedades serializables. La experiencia interactiva permanece detrás de una frontera Client Component, tal como prescribe la documentación local de Next 16.

El módulo de tracking se divide por responsabilidad:

- Adaptación de estado: estado técnico → etapa visible y parámetros de escena.
- Orquestación: panel, expansión, interacción, reinicio y transición entre etapas.
- Escena internacional: globo, atmósfera, ruta Guangzhou–Buenos Aires, pins, banderas, iluminación y cámara.
- Escena nacional: mapa Buenos Aires–Rosario, Ruta 9, perspectiva, ciudades, nubes y progresión.
- Presentación: panel Liquid Glass, timeline, productos, pagos y navegación.

No se reintroducen `GlobeMap`, `ArgentinaMap` ni `ShipmentMap`. Se eliminarán referencias y datos heredados que compitan con la implementación nueva.

## Escenas y animaciones

Cada etapa dispone de una configuración explícita de escena. Un cambio de etapa crea una nueva transición visual, no solo un reemplazo de texto. Esto incluye interpolación de cámara y posición, reinicio o avance de ruta, iluminación progresiva, estado de marcadores y transición del mapa o globo.

La interacción manual del globo se conserva sin impedir la animación automática. Al terminar la interacción, la escena recupera suavemente su comportamiento previsto. Expandir o contraer el panel desplaza la composición con las mismas reglas del concepto. `prefers-reduced-motion` mantiene una alternativa estable y accesible.

## Bandera de China

La bandera se implementa como una superficie con proporción fija, recorte estricto y una estrella principal estable. No se utilizarán transformaciones que puedan sacar la estrella del plano o estirarla con el pin. Si la reconstrucción decorativa del prototipo no resulta robusta en WebGL, se empleará la variante simplificada prevista: bandera roja y estrella amarilla correctamente contenida.

## Responsive

Desktop y mobile comparten el mismo modelo de etapa y la misma progresión. Solo cambian composición, cámara, dimensiones y mecánica del sheet. En desktop el panel lateral permanece visible; en mobile funciona como sheet expandible y arrastrable. Las escenas deben recalcularse al cambiar el viewport sin perder el estado ni duplicar listeners o ciclos de animación.

## Integración y compatibilidad

Se conservan autenticación, permisos, navegación, consulta de pedido, productos, pagos, estimaciones y datos históricos. Login y Mis pedidos quedan fuera de cambios visuales salvo correcciones imprescindibles para evitar regresiones. El dominio y la base de datos no se migran.

## Validación

- Búsqueda estática de componentes, etiquetas y estilos viejos activos.
- Pruebas unitarias de la conversión de todos los estados técnicos a las siete etapas.
- Pruebas de escena/progreso y estados terminales.
- Lint, TypeScript, tests y build de producción.
- Ejecución en localhost y comprobación del flujo Login → Mis pedidos → Tracking.
- Verificación de desktop y mobile, expansión del panel, interacción del globo y animaciones de ambas rutas.

## Criterios de aceptación

- Solo aparecen los siete nombres finales.
- Timeline, progreso y escena nunca se contradicen.
- La bandera china es proporcional y permanece dentro de sus límites.
- Cambiar de etapa dispara transiciones visuales reales.
- Globo y mapa reproducen el comportamiento de la última versión del concepto.
- No existen controles de prototipo visibles en producción.
- No se activan componentes viejos ni estilos que pisen la experiencia nueva.
- El flujo real compila, responde correctamente y funciona en desktop y mobile.
