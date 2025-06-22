// evaluadorExpresiones.js
// Contiene una versión MVP muy básica de evaluarExpresion.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = Webgoritmo.Expresiones || {};

/**
 * Evalúa una expresión simple (literales numéricos, de cadena, o variables).
 * MVP: No soporta operadores, funciones, ni acceso a arreglos aún.
 * @param {string} expr La expresión como cadena.
 * @param {object} scope El ámbito de variables (ej. Webgoritmo.estadoApp.variables).
 * @returns {any} El valor evaluado.
 * @throws {Error} Si la variable no está definida o la expresión no es reconocida.
 */
Webgoritmo.Expresiones.evaluarExpresion = function(expr, scope) {
    const expresionTrimmed = String(expr).trim();

    // 1. Intentar como literal numérico
    // Cuidado: " " (cadena con espacio) !isNaN es false, pero parseFloat(" ") es NaN.
    // expresionTrimmed !== '' asegura que no intentemos parsear una cadena vacía como número.
    if (expresionTrimmed !== '' && !isNaN(Number(expresionTrimmed))) {
        return parseFloat(expresionTrimmed);
    }

    // 2. Intentar como literal de cadena (quitando comillas)
    // Regex mejorada para manejar comillas escapadas dentro, aunque para el MVP no es crucial.
    let matchCadena = expresionTrimmed.match(/^"((?:\\.|[^"\\])*)"$/);
    if (matchCadena) {
        return matchCadena[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    matchCadena = expresionTrimmed.match(/^'((?:\\.|[^'\\])*)'$/);
    if (matchCadena) {
        return matchCadena[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    }

    // 3. Intentar como literal booleano PSeInt
    const exprLower = expresionTrimmed.toLowerCase();
    if (exprLower === 'verdadero') return true;
    if (exprLower === 'falso') return false;

    // 4. Intentar como nombre de variable
    // PSeInt es sensible a mayúsculas/minúsculas para variables.
    // La regex para nombres de variables en PSeInt es usualmente [a-zA-Z_][a-zA-Z0-9_]*
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expresionTrimmed)) {
        if (scope && scope.hasOwnProperty(expresionTrimmed)) {
            if (scope[expresionTrimmed].hasOwnProperty('value')) {
                return scope[expresionTrimmed].value;
            } else {
                throw new Error(`Variable '${expresionTrimmed}' en el ámbito no tiene propiedad 'value'.`);
            }
        } else {
            // Si parece un nombre de variable pero no está en el scope, es un error de variable no definida.
            throw new Error(`Variable '${expresionTrimmed}' no definida.`);
        }
    }

    // Si no es ninguno de los anteriores, la expresión no es reconocida por esta versión MVP.
    throw new Error(`Expresión '${expresionTrimmed}' no reconocida o sintaxis no soportada en esta versión.`);
};

console.log("evaluadorExpresiones.js cargado y Webgoritmo.Expresiones.evaluarExpresion (MVP) definido.");
