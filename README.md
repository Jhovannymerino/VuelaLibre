# VuelaLibre · Piloto de disponibilidad Air Europa

La aplicación ahora responde a la pregunta real del viajero staff: **¿cuántas plazas libres se han reportado para un vuelo de Air Europa en una fecha y cómo ha cambiado ese número entre consultas?** La persona decide si compra su billete con ese contexto.

**Estado del producto:** interfaz y seguimiento funcional con ejemplos ilustrativos y registros manuales. **Todavía no hay conexión a plazas reales de Air Europa.** La ruta MAD → PMI del 15 de octubre de 2026 incluye tres vuelos ficticios y cuatro observaciones por vuelo para revisar el diseño. Cualquier otra búsqueda empieza sin cifras. No se presentan los ejemplos como vuelos programados ni como cargas reales.

## Ejecutar

Requiere Node.js 22.12+.

```bash
npm ci
npm run dev
```

Abrir la URL que indique Vite. La búsqueda filtra por origen, destino y fecha. Cada tarjeta muestra la cifra más reciente, cambio desde la consulta anterior, fecha de observación y enlace a un historial con evolución diaria. Se pueden registrar vuelos y nuevos recuentos en el navegador; al volver, se conservan. La demo no consulta datos en segundo plano.

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run check
```

## Fuentes investigadas

- [StaffTraveler](https://stafftraveler.com/en) publica cargas específicas para viajes staff y tiene [actualizaciones periódicas de solicitudes](https://blog.stafftraveler.com/stafftraveler/introducing-auto-updates/) dentro de su producto. No se encontró una API pública documentada para alimentarlo automáticamente desde este repositorio. Es la vía más cercana para una futura colaboración/licencia de datos.
- [Air Europa Direct NDC](https://direct2.aireuropa.com/es/es/b2b/home.html) ofrece API para agencias, con registro. Su objetivo es la venta; no publica un recuento de plazas disponibles para staff.
- [Amadeus Flight Availabilities](https://www.postman.com/amadeus4dev/amadeus-for-developers-s-public-workspace/request/o5uji5m/flight-availabilities-search) indica plazas **a la venta** por clase tarifaria. No son plazas libres físicas ni elegibilidad staff. Su [FAQ](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/) explica también las limitaciones del inventario y de los mapas.
- [OAG Seats Data](https://www.oag.com/flight-data-seats) informa capacidad instalada/predicha del avión; capacidad no equivale a plazas vacías de un vuelo concreto.

No hay una conexión de vuelos instalada en este entorno que entregue el recuento requerido. Para automatizar el piloto hace falta un acuerdo/API que devuelva **número de vuelo, fecha, ruta, plazas libres reales y fecha de observación**. El adaptador `loadFlights` queda preparado para sustituirse una vez se disponga de esa fuente. No se usan datos de inventario comercial como si fueran plazas staff.

## Arquitectura

```text
src/domain/availability.js  Validación, último snapshot, delta y resumen diario
src/data/demo.js            Adaptador y vuelos de ejemplo
src/data/storage.js         Registros manuales locales, versión v1
src/components/ui.js        Iconos, escape HTML y formato de fechas
src/main.js                 Búsqueda, tarjetas, historial y registro
src/styles/                 Tokens, diseño y responsive
Docs/architecture/          Contrato de datos y conexión pendiente
Docs/design-system.md      Componentes y reglas visuales
Docs/aprendizajes/          Bitácora de la corrección
```

Cada snapshot `{ at, count, source }` corresponde a una observación del mismo vuelo y fecha; el gráfico diario conserva la última observación UTC de cada día. El último recuento se usa para ordenar vuelos, **sin inferir probabilidad de embarcar**. Dos vuelos con igual cifra no son necesariamente equivalentes para staff. Plazas y autorizaciones pueden cambiar hasta el cierre de embarque.

La interfaz usa HTML semántico, botones y formularios nativos, foco visible, enlace para saltar al contenido, tabla textual del historial y diseño para escritorio/móvil. Los datos introducidos se guardan en `localStorage` del navegador; no hay cuenta ni sincronización.

El brief original en `.spec/ui-ux-dashboard-mvp.md` describía un producto de compra comercial basado en mapas. La aclaración del usuario en [.spec/staff-pilot.md](.spec/staff-pilot.md) lo sustituye para este piloto.

## Vista previa

[Escritorio](Docs/previews/dashboard-desktop.png) · [Móvil](Docs/previews/dashboard-mobile.png)
