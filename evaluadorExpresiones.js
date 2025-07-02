// evaluadorExpresiones.js (Depurando Shunting-Yard)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = {};

Webgoritmo.Expresiones.TiposDeToken = { /* ... (sin cambios) ... */ };
Webgoritmo.Expresiones.Util = { /* ... (obtenerPrecedenciaOperador y esAsociativoIzquierda como estaban, con sus logs internos si los tenían) ... */ };

// --- Tokenizador (sin cambios desde la versión estable con bypass) ---
Webgoritmo.Expresiones.tokenizar = function(cadenaExpresion) { /* ... */ };

// --- Shunting-Yard con Logs Detallados ---
Webgoritmo.Expresiones.convertirInfijoAPostfijo = function(listaTokens) {
    console.log("[Shunting-Yard] Tokens de entrada:", JSON.stringify(listaTokens.map(t => ({t:t.tipo, v:String(t.valor)}))));
    const colaSalida = [];
    const pilaOperadores = [];
    const Tipos = Webgoritmo.Expresiones.TiposDeToken;
    const Util = Webgoritmo.Expresiones.Util;

    const tokensProcesados = []; // Para manejar unarios
    for (let i = 0; i < listaTokens.length; i++) {
        const token = listaTokens[i];
        if ((token.valor === '-' || String(token.valor).toUpperCase() === 'NO') && token.tipo === Tipos.OPERADOR) {
            const prevToken = i > 0 ? tokensProcesados[tokensProcesados.length - 1] : null;
            if (!prevToken || prevToken.tipo === Tipos.OPERADOR || prevToken.tipo === Tipos.PARENTESIS_IZQ || prevToken.tipo === Tipos.COMA || prevToken.tipo === Tipos.CORCHETE_IZQ) {
                let valorUnario = token.valor === '-' ? '_UMINUS_' : 'NO';
                tokensProcesados.push({ ...token, tipo: Tipos.OPERADOR_UNARIO, valor: valorUnario });
            } else { tokensProcesados.push(token); }
        } else { tokensProcesados.push(token); }
    }
    console.log("[Shunting-Yard] Tokens procesados (unarios):", JSON.stringify(tokensProcesados.map(t => ({t:t.tipo, v:String(t.valor)}))));


    for (const token of tokensProcesados) {
        console.log(`[Shunting-Yard] Procesando token: {tipo: ${token.tipo}, valor: "${String(token.valor)}"}`);
        switch (token.tipo) {
            case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: case Tipos.IDENTIFICADOR:
                colaSalida.push(token);
                console.log(`[Shunting-Yard] -> Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor))));
                break;
            case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ:
                pilaOperadores.push(token);
                console.log(`[Shunting-Yard] -> Pila Ops:`, JSON.stringify(pilaOperadores.map(t => String(t.valor))));
                break;
            case Tipos.PARENTESIS_DER:
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) {
                    colaSalida.push(pilaOperadores.pop());
                }
                if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) throw new Error("Shunting-Yard: Paréntesis desbalanceados (falta '(').");
                pilaOperadores.pop(); // Sacar el '('
                console.log(`[Shunting-Yard] Pop '(', Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor))), "Pila Ops:", JSON.stringify(pilaOperadores.map(t => String(t.valor))));
                break;
            case Tipos.CORCHETE_DER:
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) {
                    colaSalida.push(pilaOperadores.pop());
                }
                if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) throw new Error("Shunting-Yard: Corchetes desbalanceados (falta '[').");
                pilaOperadores.pop();
                colaSalida.push({ type: Tipos.OPERADOR_ACCESO_ARREGLO, valor: '[]', original: '[]', dimensions: 1 });
                console.log(`[Shunting-Yard] Pop '[', Add ACCESO_ARR, Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor))), "Pila Ops:", JSON.stringify(pilaOperadores.map(t => String(t.valor))));
                break;
            case Tipos.OPERADOR_UNARIO:
            case Tipos.OPERADOR:
                console.log(`[Shunting-Yard] Operador actual: ${token.valor} (Prec: ${Util.obtenerPrecedenciaOperador(token)})`);
                while (pilaOperadores.length > 0) {
                    const opEnPila = pilaOperadores[pilaOperadores.length - 1];
                    console.log(`[Shunting-Yard]   Comparando con opEnPila: ${opEnPila.valor} (Prec: ${Util.obtenerPrecedenciaOperador(opEnPila)}, Tipo: ${opEnPila.tipo})`);
                    if (opEnPila.tipo === Tipos.PARENTESIS_IZQ || opEnPila.tipo === Tipos.CORCHETE_IZQ) break;

                    const precTokenActual = Util.obtenerPrecedenciaOperador(token);
                    const precOpEnPila = Util.obtenerPrecedenciaOperador(opEnPila);

                    if (precOpEnPila > precTokenActual || (precOpEnPila === precTokenActual && Util.esAsociativoIzquierda(token))) {
                        console.log(`[Shunting-Yard]     Pop ${opEnPila.valor} de pila a salida.`);
                        colaSalida.push(pilaOperadores.pop());
                    } else { break; }
                }
                pilaOperadores.push(token);
                console.log(`[Shunting-Yard] -> Pila Ops:`, JSON.stringify(pilaOperadores.map(t => String(t.valor))), "Cola Salida:", JSON.stringify(colaSalida.map(t => String(t.valor))));
                break;
            case Tipos.COMA:
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.PARENTESIS_IZQ && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.CORCHETE_IZQ) {
                     colaSalida.push(pilaOperadores.pop());
                }
                // La coma en sí no se pushea a la salida en este modelo simple.
                console.log(`[Shunting-Yard] Coma procesada. Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor))), "Pila Ops:", JSON.stringify(pilaOperadores.map(t => String(t.valor))));
                break;
            default:
                console.warn(`[Shunting-Yard] Token tipo ${token.tipo} no manejado directamente en switch.`);
        }
    }
    while (pilaOperadores.length > 0) {
        const op = pilaOperadores.pop();
        if (op.tipo === Tipos.PARENTESIS_IZQ || op.tipo === Tipos.CORCHETE_IZQ) throw new Error("Shunting-Yard: Paréntesis/Corchetes desbalanceados al final.");
        colaSalida.push(op);
    }
    console.log("[Shunting-Yard] RPN Final:", JSON.stringify(colaSalida.map(t => ({t:t.tipo, v:String(t.valor)}))));
    return colaSalida;
};

