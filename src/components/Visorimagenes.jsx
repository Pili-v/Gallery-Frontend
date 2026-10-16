// Visor de imágenes de una obra — Área 3 · Catálogo
// Como en Mercado Libre: una imagen principal, las miniaturas al costado, flechas
// para pasar de una a otra y, al hacer click, la imagen completa en pantalla grande.
//
// La imagen NUNCA se recorta ni se agranda más que su tamaño real: se ve entera,
// centrada sobre el fondo del marco (ver imagenes.css). Si la obra tiene varias
// fotos con distinta forma, el marco no cambia de tamaño al pasar de una a otra.
//
// Props:
//   imagenes : lista de direcciones de imagen (ya armadas, en el orden en que se muestran)
//   alt      : texto alternativo (el nombre de la obra)
//   atenuada : true para mostrarla en gris (obra sin stock)
//   children : lo que va encima de la imagen, por ejemplo los Badge
//
// Usarlo con key={obra.id}: así, al cambiar de obra, vuelve a la primera imagen.

import { useState } from "react";

export default function VisorImagenes({ imagenes, alt, atenuada = false, children }) {
  const [actual, setActual] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const [toqueX, setToqueX] = useState(null);

  const total = imagenes.length;
  const indice = Math.min(actual, Math.max(total - 1, 0));

  // El módulo hace que después de la última vuelva a la primera, y al revés.
  const ir = (n) => {
    if (total < 2) return;
    setActual(((n % total) + total) % total);
  };
  const anterior = () => ir(indice - 1);
  const siguiente = () => ir(indice + 1);

  const alTeclear = (e) => {
    if (e.key === "ArrowLeft") anterior();
    if (e.key === "ArrowRight") siguiente();
  };

  // En el celular se pasa de imagen deslizando el dedo.
  const alTocar = (e) => setToqueX(e.touches[0].clientX);
  const alSoltar = (e) => {
    if (toqueX === null) return;
    const desplazamiento = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(desplazamiento) > 40) {
      if (desplazamiento < 0) siguiente();
      else anterior();
    }
    setToqueX(null);
  };

  // Con la imagen ampliada: Esc cierra y las flechas pasan de imagen (eventos de React, sin tocar el DOM).
  const alTeclearAmpliada = (e) => {
    if (e.key === "Escape") setAmpliada(false);
    if (e.key === "ArrowLeft") anterior();
    if (e.key === "ArrowRight") siguiente();
  };

  const descripcion = alt + (total > 1 ? " — imagen " + (indice + 1) + " de " + total : "");

  return (
    <div className="visor">
      {/* Miniaturas: al pasar el mouse o tocar cambian la imagen principal */}
      {total > 1 && (
        <div className="visor-miniaturas">
          {imagenes.map((src, i) => (
            <button
              key={i}
              type="button"
              className={"visor-miniatura" + (i === indice ? " activa" : "")}
              onMouseEnter={() => setActual(i)}
              onFocus={() => setActual(i)}
              onClick={() => setActual(i)}
              aria-label={"Ver la imagen " + (i + 1)}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      <div
        className="visor-principal"
        tabIndex={0}
        onKeyDown={alTeclear}
        onTouchStart={alTocar}
        onTouchEnd={alSoltar}
      >
        <div className={"obra-imagen" + (atenuada ? " sin-stock" : "")}>
          {total > 0 ? (
            <img
              src={imagenes[indice]}
              alt={descripcion}
              onClick={() => setAmpliada(true)}
              draggable={false}
            />
          ) : (
            <span className="cartela-meta visor-vacio">Esta obra todavía no tiene imágenes.</span>
          )}
          {children}
        </div>

        {total > 1 && (
          <>
            <button type="button" className="visor-flecha izquierda" onClick={anterior} aria-label="Imagen anterior">
              ‹
            </button>
            <button type="button" className="visor-flecha derecha" onClick={siguiente} aria-label="Imagen siguiente">
              ›
            </button>
            <span className="visor-contador catalog-number">
              {indice + 1} / {total}
            </span>
          </>
        )}
      </div>

      {/* Imagen completa. Un click afuera de la imagen, o Esc, la cierra. */}
      {ampliada && total > 0 && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          autoFocus
          onKeyDown={alTeclearAmpliada}
          onClick={() => setAmpliada(false)}
        >
          <img src={imagenes[indice]} alt={descripcion} onClick={(e) => e.stopPropagation()} />

          <button type="button" className="lightbox-cerrar" onClick={() => setAmpliada(false)} aria-label="Cerrar">
            ✕
          </button>

          {total > 1 && (
            <>
              <button
                type="button"
                className="lightbox-flecha izquierda"
                onClick={(e) => {
                  e.stopPropagation();
                  anterior();
                }}
                aria-label="Imagen anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-flecha derecha"
                onClick={(e) => {
                  e.stopPropagation();
                  siguiente();
                }}
                aria-label="Imagen siguiente"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}