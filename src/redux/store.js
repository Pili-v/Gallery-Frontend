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
import obraDetalleReducer from "./obraDetalleSlice"
import obrasRelacionadasReducer from "./obrasRelacionadasSlice"
import comprasReducer from "./comprasSlice"
import compraDetalleReducer from "./compraDetalleSlice"
import carritoReducer from "./carritoSlice"
import misObrasReducer from "./misObrasSlice"
import misVentasReducer from "./misVentasSlice"

export const store = configureStore({
    reducer: {
        sesion: sesionReducer,
        usuarios: usuariosReducer,
        estilos: estilosReducer,
        marcos: marcosReducer,
        tamanios: tamaniosReducer,
        artistas: artistasReducer,
        metricas: metricasReducer,
        obras: obrasReducer,
        obrasDeArtista: obrasDeArtistaReducer,
        obraDetalle: obraDetalleReducer,
        obrasRelacionadas: obrasRelacionadasReducer,
        compras: comprasReducer,
        compraDetalle: compraDetalleReducer,
        carrito: carritoReducer,
        misObras: misObrasReducer,
        misVentas: misVentasReducer
        
    }
})