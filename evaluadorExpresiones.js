// evaluadorExpresiones.js
// Contiene la función evaluarExpresion() expandida y sus helpers.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = Webgoritmo.Expresiones || {};

// --- Funciones Helper ---
// Estas funciones deben ser accesibles globalmente por `eval` o estar en el scope de `evaluarExpresion` si se pasan.
// Por simplicidad en el contexto de `eval`, se definen aquí y se asume que `eval` las puede alcanzar.

function pseudoAleatorio(min, max) {
    min = Number(min); // Asegurar que sean números
    max = Number(max);
    if (isNaN(min) || isNaN(max)) throw new Error("Argumentos inválidos para Aleatorio(min,max).");
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
Webgoritmo.Expresiones.pseudoAleatorio = pseudoAleatorio;

function pseudoAzar(n) {
    n = Number(n); // Asegurar que sea número
    if (isNaN(n)) throw new Error("Argumento inválido para Azar(n).");
    return Math.floor(Math.random() * n);
}
Webgoritmo.Expresiones.pseudoAzar = pseudoAzar;

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
    if (i <= 0 || f <= 0) {
        throw new Error("Los argumentos 'inicio' y 'fin' para Subcadena deben ser positivos (1-indexed).");
    }
    if (i > f + 1) { // PSeInt: si inicio > fin, resultado es cadena vacía. +1 para permitir subcadena de 1 char (inicio=fin)
      return "";
    }
    // PSeInt: inicio y fin son 1-based e inclusivos.
    // JS substring(startIndex, endIndex): startIndex es 0-based, endIndex es 0-based y exclusivo.
    return s.substring(i - 1, f);
}
Webgoritmo.Expresiones.__pseudoSubcadena = __pseudoSubcadena;

// --- Fin Funciones Helper ---

