import { useEffect, useId, useRef, useState } from 'react';
import './buscadorArtista.css';
import { normalizarNombre } from '../api/formato';

export default function BuscadorArtista({ artistas, value, onChange, onSearch, error, disabled, required = true, enviarConEnter = false }) {
  const id = useId();
  const lista = useRef(null);
  const [busqueda, setBusqueda] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const seleccionado = artistas.find(artista => String(artista.id) === value);
  const texto = busqueda ?? seleccionado?.nombre ?? '';
  const resultados = artistas.filter(artista =>
    normalizarNombre(artista.nombre).includes(normalizarNombre(texto))
  );

  useEffect(() => {
    if (abierto && activo >= 0) {
      lista.current?.children[activo]?.scrollIntoView({ block: 'nearest' });
    }
  }, [abierto, activo]);

  function elegir(artista) {
    onChange(String(artista.id));
    onSearch?.(artista.nombre);
    setBusqueda(null);
    setAbierto(false);
    setActivo(-1);
  }

  function teclado(evento) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      setAbierto(true);
      setActivo(actual => {
        if (!resultados.length) return -1;
        if (evento.key === 'ArrowDown') return Math.min(actual + 1, resultados.length - 1);
        return actual < 0 ? resultados.length - 1 : Math.max(actual - 1, 0);
      });
    } else if (evento.key === 'Enter' && abierto) {
      // Con enviarConEnter solo se frena si hay una opción marcada; si no, el formulario puede buscar.
      if (!enviarConEnter || (activo >= 0 && resultados[activo])) evento.preventDefault();
      if (activo >= 0 && resultados[activo]) elegir(resultados[activo]);
    } else if (evento.key === 'Escape') {
      setAbierto(false);
      setActivo(-1);
    }
  }

  return (
    <div className="campo buscador-artista">
      <label className="catalog-number muted" htmlFor={id}>Buscar artista</label>
      <div className="buscador-artista-control">
        <input id={id} name="artista_id" type="text" role="combobox"
          className={'input' + (error ? ' con-error' : '')}
          placeholder="Escribí el nombre del artista" autoComplete="off"
          value={texto} disabled={disabled} required={required} aria-required={required}
          aria-autocomplete="list" aria-expanded={abierto}
          aria-controls={id + '-resultados'} aria-invalid={Boolean(error)}
          aria-describedby={error ? id + '-error' : undefined}
          aria-activedescendant={abierto && activo >= 0 ? id + '-opcion-' + activo : undefined}
          onFocus={() => { setAbierto(true); setActivo(-1); }}
          onBlur={() => { setAbierto(false); setActivo(-1); }}
          onChange={evento => {
            setBusqueda(evento.target.value);
            onChange('');
            onSearch?.(evento.target.value);
            setAbierto(true);
            setActivo(-1);
            if (lista.current) lista.current.scrollTop = 0;
          }}
          onKeyDown={teclado} />
        {abierto && (
          <div className="desplegable-panel completo">
            <ul id={id + '-resultados'} role="listbox" aria-label="Artistas disponibles"
              className="desplegable-lista" ref={lista}>
              {resultados.map((artista, indice) => (
                <li key={artista.id} id={id + '-opcion-' + indice} role="option"
                  aria-selected={String(artista.id) === value}
                  className={'desplegable-opcion' + (indice === activo ? ' activa' : '')}
                  title={artista.nombre}
                  onMouseDown={evento => evento.preventDefault()}
                  onClick={() => elegir(artista)}>
                  {artista.nombre}
                </li>
              ))}
            </ul>
            {!resultados.length && <p className="body-sm muted buscador-artista-vacio" role="status">
              No encontramos artistas con ese nombre.
            </p>}
          </div>
        )}
      </div>
      {error && <div id={id + '-error'} className="campo-error body-sm">{error}</div>}
    </div>
  );
}