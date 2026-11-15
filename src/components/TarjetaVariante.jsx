import CampoFormulario from "./CampoFormulario"
import Boton from "./Boton"

// La fecha de hoy como la espera un campo de fecha (AAAA-MM-DD), en hora local:
// toISOString usa la hora UTC y de noche daría el día siguiente.
const hoy = () => {
    const ahora = new Date()
    const mes = String(ahora.getMonth() + 1).padStart(2, "0")
    const dia = String(ahora.getDate()).padStart(2, "0")
    return ahora.getFullYear() + "-" + mes + "-" + dia
}

// Una variante de la obra en el formulario: su tamaño, precio, stock y descuento, con su propio botón para guardarla
// (se guarda sola, sin tocar el resto de la obra) y otro para quitarla.
// Solo dibuja y avisa: lo escrito vive en ObraForm y los pedidos en el slice de la obra en edición.
// Los min, max y required son los límites obvios; las reglas de negocio las valida el back.
// Los datos llegan cada uno en su prop: clave, id (null si todavía no se guardó), idTamanio, precio, stock,
// porcentajeDescuento y descuentoHasta. Además:
//   tamanios, usados : los tamaños de lienzo y los que ya usa otra variante (no se repiten)
//   cambiado         : si hay algo escrito que todavía no se guardó (habilita Guardar)
//   guardando, error : el pedido en curso de esta variante y su falla
//   onCambiar(clave, campo, valor), onGuardar(clave), onQuitar(clave)
const TarjetaVariante = ({
    clave,
    id,
    idTamanio,
    precio,
    stock,
    porcentajeDescuento,
    descuentoHasta,
    tamanios,
    usados,
    cambiado,
    guardando,
    error,
    onCambiar,
    onGuardar,
    onQuitar
}) => {
    const cambiar = (campo) => (e) => onCambiar(clave, campo, e.target.value)

    // Cada variante es su propio formulario: Enter o Guardar guardan solo esta.
    const guardar = (e) => {
        e.preventDefault()
        if (!guardando && cambiado) onGuardar(clave)
    }

    return (
        <form className="cartela pad-md mb-md" onSubmit={guardar}>
            <div className="grilla-campos">
                <CampoFormulario
                    etiqueta="Tamaño"
                    tipo="select"
                    required
                    value={idTamanio}
                    onChange={cambiar("id_tamanio")}
                >
                    <option value="">Elegí un tamaño</option>
                    {tamanios.map((tamanio) => (
                        <option key={tamanio.id} value={tamanio.id} disabled={usados.includes(String(tamanio.id))}>
                            {tamanio.nombre_tamanio} · {tamanio.ancho_lienzo} × {tamanio.largo_lienzo} cm
                        </option>
                    ))}
                </CampoFormulario>

                <CampoFormulario
                    etiqueta="Precio ($)"
                    tipo="number"
                    required
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={cambiar("precio_variante")}
                />

                <CampoFormulario
                    etiqueta="Stock"
                    tipo="number"
                    required
                    min="0"
                    step="1"
                    value={stock}
                    onChange={cambiar("stock_variante")}
                />

                <CampoFormulario
                    etiqueta="Descuento (%)"
                    tipo="number"
                    min="0"
                    max="100"
                    step="1"
                    value={porcentajeDescuento}
                    onChange={cambiar("porcentaje_descuento")}
                />

                {/* Con descuento, la fecha de fin es obligatoria. Una variante nueva no puede vencer antes de hoy; en
                    una ya guardada no se exige, para que un descuento vencido no impida guardar otros cambios. */}
                <CampoFormulario
                    etiqueta="Descuento hasta"
                    tipo="date"
                    required={Number(porcentajeDescuento) > 0}
                    min={id === null ? hoy() : undefined}
                    value={descuentoHasta}
                    onChange={cambiar("descuento_hasta")}
                />
            </div>

            {error && <p className="campo-error body-sm mb-sm">{error}</p>}

            <div className="entre">
                <button
                    type="button"
                    onClick={() => onQuitar(clave)}
                    disabled={guardando}
                    className="body-sm boton-texto peligro"
                >
                    Quitar
                </button>
                <Boton type="submit" tipo={cambiado && !guardando ? "primario" : "deshabilitado"}>
                    {guardando ? "Guardando…" : id === null ? "Agregar" : "Guardar"}
                </Boton>
            </div>
        </form>
    )
}

export default TarjetaVariante