// --- Evaluador RPN (sin cambios funcionales mayores, pero los logs del Shunting-Yard ayudarán) ---
Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) { /* ... (como en estado estable revertido) ... */ };

// --- Función principal de evaluación con BYPASS DE LITERALES ---
Webgoritmo.Expresiones.evaluarExpresion = async function(expresionComoTexto, ambitoActual, numeroLinea = 'expresión') { /* ... (como estaba, con el bypass y luego el pipeline completo) ... */};

// --- Funciones Helper copiadas (obtenerValorPorDefectoSegunTipo, etc. de Utilidades y __pseudoSuma__ etc. de Expresiones.Util) ---
// ... (Asegurar que estén todas las necesarias que estaban en la versión "ESTADO ESTABLE REVERTIDO")

// Copia de funciones de utilidad de motorInterprete.js que son necesarias aquí
// (Solo para mantenerlo autónomo si se prueba por separado, idealmente se importan o se accede vía Webgoritmo.Interprete.Utilidades)
function obtenerValorReal(operando, numLineaOriginal, nombreOperando = "Operando") {
    if (operando === null || operando === undefined) {
        throw new Error(`Error en línea ${numLineaOriginal}: ${nombreOperando} es nulo o indefinido.`);
    }
    if (typeof operando === 'object' && operando.hasOwnProperty('tipoDeclarado')) {
        if (operando.esArreglo && nombreOperando !== "Arreglo base para acceso" && !(Webgoritmo.Expresiones && Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal)) {
            throw new Error(`Error en línea ${numLineaOriginal}: No se puede usar el arreglo '${operando.nombreOriginal || 'arreglo'}' directamente como valor. Se requieren índices.`);
        }
        return operando.valor;
    }
    return operando;
}
Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal = false;

