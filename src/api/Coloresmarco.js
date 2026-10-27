// Traduce el texto libre de color_marco ("Negro", "Madera clara", "Dorado"...) a un
// color que entienda CSS. Si el color no está en la lista se usa un marrón neutro.

const COLORES = [
    ["negro", "#1d1b19"],
    ["blanco", "#f3efe7"],
    ["dorado", "#b8923a"],
    ["oro", "#b8923a"],
    ["plateado", "#b4b8bd"],
    ["plata", "#b4b8bd"],
    ["gris", "#7d7f82"],
    ["caoba", "#5b2a1b"],
    ["nogal", "#4a3323"],
    ["roble", "#a9794a"],
    ["cedro", "#9a5a3a"],
    ["madera", "#8a6140"],
    ["natural", "#c49a6c"],
    ["marron", "#6b4a32"],
    ["bordo", "#6e1230"],
    ["rojo", "#a3262a"],
    ["azul", "#27466e"],
    ["verde", "#2f5a3e"],
    ["beige", "#d8c8a8"],
    ["crema", "#eadfc4"]
]

const NEUTRO = "#6b5a48"

export function colorDeMarco(texto) {
    if (!texto) return NEUTRO

    const limpio = texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    if (/^#[0-9a-f]{3,8}$/.test(limpio)) return limpio

    const encontrado = COLORES.find(([nombre]) => limpio.includes(nombre))
    return encontrado ? encontrado[1] : NEUTRO
}
