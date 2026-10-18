// Obras relacionadas — fila de hasta 4 tarjetas debajo del detalle de una obra.
// Sirve para dos secciones: "Más obras de <artista>" y "Obras parecidas" (mismo estilo).
// Es un complemento: si algo falla, la sección simplemente no se muestra y el detalle sigue
// funcionando. Sin async/await y sin tocar el DOM.
//
// Props:
//   titulo           : encabezado de la sección
//   consultas        : filtros de /api/obras, uno por pedido. Ej: ["artistaId=3"] o ["estiloId=1", "estiloId=2"]
//   excluirId        : id de la obra que se está viendo (no se repite)
//   excluirArtistaId : (opcional) descarta las obras de ese artista, para que "parecidas" sean de otros
//   maximo           : cuántas tarjetas mostrar (4 por defecto)
//
// Usarlo con key={obra.id}: así, al pasar a otra obra, la sección se arma de nuevo.

import { useState, useEffect } from "react";
import { api, lista } from "../api/cliente";
import { optimizada } from "../api/formato";
import TarjetaObra from "./TarjetaObra";

// Una lista vacía ahora llega como 204 (cliente.js la entrega como null y lista(null) = []). Se deja este
// respaldo por si algún endpoint todavía responde 404 para "no hay"; el 404 de una obra/artista inexistente se maneja aparte.
const sin404 = (promesa) =>
  promesa.catch((e) => {
    if (e.status === 404) return [];
    throw e;
  });

export default function ObrasRelacionadas({ titulo, consultas, excluirId, excluirArtistaId = null, maximo = 4 }) {
  const [items, setItems] = useState([]);
  const clave = consultas.join("|");

  useEffect(() => {
    let vigente = true;
    setItems([]);

    if (consultas.length > 0) {
      // Se piden de más porque después se descartan la obra actual y las del mismo artista.
      const tamanio = maximo * 3 + 1;

      Promise.all(consultas.map((c) => sin404(api.get("/api/obras?" + c + "&page=0&size=" + tamanio))))
        .then((respuestas) => {
          // Sin repetidas (una obra puede aparecer en dos estilos) y sin la que se está viendo
          const vistas = new Set();
          const elegidas = [];
          respuestas.forEach((respuesta) => {
            lista(respuesta).forEach((obra) => {
              if (obra.id === excluirId || obra.artista_id === excluirArtistaId || vistas.has(obra.id)) return;
              vistas.add(obra.id);
              elegidas.push(obra);
            });
          });
          const obras = elegidas.slice(0, maximo);
          if (obras.length === 0) return null;

          const idsArtistas = [...new Set(obras.map((o) => o.artista_id))];

          return Promise.all([
            Promise.all(
              obras.map((obra) =>
                Promise.all([
                  sin404(api.get("/api/variantes?obraId=" + obra.id)),
                  sin404(api.get("/api/imagenes?obraId=" + obra.id))
                ]).then(([susVariantes, susImagenes]) => ({
                  obra,
                  variantes: lista(susVariantes),
                  imagenes: lista(susImagenes)
                }))
              )
            ),
            Promise.all(idsArtistas.map((id) => api.get("/api/artistas/" + id))),
            sin404(api.get("/api/estilos"))
          ]);
        })
        .then((resultado) => {
          if (!vigente || !resultado) return;
          const [conDatos, artistas, estilos] = resultado;

          setItems(
            conDatos.map(({ obra, variantes, imagenes }) => {
              const portada = [...imagenes].sort((x, y) => (x.orden_imagen ?? 0) - (y.orden_imagen ?? 0))[0];
              const artista = artistas.find((a) => a.id === obra.artista_id);
              const estilo = lista(estilos).find((e) => (obra.estilo_ids ?? []).includes(e.id));

              return {
                obra: {
                  ...obra,
                  estilo: estilo ? estilo.nombreEstilo : "",
                  artistaId: obra.artista_id,
                  nombre_artistico: artista ? artista.nombre_artistico : "Artista"
                },
                variante: variantes.find((v) => v.stock_variante > 0) ?? variantes[0],
                imagen: portada ? optimizada(portada.url, 600) : null
              };
            })
          );
        })
        .catch(() => {
          // Es un complemento: si falla, la sección no se muestra.
        });
    }

    return () => {
      vigente = false;
    };
  }, [clave, excluirId, excluirArtistaId, maximo]);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="headline-md" style={{ marginBottom: "var(--lg)" }}>{titulo}</h2>
      <div className="grilla-obras cuatro">
        {items.map((item) => (
          <TarjetaObra key={item.obra.id} obra={item.obra} variante={item.variante} imagen={item.imagen} />
        ))}
      </div>
    </section>
  );
}