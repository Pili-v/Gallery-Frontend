// El store de Redux: junta los slices. La clave de cada uno es el nombre con el que se lee en los componentes
// (useSelector((state) => state.estilos)).

import { configureStore } from "@reduxjs/toolkit"
import estilosReducer from "./estilosSlice"
import marcosReducer from "./marcosSlice"
import artistasReducer from "./artistasSlice"
import obrasReducer from "./obrasSlice"
import obrasDeArtistaReducer from "./obrasDeArtistaSlice"
import obraDetalleReducer from "./obraDetalleSlice"
import obrasRelacionadasReducer from "./obrasRelacionadasSlice"

export const store = configureStore({
    reducer: {
        estilos: estilosReducer,
        marcos: marcosReducer,
        artistas: artistasReducer,
        obras: obrasReducer,
        obrasDeArtista: obrasDeArtistaReducer,
        obraDetalle: obraDetalleReducer,
        obrasRelacionadas: obrasRelacionadasReducer
    }
})
