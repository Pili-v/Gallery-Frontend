// Artistas — lista completa de artistas, visible para visitante, cliente y artista.
// Cada artista es una tarjeta horizontal, una debajo de la otra, con:
// 3 portadas chicas de sus obras, hasta 4 estilos que trabaja y la cantidad de obras.
// Las obras, imágenes y estilos se piden UNA sola vez y se agrupan acá por artista,
// así no se hacen pedidos por tarjeta. GET /api/artistas viene paginado y se puede buscar por
// nombre artístico (q) y filtrar por estilo (estiloId): lo resuelve el backend, sobre todos los artistas.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import { optimizada } from "../api/formato";
import Estado from "../components/Estado";
import Boton from "../components/Boton";
import Paginador from "../components/Paginador";
import FiltroEstilos from "../components/FiltroEstilos";
import BuscadorArtista from "../components/BuscadorArtista";


const POR_PAGINA = 3;
const MAX_PORTADAS = 3;
const MAX_ESTILOS = 4;

// Una lista vacía ahora llega como 204 (cliente.js la entrega como null y lista(null) = []). Se deja este
// respaldo por si algún endpoint todavía responde 404 para "no hay"; el 404 de una obra/artista inexistente se maneja aparte.
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

  // Búsqueda: lo que se escribe, lo que está aplicado, el artista elegido en la lista y los estilos elegidos
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [artistaElegido, setArtistaElegido] = useState("");
  const [reinicio, setReinicio] = useState(0); // cambia la key del buscador para vaciarlo
  const [estiloIds, setEstiloIds] = useState([]); // varios estilos: artistas con obras de ALGUNO de ellos
  const hayFiltros = busqueda !== "" || estiloIds.length > 0;

  // Datos de apoyo para armar las tarjetas (una sola vez)
  const [obras, setObras] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [estilos, setEstilos] = useState([]);
  const [todosLosArtistas, setTodosLosArtistas] = useState([]); // solo para sugerir nombres en el buscador

  useEffect(() => {
    let vigente = true;

    Promise.all([
      sin404(api.get("/api/obras")),
      sin404(api.get("/api/imagenes")),
      sin404(api.get("/api/estilos")),
      sin404(api.get("/api/artistas"))
    ])
      .then(([susObras, susImagenes, susEstilos, susArtistas]) => {
        if (!vigente) return;
        setObras(lista(susObras));
        setImagenes(lista(susImagenes));
        setEstilos(lista(susEstilos));
        setTodosLosArtistas(lista(susArtistas).map((a) => ({ id: a.id, nombre: a.nombre_artistico })));
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

    const partes = ["page=" + pagina, "size=" + POR_PAGINA];
    if (busqueda !== "") partes.push("q=" + encodeURIComponent(busqueda));
    if (estiloIds.length > 0) partes.push("estiloId=" + estiloIds.join(","));

    api
      .get("/api/artistas?" + partes.join("&"))
      .then((respuesta) => {
        if (!vigente) return;
        setArtistas(lista(respuesta));
        setTotalPaginas(respuesta?.totalPages ?? 1);
      })
      .catch((e) => {
        if (!vigente) return;
        setArtistas([]);
        // Sin artistas el backend responde 204 (llega como lista vacía); el 404 queda como respaldo
        if (e.status === 404) setVacio(true);
        else setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [pagina, busqueda, estiloIds, intento]);

  // Cualquier cambio de búsqueda o de estilo vuelve a la primera página
  const buscar = (e) => {
    e.preventDefault();
    setBusqueda(texto.trim());
    setPagina(0);
  };

  const cambiarEstilos = (ids) => {
    setEstiloIds(ids);
    setPagina(0);
  };

  // Al elegir un nombre de la lista se filtra enseguida; si solo se escribe, se aplica con "Buscar".
  const elegirDeLaLista = (id) => {
    setArtistaElegido(id);
    const elegido = todosLosArtistas.find((a) => String(a.id) === id);
    if (elegido) {
      setBusqueda(elegido.nombre);
      setPagina(0);
    }
  };

  const quitarFiltros = () => {
    setTexto("");
    setBusqueda("");
    setArtistaElegido("");
    setReinicio((n) => n + 1);
    setEstiloIds([]);
    setPagina(0);
  };

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
      .map((idEstilo) => estilos.find((e) => e.id === idEstilo)?.nombre_estilo)
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
  } else if ((vacio || artistas.length === 0) && hayFiltros) {
    const nombresEstilos = estilos.filter((e) => estiloIds.includes(e.id)).map((e) => e.nombre_estilo);
    const partes = [];
    if (busqueda !== "") partes.push("que coincidan con “" + busqueda + "”");
    if (nombresEstilos.length > 0) {
      partes.push(
        (busqueda !== "" ? "y tengan" : "con") + " obras " +
        (nombresEstilos.length === 1 ? "del estilo " : "de los estilos ") + nombresEstilos.join(" o ")
      );
    }
    cuerpo = (
      <div className="aviso apilado">
        <p className="body-lg">No hay artistas {partes.join(" ")}.</p>
        <div>
          <Boton tipo="primario" onClick={quitarFiltros}>Quitar filtros</Boton>
        </div>
      </div>
    );
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

        {/* Buscador por nombre artístico (con sugerencias) y filtro por estilos (siempre visibles) */}
        <form className="fila" style={{ alignItems: "flex-end" }} onSubmit={buscar} role="search">
          <div style={{ flex: "1 1 280px", maxWidth: 420 }}>
            <BuscadorArtista
              key={reinicio}
              artistas={todosLosArtistas}
              value={artistaElegido}
              onChange={elegirDeLaLista}
              onSearch={setTexto}
              required={false}
              enviarConEnter
            />
          </div>
          <button type="submit" className="boton boton-secundario">Buscar</button>
          {hayFiltros && <Boton type="button" tipo="secundario" onClick={quitarFiltros}>Quitar filtros</Boton>}
        </form>

        <FiltroEstilos estilos={estilos} seleccionados={estiloIds} onCambiar={cambiarEstilos} />

        {cuerpo}

        {!cargando && !error && <Paginador pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />}
      </div>
    </div>
  );
}