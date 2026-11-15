# Cómo se piden y se guardan los datos (Redux)

Toda la aplicación usa Redux Toolkit con axios. Ningún componente llama a la API: cada pedido es un thunk
(`createAsyncThunk`) en `src/redux/`, y las pantallas solo despachan acciones y leen el estado con `useSelector`.

Este documento fija **un solo criterio para toda la aplicación**:

- **El store es la única fuente de verdad.** Cada dato está una sola vez: si estuviera repetido, las copias podrían
  no coincidir y cada cambio habría que aplicarlo en varios lugares.
- **Regla de negocio: el catálogo puede estar desactualizado; el carrito no.** El catálogo es lo que más se consulta
  y un dato viejo ahí no hace daño: se pide una vez y se reutiliza, y lo que cambien otros usuarios se ve al recargar.
  Donde se decide la compra (el carrito) el precio y el stock se piden siempre, y el back los vuelve a validar al
  confirmar. Lo propio del usuario (sus obras, sus compras, sus ventas) también se pide siempre.
- **En el store va lo que es de la aplicación; lo que es de una sola pantalla queda en `useState`.**

## Cómo se organiza el store: por recurso

Los slices se organizan por **recurso** (obras, compras, artistas…), no por pantalla:

| Slice | Qué guarda |
| --- | --- |
| `obras` | Cada obra una vez, por id, como la manda el back: datos, estilos, portada y variantes. Y la galería completa de las que se abrieron. Todas las operaciones sobre obras (crear, editar, borrar, variantes, fotos). |
| `catalogo`, `obrasDeArtista`, `obrasRelacionadas`, `misObras` | Las listas de obras: **solo los ids** de lo que se ve, la página, los filtros y el estado del pedido. |
| `compras` | Cada compra una vez, por id, sus facturas y la lista de Mis compras (ids y filtros). |
| `estilos`, `marcos`, `tamanios`, `artistas` | Datos de referencia. |
| `carrito`, `misVentas`, `usuarios`, `metricas`, `sesion` | Lo suyo. |

Una pantalla de lista lee los ids de su slice y busca cada obra en `obras`. El detalle y el editor piden su obra con
`fetchObra` y la leen de `obras`. Un cambio hecho en el editor se aplica en `obras` y se ve igual en todas las
pantallas, sin copias que sincronizar.

El back ayuda: cada obra viaja con sus variantes y su portada, así una página de obras es un solo pedido (y en el back,
una cantidad fija de consultas, sin importar cuántas obras haya).

## Las reglas

1. **Datos de referencia: una vez al iniciar.** Estilos, marcos, tamaños de lienzo y la lista de artistas se piden
   una sola vez y los comparten todas las pantallas. Si el administrador los cambia, el store se actualiza con la
   respuesta.

2. **El catálogo se pide una vez y se reutiliza.** Catálogo, Perfil del artista, obras relacionadas, el resumen de
   Artistas y el detalle de una obra:
   - Cambiar de página, de filtro o de orden pide esa página (la paginación y los filtros los resuelve el back). No se
     guardan búsquedas anteriores.
   - Volver a la pantalla con la misma búsqueda no pide nada.
   - El detalle de una obra usa lo que ya está guardado: si la obra llegó en una tarjeta, pide solo su galería; si ya
     se abrió, no pide nada.
   - Un cambio propio (publicar, editar o eliminar una obra, sus variantes o sus fotos, o confirmar una compra) deja
     viejo lo guardado: `obras.version` cambia y todo se vuelve a pedir la próxima vez que se muestre.

3. **Lo que se usa para comprar y lo propio se pide siempre al entrar**: el carrito (y al volver a su pestaña), el
   editor de obra (guardar una variante manda también su stock: con uno viejo se pisarían las ventas), Mis obras,
   Mis compras, Mis ventas. Mientras llega se muestra "cargando". Lo que llega reemplaza lo guardado, así que también
   deja al día esas obras en el catálogo.

4. **Cada dato, una sola vez, en el slice de su recurso.** Las listas guardan ids. Ningún slice guarda una copia de
   lo que ya está en otro.

5. **Los cambios propios actualizan el store con la respuesta** (POST, PUT, DELETE), como en la Demo Redux II: se
   agrega, se reemplaza por id o se quita, sin volver a pedir.

6. **Lo que es de una sola pantalla queda en `useState`**: lo que se está escribiendo, los borradores de un
   formulario, si un pedido terminó, "guardando…" y el error de un botón (se leen del resultado del `dispatch`), qué
   fila está abierta. Por eso el editor de obra y el detalle no tienen slice propio.

7. **Si el back avisa que un dato estaba viejo, se muestra el error y se vuelve a pedir.** Por ejemplo, "stock
   insuficiente" al comprar o una obra que ya no existe.

8. **Los filtros y la página de cada lista viven en el store.** Al ir a otra pantalla y volver (con "atrás" o
   desde el menú), la lista está en la misma página con los mismos filtros. Se quitan solo con "Quitar filtros".

9. **Al cerrar sesión o entrar con otro usuario se borran los datos propios** (sus obras, ventas, compras, carrito,
   lo de administración): esos slices escuchan `cambioDeUsuario` (en `sesionSlice.js`) y vuelven a su estado inicial.
   Lo público queda.

## Lo que se descartó

- **Un slice por pantalla**, cada uno con su copia de las obras: la misma obra quedaba guardada hasta seis veces.
- **Pedir el catálogo cada vez que se entra**: más pedidos al back en lo que más se usa, para mostrar al instante
  cambios de otros que no hacen falta hasta el carrito.
- **Guardar resultados de búsquedas anteriores**: repetir exactamente la misma búsqueda es raro y obliga a decidir
  cuándo vencen.
- **Llevar al store el estado de un formulario**: es lo mismo que un `useState`, pero más complicado.
- **RTK Query**: no se vio en la materia.

## Convenciones de código

- Los thunks que piden datos (GET) se llaman `fetch…`; los que cambian datos, `crear…`, `actualizar…`, `eliminar…`.
- `async`/`await` solo dentro del thunk y sin `try`/`catch`: los errores quedan en `action.error.message`.
- `useEffect(() => { dispatch(…) }, [dispatch, …])` en las pantallas. Si la pantalla necesita saber cómo terminó un
  pedido: `dispatch(thunk(…)).then((resultado) => …)`; con error, `resultado.error.message`.
