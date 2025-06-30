// evaluadorExpresiones.js
// Contiene la función evaluarExpresion() expandida y sus helpers.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = Webgoritmo.Expresiones || {};

// --- Funciones Helper (sin cambios) ---
function pseudoAleatorio(min, max) { /* ... */ }
Webgoritmo.Expresiones.pseudoAleatorio = pseudoAleatorio;
function pseudoAzar(n) { /* ... */ }
Webgoritmo.Expresiones.pseudoAzar = pseudoAzar;
function __pseudoLongitud(cadena) { /* ... */ }
Webgoritmo.Expresiones.__pseudoLongitud = __pseudoLongitud;
function __pseudoMayusculas(cadena) { /* ... */ }
Webgoritmo.Expresiones.__pseudoMayusculas = __pseudoMayusculas;
function __pseudoMinusculas(cadena) { /* ... */ }
Webgoritmo.Expresiones.__pseudoMinusculas = __pseudoMinusculas;
function __pseudoConvertirATexto(valor) { /* ... */ }
Webgoritmo.Expresiones.__pseudoConvertirATexto = __pseudoConvertirATexto;
function __pseudoConvertirANumero(cadena) { /* ... */ }
Webgoritmo.Expresiones.__pseudoConvertirANumero = __pseudoConvertirANumero;
function __pseudoSubcadena(cadena, inicio, fin) { /* ... */ }
Webgoritmo.Expresiones.__pseudoSubcadena = __pseudoSubcadena;

