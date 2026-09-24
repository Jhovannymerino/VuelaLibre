# Especificación UI/UX del dashboard principal del MVP

## Objetivo del dashboard

El dashboard principal debe convertir datos complejos de disponibilidad de asientos en una decisión simple de compra. ExpertFlyer ya demuestra que existe demanda para visualizar seat maps, estados como occupied, blocked, available y premium, y configurar alertas sobre asientos o vuelos; AeroLOPA demuestra que una representación rica del interior del avión mejora mucho la comprensión visual del producto. [cite:55][cite:75][cite:61]

La oportunidad del MVP no es reemplazar un metabuscador de precios, sino presentar una interfaz que combine **visualización del mapa**, **indicadores accionables** y **recomendación de compra** para usuarios no expertos. Google Flights cubre bien búsqueda y comparación tarifaria, mientras ExpertFlyer cubre disponibilidad y alertas para un público más avanzado. [cite:76][cite:84][cite:55][cite:71]

## Principios de diseño

### 1. Doble capa de valor

La interfaz debe trabajar con dos niveles simultáneos:

- **Capa visual**: mapa de cabina claro y creíble.
- **Capa analítica**: scores, riesgo, señales y recomendaciones.

El mapa genera confianza porque hace tangible el estado del vuelo; los indicadores convierten ese mapa en una decisión. ExpertFlyer ya capitaliza la fuerza del seat map y las seat alerts, mientras AeroLOPA muestra el valor de la claridad visual del layout de cabina. [cite:55][cite:75][cite:61]

### 2. Lenguaje de decisión, no de power user

El producto debe hablar en términos como:

- “vuelo bastante lleno”
- “todavía hay buenas opciones”
- “baja probabilidad de asientos juntos”
- “recomendación: comprar hoy”

Eso posiciona la experiencia como asistente de decisión precompra, no como consola para aviation geeks. ExpertFlyer ofrece herramientas potentes, pero su oferta pública enfatiza seat maps, seat alerts, flight availability y upgrade/award workflows más cercanos al usuario experto. [cite:71][cite:75][cite:77]

### 3. Una conclusión clara por pantalla

Cada vista principal debe responder en menos de 5 segundos:

- qué tan lleno va,
- si hay buenos asientos,
- si hay asientos juntos,
- y si conviene actuar ahora.

## Estructura del dashboard

La pantalla principal debe organizarse en 6 bloques:

1. Header contextual.
2. Hero de decisión.
3. Barra de KPIs.
4. Mapa de asientos enriquecido.
5. Panel de acción y recomendaciones.
6. Historial y alertas.

## 1. Header contextual

### Objetivo

Dar contexto operacional inmediato del vuelo que se está observando.

### Contenido

- Aerolínea y logo.
- Número de vuelo.
- Ruta.
- Fecha.
- Hora de salida si está disponible.
- Cabina analizada.
- Tipo de avión si está disponible.
- Última actualización.

### Comportamiento

- Debe quedar fijo en desktop al hacer scroll.
- En móvil debe compactarse a 2 líneas.
- Debe incluir un selector de cabina si el mapa tiene varias.

### Ejemplo visual

```text
Iberia IB6113  |  MAD → MIA  |  15 Jun 2026  |  Economy  |  A350-900
Actualizado hace 4 min
```

## 2. Hero de decisión

### Objetivo

Traducir el análisis del vuelo a una recomendación comercialmente clara.

### Contenido obligatorio

- Estado principal del vuelo.
- Recomendación principal.
- Explicación breve.

### Copy sugerido

```text
Este vuelo parece bastante lleno.
Todavía quedan algunos asientos buenos, pero la opción de ir acompañado es baja.
Recomendación: comprar hoy si priorizas sentarte bien.
```

### Componentes

- Badge principal: `Vacío`, `Medio`, `Lleno`, `Muy lleno`.
- Badge secundario: `Compra hoy`, `Puedes esperar`, `Vigilar`.
- Microcopy de soporte.

### Regla UX

No mostrar más de una recomendación principal. Si la pantalla comunica simultáneamente “espera” y “compra ya”, pierde credibilidad.

## 3. Barra de KPIs

### Objetivo

Presentar las métricas clave antes de entrar al detalle del mapa.

### KPIs recomendados

| KPI | Definición | Valor UX |
|---|---|---|
| Flight fullness | Porcentaje estimado de ocupación aparente | Ayuda a entender urgencia |
| Seat opportunity score | Calidad y cantidad de buenas opciones disponibles | Mide si aún hay margen para elegir |
| Seats together probability | Probabilidad de encontrar 2 o 3 asientos contiguos | Muy útil para parejas/familias |
| Window/Aisle availability | Disponibilidad real de preferencias comunes | Habla el lenguaje del usuario |
| Buy now signal | Recomendación operacional | Convierte datos en acción |

### Diseño visual

