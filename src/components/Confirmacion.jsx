import { useEffect, useRef } from "react"

import Boton from "./Boton"

// Ventana para confirmar una acción, con el estilo de la página. Se muestra mientras
// esté en pantalla: quien la usa decide cuándo ponerla y sacarla.
// Usa el <dialog> del navegador, que ya trae el fondo oscuro, el foco atrapado y la tecla Escape.
const Confirmacion = ({ titulo, mensaje, textoConfirmar, onConfirmar, onCancelar, ocupado }) => {
    const dialogo = useRef(null)

    useEffect(() => {
        const elemento = dialogo.current
        if (!elemento.open) elemento.showModal()
        return () => elemento.close()
    }, [])

    return (
        <dialog
            ref={dialogo}
            className="modal"
            onCancel={(e) => { e.preventDefault(); if (!ocupado) onCancelar() }}
            onClick={(e) => { if (e.target === e.currentTarget && !ocupado) onCancelar() }}
        >
            <h2 className="headline-sm">{titulo}</h2>
            <p className="body-lg muted" style={{ marginTop: "var(--sm)" }}>{mensaje}</p>

            <div className="modal-acciones">
                <Boton tipo="secundario" type="button" onClick={onCancelar} disabled={ocupado}>Cancelar</Boton>
                <Boton tipo={ocupado ? "deshabilitado" : "primario"} type="button" onClick={onConfirmar}>
                    {textoConfirmar}
                </Boton>
            </div>
        </dialog>
    )
}

export default Confirmacion
