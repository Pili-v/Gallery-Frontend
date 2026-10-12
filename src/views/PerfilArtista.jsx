// Perfil del artista — Área 3 · Catálogo
// Esta pantalla está en docs/maquetas.html: miralá antes de escribirla.
// Los componentes compartidos ya están hechos en src/components.
import { useParams, Link } from "react-router-dom";
import TarjetaObra from "../components/TarjetaObra";
import Boton from "../components/Boton";

const ARTISTAS_BD = [
  {
    id: 101,
    nombre_artistico: "Lucía Varela",
    estilo_principal: "Naturaleza & Arte Orgánico",
    bio: "Pintora independiente centrada en capturar la luz y la vegetación nativa en lienzos de gran formato.",
    avatar: "L",
    acepta_encargos: true,
    obras: [
      {
        obra: { id: 1, nombre_obra: "Mirada de Verano", estilo: "Naturaleza", nombre_artistico: "Lucía Varela", artistaId: 101 },
        variante: { precio_variante: 280000, porcentaje_descuento: 10, nombre_tamanio: "140 x 105 cm", stock_variante: 5 },
        imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&q=80"
      }
    ]
  },
  {
    id: 102,
    nombre_artistico: "Mateo Rossi",
    estilo_principal: "Arte Geométrico",
    bio: "Artista enfocado en estructuras geométricas, contrastes de color y equilibrio de formas contemporáneas.",
    avatar: "M",
    acepta_encargos: false,
    obras: [
      {
        obra: { id: 2, nombre_obra: "Rosa Partida", estilo: "Geométrico", nombre_artistico: "Mateo Rossi", artistaId: 102 },
        variante: { precio_variante: 132000, porcentaje_descuento: 0, nombre_tamanio: "90 x 70 cm", stock_variante: 2 },
        imagen: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80"
      }
    ]
  },
  {
    id: 103,
    nombre_artistico: "Elena Gómez",
    estilo_principal: "Figurativo & Retrato",
    bio: "Explora la figura humana y la expresión a través de técnicas mixtas y pinceladas expresionistas.",
    avatar: "E",
    acepta_encargos: true,
    obras: [
      {
        obra: { id: 3, nombre_obra: "Luz del Alba", estilo: "Figurativo", nombre_artistico: "Elena Gómez", artistaId: 103 },
        variante: { precio_variante: 340000, porcentaje_descuento: 0, nombre_tamanio: "120 x 120 cm", stock_variante: 1 },
        imagen: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80"
      },
      {
        obra: { id: 4, nombre_obra: "Retrato en Fragmentos", estilo: "Retrato", nombre_artistico: "Elena Gómez", artistaId: 103 },
        variante: { precio_variante: 145000, porcentaje_descuento: 15, nombre_tamanio: "70 x 50 cm", stock_variante: 0 },
        imagen: "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=500&q=80"
      }
    ]
  },
  {
    id: 104,
    nombre_artistico: "Carlos D'Amico",
    estilo_principal: "Retrato Contemporáneo",
    bio: "Especialista en retratos al óleo y acrílico con un enfoque dramático de la iluminación.",
    avatar: "C",
    acepta_encargos: true,
    obras: [
      {
        obra: { id: 5, nombre_obra: "Zaino", estilo: "Retrato", nombre_artistico: "Carlos D'Amico", artistaId: 104 },
        variante: { precio_variante: 210000, porcentaje_descuento: 0, nombre_tamanio: "40 x 50 cm", stock_variante: 4 },
        imagen: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=500&q=80"
      }
    ]
  }
];

export default function PerfilArtista() {
  const { id } = useParams();
  const artistaEncontrado = ARTISTAS_BD.find((item) => item.id === Number(id));
  const artista = artistaEncontrado || ARTISTAS_BD[0];

  return (
    <div className="seccion">
      <div className="contenido apilado">
        <header className="entre" style={{ alignItems: "flex-start" }}>
          <div className="vendedor" style={{ gap: "var(--md)" }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {artista.avatar}
            </div>
            <div>
              <span className="cartela-meta">{artista.estilo_principal}</span>
              <h1 className="headline-lg">{artista.nombre_artistico}</h1>
              <p className="body-lg muted" style={{ marginTop: "var(--xs)" }}>
                {artista.bio}
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
            Obras publicadas — {artista.obras.length} resultados
          </p>

          <div className="grilla-obras">
            {artista.obras.map((item) => (
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
    </div>
  );
}