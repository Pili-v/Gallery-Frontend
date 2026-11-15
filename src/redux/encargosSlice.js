// Encargos — el recurso. Cada encargo está UNA sola vez, por su id (docs/datos-con-redux.md).
//   porId    : id -> el encargo, como lo manda el back (con los nombres, el estado y los cambios de estado posibles).
//   mensajes : id de encargo -> sus mensajes, del más viejo al más nuevo. Solo de los encargos que se abrieron.
//   lista    : la pantalla Encargos: los ids de la vista que se ve y el estado del pedido.
//   filtros  : los de la pantalla Encargos (estado y, para el administrador, artista). Se aplican sobre lo que llegó.
//   opciones : los tipos de pintura y de lienzo que se pueden pedir (los define el back): una sola vez.
// Son datos propios del usuario y cambian por lo que hace la otra parte (el artista o el cliente): se piden siempre al
// entrar. Al cerrar sesión (o entrar con otro usuario) el slice vuelve a su estado inicial.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { http } from "./http"
import { obtenerLista } from "./pedidos"
import { cambioDeUsuario } from "./sesionSlice"

// Las vistas de la pantalla Encargos y de dónde sale cada una (el back saca el usuario o el artista del token).
const RUTAS = {
    todos: "/api/encargos", // administrador
    recibidos: "/api/artistas/me/encargos", // los que le pidieron al artista
    pedidos: "/api/usuarios/me/encargos" // los que pidió el cliente
}

// arg: "todos", "recibidos" o "pedidos".
export const fetchEncargos = createAsyncThunk("encargos/fetchEncargos", async (vista) => {
    const encargos = await obtenerLista(RUTAS[vista])
    return encargos
})

// El back manda los mensajes del más nuevo al más viejo. Acá se leen de arriba hacia abajo, del más viejo al más
// nuevo (y por id si coinciden en la fecha), y los que se envían se agregan al final.
const enOrdenDeLectura = (mensajes) =>
    [...mensajes].sort((a, b) => new Date(a.fecha_creacion_mensaje) - new Date(b.fecha_creacion_mensaje) || a.id - b.id)

// arg: { id, conMensajes }. Un encargo que no existe es un 404 de verdad (sube como error). Sin mensajes, el back
// responde vacío: es una lista vacía. El administrador no ve los mensajes (son privados de los participantes).
export const fetchEncargo = createAsyncThunk("encargos/fetchEncargo", async ({ id, conMensajes }) => {
    // Los dos pedidos no dependen entre sí: van a la vez.
    const [respuesta, mensajes] = await Promise.all([
        http.get("/api/encargos/" + id),
        conMensajes ? obtenerLista("/api/encargos/" + id + "/mensajes") : null
    ])
    return { encargo: respuesta.data, mensajes }
})

// Los tipos de pintura y de lienzo (enums del back): una sola vez.
export const fetchOpcionesEncargo = createAsyncThunk(
    "encargos/fetchOpcionesEncargo",
    async () => {
        const respuesta = await http.get("/api/encargos/opciones")
        return respuesta.data
    },
    {
        condition: (_, { getState }) => {
            const { cargadas, loading } = getState().encargos.opciones
            return !cargadas && !loading
        }
    }
)

// -------------------------
// CAMBIOS: cada uno devuelve el encargo (o el mensaje) como quedó, y se aplica con esa respuesta
// -------------------------

export const crearEncargo = createAsyncThunk("encargos/crearEncargo", async (datos) => {
    const respuesta = await http.post("/api/encargos", datos)
    return respuesta.data
})

// cuerpo: { encargo_id, contenido } (ver prepararMensaje). El emisor lo saca el back de la sesión.
export const enviarMensaje = createAsyncThunk("encargos/enviarMensaje", async (cuerpo) => {
    const respuesta = await http.post("/api/mensajes", cuerpo)
    return respuesta.data
})

// arg: { id, nuevoEstado }. También sirve para cancelar (nuevoEstado: "CANCELADO").
export const cambiarEstadoEncargo = createAsyncThunk("encargos/cambiarEstadoEncargo", async ({ id, nuevoEstado }) => {
    const respuesta = await http.patch("/api/encargos/" + id + "/estado", { nuevoEstado })
    return respuesta.data
})

