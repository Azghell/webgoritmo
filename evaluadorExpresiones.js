// evaluadorExpresiones.js (Corregido: obtenerValorReal definido y usado)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = {};

Webgoritmo.Expresiones.TiposDeToken = {
    NUMERO: 'NUMERO', CADENA: 'CADENA', BOOLEANO: 'BOOLEANO', IDENTIFICADOR: 'IDENTIFICADOR',
    PARENTESIS_IZQ: 'PARENTESIS_IZQ', PARENTESIS_DER: 'PARENTESIS_DER',
    CORCHETE_IZQ: 'CORCHETE_IZQ', CORCHETE_DER: 'CORCHETE_DER', COMA: 'COMA',
    OPERADOR_SUMA: 'OPERADOR_SUMA', OPERADOR_RESTA: 'OPERADOR_RESTA',
    OPERADOR_MULTIPLICACION: 'OPERADOR_MULTIPLICACION', OPERADOR_DIVISION: 'OPERADOR_DIVISION',
    OPERADOR_POTENCIA: 'OPERADOR_POTENCIA', OPERADOR_MODULO: 'OPERADOR_MODULO',
    OPERADOR_IGUAL: 'OPERADOR_IGUAL', OPERADOR_DISTINTO: 'OPERADOR_DISTINTO',
    OPERADOR_MENOR: 'OPERADOR_MENOR', OPERADOR_MENOR_IGUAL: 'OPERADOR_MENOR_IGUAL',
    OPERADOR_MAYOR: 'OPERADOR_MAYOR', OPERADOR_MAYOR_IGUAL: 'OPERADOR_MAYOR_IGUAL',
    OPERADOR_LOGICO_Y: 'OPERADOR_LOGICO_Y', OPERADOR_LOGICO_O: 'OPERADOR_LOGICO_O',
    OPERADOR_LOGICO_NO: 'OPERADOR_LOGICO_NO',
    OPERADOR_ACCESO_ARREGLO: 'OPERADOR_ACCESO_ARREGLO',
    OPERADOR_UNARIO_NEG: 'OPERADOR_UNARIO_NEG' // Para - unario
};

