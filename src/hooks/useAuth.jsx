import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, borrarToken, getToken } from "../api/cliente";

// Guarda quién está logueado y su rol, para toda la aplicación.
// El token solo lleva el email, así que apenas hay token se pide
// GET /api/usuarios/me para saber el id y el rol.

const Contexto = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setCargando(false);
      return;
    }
    api.get("/api/usuarios/me")
      .then(setUsuario)
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  async function ingresar(email, contrasenia) {
    const r = await api.post("/api/v1/auth/authenticate", {
      email_usuario: email,
      contrasenia_usuario: contrasenia,
    });
    setToken(r.access_token);
    const yo = await api.get("/api/usuarios/me");
    setUsuario(yo);
    return yo;
  }

  function salir() {
    borrarToken();
    setUsuario(null);
  }

  const rol = usuario?.rol_usuario ?? null;

  return (
    <Contexto.Provider value={{
      usuario, rol, cargando, ingresar, salir,
      esArtista: rol === "ARTISTA" || rol === "ARTISTA_CLIENTE",
      esCliente: rol === "CLIENTE" || rol === "ARTISTA_CLIENTE",
      esAdmin:   rol === "ADMIN",
    }}>
      {children}
    </Contexto.Provider>
  );
}

export function useAuth() {
  return useContext(Contexto);
}
