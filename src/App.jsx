import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProveedorAuth } from "./hooks/useAuth";
import Layout from "./componentes/Layout";
import RutaProtegida from "./componentes/RutaProtegida";

import Catalogo from "./paginas/Catalogo";
import DetalleObra from "./paginas/DetalleObra";
import PerfilArtista from "./paginas/PerfilArtista";
import Login from "./paginas/Login";
import Registro from "./paginas/Registro";
import MiCuenta from "./paginas/MiCuenta";
import Carrito from "./paginas/Carrito";
import ConfirmarCompra from "./paginas/ConfirmarCompra";
import Pago from "./paginas/Pago";
import CompraConfirmada from "./paginas/CompraConfirmada";
import MisCompras from "./paginas/MisCompras";
import PanelObras from "./paginas/PanelObras";
import ObraForm from "./paginas/ObraForm";
import Ventas from "./paginas/Ventas";
import Encargos from "./paginas/Encargos";
import EncargoNuevo from "./paginas/EncargoNuevo";
import EncargoDetalle from "./paginas/EncargoDetalle";
import AdminUsuarios from "./paginas/AdminUsuarios";
import AdminCatalogos from "./paginas/AdminCatalogos";
import SinPermiso from "./paginas/SinPermiso";
import NoEncontrada from "./paginas/NoEncontrada";

const COMPRA  = ["CLIENTE", "ARTISTA_CLIENTE", "ADMIN"];
const ARTISTA = ["ARTISTA", "ARTISTA_CLIENTE", "ADMIN"];
const ADMIN   = ["ADMIN"];

export default function App() {
  return (
    <ProveedorAuth>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>

            {/* Público: se puede mirar sin estar logueado */}
            <Route path="/"             element={<Catalogo />} />
            <Route path="/obra/:id"     element={<DetalleObra />} />
            <Route path="/artista/:id"  element={<PerfilArtista />} />
            <Route path="/login"        element={<Login />} />
            <Route path="/registro"     element={<Registro />} />

            {/* Hay que estar logueado, sin importar el rol */}
            <Route path="/mi-cuenta"   element={<RutaProtegida><MiCuenta /></RutaProtegida>} />
            <Route path="/mis-compras" element={<RutaProtegida><MisCompras /></RutaProtegida>} />
            <Route path="/encargos"    element={<RutaProtegida><Encargos /></RutaProtegida>} />
            <Route path="/encargos/:id" element={<RutaProtegida><EncargoDetalle /></RutaProtegida>} />

            {/* Comprar */}
            <Route path="/carrito"       element={<RutaProtegida roles={COMPRA}><Carrito /></RutaProtegida>} />
            <Route path="/checkout"      element={<RutaProtegida roles={COMPRA}><ConfirmarCompra /></RutaProtegida>} />
            <Route path="/checkout/pago" element={<RutaProtegida roles={COMPRA}><Pago /></RutaProtegida>} />
            <Route path="/compra/:id"    element={<RutaProtegida roles={COMPRA}><CompraConfirmada /></RutaProtegida>} />
            <Route path="/encargos/nuevo" element={<RutaProtegida roles={COMPRA}><EncargoNuevo /></RutaProtegida>} />

            {/* Vender */}
            <Route path="/panel/obras"              element={<RutaProtegida roles={ARTISTA}><PanelObras /></RutaProtegida>} />
            <Route path="/panel/obras/nueva"        element={<RutaProtegida roles={ARTISTA}><ObraForm /></RutaProtegida>} />
            <Route path="/panel/obras/:id/editar"   element={<RutaProtegida roles={ARTISTA}><ObraForm /></RutaProtegida>} />
            <Route path="/panel/ventas"             element={<RutaProtegida roles={ARTISTA}><Ventas /></RutaProtegida>} />

            {/* Administrar */}
            <Route path="/admin/usuarios"  element={<RutaProtegida roles={ADMIN}><AdminUsuarios /></RutaProtegida>} />
            <Route path="/admin/catalogos" element={<RutaProtegida roles={ADMIN}><AdminCatalogos /></RutaProtegida>} />

            {/* Transversales */}
            <Route path="/403" element={<SinPermiso />} />
            <Route path="*"    element={<NoEncontrada />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </ProveedorAuth>
  );
}
