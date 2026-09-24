# Bitácora · corrección del piloto VuelaLibre

## Hallazgo de producto

La primera entrega en `dashboard-mvp-uiux` interpretó el brief de mapas como compra comercial y mostró Iberia, calidad de asiento, posibilidad de ir juntos y señal “Compra hoy”. El usuario aclaró que viaja como staff y quiere seguir **cuántas plazas libres tiene un vuelo Air Europa para una fecha**, ver cómo varía esa cifra por días y decidir él si compra. La primera implementación no cumplía ese propósito.

## Cambios efectuados

1. Se añadió `.spec/staff-pilot.md` como aclaración y criterio vigente; el documento previo se conserva como antecedente.
2. Se retiraron mapa, calidad de asiento, recomendaciones comerciales, prioridad de embarque y pseudo probabilidades.
3. Se implementaron búsqueda por ruta/fecha, tarjetas por vuelo con último recuento y variación, historial diario y tabla de observaciones.
4. Se crearon ejemplos inequívocamente ficticios y un formulario para registrar un vuelo o actualizar su cifra; esos datos persisten en el navegador.
5. Se investigaron conexiones. StaffTraveler ofrece cargas para staff, pero no se encontró una API pública documentada. Air Europa NDC y Amadeus se refieren a inventario comercial y OAG a capacidad; ninguno se conectó como si ofreciera plazas staff reales.
6. Se documentó el contrato de una futura fuente autorizada y las limitaciones actuales. La aplicación declara explícitamente que no hay conexión en tiempo real.
7. Se reemplazaron pruebas para comprobar búsqueda por fecha, recuentos crecientes/decrecientes, valor cero, snapshots diarios, persistencia, teclado y móvil.

## Aprendizaje clave

Una cifra de plazas observada puede ayudar a la persona a tomar una decisión, pero no basta para derivar una probabilidad calibrada de embarque. La credibilidad del producto depende primero de obtener **la fuente correcta**. El diseño no debe prometer automatización ni exactitud cuando no existe una conexión verificable.

La entrega corregida se publica en la misma rama y PR. Las capturas están en `Docs/previews/`.

## Investigación adicional: procedencia de las cifras

El usuario aclaró que necesitaba saber **de dónde obtienen los datos** las aplicaciones existentes para reproducir el método. Se comprobó en documentación de cada proveedor que StaffTraveler recibe cargas introducidas por miembros con acceso a reservas, mientras que NonRevLoads y GetFlightLoads parten del inventario comercial del GDS. NonRevLoads admite expresamente que no conoce el número exacto de plazas libres ni la lista non-rev. La API oficial de Amadeus permite investigar una alternativa GDS sin credenciales de staff, pero sus valores son por clase tarifaria y están truncados en 9. Quedó documentado el plan y el contrato para separar ambas métricas en [origen-de-datos.md](../architecture/origen-de-datos.md). No se simuló una conexión ni se presentó el proxy como carga real.