// El artista propone el precio.
export const definirPrecioEncargo = createAsyncThunk("encargos/definirPrecioEncargo", async ({ id, precio }) => {
    const respuesta = await http.patch("/api/encargos/" + id + "/precio", { precio_acordado: precio })
    return respuesta.data
})

// El cliente acepta el precio: el encargo queda aprobado y el precio ya no cambia.
export const aceptarPrecioEncargo = createAsyncThunk("encargos/aceptarPrecioEncargo", async (id) => {
    const respuesta = await http.post("/api/encargos/" + id + "/aceptar-precio")
    return respuesta.data
})

// El cliente paga el encargo terminado. La pantalla lleva después al detalle, que lo vuelve a pedir.
export const pagarEncargo = createAsyncThunk("encargos/pagarEncargo", async (id) => {
    await http.post("/api/encargos/" + id + "/pagar")
    return id
})

const FILTROS_INICIALES = { estado: "", busquedaArtista: "", artistaElegido: "" }

const ESTADO_INICIAL = {
    porId: {},
    mensajes: {},
    lista: { ids: [], loading: true, error: null, requestId: null },
    filtros: FILTROS_INICIALES,
    opciones: { tiposPintura: [], tiposLienzo: [], cargadas: false, loading: false, error: null }
}

const guardarEncargo = (state, action) => {
    state.porId[action.payload.id] = action.payload
}

const encargosSlice = createSlice({
    name: "encargos",
    initialState: ESTADO_INICIAL,
    reducers: {
        setFiltroEstado: (state, action) => {
            state.filtros.estado = action.payload
        },
        setBusquedaArtista: (state, action) => {
            state.filtros.busquedaArtista = action.payload
        },
        setArtistaElegido: (state, action) => {
            state.filtros.artistaElegido = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            // La lista. Si mientras tanto se cambió de vista, la respuesta vieja se descarta (requestId).
            .addCase(fetchEncargos.pending, (state, action) => {
                state.lista.loading = true
                state.lista.error = null
                state.lista.requestId = action.meta.requestId
            })
            .addCase(fetchEncargos.fulfilled, (state, action) => {
                if (state.lista.requestId !== action.meta.requestId) return
                state.lista.loading = false
                state.lista.ids = action.payload.map((encargo) => encargo.id)
                action.payload.forEach((encargo) => {
                    state.porId[encargo.id] = encargo
                })
            })
            .addCase(fetchEncargos.rejected, (state, action) => {
                if (state.lista.requestId !== action.meta.requestId) return
                state.lista.loading = false
                state.lista.ids = []
                state.lista.error = action.error.message
            })

            // Un encargo, con sus mensajes si se pidieron
            .addCase(fetchEncargo.fulfilled, (state, action) => {
                const { encargo, mensajes } = action.payload
                state.porId[encargo.id] = encargo
                if (mensajes) state.mensajes[encargo.id] = enOrdenDeLectura(mensajes)
            })

            .addCase(fetchOpcionesEncargo.pending, (state) => {
                state.opciones.loading = true
                state.opciones.error = null
            })
            .addCase(fetchOpcionesEncargo.fulfilled, (state, action) => {
                state.opciones.loading = false
                state.opciones.cargadas = true
                state.opciones.tiposPintura = action.payload.tipos_pintura
                state.opciones.tiposLienzo = action.payload.tipos_lienzo
            })
            .addCase(fetchOpcionesEncargo.rejected, (state, action) => {
                state.opciones.loading = false
                state.opciones.error = action.error.message
            })

            // Los cambios: se aplica lo que respondió el back
            .addCase(crearEncargo.fulfilled, guardarEncargo)
            .addCase(cambiarEstadoEncargo.fulfilled, guardarEncargo)
            .addCase(definirPrecioEncargo.fulfilled, guardarEncargo)
            .addCase(aceptarPrecioEncargo.fulfilled, guardarEncargo)
            .addCase(enviarMensaje.fulfilled, (state, action) => {
                const encargoId = action.meta.arg.encargo_id
                state.mensajes[encargoId] = [...(state.mensajes[encargoId] ?? []), action.payload]
            })

            // Son datos del usuario: al cerrar sesión o entrar con otro, se vuelve al estado inicial.
            .addMatcher(cambioDeUsuario, () => ESTADO_INICIAL)
    }
})

export const { setFiltroEstado, setBusquedaArtista, setArtistaElegido } = encargosSlice.actions

export default encargosSlice.reducer
