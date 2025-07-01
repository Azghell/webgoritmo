// evaluadorExpresiones.js (AISLAMIENTO DEBUG con Bypass de Literales)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = {};

Webgoritmo.Expresiones.TiposDeToken = {
    NUMERO: 'NUMERO', CADENA: 'CADENA', BOOLEANO: 'BOOLEANO', IDENTIFICADOR: 'IDENTIFICADOR',
    OPERADOR: 'OPERADOR', PARENTESIS_IZQ: 'PARENTESIS_IZQ', PARENTESIS_DER: 'PARENTESIS_DER',
    CORCHETE_IZQ: 'CORCHETE_IZQ', CORCHETE_DER: 'CORCHETE_DER', COMA: 'COMA',
    OPERADOR_UNARIO: 'OPERADOR_UNARIO',
    OPERADOR_ACCESO_ARREGLO: 'OPERADOR_ACCESO_ARREGLO'
};

Webgoritmo.Expresiones.Util = {
    obtenerPrecedenciaOperador: function(tokenOperador) {
        if (!tokenOperador || typeof tokenOperador.tipo !== 'string' || !tokenOperador.hasOwnProperty('valor')) {
            console.warn("[obtenerPrecedenciaOperador] Se recibió un token inválido o incompleto:", tokenOperador);
            return 0;
        }
        const Tipos = Webgoritmo.Expresiones.TiposDeToken;
        switch (tokenOperador.tipo) {
            case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ: return 0;
            case Tipos.OPERADOR_ACCESO_ARREGLO: return 8;
            case Tipos.OPERADOR_UNARIO: return 6;
        }
        if (tokenOperador.tipo !== Tipos.OPERADOR) return 0;
        if (typeof tokenOperador.valor !== 'string') {
            console.error("[obtenerPrecedenciaOperador] ERROR CRÍTICO: Token OPERADOR con valor no-string:", tokenOperador);
            return -1;
        }
        switch (tokenOperador.valor.toUpperCase()) {
            case 'NO': return 6; case '^': return 5; case '*': case '/': case 'MOD': case '%': return 4;
            case '+': case '-': return 3; case '=': case '==': case '<>': case '!=': case '<': case '>': case '<=': case '>=': return 2;
            case 'Y': case '&&': return 1; case 'O': case '||': return 1;
            default: console.warn(`[obtenerPrecedenciaOperador] Operador desconocido: '${tokenOperador.valor}'`, tokenOperador); return 0;
        }
    },
    esAsociativoIzquierda: function(tokenOperador) { if (!tokenOperador || typeof tokenOperador.valor !== 'string') return true; return tokenOperador.valor !== '^'; },
    realizarSuma: function(a,b,nL){ if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Suma solo entre números. Se obtuvo ${typeof a} y ${typeof b}`); return a + b; },
    realizarResta: function(a,b,nL){ if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Resta solo entre números. Se obtuvo ${typeof a} y ${typeof b}`); return a - b; },
    realizarMultiplicacion: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Multiplicación solo números.`);return a*b;},
    realizarDivision: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: División solo números.`);if(b===0)throw new Error(`L${nL}: División por cero.`);return a/b;},
    realizarModulo: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: MOD solo números.`);if(!Number.isInteger(a)||!Number.isInteger(b))throw new Error(`L${nL}: MOD solo con enteros.`);if(b===0)throw new Error(`L${nL}: MOD por cero.`);return a%b;},
    realizarPotencia: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Potencia solo números.`);return Math.pow(a,b);},
    realizarAND: function(a,b,nL){if(typeof a!=='boolean'||typeof b!=='boolean')throw new Error(`L${nL}: Y solo lógicos.`);return a&&b;},
    realizarOR: function(a,b,nL){if(typeof a!=='boolean'||typeof b!=='boolean')throw new Error(`L${nL}: O solo lógicos.`);return a||b;},
    realizarNOT: function(a,nL){if(typeof a!=='boolean')throw new Error(`L${nL}: NO solo lógico.`);return !a;},
    realizarComparacion: function(a,b,op,nL){ if ((typeof a === 'string' && typeof b === 'string') || (typeof a === 'number' && typeof b === 'number') || (typeof a === 'boolean' && typeof b === 'boolean')) {} else if (typeof a === 'number' && typeof b === 'string' && !isNaN(Number(b))) { b = Number(b); } else if (typeof b === 'number' && typeof a === 'string' && !isNaN(Number(a))) { a = Number(a); } else if (op !== '=' && op !== '<>' && op !== '==') throw new Error(`L${nL}: Comparación entre tipos incompatibles (${typeof a} ${op} ${typeof b}).`); switch(op){ case '=': case '==': return a == b; case '<>': case '!=': return a != b; case '<': return a < b; case '>': return a > b; case '<=': return a <= b; case '>=': return a >= b; default: throw new Error(`L${nL}: Operador comparación desconocido '${op}'.`); } }
};

