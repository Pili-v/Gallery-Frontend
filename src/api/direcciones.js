// Direcciones — módulo de apoyo del área de Compra.
// Habla con Georef, la API de direcciones del Estado argentino (apis.datos.gob.ar):
// es publica, gratuita y no pide clave.
//
// No pasa por cliente.js a proposito: ese modulo apunta a nuestro backend y le
// agrega el token JWT a cada pedido. Georef es un tercero y no tiene por que
// recibir nuestras credenciales.

const GEOREF = "https://apis.datos.gob.ar/georef/api"

// Lo unico que no se puede pedir a ninguna API: como escribe la gente.
const ALIAS = {
    caba: "ciudad autonoma de buenos aires",
    "capital federal": "ciudad autonoma de buenos aires",
    "bs as": "buenos aires"
}

const sinAcentos = (texto) =>
    texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()

// Las 24 provincias salen de la misma API que despues valida la direccion,
// asi no hay una lista escrita a mano que se pueda desactualizar.
// Si Georef no responde, devuelve [] y la busqueda sigue andando a nivel pais.
export const traerProvincias = () =>
    fetch(GEOREF + "/provincias?campos=nombre&max=30")
        .then((respuesta) => respuesta.json())
        .then((datos) => datos.provincias ?? [])
        .catch(() => [])

// "Florida 500, CABA" -> { calle: "Florida 500", provincia: "Ciudad Autonoma...", desconocida: "" }
// Sin coma, busca en todo el pais. Si lo de despues de la coma no es una
// provincia, se devuelve en "desconocida" para poder avisarlo en pantalla.
export const separarZona = (texto, provincias) => {
    const partes = texto.split(",")
    if (partes.length < 2) return { calle: texto.trim(), provincia: "", desconocida: "" }

    const calle = partes.slice(0, -1).join(",").trim()
    const ultima = partes[partes.length - 1].trim()
    const buscada = ALIAS[sinAcentos(ultima)] ?? sinAcentos(ultima)
    const encontrada = provincias.find((p) => sinAcentos(p.nombre) === buscada)

    if (encontrada) return { calle, provincia: encontrada.nombre, desconocida: "" }
    return { calle, provincia: "", desconocida: ultima }
}

// El texto que se ve en cada opcion del desplegable y queda en el campo.
export const textoDeDireccion = (sugerida) => {
    const altura = sugerida.altura?.valor ? " " + sugerida.altura.valor : ""
    const provincia = sugerida.provincia.nombre
    const lugar = sugerida.localidad_censal?.nombre ?? sugerida.departamento?.nombre ?? ""
    // En CABA la localidad y la provincia se llaman igual: no la repetimos.
    const zona = lugar && lugar !== provincia ? ", " + lugar : ""
    return sugerida.calle.nombre + altura + zona + ", " + nombreCorto(provincia)
}

// Como se muestra el nombre de una provincia en pantalla.
export const nombreCorto = (provincia) => (provincia === "Ciudad Autónoma de Buenos Aires" ? "CABA" : provincia)

// Busca direcciones. Con provincia acota a esa; sin provincia, todo el pais.
// Georef devuelve la misma calle una vez por tramo: se deja una sola.
export const buscarDirecciones = (calle, provincia) => {
    const url =
        GEOREF +
        "/direcciones?max=8&direccion=" +
        encodeURIComponent(calle) +
        (provincia ? "&provincia=" + encodeURIComponent(provincia) : "")

    return fetch(url)
        .then((respuesta) => respuesta.json())
        .then((datos) => {
            const encontradas = datos.direcciones ?? []
            const textos = encontradas.map(textoDeDireccion)
            return encontradas.filter((sugerida, indice) => textos.indexOf(textos[indice]) === indice)
        })
        .catch(() => [])
}
