// Artistas — lista completa de artistas, visible para visitante, cliente y artista.
// GET /api/artistas devuelve una página de Spring, por eso se pagina de a 12.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import Estado from "../components/Estado";
import Boton from "../components/Boton";

const POR_PAGINA = 12;

export default function Artistas() {
  const [artistas, setArtistas] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vacio, setVacio] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    setVacio(false);

    api
      .get("/api/artistas?page=" + pagina + "&size=" + POR_PAGINA)
      .then((respuesta) => {
        if (!vigente) return;
        setArtistas(lista(respuesta));
        setTotalPaginas(respuesta?.totalPages ?? 1);
      })
      .catch((e) => {
        if (!vigente) return;
        setArtistas([]);
        // Sin artistas el backend responde 404: no es un error, es una lista vacía
        if (e.status === 404) setVacio(true);
        else setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [pagina, intento]);

  let cuerpo;
  if (cargando) {
    cuerpo = <Estado tipo="cargando" />;
  } else if (error) {
    cuerpo = <Estado tipo="error" mensaje={error} accion="Reintentar" onAccion={() => setIntento((n) => n + 1)} />;
  } else if (vacio || artistas.length === 0) {
    cuerpo = <Estado tipo="vacio" mensaje="Todavía no hay artistas registrados." />;
  } else {
    cuerpo = (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--lg)" }}>
        {artistas.map((artista) => (
          <Link
            key={artista.id}
            to={"/artista/" + artista.id}
            className="cartela"
            style={{ padding: "var(--lg)", textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div className="vendedor" style={{ gap: "var(--md)" }}>
              <span className="avatar">{(artista.nombre_artistico ?? "A")[0]}</span>
              <span className="title-work">{artista.nombre_artistico}</span>
            </div>
            <p className="cartela-meta" style={{ marginTop: "var(--sm)" }}>
              {artista.acepta_encargos ? "Acepta encargos" : "Por ahora no acepta encargos"}
            </p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="seccion">
      <div className="contenido apilado">
        <div>
          <h1 className="headline-lg">Artistas</h1>
          <p className="body-lg muted" style={{ marginTop: "var(--xs)" }}>
            Quienes pintan y venden su obra en la galería.
          </p>
        </div>

        {cuerpo}

        {totalPaginas > 1 && !error && (
          <div className="fila">
            <Boton tipo="secundario" onClick={pagina > 0 ? () => setPagina(pagina - 1) : undefined}>Anterior</Boton>
            <span className="catalog-number muted">{pagina + 1} / {totalPaginas}</span>
            <Boton
              tipo="secundario"
              onClick={pagina + 1 < totalPaginas ? () => setPagina(pagina + 1) : undefined}
            >
              Siguiente
            </Boton>
          </div>
        )}
      </div>
    </div>
  );
}