Webgoritmo.Expresiones.Util = {
    obtenerPrecedenciaOperador: function(tokenOperador) {
        if (!tokenOperador || typeof tokenOperador.tipo !== 'string' || !tokenOperador.hasOwnProperty('valor')) {
            console.warn("[obtenerPrecedenciaOperador] Token inválido:", tokenOperador); return 0;
        }
        const Tipos = Webgoritmo.Expresiones.TiposDeToken;
        switch (tokenOperador.tipo) {
            case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ: return 0;
            case Tipos.OPERADOR_ACCESO_ARREGLO: return 8;
            case Tipos.OPERADOR_UNARIO_NEG: case Tipos.OPERADOR_LOGICO_NO: // NO unario también alta precedencia
                 return 6;
        }
        // Para los operadores textuales, su tipo será uno de los específicos OPERADOR_*
        // No debería llegar un tipo genérico 'OPERADOR' aquí si el tokenizador es bueno.
        // Este switch es un fallback o para operadores de un solo caracter que no tuvieron tipo específico.
        if (typeof tokenOperador.valor !== 'string') { // Guarda por si acaso
            console.error("[obtenerPrecedenciaOperador] Token con valor no-string inesperado:", tokenOperador); return -1;
        }
        switch (tokenOperador.valor.toUpperCase()) {
            case '^': case 'POT': return 5;
            case '*': case '/': case 'MOD': case '%': return 4;
            case '+': case '-': return 3;
            case '=': case '==': case '<>': case '!=': case '<': case '>': case '<=': case '>=': return 2;
            case 'Y': case '&&': return 1;
            case 'O': case '||': return 1;
            default: console.warn(`[obtenerPrecedenciaOperador] Operador textual desconocido: '${tokenOperador.valor}'`); return 0;
        }
    },
    esAsociativoIzquierda: function(tokenOperador) {
        if (!tokenOperador || typeof tokenOperador.valor !== 'string') return true;
        return tokenOperador.valor !== '^' && tokenOperador.valor.toUpperCase() !== 'POT';
    },

    /**
     * Obtiene el valor real de un operando, extrayéndolo de su descriptor si es necesario.
     * Lanza error si se intenta usar un arreglo completo donde se espera un valor simple.
     */
    obtenerValorReal: function(operando, numLineaOriginal, contexto = "Operando") {
        if (operando === null || operando === undefined) {
            throw new Error(`Error en línea ${numLineaOriginal}: ${contexto} es nulo o indefinido.`);
        }
        if (typeof operando === 'object' && operando.hasOwnProperty('tipoDeclarado')) { // Es un descriptor
            if (operando.esArreglo) {
                // Si el contexto es específicamente para la base de un acceso a arreglo, está bien devolver el descriptor.
                // Para todas las demás operaciones (aritméticas, lógicas), un arreglo completo no es un operando válido.
                if (contexto === "Arreglo base para acceso") {
                    return operando; // Devolver el descriptor para OPERADOR_ACCESO_ARREGLO
                }
                throw new Error(`Error en línea ${numLineaOriginal}: No se puede usar el arreglo '${operando.nombreOriginal}' como valor directo en esta operación. Se requieren índices.`);
            }
            return operando.valor; // Es descriptor de variable simple, devolver su valor
        }
        return operando; // Ya es un valor primitivo (resultado de una operación anterior, o un literal)
    },

    realizarSuma: function(a,b,nL){ if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Suma solo números. A:${typeof a},B:${typeof b}`); return a + b; },
    realizarResta: function(a,b,nL){ if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Resta solo números. A:${typeof a},B:${typeof b}`); return a - b; },
    realizarMultiplicacion: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Mult solo números.`);return a*b;},
    realizarDivision: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Div solo números.`);if(b===0)throw new Error(`L${nL}: Div por cero.`);return a/b;},
    realizarModulo: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: MOD solo números.`);if(!Number.isInteger(a)||!Number.isInteger(b))throw new Error(`L${nL}: MOD solo enteros.`);if(b===0)throw new Error(`L${nL}: MOD por cero.`);return a%b;},
    realizarPotencia: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Potencia solo números.`);return Math.pow(a,b);},
    realizarAND: function(a,b,nL){if(typeof a!=='boolean'||typeof b!=='boolean')throw new Error(`L${nL}: Y solo lógicos.`);return a&&b;},
    realizarOR: function(a,b,nL){if(typeof a!=='boolean'||typeof b!=='boolean')throw new Error(`L${nL}: O solo lógicos.`);return a||b;},
    realizarNOT: function(a,nL){if(typeof a!=='boolean')throw new Error(`L${nL}: NO solo lógico.`);return !a;},
    realizarComparacion: function(a,b,op,nL){ if ((typeof a === 'string' && typeof b === 'string') || (typeof a === 'number' && typeof b === 'number') || (typeof a === 'boolean' && typeof b === 'boolean')) {} else if (typeof a === 'number' && typeof b === 'string' && !isNaN(Number(b))) { b = Number(b); } else if (typeof b === 'number' && typeof a === 'string' && !isNaN(Number(a))) { a = Number(a); } else if (op !== '=' && op !== '<>' && op !== '==') throw new Error(`L${nL}: Comparación tipos incompatibles (${typeof a} ${op} ${typeof b}).`); switch(op){ case '=': case '==': return a == b; case '<>': case '!=': return a != b; case '<': return a < b; case '>': return a > b; case '<=': return a <= b; case '>=': return a >= b; default: throw new Error(`L${nL}: Op comparación desconocido '${op}'.`); } }
};