// --- Tokenizer, getOperatorPrecedence, isOperatorLeftAssociative, infixToPostfix (sin cambios desde la última versión) ---
Webgoritmo.Expresiones.tokenize = function(exprStr) { /* ... (como en Bloque 5/corrección anterior) ... */
    const tokens = []; let i = 0; const originalLength = exprStr.length;
    const tokenPatterns = [
        { type: 'NUMBER', regex: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\.\d+(?:[eE][+-]?\d+)?\b/y },
        { type: 'STRING_LITERAL', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y }, { type: 'BOOLEAN_TRUE', regex: /\bVerdadero\b/iy }, { type: 'BOOLEAN_FALSE', regex: /\bFalso\b/iy },
        { type: 'OPERATOR_LTE', regex: /<=|menor o igual que/iy }, { type: 'OPERATOR_GTE', regex: />=|mayor o igual que/iy }, { type: 'OPERATOR_NEQ', regex: /<>|!=|distinto de/iy },
        { type: 'OPERATOR_EQ', regex: /==|=igual que|=/iy }, { type: 'OPERATOR_LT', regex: /<|menor que/iy }, { type: 'OPERATOR_GT', regex: />|mayor que/iy },
        { type: 'OPERATOR_AND', regex: /\bY\b|&&/iy }, { type: 'OPERATOR_OR', regex: /\bO\b|\|\|/iy }, { type: 'OPERATOR_NOT', regex: /\bNO\b|!|~/iy },
        { type: 'OPERATOR_MOD', regex: /\bMOD\b|%/iy }, { type: 'OPERATOR_POW', regex: /\^/y }, { type: 'OPERATOR_MULTIPLY', regex: /\*/y },
        { type: 'OPERATOR_DIVIDE', regex: /\//y }, { type: 'OPERATOR_PLUS', regex: /\+/y }, { type: 'OPERATOR_MINUS', regex: /-/y },
        { type: 'LPAREN', regex: /\(/y }, { type: 'RPAREN', regex: /\)/y }, { type: 'LBRACKET', regex: /\[/y }, { type: 'RBRACKET', regex: /\]/y },
        { type: 'COMMA', regex: /,/y }, { type: 'IDENTIFIER', regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/y }
    ];
    while (i < originalLength) {
        const whitespaceRegex = /\s+/y; whitespaceRegex.lastIndex = i; const wsMatch = whitespaceRegex.exec(exprStr);
        if (wsMatch && wsMatch.index === i) { i = whitespaceRegex.lastIndex; if (i >= originalLength) break; }
        let matched = false;
        for (const pattern of tokenPatterns) {
            pattern.regex.lastIndex = i; const match = pattern.regex.exec(exprStr);
            if (match && match.index === i) {
                let value = match[0]; let type = pattern.type;
                if (type === 'NUMBER') value = parseFloat(value);
                else if (type === 'STRING_LITERAL') value = value.substring(1, value.length - 1).replace(/\\(["'\\])/g, '$1');
                else if (type === 'BOOLEAN_TRUE') value = true; else if (type === 'BOOLEAN_FALSE') value = false;
                else if (type === 'IDENTIFIER') { const lowerVal = value.toLowerCase(); if (lowerVal === "mod") type = 'OPERATOR_MOD'; else if (lowerVal === "y" || value === "&&") type = 'OPERATOR_AND'; else if (lowerVal === "o" || value === "||") type = 'OPERATOR_OR'; else if (lowerVal === "no" || value === "!" || value === "~") type = 'OPERATOR_NOT'; else if (lowerVal === "verdadero") { type = 'BOOLEAN_TRUE'; value = true; } else if (lowerVal === "falso") { type = 'BOOLEAN_FALSE'; value = false; }}
                if (type === 'OPERATOR_EQ') value = '='; if (type === 'OPERATOR_NEQ') value = '<>'; if (type === 'OPERATOR_LTE') value = '<='; if (type === 'OPERATOR_GTE') value = '>='; if (type === 'OPERATOR_LT') value = '<'; if (type === 'OPERATOR_GT') value = '>';
                tokens.push({ type: type, value: value, original: match[0] }); i = pattern.regex.lastIndex; matched = true; break;
            }
        }
        if (!matched) { const errCtx = exprStr.substring(Math.max(0,i-10),Math.min(exprStr.length,i+10)); const ptr=" ".repeat(Math.min(10,i))+"^"; throw new Error(`Tokenización: Inesperado '${exprStr[i]}'.\nContexto: ...${errCtx}...\n ${ptr}`);}
    } return tokens;
};
Webgoritmo.Expresiones.getOperatorPrecedence = function(opToken) {
    if (!opToken) return 0;
    switch (opToken.type) {
        case 'LPAREN': case 'LBRACKET': return 0;
        case 'OPERATOR_UNARY_MINUS': return 6;
        case 'OPERATOR_GET_ELEMENT': return 7;
    }
    if (typeof opToken.value !== 'string') return 0;
    switch (opToken.value.toUpperCase()) {
        case 'NO': case '!': case '~': return 6; case '^': return 5; case '*': case '/': case 'MOD': case '%': case 'DIV': return 4;
        case '+': case '-': return 3; case '=': case '<>': case '!=': case '<': case '>': case '<=': case '>=':
        case 'MENOR QUE': case 'MAYOR QUE': case 'MENOR O IGUAL QUE': case 'MAYOR O IGUAL QUE': case 'IGUAL QUE': case 'DISTINTO DE': return 2;
        case 'Y': case '&&': return 1; case 'O': case '||': return 1; default: return 0;
    }
};
Webgoritmo.Expresiones.isOperatorLeftAssociative = function(opToken) { if (!opToken) return true; return opToken.value !== '^'; };
Webgoritmo.Expresiones.infixToPostfix = function(tokens) { /* ... (como en Bloque 5/corrección anterior) ... */
    const outputQueue = []; const operatorStack = []; const processedTokens = [];
    for (let i = 0; i < tokens.length; i++) { const token = tokens[i]; if (token.type === 'OPERATOR_MINUS') { const prevToken = i > 0 ? tokens[i-1] : null; if (!prevToken || prevToken.type.startsWith('OPERATOR_') || prevToken.type === 'LPAREN' || prevToken.type === 'LBRACKET' || prevToken.type === 'COMMA') { processedTokens.push({ ...token, type: 'OPERATOR_UNARY_MINUS', value: '_UMINUS_' }); } else { processedTokens.push(token); } } else { processedTokens.push(token); } }
    let lastTokenWasIdentifier = false;
    for (const token of processedTokens) {
        switch (token.type) {
            case 'NUMBER': case 'STRING_LITERAL': case 'BOOLEAN_TRUE': case 'BOOLEAN_FALSE': case 'IDENTIFIER':
                outputQueue.push(token); lastTokenWasIdentifier = (token.type === 'IDENTIFIER'); break;
            case 'LBRACKET': operatorStack.push(token); lastTokenWasIdentifier = false; break;
            case 'RBRACKET':
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LBRACKET') { outputQueue.push(operatorStack.pop()); }
                if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1].type !== 'LBRACKET') { throw new Error("Sintaxis: Falta '['."); }
                operatorStack.pop(); // Pop LBRACKET
                outputQueue.push({ type: 'OPERATOR_GET_ELEMENT', value: '[]', original: '[]', dimensions: 1 }); // Asume 1D por ahora
                lastTokenWasIdentifier = false; break;
            case 'LPAREN': operatorStack.push(token); lastTokenWasIdentifier = false; break;
            case 'RPAREN':
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN') { outputQueue.push(operatorStack.pop()); }
                if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1].type !== 'LPAREN') { throw new Error("Sintaxis: Falta '('."); }
                operatorStack.pop(); lastTokenWasIdentifier = false; break;
            case 'COMMA':
                let foundSep = false; while (operatorStack.length > 0 ) { const topOp = operatorStack[operatorStack.length - 1]; if (topOp.type === 'LPAREN' || topOp.type === 'LBRACKET') { foundSep = true; break; } outputQueue.push(operatorStack.pop()); }
                if (!foundSep && operatorStack.length === 0) { throw new Error("Sintaxis: Coma inesperada.");}
                lastTokenWasIdentifier = false; break;
            default:
                if (token.type.startsWith('OPERATOR_')) {
                    const op1 = token; while (operatorStack.length > 0) { const op2 = operatorStack[operatorStack.length - 1]; if (op2.type === 'LPAREN' || op2.type === 'LBRACKET') break; const p1 = Webgoritmo.Expresiones.getOperatorPrecedence(op1); const p2 = Webgoritmo.Expresiones.getOperatorPrecedence(op2); if (p2 > p1 || (p2 === p1 && Webgoritmo.Expresiones.isOperatorLeftAssociative(op1))) { outputQueue.push(operatorStack.pop()); } else { break; } }
                    operatorStack.push(op1);
                } else { console.warn("Shunting-yard: Token no manejado:", token); }
                lastTokenWasIdentifier = false; break;
        }
    }
    while (operatorStack.length > 0) { const op = operatorStack.pop(); if (op.type === 'LPAREN' || op.type === 'LBRACKET') { throw new Error("Sintaxis: Paréntesis/corchetes no coinciden."); } outputQueue.push(op); }
    return outputQueue;
};

