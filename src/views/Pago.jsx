// Pago — Área 4 · Compra
// La consigna pide simular el pago: el formulario es la tarjeta misma, se
// escribe encima y se da vuelta para el código. Nada de lo que se escribe
// acá se guarda ni se envía. Lo que sí es real es el POST /api/checkout,
// que descuenta el stock y emite una factura por cada artista.


import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api, lista } from "../api/cliente"
import { getUsuario } from "../api/sesion"
import ResumenTotales from "../components/ResumenTotales"
import Estado from "../components/Estado"
import Boton from "../components/Boton"

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

const Pago = () => {

    const [items, setItems] = useState([])
    const [marca, setMarca] = useState("Visa")
    const [tarjeta, setTarjeta] = useState({ numero: "", titular: "", vencimiento: "", codigo: "" })
    const [girada, setGirada] = useState(false)
    const [errores, setErrores] = useState([])
    const [cargando, setCargando] = useState(true)
    const [pagando, setPagando] = useState(false)
    const [error, setError] = useState("")

    const usuario = getUsuario()
    const navegar = useNavigate()
    const ubicacion = useLocation()

    // El tipo de entrega lo eligió la pantalla anterior y viajó hasta acá.
    // Si alguien entra directo por la URL, se asume envío a domicilio.
    const tipoEntrega = ubicacion.state?.tipoEntrega || "ENVIO_DOMICILIO"

    // El backend cobra $1.500 por envio a domicilio. El retiro por el local no cuesta.
    const envio = tipoEntrega === "ENVIO_DOMICILIO" ? 1500 : 0

    // El primer .then() devuelve el pedido siguiente: los items necesitan el
    // id que trajo el carrito, asi que uno espera al otro.
    useEffect(() => {
        api.get("/api/usuarios/" + usuario.id + "/carrito")
            .then((miCarrito) => api.get("/api/carritos/" + miCarrito.id + "/items"))
            .then((susItems) => setItems(lista(susItems)))
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false))
    }, [])

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

        // Acá no va nada de la tarjeta: solo el tipo de entrega.
        // Quién compra sale del token, igual que en el backend.
        api.post("/api/checkout", { tipo_entrega: tipoEntrega })
            .then((compra) => navegar("/compra/" + compra.id))
            .catch((e) => {
                setError(e.message)
                setPagando(false)
            })
    }

    const subtotal = items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
    const marcos = items.reduce((suma, item) => suma + item.precio_marco * item.cantidad, 0)
    const total = items.reduce((suma, item) => suma + item.subtotal, 0) + envio

    if (cargando) return <div className="seccion"><div className="contenido"><Estado tipo="cargando" /></div></div>

    return (
        <div className="seccion">
            <div className="contenido">

                <h1 className="headline-lg">Pago</h1>
                <p className="body-lg muted" style={{ margin: "var(--xs) 0 var(--xl)" }}>
                    Último paso. Al confirmar se descuenta el stock.
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

                        {error && <div style={{ marginBottom: "var(--md)" }}><Estado tipo="error" mensaje={error} /></div>}

                        <div className="fila">
                            <Boton tipo="secundario" onClick={() => navegar("/checkout")}>Volver</Boton>
                            <span className="cartela-meta">
                                {tipoEntrega === "ENVIO_DOMICILIO" ? "Envío a domicilio" : "Retiro por el local"}
                            </span>
                        </div>
                    </div>

                    <ResumenTotales
                        subtotal={subtotal}
                        marcos={marcos}
                        envio={envio}
                        total={total}
                        boton={pagando ? "Confirmando..." : "Pagar y confirmar"}
                        onBoton={pagando ? undefined : pagar}
                        nota="El pago es una simulación: no se procesa ni se guarda nada." />
                </div>

            </div>
        </div>
    )
}

export default Pago