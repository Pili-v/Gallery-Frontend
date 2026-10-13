// Catálogo — Área 3 · Catálogo
// La grilla sale de la API. Se piden las listas completas una sola vez y se
// arman acá: pedir las variantes y las imagenes obra por obra serian diez
// llamadas para cinco obras.
// El filtro de estilo y el de precio los resuelve el backend, que ya acepta
// estiloId, precioMin y precioMax como parametros de GET /api/obras.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, lista } from "../api/cliente";
import TarjetaObra from "../components/TarjetaObra";
import Estado from "../components/Estado";
import Boton from "../components/Boton";

export default function Catalogo() {
  // Lo que llega de la API
  const [obras, setObras] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [estilos, setEstilos] = useState([]);
  const [artistas, setArtistas] = useState([]);

  // Los tres estados que contempla toda pantalla que pide datos
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Los filtros de la pantalla
  const [estiloSeleccionado, setEstiloSeleccionado] = useState(null);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("recientes");

  // Arma la URL con los filtros que esten puestos. Los filtros van como
  // parametros sobre el mismo endpoint: la URL nombra el recurso y los
  // parametros lo acotan.
  const urlDeObras = (estiloId, min, max) => {
    const partes = [];
    if (estiloId) partes.push("estiloId=" + estiloId);
    if (min !== "") partes.push("precioMin=" + min);
    if (max !== "") partes.push("precioMax=" + max);
    return "/api/obras" + (partes.length > 0 ? "?" + partes.join("&") : "");
  };

  const cargarTodo = async (estiloId, min, max) => {
    try {
      const susObras = lista(await api.get(urlDeObras(estiloId, min, max)));
      const susVariantes = lista(await api.get("/api/variantes"));
      const susImagenes = lista(await api.get("/api/imagenes"));
      const susEstilos = lista(await api.get("/api/estilos"));
      const susArtistas = lista(await api.get("/api/artistas"));

      setObras(susObras);
      setVariantes(susVariantes);
      setImagenes(susImagenes);
      setEstilos(susEstilos);
      setArtistas(susArtistas);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  // useEffect con [] vacio: corre una sola vez, cuando aparece la pantalla.
  useEffect(() => {
    cargarTodo(null, "", "");
  }, []);

  // Al tocar un estilo o aplicar el precio se vuelve a preguntar al backend,
  // porque el filtrado es suyo: el front no se guarda todas las obras.
  const filtrarPorEstilo = (estiloId) => {
    setEstiloSeleccionado(estiloId);
    setCargando(true);
    cargarTodo(estiloId, precioMin, precioMax);
  };

  const aplicarFiltroPrecio = () => {
    setCargando(true);
    cargarTodo(estiloSeleccionado, precioMin, precioMax);
  };

  // La API devuelve ids, no nombres: la vista los traduce. La obra trae
  // artista_id y estilo_ids, y de las otras listas sale como se llaman.
  const armarItem = (obra) => {
    const variante = variantes.find((v) => v.obra_id === obra.id);
    const imagen = imagenes.find((i) => i.obra_id === obra.id);
    const artista = artistas.find((a) => a.id === obra.artista_id);
    const estilo = estilos.find((e) => obra.estilo_ids.includes(e.id));

    return {
      obra: {
        ...obra,
        estilo: estilo ? estilo.nombreEstilo : "",
        artistaId: obra.artista_id,
        nombre_artistico: artista ? artista.nombre_artistico : "Artista"
      },
      variante: variante,
      // La foto no es una direccion web: viene en base64 desde la base.
      imagen: imagen ? "data:image/jpeg;base64," + imagen.contenido_imagen : null
    };
  };

  let items = obras.map(armarItem);

  // El orden se resuelve acá porque la API todavia no expone sort.
  if (orden === "menor-precio") {
    items = [...items].sort((a, b) => (a.variante?.precio_variante ?? 0) - (b.variante?.precio_variante ?? 0));
  } else if (orden === "mayor-precio") {
    items = [...items].sort((a, b) => (b.variante?.precio_variante ?? 0) - (a.variante?.precio_variante ?? 0));
  }

  const cantidadArtistas = new Set(obras.map((o) => o.artista_id)).size;
  const destacada = items[0];

  const irALaGrilla = () => {
    document.getElementById("grilla-catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>;
  if (error) return <div className="seccion"><div className="contenido"><Estado tipo="error" mensaje={error} /></div></div>;

  return (
    <div>
      {/* Hero editorial */}
      <section className="hero">
        <div className="hero-texto ">
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
            <Boton tipo="primario" onClick={irALaGrilla}>Ver todas las obras</Boton>
            <Link to="/encargos/nuevo">
              <Boton tipo="secundario">Pedir un encargo</Boton>
            </Link>
          </div>
        </div>

        {/* La obra del hero es la primera del catalogo, no una foto fija. */}
        {destacada && (
          <div className="hero-obra">
            {destacada.imagen && <img src={destacada.imagen} alt={destacada.obra.nombre_obra} />}
            <div className="hero-pie">
              <span className="cartela-artist">
                Nº {String(destacada.obra.id).padStart(3, "0")} · {destacada.obra.nombre_obra} · {destacada.obra.nombre_artistico}
              </span>
            </div>
          </div>
        )}
      </section>

      <div className="contenido">
        <section className="seccion-sm" id="grilla-catalogo">

          {/* Filtro de estilo: los estilos salen de la API, no de una lista fija */}
          <div className="fila" style={{ flexWrap: "wrap", gap: "var(--sm)", marginBottom: "var(--lg)" }}>
            <button
              className={"chip " + (estiloSeleccionado === null ? "activo" : "")}
              onClick={() => filtrarPorEstilo(null)}
            >
              Todos
            </button>

            {estilos.map((estilo) => (
              <button
                key={estilo.id}
                className={"chip " + (estiloSeleccionado === estilo.id ? "activo" : "")}
                onClick={() => filtrarPorEstilo(estilo.id)}
              >
                {estilo.nombreEstilo}
              </button>
            ))}
          </div>

          {/* Filtro de precio */}
          <div className="fila" style={{ marginBottom: "var(--lg)" }}>
            <span className="cartela-meta">PRECIO</span>
            <input
              className="input"
              style={{ width: 120 }}
              type="number"
              placeholder="Mínimo"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
            />
            <span className="muted">—</span>
            <input
              className="input"
              style={{ width: 120 }}
              type="number"
              placeholder="Máximo"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
            />
            <Boton tipo="secundario" onClick={aplicarFiltroPrecio}>Aplicar</Boton>
          </div>

          <hr className="divisor" />

          {/* Contador + orden */}
          <div className="entre" style={{ marginBottom: "var(--lg)" }}>
            <span className="catalog-number muted">
              Todas las obras — {items.length} resultados
            </span>
            <select className="select" style={{ width: 200 }} value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="menor-precio">Menor precio</option>
              <option value="mayor-precio">Mayor precio</option>
            </select>
          </div>

          {/* Renderizado condicional: si el filtro no deja nada, se avisa */}
          {items.length === 0 ? (
            <Estado tipo="vacio" mensaje="No hay obras con esos filtros." />
          ) : (
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
        </section>
      </div>

      {/* Banner de encargos */}
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