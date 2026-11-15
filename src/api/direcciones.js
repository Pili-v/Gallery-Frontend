// Direcciones — funciones de apoyo del área de Compra para las direcciones de Georef (la API de direcciones del
// Estado argentino). Los pedidos a Georef los hace direccionesSlice; acá queda solo cómo se lee y se muestra lo que
// devuelve.

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
