import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import RutaProtegida from "./components/RutaProtegida"

import Catalogo from "./views/Catalogo"
import DetalleObra from "./views/DetalleObra"
import PerfilArtista from "./views/PerfilArtista"
import Login from "./views/Login"
import Registro from "./views/Registro"
import MiCuenta from "./views/MiCuenta"
import Carrito from "./views/Carrito"
import ConfirmarCompra from "./views/ConfirmarCompra"
import Pago from "./views/Pago"
import CompraConfirmada from "./views/CompraConfirmada"
import MisCompras from "./views/MisCompras"
import PanelObras from "./views/PanelObras"
import ObraForm from "./views/ObraForm"
import Ventas from "./views/Ventas"
import Encargos from "./views/Encargos"
import EncargoNuevo from "./views/EncargoNuevo"
import EncargoDetalle from "./views/EncargoDetalle"
import AdminUsuarios from "./views/AdminUsuarios"
import AdminCatalogos from "./views/AdminCatalogos"
import SinPermiso from "./views/SinPermiso"
import NoEncontrada from "./views/NoEncontrada"

// Quiénes pueden entrar a cada grupo de pantallas.
const COMPRA = ["CLIENTE", "ARTISTA_CLIENTE", "ADMIN"]
const ARTISTA = ["ARTISTA", "ARTISTA_CLIENTE", "ADMIN"]
const ADMIN = ["ADMIN"]

// Cada ruta es una URL. React Router cambia de pantalla sin recargar la página.
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>

          {/* Se puede mirar sin estar logueado */}
          <Route path="/" element={<Catalogo />} />
          <Route path="/obra/:id" element={<DetalleObra />} />
          <Route path="/artista/:id" element={<PerfilArtista />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Hay que estar logueado, sin importar el rol */}
          <Route path="/mi-cuenta" element={<RutaProtegida><MiCuenta /></RutaProtegida>} />
          <Route path="/mis-compras" element={<RutaProtegida><MisCompras /></RutaProtegida>} />
          <Route path="/encargos" element={<RutaProtegida><Encargos /></RutaProtegida>} />
          <Route path="/encargos/:id" element={<RutaProtegida><EncargoDetalle /></RutaProtegida>} />

          {/* Comprar */}
          <Route path="/carrito" element={<RutaProtegida roles={COMPRA}><Carrito /></RutaProtegida>} />
          <Route path="/checkout" element={<RutaProtegida roles={COMPRA}><ConfirmarCompra /></RutaProtegida>} />
          <Route path="/checkout/pago" element={<RutaProtegida roles={COMPRA}><Pago /></RutaProtegida>} />
          <Route path="/compra/:id" element={<RutaProtegida roles={COMPRA}><CompraConfirmada /></RutaProtegida>} />
          <Route path="/encargos/nuevo" element={<RutaProtegida roles={COMPRA}><EncargoNuevo /></RutaProtegida>} />

          {/* Vender */}
          <Route path="/panel/obras" element={<RutaProtegida roles={ARTISTA}><PanelObras /></RutaProtegida>} />
          <Route path="/panel/obras/nueva" element={<RutaProtegida roles={ARTISTA}><ObraForm /></RutaProtegida>} />
          <Route path="/panel/obras/:id/editar" element={<RutaProtegida roles={ARTISTA}><ObraForm /></RutaProtegida>} />
          <Route path="/panel/ventas" element={<RutaProtegida roles={ARTISTA}><Ventas /></RutaProtegida>} />

          {/* Administrar */}
          <Route path="/admin/usuarios" element={<RutaProtegida roles={ADMIN}><AdminUsuarios /></RutaProtegida>} />
          <Route path="/admin/catalogos" element={<RutaProtegida roles={ADMIN}><AdminCatalogos /></RutaProtegida>} />

          {/* Transversales */}
          <Route path="/403" element={<SinPermiso />} />
          <Route path="*" element={<NoEncontrada />} />

        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
