import { api, lista } from '../api/cliente';
import { getUsuario, getPerfilArtista } from '../api/sesion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { pinturas, lienzos } from '../api/encargoContrato.js';
import Estado from '../components/Estado';
import EstadoEncargo from '../components/EstadoEncargo';
import Boton from '../components/Boton';
import BuscadorArtista from '../components/BuscadorArtista';
import { normalizarNombre } from '../api/formato';
import './encargos.css';

export default function Encargos() {
  const [parametros, setParametros] = useSearchParams();
  const navigate = useNavigate();
  const usuario = getUsuario();
  const perfilArtista = getPerfilArtista();
  const { state } = useLocation();
  const base = '/encargos';
  const esAdmin = usuario?.rol_usuario === 'ADMIN';
  const puedePedir = ['CLIENTE', 'ARTISTA_CLIENTE'].includes(usuario?.rol_usuario);
  const puedeRecibir = !esAdmin && Boolean(perfilArtista);
  const verRecibidos = puedeRecibir && (parametros.has('recibidos') || !puedePedir);
  return <ListaEncargos key={`${base}-${esAdmin}-${verRecibidos}-${usuario?.id}-${perfilArtista?.id}`}
    {...{ base, encargoCreado: state?.encargoCreado, navigate, parametros, setParametros, puedePedir, puedeRecibir, verRecibidos, esAdmin }}
  />;
}

function ListaEncargos({ base, encargoCreado, navigate, parametros, setParametros,
  puedePedir, puedeRecibir, verRecibidos, esAdmin }) {
  const [datos, setDatos] = useState({ items: [], error: '' });
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [artistas, setArtistas] = useState([]);
  const [busquedaArtista, setBusquedaArtista] = useState('');
  const [artistaElegido, setArtistaElegido] = useState('');

  useEffect(() => {
    let activo = true;
    // El backend obtiene el usuario o el artista desde el token de la sesión.
    const ruta = esAdmin ? '/api/encargos' : verRecibidos ? '/api/artistas/me/encargos' : '/api/usuarios/me/encargos';
    // Para ADMIN los nombres son necesarios para filtrar por artista.
    const pedidoArtistas = verRecibidos ? Promise.resolve([]) : api.get('/api/artistas')
      .catch(error => { if (esAdmin) throw error; return []; });
    Promise.all([api.get(ruta), pedidoArtistas])
      .then(([respuesta, perfiles]) => {
        if (!activo) return;
        setDatos({ items: lista(respuesta), error: '' });
        setArtistas(lista(perfiles).map(item => ({ ...item, nombre: item.nombre_artistico })));
      })
      .catch(error => {
        const mensajeVacio = verRecibidos ? 'Todavía no recibiste encargos' : 'Todavía no hiciste encargos';
        const sinEncargos = !esAdmin && error.status === 404 && error.message === mensajeVacio;
        if (activo) setDatos({ items: [], error: sinEncargos ? '' : error.message });
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [esAdmin, verRecibidos, intento]);

  function reintentar() {
    setCargando(true);
    setIntento(intento + 1);
  }
  const idsArtistas = new Set(artistas.filter(artista =>
    normalizarNombre(artista.nombre).includes(normalizarNombre(busquedaArtista))
  ).map(artista => String(artista.id)));
  const encargos = esAdmin ? datos.items.filter(encargo =>
    artistaElegido ? String(encargo.artista_id) === artistaElegido
      : !busquedaArtista.trim() || idsArtistas.has(String(encargo.artista_id))
  ) : datos.items;

  function cambiarVista(recibir) {
    const siguientes = new URLSearchParams(parametros);
    if (recibir) siguientes.set('recibidos', '');
    else siguientes.delete('recibidos');
    setParametros(siguientes);
  }

  return (
    <main className="seccion encargos-pagina">
      <div className="contenido">
        <h1 className="headline-lg titulo-oculto">Encargos</h1>
        {esAdmin && <div className="encargos-buscador" style={{ marginBottom: 'var(--lg)' }}>
          <BuscadorArtista artistas={artistas} value={artistaElegido}
            onChange={setArtistaElegido} onSearch={setBusquedaArtista}
            required={false} disabled={cargando || Boolean(datos.error)} />
        </div>}
        {encargoCreado && <p className="aviso encargos-nota" role="status">El encargo Nº {encargoCreado} se envió al artista.</p>}
        {!esAdmin && <div className="encargos-barra">
          <nav className="pestanias encargos-pestanias" aria-label="Vista de encargos">
            <button disabled={!puedePedir} type="button" className={`pestania${verRecibidos ? '' : ' activa'}`}
              aria-pressed={!verRecibidos} onClick={() => cambiarVista(false)}>Los que pedí</button>
            {puedeRecibir && <button type="button" className={`pestania${verRecibidos ? ' activa' : ''}`}
              aria-pressed={verRecibidos} onClick={() => cambiarVista(true)}>Los que me pidieron</button>}
          </nav>
          {puedePedir && !verRecibidos && <Boton onClick={() => navigate(`${base}/nuevo`)}>Pedir un encargo</Boton>}
        </div>}
        {cargando ? <Estado tipo="cargando" /> : datos.error ? (
          <div className="apilado">
            <Estado tipo="error" mensaje={datos.error} />
            <Boton tipo="secundario" onClick={reintentar}>Reintentar</Boton>
          </div>
        ) : encargos.length === 0 ? (
          <Estado tipo="vacio" mensaje={esAdmin ? (busquedaArtista ? 'No hay encargos para los artistas que coinciden con tu búsqueda.' : 'Todavía no hay encargos registrados.') : verRecibidos ? 'Todavía no recibiste encargos.' : 'Todavía no hiciste encargos.'} />
        ) : (
          <div className="encargos-tabla" role="region" aria-label="Listado de encargos" tabIndex={0}>
            <table className="tabla">
              <caption className="encargos-solo-lectores">{esAdmin ? 'Todos los encargos' : verRecibidos ? 'Encargos recibidos de clientes' : 'Encargos pedidos a artistas'}</caption>
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
                      <td><a href="#" aria-label={`${accion} encargo ${encargo.id}`}
                        onClick={evento => { evento.preventDefault(); navigate(`${base}/${encargo.id}${verRecibidos ? '?recibidos' : ''}`); }}>
                        {accion}
                      </a></td>
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
