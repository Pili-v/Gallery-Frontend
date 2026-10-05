# Atelier Attack — Frontend

Guía para trabajar. El backend tiene que estar corriendo en `http://localhost:8080`.

## Arrancar

```
npm install
npm run dev
```

Abrís `http://localhost:5173`. Las maquetas de todas las pantallas están en **`docs/maquetas.html`**: doble clic y navegás con el menú de la izquierda.

## Las carpetas

| Carpeta | Qué hay | ¿Se toca? |
|---|---|---|
| `src/views` | Un archivo por pantalla | **Sí**, cada uno en los suyos |
| `src/components` | Las piezas que se repiten | **No** sin avisar al grupo |
| `src/api` | Lo único que habla con el backend | **No** sin avisar al grupo |
| `src/api/sesion.js` | Quién está logueado y su rol | **No** sin avisar al grupo |

## Las pantallas

| URL | Archivo | Endpoints que usa |
|---|---|---|
| `/` | `Catalogo.jsx` | `GET /api/obras` · `/api/estilos` · `/api/variantes` · `/api/imagenes` |
| `/obra/:id` | `DetalleObra.jsx` | `GET /api/obras/{id}` · `/api/variantes?obraId=` · `/api/marcos` · `POST /api/items-carrito` |
| `/artista/:id` | `PerfilArtista.jsx` | `GET /api/artistas/{id}` · `/api/artistas/{id}/obras` |
| `/login` | `Login.jsx` | `POST /api/v1/auth/authenticate` |
| `/registro` | `Registro.jsx` | `POST /api/usuarios` |
| `/mi-cuenta` | `MiCuenta.jsx` | `GET /api/usuarios/me` · `PATCH /api/usuarios/{id}` |
| `/carrito` | `Carrito.jsx` | `GET /api/usuarios/{id}/carrito` · `/api/carritos/{id}/items` · `PUT` y `DELETE /api/items-carrito/{id}` |
| `/checkout` | `ConfirmarCompra.jsx` | `PUT /api/carritos/{id}` |
| `/checkout/pago` | `Pago.jsx` | `POST /api/checkout` |
| `/compra/:id` | `CompraConfirmada.jsx` | `GET /api/compras/{id}` · `/api/compras/{id}/facturas` |
| `/mis-compras` | `MisCompras.jsx` | `GET /api/usuarios/{id}/compras` |
| `/panel/obras` | `PanelObras.jsx` | `GET /api/artistas/{id}/obras` · `DELETE /api/obras/{id}` |
| `/panel/obras/nueva` | `ObraForm.jsx` | `POST /api/obras` · `/api/variantes` · `/api/imagenes` |
| `/panel/obras/:id/editar` | `ObraForm.jsx` | `PUT /api/obras/{id}` · `PATCH /api/variantes/{id}/stock` |
| `/panel/ventas` | `Ventas.jsx` | `GET /api/artistas/{id}/facturas` |
| `/encargos` | `Encargos.jsx` | `GET /api/encargos/usuario/{id}` · `/api/encargos/artista/{id}` |
| `/encargos/nuevo` | `EncargoNuevo.jsx` | `GET /api/artistas` · `/api/tamanios-lienzo` · `POST /api/encargos` |
| `/encargos/:id` | `EncargoDetalle.jsx` | `GET /api/encargos/{id}` · `/api/encargos/{id}/mensajes` · `POST /api/mensajes` · `PATCH /api/encargos/{id}/estado` |
| `/admin/usuarios` | `AdminUsuarios.jsx` | `GET /api/usuarios` · `PATCH /api/usuarios/{id}/rol?rol=` |
| `/admin/catalogos` | `AdminCatalogos.jsx` | `GET` y `POST` de estilos, tamaños y marcos |

`ObraForm.jsx` sirve para publicar **y** para editar: si la URL trae un id, carga los datos y hace `PUT`; si no, va vacío y hace `POST`.

## Los componentes

Ya están hechos en `src/components`. Se importan y se usan.

| Componente | Qué es |
|---|---|
| `Boton` | primario, secundario o deshabilitado |
| `Estado` | cargando, vacío, error y sin permiso |
| `CampoFormulario` | etiqueta + input + mensaje de error |
| `FichaObra` | la ficha: número, obra, vendedor, medidas, precio y stock |
| `TarjetaObra` | imagen + sello + ficha, clickeable |
| `Badge` | sello de descuento o sin stock |
| `LineaItem` | fila de compra. Con `editable` muestra el contador |
| `ResumenTotales` | subtotal, descuentos, marcos y total |

`Header`, `Footer`, `Layout` y `RutaProtegida` ya están puestos: no hay que llamarlos.

## Cómo se trae data

Siempre igual. El token lo mete solo `cliente.js`.

```jsx
import { useEffect, useState } from "react";
import { api } from "../api/cliente";
import { getUsuario } from "../api/sesion"

import Estado from "../componentes/Estado";

export default function Catalogo() {
    const usuario = getUsuario()        // usuario.id y usuario.rol_usuario
  const [obras, setObras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/obras")
      .then(setObras)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Estado tipo="cargando" />;
  if (error)    return <Estado tipo="error" mensaje={error} />;
  if (obras.length === 0) return <Estado tipo="vacio" mensaje="Todavía no hay obras." />;

  return (
    <div className="seccion">
      <div className="contenido">
        {/* acá va la pantalla */}
      </div>
    </div>
  );
}
```

## Reglas

- Cada uno en su rama: `front/cuenta`, `front/catalogo`, `front/compra`, `front/artista`, `front/encargos`
- No se toca `src/components`, `src/api` ni `src/hooks` sin avisar
- Toda pantalla que pida datos contempla cargando, vacío y error
- Precios con la función `pesos()` de `src/api/formato.js`
- No se muestra ningún dato que el backend no tenga
