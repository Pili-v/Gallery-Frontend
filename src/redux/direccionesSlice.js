// Direcciones — lo que se pide a Georef, la API de direcciones del Estado argentino (apis.datos.gob.ar): es pública,
// gratuita y no pide clave. No pasa por http.js a propósito: esa instancia apunta a nuestro backend y le agrega el
// token a cada pedido, y Georef es un tercero que no tiene por qué recibir nuestras credenciales.
//   provincias : las 24 provincias, una sola vez (datos de referencia). Salen de la misma API que después valida la
//                dirección, así no hay una lista escrita a mano que se pueda desactualizar.
//   Las sugerencias del autocompletado son de la pantalla que las muestra: buscarDirecciones las devuelve y no se
//   guardan en el store.

import axios from "axios"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { textoDeDireccion } from "../api/direcciones"

const georef = axios.create({ baseURL: "https://apis.datos.gob.ar/georef/api" })

// Si Georef no responde, quedan sin provincias y la búsqueda sigue andando a nivel país.
export const fetchProvincias = createAsyncThunk(
    "direcciones/fetchProvincias",
    async () => {
        const respuesta = await georef.get("/provincias?campos=nombre&max=30")
        return respuesta.data.provincias ?? []
    },
    {
        condition: (_, { getState }) => {
            const { cargadas, loading } = getState().direcciones
            return !cargadas && !loading
        }
    }
)

// Busca direcciones. Con provincia acota a esa; sin provincia, todo el país. Georef devuelve la misma calle una vez
// por tramo: se deja una sola. Si falla, la pantalla se queda sin sugerencias.
export const buscarDirecciones = createAsyncThunk("direcciones/buscarDirecciones", async ({ calle, provincia }) => {
    const respuesta = await georef.get(
        "/direcciones?max=8&direccion=" +
            encodeURIComponent(calle) +
            (provincia ? "&provincia=" + encodeURIComponent(provincia) : "")
    )
    const encontradas = respuesta.data.direcciones ?? []
    const textos = encontradas.map(textoDeDireccion)
    return encontradas.filter((sugerida, indice) => textos.indexOf(textos[indice]) === indice)
})

const direccionesSlice = createSlice({
    name: "direcciones",
    initialState: { provincias: [], cargadas: false, loading: false },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProvincias.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchProvincias.fulfilled, (state, action) => {
                state.loading = false
                state.cargadas = true
                state.provincias = action.payload
            })
            .addCase(fetchProvincias.rejected, (state) => {
                state.loading = false
            })
    }
})

export default direccionesSlice.reducer
