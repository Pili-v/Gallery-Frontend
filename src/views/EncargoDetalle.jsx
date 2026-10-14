import { api, lista } from '../api/cliente';
import { getUsuario, getPerfilArtista } from '../api/sesion';
import { permisosEncargo } from '../api/encargoSesion.mjs';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Boton from '../components/Boton';
import CampoFormulario from '../components/CampoFormulario';
import Estado from '../components/Estado';
import EstadoEncargo from '../components/EstadoEncargo';
import { pinturas, lienzos } from '../api/encargoContrato.mjs';
import { estadosEncargo, estadosPermitidos, prepararMensaje, prepararCambioEstado } from '../api/encargoDetalleContrato.mjs';
import './encargoDetalle.css';

export default function EncargoDetalle() {
  const { id } = useParams();
  const [parametros] = useSearchParams();
  const recibidos = parametros.has('recibidos');
  const base = '/encargos';
  // La URL solo cambia el regreso al listado; los permisos reales salen de la sesión.
  return <Detalle key={`${base}-${id}-${recibidos}`} id={id} recibidos={recibidos} base={base} />;
}

function Detalle({ id, recibidos, base }) {
  const [datos, setDatos] = useState({ encargo: null, error: '' });
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [referencias, setReferencias] = useState({});
  const usuario = getUsuario();
  const perfilArtista = getPerfilArtista();

  useEffect(() => {
    let activo = true;
    let pedido;
    api.get(`/api/encargos/${id}`)
      .then(respuesta => {
        if (!respuesta) throw new Error('No se pudo cargar el encargo.');
        pedido = respuesta;
        return api.get(`/api/encargos/${id}/mensajes`);
      })
      .then(mensajes => {
        if (activo) setDatos({ encargo: { ...pedido, mensajes: lista(mensajes) }, error: '' });
        // Los nombres son complementarios: si fallan, mostramos los IDs reales.
        api.get(`/api/artistas/${pedido.artista_id}`)
          .then(artista => { if (activo) setReferencias(actual => ({ ...actual, artista })); }).catch(() => {});
        api.get(`/api/tamanios-lienzo/${pedido.tamanio_id}`)
          .then(tamanio => { if (activo) setReferencias(actual => ({ ...actual, tamanio })); }).catch(() => {});
        api.get(`/api/marcos/${pedido.marco_id}`)
          .then(marco => { if (activo) setReferencias(actual => ({ ...actual, marco })); }).catch(() => {});
      })
      .catch(error => { if (activo) setDatos({ encargo: null, error: error.message }); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [id, intento]);

  function reintentar() {
    setCargando(true);
    setIntento(intento + 1);
  }
  const [mensaje, setMensaje] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');
  const [errorEstado, setErrorEstado] = useState('');
  const [aviso, setAviso] = useState('');
  const campoMensaje = useRef(null);
  const volver = `${base}${recibidos ? '?recibidos' : ''}`;
  const { encargo, error } = datos;
  const permisos = permisosEncargo(encargo, usuario, perfilArtista);
  const permitido = permisos.puedeVer;

  function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    setAviso('');
    let cuerpo;
    try { cuerpo = prepararMensaje(encargo.id, mensaje); }
    catch (error) { setErrorMensaje(error.message); return; }
    setEnviando(true);
    setErrorMensaje('');
    api.post('/api/mensajes', cuerpo)
      .then(respuesta => {
        if (!respuesta) return;
        setDatos(actual => ({ ...actual, encargo: { ...actual.encargo, mensajes: [...actual.encargo.mensajes, respuesta] } }));
        setMensaje('');
        setAviso('Mensaje enviado.');
      })
      .catch(error => setErrorMensaje(error.message))
      .finally(() => { setEnviando(false); campoMensaje.current?.focus(); });
  }

  function guardarEstado(evento) {
    evento.preventDefault();
    if (guardando) return;
    setAviso('');
    let cuerpo;
    try { cuerpo = prepararCambioEstado(encargo.estado_encargo, nuevoEstado); }
    catch (error) { setErrorEstado(error.message); return; }
    setGuardando(true);
    setErrorEstado('');
    api.patch(`/api/encargos/${encargo.id}/estado`, cuerpo)
      .then(respuesta => {
        if (!respuesta) return;
        setDatos(actual => ({ ...actual, encargo: { ...respuesta, mensajes: actual.encargo.mensajes } }));
        setNuevoEstado('');
        setAviso('Estado actualizado.');
      })
      .catch(error => setErrorEstado(error.message))
      .finally(() => setGuardando(false));
  }

  if (cargando) return <main className="seccion"><Estado tipo="cargando" /></main>;

  if (error || !encargo || !permitido) {
    return (
      <main className="seccion encargo-detalle">
        <div className="contenido col-media apilado">
          <Link to={volver} className="detalle-volver body-sm">← Volver a encargos</Link>
          <h1 className="headline-lg">Detalle del encargo</h1>
          <Estado tipo={error ? 'error' : 'vacio'} mensaje={error || (!encargo
            ? 'No encontramos ese encargo. Volvé al listado para elegir uno.'
            : 'No tenés permiso para ver este encargo.')} />
          {error && <Boton tipo="secundario" onClick={reintentar}>Reintentar</Boton>}
        </div>
      </main>
    );
  }

  const esArtista = permisos.puedeCambiarEstado;
  const artista = { usuario_id: referencias.artista?.usuario_id, nombre: referencias.artista?.nombre_artistico ?? `Artista Nº ${encargo.artista_id}` };
  const cliente = { nombre: `Cliente Nº ${encargo.usuario_id}` };
  const pintura = pinturas.find(item => item.valor === encargo.tipo_pintura)?.nombre ?? encargo.tipo_pintura;
  const lienzo = lienzos.find(item => item.valor === encargo.tipo_lienzo)?.nombre ?? encargo.tipo_lienzo;
  const tamanio = referencias.tamanio?.nombre_tamanio ?? `Tamaño Nº ${encargo.tamanio_id}`;
  const marco = referencias.marco?.nombre_marco ?? `Nº ${encargo.marco_id}`;
  const permitidos = estadosPermitidos(encargo.estado_encargo);

  return (
    <main className="seccion encargo-detalle">
      <div className="contenido col-media">
        <Link to={volver} className="detalle-volver body-sm">← Volver a encargos</Link>
        <div className="entre detalle-cabecera">
          <div>
            <p className="catalog-number cartela-num">Encargo Nº {String(encargo.id).padStart(3, '0')}</p>
            <h1 className="headline-lg">{pintura} sobre {lienzo.toLowerCase()}, {tamanio.replace(/ cm$/, '')}</h1>
            <p className="body-lg muted">
              {esArtista ? `Pedido por ${cliente?.nombre ?? 'Cliente'}` : `Pedido a ${artista?.nombre ?? 'Artista'}`}
              {' · '}<time dateTime={encargo.fecha_creacion_encargo}>{new Date(encargo.fecha_creacion_encargo).toLocaleDateString('es-AR')}</time>
            </p>
          </div>
          <EstadoEncargo estado={encargo.estado_encargo} />
        </div>
        <div className="aviso detalle-aviso">
          <span className="catalog-number cartela-num">Vista de {esArtista ? 'artista' : 'cliente'}</span>
          <p className="body-sm detalle-texto">
            {esArtista ? 'Sos el artista de este encargo: podés actualizar su estado.'
              : 'Podés escribir mensajes; el estado lo cambia el artista del encargo.'}
          </p>
        </div>
        <hr className="divisor" />
        <section className="cartela detalle-ficha" aria-labelledby="descripcion-pedido">
          <h2 id="descripcion-pedido" className="catalog-number muted">Descripción del pedido</h2>
          <p className="body-lg detalle-texto detalle-contenido">{encargo.descripcion_encargo}</p>
          <div className="fila detalle-chips">
            <span className="chip">{pintura}</span><span className="chip">{lienzo}</span>
            <span className="chip">{tamanio}</span><span className="chip">Marco {marco}</span>
          </div>
          <hr className="divisor" />
          {esArtista && permitidos.length > 0 ? (
            <form onSubmit={guardarEstado}>
              <div className="entre detalle-estado">
                <label htmlFor="estado-encargo" className="muted">Cambiar el estado del encargo</label>
                <div className="fila detalle-controles">
                  <select id="estado-encargo" className="select" value={nuevoEstado}
                    aria-invalid={Boolean(errorEstado)} aria-describedby={errorEstado ? 'estado-error' : undefined}
                    onChange={evento => { setNuevoEstado(evento.target.value); setErrorEstado(''); setAviso(''); }}>
                    <option value="">{estadosEncargo[encargo.estado_encargo].texto} (actual)</option>
                    {permitidos.map(estado => <option key={estado} value={estado}>{estadosEncargo[estado].texto}</option>)}
                  </select>
                  <Boton type="submit" tipo={nuevoEstado && !guardando ? 'primario' : 'deshabilitado'}>{guardando ? 'Guardando...' : 'Guardar'}</Boton>
                </div>
              </div>
              {errorEstado && <p id="estado-error" className="campo-error body-sm" role="alert">{errorEstado}</p>}
            </form>
          ) : (
            <>
              <div className="entre detalle-estado"><span className="muted">Estado del encargo</span><EstadoEncargo estado={encargo.estado_encargo} /></div>
              <p className="body-sm muted detalle-texto">{permitidos.length === 0
                ? 'No hay cambios de estado disponibles desde esta pantalla.'
                : 'Solo el artista puede cambiar el estado.'}</p>
            </>
          )}
        </section>

        <section className="detalle-mensajes" aria-labelledby="titulo-mensajes">
          <h2 id="titulo-mensajes" className="headline-md">Mensajes</h2>
          <p className="body-lg muted detalle-intro">Para coordinar. La descripción original del pedido se mantiene sin cambios.</p>
          {encargo.mensajes.length === 0 ? (
            <Estado tipo="vacio" mensaje="Todavía no hay mensajes. Escribí el primero para empezar a coordinar." />
          ) : (
            <ol className="hilo detalle-hilo" aria-label="Conversación del encargo">
              {encargo.mensajes.map(item => (
                <li key={item.id} className={`mensaje ${item.usuario_emisor_id === usuario?.id ? 'propio' : 'ajeno'}`}>
                  <p className="cartela-artist">
                    {item.usuario_emisor_id === usuario?.id ? 'Vos' : item.usuario_emisor_id === encargo.usuario_id ? cliente.nombre : item.usuario_emisor_id === artista?.usuario_id ? artista.nombre : `Usuario Nº ${item.usuario_emisor_id}`}
                    {item.fecha_creacion_mensaje && <time className="cartela-meta" dateTime={item.fecha_creacion_mensaje}>
                      {' · '}{new Date(item.fecha_creacion_mensaje).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </time>}
                  </p>
                  <p className="body-lg detalle-texto detalle-contenido">{item.contenido_mensaje}</p>
                </li>
              ))}
            </ol>
          )}
          {permisos.puedeEscribir && <form className="detalle-enviar" onSubmit={enviar} noValidate>
            <div className="fila detalle-editor">
              <CampoFormulario etiqueta="Tu mensaje" aria-label="Tu mensaje" placeholder="Escribir un mensaje"
                ref={campoMensaje} disabled={enviando} value={mensaje} maxLength={255} required
                aria-invalid={Boolean(errorMensaje)} aria-describedby={errorMensaje ? 'mensaje-error' : 'mensaje-ayuda'}
                onChange={evento => { setMensaje(evento.target.value); setErrorMensaje(''); setAviso(''); }} />
              <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar'}</Boton>
            </div>
            {errorMensaje && <p id="mensaje-error" className="campo-error body-sm" role="alert">{errorMensaje}</p>}
            <p id="mensaje-ayuda" className="body-sm muted">{mensaje.length}/255 caracteres.</p>
          </form>}
          <p className="body-sm detalle-confirmacion" role="status">{aviso}</p>
        </section>
      </div>
    </main>
  );
}
