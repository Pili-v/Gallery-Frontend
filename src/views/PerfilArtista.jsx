// Perfil del artista — Área 3 · Catálogo
// El artista sale de GET /api/artistas/{id} y sus obras de GET /api/obras?artistaId=,
// que devuelve la misma forma que el catálogo y está paginado.
// Las variantes y las imágenes se piden solo de las obras de la página que se ve:
// pedir las listas completas traería las fotos de todas las obras de la base.

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import { optimizada } from "../api/formato";
import TarjetaObra from "../components/TarjetaObra";
import Estado from "../components/Estado";
import Boton from "../components/Boton";
import Paginador from "../components/Paginador";

// Una lista vacía ahora llega como 204 (cliente.js la entrega como null y lista(null) = []). Se deja este
// respaldo por si algún endpoint todavía responde 404 para "no hay"; el 404 de una obra/artista inexistente se maneja aparte.
const sin404 = (promesa) =>
  promesa.catch((e) => {
    if (e.status === 404) return [];
    throw e;
  });

const POR_PAGINA = 6;

export default function PerfilArtista() {
  const { id } = useParams();

  const [artista, setArtista] = useState(null);
  const [estilos, setEstilos] = useState([]);
  const [items, setItems] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalObras, setTotalObras] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [cargandoObras, setCargandoObras] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  // Al cambiar de artista se vuelve a la primera página
  useEffect(() => {
    setPagina(0);
  }, [id]);

  // El artista y los estilos
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");

    Promise.all([api.get("/api/artistas/" + id), sin404(api.get("/api/estilos"))])
      .then(([suArtista, susEstilos]) => {
        if (!vigente) return;
        setArtista(suArtista);
        setEstilos(lista(susEstilos));
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [id, intento]);

  // Las obras de la página visible, con sus variantes e imágenes
  useEffect(() => {
    let vigente = true;
    setCargandoObras(true);

    sin404(api.get("/api/obras?artistaId=" + id + "&page=" + pagina + "&size=" + POR_PAGINA))
      .then((respuesta) => {
        const lasObras = lista(respuesta);
        if (vigente) {
          setTotalPaginas(respuesta?.totalPages ?? 1);
          setTotalObras(respuesta?.totalElements ?? lasObras.length);
        }
        // Las portadas de toda la página en un solo pedido (portada=true); las variantes, de a una obra.
        const pedirPortadas = lasObras.length > 0
          ? sin404(api.get("/api/imagenes?portada=true&" + lasObras.map((obra) => "obraId=" + obra.id).join("&")))
          : Promise.resolve([]);

        return Promise.all([
          pedirPortadas,
          Promise.all(lasObras.map((obra) => sin404(api.get("/api/variantes?obraId=" + obra.id))))
        ]).then(([susPortadas, susVariantes]) =>
          lasObras.map((obra, i) => ({
            obra,
            variante: lista(susVariantes[i]).find((v) => v.stock_variante > 0) ?? lista(susVariantes[i])[0],
            imagenes: lista(susPortadas).filter((p) => p.obra_id === obra.id)
          }))
        );
      })
      .then((armadas) => {
        if (vigente) setItems(armadas);
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargandoObras(false);
      });

    return () => {
      vigente = false;
    };
  }, [id, pagina, intento]);

  if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>;
  if (error || !artista) {
    return (
      <div className="seccion">
        <div className="contenido">
          <Estado tipo="error" mensaje={error || "No se encontró al artista."} accion="Reintentar" onAccion={() => setIntento((n) => n + 1)} />
        </div>
      </div>
    );
  }

  const armarTarjeta = (item) => {
    const portada = [...item.imagenes].sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0))[0];
    const estilo = estilos.find((e) => (item.obra.estilo_ids ?? []).includes(e.id));
    return {
      obra: {
        ...item.obra,
        estilo: estilo ? estilo.nombre_estilo : "",
        artistaId: artista.id,
        nombre_artistico: artista.nombre_artistico
      },
      variante: item.variante,
      imagen: portada ? optimizada(portada.url, 600) : null
    };
  };

  return (
    <div className="seccion">
      <div className="contenido apilado">
        <header className="encabezado" style={{ alignItems: "flex-start" }}>
          <div className="vendedor" style={{ gap: "var(--md)" }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {(artista.nombre_artistico ?? "A")[0]}
            </div>
            <div>
              <h1 className="headline-lg">{artista.nombre_artistico}</h1>
              <p className="body-lg muted">
                {artista.acepta_encargos ? "Acepta encargos" : "Por ahora no acepta encargos"}
              </p>
            </div>
          </div>

          {artista.acepta_encargos && (
            <Link to={"/encargos/nuevo?artistaId=" + artista.id}>
              <Boton tipo="primario">Pedirle un encargo</Boton>
            </Link>
          )}
        </header>

        <hr className="divisor" />

        <section>
          <p className="catalog-number muted" style={{ marginBottom: "var(--lg)" }}>
            Obras publicadas — {totalObras} resultados
          </p>

          {cargandoObras ? (
            <Estado tipo="cargando" />
          ) : items.length === 0 ? (
            <Estado tipo="vacio" mensaje="Este artista todavía no publicó obras." />
          ) : (
            <div className="grilla-obras">
              {items.map((item) => {
                const tarjeta = armarTarjeta(item);
                const variante = tarjeta.variante || {};
                return (
                  <TarjetaObra
                    key={tarjeta.obra.id}
                    id={tarjeta.obra.id}
                    nombreObra={tarjeta.obra.nombre_obra}
                    estilo={tarjeta.obra.estilo}
                    artistaId={tarjeta.obra.artistaId}
                    nombreArtistico={tarjeta.obra.nombre_artistico}
                    nombreTamanio={variante.nombre_tamanio}
                    precio={variante.precio_variante}
                    porcentajeDescuento={variante.porcentaje_descuento}
                    stock={variante.stock_variante}
                    imagen={tarjeta.imagen}
                  />
                );
              })}
            </div>
          )}

          {!cargandoObras && <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />}
        </section>
      </div>
    </div>
  );
}