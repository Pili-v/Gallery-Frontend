import { useState } from "react"
import { pesos } from "../api/formato"

import Boton from "./Boton"
import CampoFormulario from "./CampoFormulario"

// Lo que se ve del precio de un encargo, para el cliente y para el artista. Sigue el flujo del back:
// el artista propone un precio mientras el encargo está pendiente, el cliente lo acepta (el encargo pasa a
// aprobado y el precio queda fijo) y recién paga cuando el artista lo termina. El precio es siempre visible.
// Solo dibuja y avisa: quien lo usa hace los pedidos.
//   estado, precio: el estado del encargo y su precio acordado (null si todavía no hay).
//   esCliente, esArtista: quién mira, para el texto que explica en qué punto está.
//   puedeDefinir, puedeAceptar, puedePagar: qué botones corresponden ahora.
//   ocupado, error, aviso: el pedido en curso, su falla y su confirmación.
//   onDefinir(valor), onAceptar(), onPagar(): lo que hace cada botón.
const AcuerdoPrecio = ({ estado, precio, esCliente, esArtista, puedeDefinir, puedeAceptar, puedePagar, ocupado, error, aviso, onDefinir, onAceptar, onPagar }) => {

    const [texto, setTexto] = useState(precio !== null && precio !== undefined ? String(Number(precio)) : "")
    const [errorCampo, setErrorCampo] = useState("")

    const explicacion = () => {
        if (estado === "CANCELADO") return "El encargo fue cancelado."
        if (estado === "PAGADO") return "El encargo está pagado."
        if (estado === "TERMINADO") {
            return esCliente ? "El encargo está terminado: ya podés pagarlo." : "El encargo está terminado. Falta que el cliente lo pague."
        }
        if (estado === "APROBADO" || estado === "EN_PROCESO") {
            return esCliente
                ? "Aceptaste este precio: ya no cambia y el encargo ya no se puede cancelar. No pagás nada hasta que el artista termine el encargo."
                : "El cliente aceptó este precio: ya no cambia y el encargo ya no se puede cancelar."
        }
        // Pendiente: se está negociando.
        if (esCliente) {
            return precio === null || precio === undefined
                ? "Todavía no hay un precio: el artista lo va a proponer. Mientras tanto podés coordinar los detalles por mensajes."
                : "El artista propone este precio. Si lo aceptás, el encargo se aprueba y el precio queda fijo. No pagás nada ahora: el pago se hace cuando el encargo esté terminado."
        }
        if (esArtista) {
            return precio === null || precio === undefined
                ? "Proponé un precio para este encargo: el cliente lo tiene que aceptar para que arranque."
                : "Este es el precio que propusiste. Mientras el encargo siga pendiente lo podés cambiar: el cliente ve siempre el último."
        }
        return "Consulta de solo lectura."
    }

    const proponer = (e) => {
        e.preventDefault()
        if (ocupado) return

        const valor = Number(texto)
        if (texto.trim() === "" || !Number.isInteger(valor) || valor < 1) {
            setErrorCampo("Ingresá un precio en pesos, mayor a 0.")
            return
        }

        setErrorCampo("")
        onDefinir(valor)
    }

    return (
        <section className="cartela detalle-ficha" aria-labelledby="titulo-precio">
            <h2 id="titulo-precio" className="catalog-number muted">Precio del encargo</h2>
            <p className="price-lg">
                {precio !== null && precio !== undefined ? pesos(precio) : "Sin precio todavía"}
            </p>
            <p className="body-sm muted detalle-texto">{explicacion()}</p>

            {puedeDefinir && (
                <form className="fila detalle-controles" onSubmit={proponer} noValidate>
                    <CampoFormulario
                        etiqueta="Precio en pesos"
                        tipo="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={texto}
                        disabled={ocupado}
                        error={errorCampo}
                        onChange={(e) => { setTexto(e.target.value); setErrorCampo("") }}
                    />
                    <Boton type="submit" tipo={ocupado ? "deshabilitado" : "primario"}>
                        {ocupado ? "Guardando..." : precio === null || precio === undefined ? "Proponer precio" : "Actualizar precio"}
                    </Boton>
                </form>
            )}

            {puedeAceptar && (
                <Boton tipo={ocupado ? "deshabilitado" : "primario"} onClick={ocupado ? undefined : onAceptar}>
                    {ocupado ? "Aceptando..." : "Aceptar precio"}
                </Boton>
            )}

            {puedePagar && (
                <Boton tipo="primario" onClick={onPagar}>Pagar encargo</Boton>
            )}

            {error && <p className="campo-error body-sm" role="alert">{error}</p>}
            {aviso && <p className="body-sm detalle-confirmacion" role="status">{aviso}</p>}
        </section>
    )
}

export default AcuerdoPrecio