Webgoritmo.Expresiones.tokenizar = function(cadenaExpresion) { /* ... (como en estado estable revertido) ... */
    const tokens = []; let cursor = 0; const Tipos = Webgoritmo.Expresiones.TiposDeToken;
    const patronesTokens = [ { tipo: Tipos.NUMERO, regex: /-?\b\d+(?:\.\d*)?\b|\.\d+\b/y }, { tipo: Tipos.CADENA, regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y }, { tipo: Tipos.BOOLEANO,       regex: /\b(?:Verdadero|Falso)\b/iy }, { tipo: Tipos.OPERADOR,       regex: /<=|>=|<>|==|!=|<-/y }, { tipo: Tipos.OPERADOR,       regex: /\b(?:Y|O|NO|MOD)\b/iy }, { tipo: Tipos.OPERADOR,       regex: /[+\-*/\^=<>()\[\],]/y }, { tipo: Tipos.IDENTIFICADOR,  regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/y } ];
    const regexEspacio = /\s+/y;
    while (cursor < cadenaExpresion.length) {
        regexEspacio.lastIndex = cursor; const matchEspacio = regexEspacio.exec(cadenaExpresion);
        if (matchEspacio && matchEspacio.index === cursor) { cursor = regexEspacio.lastIndex; continue; }
        let coincidenciaEncontrada = false;
        for (const patron of patronesTokens) {
            patron.regex.lastIndex = cursor; const match = patron.regex.exec(cadenaExpresion);
            if (match && match.index === cursor) {
                let valor = match[0]; let tipoActual = patron.tipo;
                if (tipoActual === Tipos.OPERADOR) { if (valor === '(') tipoActual = Tipos.PARENTESIS_IZQ; else if (valor === ')') tipoActual = Tipos.PARENTESIS_DER; else if (valor === '[') tipoActual = Tipos.CORCHETE_IZQ; else if (valor === ']') tipoActual = Tipos.CORCHETE_DER; else if (valor === ',') tipoActual = Tipos.COMA; else if (/\b(?:Y|O|NO|MOD)\b/i.test(valor)) valor = valor.toUpperCase(); }
                if (tipoActual === Tipos.NUMERO) valor = Number(valor); else if (tipoActual === Tipos.CADENA) valor = valor.substring(1, valor.length - 1).replace(/\\(["'])/g, '$1'); else if (tipoActual === Tipos.BOOLEANO) valor = valor.toLowerCase() === "verdadero";
                tokens.push({ tipo: tipoActual, valor: valor, original: match[0] });
                cursor = patron.regex.lastIndex; coincidenciaEncontrada = true; break;
            }
        }
        if (!coincidenciaEncontrada) throw new Error(`Tokenización: Carácter inesperado '${cadenaExpresion[cursor]}' en pos ${cursor} de '${cadenaExpresion}'.`);
    } return tokens;
};
Webgoritmo.Expresiones.convertirInfijoAPostfijo = function(listaTokens) { /* ... (como en estado estable revertido) ... */
    const colaSalida = []; const pilaOperadores = []; const Tipos = Webgoritmo.Expresiones.TiposDeToken; const Util = Webgoritmo.Expresiones.Util; const tokensProcesados = [];
    for (let i = 0; i < listaTokens.length; i++) { const token = listaTokens[i]; if ((token.valor === '-' || token.valor.toUpperCase() === 'NO') && token.tipo === Tipos.OPERADOR) { const prevToken = i > 0 ? tokensProcesados[tokensProcesados.length - 1] : null; if (!prevToken || prevToken.tipo === Tipos.OPERADOR || prevToken.tipo === Tipos.PARENTESIS_IZQ || prevToken.tipo === Tipos.COMA || prevToken.tipo === Tipos.CORCHETE_IZQ) { let valorUnario = token.valor === '-' ? '_UMINUS_' : 'NO'; tokensProcesados.push({ ...token, tipo: Tipos.OPERADOR_UNARIO, valor: valorUnario }); } else { tokensProcesados.push(token); } } else { tokensProcesados.push(token); } }
    for (const token of tokensProcesados) { switch (token.tipo) { case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: case Tipos.IDENTIFICADOR: colaSalida.push(token); break; case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ: pilaOperadores.push(token); break; case Tipos.PARENTESIS_DER: while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) colaSalida.push(pilaOperadores.pop()); if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) throw new Error("Paréntesis desbalanceados (falta '(')."); pilaOperadores.pop(); break; case Tipos.CORCHETE_DER:  while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) colaSalida.push(pilaOperadores.pop()); if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) throw new Error("Corchetes desbalanceados (falta '[')."); pilaOperadores.pop(); colaSalida.push({ tipo: Tipos.OPERADOR_ACCESO_ARREGLO, valor: '[]', original: '[]', dimensions: 1 }); break; case Tipos.OPERADOR_UNARIO: while (pilaOperadores.length > 0) { const opEnPila = pilaOperadores[pilaOperadores.length - 1]; if (opEnPila.tipo === Tipos.PARENTESIS_IZQ || opEnPila.tipo === Tipos.CORCHETE_IZQ) break; if (Util.obtenerPrecedenciaOperador(opEnPila) > Util.obtenerPrecedenciaOperador(token) ) { colaSalida.push(pilaOperadores.pop()); } else { break; } } pilaOperadores.push(token); break; case Tipos.OPERADOR: while (pilaOperadores.length > 0) { const opEnPila = pilaOperadores[pilaOperadores.length - 1]; if (opEnPila.tipo === Tipos.PARENTESIS_IZQ || opEnPila.tipo === Tipos.CORCHETE_IZQ) break; if (Util.obtenerPrecedenciaOperador(opEnPila) > Util.obtenerPrecedenciaOperador(token) || (Util.obtenerPrecedenciaOperador(opEnPila) === Util.obtenerPrecedenciaOperador(token) && Util.esAsociativoIzquierda(token))) { colaSalida.push(pilaOperadores.pop()); } else { break; } } pilaOperadores.push(token); break; case Tipos.COMA:  while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.PARENTESIS_IZQ && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.CORCHETE_IZQ) colaSalida.push(pilaOperadores.pop()); if (pilaOperadores.length === 0 || (pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.PARENTESIS_IZQ && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.CORCHETE_IZQ)) {} break; } } while (pilaOperadores.length > 0) { const op = pilaOperadores.pop(); if (op.tipo === Tipos.PARENTESIS_IZQ || op.tipo === Tipos.CORCHETE_IZQ) throw new Error("Paréntesis/Corchetes desbalanceados."); colaSalida.push(op); } return colaSalida;
};
Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) { /* ... (como en estado estable revertido, usando la función global obtenerValorReal) ... */
    const pilaValores = []; const Tipos = Webgoritmo.Expresiones.TiposDeToken; const UtilExpr = Webgoritmo.Expresiones.Util; const UtilInterprete = Webgoritmo.Interprete.Utilidades;
    for (const token of colaRPN) { if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.detenerEjecucion) throw new Error("Ejecución detenida."); switch (token.tipo) { case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: pilaValores.push(token.valor); break; case Tipos.IDENTIFICADOR: pilaValores.push(UtilInterprete.obtenerValorRealVariable(token.valor, ambitoActual, numeroLinea)); break; case Tipos.OPERADOR_ACCESO_ARREGLO: if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para acceso a arreglo.`); let indiceAcceso = obtenerValorReal(pilaValores.pop(), numeroLinea, "Índice de arreglo"); let descriptorAcceso = pilaValores.pop();  if (!descriptorAcceso || !descriptorAcceso.esArreglo) throw new Error(`L${numeroLinea}: '${descriptorAcceso.nombreOriginal || "Variable"}' no es un arreglo.`); if (typeof indiceAcceso !== 'number' || !Number.isInteger(indiceAcceso)) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] no es entero para '${descriptorAcceso.nombreOriginal}'.`); if (indiceAcceso <= 0 || indiceAcceso > descriptorAcceso.dimensiones[0]) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] fuera de rango para '${descriptorAcceso.nombreOriginal}'.`); pilaValores.push(descriptorAcceso.valor[indiceAcceso]); break; case Tipos.OPERADOR_UNARIO: if (pilaValores.length < 1) throw new Error(`L${numeroLinea}: Falta operando para '${token.valor}'.`); let operandoUnario = obtenerValorReal(pilaValores.pop(), numeroLinea); if (token.valor === '_UMINUS_') { if(typeof operandoUnario !=='number') throw new Error(`L${numeroLinea}: Menos unario solo para números.`); pilaValores.push(-operandoUnario); } else if (token.valor === 'NO') { pilaValores.push(UtilExpr.realizarNOT(operandoUnario, numeroLinea)); } else throw new Error(`L${numeroLinea}: Operador unario '${token.valor}' desconocido.`); break; case Tipos.OPERADOR: if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para '${token.valor}'.`); let opDer = obtenerValorReal(pilaValores.pop(), numeroLinea); let opIzq = obtenerValorReal(pilaValores.pop(), numeroLinea); switch (token.valor.toUpperCase()) { case '+': pilaValores.push(UtilExpr.realizarSuma(opIzq, opDer, numeroLinea)); break; case '-': pilaValores.push(UtilExpr.realizarResta(opIzq, opDer, numeroLinea)); break; case '*': pilaValores.push(UtilExpr.realizarMultiplicacion(opIzq,opDer,numeroLinea)); break; case '/': pilaValores.push(UtilExpr.realizarDivision(opIzq,opDer,numeroLinea)); break; case 'MOD': case '%': pilaValores.push(UtilExpr.realizarModulo(opIzq,opDer,numeroLinea)); break; case '^': pilaValores.push(UtilExpr.realizarPotencia(opIzq,opDer,numeroLinea)); break; case 'Y': case '&&': pilaValores.push(UtilExpr.realizarAND(opIzq,opDer,numeroLinea)); break; case 'O': case '||': pilaValores.push(UtilExpr.realizarOR(opIzq,opDer,numeroLinea)); break; case '=': case '==': case '<>': case '!=': case '<': case '>': case '<=': case '>=': pilaValores.push(UtilExpr.realizarComparacion(opIzq,opDer,token.valor,numeroLinea)); break; default: throw new Error(`L${numeroLinea}: Operador binario '${token.valor}' desconocido.`); } break; default: throw new Error(`L${numeroLinea}: Token RPN desconocido: ${token.tipo} ('${token.valor}').`); } } if (pilaValores.length !== 1) throw new Error(`Error en línea ${numeroLinea}: Pila de evaluación RPN no unitaria al final.`); return obtenerValorReal(pilaValores[0], numeroLinea, "Resultado de expresión");
};

