// Precios en pesos argentinos con punto de miles: $ 340.000
export const pesos = (valor) => {
    if (valor === null || valor === undefined) return ""
    return "$ " + Number(valor).toLocaleString("es-AR", { maximumFractionDigits: 0 })
}

// Las fotos viven en Cloudinary y el back guarda solo su URL. Cloudinary arma variantes con solo
// cambiar la URL: acá se agrega f_auto,q_auto (el mejor formato y calidad para cada navegador) y,
// si se pasa un ancho, c_limit,w_<ancho> (se achica pero nunca se agranda). Una URL que no es de
// Cloudinary (o null) se devuelve tal cual.
export const optimizada = (url, ancho) => {
    if (!url || !url.includes("/image/upload/")) return url
    const cambios = "f_auto,q_auto" + (ancho ? ",c_limit,w_" + ancho : "")
    return url.replace("/image/upload/", "/image/upload/" + cambios + "/")
}

// La imagen de portada de una obra: la de menor orden_imagen (1 = la principal). Devuelve null si
// la obra no tiene imágenes con URL.
export const portadaDe = (imagenes, obraId) => {
    let portada = null
    imagenes.forEach((imagen) => {
        if (imagen.obra_id !== obraId || !imagen.url) return
        if (portada === null || imagen.orden_imagen < portada.orden_imagen) portada = imagen
    })
    return portada
}

// Fechas como 27/09/2026
export const fecha = (valor) => {
    if (!valor) return ""
    return new Date(valor).toLocaleDateString("es-AR")
}

// Comparar nombres sin distinguir tildes, mayusculas ni espacios en los extremos.
export const normalizarNombre = (texto) =>
    texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
