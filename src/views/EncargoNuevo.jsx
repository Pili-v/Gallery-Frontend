import { api, lista as convertirLista } from '../api/cliente';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Boton from '../components/Boton';
import CampoFormulario from '../components/CampoFormulario';
import Estado from '../components/Estado';
import { pinturas, lienzos, prepararEncargo } from '../api/encargoContrato.mjs';
import { artistasDemo, tamaniosDemo, marcosDemo, guardarEncargoDemo } from '../api/encargosDemo';
import './encargoNuevo.css';

const inicial = {
  artista_id: '', tamanio_id: '', marco_id: '',
  tipo_pintura: '', tipo_lienzo: '', descripcion_encargo: '',
};

function normalizarNombre(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function EncargoNuevo() {
  const { pathname } = useLocation();
  const esDemo = pathname.startsWith('/demo/');
  return <FormularioEncargo key={String(esDemo)} esDemo={esDemo} />;
}

function FormularioEncargo({ esDemo }) {
  const [artistas, setArtistas] = useState(esDemo ? artistasDemo : []);
  const [tamanios, setTamanios] = useState(esDemo ? tamaniosDemo : []);
  const [marcos, setMarcos] = useState(esDemo ? marcosDemo : []);
  const [cargando, setCargando] = useState(!esDemo);
  const [errorCarga, setErrorCarga] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (esDemo) return;
    let activo = true;
    api.get('/api/artistas')
      .then(respuesta => {
        if (activo) setArtistas(convertirLista(respuesta).filter(item => item.acepta_encargos)
          .map(item => ({ id: item.id, nombre: item.nombre_artistico })));
        return api.get('/api/tamanios-lienzo');
      })
      .then(respuesta => {
        if (activo) setTamanios(convertirLista(respuesta).map(item => ({ id: item.id, nombre: item.nombre_tamanio })));
        return api.get('/api/marcos');
      })
      .then(respuesta => {
        if (activo) setMarcos(convertirLista(respuesta).map(item => ({ id: item.id, nombre: item.nombre_marco })));
      })
      .catch(error => { if (activo) setErrorCarga(`No se pudieron cargar las opciones del pedido: ${error.message}`); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [esDemo, intento]);
  const [busquedaArtista, setBusquedaArtista] = useState('');
  const artistasFiltrados = artistas.filter(artista =>
    normalizarNombre(artista.nombre).includes(normalizarNombre(busquedaArtista))
  );
  const [formulario, setFormulario] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [errorGuardado, setErrorGuardado] = useState('');
  const navigate = useNavigate();
  const lista = esDemo ? '/demo/encargos' : '/encargos';

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario(actual => ({ ...actual, [name]: value }));
    setErrores(actual => ({ ...actual, [name]: undefined }));
    setErrorGuardado('');
  }

  function enviar(evento) {
    evento.preventDefault();
    if (enviando || cargando || errorCarga) return;
    const resultado = prepararEncargo(formulario);
    setErrores(resultado.errores);
    if (!resultado.datos) {
      evento.currentTarget.elements.namedItem(Object.keys(resultado.errores)[0])?.focus();
      return;
    }
    if (!esDemo) {
      setEnviando(true);
      setErrorGuardado('');
      api.post('/api/encargos', resultado.datos)
        .then(encargo => { if (encargo) navigate(lista, { state: { encargoCreado: encargo.id } }); })
        .catch(error => setErrorGuardado(error.message || 'No se pudo enviar el pedido. Podés reintentar.'))
        .finally(() => setEnviando(false));
      return;
    }
    try {
      const encargo = guardarEncargoDemo(resultado.datos);
      navigate(lista, { state: { encargoCreado: encargo.id } });
    } catch {
      setErrorGuardado('No se pudo guardar el pedido en este navegador. Tus datos siguen en el formulario; podés reintentar.');
    }
  }

  function propiedades(nombre, etiqueta) {
    return {
      name: nombre, etiqueta, value: formulario[nombre], onChange: cambiar,
      required: true, error: errores[nombre], 'aria-label': etiqueta,
      'aria-invalid': Boolean(errores[nombre]),
    };
  }

  return (
    <main className="seccion encargo-nuevo">
      <div className="contenido col-media">
        <Link className="encargo-volver body-sm" to={lista}>← Volver a encargos</Link>
        <h1 className="headline-lg">Pedir un encargo</h1>
        <p className="body-lg muted">Contale al artista qué cuadro te gustaría recibir.</p>
        {esDemo && <p className="aviso body-sm encargo-aviso">
          Vista de prueba: artistas, tamaños y marcos son ejemplos. El pedido se guarda en esta pestaña y no se envía al artista.
        </p>}
        {cargando && <Estado tipo="cargando" />}
        {errorCarga && <div className="apilado"><Estado tipo="error" mensaje={errorCarga} />
          <Boton onClick={() => { setErrorCarga(''); setCargando(true); setIntento(intento + 1); }}>Reintentar</Boton></div>}
        {!cargando && !errorCarga && (!artistas.length || !tamanios.length || !marcos.length) &&
          <Estado tipo="vacio" mensaje="Faltan artistas disponibles, tamaños o marcos para poder pedir un encargo." />}
        <form className="cartela encargo-formulario" onSubmit={enviar} noValidate>
          <p className="body-sm muted encargo-obligatorios">Todos los campos son obligatorios.</p>
          <CampoFormulario etiqueta="Buscar artista" tipo="search"
            aria-label="Buscar artista" aria-controls="artistas-disponibles"
            placeholder="Escribí el nombre del artista" autoComplete="off"
            value={busquedaArtista}
            onChange={evento => {
              setBusquedaArtista(evento.target.value);
              setFormulario(actual => ({ ...actual, artista_id: '' }));
              setErrores(actual => ({ ...actual, artista_id: undefined }));
            }} />
          <p className="body-sm muted" role="status" style={{ marginBottom: 'var(--sm)' }}>
            {artistasFiltrados.length
              ? `${artistasFiltrados.length} artista${artistasFiltrados.length === 1 ? '' : 's'} disponible${artistasFiltrados.length === 1 ? '' : 's'}. Seleccioná uno de la lista.`
              : 'No encontramos artistas con ese nombre. Probá otra búsqueda.'}
          </p>
          <CampoFormulario tipo="select" id="artistas-disponibles"

            {...propiedades('artista_id', 'Artista')}>
            <option value="" disabled>Seleccioná un artista</option>
            {artistasFiltrados.map(artista => <option key={artista.id} value={artista.id}>{artista.nombre} — acepta encargos</option>)}
          </CampoFormulario>
          <div className="fila-campos">
            <CampoFormulario tipo="select" {...propiedades('tipo_pintura', 'Tipo de pintura')}>
              <option value="">Seleccioná una pintura</option>
              {pinturas.map(opcion => <option key={opcion.valor} value={opcion.valor}>{opcion.nombre}</option>)}
            </CampoFormulario>
            <CampoFormulario tipo="select" {...propiedades('tipo_lienzo', 'Tipo de lienzo')}>
              <option value="">Seleccioná un lienzo</option>
              {lienzos.map(opcion => <option key={opcion.valor} value={opcion.valor}>{opcion.nombre}</option>)}
            </CampoFormulario>
          </div>
          <div className="fila-campos">
            <CampoFormulario tipo="select" {...propiedades('tamanio_id', 'Tamaño')}>
              <option value="">Seleccioná un tamaño</option>
              {tamanios.map(opcion => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
            </CampoFormulario>
            <CampoFormulario tipo="select" {...propiedades('marco_id', 'Marco')}>
              <option value="">Seleccioná un marco</option>
              {marcos.map(opcion => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
            </CampoFormulario>
          </div>
          <CampoFormulario textarea rows={5} maxLength={255}
            placeholder="Por ejemplo: un paisaje con tonos verdes y ocres para un living con luz de tarde."
            aria-describedby="descripcion-ayuda" {...propiedades('descripcion_encargo', 'Qué te gustaría')} />
          <p id="descripcion-ayuda" className="body-sm muted encargo-contador">
            Describí el tema, los colores y el estilo. {formulario.descripcion_encargo.length}/255 caracteres.
          </p>
          <div aria-live="polite">
            {Object.values(errores).some(Boolean) && <p className="campo-error body-sm">Revisá los campos indicados antes de enviar.</p>}
            {errorGuardado && <Estado tipo="error" mensaje={errorGuardado} />}
          </div>
          <Boton type="submit" bloque disabled={enviando || cargando || Boolean(errorCarga) || !artistas.length || !tamanios.length || !marcos.length}>
            {enviando ? 'Enviando...' : esDemo ? 'Enviar el pedido de prueba' : 'Enviar el pedido'}
          </Boton>
        </form>
      </div>
    </main>
  );
}
