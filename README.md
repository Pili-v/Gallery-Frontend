# Atelier Attack — Frontend

Galería online de obras originales: el público recorre el catálogo, los clientes compran y piden encargos, los artistas
publican y gestionan sus obras y ventas, y el administrador consulta usuarios, métricas y catálogos.
TPO de Aplicaciones Interactivas (UADE), grupo 11. El backend está en
[Gallery-Backend](https://github.com/JoaquinIgnacioCampos/Gallery-Backend).

**Stack:** React 19, Vite, React Router, Redux Toolkit y axios.

## Cómo correrlo

Necesita Node 20.19 o superior (o 22.12+) y el backend corriendo en `http://localhost:8080` (la dirección está en `src/redux/http.js`).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # versión de producción
npm run lint
```

## Cómo está organizado

- `src/views/`: una pantalla por ruta (catálogo, detalle de obra, carrito, encargos, panel del artista, administración…).
- `src/components/`: piezas reutilizables (tarjetas, formularios, filtros, estados de carga y error).
- `src/redux/`: el estado y todos los pedidos al backend. Ninguna pantalla llama a la API: cada pedido es un thunk.
- `src/api/`: funciones puras (precios, formatos, filtros) y la sesión guardada en el navegador.
- `src/atelier.css`: estilos globales del sistema visual.

## Datos y Redux

El criterio completo está en [`docs/datos-con-redux.md`](docs/datos-con-redux.md). En resumen:

- El store está organizado por recurso (obras, compras, encargos…): cada dato está una sola vez y las listas guardan ids.
- El catálogo se pide una vez y se reutiliza; puede quedar desactualizado. El carrito y lo propio del usuario
  (sus obras, ventas, compras y encargos) se piden siempre al entrar, y el backend valida precio y stock al comprar.
- Los filtros y la página de cada lista se conservan al ir a otra pantalla y volver.
- Al cerrar sesión se borran los datos propios del usuario.

[`docs/pantallas-y-componentes.md`](docs/pantallas-y-componentes.md) describe las pantallas y sus componentes.

## Roles

Visitante (catálogo, artistas y detalle), `CLIENTE` (compra y encargos), `ARTISTA` / `ARTISTA_CLIENTE` (además publica
obras y ve sus ventas) y `ADMIN` (consulta). Un cliente puede crear su perfil de artista desde "¿Querés publicar?".
