// Obras — el recurso. Cada obra que llegó del back está UNA sola vez, por su id: es la única fuente de verdad sobre
// ella en toda la aplicación (docs/datos-con-redux.md).
//   porId     : id -> la obra, como la manda el back: sus datos, sus estilos, sus variantes y sus imágenes en orden
//               (la primera es la portada; ver portadaDe en fotos.js).
//   version   : cambia con cada cambio propio que deja viejo lo que se muestra de las obras (publicar, editar o
//               eliminar una obra, sus variantes o sus fotos, o confirmar una compra, que baja el stock).
//   versionDe : id -> la version con la que llegó esa obra.
//
// Regla de negocio: el catálogo (las listas públicas y el detalle de una obra) se pide una vez y se reutiliza; los
// cambios de otros usuarios se ven al recargar. Lo que se usa para comprar (el carrito) se pide siempre. Una obra
// guardada sirve mientras su versionDe sea la version actual: después de un cambio propio se vuelve a pedir.
//
// Las listas (Catálogo, Perfil del artista, relacionadas, Mis obras, Artistas) guardan solo los ids de lo que
// muestran; las obras que traen se guardan acá. El detalle y el editor piden su obra con fetchObra y la leen de acá.
//
// Las operaciones sobre una obra también viven acá, como en la Demo Redux II: cada cambio es un thunk (POST, PUT o
// DELETE) y, cuando el back responde, la obra se actualiza con lo que devolvió. Como cada obra está una sola vez, el
// cambio se ve en todas las pantallas. El estado de cada pedido ("guardando", el error) es de la pantalla que lo hace
// y queda en su useState: lo lee del resultado del dispatch.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { http } from "./http"
import { ordenarFotos } from "./fotos"
import { fetchCatalogo } from "./catalogoSlice"
import { fetchObrasDeArtista } from "./obrasDeArtistaSlice"
import { fetchRelacionadas } from "./obrasRelacionadasSlice"
import { fetchResumenArtistas } from "./artistasSlice"
import { fetchMisObras } from "./misObrasSlice"
import { confirmarCompra } from "./carritoSlice"

// -------------------------
// UNA OBRA (detalle y editor)
// -------------------------

// Si la obra está guardada y ningún cambio propio la dejó vieja (ver version), no hace falta pedirla.
const estaAlDia = (obras, id) => Boolean(obras.porId[id]) && obras.versionDe[id] === obras.version

// arg: { id, siempre }. El detalle reutiliza la obra si ya está guardada (por ejemplo, porque vino en una tarjeta del
// catálogo, que trae la obra completa): el thunk ni se ejecuta (condition). El editor pasa siempre: true, porque guardar
// una variante manda también su stock y con uno viejo se pisarían las ventas. Una obra que no existe es un 404 de
// verdad (sube como error).
export const fetchObra = createAsyncThunk(
    "obras/fetchObra",
    async ({ id }) => {
        const respuesta = await http.get("/api/obras/" + id)
        return respuesta.data
    },
    {
        condition: ({ id, siempre = false }, { getState }) => siempre || !estaAlDia(getState().obras, id)
    }
)

// -------------------------
// LA OBRA: CREAR, ACTUALIZAR Y ELIMINAR
// -------------------------

export const crearObra = createAsyncThunk("obras/crearObra", async (datos) => {
    const respuesta = await http.post("/api/obras", datos)
    return respuesta.data
})

export const actualizarObra = createAsyncThunk("obras/actualizarObra", async ({ id, datos }) => {
    const respuesta = await http.put("/api/obras/" + id, datos)
    return respuesta.data
})

// El back la marca como eliminada: deja de verse en todos lados.
export const eliminarObra = createAsyncThunk("obras/eliminarObra", async (id) => {
    await http.delete("/api/obras/" + id)
    return id
})

// -------------------------
// VARIANTES (tamaño, precio, stock y descuento): CREAR, ACTUALIZAR Y ELIMINAR
// -------------------------

export const crearVariante = createAsyncThunk("obras/crearVariante", async (datos) => {
    const respuesta = await http.post("/api/variantes", datos)
    return respuesta.data
})

export const actualizarVariante = createAsyncThunk("obras/actualizarVariante", async ({ id, datos }) => {
    const respuesta = await http.put("/api/variantes/" + id, datos)
    return respuesta.data
})

// arg: { id, obraId }. El back no devuelve la variante borrada: obraId dice de qué obra quitarla.
export const eliminarVariante = createAsyncThunk("obras/eliminarVariante", async ({ id }) => {
    await http.delete("/api/variantes/" + id)
    return id
})

