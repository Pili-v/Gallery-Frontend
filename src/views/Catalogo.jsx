// Catálogo — Área 3 · Catálogo
// Esta pantalla está en docs/maquetas.html: miralá antes de escribirla.
// Los componentes compartidos ya están hechos en src/components.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TarjetaObra from "../components/TarjetaObra";
import Paginador from "../components/Paginador";
import Boton from "../components/Boton";
import { armarTarjetas, listarArtistas, listarEstilos, listarObras } from "../api/obras";
import { pesos } from "../api/formato";

const SIN_RANGO = { min: "", max: "" };

export default function Catalogo() {
  // Filtros y paginación: viajan al backend en cada pedido.
  const [estilos, setEstilos] = useState([]);
  const [estiloId, setEstiloId] = useState(null);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [rango, setRango] = useState(SIN_RANGO);
  const [errorPrecio, setErrorPrecio] = useState("");
  const [pagina, setPagina] = useState(0);
  const [tamanio, setTamanio] = useState(9);

  // Resultado del último pedido.
  const [tarjetas, setTarjetas] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalObras, setTotalObras] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  // Datos sueltos del hero.
  const [destacada, setDestacada] = useState(null);
  const [totalArtistas, setTotalArtistas] = useState(null);

  // Una sola vez: chips de estilo, cantidad de artistas y obra destacada.
  useEffect(() => {
    let activo = true;

    listarEstilos().then((e) => activo && setEstilos(e)).catch(() => {});
    listarArtistas({ page: 0, size: 1 })
      .then((p) => activo && setTotalArtistas(p.totalElements))
      .catch(() => {});
    listarObras({ page: 0, size: 1 })
      .then((p) => armarTarjetas(p.content))
      .then((t) => activo && setDestacada(t[0] ?? null))
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  // Cada vez que cambia un filtro, la página o el tamaño se vuelve a pedir al backend.
  useEffect(() => {
    let activo = true;
    setCargando(true);
    setMensaje("");

    (async () => {
      try {
        const pag = await listarObras({
          page: pagina,
          size: tamanio,
          estiloId: estiloId ?? undefined,
          precioMin: rango.min,
          precioMax: rango.max,
        });
        const t = await armarTarjetas(pag.content);
        if (!activo) return;
        setTarjetas(t);
        setTotalPaginas(pag.totalPages);
        setTotalObras(pag.totalElements);
      } catch (e) {
        if (!activo) return;
        setTarjetas([]);
        setTotalPaginas(0);
        setTotalObras(0);
        // 404 = sin resultados, 400 = filtro inválido, 0 = sin conexión: el backend ya trae el texto.
        setMensaje(
          [0, 400, 404].includes(e.status)
            ? e.message
            : "No pudimos cargar las obras. Probá de nuevo en un rato."
        );
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [pagina, tamanio, estiloId, rango]);

  const irALaGrilla = () => {
    document.getElementById("grilla-catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  const elegirEstilo = (id) => {
    setEstiloId(id);
    setPagina(0);
  };

  const aplicarPrecio = () => {
    if (precioMin !== "" && precioMax !== "" && Number(precioMin) > Number(precioMax)) {
      setErrorPrecio("El mínimo no puede superar al máximo.");
      return;
    }
    setErrorPrecio("");
    setRango({ min: precioMin, max: precioMax });
    setPagina(0);
  };

  const limpiarPrecio = () => {
    setPrecioMin("");
    setPrecioMax("");
    setErrorPrecio("");
    setRango(SIN_RANGO);
    setPagina(0);
  };

  const cambiarPagina = (nueva) => {
    setPagina(nueva);
    irALaGrilla();
  };

  const cambiarTamanio = (nuevo) => {
    setTamanio(nuevo);
    setPagina(0);
  };

  const hayRango = rango.min !== "" || rango.max !== "";

  return (
    <div>
      {/* Hero editorial */}
      <section className="hero">
        <div className="hero-texto contenido" style={{ paddingRight: "var(--xl)" }}>
          <div className="hero-regla" />
          <p className="catalog-number muted">
            OBRA ORIGINAL · {totalArtistas != null ? `${totalArtistas} ARTISTAS · ` : ""}ENVÍOS A
            TODO EL PAÍS
          </p>
          <h1 className="display-hero" style={{ marginTop: "var(--sm)" }}>
            Obra original, de quien la pintó
          </h1>
          <p className="body-lg muted" style={{ marginTop: "var(--md)", maxWidth: 460 }}>
            Cada pieza se vende en el tamaño y el marco que elijas. El precio se arma con esas dos
            decisiones, y el dinero va directo al artista.
          </p>
          <div className="fila" style={{ marginTop: "var(--lg)" }}>
            <Boton tipo="primario" onClick={irALaGrilla}>
              Ver todas las obras
            </Boton>
            <Link to="/encargos/nuevo">
              <Boton tipo="secundario">Pedir un encargo</Boton>
            </Link>
          </div>
        </div>

        <div className="hero-obra">
          {destacada?.imagen && <img src={destacada.imagen} alt={destacada.obra.nombre_obra} />}
          {destacada && (
            <div className="hero-pie">
              <Link
                to={`/obra/${destacada.obra.id}`}
                className="cartela-artist"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Nº {String(destacada.obra.id).padStart(3, "0")} · {destacada.obra.nombre_obra} ·{" "}
                {destacada.obra.nombre_artistico}
              </Link>
              {destacada.variante && (
                <span className="price-md">{pesos(destacada.variante.precio_vigente)}</span>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="contenido">
        <section className="seccion-sm" id="grilla-catalogo">
          {/* Filtro de estilo: los chips salen de la base, no están escritos a mano */}
          <div className="fila" style={{ flexWrap: "wrap", gap: "var(--sm)", marginBottom: "var(--lg)" }}>
            <button
              className={`chip ${estiloId === null ? "activo" : ""}`}
              onClick={() => elegirEstilo(null)}
            >
              Todos
            </button>
            {estilos.map((estilo) => (
              <button
                key={estilo.id}
                className={`chip ${estiloId === estilo.id ? "activo" : ""}`}
                onClick={() => elegirEstilo(estilo.id)}
              >
                {estilo.nombreEstilo}
              </button>
            ))}
          </div>

          {/* Filtro de precio */}
          <div className="fila" style={{ marginBottom: "var(--sm)", flexWrap: "wrap" }}>
            <span className="cartela-meta">PRECIO</span>
            <input
              className={`input ${errorPrecio ? "con-error" : ""}`}
              style={{ width: 120 }}
              type="number"
              min="0"
              placeholder="Mínimo"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
            />
            <span className="muted">—</span>
            <input
              className={`input ${errorPrecio ? "con-error" : ""}`}
              style={{ width: 120 }}
              type="number"
              min="0"
              placeholder="Máximo"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
            />
            <Boton tipo="secundario" onClick={aplicarPrecio}>
              Aplicar
            </Boton>
            {hayRango && (
              <Boton tipo="secundario" onClick={limpiarPrecio}>
                Limpiar
              </Boton>
            )}
          </div>
          {errorPrecio && <p className="campo-error body-sm">{errorPrecio}</p>}

          <hr className="divisor" />

          <p className="catalog-number muted" style={{ marginBottom: "var(--lg)" }}>
            Todas las obras — {totalObras} resultados
          </p>

          {cargando && (
            <div className="estado">
              <p className="muted">Cargando obras…</p>
            </div>
          )}

          {!cargando && mensaje && (
            <div className="estado">
              <p className="body-lg">{mensaje}</p>
            </div>
          )}

          {!cargando && !mensaje && (
            <div className="grilla-obras">
              {tarjetas.map((item) => (
                <TarjetaObra
                  key={item.obra.id}
                  obra={item.obra}
                  variante={item.variante}
                  imagen={item.imagen}
                />
              ))}
            </div>
          )}

          <Paginador
            pagina={pagina}
            totalPaginas={totalPaginas}
            tamanio={tamanio}
            onPagina={cambiarPagina}
            onTamanio={cambiarTamanio}
          />
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