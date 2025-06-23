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
    if (i <= 0 || f <= 0) { // PSeInt es 1-indexed
        throw new Error("Los argumentos 'inicio' y 'fin' para Subcadena deben ser positivos (1-indexed).");
    }
    // PSeInt: fin es inclusivo. JS substring/slice fin es exclusivo.
    // inicio 1-based a 0-based: i-1
    // fin 1-based inclusivo a 0-based exclusivo para slice/substring: f
    if (i > f + 1 && i > s.length) { // Si inicio está más allá del final o de la longitud de la cadena
        return "";
    }
    if (i > f) { // Si inicio es mayor que fin (ej. Subcadena("hola", 3, 2)) PSeInt devuelve ""
        return "";
    }
    return s.substring(i - 1, f);
}
Webgoritmo.Expresiones.__pseudoSubcadena = __pseudoSubcadena;

// --- Fin Funciones Helper ---

Webgoritmo.Expresiones.evaluarExpresion = function(expr, scope) {
    // ULTRA DEBUG: Ver la entrada cruda a la función.
    console.log(`ULTRA DEBUG evalExpr: expr CRUDA = "${expr}" (length: ${expr ? expr.length : 'N/A'}) | typeof: ${typeof expr} | JSON: ${JSON.stringify(expr)}`);
    let processedExpr = String(expr).trim();
    const originalExpr = processedExpr;
    console.log(`ULTRA DEBUG evalExpr: originalExpr (después de trim) = "${originalExpr}"`);

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
                else { throw new Error(`Error accediendo al elemento del arreglo '${arrName}' con índices [${indicesValue.join(', ')}]. Estructura interna o índice podrían ser inválidos.`); }
            }
            return valorActual;
        } else if (scope.hasOwnProperty(arrName) && scope[arrName] && scope[arrName].type !== 'array') {
             throw new Error(`Variable "${arrName}" no es un arreglo y no puede ser accedida con índice.`);
        }
        // Si no es un arreglo conocido, o el nombre no está en el scope,
        // se deja que el resto de la lógica lo maneje (podría ser una función, etc.)
    }

    // 2. MANEJO DE LITERALES
    if (processedExpr.toLowerCase() === 'verdadero') return true;
    if (processedExpr.toLowerCase() === 'falso') return false;

    // Si la expresión original es un literal de cadena, devolver su contenido directamente.
    // Esto es más seguro y evita problemas con eval() para cadenas simples.
    let matchCadenaOriginal = originalExpr.match(/^"((?:\\.|[^"\\])*)"$/);
    if (matchCadenaOriginal) {
        console.log(`ULTRA DEBUG evalExpr: Detectado literal de cadena DOBLE: ${JSON.stringify(matchCadenaOriginal)}`);
        return matchCadenaOriginal[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    matchCadenaOriginal = originalExpr.match(/^'((?:\\.|[^'\\])*)'$/);
    if (matchCadenaOriginal) {
        console.log(`ULTRA DEBUG evalExpr: Detectado literal de cadena SIMPLE: ${JSON.stringify(matchCadenaOriginal)}`);
        return matchCadenaOriginal[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    }
    // Si no es un literal de cadena reconocido directamente por originalExpr, loguear y continuar con el procesamiento.
    console.log(`ULTRA DEBUG evalExpr: NO detectado como literal de cadena simple/doble. originalExpr="${originalExpr}"`);

    // Es importante que este chequeo de número sea robusto y no convierta erróneamente
    // identificadores que podrían empezar con números o contener 'e' (notación científica).
    // El `trim()` es importante. `Number()` es más estricto que `parseFloat` para cadenas vacías o solo espacios.
    const trimmedForNumCheck = processedExpr.trim();
    if (trimmedForNumCheck !== '' && !isNaN(Number(trimmedForNumCheck))) {
        // Adicionalmente, verificar que no sea un identificador válido que casualmente es parseable como número.
        // Esto es complejo. Por ahora, confiamos en !isNaN(Number(...)) para la mayoría de los casos.
        // PSeInt no tiene hexadecimales ni octales que podrían confundir.
        if (!/^[a-zA-Z_]/.test(trimmedForNumCheck)) { // No empezar con letra o _, si es así, es variable
             return parseFloat(trimmedForNumCheck);
        }
    }

    // 3. REEMPLAZO DE OPERADORES Y FUNCIONES PSeInt A JS
    // Guardar operandos de cadenas antes de reemplazar operadores que podrían estar en ellas
    const stringLiterals = [];
    let tempExprForStrings = processedExpr;
    tempExprForStrings = tempExprForStrings.replace(/"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g, function(match, p1, p2) {
        stringLiterals.push(match);
        return `__STRING_LITERAL_${stringLiterals.length - 1}__`;
    });
    processedExpr = tempExprForStrings;

    // Orden de reemplazo de operadores es importante
    processedExpr = processedExpr
        .replace(/<\s*>/g, ' != ')
        .replace(/>\s*=/g, ' >= ')
        .replace(/<\s*=/g, ' <= ');

    // Reemplazo cuidadoso de '=' para evitar afectar '==', '<=', '>='
    // Se busca un '=' que no esté precedido por '<', '>', '!' o '=' y no esté seguido por '='.
    processedExpr = processedExpr.replace(/(?<![<>\!=\(])=(?!=)/g, ' == ');


    processedExpr = processedExpr
        .replace(/\bY\b/gi, ' && ')
        .replace(/\bO\b/gi, ' || ')
        // Para NO, asegurarse de que no esté pegado a una palabra, ej. "NOTA" vs "NO TA"
        .replace(/(^|\s)\bNO\b(\s|$|\()/gi, '$1 ! $2') // Maneja NO al inicio, con espacios, o antes de (
        .replace(/\bMOD\b/gi, ' % ')
        .replace(/\^/g, '**')
        .replace(/\bDIV\b/gi, ' / ');

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

    // Restaurar literales de cadena
    processedExpr = processedExpr.replace(/__STRING_LITERAL_(\d+)__/g, function(match, index) {
        return stringLiterals[parseInt(index)];
    });

    // 4. REEMPLAZO DE VARIABLES
    let tempProcessedExprForVars = processedExpr;
    const nombresVarOrdenados = Object.keys(scope).sort((a, b) => b.length - a.length);
    for (const nombreVar of nombresVarOrdenados) {
        if (scope.hasOwnProperty(nombreVar) && scope[nombreVar] && typeof scope[nombreVar] === 'object' && scope[nombreVar].hasOwnProperty('value')) {
            const regex = new RegExp(`\\b${nombreVar}\\b`, 'g');
            let valorVar = scope[nombreVar].value;

            if (scope[nombreVar].type === 'array') {
                // Los arrays no se reemplazan por su valor JSON aquí para eval,
                // ya que el acceso directo a elementos se maneja al principio.
                // Si un nombre de array aparece solo en una expresión que eval va a procesar,
                // se dejaría como está y eval probablemente daría error si no es un contexto válido.
                // Esto es más seguro que stringificarlo y que eval intente operar sobre el string.
                // NO HACER NADA CON valorVar para arrays aquí.
            } else if (typeof valorVar === 'string') {
                // Se stringifican con comillas simples para que eval los trate como string literal.
                // Las comillas internas deben escaparse.
                valorVar = `'${valorVar.replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;
            } else if (typeof valorVar === 'boolean') {
                valorVar = String(valorVar); // 'true' o 'false'
            } else if (valorVar === null) {
                valorVar = 'null';
            } else if (valorVar === undefined) {
                valorVar = 'undefined'; // Aunque PSeInt no maneja undefined
            }
            // Los números se convierten a string por String(valorVar) si es necesario.

            // Solo reemplazar si no es un array.
            if (scope[nombreVar].type !== 'array') {
                 tempProcessedExprForVars = tempProcessedExprForVars.replace(regex, String(valorVar));
            }
        }
    }
    processedExpr = tempProcessedExprForVars;

    // 5. EVALUAR
    console.log(`DEBUG evalExpr: originalExpr = "${originalExpr}", processedExpr para eval = "${processedExpr}"`);
    try {
        // eslint-disable-next-line no-eval
        let resultado = eval(processedExpr);
        return resultado;
    } catch (e) {
        console.error(`Error evaluando: "${originalExpr}" (procesado como "${processedExpr}")`, e);
        // Intento heurístico de detectar variables no definidas
        const posiblesVariablesNoDefinidas = processedExpr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
        if (posiblesVariablesNoDefinidas) {
            for (const pv of posiblesVariablesNoDefinidas) {
                if ( (typeof window[pv] === 'undefined' || !window.hasOwnProperty(pv) ) && // No es global de JS (como Math)
                     (typeof scope[pv] === 'undefined' ) && // No está en el scope local
                     isNaN(pv) && // No es un número
                     !['true', 'false', 'null', 'undefined', 'Infinity', 'NaN'].includes(pv.toLowerCase()) && // No es un literal conocido
                     !pseudoAleatorio.hasOwnProperty(pv) && !pseudoAzar.hasOwnProperty(pv) && // No es una de nuestras helpers globales
                     !Object.getOwnPropertyNames(Math).includes(pv.split('(')[0]) // No es una función Math
                   ) {
                     throw new Error(`Variable o función '${pv}' no definida, o expresión mal formada cerca de '${pv}'.`);
                }
            }
        }
        throw new Error(`Expresión inválida o error de cálculo en: "${originalExpr}". Detalle del sistema: ${e.message}`);
    }
};

console.log("evaluadorExpresiones.js cargado y Webgoritmo.Expresiones.evaluarExpresion (expandido) definido.");
