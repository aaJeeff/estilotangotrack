# Integración visual del portal de seguimiento

## Objetivo

Unificar Login, Mis pedidos y Tracking bajo el lenguaje visual ya definido en el prototipo de tracking: estética premium, paleta azul oscuro/celeste/blanco, superficies Liquid Glass, tipografía de sistema tipo SF y una jerarquía consistente.

El flujo, los datos, las acciones de autenticación y la lógica de seguimiento no cambian.

## Fuente visual de verdad

El archivo `concept/tracking-concept.html` define la referencia principal. Sus reglas tipográficas se trasladan al portal real mediante tokens y estilos compartidos:

- Familia: `-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`, `Segoe UI`, `system-ui`, `sans-serif`.
- Títulos principales: peso 800–860, tracking negativo y escala responsive.
- Labels de sección: 11–12 px, peso 800–820, mayúsculas y `letter-spacing` amplio.
- Badges: 12 px, peso aproximado 780, forma pill y vidrio translúcido.
- Estado principal: 16–17 px y peso 760–780.
- Porcentajes: 34–42 px, peso 860–900 y tracking negativo.
- Texto secundario: 12–14 px, peso 570–680 y blanco azulado semitransparente.
- Barras: fondo translúcido, relleno azul/celeste/blanco, brillo contenido y bordes redondeados.

## Arquitectura de estilos

Los colores, superficies, sombras y escalas tipográficas comunes vivirán como tokens globales y clases reutilizables. Los estilos específicos del portal quedarán aislados para no modificar involuntariamente el panel administrativo.

Los componentes compartidos que también consume el admin conservarán sus defaults actuales. Cuando sea necesario se agregarán variantes o clases específicas para el portal en lugar de reemplazar globalmente su apariencia.

## Login

El login conservará email, contraseña, botón de ingreso, recuperación de contraseña, estados pendientes y errores existentes.

Se aplicará:

- fondo atmosférico construido exclusivamente con gradientes CSS azules;
- tarjeta central Liquid Glass, sin imágenes, mapas ni globos;
- encabezado y texto de ayuda con la jerarquía del tracking;
- inputs translúcidos, legibles y con foco visible;
- botón claro de alto contraste y estados hover, focus y disabled;
- composición responsive y respeto por áreas seguras móviles.

El layout público mantendrá utilizables las pantallas de restablecimiento y definición de contraseña.

## Mis pedidos

Se integrará la estructura tipo wallet/ticket ya aprobada en `.superpowers/brainstorm/1051-1781755222/content/orders-wallet-tracking-style.html` sin alterar su forma ni distribución conceptual.

Cada pedido usará exclusivamente datos reales:

- número y estado;
- porcentaje de progreso;
- cantidad de camisetas;
- fechas estimadas o fecha de entrega cuando existan;
- enlace al tracking real.

Los pedidos activos usarán el ticket principal. Los entregados se mostrarán como tickets anteriores más compactos. Cancelados y estados sin fecha conservarán información clara sin inventar datos.

## Tracking

La página real de detalle adoptará la composición visual del concepto sin reemplazar su dominio ni su flujo de datos.

- `ShipmentMap` seguirá siendo la frontera de visualización y recibirá las mismas props.
- El mapa/globo se presentará como escena atmosférica principal.
- La información del pedido se organizará en paneles Liquid Glass con la tipografía auditada.
- Estado, porcentaje, progreso, estimación, ayuda, timeline, productos y resumen económico conservarán sus datos y funcionalidad.
- Cancelaciones mantendrán un estado explícito y usable.

No se incorporarán APIs, funcionalidades ni fuentes de datos nuevas.

## Responsive y accesibilidad

- Desktop: escena visual amplia con paneles flotantes y ancho de lectura controlado.
- Mobile: flujo vertical, tarjetas táctiles, contenido sin desbordes y jerarquía equivalente.
- Foco visible en enlaces, botones e inputs.
- Contraste suficiente sobre fondos translúcidos.
- `prefers-reduced-motion` reducirá animaciones no esenciales.
- `backdrop-filter` tendrá fondos sólidos/translúcidos de respaldo.

## Verificación

La integración se considerará terminada cuando:

1. Login → Mis pedidos → Tracking funcione con las acciones y rutas existentes.
2. Las tres pantallas compartan familia, escala, badges, progreso y superficies.
3. Las cards de Mis pedidos mantengan su estructura ticket aprobada.
4. Tracking conserve mapas, datos y navegación.
5. No se introduzcan estilos duplicados evitables ni cambios visuales accidentales en admin.
6. `npm run lint`, `npm run test` y `npm run build` finalicen correctamente.
7. El servidor de desarrollo levante y las rutas verificables respondan en desktop y mobile.

