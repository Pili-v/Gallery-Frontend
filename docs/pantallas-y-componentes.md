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
| `/panel/obras` | `PanelObras.jsx` | `GET /api/artistas/me/obras` · `/api/estilos` · `/api/obras/{id}` · `/api/variantes?obraId=` |
| `/panel/obras/nueva` | `ObraForm.jsx` | `GET /api/estilos` · `/api/tamanios-lienzo` · `POST /api/obras` · `POST /api/variantes` |
| `/panel/obras/:id/editar` | `ObraForm.jsx` | `GET /api/obras/{id}` · `/api/variantes?obraId=` · `PUT /api/obras/{id}` · `POST`, `PUT` y `DELETE` de `/api/variantes` · `DELETE /api/obras/{id}` |
| `/panel/ventas` | `Ventas.jsx` | `GET /api/artistas/me/facturas` · `/api/items-factura/factura/{id}` · `/api/compras/{id}` · `/api/variantes/{id}` · `/api/obras/{id}` · `/api/marcos/{id}` |
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
| `Confirmacion` | ventana para confirmar una acción, con el estilo de la página (usa `<dialog>`). Sin `onCancelar` es un aviso sin salida |
| `SesionVencida` | cartel "Tu sesión venció" que ya está en `Layout`: no hay que llamarlo |
| `VisorImagenes` | imagen principal, miniaturas, flechas y ampliación (detalle de obra) |
| `EstadoEncargo` | sello con el estado de un encargo |
| `FilaObra` | fila de Mis obras (se abre para ver las variantes) |
| `DetalleObra` | las variantes de una obra, dentro de Mis obras |
| `DetalleVenta` | las obras vendidas de una factura, dentro de Mis ventas |
| `TarjetaVariante` | una variante de la obra (tamaño, precio, stock y descuento) en el formulario de publicar y editar |
| `SelectorEstilos` | los estilos como botones que se prenden y apagan |

`Header`, `Footer`, `Layout`, `RutaProtegida` y `SesionVencida` ya están puestos: no hay que llamarlos.

## Cómo se trae data

Siempre igual. El token lo mete solo `cliente.js`.

```jsx
import { useEffect, useState } from "react";
import { api, lista } from "../api/cliente";
import { getUsuario } from "../api/sesion"

import Estado from "../components/Estado";

export default function Catalogo() {
    const usuario = getUsuario()        // usuario.id y usuario.rol_usuario
  const [obras, setObras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/obras")
      .then((respuesta) => setObras(lista(respuesta)))
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

## Listas vacías, errores y sesión

- **Lista vacía = 204 sin cuerpo.** `api.get` devuelve `null` y `lista(null)` es `[]`: siempre pasá las listas por `lista()` y mostrá el estado vacío de la pantalla. No es un error.
- **404 = algo que no existe** (una obra, un artista, un carrito). Ese sí es un error: se muestra el mensaje.
- **Los errores traen el mensaje del back** en `e.message` y el código HTTP en `e.status` (400 validación, 403 sin permiso, 409 choque con el estado actual).
- **Sesión vencida:** si el back responde 401 a un pedido con token, `cliente.js` avisa y `SesionVencida` muestra el cartel; al volver a ingresar se vuelve a la página donde estaba. La pantalla no hace nada especial.
- **Una escritura que puede repetirse** (guardar, eliminar) necesita una marca que frene el doble envío antes del siguiente render. Mirá `ObraForm`.

## Reglas

- Cada uno en su rama: `front/cuenta`, `front/catalogo`, `front/compra`, `front/artista`, `front/encargos`
- No se toca `src/components`, `src/api` ni `src/hooks` sin avisar
- Toda pantalla que pida datos contempla cargando, vacío y error
- Precios con la función `pesos()` de `src/api/formato.js`
- Las reglas de negocio las valida el back; el front solo limita rangos obvios (`min`, `max`, `required`) y muestra el mensaje que devuelva el back
- No se muestra ningún dato que el backend no tenga
