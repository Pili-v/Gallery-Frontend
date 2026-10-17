// Artistas — lista completa de artistas, visible para visitante, cliente y artista.
// Cada artista es una tarjeta horizontal, una debajo de la otra, con:
// 3 portadas chicas de sus obras, hasta 4 estilos que trabaja y la cantidad de obras.
// Las obras, imágenes y estilos se piden UNA sola vez y se agrupan acá por artista,
// así no se hacen pedidos por tarjeta. GET /api/artistas viene paginado de a 12.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import { optimizada } from "../api/formato";
import Estado from "../components/Estado";
import Boton from "../components/Boton";


const POR_PAGINA = 3;
const MAX_PORTADAS = 3;
const MAX_ESTILOS = 4;

// Una lista vacía llega como 404 (regla de la cátedra): para listas de apoyo significa "no hay".
const sin404 = (promesa) =>
  promesa.catch((e) => {
    if (e.status === 404) return [];
    throw e;
  });

export default function Artistas() {
  const [artistas, setArtistas] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vacio, setVacio] = useState(false);
  const [intento, setIntento] = useState(0);

  // Datos de apoyo para armar las tarjetas (una sola vez)
  const [obras, setObras] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [estilos, setEstilos] = useState([]);

  useEffect(() => {
    let vigente = true;

    Promise.all([
      sin404(api.get("/api/obras")),
      sin404(api.get("/api/imagenes")),
      sin404(api.get("/api/estilos"))
    ])
      .then(([susObras, susImagenes, susEstilos]) => {
        if (!vigente) return;
        setObras(lista(susObras));
        setImagenes(lista(susImagenes));
        setEstilos(lista(susEstilos));
      })
      .catch(() => {
        // Si esto falla las tarjetas quedan sin fotos ni estilos, pero la lista se ve igual.
      });

    return () => {
      vigente = false;
    };
  }, [intento]);

  // Los artistas de la página visible
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

  // Lo que muestra la tarjeta de un artista
  const resumenDe = (artista) => {
    const susObras = obras.filter((o) => o.artista_id === artista.id);

    // Portadas: la imagen de menor orden de cada obra, hasta 3 obras
    const portadas = [];
    susObras.forEach((obra) => {
      if (portadas.length >= MAX_PORTADAS) return;
      const portada = imagenes
        .filter((i) => i.obra_id === obra.id)
        .sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0))[0];
      if (portada) {
        portadas.push({
          id: obra.id,
          nombre: obra.nombre_obra,
          src: optimizada(portada.url, 600)
        });
      }
    });

    // Estilos sin repetir, en el orden en que aparecen
    const idsEstilos = [];
    susObras.forEach((obra) => {
      (obra.estilo_ids ?? []).forEach((idEstilo) => {
        if (!idsEstilos.includes(idEstilo)) idsEstilos.push(idEstilo);
      });
    });
    const nombresEstilos = idsEstilos
      .map((idEstilo) => estilos.find((e) => e.id === idEstilo)?.nombreEstilo)
      .filter(Boolean);

    return {
      cantidad: susObras.length,
      portadas,
      estilosVisibles: nombresEstilos.slice(0, MAX_ESTILOS),
      estilosOcultos: Math.max(nombresEstilos.length - MAX_ESTILOS, 0)
    };
  };

  let cuerpo;
  if (cargando) {
    cuerpo = <Estado tipo="cargando" />;
  } else if (error) {
    cuerpo = <Estado tipo="error" mensaje={error} accion="Reintentar" onAccion={() => setIntento((n) => n + 1)} />;
  } else if (vacio || artistas.length === 0) {
    cuerpo = <Estado tipo="vacio" mensaje="Todavía no hay artistas registrados." />;
  } else {
    cuerpo = (
      <div className="apilado">
        {artistas.map((artista) => {
          const resumen = resumenDe(artista);

          return (
            <Link
              key={artista.id}
              to={"/artista/" + artista.id}
              className="cartela"
              style={{
                padding: "var(--lg)",
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--lg)",
                flexWrap: "wrap"
              }}
            >
              {/* Quién es */}
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div className="vendedor" style={{ gap: "var(--md)" }}>
                  <span className="avatar">{(artista.nombre_artistico ?? "A")[0]}</span>
                  <span className="title-work">{artista.nombre_artistico}</span>
                </div>
                <p className="cartela-meta" style={{ marginTop: "var(--sm)" }}>
                  {resumen.cantidad === 1 ? "1 obra publicada" : resumen.cantidad + " obras publicadas"}
                  {" · "}
                  {artista.acepta_encargos ? "Acepta encargos" : "Por ahora no acepta encargos"}
                </p>
              </div>

              {/* Qué estilos abarca */}
              <div className="fila" style={{ flex: "1 1 200px", flexWrap: "wrap", gap: "var(--xs)" }}>
                {resumen.estilosVisibles.length === 0 ? (
                  <span className="cartela-meta">Todavía sin obras publicadas</span>
                ) : (
                  <>
                    {resumen.estilosVisibles.map((nombre) => (
                      <span key={nombre} className="chip">{nombre}</span>
                    ))}
                    {resumen.estilosOcultos > 0 && (
                      <span className="cartela-meta">+{resumen.estilosOcultos}</span>
                    )}
                  </>
                )}
              </div>

              {/* Muestra de su obra */}
              <div className="fila" style={{ gap: "var(--sm)" }}>
                {resumen.portadas.map((portada) => (
                  <img
                    key={portada.id}
                    src={portada.src}
                    alt={portada.nombre}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: "contain",
                      background: "var(--canvas)"
                    }}
                  />
                ))}
              </div>
            </Link>
          );
        })}
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