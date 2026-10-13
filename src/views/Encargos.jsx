import { api, lista } from '../api/cliente';
import { getUsuario, getPerfilArtista } from '../api/sesion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { artistasDemo, clientesDemo, clienteDemo, artistaDemo, leerEncargosDemo } from '../api/encargosDemo';
import { pinturas, lienzos } from '../api/encargoContrato.mjs';
import Estado from '../components/Estado';
import EstadoEncargo from '../components/EstadoEncargo';
import Boton from '../components/Boton';
import './encargos.css';

function cargarLista() {
  try { return { items: leerEncargosDemo(), error: '' }; }
  catch { return { items: [], error: 'No se pudieron leer los encargos guardados en esta pestaña.' }; }
}

export default function Encargos() {
  const [parametros, setParametros] = useSearchParams();
  const navigate = useNavigate();
  const usuario = getUsuario();
  const perfilArtista = getPerfilArtista();
  const { pathname, state } = useLocation();
  const base = pathname.startsWith('/demo/') ? '/demo/encargos' : '/encargos';
  const esDemo = base === '/demo/encargos';
  const puedePedir = esDemo || ['CLIENTE', 'ARTISTA_CLIENTE', 'ADMIN'].includes(usuario?.rol_usuario);
  const puedeRecibir = esDemo || Boolean(perfilArtista);
  const verRecibidos = puedeRecibir && (parametros.has('recibidos') || !puedePedir);
  return <ListaEncargos key={`${base}-${verRecibidos}-${usuario?.id}-${perfilArtista?.id}`}
    {...{ esDemo, base, state, navigate, parametros, setParametros, puedePedir, puedeRecibir, verRecibidos }}
    usuarioId={usuario?.id} artistaId={perfilArtista?.id} />;
}

function ListaEncargos({ esDemo, base, state, navigate, parametros, setParametros,
  puedePedir, puedeRecibir, verRecibidos, usuarioId, artistaId }) {
  const [locales, setLocales] = useState(() => esDemo ? cargarLista() : { items: [], error: '' });
  const [cargando, setCargando] = useState(!esDemo);
  const [intento, setIntento] = useState(0);
  const [artistas, setArtistas] = useState([]);

  useEffect(() => {
    if (esDemo) return;
    let activo = true;
    const ruta = verRecibidos ? `/api/encargos/artista/${artistaId}` : `/api/encargos/usuario/${usuarioId}`;
    api.get(ruta)
      .then(respuesta => { if (activo && respuesta) setLocales({ items: lista(respuesta), error: '' }); })
      .catch(error => { if (activo) setLocales({ items: [], error: error.message }); })
      .finally(() => { if (activo) setCargando(false); });
    // Los clientes son privados: no pedimos el listado de usuarios para mostrar nombres.
    if (!verRecibidos) api.get('/api/artistas')
      .then(respuesta => { if (activo) setArtistas(lista(respuesta)); })
      .catch(() => { /* Si falla el nombre, el ID sigue identificando al artista. */ });
    return () => { activo = false; };
  }, [esDemo, verRecibidos, usuarioId, artistaId, intento]);

  function reintentar() {
    if (esDemo) { setLocales(cargarLista()); return; }
    setCargando(true);
    setIntento(intento + 1);
  }
  const encargos = esDemo ? locales.items.filter(item => verRecibidos
    ? item.artista_id === artistaDemo.artista_id
    : item.usuario_id === clienteDemo.usuario_id) : locales.items;

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
        {state?.encargoCreado && <p className="aviso encargos-nota" role="status">El encargo Nº {state.encargoCreado} {esDemo ? 'se guardó como prueba en esta pestaña.' : 'se envió al artista.'}</p>}
        <nav className="pestanias encargos-pestanias" aria-label="Vista de encargos">
          <button disabled={!puedePedir} type="button" className={`pestania${verRecibidos ? '' : ' activa'}`}
            aria-pressed={!verRecibidos} onClick={() => cambiarVista(false)}>Los que pedí</button>
          <button disabled={!puedeRecibir} type="button" className={`pestania${verRecibidos ? ' activa' : ''}`}
            aria-pressed={verRecibidos} onClick={() => cambiarVista(true)}>Los que me pidieron</button>
        </nav>
        {cargando ? <Estado tipo="cargando" /> : locales.error ? (
          <div className="apilado">
            <Estado tipo="error" mensaje={locales.error} />
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
                  const persona = !esDemo
                    ? (verRecibidos ? `Cliente Nº ${encargo.usuario_id}` : artistas.find(item => item.id === encargo.artista_id)?.nombre_artistico ?? `Artista Nº ${encargo.artista_id}`)
                    : verRecibidos
                    ? clientesDemo.find(item => item.id === encargo.usuario_id)?.nombre
                    : artistasDemo.find(item => item.id === encargo.artista_id)?.nombre;
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
        {esDemo && <p className="body-sm muted encargos-nota">
          Datos de ejemplo. Vista de {verRecibidos ? 'Ana Gorriti, artista' : 'Lucía Varela, cliente'}.
        </p>}
      </div>
    </main>
  );
}
