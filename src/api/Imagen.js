// Prepara una imagen antes de subirla, para que siempre se vea bien en la página.
// Se usa en el formulario de obra (Área 5), justo antes de armar el FormData:
//
//   const lista = await prepararImagen(archivoElegido)
//   formData.append("archivo", lista)
//
// Qué resuelve:
// - Una foto de 8000 px y varios MB se achica a 1600 px de lado mayor. Se ve igual de bien,
//   pesa una fracción y sube más rápido a Cloudinary.
// - Una imagen demasiado chica se rechaza con un mensaje claro: estirada se ve borrosa
//   y no hay forma de arreglarlo después.
// - Todas quedan en JPEG.
// - Respeta la rotación de las fotos sacadas con el celular.

export async function prepararImagen(archivo, { maxLado = 1600, minLado = 600, calidad = 0.85 } = {}) {
    if (!archivo || !archivo.type.startsWith("image/")) {
        throw new Error("El archivo elegido no es una imagen.")
    }

    let imagen
    try {
        imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" })
    } catch {
        throw new Error("No se pudo leer la imagen. Probá con un JPG o PNG.")
    }

    const ladoMayor = Math.max(imagen.width, imagen.height)
    if (ladoMayor < minLado) {
        // El ancho y el alto se leen antes de cerrar la imagen: después valen 0.
        const medidas = imagen.width + " × " + imagen.height
        imagen.close()
        throw new Error(
            "La imagen es muy chica (" + medidas + " px) y se vería borrosa. " +
            "Subí una de al menos " + minLado + " px de lado."
        )
    }

    // Solo se achica: una imagen que ya entra en el límite no se toca.
    const escala = Math.min(1, maxLado / ladoMayor)
    const ancho = Math.round(imagen.width * escala)
    const alto = Math.round(imagen.height * escala)

    const lienzo = document.createElement("canvas")
    lienzo.width = ancho
    lienzo.height = alto

    const contexto = lienzo.getContext("2d")
    // Fondo blanco: un PNG con transparencia pasaría a negro al convertirlo a JPEG.
    contexto.fillStyle = "#ffffff"
    contexto.fillRect(0, 0, ancho, alto)
    contexto.imageSmoothingQuality = "high"
    contexto.drawImage(imagen, 0, 0, ancho, alto)
    imagen.close()

    const blob = await new Promise((resolver) => lienzo.toBlob(resolver, "image/jpeg", calidad))
    if (!blob) throw new Error("No se pudo procesar la imagen.")

    const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], nombre, { type: "image/jpeg" })
}