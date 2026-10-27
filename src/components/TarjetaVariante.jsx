import CampoFormulario from "./CampoFormulario"

// La fecha de hoy como la espera un campo de fecha (AAAA-MM-DD), en hora local:
// toISOString usa la hora UTC y de noche daría el día siguiente.
const hoy = () => {
    const ahora = new Date()
    const mes = String(ahora.getMonth() + 1).padStart(2, "0")
    const dia = String(ahora.getDate()).padStart(2, "0")
    return ahora.getFullYear() + "-" + mes + "-" + dia
}

// Una variante de la obra en el formulario: su tamaño, precio, stock y descuento.
// Solo dibuja y avisa los cambios: el estado vive en ObraForm.
// Los min, max y required son los límites obvios; las reglas de negocio las valida el back.
// Los datos de la variante llegan cada uno en su prop: clave, id (null si todavía no se guardó), idTamanio,
// precio, stock, porcentajeDescuento y descuentoHasta. Al cambiar un campo avisa con la clave de la variante.
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
    onCambiar,
    onQuitar
}) => {
    const cambiar = (campo) => (e) => onCambiar(clave, campo, e.target.value)

    return (
        <div style={{ border: "1px solid var(--border)", padding: "var(--md)", marginBottom: "var(--md)" }}>
            <div
                style={{
                    display: "grid",
                    gap: "0 var(--md)",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
                }}
            >
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

                {/* Una variante nueva no puede vencer antes de hoy. En una ya guardada no se exige, para
                    que un descuento vencido no impida guardar otros cambios. El back no lo valida. */}
                <CampoFormulario
                    etiqueta="Descuento hasta"
                    tipo="date"
                    min={id === null ? hoy() : undefined}
                    value={descuentoHasta}
                    onChange={cambiar("descuento_hasta")}
                />
            </div>

            <button
                type="button"
                onClick={() => onQuitar(clave, id)}
                className="body-sm"
                style={{ all: "unset", cursor: "pointer", color: "var(--error)" }}
            >
                Quitar variante
            </button>
        </div>
    )
}

export default TarjetaVariante
