// evaluadorExpresiones.js
// Contiene la función evaluarExpresion() y sus helpers directos.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = Webgoritmo.Expresiones || {};

// Estas funciones helper son usadas por las cadenas de reemplazo en evaluarExpresion
// y necesitan ser accesibles en el scope donde eval() se ejecuta.
// Definirlas globalmente o en el mismo scope que la llamada a eval() es lo más simple.
function pseudoAleatorio(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pseudoAzar(n) {
    return Math.floor(Math.random() * n);
}

// También las asignamos al namespace para posible acceso directo estructurado
Webgoritmo.Expresiones.pseudoAleatorio = pseudoAleatorio;
Webgoritmo.Expresiones.pseudoAzar = pseudoAzar;


// Funciones de cadena y conversión (conceptualizadas en un paso anterior)
// Deben estar disponibles para las reglas de reemplazo en evaluarExpresion.
function __pseudoLongitud(cadena) {
    if (cadena === null || cadena === undefined) throw new Error("Argumento inválido para Longitud (nulo o indefinido).");
    return String(cadena).length;
}
Webgoritmo.Expresiones.__pseudoLongitud = __pseudoLongitud;

function __pseudoMayusculas(cadena) {
    if (cadena === null || cadena === undefined) throw new Error("Argumento inválido para Mayusculas (nulo o indefinido).");
    return String(cadena).toUpperCase();
}
Webgoritmo.Expresiones.__pseudoMayusculas = __pseudoMayusculas;

function __pseudoMinusculas(cadena) {
    if (cadena === null || cadena === undefined) throw new Error("Argumento inválido para Minusculas (nulo o indefinido).");
    return String(cadena).toLowerCase();
}
Webgoritmo.Expresiones.__pseudoMinusculas = __pseudoMinusculas;

function __pseudoConvertirATexto(valor) {
    if (valor === null || valor === undefined) return "nulo";
    if (typeof valor === 'boolean') return valor ? "Verdadero" : "Falso";
    return String(valor);
}
Webgoritmo.Expresiones.__pseudoConvertirATexto = __pseudoConvertirATexto;

function __pseudoConvertirANumero(cadena) {
    if (cadena === null || cadena === undefined) throw new Error("Argumento inválido para ConvertirANumero (nulo o indefinido).");
    const str = String(cadena).trim();
    if (str === "") throw new Error("No se puede convertir una cadena vacía a número.");
    const num = Number(str);
    if (isNaN(num)) throw new Error(`La cadena '${str}' no se puede convertir a un número válido.`);
    return num;
}
Webgoritmo.Expresiones.__pseudoConvertirANumero = __pseudoConvertirANumero;

function __pseudoSubcadena(cadena, inicio, fin) {
    if (cadena === null || cadena === undefined) throw new Error("Argumento 'cadena' inválido para Subcadena.");
    const s = String(cadena);
    const i = Number(inicio);
    const f = Number(fin);

    if (isNaN(i) || isNaN(f) || !Number.isInteger(i) || !Number.isInteger(f)) {
        throw new Error("Los argumentos 'inicio' y 'fin' para Subcadena deben ser enteros.");
    }
    if (i <= 0 || f <= 0) { // PSeInt es 1-indexed
        throw new Error("Los argumentos 'inicio' y 'fin' para Subcadena deben ser positivos.");
    }
    if (i > f + 1) { // Si inicio está más allá del final + 1 (para permitir subcadena de 1 char donde inicio=fin)
      return "";
    }
    // Corregir: PSeInt fin es inclusivo. JS substring/slice fin es exclusivo.
    // inicio 1-based a 0-based: i-1
    // fin 1-based inclusivo a 0-based exclusivo: f
    return s.substring(i - 1, f);
}
Webgoritmo.Expresiones.__pseudoSubcadena = __pseudoSubcadena;


Webgoritmo.Expresiones.evaluarExpresion = function(expr, scope) {
    let processedExpr = String(expr).trim();
    const originalExpr = processedExpr;

    const directArrayAccessMatch = processedExpr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(.+?)\s*\]$/);
    if (directArrayAccessMatch) {
        const arrName = directArrayAccessMatch[1];
        const indexPart = directArrayAccessMatch[2].trim();

        // El scope pasado es usualmente Webgoritmo.estadoApp.variables o un ambitoFuncion
        if (scope.hasOwnProperty(arrName) && scope[arrName] && scope[arrName].type === 'array') {
            const arrayData = scope[arrName];
            const indicesExpr = indexPart.split(',').map(e => e.trim());
            const indicesValue = [];

            if (!arrayData.dimensions || indicesExpr.length !== arrayData.dimensions.length) {
                throw new Error(`Número incorrecto de dimensiones para acceder al arreglo '${arrName}'. Se esperaban ${arrayData.dimensions ? arrayData.dimensions.length : 'desconocidas/1'}, se dieron ${indicesExpr.length}.`);
            }

            for (let k = 0; k < indicesExpr.length; k++) {
                let idxVal;
                try {
                    idxVal = Webgoritmo.Expresiones.evaluarExpresion(indicesExpr[k], scope); // Llamada recursiva
                } catch (e) {
                    throw new Error(`Error evaluando índice ${k+1} ("${indicesExpr[k]}") para arreglo '${arrName}': ${e.message}`);
                }
                if (typeof idxVal !== 'number' || !Number.isInteger(idxVal)) {
                    throw new Error(`Índice ${k+1} para arreglo '${arrName}' debe ser entero. Se obtuvo: "${idxVal}" de "${indicesExpr[k]}".`);
                }
                if (idxVal <= 0 || idxVal > arrayData.dimensions[k]) {
                    throw new Error(`Índice ${idxVal} en dimensión ${k+1} fuera de límites para arreglo '${arrName}' (válido: 1 a ${arrayData.dimensions[k]}).`);
                }
                indicesValue.push(idxVal);
            }

            let valorActual = arrayData.value;
            for (const indice of indicesValue) {
                if (valorActual && valorActual[indice] !== undefined) {
                    valorActual = valorActual[indice];
                } else {
                    throw new Error(`Error accediendo al elemento del arreglo '${arrName}' con índices [${indicesValue.join(', ')}].`);
                }
            }
            return valorActual;
        } else if (scope.hasOwnProperty(arrName) && scope[arrName] && scope[arrName].type !== 'array') {
             throw new Error(`Variable "${arrName}" es not an array and cannot be accessed with an index.`);
        }
    }

    if (processedExpr.toLowerCase() === 'verdadero') return true;
    if (processedExpr.toLowerCase() === 'falso') return false;
    const coincidenciaCadena = processedExpr.match(/^"(.*)"$|^'(.*)'$/);
    if (coincidenciaCadena) return coincidenciaCadena[1] !== undefined ? coincidenciaCadena[1] : coincidenciaCadena[2];
    if (!isNaN(processedExpr) && processedExpr.trim() !== '') return parseFloat(processedExpr);

    processedExpr = processedExpr
        .replace(/<\s*>/g, '__PSEINT_NEQ__')
        .replace(/>\s*=/g, '__PSEINT_GTE__')
        .replace(/<\s*=/g, '__PSEINT_LTE__');
    processedExpr = processedExpr.replace(/(?<!=)==(?!=)/g, '=='); // Evitar convertir === a ====
    processedExpr = processedExpr.replace(/(?<![<|>|!|(=)])=(?![=|>])/g, '=='); // Solo reemplazar '=' si no es parte de otro operador


    processedExpr = processedExpr
        .replace(/__PSEINT_NEQ__/g, '!=')
        .replace(/__PSEINT_GTE__/g, '>=')
        .replace(/__PSEINT_LTE__/g, '<=');

    processedExpr = processedExpr
        .replace(/\bY\b/gi, '&&')
        .replace(/\bO\b/gi, '||')
        .replace(/\bNo\b/gi, '!')
        .replace(/\bMod\b/gi, '%') // Reemplazar Mod textual con %
        .replace(/\^/g, '**')    // Exponenciación
        .replace(/\bDiv\b/gi, '/');

    // Reemplazos para funciones PSeInt a helpers JS (que deben ser globales o accesibles por eval)
    processedExpr = processedExpr
        .replace(/\bAbs\s*\(([^)]+)\)/gi, 'Math.abs($1)')
        .replace(/\bRC\s*\(([^)]+)\)/gi, 'Math.sqrt($1)')
        .replace(/\bAleatorio\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'pseudoAleatorio($1, $2)')
        .replace(/\bAleatorio\s*\(([^)]+)\)/gi, '(Math.floor(Math.random() * ($1)) + 1)')
        .replace(/\bAzar\s*\(([^)]+)\)/gi, 'pseudoAzar($1)')
        .replace(/\bAZAR\b/gi, 'Math.random()')
        .replace(/\bRedon\s*\(([^)]+)\)/gi, 'Math.round($1)')
        .replace(/\bTrunc\s*\(([^)]+)\)/gi, 'Math.trunc($1)')
        .replace(/\bSen\s*\(([^)]+)\)/gi, 'Math.sin($1)')
        .replace(/\bCos\s*\(([^)]+)\)/gi, 'Math.cos($1)')
        .replace(/\bTan\s*\(([^)]+)\)/gi, 'Math.tan($1)')
        .replace(/\bLn\s*\(([^)]+)\)/gi, 'Math.log($1)')
        .replace(/\bExp\s*\(([^)]+)\)/gi, 'Math.exp($1)')
        .replace(/\bLongitud\s*\(([^)]+)\)/gi, '__pseudoLongitud($1)')
        .replace(/\bMayusculas\s*\(([^)]+)\)/gi, '__pseudoMayusculas($1)')
        .replace(/\bMinusculas\s*\(([^)]+)\)/gi, '__pseudoMinusculas($1)')
        .replace(/\bConvertirATexto\s*\(([^)]+)\)/gi, '__pseudoConvertirATexto($1)')
        .replace(/\bConvertirANumero\s*\(([^)]+)\)/gi, '__pseudoConvertirANumero($1)')
        .replace(/\bSubcadena\s*\(([^,]+),([^,]+),([^)]+)\)/gi, '__pseudoSubcadena($1,$2,$3)');

    let tempProcessedExpr = processedExpr;
    const nombresVarOrdenados = Object.keys(scope).sort((a, b) => b.length - a.length);
    for (const nombreVar of nombresVarOrdenados) {
        if (scope[nombreVar] && typeof scope[nombreVar] === 'object' && scope[nombreVar].hasOwnProperty('value')) {
            const regex = new RegExp(`\\b${nombreVar}\\b`, 'g');
            let valorVar = scope[nombreVar].value;
            if (scope[nombreVar].type === 'array') {
                // No stringificar si la expresión original era un acceso directo a array, ya manejado.
                // Esta parte es para cuando el nombre del array se usa en otro contexto.
                // La lógica de stringify puede ser problemática si se espera el objeto array.
                // Por ahora, se mantiene como estaba para la sustitución general.
                valorVar = JSON.stringify(valorVar);
            } else if (typeof valorVar === 'string') {
                valorVar = `'${valorVar.replace(/'/g, "\\'")}'`;
            } else if (typeof valorVar === 'boolean') {
                valorVar = String(valorVar);
            }
            tempProcessedExpr = tempProcessedExpr.replace(regex, valorVar);
        }
    }
    processedExpr = tempProcessedExpr;

    try {
        // eslint-disable-next-line no-eval
        let resultado = eval(processedExpr);
        return resultado;
    } catch (e) {
        throw new Error(`Expresión inválida: "${originalExpr}" (evaluada como "${processedExpr}") -> ${e.message}`);
    }
};
