# Aclaración del producto: disponibilidad Air Europa para staff

La usuaria quiere conocer cuántas plazas libres se reportan para cada vuelo Air Europa en una fecha y cómo va cambiando esa cifra entre días/consultas. Con ese historial toma ella la decisión de comprar o no un billete staff. No se requiere prioridad de embarque, mapa de asientos, recomendación de compra ni probabilidad numérica en esta etapa.

El sistema debe buscar por ruta y fecha, mostrar vuelos y último recuento con momento y origen del dato, y conservar snapshots por vuelo. Debe distinguir cifras reales de ejemplos y evitar presentar disponibilidad comercial, mapa de selección o capacidad instalada como plazas libres para staff.

No se proporcionaron credenciales ni acceso a fuentes de cargas. La búsqueda de conexiones no encontró un endpoint público verificable de Air Europa que entregue el recuento requerido. Por tanto, el piloto muestra ejemplos explícitos y permite registrar observaciones manuales para validar el flujo de seguimiento. Conectar una fuente autorizada será requisito para ofrecer datos reales automáticos.

Esta aclaración sustituye el propósito precompra comercial de `.spec/ui-ux-dashboard-mvp.md`. Ese documento queda como antecedente histórico.

## Ampliación posterior: radar de probabilidad indirecta

La persona aceptó una estimación en lugar del total exacto de plazas libres. Para el piloto UX se puede usar inventario comercial vendible por clase, evolución diaria, cotización de grupos de tamaño X+1 y precio relativo de vuelos comparables para mostrar **indicios de que haya más de X plazas**. La pantalla debe distinguir claramente inventario vendible de plazas físicas/staff y mostrar cuándo se obtuvo la observación. La media simple de precios según día de la semana no prueba ocupación. Un porcentaje de probabilidad de plazas al cierre solo se publicará si se calibra contra cargas reales; mientras tanto el producto mostrará una señal cualitativa. Leer `Docs/architecture/radar-probabilidad.md` para el método y sus límites.
