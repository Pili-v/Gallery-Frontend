// Perfil del artista — Área 3 · Catálogo
// El artista sale de GET /api/artistas/{id} y sus obras de GET /api/obras?artistaId=,
// que devuelve la misma forma que el catálogo y está paginado.
// Las variantes y las imágenes se piden solo de las obras de la página que se ve:
// pedir las listas completas traería las fotos de todas las obras de la base.

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import TarjetaObra from "../components/TarjetaObra";
import Estado from "../components/Estado";
import Boton from "../components/Boton";

const POR_PAGINA = 6;

// Una lista vacía llega como 404 (regla de la cátedra): para una lista hija
// significa "no hay", no que algo falló.
const sin404 = (promesa) =>
  promesa.catch((e) => {
    if (e.status === 404) return [];
    throw e;
  });

export default function PerfilArtista() {
  const { id } = useParams();

  const [artista, setArtista] = useState(null);
  const [errorArtista, setErrorArtista] = useState("");

  const [items, setItems] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalObras, setTotalObras] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [errorObras, setErrorObras] = useState("");

  // Al cambiar de artista se vuelve a empezar: datos nuevos y primera página.
  useEffect(() => {
    setArtista(null);
    setErrorArtista("");
    setPagina(0);

    api
      .get("/api/artistas/" + id)
      .then(setArtista)
      .catch((e) => setErrorArtista(e.message));
  }, [id]);

  // Las obras del artista, una página por vez.
  useEffect(() => {
    if (!artista) return;

    let activo = true;
    setCargando(true);
    setAviso("");
    setErrorObras("");

    const cargar = async () => {
      try {
        const respuesta = await api.get(
          "/api/obras?artistaId=" + id + "&page=" + pagina + "&size=" + POR_PAGINA
        );
        const obras = lista(respuesta);
        const estilos = lista(await sin404(api.get("/api/estilos")));

        const armados = await Promise.all(
          obras.map(async (obra) => {
            const [variantes, imagenes] = await Promise.all([
              sin404(api.get("/api/variantes?obraId=" + obra.id)).then(lista),
              sin404(api.get("/api/imagenes?obraId=" + obra.id)).then(lista),
            ]);

            const estilo = estilos.find((e) => obra.estilo_ids.includes(e.id));
            const variante = variantes.find((v) => v.stock_variante > 0) ?? variantes[0];

            return {
              obra: {
                ...obra,
                estilo: estilo ? estilo.nombreEstilo : "",
                artistaId: obra.artista_id,
                nombre_artistico: artista.nombre_artistico,
              },
              variante: variante,
              imagen: imagenes[0]
                ? "data:image/jpeg;base64," + imagenes[0].contenido_imagen
                : null,
            };
          })
        );

        if (!activo) return;
        setItems(armados);
        setTotalPaginas(respuesta.totalPages ?? 1);
        setTotalObras(respuesta.totalElements ?? armados.length);
      } catch (e) {
        if (!activo) return;
        setItems([]);
        setTotalPaginas(0);
        setTotalObras(0);
        // Sin obras el backend responde 404 con el motivo: se muestra, no es una falla.
        if (e.status === 404) setAviso(e.message);
        else setErrorObras(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [artista, pagina]);

  if (errorArtista) {
    return (
      <div className="seccion">
        <div className="contenido apilado">
          <Estado tipo="error" mensaje={errorArtista} />
          <Link to="/">
            <Boton tipo="secundario">Volver al catálogo</Boton>
          </Link>
        </div>
      </div>
    );
  }

  if (!artista) {
    return (
      <div className="seccion">
        <div className="contenido">
          <Estado tipo="cargando" />
        </div>
      </div>
    );
  }

  return (
    <div className="seccion">
      <div className="contenido apilado">
        <header className="entre" style={{ alignItems: "flex-start" }}>
          <div className="vendedor" style={{ gap: "var(--md)" }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {artista.nombre_artistico[0]}
            </div>
            <div>
              <span className="cartela-meta">Artista</span>
              <h1 className="headline-lg">{artista.nombre_artistico}</h1>
              <p className="body-lg muted" style={{ marginTop: "var(--xs)" }}>
                {artista.acepta_encargos ? "Acepta encargos" : "Por ahora no acepta encargos"}
              </p>
            </div>
          </div>

          {artista.acepta_encargos && (
            <Link to="/encargos/nuevo">
              <Boton tipo="primario">Pedirle un encargo</Boton>
            </Link>
          )}
        </header>

        <hr className="divisor" />

        <section>
          <p className="catalog-number muted" style={{ marginBottom: "var(--lg)" }}>
            Obras publicadas — {totalObras} resultados
          </p>

          {cargando && <Estado tipo="cargando" />}
          {!cargando && errorObras && <Estado tipo="error" mensaje={errorObras} />}
          {!cargando && aviso && <Estado tipo="vacio" mensaje={aviso} />}

          {!cargando && !errorObras && !aviso && (
            <div className="grilla-obras">
              {items.map((item) => (
                <TarjetaObra
                  key={item.obra.id}
                  obra={item.obra}
                  variante={item.variante}
                  imagen={item.imagen}
                />
              ))}
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="entre" style={{ marginTop: "var(--xl)" }}>
              <Boton
                tipo={pagina === 0 ? "deshabilitado" : "secundario"}
                onClick={() => setPagina(pagina - 1)}
              >
                Anterior
              </Boton>
              <span className="catalog-number muted">
                Página {pagina + 1} de {totalPaginas}
              </span>
              <Boton
                tipo={pagina >= totalPaginas - 1 ? "deshabilitado" : "secundario"}
                onClick={() => setPagina(pagina + 1)}
              >
                Siguiente
              </Boton>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}