- 4 a 5 cards horizontales en desktop.
- 2 columnas en tablet.
- Stack vertical en móvil.
- Cada KPI debe mostrar:
  - valor principal,
  - subtítulo,
  - cambio respecto al último chequeo si existe,
  - color semántico.

### Ejemplo

```text
78% lleno
Pocas buenas opciones
↓ 6 asientos útiles vs ayer
```

## 4. Mapa de asientos enriquecido

### Objetivo

Mostrar una representación visual potente del vuelo que combine claridad tipo ExpertFlyer con lectura espacial rica tipo AeroLOPA. ExpertFlyer ya presenta estados operativos del asiento y alertas asociadas; AeroLOPA es referencia visual para layout detallado de cabina. [cite:55][cite:75][cite:61]

### Estados mínimos de asientos

- Disponible
- Ocupado aparente
- Bloqueado
- Premium/extra legroom
- Recomendado
- Desconocido

### Leyenda sugerida

- Verde: disponible
- Gris oscuro: ocupado aparente
- Gris claro / rayado: bloqueado
- Azul o dorado: premium
- Contorno destacado: recomendado
- Transparente con icono: desconocido

### Capas visuales activables

El usuario debe poder alternar entre estas vistas:

1. **Disponibilidad**: estado puro del asiento.
2. **Calidad**: asiento bueno/regular/malo según zona y características.
3. **Parejas/Grupos**: clusters de asientos contiguos.
4. **Precio de asiento**: si la aerolínea lo muestra en el flujo.
5. **Recomendados**: mejores opciones calculadas por el sistema.

### Elementos estructurales a representar

Inspirado en la riqueza visual de AeroLOPA, el mapa debe incluir cuando sea posible: galley, lavatories, salidas, bulkhead, alas, filas con mayor ruido o menor reclinación, y límites de cabina. AeroLOPA se caracteriza precisamente por mapas detallados de aeronaves y layouts interiores. [cite:61][cite:103][cite:107]

### Interacciones

Al hacer hover o tap en un asiento:

- mostrar `seat label`
- mostrar tipo de asiento
- mostrar estado
- mostrar precio si existe
- mostrar una recomendación breve, por ejemplo “buena opción para pasillo” o “zona con alta rotación”

### Reglas de claridad

- No dibujar el mapa demasiado pequeño.
- Mantener proporciones visibles por fila.
- No saturar con demasiados colores simultáneos.
- La capa activa debe dominar visualmente; las demás deben atenuarse.

## 5. Panel de acción y recomendaciones

### Objetivo

Traducir el mapa en acciones concretas para el usuario.

### Módulos del panel

#### Mejores opciones disponibles

Lista corta de asientos sugeridos:

- mejor asiento individual
- mejor asiento ventana
- mejor asiento pasillo
- mejor relación calidad/precio

#### Opciones para dos o más personas

- mejor pareja de asientos juntos
- mejor bloque de 3 juntos
- riesgo de perder contigüidad

ExpertFlyer destaca explícitamente alertas para asientos específicos, ventana, pasillo o asientos juntos, lo que confirma la relevancia comercial de estas recomendaciones. [cite:75][cite:104]

#### Señales de acción

- Comprar hoy
- Vigilar 24h
- Configurar alerta

#### Motivos explicativos

Cada recomendación debe incluir una razón breve:

- “la zona delantera ya está casi tomada”
- “quedan 2 pares juntos útiles”
- “todavía hay varias ventanas libres”

## 6. Historial y alertas

### Objetivo

Convertir una foto puntual en una historia temporal.

### Componentes

- mini línea de tiempo con snapshots previos del mismo vuelo
- evolución del `flight fullness`
- evolución del `seat opportunity score`
- variación de asientos juntos
- botón `Crear alerta`

ExpertFlyer ya usa seat alerts y flight alerts como parte central de su propuesta, lo que valida que el seguimiento temporal aumenta valor percibido. [cite:75][cite:77]

### Alertas mínimas del MVP

- cuando se libere cualquier asiento recomendado
- cuando aparezcan 2 asientos juntos
- cuando el score del vuelo empeore o mejore de forma significativa
- cuando cambie la recomendación principal (`esperar` -> `comprar hoy`)

## Navegación principal

El producto debería tener una navegación muy reducida:

- Dashboard
- Historial
- Watchlist
- Alertas
- Perfil

### Regla

No mezclar esta navegación con conceptos propios de metabuscadores. El foco debe seguir siendo “vuelos observados y decisiones”, no “exploración masiva de viajes”. Google Flights ya cubre muy bien la parte de búsqueda amplia y best fares. [cite:76][cite:84]

## Diseño responsive

### Desktop

Layout recomendado:

- Header fijo arriba.
- Hero + KPIs arriba.
- Mapa a la izquierda ocupando 65 a 70 por ciento.
- Panel de acción a la derecha ocupando 30 a 35 por ciento.
- Historial debajo del mapa o en tabs secundarias.

### Tablet

