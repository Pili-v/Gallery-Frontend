import { useState } from "react"

import ResumenTotales from "./ResumenTotales"
import Estado from "./Estado"
import Boton from "./Boton"

// Cada marca agrupa los digitos distinto y pide un codigo de distinto largo.
// Amex son 15 numeros en grupos de 4-6-5 y el codigo es de 4.
const MARCAS = {
    Visa: { grupos: [4, 4, 4, 4], largoCodigo: 3, clase: "tarjeta-visa" },
    Mastercard: { grupos: [4, 4, 4, 4], largoCodigo: 3, clase: "tarjeta-mastercard" },
    Amex: { grupos: [4, 6, 5], largoCodigo: 4, clase: "tarjeta-amex" }
}

// Funciones puras: con la misma entrada dan siempre la misma salida y no
// tocan el estado. Por eso viven afuera del componente.

const soloDigitos = (texto) => texto.replace(/\D/g, "")

const cuantosDigitos = (marca) => MARCAS[marca].grupos.reduce((suma, largo) => suma + largo, 0)

// Corta y separa los digitos segun los grupos de la marca elegida.
const formatearNumero = (texto, marca) => {
    const digitos = soloDigitos(texto).slice(0, cuantosDigitos(marca))

    const partes = []
    let desde = 0
    for (const largo of MARCAS[marca].grupos) {
        if (desde >= digitos.length) break
        partes.push(digitos.slice(desde, desde + largo))
        desde = desde + largo
    }
    return partes.join(" ")
}

// Los puntitos que se ven mientras el campo esta vacio: •••• •••• •••• ••••
const mascaraDe = (marca) => MARCAS[marca].grupos.map((largo) => "•".repeat(largo)).join(" ")

// Deja el vencimiento como MM/AA y no permite un mes que no existe.
const formatearVencimiento = (texto) => {
    const digitos = soloDigitos(texto).slice(0, 4)
    if (digitos.length === 0) return ""

    let mes = digitos.slice(0, 2)
    if (mes.length === 2 && Number(mes) > 12) mes = "12"
    if (mes.length === 2 && Number(mes) === 0) mes = "01"

    return digitos.length <= 2 ? mes : mes + "/" + digitos.slice(2)
}

// Algoritmo de Luhn, el mismo que usan los bancos: duplica un digito de por
// medio de derecha a izquierda y la suma total tiene que dar multiplo de 10.
// Sirve para descartar un numero inventado sin preguntarle nada a nadie.
const numeroValido = (numero, marca) => {
    const digitos = soloDigitos(numero)
    if (digitos.length !== cuantosDigitos(marca)) return false

    let suma = 0
    for (let i = 0; i < digitos.length; i++) {
        let valor = Number(digitos[digitos.length - 1 - i])
        if (i % 2 === 1) {
            valor = valor * 2
            if (valor > 9) valor = valor - 9
        }
        suma = suma + valor
    }
    return suma % 10 === 0
}

