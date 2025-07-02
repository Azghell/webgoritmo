// evaluadorExpresiones.js (Nuevo Tokenizador Robusto + Bypass para Literales)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = {};

Webgoritmo.Expresiones.TiposDeToken = {
    NUMERO: 'NUMERO',               // 123, 45.67, -10
    CADENA: 'CADENA',               // "hola", 'mundo'
    BOOLEANO: 'BOOLEANO',           // Verdadero, Falso
    IDENTIFICADOR: 'IDENTIFICADOR', // miVariable, un_Nombre
    PARENTESIS_IZQ: 'PARENTESIS_IZQ', // (
    PARENTESIS_DER: 'PARENTESIS_DER', // )
    CORCHETE_IZQ: 'CORCHETE_IZQ',   // [
    CORCHETE_DER: 'CORCHETE_DER',   // ]
    COMA: 'COMA',                   // ,
    OPERADOR_SUMA: 'OPERADOR_SUMA',         // +
    OPERADOR_RESTA: 'OPERADOR_RESTA',       // - (binario y unario se distinguirán después)
    OPERADOR_MULTIPLICACION: 'OPERADOR_MULTIPLICACION', // *
    OPERADOR_DIVISION: 'OPERADOR_DIVISION',     // /
    OPERADOR_POTENCIA: 'OPERADOR_POTENCIA',     // ^
    OPERADOR_MODULO: 'OPERADOR_MODULO',       // MOD, %
    OPERADOR_IGUAL: 'OPERADOR_IGUAL',         // = (comparación) o ==
    OPERADOR_DISTINTO: 'OPERADOR_DISTINTO',     // <>, !=
    OPERADOR_MENOR: 'OPERADOR_MENOR',         // <
    OPERADOR_MENOR_IGUAL: 'OPERADOR_MENOR_IGUAL', // <=
    OPERADOR_MAYOR: 'OPERADOR_MAYOR',         // >
    OPERADOR_MAYOR_IGUAL: 'OPERADOR_MAYOR_IGUAL', // >=
    OPERADOR_LOGICO_Y: 'OPERADOR_LOGICO_Y',   // Y, &&
    OPERADOR_LOGICO_O: 'OPERADOR_LOGICO_O',    // O, ||
    OPERADOR_LOGICO_NO: 'OPERADOR_LOGICO_NO',  // NO, !
    // OPERADOR_ASIGNACION: 'OPERADOR_ASIGNACION', // <- (manejado por el intérprete principal, no en expresiones)
    OPERADOR_ACCESO_ARREGLO: 'OPERADOR_ACCESO_ARREGLO', // Token especial para RPN
    OPERADOR_UNARIO_NEG: 'OPERADOR_UNARIO_NEG', // Para - unario
    FIN_DE_EXPRESION: 'FIN_DE_EXPRESION' // Opcional
};

