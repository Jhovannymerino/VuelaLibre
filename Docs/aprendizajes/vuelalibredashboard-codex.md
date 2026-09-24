# Bitácora · VuelaLibre Dashboard MVP

Fecha de trabajo: 24 de septiembre de 2026. Rama: `dashboard-mvp-uiux`.

## Contexto y fuentes

El encargo pide arquitectura, MVP conforme a la especificación, estructura de repositorio, README ampliado, design system, componentes, bitácora y entrega mediante commit, push y PR.

Las rutas originales bajo `/opt/data` no estaban disponibles. Posteriormente se incorporaron `.spec/brief.md` y `.spec/ui-ux-dashboard-mvp.md`; estos son los documentos utilizados. El repositorio partía de un README mínimo y un `index.html` de comprobación. Los archivos de prueba manual `test-agent-created.txt` y `.spec/test.txt` se conservaron localmente y se excluyeron de la entrega.

## Decisiones y ejecución

1. **Definir los límites:** MVP frontend funcional con datos explícitamente simulados. No había proveedor, credenciales, API ni diseño de autenticación en el repositorio. No se inventó una integración ni una capacidad de envío de alertas.
2. **Separar responsabilidades:** componentes de presentación, análisis puro, adaptador de datos, persistencia local y coordinación de estado. Vite y módulos nativos permiten build estático sin dependencias de ejecución.
3. **Construir los seis bloques:** contexto del vuelo, hero, cinco indicadores, mapa enriquecido, recomendaciones y snapshots. Se completaron también Historial, Watchlist, Alertas y Perfil.
4. **Crear el lenguaje visual:** tonos claros, marca verde profunda, hero editorial, estados semánticos, patrones de asiento y contorno recomendado independiente de premium. Tokens documentados y variantes responsive.
5. **Implementar interacción:** dos cabinas, cinco capas, detalle de asiento, zoom, tabs móviles, guardado del vuelo, cuatro tipos de alerta, prevención de duplicados y preferencia local.
6. **Representar incertidumbre:** bloqueados y desconocidos se excluyen de ocupación; baja visibilidad produce Vigilar; el indicador de contigüidad no se presenta como probabilidad calibrada.
7. **Cubrir estados:** latencia simulada con skeleton, mapa vacío, error recuperable y baja confianza. La carga más reciente prevalece sobre respuestas anteriores.
8. **Documentar y validar:** README reproducible, arquitectura con contrato, design system, pruebas unitarias y Playwright, snapshots visuales de escritorio y móvil, CI y formato consistente.

## Hallazgos y correcciones

- Un umbral absoluto de buenos asientos no se comportaba coherentemente entre cabinas de tamaños distintos. Se sustituyó por una proporción (≤15% de la cabina) combinada con ocupación aparente ≥70%.
- La primera ejecución de navegador reutilizó un puerto ocupado por otra aplicación del entorno. Se corrigió con puerto de pruebas dedicado `43187`, `--strictPort` y sin reutilización de servidor. Así una colisión falla explícitamente.
- Un selector de prueba por texto parcial confundía 6A con 16A. Se ajustó para anclar el identificador al comienzo del nombre accesible.
- El enlace de salto al contenido debía conservar la vista actual en una SPA con navegación hash. Se añadió enfoque directo del landmark y una comprobación desde Perfil.
- Los grupos de tres generan pares solapados. Se documentó esta diferencia para no presentar cuatro pares como cuatro parejas independientes.
- La persistencia local no equivale a alertas activas. Tanto el diálogo como el listado y la documentación explican que no hay supervisión en segundo plano.

## Validación

- Cinco pruebas unitarias: grupos y pasillos, denominadores vacíos, señales y confianza, recomendaciones por preferencia y recuperación del almacenamiento.
- Ocho recorridos de navegador: cuatro escenarios en escritorio (1440 × 1000) y móvil (390 × 844), con cabinas, capas, detalle, persistencia, duplicados, borrado, estados de error, historial, perfil y teclado.
- Build estático de producción mediante Vite.
- Formato comprobado mediante Prettier y `git diff --check`.
- Revisión visual de capturas de escritorio y móvil; sin desbordamiento horizontal de la página. Los mapas y tablas conservan scroll propio.
- La validación automatizada no sustituye una auditoría integral con tecnologías asistivas ni una calibración de datos reales.

Las capturas revisadas están en `Docs/previews/`. La integración continua reproduce el comando `npm run check`.

## Entrega y límites

El conjunto se entrega en `dashboard-mvp-uiux` mediante commit y push, con PR hacia `main`. El mensaje final de entrega registra el identificador de commit y la URL del PR para evitar referencias circulares dentro del propio commit.

Quedan fuera del MVP de demostración: datos reales, mapa aeronáutico certificado, reservas, cuentas, sincronización, notificaciones y predicción de tarifas. La arquitectura identifica dónde incorporar cada integración. No se realizó despliegue de producción.
