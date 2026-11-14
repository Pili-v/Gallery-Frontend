// Cache de obras: lo que ya se pidió (variantes, portadas y detalle de cada obra) se guarda en el store y no se
// vuelve a pedir mientras la página siga abierta. Al recargar la página (F5) el store arranca vacío y se pide todo
// de nuevo: ese es el único "vencimiento".
//
// Mientras la página sigue abierta, el cache se vacía cuando el propio usuario cambia algo que lo deja viejo:
// variantesSlice y obraDetalleSlice responden a esta acción y además a estos eventos (ver sus extraReducers):
//   - se actualiza o se elimina un tamaño (las variantes guardan el nombre del tamaño),
//   - se confirma una compra (baja el stock).
// Para otros cambios (crear, editar o borrar una obra o una variante) quien los haga debe despachar:
// dispatch(invalidarCacheObras())

import { createAction } from "@reduxjs/toolkit"

export const invalidarCacheObras = createAction("cache/invalidarCacheObras")