Webgoritmo.Expresiones.evaluarExpresion = function(expr, scope) {
    let processedExpr = String(expr).trim();
    const originalExpr = processedExpr;

    // 1. MANEJO DE ACCESO DIRECTO A ARREGLOS (MULTIDIMENSIONAL)
    const directArrayAccessMatch = processedExpr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(.+?)\s*\]$/);
    if (directArrayAccessMatch) {
        const arrName = directArrayAccessMatch[1];
        const indexPart = directArrayAccessMatch[2].trim();

        if (scope.hasOwnProperty(arrName) && scope[arrName] && scope[arrName].type === 'array') {
            const arrayData = scope[arrName];
            const indicesExpr = indexPart.split(',').map(e => e.trim());
            const indicesValue = [];

            if (!arrayData.dimensions || indicesExpr.length !== arrayData.dimensions.length) {
                throw new Error(`Número incorrecto de dimensiones para acceder al arreglo '${arrName}'. Se esperaban ${arrayData.dimensions ? arrayData.dimensions.length : '1 (o desconocido)'}, se dieron ${indicesExpr.length}.`);
            }

            for (let k = 0; k < indicesExpr.length; k++) {
                let idxVal;
                try {
                    idxVal = Webgoritmo.Expresiones.evaluarExpresion(indicesExpr[k], scope);
                } catch (e) { throw new Error(`Error evaluando índice ${k+1} ("${indicesExpr[k]}") para arreglo '${arrName}': ${e.message}`); }
                if (typeof idxVal !== 'number' || !Number.isInteger(idxVal)) { throw new Error(`Índice ${k+1} para arreglo '${arrName}' debe ser entero. Se obtuvo: "${idxVal}" de "${indicesExpr[k]}".`); }
                if (idxVal <= 0 || idxVal > arrayData.dimensions[k]) { throw new Error(`Índice ${idxVal} en dimensión ${k+1} fuera de límites para arreglo '${arrName}' (válido: 1 a ${arrayData.dimensions[k]}).`); }
                indicesValue.push(idxVal);
            }
            let valorActual = arrayData.value;
            for (const indice of indicesValue) {
                if (valorActual && valorActual[indice] !== undefined) { valorActual = valorActual[indice]; }
                else { throw new Error(`Error accediendo al elemento del arreglo '${arrName}' con índices [${indicesValue.join(', ')}].`); }
            }
            return valorActual;
        } else if (scope.hasOwnProperty(arrName) && scope[arrName] && scope[arrName].type !== 'array') {
             throw new Error(`Variable "${arrName}" no es un arreglo y no puede ser accedida con índice.`);
        }
    }

    // 2. MANEJO DE LITERALES
    if (processedExpr.toLowerCase() === 'verdadero') return true;
    if (processedExpr.toLowerCase() === 'falso') return false;

    let matchCadenaLit = processedExpr.match(/^"((?:\\.|[^"\\])*)"$/);
    if (matchCadenaLit) return matchCadenaLit[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    matchCadenaLit = processedExpr.match(/^'((?:\\.|[^'\\])*)'$/);
    if (matchCadenaLit) return matchCadenaLit[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');

    if (processedExpr.trim() !== '' && !isNaN(Number(processedExpr.trim()))) {
        return parseFloat(processedExpr.trim());
    }

    // 3. REEMPLAZO DE OPERADORES Y FUNCIONES PSeInt A JS
    processedExpr = processedExpr
        .replace(/<\s*>/g, ' != ') // Usar espacios para asegurar separación
        .replace(/>\s*=/g, ' >= ')
        .replace(/<\s*=/g, ' <= ')
        .replace(/(?<![<|>|!|(=)])=(?![=|>])/g, ' == '); //  Igualdad simple, con cuidado

    processedExpr = processedExpr
        .replace(/\bY\b/gi, ' && ')
        .replace(/\bO\b/gi, ' || ')
        .replace(/\bNO\b/gi, ' ! ') // NO con espacio para evitar que "nombre" se convierta en "!mbre"
        .replace(/\bMOD\b/gi, ' % ')
        .replace(/\^/g, '**')
        .replace(/\bDIV\b/gi, ' / '); // DIV se trata como / (división flotante)

    processedExpr = processedExpr
        .replace(/\bAbs\s*\(([^)]+)\)/gi, 'Math.abs($1)')
        .replace(/\bRC\s*\(([^)]+)\)/gi, 'Math.sqrt($1)')
        .replace(/\bAleatorio\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'pseudoAleatorio($1, $2)')
        .replace(/\bAleatorio\s*\(([^)]+)\)/gi, '(Math.floor(Math.random() * Number($1)) + 1)')
        .replace(/\bAzar\s*\(([^)]+)\)/gi, 'pseudoAzar(Number($1))')
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
        .replace(/\bSubcadena\s*\(([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi, '__pseudoSubcadena($1,$2,$3)');

    // 4. REEMPLAZO DE VARIABLES
    let tempProcessedExpr = processedExpr;
    const nombresVarOrdenados = Object.keys(scope).sort((a, b) => b.length - a.length);
    for (const nombreVar of nombresVarOrdenados) {
        if (scope.hasOwnProperty(nombreVar) && scope[nombreVar] && typeof scope[nombreVar] === 'object' && scope[nombreVar].hasOwnProperty('value')) {
            const regex = new RegExp(`\\b${nombreVar}\\b`, 'g');
            let valorVar = scope[nombreVar].value;

            if (scope[nombreVar].type === 'array') {
                 // No se stringifica aquí, se maneja en acceso directo o se pasa como objeto a funciones PSeInt.
                 // Si una función JS espera un array, esto es un problema.
                 // Por ahora, para PSeInt, no reemplazamos el nombre de la variable array con su contenido JSON.
                 // Esto significa que una expresión como `miArray + algo` fallaría, lo cual es correcto.
            } else if (typeof valorVar === 'string') {
                valorVar = `'${valorVar.replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`; // Escapar comillas y saltos de línea
            } else if (typeof valorVar === 'boolean') {
                valorVar = String(valorVar);
            }
            // Solo reemplazar si no es un array, o si es un array y se decide una estrategia específica
            if (scope[nombreVar].type !== 'array') {
                 tempProcessedExpr = tempProcessedExpr.replace(regex, String(valorVar));
            }
        }
    }
    processedExpr = tempProcessedExpr;

    // 5. EVALUAR
    try {
        // eslint-disable-next-line no-eval
        let resultado = eval(processedExpr);
        return resultado;
    } catch (e) {
        console.error(`Error evaluando: "${originalExpr}" -> "${processedExpr}"`, e);
        // Intentar identificar si es una variable no definida que no se reemplazó
        // (esto es heurístico y puede no ser perfecto)
        const posiblesVariablesNoDefinidas = processedExpr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
        if (posiblesVariablesNoDefinidas) {
            for (const pv of posiblesVariablesNoDefinidas) {
                if (isNaN(pv) && !scope.hasOwnProperty(pv) && !window.hasOwnProperty(pv) && !Math.hasOwnProperty(pv.split('(')[0]) && !['true', 'false', 'null', 'undefined'].includes(pv.toLowerCase())) {
                     throw new Error(`Variable no definida o expresión mal formada cerca de: '${pv}'.`);
                }
            }
        }
        throw new Error(`Expresión inválida: "${originalExpr}". Detalle: ${e.message}`);
    }
};

console.log("evaluadorExpresiones.js cargado y Webgoritmo.Expresiones.evaluarExpresion (expandido) definido.");
