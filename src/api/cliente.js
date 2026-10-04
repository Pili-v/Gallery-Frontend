// Todo lo que sale hacia la API pasa por acá. Un solo lugar que sabe la dirección
// del backend y que mete el token en cada pedido.

const API = "http://localhost:8080";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function borrarToken() {
  localStorage.removeItem("token");
}

// Hace el pedido y devuelve el JSON ya parseado. Si la API responde con error,
// lanza una excepción con el mensaje que mandó el backend, para poder mostrarlo.
async function pedir(ruta, opciones = {}) {
  const token = getToken();

  const respuesta = await fetch(API + ruta, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...opciones.headers,
    },
  });

  // 401 = el token venció o no vale. Se limpia y se vuelve al login.
  if (respuesta.status === 401) {
    borrarToken();
    window.location.href = "/login";
    return;
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(cuerpo.message || cuerpo.error || `Error ${respuesta.status}`);
  }

  // Un DELETE suele venir sin cuerpo.
  if (respuesta.status === 204) return null;
  return respuesta.json().catch(() => null);
}

export const api = {
  get:    (ruta)         => pedir(ruta),
  post:   (ruta, datos)  => pedir(ruta, { method: "POST",   body: JSON.stringify(datos) }),
  put:    (ruta, datos)  => pedir(ruta, { method: "PUT",    body: JSON.stringify(datos) }),
  patch:  (ruta, datos)  => pedir(ruta, { method: "PATCH",  body: JSON.stringify(datos) }),
  delete: (ruta)         => pedir(ruta, { method: "DELETE" }),
};

// Para subir archivos no se manda JSON: el navegador arma el multipart solo.
export async function subirArchivo(ruta, formData) {
  const token = getToken();
  const respuesta = await fetch(API + ruta, {
    method: "POST",
    headers: token ? { Authorization: "Bearer " + token } : {},
    body: formData,
  });
  if (!respuesta.ok) throw new Error("No se pudo subir el archivo");
  return respuesta.json();
}