// -------------------------
// FOTOS: SE GUARDA LA GALERÍA COMPLETA, TODO O NADA
// -------------------------

// fotos: la galería como la dejó el artista, en orden: [{ id (null si es nueva), archivo (el nuevo, si se agregó o se
// reemplazó) }]. Viaja en un solo pedido multipart y el back la aplica en una transacción: si algo falla, no cambia
// nada. Devuelve la galería como quedó.
export const guardarGaleria = createAsyncThunk("obras/guardarGaleria", async ({ obraId, fotos }) => {
    const formulario = new FormData()
    let nuevas = 0
    fotos.forEach((foto) => {
        if (foto.id === null) {
            formulario.append("orden", "nueva-" + nuevas)
            formulario.append("nuevas", foto.archivo)
            nuevas = nuevas + 1
        } else {
            formulario.append("orden", foto.id)
            if (foto.archivo) {
                formulario.append("reemplazoIds", foto.id)
                formulario.append("reemplazos", foto.archivo)
            }
        }
    })
    // Sin fotos se manda un orden vacío: la galería queda vacía.
    if (fotos.length === 0) formulario.append("orden", "")

    const respuesta = await http.put("/api/imagenes/galeria/" + obraId, formulario)
    return respuesta.data
})

// Lo que llega de una lista (o de un pedido de obra) reemplaza lo guardado de esas obras.
const guardarObras = (state, obras) => {
    obras.forEach((obra) => {
        state.porId[obra.id] = obra
        state.versionDe[obra.id] = state.version
    })
}

// Un cambio propio: lo que se muestra de las obras (listas, detalles) se vuelve a pedir la próxima vez.
const cambiarVersion = (state) => {
    state.version = state.version + 1
}

const cambiarVariantes = (state, obraId, cambio) => {
    const obra = state.porId[obraId]
    if (obra) obra.variantes = cambio(obra.variantes)
}

const obrasSlice = createSlice({
    name: "obras",
    initialState: {
        porId: {},
        version: 0,
        versionDe: {}
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Las listas: cada una guarda sus ids; las obras quedan acá
            .addCase(fetchCatalogo.fulfilled, (state, action) => guardarObras(state, action.payload.items))
            .addCase(fetchObrasDeArtista.fulfilled, (state, action) => guardarObras(state, action.payload.items))
            .addCase(fetchRelacionadas.fulfilled, (state, action) => guardarObras(state, action.payload.obras))
            .addCase(fetchResumenArtistas.fulfilled, (state, action) => guardarObras(state, action.payload.obras))
            .addCase(fetchMisObras.fulfilled, (state, action) => guardarObras(state, action.payload.items))

            // Una obra
            .addCase(fetchObra.fulfilled, (state, action) => guardarObras(state, [action.payload]))

            // Los cambios: se aplica lo que respondió el back
            // (cada uno cambia la version: las listas y los detalles se vuelven a pedir al mostrarse)
            .addCase(crearObra.fulfilled, (state, action) => {
                cambiarVersion(state)
                guardarObras(state, [action.payload])
            })
            .addCase(actualizarObra.fulfilled, (state, action) => {
                cambiarVersion(state)
                guardarObras(state, [action.payload])
            })
            .addCase(eliminarObra.fulfilled, (state, action) => {
                cambiarVersion(state)
                delete state.porId[action.payload]
            })
            .addCase(crearVariante.fulfilled, (state, action) => {
                cambiarVersion(state)
                cambiarVariantes(state, action.payload.obra_id, (variantes) => [...variantes, action.payload])
            })
            .addCase(actualizarVariante.fulfilled, (state, action) => {
                cambiarVersion(state)
                cambiarVariantes(state, action.payload.obra_id, (variantes) =>
                    variantes.map((variante) => (variante.id === action.payload.id ? action.payload : variante))
                )
            })
            .addCase(eliminarVariante.fulfilled, (state, action) => {
                cambiarVersion(state)
                cambiarVariantes(state, action.meta.arg.obraId, (variantes) =>
                    variantes.filter((variante) => variante.id !== action.payload)
                )
            })
            // La galería que devolvió el back reemplaza la anterior (la primera foto es la portada).
            .addCase(guardarGaleria.fulfilled, (state, action) => {
                cambiarVersion(state)
                const obra = state.porId[action.meta.arg.obraId]
                if (obra) obra.imagenes = ordenarFotos(action.payload)
            })
            // Una compra baja el stock de lo que se compró.
            .addCase(confirmarCompra.fulfilled, cambiarVersion)
    }
})

export default obrasSlice.reducer
