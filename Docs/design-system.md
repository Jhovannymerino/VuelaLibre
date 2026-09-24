# Design system básico

## Identidad

Interfaz tranquila, editorial y orientada a decisión: fondo marfil verdoso, navegación lateral clara, hero de contexto y superficies blancas. Marca vectorial sencilla, sin imágenes externas ni fuentes que requieran red. Tipografía de sistema con Inter si está instalada.

## Tokens

Fuente de verdad: `src/styles/tokens.css`.

| Uso                   | Token / valor                                   |
| --------------------- | ----------------------------------------------- |
| Fondo / superficie    | `--color-bg` #f6f7f4 / `--color-surface` #fff   |
| Texto / secundario    | `--color-ink` #20342d / `--color-muted` #69746d |
| Marca / CTA           | `--color-brand` #173e31                         |
| Acento                | `--color-accent` #d9edac                        |
| Oportunidad           | `--color-good` #276444                          |
| Vigilar               | `--color-watch` #85530e                         |
| Urgencia              | `--color-urgent` #a44c35                        |
| Información / premium | `--color-info` #315c91                          |
| Foco                  | `--color-focus` #236eae                         |
| Espaciado             | 4, 8, 12, 16, 24, 32, 48 px                     |
| Radios                | 8 / 14 / 20 px                                  |

Jerarquía: título de decisión 30–42 px, títulos de sección 17–23 px, texto general 12–14 px. Etiquetas compactas en mayúsculas para información secundaria. Las etiquetas del mapa son deliberadamente densas: ampliar está disponible en la misma sección.

## Componentes

| Componente          | Contrato / estados                                                             |
| ------------------- | ------------------------------------------------------------------------------ |
| Button              | Primario, secundario, icono; foco visible y acción concreta                    |
| Badge               | Neutral, good, watch, urgent, info, demo; texto siempre explícito              |
| KPI Card            | Título, valor, interpretación, cambio o nota, sparkline opcional               |
| Recommendation Card | Categoría, asiento, motivo y detalle                                           |
| Alert Card          | Condición, vuelo/cabina, estado local y eliminación                            |
| History Card        | Tabla accesible y tendencias de ocupación/oportunidad                          |
| Seat                | Estado operativo, label, símbolo, selección, contorno recomendado              |
| Seat detail         | Diálogo nativo; bottom sheet en móvil; cierre con Escape                       |
| Layer switch        | Grupo de botones con selección anunciada por `aria-pressed`                    |
| System state        | Skeleton con reducción de movimiento, vacío con reintento, banner de confianza |

Premium usa relleno azul; recomendado usa contorno y estrella. Ocupado incluye ×; bloqueado usa rayas; desconocido, borde discontinuo y ?. Calidad usa símbolos adicionales. La leyenda cambia con la capa; los colores operativos se atenúan cuando domina otra información.

## Responsive

- ≥1024 px: navegación lateral, header contextual sticky, KPIs horizontales, mapa y panel 67/33 aproximadamente.
- 701–1023 px: rail de navegación, KPIs a dos columnas, mapa y panel apilados.
- ≤700 px: navegación compacta, contexto en dos líneas, KPIs apilados, tabs Mapa/Recomendaciones/Historial, CTA inferior y detalle como bottom sheet.
- El mapa y la tabla pueden desplazarse dentro de sus contenedores; la página no debe desbordar horizontalmente.

## Accesibilidad

Semántica nativa antes de ARIA, nombres completos para asientos, iconos decorativos ocultos, landmarks, tabla equivalente para datos, estado anunciado, foco visible y retorno al disparador al cerrar el detalle. La paleta semántica se acompaña de texto. Validación automatizada complementada con recorridos de teclado; no equivale a certificación WCAG ni a auditoría completa con lector de pantalla.