- Hero arriba.
- KPIs en grid 2x2.
- Mapa full width.
- Panel de acción debajo.

### Mobile

- Hero primero.
- KPIs apilados.
- Mapa full width con zoom horizontal.
- Tabs para cambiar entre `Mapa`, `Recomendaciones`, `Historial`.
- CTA fijo inferior: `Crear alerta` o `Guardar vuelo`.

## Jerarquía de color

### Colores semánticos propuestos

- Verde: oportunidad buena.
- Ámbar: estado intermedio o vigilar.
- Rojo: alta saturación o urgencia.
- Azul: información premium o datos adicionales.
- Gris: estados neutros o bloqueados.

### Reglas

- El color de estado del vuelo debe coincidir entre hero, KPIs y panel.
- Los asientos premium no deben confundirse con asientos recomendados.
- Las alertas deben usar un color distinto al de disponibilidad.

## Microcopy clave

### Etiquetas del producto

Usar terminología amigable:

- `Vuelo bastante lleno`
- `Aún hay opciones decentes`
- `Pocas chances de ir juntos`
- `Mejor momento para comprar`
- `Asientos recomendados`
- `Zona con más disponibilidad`

### Evitar

- `RBD`
- `fare bucket`
- `class inventory`
- `award inventory`
- jerga de aviation hacking en pantallas principales

Esa jerga existe en herramientas como ExpertFlyer y en su ecosistema de uso, pero no debe dominar la experiencia principal del MVP si el posicionamiento es más generalista y orientado a decisión. [cite:71][cite:77]

## Estados del sistema

### Loading

- Skeleton del mapa.
- KPIs con shimmer.
- Mensaje breve: “Analizando disponibilidad visible…”

### Sin datos

- Mensaje claro: “No fue posible obtener el mapa de asientos para este vuelo en este momento”.
- CTA: “Intentar nuevamente”.
- Explicación secundaria: “Algunas aerolíneas o flujos pueden limitar la visualización del mapa”.

### Low confidence

- Banner visible: “Resultado con confianza baja”.
- Motivo: mapa parcial, estados ambiguos o visibilidad limitada.
- CTA secundario: “Crear alerta y volver a revisar”.

## Componentes esenciales del design system

### Cards

- KPI Card
- Recommendation Card
- Alert Card
- History Card

### Gráficos

- Mini trend sparkline.
- Barra de distribución por tipo de asiento.
- Indicador radial opcional para fullness.

### Elementos interactivos

- Seat tooltip / bottom sheet.
- Filtros por cabina.
- Toggle de capas del mapa.
- Botón guardar vuelo.
- Botón crear alerta.

## Métricas visuales del MVP

El dashboard principal debe soportar estos cálculos y visualizaciones:

- `estimatedLoadPct`
- `seatVisibilityRatio`
- `seatOpportunityScore`
- `seatsTogetherProbability`
- `windowAvailabilityRatio`
- `aisleAvailabilityRatio`
- `buyNowSignal`
- `confidence`

## Especificación funcional por bloque

| Bloque | Debe mostrar | Prioridad MVP |
|---|---|---|
| Header | vuelo, fecha, ruta, cabina, update | Alta |
| Hero | fullness + recomendación principal | Alta |
| KPI row | 4 o 5 indicadores | Alta |
| Seat map | estados y capas básicas | Alta |
| Recomendaciones | mejores asientos y acción sugerida | Alta |
| Historial | snapshots anteriores del vuelo | Media |
| Alertas | crear alerta simple | Media |
| Watchlist | guardar vuelo | Media |

## MVP visual mínimo viable

La primera versión usable del dashboard debe incluir, como mínimo:

- Hero con estado del vuelo.
- Tres KPIs: fullness, asientos juntos, buy now signal.
- Seat map con estados: disponible, ocupado aparente, bloqueado y premium.
- Panel de mejores asientos.
- Botón de alerta.
- Historial básico del mismo vuelo por usuario.

Eso ya permitiría una propuesta mucho más potente comercialmente que un simple score numérico, y a la vez más interpretativa que una herramienta puramente técnica tipo ExpertFlyer. ExpertFlyer valida el valor del mapa y de las alertas; AeroLOPA valida la fuerza de una visualización de cabina bien resuelta. [cite:55][cite:75][cite:61]

## Copy de landing vinculado al dashboard

El dashboard debería respaldar promesas comerciales como:

- “No te mostramos solo asientos: te decimos si todavía tienes buenas opciones.”
- “Compra con contexto: qué tan lleno va el vuelo y dónde aún vale la pena sentarse.”
- “La forma más simple de saber si conviene comprar hoy.”

Estas promesas son coherentes con el hueco entre herramientas generalistas de precio y herramientas expertas de disponibilidad/alertas. Google Flights cubre best fares; ExpertFlyer cubre seat maps y alerts; el MVP puede posicionarse en la capa intermedia de interpretación y decisión. [cite:76][cite:84][cite:55][cite:75]
