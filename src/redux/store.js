// El store de Redux: junta los slices. La clave de cada uno es el nombre con el que se lee en los componentes
// (useSelector((state) => state.estilos)).

import sesionReducer from "./sesionSlice"
import usuariosReducer from "./usuariosSlice"
import { configureStore } from "@reduxjs/toolkit"
import estilosReducer from "./estilosSlice"
import marcosReducer from "./marcosSlice"
import tamaniosReducer from "./tamaniosSlice"
import metricasReducer from "./metricasSlice"
import artistasReducer from "./artistasSlice"
import obrasReducer from "./obrasSlice"
import obrasDeArtistaReducer from "./obrasDeArtistaSlice"
import obrasRelacionadasReducer from "./obrasRelacionadasSlice"
import comprasReducer from "./comprasSlice"
import carritoReducer from "./carritoSlice"
import misObrasReducer from "./misObrasSlice"
import misVentasReducer from "./misVentasSlice"
import catalogoReducer from "./catalogoSlice"

export const store = configureStore({
    reducer: {
        sesion: sesionReducer,
        usuarios: usuariosReducer,
        estilos: estilosReducer,
        marcos: marcosReducer,
        tamanios: tamaniosReducer,
        artistas: artistasReducer,
        metricas: metricasReducer,
        obras: obrasReducer, // cada obra una sola vez (las listas guardan sus ids)
        obrasDeArtista: obrasDeArtistaReducer,
        obrasRelacionadas: obrasRelacionadasReducer,
        compras: comprasReducer,
        carrito: carritoReducer,
        misObras: misObrasReducer,
        misVentas: misVentasReducer,
        catalogo: catalogoReducer
    }
})
