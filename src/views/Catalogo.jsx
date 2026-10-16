// Catálogo — Área 3 · Catálogo
// Los datos de apoyo (variantes, imágenes, estilos, artistas) se piden una sola vez.
// Las obras se piden cada vez que cambia un filtro. Si el filtro no devuelve nada
// (404) o es inválido (400), la pantalla avisa DENTRO de la zona de resultados, deja
// los filtros a la vista y ofrece un botón para quitarlos (no vuelve sola). Sin async/await y sin tocar el DOM.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import TarjetaObra from "../components/TarjetaObra";
import Estado from "../components/Estado";
import Boton from "../components/Boton";
import { pesos } from "../api/formato";

// Una lista vacía llega como 404 (regla de la cátedra): para listas de apoyo significa "no hay".
const sin404 = (promesa) =>
  promesa.catch((e) => {
    if (e.status === 404) return [];
    throw e;
  });

const SIN_RANGO = { min: "", max: "" };

export default function Catalogo() {
  // Datos de apoyo
  const [variantes, setVariantes] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [estilos, setEstilos] = useState([]);
  const [artistas, setArtistas] = useState([]);
  const [cargandoApoyo, setCargandoApoyo] = useState(true);
  const [errorApoyo, setErrorApoyo] = useState("");

  // Obras del resultado actual
  const [obras, setObras] = useState([]);
  const [cargandoObras, setCargandoObras] = useState(true);
  const [aviso, setAviso] = useState(null); // { mensaje (null = sin resultados), deFiltro }
  const [primeraObra, setPrimeraObra] = useState(null);
  const [intento, setIntento] = useState(0);

  // Filtros: lo que se escribe, y lo que está aplicado
  const [estiloId, setEstiloId] = useState(null);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [rango, setRango] = useState({ ...SIN_RANGO });
  const [errorPrecio, setErrorPrecio] = useState("");
  const [orden, setOrden] = useState("recientes");

  const hayFiltros = estiloId !== null || rango.min !== "" || rango.max !== "";

  // Datos de apoyo: una sola vez
  useEffect(() => {
    let vigente = true;

    Promise.all([
      sin404(api.get("/api/variantes")),
      sin404(api.get("/api/imagenes")),
      sin404(api.get("/api/estilos")),
      sin404(api.get("/api/artistas"))
    ])
      .then(([susVariantes, susImagenes, susEstilos, susArtistas]) => {
        if (!vigente) return;
        setVariantes(lista(susVariantes));
        setImagenes(lista(susImagenes));
        setEstilos(lista(susEstilos));
        setArtistas(lista(susArtistas));
      })
      .catch((e) => {
        if (vigente) setErrorApoyo(e.message);
      })
      .finally(() => {
        if (vigente) setCargandoApoyo(false);
      });

    return () => {
      vigente = false;
    };
  }, [intento]);

  // Obras: se vuelven a pedir cuando cambia un filtro
  useEffect(() => {
    let vigente = true;

    const partes = [];
    if (estiloId !== null) partes.push("estiloId=" + estiloId);
    if (rango.min !== "") partes.push("precioMin=" + rango.min);
    if (rango.max !== "") partes.push("precioMax=" + rango.max);
    const ruta = "/api/obras" + (partes.length > 0 ? "?" + partes.join("&") : "");
    const conFiltros = partes.length > 0;

    setCargandoObras(true);
    setAviso(null);

    api
      .get(ruta)
      .then((respuesta) => {
        if (!vigente) return;
        const lasObras = lista(respuesta);
        setObras(lasObras);
        // La obra del hero es la primera del catálogo SIN filtros
        if (!conFiltros && lasObras.length > 0) setPrimeraObra(lasObras[0]);
      })
      .catch((e) => {
        if (!vigente) return;
        setObras([]);
        const esDeFiltro = e.status === 404 || e.status === 400;
        if (conFiltros && esDeFiltro) {
          setAviso({
            mensaje: e.status === 404 ? null : e.message,
            deFiltro: true
          });
        } else if (e.status === 404) {
          setAviso(null); // catálogo vacío de verdad: se muestra el estado vacío
        } else {
          setAviso({ mensaje: e.message, deFiltro: false });
        }
      })
      .finally(() => {
        if (vigente) setCargandoObras(false);
      });

    return () => {
      vigente = false;
    };
  }, [estiloId, rango, intento]);

  const quitarFiltros = () => {
    setEstiloId(null);
    setPrecioMin("");
    setPrecioMax("");
    setRango({ ...SIN_RANGO });
    setErrorPrecio("");
    setAviso(null);
  };

  const aplicarFiltroPrecio = () => {
    setErrorPrecio("");
    const min = precioMin.trim();
    const max = precioMax.trim();

    if ((min !== "" && Number(min) < 0) || (max !== "" && Number(max) < 0)) {
      setErrorPrecio("Los precios no pueden ser negativos.");
      return;
    }
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      setErrorPrecio("El mínimo no puede ser mayor que el máximo.");
      return;
    }
    setRango({ min, max });
  };

  const reintentar = () => {
    setErrorApoyo("");
    setCargandoApoyo(true);
    setIntento((n) => n + 1);
  };

  // La API devuelve ids, no nombres: la vista los traduce
  const armarItem = (obra) => {
    const variante = variantes.find((v) => v.obra_id === obra.id);
    const susImagenes = imagenes
      .filter((i) => i.obra_id === obra.id)
      .sort((a, b) => (a.orden_imagen ?? 0) - (b.orden_imagen ?? 0));
    const portada = susImagenes[0];
    const artista = artistas.find((a) => a.id === obra.artista_id);
    const estilo = estilos.find((e) => (obra.estilo_ids ?? []).includes(e.id));

    return {
      obra: {
        ...obra,
        estilo: estilo ? estilo.nombreEstilo : "",
        artistaId: obra.artista_id,
        nombre_artistico: artista ? artista.nombre_artistico : "Artista"
      },
      variante,
      imagen: portada ? portada.url ?? "data:image/jpeg;base64," + portada.contenido_imagen : null
    };
  };

  let items = obras.map(armarItem);
  if (orden === "menor-precio") {
    items = [...items].sort((a, b) => (a.variante?.precio_variante ?? 0) - (b.variante?.precio_variante ?? 0));
  } else if (orden === "mayor-precio") {
    items = [...items].sort((a, b) => (b.variante?.precio_variante ?? 0) - (a.variante?.precio_variante ?? 0));
  }

  const destacada = primeraObra ? armarItem(primeraObra) : null;
  const cantidadArtistas = artistas.length;

  if (cargandoApoyo) {
    return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>;
  }
  if (errorApoyo) {
    return (
      <div className="seccion">
        <div className="contenido">
          <Estado tipo="error" mensaje={errorApoyo} accion="Reintentar" onAccion={reintentar} />
        </div>
      </div>
    );
  }

  // El texto depende de qué filtro dejó la lista vacía: estilo, precio o los dos.
  const mensajeSinResultados = () => {
    const estilo = estilos.find((e) => e.id === estiloId);
    const hayPrecio = rango.min !== "" || rango.max !== "";

    let precioTexto = "";
    if (rango.min !== "" && rango.max !== "") precioTexto = "entre " + pesos(Number(rango.min)) + " y " + pesos(Number(rango.max));
    else if (rango.min !== "") precioTexto = "desde " + pesos(Number(rango.min));
    else if (rango.max !== "") precioTexto = "hasta " + pesos(Number(rango.max));

    if (estilo && hayPrecio) return "No hay obras del estilo " + estilo.nombreEstilo + " " + precioTexto + ".";
    if (estilo) return "Todavía no hay obras del estilo " + estilo.nombreEstilo + ".";
    return "No hay obras " + precioTexto + ".";
  };

  // Lo que va en la zona de resultados
  let resultados;
  if (cargandoObras) {
    resultados = <Estado tipo="cargando" />;
  } else if (aviso && aviso.deFiltro) {
    resultados = (
      <div className="aviso apilado">
        <p className="body-lg">{aviso.mensaje ?? mensajeSinResultados()}</p>
        <div>
          <Boton tipo="primario" onClick={quitarFiltros}>Quitar filtros</Boton>
        </div>
      </div>
    );
  } else if (aviso) {
    resultados = (
      <Estado tipo="error" mensaje={aviso.mensaje} accion="Reintentar" onAccion={() => setIntento((n) => n + 1)} />
    );
  } else if (items.length === 0) {
    resultados = <Estado tipo="vacio" mensaje="Todavía no hay obras publicadas." />;
  } else {
    resultados = (
      <div className="grilla-obras">
        {items.map((item) => (
          <TarjetaObra key={item.obra.id} obra={item.obra} variante={item.variante} imagen={item.imagen} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Hero editorial */}
      <section className="hero">
        <div className="hero-texto">
          <div className="hero-regla" />
          <p className="catalog-number muted">
            OBRA ORIGINAL · {cantidadArtistas} ARTISTAS · ENVÍOS A TODO EL PAÍS
          </p>
          <h1 className="display-hero" style={{ marginTop: "var(--sm)" }}>
            Obra original, de quien la pintó
          </h1>
          <p className="body-lg muted" style={{ marginTop: "var(--md)", maxWidth: 460 }}>
            Cada pieza se vende en el tamaño y el marco que elijas. El precio se
            arma con esas dos decisiones, y el dinero va directo al artista.
          </p>
          <div className="fila" style={{ marginTop: "var(--lg)" }}>
            <Boton tipo="primario" onClick={quitarFiltros}>Ver todas las obras</Boton>
            <Link to="/encargos/nuevo">
              <Boton tipo="secundario">Pedir un encargo</Boton>
            </Link>
          </div>
        </div>

        {destacada && (
          <div className="hero-obra">
            {destacada.imagen && <img src={destacada.imagen} alt={destacada.obra.nombre_obra} />}
            <div className="hero-pie">
              <span className="cartela-artist">
                {destacada.obra.nombre_obra} · {destacada.obra.nombre_artistico}
              </span>
            </div>
          </div>
        )}
      </section>

      <div className="contenido">
        <section className="seccion-sm">

          {/* Estilos (salen de la API). Los filtros quedan siempre visibles. */}
          <div className="fila" style={{ flexWrap: "wrap", gap: "var(--sm)", marginBottom: "var(--lg)" }}>
            <button
              className={"chip " + (estiloId === null ? "activo" : "")}
              onClick={() => setEstiloId(null)}
            >
              Todos
            </button>
            {estilos.map((estilo) => (
              <button
                key={estilo.id}
                className={"chip " + (estiloId === estilo.id ? "activo" : "")}
                onClick={() => setEstiloId(estilo.id)}
              >
                {estilo.nombreEstilo}
              </button>
            ))}
          </div>

          {/* Precio */}
          <div className="fila" style={{ marginBottom: "var(--sm)" }}>
            <span className="cartela-meta">PRECIO</span>
            <input
              className="input"
              style={{ width: 120 }}
              type="number"
              min="0"
              placeholder="Mínimo"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
            />
            <span className="muted">—</span>
            <input
              className="input"
              style={{ width: 120 }}
              type="number"
              min="0"
              placeholder="Máximo"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
            />
            <Boton tipo="secundario" onClick={aplicarFiltroPrecio}>Aplicar</Boton>
            {hayFiltros && <Boton tipo="secundario" onClick={quitarFiltros}>Quitar filtros</Boton>}
          </div>
          {errorPrecio && (
            <p className="campo-error body-sm" style={{ marginBottom: "var(--sm)" }}>{errorPrecio}</p>
          )}

          <hr className="divisor" />

          <div className="entre" style={{ margin: "var(--lg) 0" }}>
            <span className="catalog-number muted">
              {hayFiltros ? "Resultados" : "Todas las obras"} — {items.length} resultados
            </span>
            <select className="select" style={{ width: 200 }} value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="menor-precio">Menor precio</option>
              <option value="mayor-precio">Mayor precio</option>
            </select>
          </div>

          {resultados}
        </section>
      </div>

      <section className="seccion-oscura centro">
        <h2 className="headline-md">¿Buscás algo que todavía no existe?</h2>
        <p className="body-lg muted" style={{ marginTop: "var(--sm)" }}>
          Pedile un encargo a un artista: elegís tamaño, lienzo y marco.
        </p>
        <div style={{ marginTop: "var(--lg)" }}>
          <Link to="/encargos/nuevo">
            <Boton tipo="primario">Pedir un encargo</Boton>
          </Link>
        </div>
      </section>
    </div>
  );
}