Webgoritmo.Expresiones.tokenizar = function(cadenaExpresion) {
    const tokens = []; let cursor = 0; const Tipos = Webgoritmo.Expresiones.TiposDeToken;
    const patrones = [
        // Operadores de palabra clave primero para evitar que subcadenas coincidan con identificadores
        { tipo: Tipos.OPERADOR_LOGICO_Y,    regex: /\bY\b/i },
        { tipo: Tipos.OPERADOR_LOGICO_O,     regex: /\bO\b/i },
        { tipo: Tipos.OPERADOR_LOGICO_NO,    regex: /\bNO\b/i },
        { tipo: Tipos.OPERADOR_MODULO,       regex: /\bMOD\b/i },
        { tipo: Tipos.BOOLEANO, regex: /\b(Verdadero|Falso)\b/i }, // Booleanos también son palabras clave

        // Operadores de múltiples caracteres antes de los de un solo carácter para evitar matcheos parciales
        { tipo: Tipos.OPERADOR_MENOR_IGUAL,  regex: /<=/ },
        { tipo: Tipos.OPERADOR_MAYOR_IGUAL,  regex: />=/ },
        { tipo: Tipos.OPERADOR_IGUAL,        regex: /==/ }, // Doble igual antes de simple igual
        { tipo: Tipos.OPERADOR_DISTINTO,     regex: /<>|!=/ },
        { tipo: Tipos.OPERADOR_LOGICO_Y,   regex: /&&/ },
        { tipo: Tipos.OPERADOR_LOGICO_O,    regex: /\|\|/ },

        // Operadores de un solo carácter que podrían ser prefijos de números o ambiguos, ANTES de NUMERO
        // Tambien los que son simbolos unicos no ambiguos.
        { tipo: Tipos.OPERADOR_SUMA,  regex: /\+/ },
        { tipo: Tipos.OPERADOR_RESTA, regex: /-/ },
        { tipo: Tipos.OPERADOR_MULTIPLICACION, regex: /\*/ },
        { tipo: Tipos.OPERADOR_DIVISION, regex: /\// },
        { tipo: Tipos.OPERADOR_POTENCIA,     regex: /\^/ },
        { tipo: Tipos.OPERADOR_MODULO,       regex: /%/ }, // % como alternativa a MOD
        { tipo: Tipos.OPERADOR_IGUAL,        regex: /=/ }, // Simple igual (para comparación en PSeInt)
        { tipo: Tipos.OPERADOR_MENOR,        regex: /</ },
        { tipo: Tipos.OPERADOR_MAYOR,        regex: />/ },
        { tipo: Tipos.OPERADOR_LOGICO_NO,    regex: /!|~/ }, // ~ a veces usado para NOT (ya estaba antes de IDENTIFICADOR)

        // Símbolos de agrupación y separadores
        { tipo: Tipos.PARENTESIS_IZQ, regex: /\(/ },
        { tipo: Tipos.PARENTESIS_DER, regex: /\)/ },
        { tipo: Tipos.CORCHETE_IZQ,   regex: /\[/ },
        { tipo: Tipos.CORCHETE_DER,   regex: /\]/ },
        { tipo: Tipos.COMA,           regex: /,/ },

        // Tipos de datos literales
        // NUMERO después de operadores como '-' para correcta tokenización de 'idx-1' vs '-1'
        { tipo: Tipos.NUMERO, regex: /^-?\d+(?:\.\d*)?\b|^-?\.\d+\b/ },
        { tipo: Tipos.CADENA, regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },

        // IDENTIFICADOR al final, como un comodín para lo que no coincidió antes
        { tipo: Tipos.IDENTIFICADOR,  regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/ }
    ];
    const regexEspacio = /^\s+/;
    while (cursor < cadenaExpresion.length) {
        let subcadena = cadenaExpresion.substring(cursor);
        const matchEspacio = subcadena.match(regexEspacio);
        if (matchEspacio) { cursor += matchEspacio[0].length; continue; }
        let coincidenciaEncontrada = false;
        for (const { tipo, regex } of patrones) {
            const match = subcadena.match(regex);
            if (match && match.index === 0) {
                let valorOriginal = match[0]; let valorProcesado = valorOriginal;
                if (tipo === Tipos.NUMERO) valorProcesado = Number(valorOriginal);
                else if (tipo === Tipos.CADENA) valorProcesado = valorOriginal.substring(1, valorOriginal.length - 1).replace(/\\(["'])/g, '$1');
                else if (tipo === Tipos.BOOLEANO) valorProcesado = valorOriginal.toLowerCase() === "verdadero";
                else if (tipo === Tipos.IDENTIFICADOR) { /* No procesar valor, es el nombre */ }
                else { valorProcesado = valorOriginal.toUpperCase(); } // Para operadores Y, O, NO, MOD y símbolos
                tokens.push({ tipo: tipo, valor: valorProcesado, original: valorOriginal });
                cursor += valorOriginal.length; coincidenciaEncontrada = true; break;
            }
        }
        if (!coincidenciaEncontrada) throw new Error(`Tokenización: Carácter(es) inesperado(s) cerca de: '${cadenaExpresion.substring(cursor, cursor + 10)}...'`);
    } return tokens;
};

Webgoritmo.Expresiones.convertirInfijoAPostfijo = function(listaTokens) {
    const colaSalida = []; const pilaOperadores = [];
    const Tipos = Webgoritmo.Expresiones.TiposDeToken; const Util = Webgoritmo.Expresiones.Util;
    const tokensUnariosProcesados = [];
    for (let i = 0; i < listaTokens.length; i++) {
        const token = listaTokens[i];
        if (token.tipo === Tipos.OPERADOR_RESTA || token.tipo === Tipos.OPERADOR_LOGICO_NO) {
            const prev = i > 0 ? tokensUnariosProcesados[tokensUnariosProcesados.length - 1] : null;
            if (!prev || prev.tipo === Tipos.PARENTESIS_IZQ || prev.tipo === Tipos.CORCHETE_IZQ || prev.tipo === Tipos.COMA ||
                (prev.tipo && prev.tipo.startsWith("OPERADOR"))) { // Si el anterior es cualquier operador
                tokensUnariosProcesados.push({ ...token, tipo: token.tipo === Tipos.OPERADOR_RESTA ? Tipos.OPERADOR_UNARIO_NEG : Tipos.OPERADOR_LOGICO_NO, valor: token.tipo === Tipos.OPERADOR_RESTA ? '_UMINUS_' : 'NO' });
            } else { tokensUnariosProcesados.push(token); }
        } else { tokensUnariosProcesados.push(token); }
    }
    console.log("[Shunting-Yard] Tokens (con unarios):", JSON.stringify(tokensUnariosProcesados.map(t=>({t:t.tipo, v:String(t.valor)}))));

    for (const token of tokensUnariosProcesados) {
        console.log(`[Shunting-Yard] Procesando: {${token.tipo}, "${String(token.valor)}"}`);
        switch (token.tipo) {
            case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: case Tipos.IDENTIFICADOR:
                colaSalida.push(token); break;
            case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ:
                pilaOperadores.push(token); break;
            case Tipos.PARENTESIS_DER:
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) colaSalida.push(pilaOperadores.pop());
                if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) throw new Error("Shunting-Yard: Falta '('.");
                pilaOperadores.pop(); break;
            case Tipos.CORCHETE_DER:
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) colaSalida.push(pilaOperadores.pop());
                if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) throw new Error("Shunting-Yard: Falta '['.");
                pilaOperadores.pop();
                colaSalida.push({ tipo: Tipos.OPERADOR_ACCESO_ARREGLO, valor: '[]', original: '[]', dimensions: 1 }); // Corregido: type -> tipo
                break;
            case Tipos.OPERADOR_UNARIO_NEG: case Tipos.OPERADOR_LOGICO_NO: // Estos son los tipos unarios explícitos
            case Tipos.OPERADOR_SUMA: case Tipos.OPERADOR_RESTA: /* ... y todos los demás tipos de OPERADOR_* */
            case Tipos.OPERADOR_MULTIPLICACION: case Tipos.OPERADOR_DIVISION: case Tipos.OPERADOR_POTENCIA: case Tipos.OPERADOR_MODULO:
            case Tipos.OPERADOR_IGUAL: case Tipos.OPERADOR_DISTINTO: case Tipos.OPERADOR_MENOR: case Tipos.OPERADOR_MENOR_IGUAL:
            case Tipos.OPERADOR_MAYOR: case Tipos.OPERADOR_MAYOR_IGUAL: case Tipos.OPERADOR_LOGICO_Y: case Tipos.OPERADOR_LOGICO_O:
                while (pilaOperadores.length > 0) {
                    const opEnPila = pilaOperadores[pilaOperadores.length - 1];
                    if (opEnPila.tipo === Tipos.PARENTESIS_IZQ || opEnPila.tipo === Tipos.CORCHETE_IZQ) break;
                    if (Util.obtenerPrecedenciaOperador(opEnPila) > Util.obtenerPrecedenciaOperador(token) ||
                        (Util.obtenerPrecedenciaOperador(opEnPila) === Util.obtenerPrecedenciaOperador(token) && Util.esAsociativoIzquierda(token))) {
                        colaSalida.push(pilaOperadores.pop());
                    } else { break; }
                }
                pilaOperadores.push(token); break;
            case Tipos.COMA:
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.PARENTESIS_IZQ && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.CORCHETE_IZQ) colaSalida.push(pilaOperadores.pop());
                break;
            default: console.warn(`[Shunting-Yard] Token tipo ${token.tipo} no manejado en switch principal.`);
        }
        console.log(`[Shunting-Yard] -> ColaSalida: ${JSON.stringify(colaSalida.map(t=>String(t.valor)))}, PilaOps: ${JSON.stringify(pilaOperadores.map(t=>String(t.valor)))}`);
    }
    while (pilaOperadores.length > 0) { const op = pilaOperadores.pop(); if (op.tipo === Tipos.PARENTESIS_IZQ || op.tipo === Tipos.CORCHETE_IZQ) throw new Error("Shunting-Yard: Paréntesis/Corchetes desbalanceados al final."); colaSalida.push(op); }
    console.log("[Shunting-Yard] RPN Final:", JSON.stringify(colaSalida.map(t => ({t:t.tipo, v:String(t.valor)}))));
    return colaSalida;
};

Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) {
    const pilaValores = []; const Tipos = Webgoritmo.Expresiones.TiposDeToken;
    const UtilExpr = Webgoritmo.Expresiones.Util; const UtilInterprete = Webgoritmo.Interprete.Utilidades;
    for (const token of colaRPN) {
        if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.detenerEjecucion) throw new Error("Ejecución detenida.");
        switch (token.tipo) {
            case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: pilaValores.push(token.valor); break;
            case Tipos.IDENTIFICADOR:
                const descriptorVar = UtilInterprete.obtenerValorRealVariable(token.valor, ambitoActual, numeroLinea); // Devuelve descriptor o valor
                pilaValores.push(descriptorVar); // Pushear descriptor o valor; obtenerValorReal lo manejará
                break;
            case Tipos.OPERADOR_ACCESO_ARREGLO:
                if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para acceso arreglo.`);
                let indiceAcceso = UtilExpr.obtenerValorReal(pilaValores.pop(), numeroLinea, "Índice de arreglo");
                let descriptorAcceso = UtilExpr.obtenerValorReal(pilaValores.pop(), numeroLinea, "Arreglo base para acceso");
                if (!descriptorAcceso || !descriptorAcceso.esArreglo) throw new Error(`L${numeroLinea}: '${descriptorAcceso.nombreOriginal || "Variable"}' no es un arreglo.`);
                if (typeof indiceAcceso !== 'number' || !Number.isInteger(indiceAcceso)) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] no es entero para '${descriptorAcceso.nombreOriginal}'.`);
                if (indiceAcceso <= 0 || indiceAcceso > descriptorAcceso.dimensiones[0]) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] fuera de rango para '${descriptorAcceso.nombreOriginal}'.`);
                pilaValores.push(descriptorAcceso.valor[indiceAcceso]); break;
            case Tipos.OPERADOR_UNARIO_NEG:
            case Tipos.OPERADOR_LOGICO_NO: // Ambos unarios
                if (pilaValores.length < 1) throw new Error(`L${numeroLinea}: Falta operando para '${token.valor}'.`);
                let operandoUnario = UtilExpr.obtenerValorReal(pilaValores.pop(), numeroLinea);
                if (token.tipo === Tipos.OPERADOR_UNARIO_NEG) { if(typeof operandoUnario !=='number') throw new Error(`L${numeroLinea}: Menos unario solo para números.`); pilaValores.push(-operandoUnario); }
                else if (token.tipo === Tipos.OPERADOR_LOGICO_NO) { pilaValores.push(UtilExpr.realizarNOT(operandoUnario, numeroLinea)); }
                break;
            case Tipos.OPERADOR_SUMA: case Tipos.OPERADOR_RESTA: case Tipos.OPERADOR_MULTIPLICACION: case Tipos.OPERADOR_DIVISION: case Tipos.OPERADOR_POTENCIA: case Tipos.OPERADOR_MODULO: case Tipos.OPERADOR_IGUAL: case Tipos.OPERADOR_DISTINTO: case Tipos.OPERADOR_MENOR: case Tipos.OPERADOR_MENOR_IGUAL: case Tipos.OPERADOR_MAYOR: case Tipos.OPERADOR_MAYOR_IGUAL: case Tipos.OPERADOR_LOGICO_Y: case Tipos.OPERADOR_LOGICO_O:
                if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para '${token.valor}'.`);
                let opDer = UtilExpr.obtenerValorReal(pilaValores.pop(), numeroLinea); let opIzq = UtilExpr.obtenerValorReal(pilaValores.pop(), numeroLinea);
                switch (token.tipo) {
                    case Tipos.OPERADOR_SUMA: pilaValores.push(UtilExpr.realizarSuma(opIzq, opDer, numeroLinea)); break;
                    case Tipos.OPERADOR_RESTA: pilaValores.push(UtilExpr.realizarResta(opIzq, opDer, numeroLinea)); break;
                    case Tipos.OPERADOR_MULTIPLICACION: pilaValores.push(UtilExpr.realizarMultiplicacion(opIzq,opDer,numeroLinea)); break;
                    case Tipos.OPERADOR_DIVISION: pilaValores.push(UtilExpr.realizarDivision(opIzq,opDer,numeroLinea)); break;
                    case Tipos.OPERADOR_MODULO: pilaValores.push(UtilExpr.realizarModulo(opIzq,opDer,numeroLinea)); break;
                    case Tipos.OPERADOR_POTENCIA: pilaValores.push(UtilExpr.realizarPotencia(opIzq,opDer,numeroLinea)); break;
                    case Tipos.OPERADOR_LOGICO_Y: pilaValores.push(UtilExpr.realizarAND(opIzq,opDer,numeroLinea)); break;
                    case Tipos.OPERADOR_LOGICO_O: pilaValores.push(UtilExpr.realizarOR(opIzq,opDer,numeroLinea)); break;
                    case Tipos.OPERADOR_IGUAL: case Tipos.OPERADOR_DISTINTO: case Tipos.OPERADOR_MENOR: case Tipos.OPERADOR_MENOR_IGUAL: case Tipos.OPERADOR_MAYOR: case Tipos.OPERADOR_MAYOR_IGUAL:
                        pilaValores.push(UtilExpr.realizarComparacion(opIzq,opDer,token.valor,numeroLinea)); break; // El valor del token es el símbolo
                    default: throw new Error(`L${numeroLinea}: Operador desconocido en RPN: ${token.valor}`);
                } break;
            default: throw new Error(`L${numeroLinea}: Token RPN no reconocido: ${token.tipo} ('${token.valor}').`);
        }
    }
    if (pilaValores.length !== 1) throw new Error(`Error en línea ${numeroLinea}: Pila RPN final no unitaria.`);
    return UtilExpr.obtenerValorReal(pilaValores[0], numeroLinea, "Resultado de expresión");
};