// La pantalla de pago completa: la tarjeta que se escribe encima, la validación y el resumen con el botón.
// La usan el pago del carrito y el de un encargo: lo único que cambia es lo que se paga, que llega por props.
//   titulo, subtitulo: encabezado de la pantalla.
//   subtotal, etiquetaSubtotal, marcos, envio, total, nota: lo que muestra el resumen.
//   onPagar: se llama cuando la tarjeta es válida y tiene que devolver la promesa del pedido al back.
//            Si falla, se muestra el mensaje acá; si sale bien, quien la usa navega a otra pantalla.
//   textoVolver, onVolver, pista: el botón para volver y el texto que va al lado.
//   errorCarga: un error de lo que cargó la pantalla que lo usa, para mostrarlo junto al pago.
const FormularioPago = ({ titulo, subtitulo, subtotal, etiquetaSubtotal, marcos, envio, total, nota, onPagar, textoVolver, onVolver, pista, errorCarga }) => {

    const [marca, setMarca] = useState("Visa")
    const [tarjeta, setTarjeta] = useState({ numero: "", titular: "", vencimiento: "", codigo: "" })
    const [girada, setGirada] = useState(false)
    const [errores, setErrores] = useState([])
    const [pagando, setPagando] = useState(false)
    const [error, setError] = useState("")

    // Un solo manejador para los cuatro campos: cada input dice su nombre y
    // acá se le da el formato que corresponde antes de guardarlo.
    const cambiarCampo = (e) => {
        const { name, value } = e.target

        let valor = value
        if (name === "numero") valor = formatearNumero(value, marca)
        if (name === "vencimiento") valor = formatearVencimiento(value)
        if (name === "codigo") valor = soloDigitos(value).slice(0, MARCAS[marca].largoCodigo)
        if (name === "titular") valor = value.toUpperCase()

        setTarjeta({ ...tarjeta, [name]: valor })
        setErrores([])
    }

    // Al cambiar de marca hay que reagrupar lo ya escrito: Amex no tiene
    // los mismos grupos ni el mismo largo de codigo que Visa.
    const elegirMarca = (nueva) => {
        setMarca(nueva)
        setTarjeta({
            ...tarjeta,
            numero: formatearNumero(tarjeta.numero, nueva),
            codigo: tarjeta.codigo.slice(0, MARCAS[nueva].largoCodigo)
        })
        setErrores([])
    }

    // La tarjeta gira al tocarla, pero no cuando el clic cae en un campo
    // o en un botón: ahí el usuario está escribiendo o eligiendo marca.
    const tocarTarjeta = (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return
        setGirada(!girada)
    }

    const validar = () => {
        const nuevos = []

        if (!numeroValido(tarjeta.numero, marca)) nuevos.push("El número de tarjeta no es válido.")
        if (tarjeta.titular.trim() === "") nuevos.push("Falta el nombre del titular.")
        if (tarjeta.vencimiento.length !== 5) nuevos.push("Falta el vencimiento.")
        if (tarjeta.codigo.length !== MARCAS[marca].largoCodigo) {
            nuevos.push("El código de seguridad es de " + MARCAS[marca].largoCodigo + " dígitos.")
        }

        setErrores(nuevos)
        return nuevos.length === 0
    }

    const pagar = () => {
        if (!validar()) return

        setPagando(true)
        setError("")

        // Acá no va nada de la tarjeta: la simulación termina en la validación.
        onPagar().catch((e) => {
            setError(e.message)
            setPagando(false)
        })
    }

    return (
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg">{titulo}</h1>
                <p className="body-lg muted" style={{ margin: "var(--xs) 0 var(--xl)" }}>
                    {subtitulo}
                </p>

                <div className="dos-columnas">
                    <div>
                        {/* La tarjeta se dibuja con lo que hay en el estado y es el
                            formulario: los campos están encima. Girada muestra el dorso,
                            que es donde va el código en una tarjeta de verdad. */}
                        <div className="tarjeta-escena">
                            <div className={"tarjeta-3d" + (girada ? " girada" : "")} onClick={tocarTarjeta}>

                                <div className={"tarjeta-cara " + MARCAS[marca].clase}>
                                    <div className="tarjeta-arriba">
                                        <div className="tarjeta-chip"></div>

                                        <div className="tarjeta-marcas">
                                            {Object.keys(MARCAS).map((nombre) => (
                                                <button
                                                    key={nombre}
                                                    type="button"
                                                    className={nombre === marca ? "elegida" : ""}
                                                    onClick={() => elegirMarca(nombre)}>
                                                    {nombre}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="tarjeta-campo tarjeta-numero">
                                        <span>Número</span>
                                        <input
                                            className="tarjeta-input"
                                            name="numero"
                                            value={tarjeta.numero}
                                            onChange={cambiarCampo}
                                            autoComplete="off"
                                            inputMode="numeric"
                                            placeholder={mascaraDe(marca)} />
                                    </label>

                                    <div className="tarjeta-abajo">
                                        <label className="tarjeta-campo">
                                            <span>Titular</span>
                                            <input
                                                className="tarjeta-input"
                                                name="titular"
                                                value={tarjeta.titular}
                                                onChange={cambiarCampo}
                                                autoComplete="off"
                                                placeholder="NOMBRE APELLIDO" />
                                        </label>

                                        <label className="tarjeta-campo tarjeta-vence">
                                            <span>Vence</span>
                                            <input
                                                className="tarjeta-input"
                                                name="vencimiento"
                                                value={tarjeta.vencimiento}
                                                onChange={cambiarCampo}
                                                autoComplete="off"
                                                inputMode="numeric"
                                                placeholder="MM/AA" />
                                        </label>

                                        {marca === "Mastercard"
                                            ? <span className="tarjeta-circulos"><i></i><i></i></span>
                                            : <span className="tarjeta-logo">{marca}</span>}
                                    </div>
                                </div>

                                <div className={"tarjeta-cara tarjeta-dorso " + MARCAS[marca].clase}>
                                    <div className="tarjeta-banda"></div>

                                    <label className="tarjeta-cvv">
                                        <span>Código de seguridad</span>
                                        <input
                                            className="tarjeta-input"
                                            name="codigo"
                                            value={tarjeta.codigo}
                                            onChange={cambiarCampo}
                                            autoComplete="off"
                                            inputMode="numeric"
                                            placeholder={"•".repeat(MARCAS[marca].largoCodigo)} />
                                    </label>
                                </div>

                            </div>
                        </div>

                        <p className="tarjeta-pista muted" style={{ marginBottom: "var(--lg)" }}>
                            {girada ? "Tocá la tarjeta para volver al frente." : "Tocá la tarjeta para cargar el código."}
                        </p>

                        {errores.length > 0 && (
                            <div className="tarjeta-errores">
                                {errores.map((texto) => (
                                    <div key={texto} className="campo-error body-sm">{texto}</div>
                                ))}
                            </div>
                        )}

                        {(error || errorCarga) && <div style={{ marginBottom: "var(--md)" }}><Estado tipo="error" mensaje={error || errorCarga} /></div>}

                        <div className="fila">
                            <Boton tipo="secundario" onClick={onVolver}>{textoVolver}</Boton>
                            <span className="cartela-meta">{pista}</span>
                        </div>
                    </div>

                    <ResumenTotales
                        subtotal={subtotal}
                        etiquetaSubtotal={etiquetaSubtotal}
                        marcos={marcos}
                        envio={envio}
                        total={total}
                        boton={pagando ? "Confirmando..." : "Pagar y confirmar"}
                        onBoton={pagando ? undefined : pagar}
                        nota={nota} />
                </div>


            </div>
        </div>
    )
}

export default FormularioPago