// --- Funciones de Ayuda para evaluateRPN ---
function obtenerValorReal(operando, numLineaOriginal, nombreOperando = "Operando") {
    if (operando === null || operando === undefined) {
        throw new Error(`Error en línea ${numLineaOriginal}: ${nombreOperando} es nulo o indefinido.`);
    }
    if (typeof operando === 'object' && operando.hasOwnProperty('value')) {
        if (operando.type === 'array') {
            throw new Error(`Error en línea ${numLineaOriginal}: No se puede usar el arreglo '${operando.name || 'arreglo'}' directamente como valor en esta operación. Se requieren índices.`);
        }
        return operando.value;
    }
    return operando; // Ya es un valor primitivo
}

Webgoritmo.Expresiones.evaluateRPN = async function(rpnQueue, scope, numLineaOriginal) {
    const valueStack = [];

    for (const token of rpnQueue) {
        if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.detenerEjecucion) throw new Error("Ejecución detenida.");

        switch (token.type) {
            case 'NUMBER':
            case 'STRING_LITERAL':
            case 'BOOLEAN_TRUE':
            case 'BOOLEAN_FALSE':
                valueStack.push(token.value);
                break;

            case 'IDENTIFIER':
                const varNameLc = token.value.toLowerCase();
                if (scope.hasOwnProperty(varNameLc)) {
                    valueStack.push(scope[varNameLc]); // Siempre pushear el objeto metadato
                } else {
                    throw new Error(`Error en línea ${numLineaOriginal}: Variable '${token.value}' no definida.`);
                }
                break;

            case 'OPERATOR_GET_ELEMENT': {
                const dimensionsToPop = token.dimensions;
                if (valueStack.length < dimensionsToPop + 1) {
                    throw new Error(`Error en línea ${numLineaOriginal}: Argumentos insuficientes para acceso al arreglo. Pila: ${JSON.stringify(valueStack.map(s => typeof s === 'object' ? s.name || s.type : s ))}`);
                }

                const indices = [];
                for (let d = 0; d < dimensionsToPop; d++) {
                    let rawIndex = valueStack.pop();
                    indices.unshift(obtenerValorReal(rawIndex, numLineaOriginal, "Índice de arreglo"));
                }

                const arrOperand = valueStack.pop(); // Esto DEBE ser un objeto metadato de arreglo

                if (!arrOperand || typeof arrOperand !== 'object' || arrOperand.type !== 'array') {
                    throw new Error(`Error en línea ${numLineaOriginal}: Se intentó acceder con índices a algo que no es un arreglo. Base: ${JSON.stringify(arrOperand)}`);
                }
                const arrMeta = arrOperand;

                if (arrMeta.dimensions.length !== dimensionsToPop) {
                    throw new Error(`Error en línea ${numLineaOriginal}: Dimensiones incorrectas para '${arrMeta.name || token.original}'. Esperadas ${arrMeta.dimensions.length}, usadas ${dimensionsToPop}.`);
                }

                let currentLevel = arrMeta.value;
                for (let k = 0; k < dimensionsToPop; k++) {
                    let idxVal = indices[k]; // Ya debería ser un valor primitivo por obtenerValorReal
                    if (typeof idxVal !== 'number' || !Number.isInteger(idxVal)){
                        if(typeof idxVal === 'number' && idxVal === Math.trunc(idxVal)) idxVal = Math.trunc(idxVal);
                        else throw new Error(`Error en línea ${numLineaOriginal}: Índice para '${arrMeta.name || token.original}' debe ser numérico entero. Se obtuvo '${indices[k]}' (tipo: ${typeof indices[k]}).`);
                    }
                    if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) {
                        throw new Error(`Error en línea ${numLineaOriginal}: Índice [${idxVal}] fuera de límites para dim ${k+1} de '${arrMeta.name || token.original}' (1..${arrMeta.dimensions[k]}).`);
                    }
                    if (k < dimensionsToPop - 1) currentLevel = currentLevel[idxVal];
                    else valueStack.push(currentLevel[idxVal]);
                }
                break;
            }

            case 'OPERATOR_UNARY_MINUS': {
                if (valueStack.length < 1) throw new Error(`Error en línea ${numLineaOriginal}: Falta operando para '-' unario.`);
                let op = obtenerValorReal(valueStack.pop(), numLineaOriginal, "Operando de '-' unario");
                const opType = Webgoritmo.Interprete.inferirTipo(op).toLowerCase();
                if (opType !== 'entero' && opType !== 'real') throw new Error(`Error en línea ${numLineaOriginal}: Operador '-' unario solo aplicable a números, se recibió '${opType}'.`);
                valueStack.push(-op);
                break;
            }
            case 'OPERATOR_PLUS':
            case 'OPERATOR_MINUS':
            case 'OPERATOR_MULTIPLY':
            case 'OPERATOR_DIVIDE':
            case 'OPERATOR_MOD':
            case 'OPERATOR_POW': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para '${token.original}'.`);
                let op2 = obtenerValorReal(valueStack.pop(), numLineaOriginal, "Operando derecho de "+token.original);
                let op1 = obtenerValorReal(valueStack.pop(), numLineaOriginal, "Operando izquierdo de "+token.original);
                if (token.type === 'OPERATOR_PLUS') valueStack.push(Webgoritmo.Expresiones.__pseudoSuma__(op1, op2, numLineaOriginal));
                else valueStack.push(Webgoritmo.Expresiones.__pseudoOperacionAritmetica__(op1, op2, token.value, numLineaOriginal));
                break;
            }
            case 'OPERATOR_NOT': {
                if (valueStack.length < 1) throw new Error(`Error en línea ${numLineaOriginal}: Falta operando para '${token.original}'.`);
                let op = obtenerValorReal(valueStack.pop(), numLineaOriginal, "Operando de 'NO'");
                valueStack.push(Webgoritmo.Expresiones.__pseudoNot__(op, numLineaOriginal));
                break;
            }
            case 'OPERATOR_AND':
            case 'OPERATOR_OR': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para '${token.original}'.`);
                let op2 = obtenerValorReal(valueStack.pop(), numLineaOriginal);
                let op1 = obtenerValorReal(valueStack.pop(), numLineaOriginal);
                valueStack.push(Webgoritmo.Expresiones.__pseudoOpLogicaBinaria__(op1, op2, token.value, numLineaOriginal));
                break;
            }
            case 'OPERATOR_EQ': case 'OPERATOR_NEQ': case 'OPERATOR_LT': case 'OPERATOR_GT': case 'OPERATOR_LTE': case 'OPERATOR_GTE': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para '${token.original}'.`);
                let op2 = obtenerValorReal(valueStack.pop(), numLineaOriginal);
                let op1 = obtenerValorReal(valueStack.pop(), numLineaOriginal);
                valueStack.push(Webgoritmo.Expresiones.__pseudoComparacion__(op1, op2, token.value, numLineaOriginal));
                break;
            }
            default:
                throw new Error(`Error en línea ${numLineaOriginal}: Token RPN no reconocido '${token.original}' (tipo: ${token.type}).`);
        }
    }

    if (valueStack.length !== 1) {
        console.error("Error RPN: Pila final no unitaria.", valueStack, rpnQueue);
        throw new Error(`Error en línea ${numLineaOriginal}: Expresión mal formada.`);
    }
    // El resultado final en la pila también podría ser un objeto metadato (si la expresión era solo un nombre de variable)
    // Devolver el valor real en ese caso, a menos que se espere el metadato (lo cual no es usual para el resultado de una expresión).
    return obtenerValorReal(valueStack[0], numLineaOriginal, "Resultado de expresión");
};

// --- Builtins y Helpers de operaciones (sin cambios) ---
Webgoritmo.Builtins = Webgoritmo.Builtins || {}; Webgoritmo.Builtins.funciones = { /* ... */ };
function __pseudoSuma__(op1, op2, numLinea) { /* ... */ }
Webgoritmo.Expresiones.__pseudoSuma__ = __pseudoSuma__;
function __pseudoOperacionAritmetica__(op1, op2, operador, numLinea, permiteCeroDivisor = false) { /* ... */ }
Webgoritmo.Expresiones.__pseudoOperacionAritmetica__ = __pseudoOperacionAritmetica__;
function __pseudoNot__(op, numLinea) { /* ... */ }
Webgoritmo.Expresiones.__pseudoNot__ = __pseudoNot__;
function __pseudoOpLogicaBinaria__(op1, op2, operador, numLinea) { /* ... */ }
Webgoritmo.Expresiones.__pseudoOpLogicaBinaria__ = __pseudoOpLogicaBinaria__;
function __pseudoComparacion__(op1, op2, operador, numLinea) { /* ... */ }
Webgoritmo.Expresiones.__pseudoComparacion__ = __pseudoComparacion__;

Webgoritmo.Expresiones.evaluarExpresion = async function(expr, scope) {
    // ... (Lógica de detección de llamada a función directa como antes) ...
    const originalExprStr = String(expr).trim();
    const numLinea = (Webgoritmo.estadoApp && Webgoritmo.estadoApp.currentLineInfo) ? Webgoritmo.estadoApp.currentLineInfo.numLineaOriginal : 'expresión';
    const funcCallMatch = originalExprStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/);
    if (funcCallMatch) {
        const funcName = funcCallMatch[1].toLowerCase();
        const argsStr = funcCallMatch[2];
        let argExprs = argsStr.trim() === '' ? [] : argsStr.split(',').map(a => a.trim()); // Simple split
        if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(funcName)) {
            // Llamada a función de usuario
            const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[funcName];
             if (defFuncion.retornoVarLc === null && !defFuncion.retornoVarOriginal) { // Asumiendo que si no tiene var de retorno, es un procedimiento
                 throw new Error(`Error en línea ${numLinea}: El SubProceso (procedimiento) '${funcCallMatch[1]}' no devuelve un valor y no puede ser usado en una expresión.`);
             }
            return await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(funcCallMatch[1], argExprs, scope, numLinea);
        } else if (Webgoritmo.Builtins && Webgoritmo.Builtins.funciones.hasOwnProperty(funcName)) {
            const evaluadosArgs = [];
            for (const argExpr of argExprs) {
                evaluadosArgs.push(await Webgoritmo.Expresiones.evaluarExpresion(argExpr, scope));
            }
            return Webgoritmo.Builtins.funciones[funcName](evaluadosArgs, numLinea);
        }
        // Si no es función de usuario ni builtin, podría ser una expresión con paréntesis, se deja al parser RPN.
    }

    console.log(`[evaluarExpresion] Evaluando con RPN: "${originalExprStr}"`);
    try {
        const tokens = Webgoritmo.Expresiones.tokenize(originalExprStr);
        // console.log("[evaluarExpresion] Tokens:", JSON.stringify(tokens.map(t => ({type: t.type, value: String(t.value), original: t.original}))));
        const rpn = Webgoritmo.Expresiones.infixToPostfix(tokens);
        // console.log("[evaluarExpresion] RPN:", JSON.stringify(rpn.map(t => ({type: t.type, value: String(t.value), original: t.original}))));
        const resultado = await Webgoritmo.Expresiones.evaluateRPN(rpn, scope, numLinea);
        console.log(`[evaluarExpresion] Resultado RPN para "${originalExprStr}":`, resultado);
        return resultado;
    } catch (e) {
        const errorMsg = e.message.includes(`línea ${numLinea}`) || e.message.includes("tokenización") || e.message.includes("sintaxis") ? e.message : `Error en línea ${numLinea} evaluando expresión '${originalExprStr}': ${e.message}`;
        console.error(errorMsg, e);
        throw new Error(errorMsg);
    }
};

// Copiar las funciones de utilidad que no cambian
Webgoritmo.Expresiones.pseudoAleatorio = function(min, max) { min = Number(min); max = Number(max); if (isNaN(min) || isNaN(max)) throw new Error("Args inválidos Aleatorio."); min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; };
Webgoritmo.Expresiones.pseudoAzar = function(n) { n = Number(n); if (isNaN(n)) throw new Error("Arg inválido Azar."); return Math.floor(Math.random() * n); };
Webgoritmo.Expresiones.__pseudoLongitud = function(cadena) { if (cadena === null || cadena === undefined) throw new Error("Arg inválido Longitud."); return String(cadena).length; };
Webgoritmo.Expresiones.__pseudoMayusculas = function(cadena) { if (cadena === null || cadena === undefined) throw new Error("Arg inválido Mayusculas."); return String(cadena).toUpperCase(); };
Webgoritmo.Expresiones.__pseudoMinusculas = function(cadena) { if (cadena === null || cadena === undefined) throw new Error("Arg inválido Minusculas."); return String(cadena).toLowerCase(); };
Webgoritmo.Expresiones.__pseudoConvertirATexto = function(valor) { if (valor === null || valor === undefined) return "nulo"; if (typeof valor === 'boolean') return valor ? "Verdadero" : "Falso"; return String(valor); };
Webgoritmo.Expresiones.__pseudoConvertirANumero = function(cadena) { if (cadena === null || cadena === undefined) throw new Error("Arg inválido ConvertirANumero."); const str = String(cadena).trim(); if (str === "") throw new Error("Cadena vacía a número."); const num = Number(str); if (isNaN(num)) throw new Error(`'${str}' no es número.`); return num; };
Webgoritmo.Expresiones.__pseudoSubcadena = function(cadena, inicio, fin) { if (cadena === null || cadena === undefined) throw new Error("Arg 'cadena' inválido Subcadena."); const s = String(cadena); const i = Number(inicio); const f = Number(fin); if (isNaN(i) || isNaN(f) || !Number.isInteger(i) || !Number.isInteger(f)) throw new Error("Args inicio/fin Subcadena deben ser enteros."); if (i <= 0 || f <= 0) throw new Error("Args inicio/fin Subcadena deben ser positivos."); if (i > f + 1 && i > s.length) return ""; if (i > f) return ""; return s.substring(i - 1, f);};
Webgoritmo.Builtins.funciones = { "rc": function(a,l){if(a.length!==1)throw new Error(`L${l} RC espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg RC numérico.`);if(n<0)throw new Error(`L${l} RC negativo.`);return Math.sqrt(n);},"raiz": function(a,l){return Webgoritmo.Builtins.funciones.rc(a,l);},"abs":function(a,l){if(a.length!==1)throw new Error(`L${l} ABS espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg ABS numérico.`);return Math.abs(n);},"ln":function(a,l){if(a.length!==1)throw new Error(`L${l} LN espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg LN numérico.`);if(n<=0)throw new Error(`L${l} Arg LN positivo.`);return Math.log(n);},"exp":function(a,l){if(a.length!==1)throw new Error(`L${l} EXP espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg EXP numérico.`);return Math.exp(n);},"sen":function(a,l){if(a.length!==1)throw new Error(`L${l} SEN espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg SEN numérico.`);return Math.sin(n);},"cos":function(a,l){if(a.length!==1)throw new Error(`L${l} COS espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg COS numérico.`);return Math.cos(n);},"tan":function(a,l){if(a.length!==1)throw new Error(`L${l} TAN espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg TAN numérico.`);return Math.tan(n);},"trunc":function(a,l){if(a.length!==1)throw new Error(`L${l} TRUNC espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg TRUNC numérico.`);return Math.trunc(n);},"redon":function(a,l){if(a.length!==1)throw new Error(`L${l} REDON espera 1 arg.`);const n=a[0];if(typeof n!=='number')throw new Error(`L${l} Arg REDON numérico.`);return Math.round(n);},"azar":function(a,l){if(a.length!==1)throw new Error(`L${l} AZAR espera 1 arg.`);const lim=a[0];if(typeof lim!=='number'||!Number.isInteger(lim)||lim<=0)throw new Error(`L${l} Arg AZAR entero positivo.`);return Math.floor(Math.random()*lim);},"aleatorio":function(a,l){if(a.length!==2)throw new Error(`L${l} ALEATORIO espera 2 args.`);const min=a[0];const max=a[1];if(typeof min!=='number'||!Number.isInteger(min)||typeof max!=='number'||!Number.isInteger(max))throw new Error(`L${l} Args ALEATORIO enteros.`);if(min>max)throw new Error(`L${l} En ALEATORIO min>max.`);return Math.floor(Math.random()*(max-min+1))+min;},"longitud":function(a,l){if(a.length!==1)throw new Error(`L${l} LONGITUD espera 1 arg.`);return String(a[0]).length;},"mayusculas":function(a,l){if(a.length!==1)throw new Error(`L${l} MAYUSCULAS espera 1 arg.`);return String(a[0]).toUpperCase();},"minusculas":function(a,l){if(a.length!==1)throw new Error(`L${l} MINUSCULAS espera 1 arg.`);return String(a[0]).toLowerCase();},"subcadena":function(a,l){if(a.length!==3)throw new Error(`L${l} SUBCADENA espera 3 args.`);const c=String(a[0]);const ini=a[1];const fn=a[2];if(typeof ini!=='number'||!Number.isInteger(ini)||typeof fn!=='number'||!Number.isInteger(fn))throw new Error(`L${l} Args SUBCADENA inicio/fin enteros.`);if(ini<=0)throw new Error(`L${l} Inicio SUBCADENA positivo.`);return c.substring(ini-1,fn);},"concatenar":function(a,l){if(a.length!==2)throw new Error(`L${l} CONCATENAR espera 2 args.`);return String(a[0])+String(a[1]);},"convertiranumero":function(a,l){if(a.length!==1)throw new Error(`L${l} CONVERTIRANUMERO espera 1 arg.`);const v=a[0];if(typeof v==='number')return v;const n=Number(String(v).trim());if(isNaN(n)||!isFinite(n))throw new Error(`L${l} No se pudo convertir '${v}' a número.`);return n;},"convertiratexto":function(a,l){if(a.length!==1)throw new Error(`L${l} CONVERTIRATEXTO espera 1 arg.`);const v=a[0];if(typeof v==='boolean')return v?'Verdadero':'Falso';return String(v);}};
Webgoritmo.Expresiones.__pseudoSuma__ = function(op1,op2,numLinea){const t1=Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();const t2=Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();if((t1==='entero'||t1==='real')&&(t2==='entero'||t2==='real'))return op1+op2;if((t1==='cadena'||t1==='caracter')&&(t2==='cadena'||t2==='caracter'))return String(op1)+String(op2);throw new Error(`L${numLinea} Tipos incompatibles para '+'.`);};
Webgoritmo.Expresiones.__pseudoOperacionAritmetica__ = function(op1,op2,operador,numLinea){const t1=Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();const t2=Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();if((t1!=='entero'&&t1!=='real')||(t2!=='entero'&&t2!=='real'))throw new Error(`L${numLinea} Op '${operador}' deben ser numéricos.`);if((operador==='/'||operador.toUpperCase()==='MOD'||operador==='%')&&op2===0)throw new Error(`L${numLinea} División por cero.`);switch(operador){case'-':return op1-op2;case'*':return op1*op2;case'/':return op1/op2;case'MOD':case'%':return op1%op2;case'^':return Math.pow(op1,op2);default:throw new Error(`L${numLinea} Op aritmético desconocido '${operador}'.`);}};
Webgoritmo.Expresiones.__pseudoNot__ = function(op,numLinea){const tOp=Webgoritmo.Interprete.inferirTipo(op).toLowerCase();if(tOp!=='logico')throw new Error(`L${numLinea} 'NO' solo para lógicos.`);return !op;};
Webgoritmo.Expresiones.__pseudoOpLogicaBinaria__ = function(op1,op2,operador,numLinea){const t1=Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();const t2=Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();if(t1!=='logico'||t2!=='logico')throw new Error(`L${numLinea} Op '${operador}' deben ser lógicos.`);switch(operador.toUpperCase()){case'Y':case'&&':return op1&&op2;case'O':case'||':return op1||op2;default:throw new Error(`L${numLinea} Op lógico binario desconocido '${operador}'.`);}};
Webgoritmo.Expresiones.__pseudoComparacion__ = function(op1,op2,operador,numLinea){const t1=Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();const t2=Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();if(!((t1==='entero'||t1==='real')&&(t2==='entero'||t2==='real')||(t1==='cadena'||t1==='caracter')&&(t2==='cadena'||t2==='caracter')||t1==='logico'&&t2==='logico'&&(operador==='='||operador==='<>')))throw new Error(`L${numLinea} Tipos incompatibles para '${operador}'.`);if((t1==='cadena'||t1==='caracter')&&(t2==='cadena'||t2==='caracter')){op1=String(op1);op2=String(op2);}switch(operador){case'=':return op1==op2;case'<>':return op1!=op2;case'<':return op1<op2;case'>':return op1>op2;case'<=':return op1<=op2;case'>=':return op1>=op2;default:throw new Error(`L${numLinea} Op comparación desconocido '${operador}'.`);}};

console.log("evaluadorExpresiones.js cargado (con correcciones sistemáticas en evaluateRPN v3).");
