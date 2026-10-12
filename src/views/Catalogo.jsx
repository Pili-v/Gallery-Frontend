// Catálogo — Área 3 · Catálogo
// Esta pantalla está en docs/maquetas.html: miralá antes de escribirla.
// Los componentes compartidos ya están hechos en src/components.


import { useState } from "react";
import { Link } from "react-router-dom";
import TarjetaObra from "../components/TarjetaObra";
import Boton from "../components/Boton";

// Datos de prueba
const OBRAS_DE_PRUEBA = [
  {
    obra: { id: 1, nombre_obra: "Mirada de Verano", estilo: "Naturaleza", artistaId: 101, nombre_artistico: "Lucía Varela" },
    variante: { precio_variante: 280000, porcentaje_descuento: 10, nombre_tamanio: "140 x 105 cm", stock_variante: 5 },
    imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&q=80"
  },
  {
    obra: { id: 2, nombre_obra: "Rosa Partida", estilo: "Geométrico", artistaId: 102, nombre_artistico: "Mateo Rossi" },
    variante: { precio_variante: 132000, porcentaje_descuento: 0, nombre_tamanio: "90 x 70 cm", stock_variante: 2 },
    imagen: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80"
  },
  {
    obra: { id: 3, nombre_obra: "Luz del Alba", estilo: "Figurativo", artistaId: 103, nombre_artistico: "Elena Gómez" },
    variante: { precio_variante: 340000, porcentaje_descuento: 0, nombre_tamanio: "120 x 120 cm", stock_variante: 1 },
    imagen: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80"
  },
  {
    obra: { id: 4, nombre_obra: "Retrato en Fragmentos", estilo: "Retrato", artistaId: 103, nombre_artistico: "Elena Gómez" },
    variante: { precio_variante: 145000, porcentaje_descuento: 15, nombre_tamanio: "70 x 50 cm", stock_variante: 0 },
    imagen: "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=500&q=80"
  },
  {
    obra: { id: 5, nombre_obra: "Zaino", estilo: "Retrato", artistaId: 104, nombre_artistico: "Carlos D'Amico" },
    variante: { precio_variante: 210000, porcentaje_descuento: 0, nombre_tamanio: "40 x 50 cm", stock_variante: 4 },
    imagen: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=500&q=80"
  }
];

const ESTILOS = ["Todos", "Naturaleza", "Geométrico", "Figurativo", "Retrato"];

export default function Catalogo() {
  const [estiloSeleccionado, setEstiloSeleccionado] = useState("Todos");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [rangoAplicado, setRangoAplicado] = useState({ min: "", max: "" });
  const [orden, setOrden] = useState("recientes");

  const cantidadArtistas = new Set(OBRAS_DE_PRUEBA.map((i) => i.obra.artistaId)).size;

  let obrasFiltradas = OBRAS_DE_PRUEBA.filter((item) => {
    if (estiloSeleccionado !== "Todos" && item.obra.estilo !== estiloSeleccionado) return false;
    if (rangoAplicado.min !== "" && item.variante.precio_variante < Number(rangoAplicado.min)) return false;
    if (rangoAplicado.max !== "" && item.variante.precio_variante > Number(rangoAplicado.max)) return false;
    return true;
  });

  if (orden === "menor-precio") {
    obrasFiltradas = [...obrasFiltradas].sort((a, b) => a.variante.precio_variante - b.variante.precio_variante);
  } else if (orden === "mayor-precio") {
    obrasFiltradas = [...obrasFiltradas].sort((a, b) => b.variante.precio_variante - a.variante.precio_variante);
  }

  const aplicarFiltroPrecio = () => setRangoAplicado({ min: precioMin, max: precioMax });

  const irALaGrilla = () => {
    document.getElementById("grilla-catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* Hero editorial */}
      <section className="hero">
        <div className="hero-texto contenido" style={{ paddingRight: "var(--xl)" }}>
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

        <div className="hero-obra">
          <img
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80"
            alt="Ciudad Reflejada"
          />
          <div className="hero-pie">
            <span className="cartela-artist">Nº 006 · Ciudad Reflejada · Lucía Varela</span>
            <span className="price-md">$ 98.000</span>
          </div>
        </div>
      </section>

      <div className="contenido">
        <section className="seccion-sm" id="grilla-catalogo">

          {/* Filtro de estilo */}
          <div className="fila" style={{ flexWrap: "wrap", gap: "var(--sm)", marginBottom: "var(--lg)" }}>
            {ESTILOS.map((estilo) => (
              <button
                key={estilo}
                className={`chip ${estiloSeleccionado === estilo ? "activo" : ""}`}
                onClick={() => setEstiloSeleccionado(estilo)}
              >
                {estilo}
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
              Todas las obras — {obrasFiltradas.length} resultados
            </span>
            <select className="select" style={{ width: 200 }} value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="menor-precio">Menor precio</option>
              <option value="mayor-precio">Mayor precio</option>
            </select>
          </div>

          <div className="grilla-obras">
            {obrasFiltradas.map((item) => (
              <TarjetaObra
                key={item.obra.id}
                obra={item.obra}
                variante={item.variante}
                imagen={item.imagen}
              />
            ))}
          </div>
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