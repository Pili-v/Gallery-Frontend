// Detalle de obra — Área 3 · Catálogo
// Esta pantalla está en docs/maquetas.html: miralá antes de escribirla.
// Los componentes compartidos ya están hechos en src/components.


import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Badge from "../components/Badge";
import Boton from "../components/Boton";
import { pesos } from "../api/formato";

// Datos de prueba asignados por ID
const OBRAS_BD = [
  {
    id: 1,
    nombre_obra: "Mirada de Verano",
    estilo: "Naturaleza",
    descripcion: "Una pieza orgánica inspirada en la vegetación veraniega y los reflejos de luz natural sobre lienzo.",
    artista: { id: 101, nombre_artistico: "Lucía Varela", avatar: "L" },
    imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&q=80",
    variantes: [
      { id: 10, nombre_tamanio: "Mediano (90 x 70 cm)", precio_variante: 220000, porcentaje_descuento: 10, stock_variante: 3 },
      { id: 11, nombre_tamanio: "Grande (140 x 105 cm)", precio_variante: 280000, porcentaje_descuento: 0, stock_variante: 5 }
    ]
  },
  {
    id: 2,
    nombre_obra: "Rosa Partida",
    estilo: "Geométrico",
    descripcion: "Estudio de formas geométricas complejas en paleta cálida.",
    artista: { id: 102, nombre_artistico: "Mateo Rossi", avatar: "M" },
    imagen: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1000&q=80",
    variantes: [
      { id: 20, nombre_tamanio: "Único (90 x 70 cm)", precio_variante: 132000, porcentaje_descuento: 0, stock_variante: 2 }
    ]
  },
  {
    id: 3,
    nombre_obra: "Luz del Alba",
    estilo: "Figurativo",
    descripcion: "Composición figurativa sobre lienzo con acabados en textura ligera.",
    artista: { id: 103, nombre_artistico: "Elena Gómez", avatar: "E" },
    imagen: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&q=80",
    variantes: [
      { id: 30, nombre_tamanio: "Grande (120 x 120 cm)", precio_variante: 340000, porcentaje_descuento: 0, stock_variante: 1 }
    ]
  },
  {
    id: 4,
    nombre_obra: "Retrato en Fragmentos",
    estilo: "Retrato",
    descripcion: "Fragmentos expresionistas aplicados con espátula.",
    artista: { id: 103, nombre_artistico: "Elena Gómez", avatar: "E" },
    imagen: "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=1000&q=80",
    variantes: [
      { id: 40, nombre_tamanio: "Chico (70 x 50 cm)", precio_variante: 145000, porcentaje_descuento: 15, stock_variante: 0 }
    ]
  },
  {
    id: 5,
    nombre_obra: "Zaino",
    estilo: "Retrato",
    descripcion: "Retrato figurativo con contraste de sombras frías.",
    artista: { id: 104, nombre_artistico: "Carlos D'Amico", avatar: "C" },
    imagen: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1000&q=80",
    variantes: [
      { id: 50, nombre_tamanio: "Mediano (40 x 50 cm)", precio_variante: 210000, porcentaje_descuento: 0, stock_variante: 4 }
    ]
  }
];

export default function DetalleObra() {
  const { id } = useParams();

  // Buscar la obra correspondiente al ID de la URL
  const obraEncontrada = OBRAS_BD.find((item) => item.id === Number(id));
  const obra = obraEncontrada || OBRAS_BD[0];

  const [varianteSeleccionada, setVarianteSeleccionada] = useState(obra.variantes[0] || {});

  const precio = varianteSeleccionada.precio_variante || 0;
  const descuento = varianteSeleccionada.porcentaje_descuento || 0;
  const precioFinal = descuento ? precio * (1 - descuento / 100) : precio;
  const sinStock = varianteSeleccionada.stock_variante === 0;

  
  return (
    <div className="seccion pagina-detalle-obra">
      <div className="contenido dos-columnas">
        
        {/* Visualización */}
        <div className="detalle-visual">
          <div className={"obra-imagen" + (sinStock ? " sin-stock" : "")}>
            <img src={obra.imagen} alt={obra.nombre_obra} />
            {sinStock && <Badge tipo="sinstock">Sin stock</Badge>}
            {!sinStock && descuento > 0 && <Badge tipo="descuento">−{descuento}%</Badge>}
          </div>
        </div>

        {/* Detalles */}
        <div className="detalle-info apilado">
          <div>
            <span className="catalog-number cartela-num">Nº {String(obra.id).padStart(3, "0")}</span>
            <h1 className="headline-lg" style={{ marginTop: "var(--xs)" }}>{obra.nombre_obra}</h1>
            
            <Link to={`/artista/${obra.artista.id}`} className="vendedor" style={{ marginTop: "var(--sm)", textDecoration: "none" }}>
              <span className="avatar">{obra.artista.avatar}</span>
              <span className="cartela-artist">{obra.artista.nombre_artistico}</span>
            </Link>
          </div>

          <p className="body-lg muted">{obra.descripcion}</p>

          {/* Variantes */}
          {obra.variantes.length > 0 && (
            <div>
              <span className="cartela-meta" style={{ display: "block", marginBottom: "var(--xs)" }}>TAMAÑO Y FORMATO</span>
              <div className="fila" style={{ flexWrap: "wrap" }}>
                {obra.variantes.map((v) => (
                  <button
                    key={v.id}
                    className={`chip ${varianteSeleccionada.id === v.id ? "activo" : ""}`}
                    onClick={() => setVarianteSeleccionada(v)}
                  >
                    {v.nombre_tamanio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Precio y Botón */}
          <div className="resumen">
            <div className="entre">
              <span className="price-lg">
                {descuento > 0 && <span className="precio-tachado">{pesos(precio)}</span>}
                {pesos(precioFinal)}
              </span>
              <span className="cartela-meta">
                {sinStock ? "Sin stock" : `${varianteSeleccionada.stock_variante} disponibles`}
              </span>
            </div>
            <div style={{ marginTop: "var(--md)" }}>
              <Boton tipo={sinStock ? "deshabilitado" : "primario"} bloque disabled={sinStock}>
                {sinStock ? "SIN STOCK" : "AGREGAR AL CARRITO"}
              </Boton>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
