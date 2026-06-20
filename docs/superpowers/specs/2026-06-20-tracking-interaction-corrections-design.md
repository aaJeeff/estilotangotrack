# Correcciones de interacción y fidelidad del tracking

## Objetivo

Corregir exclusivamente `/portal/orders/[id]` para recuperar el comportamiento del último `concept/tracking-concept.html`, sin rediseñar las escenas ni modificar Login, Mis pedidos, dominio o base de datos.

## Navegación y layout

El header global será la única navegación visible. Contendrá la marca `Camisetas track`, un botón `Mis pedidos` y el control `Salir`. Se eliminarán del tracking los controles internos duplicados.

La escena ocupará el viewport disponible debajo del header. Header y tracking compartirán una variable de altura responsive para impedir superposiciones en desktop y mobile. El header permanecerá por encima de la escena sin tapar globo, mapa, ruta ni panel.

## Globo y panel

Se eliminarán el modelo, geometría y lógica de posicionamiento del avión. La ruta internacional se representará únicamente mediante línea base, recorrido iluminado, pulso y animación automática.

El panel y la transformación del planeta se derivarán del mismo valor animado. Al arrastrar, el valor seguirá directamente al puntero. Al expandir o contraer, una única animación de 960 ms y curva `cubic-bezier(.19,1,.22,1)` controlará simultáneamente:

- posición del panel;
- acercamiento de cámara;
- escala del planeta;
- descenso detrás del panel.

No coexistirá una transición CSS independiente que pueda adelantar al planeta. Ambos movimientos deben comenzar y terminar juntos. `prefers-reduced-motion` aplicará el estado final sin recorrido prolongado.

## Timeline

Los nodos conservarán los tres estados finales:

- completado: verde y check;
- actual: azul e iluminado;
- pendiente: neutro oscuro/desaturado, igual al diseño actual, sin color ni iluminación adicional.

La línea se dividirá en segmentos asociados a cada paso, evitando un gradiente global hardcodeado:

- completado → completado: verde;
- completado → actual: gradiente suave verde a azul;
- actual → pendiente y pendiente → pendiente: neutro oscuro/desaturado, sin color destacado.

Cada segmento pertenecerá al paso que lo precede y crecerá con su contenedor. Por eso abrir “¿Qué significa?” no moverá colores hacia pasos futuros ni desalineará nodos y línea.

## Desplegables

“¿Qué significa?”, “Productos incluidos” y “Resumen económico” usarán un control React compartido con estado accesible y animación mediante grid rows, opacidad y transformación. La apertura y el cierre tendrán easing suave, sin desmontaje brusco ni saltos de layout. Los contenidos conservarán Liquid Glass y respetarán reducción de movimiento.

## Productos y resumen económico

Productos incluidos conservará los datos reales y recuperará la estructura visual del concepto final: marcador, nombre y metadatos agrupados dentro de la card final.

El resumen mostrará:

- Total: importe real;
- Seña abonada: estado `Confirmada` cuando existe un depósito abonado y `Pendiente` cuando no existe;
- Saldo pendiente: importe real.

El estado confirmado tendrá indicador verde; el pendiente será neutro/ámbar según la identidad existente. Se eliminará el importe como valor principal de la fila “Seña abonada”.

## Límites

- No se crean nuevas escenas ni propuestas visuales.
- No se cambia la lógica de estados del pedido.
- No se modifican Login ni Mis pedidos salvo el header compartido necesario para añadir el botón solicitado.
- No se reintroducen componentes viejos ni controles de prototipo.
- Se preservan todos los cambios locales existentes.

## Validación

- Confirmar ausencia del avión y de navegación interna duplicada.
- Verificar sincronización temporal panel/planeta durante click y drag.
- Probar timeline en las siete etapas y expansión del texto de ayuda.
- Probar apertura y cierre de los tres desplegables.
- Verificar productos y estados de seña con datos reales.
- Validar header y tracking en desktop y mobile.
- Ejecutar TypeScript, lint, tests y build.
- Levantar localhost y comprobar el flujo autenticado hasta tracking.

## Criterios de aceptación

- El avión no existe en la escena ni en el bundle del componente.
- Panel y planeta terminan sus transiciones al mismo tiempo.
- Los pasos pendientes permanecen oscuros y sin color destacado.
- La línea refleja dinámicamente completados, actual y pendientes.
- Abrir contenido no rompe la alineación del timeline.
- Todos los desplegables abren y cierran con animación suave.
- La seña se expresa como estado, no como monto.
- El header global no tapa contenido y concentra toda la navegación.
