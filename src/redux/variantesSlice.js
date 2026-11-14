// Variantes y portadas ya pedidas — por obra, para no volver a pedirlas cada vez que se vuelve a ver una obra
// (otra página del catálogo, el perfil de un artista, las obras relacionadas).
//
// Se guarda la LISTA completa de variantes de cada obra, no la que se muestra: cuál se muestra depende del filtro
// de precio y de la fecha (el descuento vence), y eso se calcula al usar la lista (varianteParaMostrar en api/precio.js).
//
// Este slice no pide nada: guarda lo que traen los pedidos de las pantallas (action.payload.nuevas).
// Lo guardado dura hasta que se recarga la página o se vacía (ver cache.js).

import { createSlice, isAnyOf } from "@reduxjs/toolkit"
import { invalidarCacheObras } from "./cache"
import { cargarObras } from "./obrasSlice"
import { cargarObrasDeArtista } from "./obrasDeArtistaSlice"
import { cargarRelacionadas } from "./obrasRelacionadasSlice"
import { actualizarTamanio, eliminarTamanio } from "./tamaniosSlice"
import { confirmarCompra } from "./carritoSlice"

// nuevas: { [obraId]: { variantes, portada } }
const guardar = (state, action) => {
    Object.assign(state.porObra, action.payload.nuevas)
}

const variantesSlice = createSlice({
    name: "variantes",
    initialState: { porObra: {} },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(cargarObras.fulfilled, guardar)
            .addCase(cargarObrasDeArtista.fulfilled, guardar)
            .addCase(cargarRelacionadas.fulfilled, guardar)
            .addMatcher(
                isAnyOf(invalidarCacheObras, actualizarTamanio.fulfilled, eliminarTamanio.fulfilled, confirmarCompra.fulfilled),
                (state) => {
                    state.porObra = {}
                }
            )
    }
})

export default variantesSlice.reducer