// --- Función principal de evaluación con BYPASS DE LITERALES ---
Webgoritmo.Expresiones.evaluarExpresion = async function(expresionComoTexto, ambitoActual, numeroLinea = 'expresión') {
    const textoTrim = expresionComoTexto.trim();
    console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] evaluando: "${textoTrim}"`);

    // Intento de parseo directo para literales simples
    if ((textoTrim.startsWith('"') && textoTrim.endsWith('"')) || (textoTrim.startsWith("'") && textoTrim.endsWith("'"))) {
        const strVal = textoTrim.substring(1, textoTrim.length - 1);
        console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal de cadena directo: "${strVal}"`);
        return strVal;
    }
    if (textoTrim.toLowerCase() === "verdadero") {
        console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal booleano directo: true`);
        return true;
    }
    if (textoTrim.toLowerCase() === "falso") {
        console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal booleano directo: false`);
        return false;
    }
    if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(textoTrim)) {
        const num = Number(textoTrim);
        if (!isNaN(num) && isFinite(num)) {
            console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal numérico directo: ${num}`);
            return num;
        }
    }

    console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] No es literal simple, procediendo con tokenización completa para: "${textoTrim}"`);
    if (!Webgoritmo.Interprete || !Webgoritmo.Interprete.Utilidades || !Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable) {
        throw new Error("Error interno: Dependencia 'obtenerValorRealVariable' no encontrada.");
    }
    try {
        const tokens = Webgoritmo.Expresiones.tokenizar(textoTrim);
        console.log(`[Tokens] para "${textoTrim}":`, JSON.stringify(tokens.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const rpn = Webgoritmo.Expresiones.convertirInfijoAPostfijo(tokens);
        console.log(`[RPN] para "${textoTrim}":`, JSON.stringify(rpn.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const resultado = await Webgoritmo.Expresiones.evaluarRPN(rpn, ambitoActual, numeroLinea);
        console.log(`[Resultado] para "${textoTrim}":`, resultado);
        return resultado;
    } catch (e) {
        const msjError = e.message.startsWith(`Error en línea ${numeroLinea}`) || e.message.startsWith('Tokenización') || e.message.startsWith('Sintaxis') ? e.message : `Error en línea ${numeroLinea} evaluando '${textoTrim}': ${e.message}`;
        console.error(msjError, e);
        throw new Error(msjError);
    }
};

// Función global helper (usada por evaluarRPN) - asegurar que esté definida.
// Esta función es para extraer el .value de los descriptores de variables cuando se usan en operaciones.
function obtenerValorReal(operando, numLineaOriginal, nombreOperando = "Operando") {
    if (operando === null || operando === undefined) {
        throw new Error(`Error en línea ${numLineaOriginal}: ${nombreOperando} es nulo o indefinido.`);
    }
    if (typeof operando === 'object' && operando.hasOwnProperty('tipoDeclarado')) {
        if (operando.esArreglo && nombreOperando !== "Arreglo base para acceso" && !(Webgoritmo.Expresiones && Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal)) { // permitirArregloComoOperandoGlobal es una bandera hipotética
            throw new Error(`Error en línea ${numLineaOriginal}: No se puede usar el arreglo '${operando.nombreOriginal || 'arreglo'}' directamente como valor. Se requieren índices.`);
        }
        return operando.valor;
    }
    return operando;
}
Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal = false; // Bandera para controlar si un arreglo completo puede ser un operando

console.log("evaluadorExpresiones.js (AISLAMIENTO DEBUG con Bypass) cargado.");
