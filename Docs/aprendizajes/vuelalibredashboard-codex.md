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

## Radar estimado sin carga exacta

El usuario aceptó indicadores probabilísticos en vez de una cifra exacta. Se diseñó un radar que combina cupo vendible, prueba de cotización de X+1 pasajeros, precio comparable y serie diaria. El precio semanal bruto se descartó como predictor suficiente porque intervienen la antelación y la estrategia de tarifas. Se implementó una función de dominio para evaluar la señal comercial sin sumar clases ni inventar porcentajes. La [propuesta y plan de validación](../architecture/radar-probabilidad.md) explican cómo recoger datos de Amadeus con claves propias de la aplicación y qué muestra haría falta para calibrar una probabilidad real de plazas al cierre.

## Iteración 2026-09-25: funcionamiento sin cuentas de pago

La investigación confirmó que no existe una fuente pública, estable y sin autenticación que devuelva plazas staff de Air Europa. Air Europa bloquea consultas automatizadas de su web; las páginas públicas de 2LNR permiten leer horarios y la disponibilidad de premio exige cuenta; los agregadores de cargas requieren cuenta o créditos. Amadeus puede entregar inventario comercial por clase, pero su producción exige alta, método de pago y facturación por encima de la cuota gratuita.

El MVP adopta por ello una frontera explícita:

- sin credenciales, el backend usa `public-2lnr-schedule` para listar vuelos UX programados y conserva el enlace a la fuente;
- esos vuelos llevan `availabilityKnown: false`, señal `unknown`, sin “0 plazas” ni probabilidad inventada;
- con Amadeus configurado, se activa el radar de cupo vendible y su histórico local, siempre etiquetado como señal comercial indirecta;
- la UI distingue “horario público, sin cupos” de una señal comercial y explica qué debe verificar el staff antes de comprar.

La decisión permite que la app sea útil y demostrable sin cuenta de pago, a la vez que deja un adaptador claro para una fuente autorizada de cargas reales cuando exista.
