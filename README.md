# VuelaLibre · Dashboard MVP

Un asistente de decisión precompra: interpreta un mapa de asientos, muestra las opciones disponibles y explica una única recomendación para el vuelo observado.

**Estado:** MVP frontend funcional con datos simulados. No consulta aerolíneas, no reserva asientos, no predice tarifas y no envía notificaciones. Watchlist, alertas y preferencias se guardan exclusivamente en el navegador actual.

## Ejecutar

Requiere Node.js **22.12 o superior** y npm.

```bash
npm ci
npm run dev
```

Abrir la URL que imprime Vite (por defecto http://localhost:5173). No se necesitan claves ni variables de entorno.

```bash
npm test                         # pruebas de cálculos y persistencia
npm run build                    # genera dist/
npm run preview                  # sirve el build localmente
npx playwright install chromium  # primera ejecución de pruebas de navegador
npm run test:e2e                 # flujos desktop y móvil
npm run check                    # pruebas + build + navegador
```

En Linux sin dependencias de navegador: `npx playwright install --with-deps chromium`. La integración continua ejecuta la misma comprobación en cada push y PR.

## Qué incluye

| Área            | Comportamiento implementado                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Header          | Iberia IB539, MAD → LIS, fecha, salida, avión ilustrativo, snapshot fechado; selector Economy/Business; fijo en desktop y compacto en móvil |
| Decisión        | Estado aparente y una sola señal: Compra hoy / Puedes esperar / Vigilar; explicación y advertencias de interpretación                       |
| Indicadores     | Ocupación, oportunidad, pares y triples, indicador de contigüidad, ventana/pasillo y señal operacional; deltas contra snapshot anterior     |
| Mapa            | Disponible, ocupado aparente, bloqueado, premium, desconocido y contorno recomendado; leyenda específica por capa                           |
| Capas           | Disponibilidad, calidad, parejas/grupos, precio simulado y recomendados; zoom y desplazamiento horizontal                                   |
| Detalle         | Hover con descripción nativa; click, tap o teclado abre diálogo accesible con estado, tipo, precio y motivo                                 |
| Estructura      | Galley, baños, mampara, salidas, alas, límites de cabina y notas de ruido/reclinación; representación ilustrativa                           |
| Recomendaciones | Mejor individual, ventana, pasillo, calidad/precio, pareja y bloque de tres; enlaces al detalle                                             |
| Historial       | Tres snapshots por cabina, tabla de evolución y minigráficos; datos de usuario invitado simulados                                           |
| Watchlist       | Guardar/quitar vuelo con persistencia local                                                                                                 |
| Alertas         | Cuatro condiciones de la spec, deduplicación por cabina y condición, eliminación y persistencia; sin ejecución automática                   |
| Perfil          | Preferencia de asiento local; no se conecta a una cuenta ni cambia el ranking general                                                       |
| Estados         | Skeleton, mapa vacío, fallo recuperable y confianza baja; selector de escenarios para revisión                                              |
| Responsive      | Desktop con mapa 67% / recomendaciones 33%; tablet con KPIs a dos columnas; móvil con KPIs apilados, tabs y CTA inferior                    |

## Recorrido de revisión

1. En Dashboard, revisar el contexto y la recomendación del ejemplo Economy.
2. Pulsar **6A** y abrir su detalle; recorrer las cinco capas.
3. Cambiar a **Business**: se recalculan mapa, indicadores, recomendación e historial.
4. Usar **Escenario demo** para revisar confianza baja, sin datos y error. Reintentar restablece el escenario normal.
5. Guardar el vuelo, abrir Watchlist y recargar: permanece guardado.
6. Crear una alerta, comprobar que un duplicado se rechaza y eliminarla desde Alertas.
7. A 390 px, alternar Mapa / Recomendaciones / Historial y explorar el mapa con desplazamiento horizontal.
8. Recorrer la interfaz con Tab y abrir/cerrar detalles con Enter/Escape; se restaura el foco.

## Vista previa

[Escritorio](Docs/previews/dashboard-desktop.png) · [Móvil](Docs/previews/dashboard-mobile.png)

## Arquitectura y estructura

Vite y módulos JavaScript ESM; HTML semántico, CSS con tokens y componentes de presentación sin dependencias en ejecución. Es una SPA estática pequeña: evita añadir infraestructura de servidor antes de definir proveedor y autenticación.

```text
.spec/                           Brief y especificación de entrada
src/
  main.js                        Estado, navegación, eventos y composición
  components/
    ui.js                        Cards, badges, botones, iconos y sparklines
    dashboard.js                 Hero, KPIs, recomendaciones, historial
    seat-map.js                  Mapa, capas y leyendas
  domain/analysis.js             Cálculos y recomendaciones puros
  data/demo.js                   Contrato de carga y fixtures deterministas
  data/storage.js                Persistencia versionada y validada
  styles/tokens.css              Tokens del design system
  styles/app.css                 Layout, estados y responsive
public/favicon.svg               Marca vectorial propia
Docs/architecture/               Arquitectura, contrato y cobertura
Docs/design-system.md            Reglas visuales y componentes
Docs/aprendizajes/                Bitácora del trabajo
tests/                          Unitarias y recorridos de navegador
.github/workflows/ci.yml          Validación automática
```

Detalles en [arquitectura](Docs/architecture/dashboard.md), [design system](Docs/design-system.md) y [bitácora](Docs/aprendizajes/vuelalibredashboard-codex.md). La fuente de requisitos es [.spec/ui-ux-dashboard-mvp.md](.spec/ui-ux-dashboard-mvp.md). Las marcas `[cite:…]` pertenecen al documento original; no son referencias verificadas de esta implementación.

## Interpretación de métricas

Todas las métricas se calculan sobre la **cabina seleccionada**:

- `estimatedLoadPct`: ocupados aparentes / (ocupados + disponibles, incluidos premium). Bloqueados y desconocidos se excluyen; sin denominador, devuelve `null`.
- `seatVisibilityRatio`: estados conocidos / total. No equivale a fiabilidad sobre ventas.
- `seatOpportunityScore`: suma de calidad normalizada de disponibles / total × 100.
- `seatsTogetherProbability`: proporción de asientos disponibles que pertenecen a algún par contiguo. Por honestidad se muestra como **indicador de contigüidad**, no como probabilidad estadística. Los pares pueden solaparse: un triple genera dos pares, no dos parejas independientes.
- `windowAvailabilityRatio` y `aisleAvailabilityRatio`: disponibles por preferencia / total de esa preferencia.
- `confidence`: baja si visibilidad <85%, fracción interpretable <65% o cabina vacía. Es una regla ilustrativa.
- `buyNowSignal`: Vigilar con confianza baja; Compra hoy si ocupación ≥70% y buenos asientos disponibles ≤15% del total; Puedes esperar en otro caso. “Buenos” significa calidad ≥75/100. No hay predicción de precio ni garantía de disponibilidad.

La calidad por zona, los precios, horarios y la geometría son ilustrativos. No deben utilizarse para decisiones reales.

## Accesibilidad y persistencia

Idioma español, landmarks, enlace para saltar al contenido, controles nativos, foco visible, diálogos con foco atrapado por el navegador, cierre con Escape y restauración del foco. Cada asiento tiene nombre accesible; símbolos, texto y patrones complementan los colores. Se respeta `prefers-reduced-motion`. El historial incluye tabla textual; los minigráficos tienen nombre accesible.

La clave `vuelalibre:v1` contiene watchlist, reglas de alerta y preferencia. No almacena credenciales ni datos personales. Un fallo de escritura informa que los cambios durarán solo la sesión. Borrar los datos del sitio elimina esta configuración. No existe identidad compartida ni aislamiento multiusuario en esta demo.

## Siguiente paso hacia producción

1. Proveedor autorizado que entregue estados normalizados, mapa certificado, moneda, fecha real, procedencia y confianza.
2. Backend autenticado con snapshots por usuario y vuelo; sustituir `loadFlight` y el repositorio local, sin cambiar los cálculos puros.
3. Servicio de evaluación de alertas, cola, notificaciones y consentimiento explícito; idempotencia por evento.
4. Calibración de scores y contigüidad con datos observados; no presentar una heurística como probabilidad.
5. Auditoría de accesibilidad con tecnologías asistivas, métricas de producto y pruebas con usuarios.

## Publicación

`dist/` es desplegable en cualquier hosting estático. No contiene secretos. La navegación usa hashes para soportar enlaces directos sin reglas especiales del servidor. La tarea entrega código y PR; no despliega un servicio ni incorpora un proveedor de datos.
