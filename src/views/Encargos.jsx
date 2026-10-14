import { api, lista } from '../api/cliente';
import { getUsuario, getPerfilArtista } from '../api/sesion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { pinturas, lienzos } from '../api/encargoContrato.mjs';
import Estado from '../components/Estado';
import EstadoEncargo from '../components/EstadoEncargo';
import Boton from '../components/Boton';
import './encargos.css';

export default function Encargos() {
  const [parametros, setParametros] = useSearchParams();
  const navigate = useNavigate();
  const usuario = getUsuario();
  const perfilArtista = getPerfilArtista();
  const { state } = useLocation();
  const base = '/encargos';
  const puedePedir = ['CLIENTE', 'ARTISTA_CLIENTE', 'ADMIN'].includes(usuario?.rol_usuario);
  const puedeRecibir = Boolean(perfilArtista);
  const verRecibidos = puedeRecibir && (parametros.has('recibidos') || !puedePedir);
  return <ListaEncargos key={`${base}-${verRecibidos}-${usuario?.id}-${perfilArtista?.id}`}
    {...{ base, state, navigate, parametros, setParametros, puedePedir, puedeRecibir, verRecibidos }}
  />;
}

function ListaEncargos({ base, state, navigate, parametros, setParametros,
  puedePedir, puedeRecibir, verRecibidos }) {
  const [datos, setDatos] = useState({ items: [], error: '' });
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [artistas, setArtistas] = useState([]);

  useEffect(() => {
    let activo = true;
    // El backend obtiene el usuario o el artista desde el token de la sesión.
    const ruta = verRecibidos ? '/api/artistas/me/encargos' : '/api/usuarios/me/encargos';
    api.get(ruta)
      .then(respuesta => { if (activo && respuesta) setDatos({ items: lista(respuesta), error: '' }); })
      .catch(error => { if (activo) setDatos({ items: [], error: error.message }); })
      .finally(() => { if (activo) setCargando(false); });
    // Los clientes son privados: no pedimos el listado de usuarios para mostrar nombres.
    if (!verRecibidos) api.get('/api/artistas')
      .then(respuesta => { if (activo) setArtistas(lista(respuesta)); })
      .catch(() => { /* Si falla el nombre, el ID sigue identificando al artista. */ });
    return () => { activo = false; };
  }, [verRecibidos, intento]);

  function reintentar() {
    setCargando(true);
    setIntento(intento + 1);
  }
  const encargos = datos.items;

  function cambiarVista(recibir) {
    const siguientes = new URLSearchParams(parametros);
    if (recibir) siguientes.set('recibidos', '');
    else siguientes.delete('recibidos');
    setParametros(siguientes);
  }

  return (
    <main className="seccion encargos-pagina">
      <div className="contenido">
        <div className="entre encargos-cabecera">
          <div>
            <h1 className="headline-lg">Encargos</h1>
            <p className="body-lg muted">Los que pediste y los que te pidieron.</p>
          </div>
          {puedePedir && !verRecibidos && <Boton onClick={() => navigate(`${base}/nuevo`)}>Pedir un encargo</Boton>}
        </div>
        {state?.encargoCreado && <p className="aviso encargos-nota" role="status">El encargo Nº {state.encargoCreado} se envió al artista.</p>}
        <nav className="pestanias encargos-pestanias" aria-label="Vista de encargos">
          <button disabled={!puedePedir} type="button" className={`pestania${verRecibidos ? '' : ' activa'}`}
            aria-pressed={!verRecibidos} onClick={() => cambiarVista(false)}>Los que pedí</button>
          <button disabled={!puedeRecibir} type="button" className={`pestania${verRecibidos ? ' activa' : ''}`}
            aria-pressed={verRecibidos} onClick={() => cambiarVista(true)}>Los que me pidieron</button>
        </nav>
        {cargando ? <Estado tipo="cargando" /> : datos.error ? (
          <div className="apilado">
            <Estado tipo="error" mensaje={datos.error} />
            <Boton tipo="secundario" onClick={reintentar}>Reintentar</Boton>
          </div>
        ) : encargos.length === 0 ? (
          <Estado tipo="vacio" mensaje="Todavía no hay encargos en esta vista." />
        ) : (
          <div className="encargos-tabla" role="region" aria-label="Listado de encargos" tabIndex={0}>
            <table className="tabla">
              <caption className="encargos-solo-lectores">{verRecibidos ? 'Encargos recibidos de clientes' : 'Encargos pedidos a artistas'}</caption>
              <thead><tr>
                <th scope="col">Nº</th><th scope="col">{verRecibidos ? 'Cliente' : 'Artista'}</th>
                <th scope="col">Pintura</th><th scope="col">Lienzo</th><th scope="col">Pedido</th>
                <th scope="col">Estado</th><th scope="col"><span className="encargos-solo-lectores">Acciones</span></th>
              </tr></thead>
              <tbody>
                {encargos.map(encargo => {
                  const persona = verRecibidos ? `Cliente Nº ${encargo.usuario_id}` : artistas.find(item => item.id === encargo.artista_id)?.nombre_artistico ?? `Artista Nº ${encargo.artista_id}`;
                  const accion = verRecibidos && ['PENDIENTE', 'EN_PROCESO'].includes(encargo.estado_encargo) ? 'Responder' : 'Ver';
                  return (
                    <tr key={encargo.id}>
                      <td>{String(encargo.id).padStart(3, '0')}</td>
                      <td>{persona ?? 'Participante'}</td>
                      <td>{pinturas.find(item => item.valor === encargo.tipo_pintura)?.nombre}</td>
                      <td>{lienzos.find(item => item.valor === encargo.tipo_lienzo)?.nombre}</td>
                      <td>{new Date(encargo.fecha_creacion_encargo).toLocaleDateString('es-AR')}</td>
                      <td><EstadoEncargo estado={encargo.estado_encargo} /></td>
                      <td><Boton aria-label={`${accion} encargo ${encargo.id}`}
                        onClick={() => navigate(`${base}/${encargo.id}${verRecibidos ? '?recibidos' : ''}`)}>
                        {accion}
                      </Boton></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  );
}
