// evaluadorExpresiones.js (Fase 2 Reconstrucción: Solo evaluarLiteral)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = {};

/**
 * Evalúa un texto que se espera sea un literal simple (cadena, número, booleano).
 * No procesa operaciones ni variables en esta fase.
 * @param {string} expresionComoTexto - El texto del literal.
 * @returns {string|number|boolean} El valor JavaScript correspondiente.
 * @throws {Error} si el texto no parece un literal simple reconocible.
 */
Webgoritmo.Expresiones.evaluarLiteral = function(expresionComoTexto) {
    const textoTrim = expresionComoTexto.trim();

    // Booleano
    if (textoTrim.toLowerCase() === "verdadero") return true;
    if (textoTrim.toLowerCase() === "falso") return false;

    // Cadena (debe estar entre comillas)
    if ((textoTrim.startsWith('"') && textoTrim.endsWith('"')) || (textoTrim.startsWith("'") && textoTrim.endsWith("'"))) {
        return textoTrim.substring(1, textoTrim.length - 1); // Quita las comillas
    }

    // Número (Entero o Real)
    // Intenta convertir a número. Si falla, no es un literal numérico simple.
    // Esta regex es para validar números que podrían ser enteros o reales.
    if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(textoTrim)) {
        const num = Number(textoTrim);
        if (!isNaN(num)) { // Comprueba si la conversión fue exitosa
            return num;
        }
    }

    // Si no es ninguno de los anteriores, no es un literal simple reconocible en esta fase.
    // Podría ser un nombre de variable, que `evaluarLiteral` no maneja.
    // El llamador (ej. procesarAsignacion) decidirá qué hacer.
    // Por ahora, para asignación de literales, esto implicaría un error si no es un literal.
    throw new Error(`'${expresionComoTexto}' no es un literal simple (cadena, número o booleano) reconocible.`);
};

// La función principal 'evaluarExpresion' se mantendrá mínima hasta que se necesite
Webgoritmo.Expresiones.evaluarExpresion = async function(expr, scope) {
    console.log(`evaluarExpresion (MÍNIMO FASE 2) llamado con: ${expr}. Intentando evaluar como literal.`);
    try {
        // En Fase 2, la asignación solo usa literales, así que esto debería funcionar para ese caso.
        // Para Escribir, si es un identificador, se manejará en procesarSalidaConsola.
        return Webgoritmo.Expresiones.evaluarLiteral(expr);
    } catch (e) {
        // Si no es un literal, y se espera una expresión más compleja (futuras fases),
        // aquí es donde el evaluador completo actuaría. Por ahora, relanzamos o devolvemos error.
        // console.warn(`Expresión '${expr}' no es un literal simple. Evaluación completa no implementada en Fase 2.`);
        // Devolver un valor que indique que no es un literal podría ser una opción,
        // o dejar que el error se propague si el contexto lo requiere.
        // Para la Fase 2 (asignación de literales), un error aquí es correcto si no es literal.
        throw e;
    }
};

console.log("evaluadorExpresiones.js (Fase 2 Reconstrucción) cargado.");
