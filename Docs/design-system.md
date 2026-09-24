# Design system · disponibilidad staff

La jerarquía gira en torno a una cifra: plazas libres reportadas. El título, tarjetas y gráfico emplean fondo claro, marca verde profunda y acentos suaves. La interfaz identifica siempre si el dato es **ejemplo** o **manual**.

Fuente de tokens: `src/styles/tokens.css`. Marca `#173e34`, fondo `#f6f7f4`, tinta `#1c352e`, oportunidad visual `#2e7550`, foco `#176da1`. Espaciado de 8–32 px y radios de 9–21 px.

## Componentes

- Formulario de ruta y fecha, con campos nativos y validación básica.
- Resumen de la cifra más alta observada en la búsqueda, sin recomendar compra.
- Tarjeta de vuelo: número, hora, origen del dato, plazas actuales, diferencia desde la consulta anterior y timestamp.
- Historial: gráfico de barras con el último valor por día y tabla de todas las consultas.
- Diálogo de registro: nuevo vuelo o nuevo recuento del vuelo manual seleccionado.
- Estado vacío que explica la falta de fuente automática.

Desktop: tarjetas de tres columnas, historial en dos paneles. Tablet: dos columnas. Móvil: cards apiladas y gráfico/tabla debajo; sin desbordamiento de la página. Foco visible y `prefers-reduced-motion` respetado. El gráfico tiene tabla equivalente y los controles tienen texto accesible.