Webgoritmo.Expresiones.evaluarExpresion = async function(expresionComoTexto, ambitoActual, numeroLinea = 'expresión') {
    const textoTrim = expresionComoTexto.trim();
    // console.log(`[evaluadorExpresiones (NUEVO TOKENIZADOR + BYPASS)] evaluando: "${textoTrim}"`);
    // Bypass para literales simples (MANTENIDO POR AHORA PARA ESTABILIDAD INICIAL)
    if ((textoTrim.startsWith('"') && textoTrim.endsWith('"')) || (textoTrim.startsWith("'") && textoTrim.endsWith("'"))) {
        const strVal = textoTrim.substring(1, textoTrim.length - 1);
        // console.log(`[evaluadorExpresiones (BYPASS)] Literal de cadena directo: "${strVal}"`);
        return strVal;
    }
    if (textoTrim.toLowerCase() === "verdadero") { /* console.log(`[BYPASS] true`); */ return true; }
    if (textoTrim.toLowerCase() === "falso") { /* console.log(`[BYPASS] false`); */ return false; }
    if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(textoTrim)) {
        const num = Number(textoTrim);
        if (!isNaN(num) && isFinite(num)) { /* console.log(`[BYPASS] num: ${num}`); */ return num; }
    }

    // console.log(`[evaluadorExpresiones (NUEVO TOKENIZADOR)] No es literal simple, procediendo con tokenización completa para: "${textoTrim}"`);
    if (!Webgoritmo.Interprete || !Webgoritmo.Interprete.Utilidades || !Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable) {
        throw new Error("Error interno: Dependencia del Intérprete no encontrada para evaluar expresión compleja.");
    }
    try {
        const tokens = Webgoritmo.Expresiones.tokenizar(textoTrim);
        // console.log(`[NUEVO Tokens] para "${textoTrim}":`, JSON.stringify(tokens.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const rpn = Webgoritmo.Expresiones.convertirInfijoAPostfijo(tokens);
        // console.log(`[RPN con NUEVO Tokens] para "${textoTrim}":`, JSON.stringify(rpn.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const resultado = await Webgoritmo.Expresiones.evaluarRPN(rpn, ambitoActual, numeroLinea);
        // console.log(`[Resultado con NUEVO Tokens] para "${textoTrim}":`, resultado);
        return resultado;
    } catch (e) {
        const msjError = e.message.startsWith(`Error en línea ${numeroLinea}`) || e.message.startsWith('Tokenización') || e.message.startsWith('Sintaxis') || e.message.includes("Shunting-Yard") || e.message.includes("RPN") ? e.message : `Error en línea ${numeroLinea} evaluando '${textoTrim}': ${e.message}`;
        console.error(msjError, e);
        throw new Error(msjError);
    }
};
console.log("evaluadorExpresiones.js (Nuevo Tokenizador y pipeline RPN completo) cargado.");
