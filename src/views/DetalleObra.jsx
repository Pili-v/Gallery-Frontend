// Detalle de obra — Área 3 · Catálogo
// Trae la obra de la API con sus variantes, sus imagenes y su artista.
// El precio se arma con dos decisiones, el tamaño y el marco, y por eso
// se muestra desglosado: la obra sola, cuanto suma el marco, y el total.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import { getUsuario } from "../api/sesion";
import { pesos } from "../api/formato";
import Badge from "../components/Badge";
import Estado from "../components/Estado";
import Boton from "../components/Boton";
import VisorImagenes from "../components/VisorImagenes";

// Una lista vacía llega como 404 (regla de la cátedra): para las listas de la obra
// (variantes, imagenes, marcos) significa "no hay", no que algo falló. Si no se
// tratara así, una obra sin imagenes o sin variantes no se podría abrir.
const sin404 = (promesa) =>
  promesa.catch((e) => {
    if (e.status === 404) return [];
    throw e;
  });

export default function DetalleObra() {
  // El id viene de la URL: /obra/5 -> id = "5"
  const { id } = useParams();
  const navegar = useNavigate();

  const [obra, setObra] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [artista, setArtista] = useState(null);
  const [marcos, setMarcos] = useState([]);

  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
  const [marcoSeleccionado, setMarcoSeleccionado] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      const laObra = await api.get("/api/obras/" + id);
      const susVariantes = lista(await sin404(api.get("/api/variantes?obraId=" + id)));
      const susImagenes = lista(await sin404(api.get("/api/imagenes?obraId=" + id)));
      const suArtista = await api.get("/api/artistas/" + laObra.artista_id);
      const losMarcos = lista(await sin404(api.get("/api/marcos")));

      setObra(laObra);
      setVariantes(susVariantes);
      setImagenes(susImagenes);
      setArtista(suArtista);
      setMarcos(losMarcos);

      // Arranca con el primer tamaño y el primer marco elegidos.
      setVarianteSeleccionada(susVariantes[0] ?? null);
      setMarcoSeleccionado(losMarcos[0] ?? null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  // Depende del id: si se navega a otra obra, se vuelve a pedir.
  useEffect(() => {
    setCargando(true);
    setError("");
    cargar();
  }, [id]);

  // Agregar al carrito es lo unico que escribe. Si no hay sesion, al login:
  // el carrito es de alguien, y ese alguien sale del token.
  const agregarAlCarrito = async () => {
    if (!getUsuario()) return navegar("/login");
    if (!varianteSeleccionada || !marcoSeleccionado) return;

    setAgregando(true);
    setError("");
    try {
      // El carrito propio: el id sale del token, no hace falta pasar el usuario.
      const miCarrito = await api.get("/api/carritos/me");

      await api.post("/api/items-carrito", {
        carrito_id: miCarrito.id,
        variante_id: varianteSeleccionada.id,
        marco_id: marcoSeleccionado.id,
        cantidad: 1
      });

      navegar("/carrito");
    } catch (e) {
      setError(e.message);
      setAgregando(false);
    }
  };

  if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>;
  if (error && !obra) return <div className="seccion"><div className="contenido"><Estado tipo="error" mensaje={error} /></div></div>;

  // El precio se arma con el tamaño y el marco. El descuento es de la variante.
  const precio = varianteSeleccionada?.precio_variante ?? 0;
  const descuento = varianteSeleccionada?.porcentaje_descuento ?? 0;
  const precioObra = descuento ? precio * (1 - descuento / 100) : precio;
  const precioMarco = marcoSeleccionado ? Number(marcoSeleccionado.precio_marco) : 0;
  const precioFinal = precioObra + precioMarco;
  const sinStock = varianteSeleccionada?.stock_variante === 0;

  // Sin tamaños o sin marcos no se puede armar la compra: el botón lo dice en vez de quedar mudo.
  const sinVariantes = !varianteSeleccionada;
  const sinMarcos = !marcoSeleccionado;
  const noDisponible = sinStock || sinVariantes || sinMarcos;

  let textoBoton = "AGREGAR AL CARRITO";
  if (sinStock) textoBoton = "SIN STOCK";
  else if (sinVariantes) textoBoton = "SIN TAMAÑOS";
  else if (sinMarcos) textoBoton = "SIN MARCOS";
  else if (agregando) textoBoton = "AGREGANDO...";

  // Todas las imágenes de la obra, en el orden en que las cargó el artista. Si el backend
  // pasa a mandar links (Cloudinary), "url" tiene prioridad y esta es la única línea que cambia.
  const fotos = imagenes.map((img) => img.url ?? "data:image/jpeg;base64," + img.contenido_imagen);

  return (
    <div className="seccion pagina-detalle-obra">
      <div className="contenido dos-columnas">

        <div className="detalle-visual">
          <VisorImagenes key={obra.id} imagenes={fotos} alt={obra.nombre_obra} atenuada={sinStock}>
            {sinStock && <Badge tipo="sinstock">Sin stock</Badge>}
            {!sinStock && descuento > 0 && <Badge tipo="descuento">−{descuento}%</Badge>}
          </VisorImagenes>
        </div>

        <div className="detalle-info apilado">
          <div>
            <span className="catalog-number cartela-num">Nº {String(obra.id).padStart(3, "0")}</span>
            <h1 className="headline-lg" style={{ marginTop: "var(--xs)" }}>{obra.nombre_obra}</h1>

            <Link to={"/artista/" + obra.artista_id} className="vendedor" style={{ marginTop: "var(--sm)", textDecoration: "none" }}>
              <span className="avatar">{(artista?.nombre_artistico ?? "A")[0]}</span>
              <span className="cartela-artist">{artista?.nombre_artistico ?? "Artista"}</span>
            </Link>
          </div>

          <p className="body-lg muted">{obra.descripcion_obra}</p>

          {/* Tamaños: cada variante es un tamaño con su propio precio y su stock */}
          {variantes.length > 0 && (
            <div>
              <span className="cartela-meta" style={{ display: "block", marginBottom: "var(--xs)" }}>TAMAÑO</span>
              <div className="fila" style={{ flexWrap: "wrap" }}>
                {variantes.map((v) => (
                  <button
                    key={v.id}
                    className={"chip " + (varianteSeleccionada?.id === v.id ? "activo" : "")}
                    onClick={() => setVarianteSeleccionada(v)}
                  >
                    {v.nombre_tamanio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Marcos: el marco cambia el precio final, por eso va antes del total */}
          {marcos.length > 0 && (
            <div>
              <span className="cartela-meta" style={{ display: "block", marginBottom: "var(--xs)" }}>MARCO</span>
              <div className="fila" style={{ flexWrap: "wrap" }}>
                {marcos.map((m) => (
                  <button
                    key={m.id}
                    className={"chip " + (marcoSeleccionado?.id === m.id ? "activo" : "")}
                    onClick={() => setMarcoSeleccionado(m)}
                  >
                    {m.nombre_marco} · {pesos(m.precio_marco)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* El desglose que pidió la cátedra: la obra, el marco y el total */}
          <div className="resumen">
            <div className="resumen-fila">
              <span>La obra</span>
              <span>
                {descuento > 0 && <span className="precio-tachado">{pesos(precio)}</span>}
                {pesos(precioObra)}
              </span>
            </div>
            <div className="resumen-fila">
              <span>Marco {marcoSeleccionado?.nombre_marco}</span>
              <span>{pesos(precioMarco)}</span>
            </div>
            <div className="resumen-fila resumen-total">
              <span className="price-lg">{pesos(precioFinal)}</span>
              <span className="cartela-meta">
                {sinVariantes ? "" : sinStock ? "Sin stock" : varianteSeleccionada.stock_variante + " disponibles"}
              </span>
            </div>

            {error && <div className="campo-error body-sm" style={{ marginTop: "var(--sm)" }}>{error}</div>}

            <div style={{ marginTop: "var(--md)" }}>
              <Boton
                tipo={noDisponible ? "deshabilitado" : "primario"}
                bloque
                onClick={noDisponible || agregando ? undefined : agregarAlCarrito}
              >
                {textoBoton}
              </Boton>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}