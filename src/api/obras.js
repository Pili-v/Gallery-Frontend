import { pedir, ApiError } from "./cliente";

// ---------- Utilidades ----------

// Una lista vacía llega del backend como 404 con un mensaje (regla de la cátedra).
// Para las listas "hijas" (variantes, imágenes) eso significa simplemente "no hay": se vuelve [].
async function listaOVacia(promesa) {
  try {
    return await promesa;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}

// Memoriza por clave para no repetir el mismo pedido (estilos, artistas).
// Si el pedido falla no queda guardado, así se reintenta la próxima vez.
function memo(fn) {
  const cache = new Map();
  return (clave = "") => {
    if (!cache.has(clave)) {
      const promesa = fn(clave).catch((e) => {
        cache.delete(clave);
        throw e;
      });
      cache.set(clave, promesa);
    }
    return cache.get(clave);
  };
}

const hoy = () => new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD en hora local

// Deja siempre disponible variante.precio_vigente (el precio con descuento ya resuelto).
// Si el backend ya lo manda en VarianteResponse se usa tal cual; si no, se calcula
// con la misma regla que el checkout (descuento solo hasta la fecha indicada).
export function normalizarVariante(v) {
  if (!v) return null;
  const precio = Number(v.precio_variante);
  let vigente = v.precio_vigente != null ? Number(v.precio_vigente) : precio;
  if (
    v.precio_vigente == null &&
    v.porcentaje_descuento > 0 &&
    v.descuento_hasta &&
    hoy() <= v.descuento_hasta
  ) {
    vigente = precio * (1 - v.porcentaje_descuento / 100);
  }
  return { ...v, precio_variante: precio, precio_vigente: vigente };
}

// La imagen viaja hoy como bytes en base64. Cuando el backend pase a links (Cloudinary)
// y mande "url", esta es la única función que hay que tocar.
export function urlImagen(imagen) {
  if (!imagen) return null;
  if (imagen.url) return imagen.url;
  if (imagen.contenido_imagen) return `data:image/jpeg;base64,${imagen.contenido_imagen}`;
  return null;
}

// ---------- Pedidos al backend ----------

export const listarObras = ({ page = 0, size = 9, estiloId, precioMin, precioMax, artistaId } = {}) =>
  pedir("/api/obras", { params: { page, size, estiloId, precioMin, precioMax, artistaId } });

export const getObra = (id) => pedir(`/api/obras/${id}`);

export const listarArtistas = ({ page = 0, size = 1 } = {}) =>
  pedir("/api/artistas", { params: { page, size } });

export const getArtista = memo((id) => pedir(`/api/artistas/${id}`));

export const listarEstilos = memo(() => pedir("/api/estilos"));

export async function listarVariantes(obraId) {
  const respuesta = await listaOVacia(pedir("/api/variantes", { params: { obraId } }));
  const lista = Array.isArray(respuesta) ? respuesta : respuesta.content;
  return lista.map(normalizarVariante);
}

export async function listarImagenes(obraId) {
  const lista = await listaOVacia(pedir("/api/imagenes", { params: { obraId } }));
  return [...lista].sort((a, b) => a.orden_imagen - b.orden_imagen);
}

// ---------- Armado de tarjetas ----------

// Para la tarjeta se muestra la variante más barata que tenga stock
// (si ninguna tiene, la más barata a secas).
function elegirVariante(variantes) {
  if (variantes.length === 0) return null;
  const conStock = variantes.filter((v) => v.stock_variante > 0);
  const candidatas = conStock.length > 0 ? conStock : variantes;
  return candidatas.reduce((a, b) => (b.precio_vigente < a.precio_vigente ? b : a));
}

// Convierte las obras que devuelve el backend en lo que necesita TarjetaObra:
// { obra, variante, imagen }. ObraResponse solo trae ids, así que se completa
// con el artista, los estilos, las variantes y la primera imagen de cada obra.
export async function armarTarjetas(obras) {
  const estilos = await listarEstilos().catch(() => []);

  return Promise.all(
    obras.map(async (o) => {
      const [variantes, imagenes, artista] = await Promise.all([
        listarVariantes(o.id).catch(() => []),
        listarImagenes(o.id).catch(() => []),
        getArtista(o.artista_id).catch(() => null),
      ]);

      const primerEstilo = estilos.find((e) => o.estilo_ids?.includes(e.id));

      return {
        obra: {
          id: o.id,
          nombre_obra: o.nombre_obra,
          estilo: primerEstilo?.nombreEstilo ?? "",
          artistaId: o.artista_id,
          nombre_artistico: artista?.nombre_artistico ?? "Artista",
        },
        variante: elegirVariante(variantes),
        imagen: urlImagen(imagenes[0]),
      };
    })
  );
}