// Pegar aquí las definiciones completas de:
// Webgoritmo.Expresiones.Util (completo)
// Webgoritmo.Expresiones.tokenizar (completo)
// Webgoritmo.Expresiones.evaluarRPN (completo)
// Webgoritmo.Expresiones.evaluarExpresion (completo, con el bypass)
// Y las funciones __pseudo... que estaban al final.

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
        if (tokenOperador.tipo !== Tipos.OPERADOR) { return 0; }
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
Webgoritmo.Expresiones.tokenizar = function(cadenaExpresion) { const tokens = []; let cursor = 0; const Tipos = Webgoritmo.Expresiones.TiposDeToken; const patronesTokens = [ { tipo: Tipos.NUMERO, regex: /-?\b\d+(?:\.\d*)?\b|\.\d+\b/y }, { tipo: Tipos.CADENA, regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y }, { tipo: Tipos.BOOLEANO,       regex: /\b(?:Verdadero|Falso)\b/iy }, { tipo: Tipos.OPERADOR,       regex: /<=|>=|<>|==|!=|<-/y }, { tipo: Tipos.OPERADOR,       regex: /\b(?:Y|O|NO|MOD)\b/iy }, { tipo: Tipos.OPERADOR,       regex: /[+\-*/\^=<>()\[\],]/y }, { tipo: Tipos.IDENTIFICADOR,  regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/y } ]; const regexEspacio = /\s+/y; while (cursor < cadenaExpresion.length) { regexEspacio.lastIndex = cursor; const matchEspacio = regexEspacio.exec(cadenaExpresion); if (matchEspacio && matchEspacio.index === cursor) { cursor = regexEspacio.lastIndex; continue; } let coincidenciaEncontrada = false; for (const patron of patronesTokens) { patron.regex.lastIndex = cursor; const match = patron.regex.exec(cadenaExpresion); if (match && match.index === cursor) { let valor = match[0]; let tipoActual = patron.tipo; if (tipoActual === Tipos.OPERADOR) { if (valor === '(') tipoActual = Tipos.PARENTESIS_IZQ; else if (valor === ')') tipoActual = Tipos.PARENTESIS_DER; else if (valor === '[') tipoActual = Tipos.CORCHETE_IZQ; else if (valor === ']') tipoActual = Tipos.CORCHETE_DER; else if (valor === ',') tipoActual = Tipos.COMA; else if (/\b(?:Y|O|NO|MOD)\b/i.test(valor)) valor = valor.toUpperCase(); } if (tipoActual === Tipos.NUMERO) valor = Number(valor); else if (tipoActual === Tipos.CADENA) valor = valor.substring(1, valor.length - 1).replace(/\\(["'])/g, '$1'); else if (tipoActual === Tipos.BOOLEANO) valor = valor.toLowerCase() === "verdadero"; tokens.push({ tipo: tipoActual, valor: valor, original: match[0] }); cursor = patron.regex.lastIndex; coincidenciaEncontrada = true; break; } } if (!coincidenciaEncontrada) throw new Error(`Tokenización: Carácter inesperado '${cadenaExpresion[cursor]}' en pos ${cursor} de '${cadenaExpresion}'.`); } return tokens; };
Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) { const pilaValores = []; const Tipos = Webgoritmo.Expresiones.TiposDeToken; const UtilExpr = Webgoritmo.Expresiones.Util; const UtilInterprete = Webgoritmo.Interprete.Utilidades;  for (const token of colaRPN) { if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.detenerEjecucion) throw new Error("Ejecución detenida."); switch (token.tipo) { case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: pilaValores.push(token.valor); break; case Tipos.IDENTIFICADOR: pilaValores.push(obtenerValorReal(UtilInterprete.obtenerValorRealVariable(token.valor, ambitoActual, numeroLinea), numeroLinea)); break; case Tipos.OPERADOR_ACCESO_ARREGLO: if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para acceso a arreglo.`); let indiceAcceso = obtenerValorReal(pilaValores.pop(), numeroLinea, "Índice de arreglo"); let descriptorAcceso = pilaValores.pop();  if (!descriptorAcceso || !descriptorAcceso.esArreglo) throw new Error(`L${numeroLinea}: '${descriptorAcceso.nombreOriginal || "Variable"}' no es un arreglo.`); if (typeof indiceAcceso !== 'number' || !Number.isInteger(indiceAcceso)) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] no es entero para '${descriptorAcceso.nombreOriginal}'.`); if (indiceAcceso <= 0 || indiceAcceso > descriptorAcceso.dimensiones[0]) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] fuera de rango para '${descriptorAcceso.nombreOriginal}'.`); pilaValores.push(descriptorAcceso.valor[indiceAcceso]); break; case Tipos.OPERADOR_UNARIO: if (pilaValores.length < 1) throw new Error(`L${numeroLinea}: Falta operando para '${token.valor}'.`); let operandoUnario = obtenerValorReal(pilaValores.pop(), numeroLinea); if (token.valor === '_UMINUS_') { if(typeof operandoUnario !=='number') throw new Error(`L${numeroLinea}: Menos unario solo para números.`); pilaValores.push(-operandoUnario); } else if (token.valor === 'NO') { pilaValores.push(UtilExpr.realizarNOT(operandoUnario, numeroLinea)); } else throw new Error(`L${numeroLinea}: Operador unario '${token.valor}' desconocido.`); break; case Tipos.OPERADOR: if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para '${token.valor}'.`); let opDer = obtenerValorReal(pilaValores.pop(), numeroLinea); let opIzq = obtenerValorReal(pilaValores.pop(), numeroLinea); switch (token.valor.toUpperCase()) { case '+': pilaValores.push(UtilExpr.realizarSuma(opIzq, opDer, numeroLinea)); break; case '-': pilaValores.push(UtilExpr.realizarResta(opIzq, opDer, numeroLinea)); break; case '*': pilaValores.push(UtilExpr.realizarMultiplicacion(opIzq,opDer,numeroLinea)); break; case '/': pilaValores.push(UtilExpr.realizarDivision(opIzq,opDer,numeroLinea)); break; case 'MOD': case '%': pilaValores.push(UtilExpr.realizarModulo(opIzq,opDer,numeroLinea)); break; case '^': pilaValores.push(UtilExpr.realizarPotencia(opIzq,opDer,numeroLinea)); break; case 'Y': case '&&': pilaValores.push(UtilExpr.realizarAND(opIzq,opDer,numeroLinea)); break; case 'O': case '||': pilaValores.push(UtilExpr.realizarOR(opIzq,opDer,numeroLinea)); break; case '=': case '==': case '<>': case '!=': case '<': case '>': case '<=': case '>=': pilaValores.push(UtilExpr.realizarComparacion(opIzq,opDer,token.valor,numeroLinea)); break; default: throw new Error(`L${numeroLinea}: Operador binario '${token.valor}' desconocido.`); } break; default: throw new Error(`L${numeroLinea}: Token RPN desconocido: ${token.tipo} ('${token.valor}').`); } } if (pilaValores.length !== 1) throw new Error(`Error en línea ${numeroLinea}: Pila de evaluación RPN no unitaria al final.`); return obtenerValorReal(pilaValores[0], numeroLinea, "Resultado de expresión");};
Webgoritmo.Expresiones.evaluarExpresion = async function(expresionComoTexto, ambitoActual, numeroLinea = 'expresión') { const textoTrim = expresionComoTexto.trim(); console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] evaluando: "${textoTrim}"`); if ((textoTrim.startsWith('"') && textoTrim.endsWith('"')) || (textoTrim.startsWith("'") && textoTrim.endsWith("'"))) { const strVal = textoTrim.substring(1, textoTrim.length - 1); console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal de cadena directo: "${strVal}"`); return strVal; } if (textoTrim.toLowerCase() === "verdadero") { console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal booleano directo: true`); return true; } if (textoTrim.toLowerCase() === "falso") { console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal booleano directo: false`); return false; } if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(textoTrim)) { const num = Number(textoTrim); if (!isNaN(num) && isFinite(num)) {  console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] Literal numérico directo: ${num}`); return num; } } console.log(`[evaluadorExpresiones (AISLAMIENTO DEBUG)] No es literal simple, procediendo con tokenización completa para: "${textoTrim}"`); if (!Webgoritmo.Interprete || !Webgoritmo.Interprete.Utilidades || !Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable) { throw new Error("Error interno: Dependencia 'obtenerValorRealVariable' no encontrada."); } try { const tokens = Webgoritmo.Expresiones.tokenizar(textoTrim); console.log(`[Tokens] para "${textoTrim}":`, JSON.stringify(tokens.map(t=>({t:t.tipo,v:String(t.valor)})))); const rpn = Webgoritmo.Expresiones.convertirInfijoAPostfijo(tokens); console.log(`[RPN] para "${textoTrim}":`, JSON.stringify(rpn.map(t=>({t:t.tipo,v:String(t.valor)})))); const resultado = await Webgoritmo.Expresiones.evaluarRPN(rpn, ambitoActual, numeroLinea); console.log(`[Resultado] para "${textoTrim}":`, resultado); return resultado; } catch (e) { const msjError = e.message.startsWith(`Error en línea ${numeroLinea}`) || e.message.startsWith('Tokenización') || e.message.startsWith('Sintaxis') ? e.message : `Error en línea ${numeroLinea} evaluando '${textoTrim}': ${e.message}`; console.error(msjError, e); throw new Error(msjError); } };

console.log("evaluadorExpresiones.js (Depurando Shunting-Yard + Bypass) cargado.");