Webgoritmo.Expresiones.tokenizar = function(cadenaExpresion) {
    const tokens = [];
    let cursor = 0;
    const Tipos = Webgoritmo.Expresiones.TiposDeToken;

    const patrones = [
        { tipo: Tipos.NUMERO,         regex: /^-?\d+(?:\.\d*)?\b|^-?\.\d+\b/ }, // Negativos, Enteros, Decimales
        { tipo: Tipos.CADENA,         regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
        { tipo: Tipos.BOOLEANO,       regex: /\b(Verdadero|Falso)\b/i },
        { tipo: Tipos.IDENTIFICADOR,  regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/ },
        // Operadores de palabra clave (case insensitive)
        { tipo: Tipos.OPERADOR_LOGICO_Y,    regex: /\bY\b/i },
        { tipo: Tipos.OPERADOR_LOGICO_O,     regex: /\bO\b/i },
        { tipo: Tipos.OPERADOR_LOGICO_NO,    regex: /\bNO\b/i },
        { tipo: Tipos.OPERADOR_MODULO,       regex: /\bMOD\b/i },
        // Operadores de dos caracteres
        { tipo: Tipos.OPERADOR_MENOR_IGUAL,  regex: /<=/ },
        { tipo: Tipos.OPERADOR_MAYOR_IGUAL,  regex: />=/ },
        { tipo: Tipos.OPERADOR_IGUAL,        regex: /==/ }, // Doble igual primero
        { tipo: Tipos.OPERADOR_DISTINTO,     regex: /<>|!=/ },
        // Operadores de un caracter y delimitadores
        { tipo: Tipos.PARENTESIS_IZQ, regex: /\(/ },
        { tipo: Tipos.PARENTESIS_DER, regex: /\)/ },
        { tipo: Tipos.CORCHETE_IZQ,   regex: /\[/ },
        { tipo: Tipos.CORCHETE_DER,   regex: /\]/ },
        { tipo: Tipos.COMA,           regex: /,/ },
        { tipo: Tipos.OPERADOR_SUMA,  regex: /\+/ },
        { tipo: Tipos.OPERADOR_RESTA, regex: /-/ },
        { tipo: Tipos.OPERADOR_MULTIPLICACION, regex: /\*/ },
        { tipo: Tipos.OPERADOR_DIVISION,     regex: /\// },
        { tipo: Tipos.OPERADOR_POTENCIA,     regex: /\^/ },
        { tipo: Tipos.OPERADOR_MODULO,       regex: /%/ },
        { tipo: Tipos.OPERADOR_IGUAL,        regex: /=/ }, // Igual simple (comparación)
        { tipo: Tipos.OPERADOR_MENOR,        regex: /</ },
        { tipo: Tipos.OPERADOR_MAYOR,        regex: />/ },
        { tipo: Tipos.OPERADOR_LOGICO_Y,   regex: /&&/ }, // Alternativa para Y
        { tipo: Tipos.OPERADOR_LOGICO_O,    regex: /\|\|/ }, // Alternativa para O
        { tipo: Tipos.OPERADOR_LOGICO_NO,   regex: /!/ }     // Alternativa para NO
    ];

    while (cursor < cadenaExpresion.length) {
        let subcadena = cadenaExpresion.substring(cursor);

        // Ignorar espacios en blanco
        const matchEspacio = subcadena.match(/^\s+/);
        if (matchEspacio) {
            cursor += matchEspacio[0].length;
            continue;
        }

        let coincidenciaEncontrada = false;
        for (const { tipo, regex } of patrones) {
            const match = subcadena.match(regex);
            if (match && match.index === 0) { // La coincidencia debe estar al inicio de la subcadena
                let valorOriginal = match[0];
                let valorProcesado = valorOriginal;

                if (tipo === Tipos.NUMERO) {
                    valorProcesado = Number(valorOriginal);
                } else if (tipo === Tipos.CADENA) {
                    valorProcesado = valorOriginal.substring(1, valorOriginal.length - 1).replace(/\\(["'])/g, '$1');
                } else if (tipo === Tipos.BOOLEANO) {
                    valorProcesado = valorOriginal.toLowerCase() === "verdadero";
                } else if (tipo === Tipos.IDENTIFICADOR) {
                    // Convertir palabras clave de operadores a su tipo de operador y valor canónico si se capturan como IDENTIFICADOR
                    const lowerVal = valorOriginal.toLowerCase();
                    if (lowerVal === "y") { tokens.push({ tipo: Tipos.OPERADOR_LOGICO_Y, valor: "Y", original: valorOriginal }); coincidenciaEncontrada = true; cursor += valorOriginal.length; break; }
                    if (lowerVal === "o") { tokens.push({ tipo: Tipos.OPERADOR_LOGICO_O, valor: "O", original: valorOriginal }); coincidenciaEncontrada = true; cursor += valorOriginal.length; break; }
                    if (lowerVal === "no") { tokens.push({ tipo: Tipos.OPERADOR_LOGICO_NO, valor: "NO", original: valorOriginal }); coincidenciaEncontrada = true; cursor += valorOriginal.length; break; }
                    if (lowerVal === "mod") { tokens.push({ tipo: Tipos.OPERADOR_MODULO, valor: "MOD", original: valorOriginal }); coincidenciaEncontrada = true; cursor += valorOriginal.length; break; }
                }

                // Para operadores que son palabras clave, usar la versión en mayúsculas como valor canónico
                if (tipo === Tipos.OPERADOR_LOGICO_Y && valorProcesado.match(/\bY\b/i)) valorProcesado = "Y";
                else if (tipo === Tipos.OPERADOR_LOGICO_O && valorProcesado.match(/\bO\b/i)) valorProcesado = "O";
                else if (tipo === Tipos.OPERADOR_LOGICO_NO && valorProcesado.match(/\bNO\b/i)) valorProcesado = "NO";
                else if (tipo === Tipos.OPERADOR_MODULO && valorProcesado.match(/\bMOD\b/i)) valorProcesado = "MOD";

                tokens.push({ tipo: tipo, valor: valorProcesado, original: valorOriginal });
                cursor += valorOriginal.length;
                coincidenciaEncontrada = true;
                break;
            }
        }

        if (!coincidenciaEncontrada) {
            throw new Error(`Tokenización: Carácter(es) inesperado(s) cerca de: '${cadenaExpresion.substring(cursor, cursor + 10)}...' en la expresión '${cadenaExpresion}'.`);
        }
    }
    return tokens;
};

// --- Util, Shunting-Yard, RPN (COMO ESTABAN EN "ESTADO ESTABLE REVERTIDO + Debug Precedencia") ---
Webgoritmo.Expresiones.Util = { /* ... (sin cambios respecto a la última versión funcional) ... */ };
Webgoritmo.Expresiones.convertirInfijoAPostfijo = function(listaTokens) { /* ... (sin cambios respecto a la última versión funcional) ... */ };
Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) { /* ... (sin cambios respecto a la última versión funcional) ... */ };

// --- Función principal de evaluación con BYPASS DE LITERALES ---
Webgoritmo.Expresiones.evaluarExpresion = async function(expresionComoTexto, ambitoActual, numeroLinea = 'expresión') {
    const textoTrim = expresionComoTexto.trim();
    console.log(`[evaluadorExpresiones (NUEVO TOKENIZADOR + BYPASS)] evaluando: "${textoTrim}"`);

    // Intento de parseo directo para literales simples (BYPASS)
    if ((textoTrim.startsWith('"') && textoTrim.endsWith('"')) || (textoTrim.startsWith("'") && textoTrim.endsWith("'"))) {
        const strVal = textoTrim.substring(1, textoTrim.length - 1);
        console.log(`[evaluadorExpresiones (BYPASS)] Literal de cadena directo: "${strVal}"`);
        return strVal;
    }
    if (textoTrim.toLowerCase() === "verdadero") {
        console.log(`[evaluadorExpresiones (BYPASS)] Literal booleano directo: true`);
        return true;
    }
    if (textoTrim.toLowerCase() === "falso") {
        console.log(`[evaluadorExpresiones (BYPASS)] Literal booleano directo: false`);
        return false;
    }
    if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(textoTrim)) {
        const num = Number(textoTrim);
        if (!isNaN(num) && isFinite(num)) {
            console.log(`[evaluadorExpresiones (BYPASS)] Literal numérico directo: ${num}`);
            return num;
        }
    }

    console.log(`[evaluadorExpresiones (NUEVO TOKENIZADOR)] No es literal simple, procediendo con tokenización completa para: "${textoTrim}"`);
    if (!Webgoritmo.Interprete || !Webgoritmo.Interprete.Utilidades || !Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable) {
        throw new Error("Error interno: Dependencia del Intérprete no encontrada para evaluar expresión.");
    }
    try {
        const tokens = Webgoritmo.Expresiones.tokenizar(textoTrim); // Usar el NUEVO tokenizador
        console.log(`[NUEVO Tokens] para "${textoTrim}":`, JSON.stringify(tokens.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const rpn = Webgoritmo.Expresiones.convertirInfijoAPostfijo(tokens); // Usar Shunting-Yard existente
        console.log(`[RPN con NUEVO Tokens] para "${textoTrim}":`, JSON.stringify(rpn.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const resultado = await Webgoritmo.Expresiones.evaluarRPN(rpn, ambitoActual, numeroLinea); // Usar evaluador RPN existente
        console.log(`[Resultado con NUEVO Tokens] para "${textoTrim}":`, resultado);
        return resultado;
    } catch (e) {
        const msjError = e.message.startsWith(`Error en línea ${numeroLinea}`) || e.message.startsWith('Tokenización') || e.message.startsWith('Sintaxis') || e.message.includes("Shunting-Yard") ? e.message : `Error en línea ${numeroLinea} evaluando '${textoTrim}': ${e.message}`;
        console.error(msjError, e);
        throw new Error(msjError);
    }
};

// --- Copiar definiciones completas de Util, convertirInfijoAPostfijo, evaluarRPN y helpers como estaban ---
Webgoritmo.Expresiones.Util = {
    obtenerPrecedenciaOperador: function(tokenOperador) {
        if (!tokenOperador || typeof tokenOperador.tipo !== 'string' || !tokenOperador.hasOwnProperty('valor')) {
            console.warn("[obtenerPrecedenciaOperador] Token inválido:", tokenOperador); return 0;
        }
        const Tipos = Webgoritmo.Expresiones.TiposDeToken;
        switch (tokenOperador.tipo) {
            case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ: return 0;
            case Tipos.OPERADOR_ACCESO_ARREGLO: return 8;
            case Tipos.OPERADOR_UNARIO: return 6; // Precedencia para NO unario y MENOS unario
        }
        // Solo los tokens de tipo OPERADOR deberían llegar aquí para el switch por valor
        if (tokenOperador.tipo !== Tipos.OPERADOR) return 0;
        if (typeof tokenOperador.valor !== 'string') {
            console.error("[obtenerPrecedenciaOperador] Token OPERADOR con valor no-string:", tokenOperador); return -1;
        }
        switch (tokenOperador.valor.toUpperCase()) { // NO ya no está aquí, se maneja como OPERADOR_UNARIO o OPERADOR_LOGICO_NO
            case '^': return 5;
            case '*': case '/': case 'MOD': case '%': return 4;
            case '+': case '-': return 3;
            case '=': case '==': case '<>': case '!=': case '<': case '>': case '<=': case '>=': return 2;
            case 'Y': case '&&': return 1;
            case 'O': case '||': return 1;
            default: console.warn(`[obtenerPrecedenciaOperador] Operador textual desconocido: '${tokenOperador.valor}'`); return 0;
        }
    },
    esAsociativoIzquierda: function(tokenOperador) { if (!tokenOperador || typeof tokenOperador.valor !== 'string') return true; return tokenOperador.valor !== '^'; },
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
Webgoritmo.Expresiones.convertirInfijoAPostfijo = function(listaTokens) { const colaSalida = []; const pilaOperadores = []; const Tipos = Webgoritmo.Expresiones.TiposDeToken; const Util = Webgoritmo.Expresiones.Util; const tokensProcesados = []; for (let i = 0; i < listaTokens.length; i++) { const token = listaTokens[i]; if (token.tipo === Tipos.OPERADOR_RESTA || (token.tipo === Tipos.OPERADOR_LOGICO_NO && token.valor.toUpperCase() === 'NO')) { const prevToken = i > 0 ? tokensProcesados[tokensProcesados.length - 1] : null; if (!prevToken || prevToken.tipo === Tipos.OPERADOR || prevToken.tipo === Tipos.PARENTESIS_IZQ || prevToken.tipo === Tipos.COMA || prevToken.tipo === Tipos.CORCHETE_IZQ ) { let valorUnario = token.valor === '-' ? '_UMINUS_' : 'NO'; tokensProcesados.push({ ...token, tipo: Tipos.OPERADOR_UNARIO, valor: valorUnario }); } else { tokensProcesados.push(token); } } else { tokensProcesados.push(token); } } console.log("[Shunting-Yard] Tokens procesados (unarios):", JSON.stringify(tokensProcesados.map(t => ({t:t.tipo, v:String(t.valor)})))); for (const token of tokensProcesados) { console.log(`[Shunting-Yard] Procesando token: {tipo: ${token.tipo}, valor: "${String(token.valor)}"}`); switch (token.tipo) { case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: case Tipos.IDENTIFICADOR: colaSalida.push(token); console.log(`[Shunting-Yard] -> Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor)))); break; case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ: pilaOperadores.push(token); console.log(`[Shunting-Yard] -> Pila Ops:`, JSON.stringify(pilaOperadores.map(t => String(t.valor)))); break; case Tipos.PARENTESIS_DER: while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) { colaSalida.push(pilaOperadores.pop()); } if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) throw new Error("Shunting-Yard: Paréntesis desbalanceados (falta '(')."); pilaOperadores.pop(); console.log(`[Shunting-Yard] Pop '(', Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor))), "Pila Ops:", JSON.stringify(pilaOperadores.map(t => String(t.valor)))); break; case Tipos.CORCHETE_DER:  while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) { colaSalida.push(pilaOperadores.pop()); } if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) throw new Error("Shunting-Yard: Corchetes desbalanceados (falta '[')."); pilaOperadores.pop(); colaSalida.push({ type: Tipos.OPERADOR_ACCESO_ARREGLO, valor: '[]', original: '[]', dimensions: 1 }); console.log(`[Shunting-Yard] Pop '[', Add ACCESO_ARR, Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor))), "Pila Ops:", JSON.stringify(pilaOperadores.map(t => String(t.valor)))); break; case Tipos.OPERADOR_UNARIO: case Tipos.OPERADOR_LOGICO_NO: case Tipos.OPERADOR_SUMA: case Tipos.OPERADOR_RESTA: case Tipos.OPERADOR_MULTIPLICACION: case Tipos.OPERADOR_DIVISION: case Tipos.OPERADOR_POTENCIA: case Tipos.OPERADOR_MODULO: case Tipos.OPERADOR_IGUAL: case Tipos.OPERADOR_DISTINTO: case Tipos.OPERADOR_MENOR: case Tipos.OPERADOR_MENOR_IGUAL: case Tipos.OPERADOR_MAYOR: case Tipos.OPERADOR_MAYOR_IGUAL: case Tipos.OPERADOR_LOGICO_Y: case Tipos.OPERADOR_LOGICO_O: case Tipos.OPERADOR: console.log(`[Shunting-Yard] Operador actual: ${token.valor} (Prec: ${Util.obtenerPrecedenciaOperador(token)})`); while (pilaOperadores.length > 0) { const opEnPila = pilaOperadores[pilaOperadores.length - 1]; console.log(`[Shunting-Yard]   Comparando con opEnPila: ${opEnPila.valor} (Prec: ${Util.obtenerPrecedenciaOperador(opEnPila)}, Tipo: ${opEnPila.tipo})`); if (opEnPila.tipo === Tipos.PARENTESIS_IZQ || opEnPila.tipo === Tipos.CORCHETE_IZQ) break; const precTokenActual = Util.obtenerPrecedenciaOperador(token); const precOpEnPila = Util.obtenerPrecedenciaOperador(opEnPila); if (precOpEnPila > precTokenActual || (precOpEnPila === precTokenActual && Util.esAsociativoIzquierda(token))) { console.log(`[Shunting-Yard]     Pop ${opEnPila.valor} de pila a salida.`); colaSalida.push(pilaOperadores.pop()); } else { break; } } pilaOperadores.push(token); console.log(`[Shunting-Yard] -> Pila Ops:`, JSON.stringify(pilaOperadores.map(t => String(t.valor))), "Cola Salida:", JSON.stringify(colaSalida.map(t => String(t.valor)))); break; case Tipos.COMA:  while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.PARENTESIS_IZQ && pilaOperadores[pilaOperadores.length-1].tipo !== Tipos.CORCHETE_IZQ) { colaSalida.push(pilaOperadores.pop()); } console.log(`[Shunting-Yard] Coma procesada. Cola Salida:`, JSON.stringify(colaSalida.map(t => String(t.valor))), "Pila Ops:", JSON.stringify(pilaOperadores.map(t => String(t.valor)))); break; default: console.warn(`[Shunting-Yard] Token tipo ${token.tipo} no manejado directamente en switch.`); } } while (pilaOperadores.length > 0) { const op = pilaOperadores.pop(); if (op.tipo === Tipos.PARENTESIS_IZQ || op.tipo === Tipos.CORCHETE_IZQ) throw new Error("Shunting-Yard: Paréntesis/Corchetes desbalanceados al final."); colaSalida.push(op); } console.log("[Shunting-Yard] RPN Final:", JSON.stringify(colaSalida.map(t => ({t:t.tipo, v:String(t.valor)})))); return colaSalida; };
Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) { const pilaValores = []; const Tipos = Webgoritmo.Expresiones.TiposDeToken; const UtilExpr = Webgoritmo.Expresiones.Util; const UtilInterprete = Webgoritmo.Interprete.Utilidades;  for (const token of colaRPN) { if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.detenerEjecucion) throw new Error("Ejecución detenida."); switch (token.tipo) { case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: pilaValores.push(token.valor); break; case Tipos.IDENTIFICADOR: pilaValores.push(obtenerValorReal(UtilInterprete.obtenerValorRealVariable(token.valor, ambitoActual, numeroLinea), numeroLinea)); break; case Tipos.OPERADOR_ACCESO_ARREGLO: if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para acceso a arreglo.`); let indiceAcceso = obtenerValorReal(pilaValores.pop(), numeroLinea, "Índice de arreglo"); let descriptorAcceso = pilaValores.pop();  if (!descriptorAcceso || !descriptorAcceso.esArreglo) throw new Error(`L${numeroLinea}: '${descriptorAcceso.nombreOriginal || "Variable"}' no es un arreglo.`); if (typeof indiceAcceso !== 'number' || !Number.isInteger(indiceAcceso)) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] no es entero para '${descriptorAcceso.nombreOriginal}'.`); if (indiceAcceso <= 0 || indiceAcceso > descriptorAcceso.dimensiones[0]) throw new Error(`L${numeroLinea}: Índice [${indiceAcceso}] fuera de rango para '${descriptorAcceso.nombreOriginal}'.`); pilaValores.push(descriptorAcceso.valor[indiceAcceso]); break; case Tipos.OPERADOR_UNARIO: if (pilaValores.length < 1) throw new Error(`L${numeroLinea}: Falta operando para '${token.valor}'.`); let operandoUnario = obtenerValorReal(pilaValores.pop(), numeroLinea); if (token.valor === '_UMINUS_') { if(typeof operandoUnario !=='number') throw new Error(`L${numeroLinea}: Menos unario solo para números.`); pilaValores.push(-operandoUnario); } else if (token.valor === 'NO') { pilaValores.push(UtilExpr.realizarNOT(operandoUnario, numeroLinea)); } else throw new Error(`L${numeroLinea}: Operador unario '${token.valor}' desconocido.`); break; case Tipos.OPERADOR_SUMA: case Tipos.OPERADOR_RESTA: case Tipos.OPERADOR_MULTIPLICACION: case Tipos.OPERADOR_DIVISION: case Tipos.OPERADOR_POTENCIA: case Tipos.OPERADOR_MODULO: case Tipos.OPERADOR_IGUAL: case Tipos.OPERADOR_DISTINTO: case Tipos.OPERADOR_MENOR: case Tipos.OPERADOR_MENOR_IGUAL: case Tipos.OPERADOR_MAYOR: case Tipos.OPERADOR_MAYOR_IGUAL: case Tipos.OPERADOR_LOGICO_Y: case Tipos.OPERADOR_LOGICO_O: case Tipos.OPERADOR: if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para '${token.valor}'.`); let opDer = obtenerValorReal(pilaValores.pop(), numeroLinea); let opIzq = obtenerValorReal(pilaValores.pop(), numeroLinea); switch (token.valor.toUpperCase()) { case '+': pilaValores.push(UtilExpr.realizarSuma(opIzq, opDer, numeroLinea)); break; case '-': pilaValores.push(UtilExpr.realizarResta(opIzq, opDer, numeroLinea)); break; case '*': pilaValores.push(UtilExpr.realizarMultiplicacion(opIzq,opDer,numeroLinea)); break; case '/': pilaValores.push(UtilExpr.realizarDivision(opIzq,opDer,numeroLinea)); break; case 'MOD': case '%': pilaValores.push(UtilExpr.realizarModulo(opIzq,opDer,numeroLinea)); break; case '^': pilaValores.push(UtilExpr.realizarPotencia(opIzq,opDer,numeroLinea)); break; case 'Y': case '&&': pilaValores.push(UtilExpr.realizarAND(opIzq,opDer,numeroLinea)); break; case 'O': case '||': pilaValores.push(UtilExpr.realizarOR(opIzq,opDer,numeroLinea)); break; case '=': case '==': case '<>': case '!=': case '<': case '>': case '<=': case '>=': pilaValores.push(UtilExpr.realizarComparacion(opIzq,opDer,token.valor,numeroLinea)); break; default: throw new Error(`L${numeroLinea}: Operador binario '${token.valor}' desconocido.`); } break; default: throw new Error(`L${numeroLinea}: Token RPN desconocido: ${token.tipo} ('${token.valor}').`); } } if (pilaValores.length !== 1) throw new Error(`Error en línea ${numeroLinea}: Pila de evaluación RPN no unitaria al final.`); return obtenerValorReal(pilaValores[0], numeroLinea, "Resultado de expresión");};

console.log("evaluadorExpresiones.js (Nuevo Tokenizador + ShuntingYard Básico + RPN Básico + Bypass) cargado.");
