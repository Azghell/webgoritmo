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

window.Webgoritmo.Builtins = window.Webgoritmo.Builtins || {};
Webgoritmo.Builtins.funciones = {
    // Funciones Matemáticas
    "rc": function(args, numLineaOriginalLlamada) { // Raíz Cuadrada
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función RC espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para RC debe ser numérico, se recibió '${typeof num}'.`);
        if (num < 0) throw new Error(`Error en línea ${numLineaOriginalLlamada}: No se puede calcular la raíz cuadrada de un número negativo (${num}).`);
        return Math.sqrt(num);
    },
    "raiz": function(args, numLineaOriginalLlamada) { return Webgoritmo.Builtins.funciones.rc(args, numLineaOriginalLlamada); }, // Alias
    "abs": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función ABS espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para ABS debe ser numérico, se recibió '${typeof num}'.`);
        return Math.abs(num);
    },
    "ln": function(args, numLineaOriginalLlamada) { // Logaritmo Natural
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función LN espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para LN debe ser numérico, se recibió '${typeof num}'.`);
        if (num <= 0) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para LN debe ser positivo (${num}).`);
        return Math.log(num);
    },
    "exp": function(args, numLineaOriginalLlamada) { // Exponencial e^x
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función EXP espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para EXP debe ser numérico, se recibió '${typeof num}'.`);
        return Math.exp(num);
    },
    "sen": function(args, numLineaOriginalLlamada) { // Seno (en radianes)
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función SEN espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para SEN debe ser numérico, se recibió '${typeof num}'.`);
        return Math.sin(num);
    },
    "cos": function(args, numLineaOriginalLlamada) { // Coseno (en radianes)
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función COS espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para COS debe ser numérico, se recibió '${typeof num}'.`);
        return Math.cos(num);
    },
    "tan": function(args, numLineaOriginalLlamada) { // Tangente (en radianes)
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función TAN espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para TAN debe ser numérico, se recibió '${typeof num}'.`);
        return Math.tan(num);
    },
    "trunc": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función TRUNC espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para TRUNC debe ser numérico, se recibió '${typeof num}'.`);
        return Math.trunc(num);
    },
    "redon": function(args, numLineaOriginalLlamada) { // Redondear
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función REDON espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para REDON debe ser numérico, se recibió '${typeof num}'.`);
        return Math.round(num);
    },
    "azar": function(args, numLineaOriginalLlamada) { // Entero aleatorio entre 0 y x-1
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función AZAR espera 1 argumento (límite superior exclusivo), se recibieron ${args.length}.`);
        const limite = args[0];
        if (typeof limite !== 'number' || !Number.isInteger(limite) || limite <= 0) {
            throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para AZAR debe ser un entero positivo, se recibió '${limite}'.`);
        }
        return Math.floor(Math.random() * limite);
    },
    "aleatorio": function(args, numLineaOriginalLlamada) { // Entero aleatorio entre min y max (inclusive)
        if (args.length !== 2) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función ALEATORIO espera 2 argumentos (min, max), se recibieron ${args.length}.`);
        const min = args[0];
        const max = args[1];
        if (typeof min !== 'number' || !Number.isInteger(min) || typeof max !== 'number' || !Number.isInteger(max)) {
            throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumentos para ALEATORIO deben ser enteros, se recibieron '${min}', '${max}'.`);
        }
        if (min > max) {
            throw new Error(`Error en línea ${numLineaOriginalLlamada}: En ALEATORIO(min,max), min (${min}) no puede ser mayor que max (${max}).`);
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Funciones de Cadena
    "longitud": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función LONGITUD espera 1 argumento, se recibieron ${args.length}.`);
        return String(args[0]).length; // Coerciona a string
    },
    "mayusculas": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función MAYUSCULAS espera 1 argumento, se recibieron ${args.length}.`);
        return String(args[0]).toUpperCase();
    },
    "minusculas": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función MINUSCULAS espera 1 argumento, se recibieron ${args.length}.`);
        return String(args[0]).toLowerCase();
    },
    "subcadena": function(args, numLineaOriginalLlamada) {
        if (args.length !== 3) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función SUBCADENA espera 3 argumentos (cadena, inicio, fin), se recibieron ${args.length}.`);
        const cad = String(args[0]);
        const inicio = args[1];
        const fin = args[2];
        if (typeof inicio !== 'number' || !Number.isInteger(inicio) || typeof fin !== 'number' || !Number.isInteger(fin)) {
            throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumentos de inicio y fin para SUBCADENA deben ser enteros.`);
        }
        if (inicio <= 0 || fin < inicio || inicio > cad.length) { // PSeInt es 1-indexed, fin es inclusivo
            // PSeInt devuelve cadena vacía para rangos inválidos en lugar de error a veces.
            // Para ser más estrictos o claros, un error puede ser mejor o ajustar el comportamiento.
            // Aquí, seremos estrictos con el inicio. Si fin < inicio, substring devuelve ""
            // Si inicio > cad.length, substring devuelve ""
            // PSeInt: Subcadena("abc", 4, 5) -> "" ; Subcadena("abc", 2, 1) -> ""
            // JavaScript substring(start, end) end es exclusivo.
            // PSeInt: Subcadena(S,A,B) es S desde A hasta B. Longitud B-A+1.
            // JS: S.substring(A-1, B)
             if (inicio <= 0) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Inicio para SUBCADENA debe ser positivo.`);
             return cad.substring(inicio - 1, fin);
        }
        return cad.substring(inicio - 1, fin);
    },
    "concatenar": function(args, numLineaOriginalLlamada) { // Si '+' se vuelve estricto
        if (args.length !== 2) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función CONCATENAR espera 2 argumentos, se recibieron ${args.length}.`);
        return String(args[0]) + String(args[1]);
    },

    // Funciones de Conversión de Tipo
    "convertiranumero": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función CONVERTIRANUMERO espera 1 argumento, se recibieron ${args.length}.`);
        const val = args[0];
        if (typeof val === 'number') return val;
        const num = Number(String(val).trim()); // Convertir a string primero, luego a número
        if (isNaN(num) || !isFinite(num)) { // isFinite también chequea NaN
            throw new Error(`Error en línea ${numLineaOriginalLlamada}: No se pudo convertir '${val}' a un número válido.`);
        }
        return num;
    },
    "convertiratexto": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función CONVERTIRATEXTO espera 1 argumento, se recibieron ${args.length}.`);
        const val = args[0];
        if (typeof val === 'boolean') return val ? 'Verdadero' : 'Falso';
        return String(val);
    }
    // Faltarían ASEN, ACOS, ATAN, etc. pero esto es un buen comienzo.
};

// Helper para suma estricta
function __pseudoSuma__(op1, op2, numLinea) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();

    if (tipo1 === 'entero' || tipo1 === 'real') { // Operando izquierdo es numérico
        if (tipo2 === 'entero' || tipo2 === 'real') {
            return op1 + op2; // Ambos numéricos, suma aritmética
        } else {
            throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. No se puede sumar '${tipo1}' con '${tipo2}'.`);
        }
    } else if (tipo1 === 'cadena' || tipo1 === 'caracter') { // Operando izquierdo es cadena/caracter
        if (tipo2 === 'cadena' || tipo2 === 'caracter') {
            return String(op1) + String(op2); // Ambos cadena/caracter, concatenar
        } else if (tipo2 === 'entero' || tipo2 === 'real' || tipo2 === 'logico') {
             // PSeInt estricto usualmente no permite "cadena" + numero.
             // Si se quisiera permitir, sería String(op1) + String(op2)
            throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. No se puede concatenar '${tipo1}' con '${tipo2}' implícitamente. Use CONVERTIRATEXTO.`);
        } else {
            throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. Operación no definida entre '${tipo1}' y '${tipo2}'.`);
        }
    } else if (tipo1 === 'logico') {
        throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. No se puede usar '+' con tipo '${tipo1}'.`);
    }
    // Fallback o tipo no manejado
    throw new Error(`Error en línea ${numLinea}: Operación '+' no soportada para los tipos '${tipo1}' y '${tipo2}'.`);
}
Webgoritmo.Expresiones.__pseudoSuma__ = __pseudoSuma__;


Webgoritmo.Expresiones.evaluarExpresion = async function(expr, scope) { // Changed to async
    // ULTRA DEBUG: Ver la entrada cruda a la función.
    console.log(`ULTRA DEBUG evalExpr: expr CRUDA = "${expr}" (length: ${expr ? expr.length : 'N/A'}) | typeof: ${typeof expr} | JSON: ${JSON.stringify(expr)}`);

    const originalExprStr = String(expr).trim();

    // Fase 1: Intentar parsear como llamada a función (user-defined o built-in) si es el formato func(args)
    const funcCallMatch = originalExprStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*$/);

    if (funcCallMatch) {
        const funcName = funcCallMatch[1].toLowerCase(); // Funciones built-in y user-defined por nombre en minúsculas
        const argsStr = funcCallMatch[2];
        let argExprs = [];
        if (argsStr.trim() !== '') {
            // TODO: Implementar un parser de argumentos robusto que maneje comas dentro de strings/llamadas anidadas.
            // Por ahora, split simple por coma.
            argExprs = argsStr.split(',').map(a => a.trim().replace(/^["'](.*)["']$/, '$1')); // Quita comillas si son solo literales
        }

        const numLinea = (Webgoritmo.estadoApp && Webgoritmo.estadoApp.currentLineInfo) ? Webgoritmo.estadoApp.currentLineInfo.numLineaOriginal : 'expresión';

        // Check user-defined functions
        if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(funcName)) {
            const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[funcName];
            if (defFuncion.retornoVar === null) {
                throw new Error(`Error en línea ${numLinea}: El SubProceso '${funcCallMatch[1]}' no devuelve un valor y no puede ser usado en una expresión.`);
            }
            console.log(`[evaluarExpresion] Llamando a función de usuario: ${funcName}`);
            // ejecutarSubProcesoLlamada espera lista de EXPRESIONES de argumentos, no valores evaluados directamente aquí.
            return await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(funcName, argExprs, scope, numLinea);
        }
        // Check built-in functions
        else if (Webgoritmo.Builtins && Webgoritmo.Builtins.funciones.hasOwnProperty(funcName)) {
            console.log(`[evaluarExpresion] Llamando a función predefinida: ${funcName}`);
            const evaluadosArgs = [];
            for (const argExpr of argExprs) {
                evaluadosArgs.push(await Webgoritmo.Expresiones.evaluarExpresion(argExpr, scope)); // Evaluar cada argumento
            }
            return Webgoritmo.Builtins.funciones[funcName](evaluadosArgs, numLinea);
        }
        // Si el patrón func(args) se detectó pero el nombre no es ni user-defined ni built-in
        // Y NO es una palabra clave de PSeInt que use paréntesis (como Dimension arr(5) - aunque eso no se evalúa aquí)
        // entonces es una función no definida.
        // Las palabras clave de PSeInt que usan `()` como `Dimension` o `Subcadena` (que se reemplaza por `__pseudoSubcadena`)
        // son manejadas por reemplazos de texto más adelante o por handlers específicos.
        // Esta lógica es para cuando la EXPRESIÓN ENTERA es una llamada a función.
        // Si `funcName` no es un operador/palabra clave manejado por las regex de reemplazo posteriores, es un error.
        // Este es un punto delicado. Las regex de reemplazo para funciones como ABS, LN, etc.,
        // deben ser movidas para que se chequeen DESPUÉS de este bloque, o este bloque debe ser más inteligente.
        // Se añadio el else para error explícito:
        else {
             // Podría ser una función PSeInt que se reemplaza luego (ej. ABS, LN), o un error.
             // Si no es una función conocida (ni user ni builtin), y no se reemplaza por una regex más adelante,
             // el eval() final fallará. Para ser más proactivo:
             const esPalabraReservadaQueUsaParentesis = ['abs', 'rc', 'ln', 'exp', 'sen', 'cos', 'tan', 'trunc', 'redon', 'longitud', 'mayusculas', 'minusculas', 'subcadena', 'concatenar', 'convertiranumero', 'convertiratexto']; // Lista simplificada
             if (!esPalabraReservadaQueUsaParentesis.includes(funcName.toLowerCase())) {
                 // No es una función de usuario, ni builtin, ni una de las que se reemplazan por regex usualmente.
                 throw new Error(`Error en línea ${numLinea}: La función o SubProceso '${funcCallMatch[1]}' no está definido.`);
             }
             // Si es una de las que se reemplazan, se deja que la lógica de reemplazo actúe.
        }
    }

    // Si no es una llamada a función que ocupa toda la expresión, continuar con el resto...
    let processedExpr = originalExprStr;
    const originalExpr = processedExpr;
    console.log(`ULTRA DEBUG evalExpr: originalExpr (después de trim) = "${originalExpr}"`);

    // 1. MANEJO DE ACCESO DIRECTO A ARREGLOS (MULTIDIMENSIONAL)
    // 1. MANEJO DE ACCESO DIRECTO A ARREGLOS (MULTIDIMENSIONAL)
    // Este bloque maneja el caso donde la expresión COMPLETA es un acceso a arreglo, ej. "miVec[3]" o "miMat[i,j+1]"
    const directArrayAccessMatch = processedExpr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(.+?)\s*\]$/);
    if (directArrayAccessMatch) {
        const arrName = directArrayAccessMatch[1];
        const indicesStr = directArrayAccessMatch[2].trim();

        if (scope.hasOwnProperty(arrName) && scope[arrName] && scope[arrName].type === 'array') {
            const arrayData = scope[arrName];
            const indiceExprs = indicesStr.split(',').map(e => e.trim()); // Simple split, PSeInt indices usually simple.

            if (indiceExprs.some(s => s === "")) {
                throw new Error(`Expresión de índice vacía para el arreglo '${arrName}' al leer su valor.`);
            }
            if (indiceExprs.length !== arrayData.dimensions.length) {
                throw new Error(`Número incorrecto de dimensiones para acceder al arreglo '${arrName}'. Se esperaban ${arrayData.dimensions.length}, se proporcionaron ${indiceExprs.length}.`);
            }

            const evalIndices = [];
            for (let k = 0; k < indiceExprs.length; k++) {
                let idxVal;
                try {
                    // Evaluar cada expresión de índice recursivamente
                    idxVal = Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], scope);
                } catch (e) {
                    throw new Error(`Error evaluando índice '${indiceExprs[k]}' (dimensión ${k+1}) para arreglo '${arrName}': ${e.message}`);
                }

                if (typeof idxVal !== 'number' || (!Number.isInteger(idxVal) && Math.floor(idxVal) !== idxVal)) {
                    throw new Error(`Índice para la dimensión ${k+1} del arreglo '${arrName}' debe ser un entero. Se obtuvo '${indiceExprs[k]}' (valor: ${idxVal}).`);
                }
                idxVal = Math.trunc(idxVal); // Asegurar que sea entero

                if (idxVal <= 0 || idxVal > arrayData.dimensions[k]) {
                    throw new Error(`Índice [${idxVal}] fuera de los límites para la dimensión ${k+1} del arreglo '${arrName}' (válido: 1 a ${arrayData.dimensions[k]}).`);
                }
                evalIndices.push(idxVal);
            }

            let valorActual = arrayData.value;
            for (const indice of evalIndices) {
                if (valorActual && valorActual[indice] !== undefined) { // Usar 1-based index
                    valorActual = valorActual[indice];
                } else {
                    // Esto podría ocurrir si el arreglo no está completamente inicializado o índice es incorrecto a pesar de las validaciones
                    // (lo cual no debería pasar si las validaciones son correctas).
                    console.error("Error Interno: Elemento de arreglo no encontrado durante lectura.", arrName, evalIndices, arrayData);
                    throw new Error(`Error accediendo al elemento del arreglo '${arrName}' con índices [${evalIndices.join(', ')}]. El elemento podría no existir o ser inaccesible.`);
                }
            }
            return valorActual; // Devuelve el valor del elemento del arreglo
        } else if (scope.hasOwnProperty(arrName) && (!scope[arrName] || scope[arrName].type !== 'array')) {
             throw new Error(`Variable "${arrName}" no es un arreglo y no puede ser accedida con índices.`);
        }
        // Si arrName no está en scope, la lógica de reemplazo de variables más adelante lo manejará o fallará.
    }

    // 2. MANEJO DE LITERALES (después del acceso a arreglo, ya que un arreglo podría llamarse "verdadero" etc.)
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
    for (const nombreVar of nombresVarOrdenados) { // nombreVar is already lowercase if stored canonically
        if (scope.hasOwnProperty(nombreVar) && scope[nombreVar] && typeof scope[nombreVar] === 'object' && scope[nombreVar].hasOwnProperty('value')) {
            // Regex now uses 'gi' to match case-insensitively in the expression string
            // nombreVar itself (the key from scope) is assumed to be canonical (e.g., lowercase)
            const regex = new RegExp(`\\b${nombreVar}\\b`, 'gi');
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

    // HEURISTIC CHECK FOR STRING + NUMBER or NUMBER + STRING with '+' OPERATOR (Bug #1)
    // This aims to catch direct "string" + number or number + "string" before eval.
    // It's limited and won't catch complex cases perfectly.
    // Regex for JS string literal: '(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")'
    // Regex for JS number literal: '\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b' (simplified, doesn't cover all like .5)
    // For simplicity here, we test processedExpr which has variables already substituted.
    // If it contains a pattern like "'some string'" + 5 or 5 + "'some string'"
    // This is still complex to do perfectly with one regex over the already-processed JS string.

    // The __pseudoSuma__ function is defined and handles strict typing.
    // However, making the '+' operator universally use it requires a full parser.
    // For now, the bug "10" + 5 -> "105" will persist if eval handles it.
    // This step acknowledges the __pseudoSuma__ helper is available for future integration
    // with a proper expression parser. No change to `processedExpr` here for '+'.

    try {
        // eslint-disable-next-line no-eval
        let resultado = eval(processedExpr);
        return resultado;
    } catch (e) {
        const numLineaErrorEval = (Webgoritmo.estadoApp && Webgoritmo.estadoApp.currentLineInfo) ? Webgoritmo.estadoApp.currentLineInfo.numLineaOriginal : 'expresión';
        console.error(`Error evaluando (L${numLineaErrorEval}): "${originalExpr}" (procesado como "${processedExpr}")`, e);
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
