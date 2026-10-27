// Cómo se entrega una compra y cuánto cuesta. El back cobra $1.500 el envío a domicilio y el retiro por el
// local no cuesta (CheckoutServiceImpl): el carrito y el pago lo muestran con esta misma cuenta.

export const ENVIO_DOMICILIO = "ENVIO_DOMICILIO"
export const RETIRO_LOCAL = "RETIRO_LOCAL"

const COSTO_ENVIO_DOMICILIO = 1500

export const costoDeEnvio = (tipoEntrega) => (tipoEntrega === ENVIO_DOMICILIO ? COSTO_ENVIO_DOMICILIO : 0)
