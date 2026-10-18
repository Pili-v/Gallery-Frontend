// Detalle de obra — Área 3 · Catálogo
// Trae la obra con sus variantes, imágenes, artista y marcos. Sin async/await.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import { getUsuario } from "../api/sesion";
import { pesos } from "../api/formato";
import Badge from "../components/Badge";
import Estado from "../components/Estado";
import Boton from "../components/Boton";
import VisorImagenes from "../components/Visorimagenes";

// Una lista vacía llega como 204 (lista() la deja en []) y, antes, como 404 (regla de la cátedra):
// para listas de apoyo significa "no hay".
const sin404 = (promesa) =>
  promesa.catch((e) => {
    if (e.status === 404) return [];
    throw e;
  });

export default function DetalleObra() {
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

  // Depende del id: si se navega a otra obra, se vuelve a pedir.
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");

    api
      .get("/api/obras/" + id)
      .then((laObra) =>
        Promise.all([
          sin404(api.get("/api/variantes?obraId=" + id)),
          sin404(api.get("/api/imagenes?obraId=" + id)),
          api.get("/api/artistas/" + laObra.artista_id),
          sin404(api.get("/api/marcos"))
        ]).then(([susVariantes, susImagenes, suArtista, losMarcos]) => {
          if (!vigente) return;
          const vars = lista(susVariantes);
          const mars = lista(losMarcos);
          setObra(laObra);
          setVariantes(vars);
          setImagenes(lista(susImagenes));
          setArtista(suArtista);
          setMarcos(mars);
          setVarianteSeleccionada(vars[0] ?? null);
          setMarcoSeleccionado(mars[0] ?? null);
        })
      )
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [id]);

  // Agregar al carrito es lo único que escribe. Sin sesión, al login.
  const agregarAlCarrito = () => {
    if (!getUsuario()) {
      navegar("/login");
      return;
    }
    if (!varianteSeleccionada || !marcoSeleccionado) return;

    setAgregando(true);
    setError("");

    api
      .get("/api/carritos/me")
      .then((miCarrito) =>
        api.post("/api/items-carrito", {
          carrito_id: miCarrito.id,
          variante_id: varianteSeleccionada.id,
          marco_id: marcoSeleccionado.id,
          cantidad: 1
        })
      )
      .then(() => navegar("/carrito"))
      .catch((e) => {
        setError(e.message);
        setAgregando(false);
      });
  };

  if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>;
  if (error && !obra) return <div className="seccion"><div className="contenido"><Estado tipo="error" mensaje={error} /></div></div>;

  const precio = varianteSeleccionada?.precio_variante ?? 0;
  const descuento = varianteSeleccionada?.porcentaje_descuento ?? 0;
  const precioObra = descuento ? precio * (1 - descuento / 100) : precio;
  const precioMarco = marcoSeleccionado ? Number(marcoSeleccionado.precio_marco) : 0;
  const precioFinal = precioObra + precioMarco;
  const sinStock = varianteSeleccionada?.stock_variante === 0;

  const sinVariantes = !varianteSeleccionada;
  const sinMarcos = !marcoSeleccionado;
  const noDisponible = sinStock || sinVariantes || sinMarcos;

  let textoBoton = "AGREGAR AL CARRITO";
  if (sinStock) textoBoton = "SIN STOCK";
  else if (sinVariantes) textoBoton = "SIN TAMAÑOS";
  else if (sinMarcos) textoBoton = "SIN MARCOS";
  else if (agregando) textoBoton = "AGREGANDO...";

  // Las URLs de Cloudinary, en el orden que las cargó el artista.
  const fotos = [...imagenes]
    .filter((img) => img.url)
    .sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0))
    .map((img) => img.url);

  return (
    <div className="seccion pagina-detalle-obra">
      <div className="contenido dos-columnas">

        <div className="detalle-visual">
          <VisorImagenes key={obra.id} imagenes={fotos} alt={obra.nombre_obra} atenuada={sinStock} marco={marcoSeleccionado}>
            {sinStock && <Badge tipo="sinstock">Sin stock</Badge>}
            {!sinStock && descuento > 0 && <Badge tipo="descuento">−{descuento}%</Badge>}
          </VisorImagenes>
        </div>

        <div className="detalle-info apilado">
          <div>
            <h1 className="headline-lg" style={{ marginTop: "var(--xs)" }}>{obra.nombre_obra}</h1>

            <Link to={"/artista/" + obra.artista_id} className="vendedor" style={{ marginTop: "var(--sm)", textDecoration: "none" }}>
              <span className="avatar">{(artista?.nombre_artistico ?? "A")[0]}</span>
              <span className="cartela-artist">{artista?.nombre_artistico ?? "Artista"}</span>
            </Link>
          </div>

          <p className="body-lg muted">{obra.descripcion_obra}</p>

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