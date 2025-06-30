// evaluadorExpresiones.js
// Contiene la función evaluarExpresion() expandida y sus helpers.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = Webgoritmo.Expresiones || {};

// --- Funciones Helper ---
function pseudoAleatorio(min, max) {
    min = Number(min); max = Number(max);
    if (isNaN(min) || isNaN(max)) throw new Error("Argumentos inválidos para Aleatorio(min,max).");
    min = Math.ceil(min); max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
Webgoritmo.Expresiones.pseudoAleatorio = pseudoAleatorio;
function pseudoAzar(n) {
    n = Number(n); if (isNaN(n)) throw new Error("Argumento inválido para Azar(n).");
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
    const s = String(cadena); const i = Number(inicio); const f = Number(fin);
    if (isNaN(i) || isNaN(f) || !Number.isInteger(i) || !Number.isInteger(f)) throw new Error("Los argumentos 'inicio' y 'fin' para Subcadena deben ser enteros.");
    if (i <= 0 || f <= 0) throw new Error("Los argumentos 'inicio' y 'fin' para Subcadena deben ser positivos (1-indexed).");
    if (i > f + 1 && i > s.length) return "";
    if (i > f) return "";
    return s.substring(i - 1, f);
}
Webgoritmo.Expresiones.__pseudoSubcadena = __pseudoSubcadena;
// --- Fin Funciones Helper ---

Webgoritmo.Expresiones.tokenize = function(exprStr) {
    const tokens = [];
    let i = 0;
    const originalLength = exprStr.length;
    const tokenPatterns = [
        { type: 'NUMBER', regex: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\.\d+(?:[eE][+-]?\d+)?\b/y },
        { type: 'STRING_LITERAL', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y },
        { type: 'BOOLEAN_TRUE', regex: /\bVerdadero\b/iy },
        { type: 'BOOLEAN_FALSE', regex: /\bFalso\b/iy },
        { type: 'OPERATOR_LTE', regex: /<=|menor o igual que/iy },
        { type: 'OPERATOR_GTE', regex: />=|mayor o igual que/iy },
        { type: 'OPERATOR_NEQ', regex: /<>|!=|distinto de/iy },
        { type: 'OPERATOR_EQ', regex: /==|=igual que|=/iy },
        { type: 'OPERATOR_LT', regex: /<|menor que/iy },
        { type: 'OPERATOR_GT', regex: />|mayor que/iy },
        { type: 'OPERATOR_AND', regex: /\bY\b|&&/iy },
        { type: 'OPERATOR_OR', regex: /\bO\b|\|\|/iy },
        { type: 'OPERATOR_NOT', regex: /\bNO\b|!|~/iy },
        { type: 'OPERATOR_MOD', regex: /\bMOD\b|%/iy },
        { type: 'OPERATOR_POW', regex: /\^/y },
        { type: 'OPERATOR_MULTIPLY', regex: /\*/y },
        { type: 'OPERATOR_DIVIDE', regex: /\//y },
        { type: 'OPERATOR_PLUS', regex: /\+/y },
        { type: 'OPERATOR_MINUS', regex: /-/y },
        { type: 'LPAREN', regex: /\(/y },
        { type: 'RPAREN', regex: /\)/y },
        { type: 'LBRACKET', regex: /\[/y },
        { type: 'RBRACKET', regex: /\]/y },
        { type: 'COMMA', regex: /,/y },
        { type: 'IDENTIFIER', regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/y }
    ];
    while (i < originalLength) {
        const whitespaceRegex = /\s+/y;
        whitespaceRegex.lastIndex = i;
        const wsMatch = whitespaceRegex.exec(exprStr);
        if (wsMatch && wsMatch.index === i) {
            i = whitespaceRegex.lastIndex;
            if (i >= originalLength) break;
        }
        let matched = false;
        for (const pattern of tokenPatterns) {
            pattern.regex.lastIndex = i;
            const match = pattern.regex.exec(exprStr);
            if (match && match.index === i) {
                let value = match[0];
                let type = pattern.type;
                if (type === 'NUMBER') value = parseFloat(value);
                else if (type === 'STRING_LITERAL') value = value.substring(1, value.length - 1).replace(/\\(["'\\])/g, '$1');
                else if (type === 'BOOLEAN_TRUE') value = true;
                else if (type === 'BOOLEAN_FALSE') value = false;
                else if (type === 'IDENTIFIER') {
                    const lowerVal = value.toLowerCase();
                    if (lowerVal === "mod") type = 'OPERATOR_MOD';
                    else if (lowerVal === "y" || value === "&&") type = 'OPERATOR_AND';
                    else if (lowerVal === "o" || value === "||") type = 'OPERATOR_OR';
                    else if (lowerVal === "no" || value === "!" || value === "~") type = 'OPERATOR_NOT';
                    else if (lowerVal === "verdadero") { type = 'BOOLEAN_TRUE'; value = true; }
                    else if (lowerVal === "falso") { type = 'BOOLEAN_FALSE'; value = false; }
                }
                if (type === 'OPERATOR_EQ') value = '=';
                if (type === 'OPERATOR_NEQ') value = '<>';
                if (type === 'OPERATOR_LTE') value = '<=';
                if (type === 'OPERATOR_GTE') value = '>=';
                if (type === 'OPERATOR_LT') value = '<';
                if (type === 'OPERATOR_GT') value = '>';
                tokens.push({ type: type, value: value, original: match[0] });
                i = pattern.regex.lastIndex;
                matched = true;
                break;
            }
        }
        if (!matched) {
            const errorContext = exprStr.substring(Math.max(0, i - 10), Math.min(exprStr.length, i + 10));
            const pointer = " ".repeat(Math.min(10, i)) + "^";
            throw new Error(`Error de tokenización: Caracter inesperado '${exprStr[i]}' en la expresión.\nContexto: ...${errorContext}...\n          ${pointer}`);
        }
    }
    return tokens;
};

Webgoritmo.Expresiones.getOperatorPrecedence = function(opToken) {
    if (!opToken) return 0;
    // Asignar precedencia a LBRACKET para que los operadores dentro del índice se manejen correctamente.
    // OPERATOR_ARRAY_ACCESS (que se generará) tendrá alta precedencia.
    switch (opToken.type) {
        case 'LPAREN': case 'LBRACKET': return 0; // Se manejan por emparejamiento, no por precedencia directa aquí.
    }
    switch (opToken.value.toUpperCase()) {
        case '[]': return 7; // Acceso a arreglo, la más alta precedencia (como llamada a función)
        case '_UMINUS_': return 6; // Menos unario
        case 'NO': case '!': case '~': return 6;
        case '^': return 5;
        case '*': case '/': case 'MOD': case '%': case 'DIV': return 4;
        case '+': case '-': return 3;
        case '=': case '<>': case '!=': case '<': case '>': case '<=': case '>=': return 2;
        case 'Y': case '&&': return 1;
        case 'O': case '||': return 1;
        default: return 0;
    }
};

Webgoritmo.Expresiones.isOperatorLeftAssociative = function(opToken) {
    if (!opToken) return true;
    return opToken.value !== '^';
};

Webgoritmo.Expresiones.infixToPostfix = function(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    const processedTokens = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'OPERATOR_MINUS') {
            const prevToken = i > 0 ? tokens[i-1] : null;
            if (!prevToken || prevToken.type.startsWith('OPERATOR_') || prevToken.type === 'LPAREN' || prevToken.type === 'LBRACKET' || prevToken.type === 'COMMA') {
                processedTokens.push({ ...token, type: 'OPERATOR_UNARY_MINUS', value: '_UMINUS_' });
            } else {
                processedTokens.push(token);
            }
        } else {
            processedTokens.push(token);
        }
    }

    let lastTokenWasIdentifier = false;

    for (const token of processedTokens) {
        switch (token.type) {
            case 'NUMBER':
            case 'STRING_LITERAL':
            case 'BOOLEAN_TRUE':
            case 'BOOLEAN_FALSE':
            case 'IDENTIFIER':
                outputQueue.push(token);
                lastTokenWasIdentifier = (token.type === 'IDENTIFIER');
                break;

            case 'LBRACKET': // Inicio de acceso a arreglo
                // El IDENTIFIER precedente ya debería estar en outputQueue.
                // Empujamos LBRACKET a la pila para marcar el inicio de la(s) expresión(es) de índice.
                if (!lastTokenWasIdentifier && !(operatorStack.length > 0 && operatorStack[operatorStack.length-1].type === 'RBRACKET_AFTER_FUNC_CALL_IN_ARRAY_IDX') ) { // RBRACKET_AFTER_FUNC_CALL_IN_ARRAY_IDX es un hack mental, no real
                    // Esto es para el caso `matriz[func(x)][indice2]` donde `func(x)` es un índice.
                    // O si el token anterior fue un RBRACKET de un acceso anidado: arr[otro_arr[i]]
                    // Necesitamos una forma más robusta de saber si el LBRACKET es para un array access o algo más (si PSeInt tuviera otros usos para [])
                    // Por ahora, asumimos que LBRACKET siempre sigue a un IDENTIFIER que es un array, o a un RBRACKET de un acceso anidado.
                    // La validación de que el IDENTIFIER es un array se hará en evaluateRPN.
                }
                operatorStack.push(token);
                lastTokenWasIdentifier = false;
                break;

            case 'RBRACKET': // Fin de acceso a arreglo
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LBRACKET') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1].type !== 'LBRACKET') {
                    throw new Error("Error de sintaxis: Corchetes no coincidentes (falta '[').");
                }
                operatorStack.pop(); // Pop LBRACKET
                // Añadir el operador de acceso a arreglo. Asumimos 1D por ahora. Contar comas para N-D.
                // Para contar dimensiones, necesitaríamos procesar las comas dentro de los corchetes.
                let dimensions = 1; // Default a 1D
                // Una forma simple de contar dimensiones es ver cuántos operandos para índices hay antes del IDENTIFIER del array en la outputQueue
                // Esto es complejo. Por ahora, forzamos 1D y el evaluador RPN tomará 1 índice.
                outputQueue.push({ type: 'OPERATOR_GET_ELEMENT', value: '[]', original: '[]', dimensions: dimensions });
                lastTokenWasIdentifier = false; // Un acceso a arreglo produce un valor, no es un identificador para el siguiente LBRACKET
                break;

            case 'LPAREN':
                operatorStack.push(token);
                lastTokenWasIdentifier = false;
                break;

            case 'RPAREN':
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
                    throw new Error("Error de sintaxis: Paréntesis no coincidentes (falta '(').");
                }
                operatorStack.pop(); // Discard LPAREN
                lastTokenWasIdentifier = false;
                break;

            case 'COMMA':
                 while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN' && operatorStack[operatorStack.length-1].type !== 'LBRACKET') {
                    outputQueue.push(operatorStack.pop());
                }
                // La coma en sí no va a la outputQueue para expresiones simples.
                // Para funciones/arreglos multidimensionales, el OPERATOR_GET_ELEMENT o FUNCTION_CALL sabría cuántos argumentos/índices tomar.
                // Por ahora, para arr[idx1], la coma no debería aparecer o causará error si no está en una función dentro del índice.
                lastTokenWasIdentifier = false;
                break;

            default: // Operadores
                if (token.type.startsWith('OPERATOR_')) {
                    const op1 = token;
                    while (operatorStack.length > 0) {
                        const op2 = operatorStack[operatorStack.length - 1];
                        if (op2.type === 'LPAREN' || op2.type === 'LBRACKET') break;

                        const op1Precedence = Webgoritmo.Expresiones.getOperatorPrecedence(op1);
                        const op2Precedence = Webgoritmo.Expresiones.getOperatorPrecedence(op2);

                        if (op2Precedence > op1Precedence || (op2Precedence === op1Precedence && Webgoritmo.Expresiones.isOperatorLeftAssociative(op1))) {
                            outputQueue.push(operatorStack.pop());
                        } else {
                            break;
                        }
                    }
                    operatorStack.push(op1);
                } else {
                     console.warn("Shunting-yard: Token desconocido o no manejado:", token);
                }
                lastTokenWasIdentifier = false;
                break;
        }
    }

    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op.type === 'LPAREN' || op.type === 'LBRACKET') {
            throw new Error("Error de sintaxis: Paréntesis/corchetes no coincidentes.");
        }
        outputQueue.push(op);
    }
    return outputQueue;
};

Webgoritmo.Expresiones.evaluateRPN = async function(rpnQueue, scope, numLineaOriginal) {
    const valueStack = [];

    for (const token of rpnQueue) {
        if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.detenerEjecucion) {
            throw new Error("Ejecución detenida por el usuario o error previo.");
        }

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
                    // Se pushea el objeto metadato completo. El operador de acceso (si existe) o la asignación lo usarán.
                    // Si se usa en una expresión donde se espera un valor y es un array, se producirá error más adelante si no hay acceso.
                    valueStack.push(scope[varNameLc]);
                } else {
                    // Podría ser una función sin argumentos, PSeInt lo permite (ej. azar)
                    // Pero las funciones built-in se manejan en evaluarExpresion fase 1.
                    // Si llega aquí, es una variable no definida.
                    throw new Error(`Error en línea ${numLineaOriginal}: Variable '${token.value}' no definida.`);
                }
                break;

            case 'OPERATOR_GET_ELEMENT': { // value: '[]', dimensions: 1 (por ahora)
                if (valueStack.length < 1 + token.dimensions) { // 1 para el array mismo, token.dimensions para los índices
                    throw new Error(`Error en línea ${numLineaOriginal}: Argumentos insuficientes en la pila para el acceso al arreglo.`);
                }
                const indices = [];
                for (let d = 0; d < token.dimensions; d++) {
                    indices.unshift(valueStack.pop()); // Los índices se pushearon en orden, se sacan en inverso
                }
                const arrOperand = valueStack.pop(); // Debería ser el objeto metadato del arreglo

                if (!arrOperand || typeof arrOperand !== 'object' || arrOperand.type !== 'array') {
                    throw new Error(`Error en línea ${numLineaOriginal}: Se intentó acceder con índices a algo que no es un arreglo ('${arrOperand ? arrOperand.value : arrOperand}').`);
                }
                const arrMeta = arrOperand;

                if (arrMeta.dimensions.length !== token.dimensions) {
                    throw new Error(`Error en línea ${numLineaOriginal}: Número incorrecto de dimensiones para '${arrMeta.name || token.original}'. Esperadas ${arrMeta.dimensions.length}, recibidas ${token.dimensions}.`);
                }

                let currentLevel = arrMeta.value;
                for (let k = 0; k < token.dimensions; k++) {
                    let idxVal = indices[k];
                    if (typeof idxVal !== 'number' || !Number.isInteger(idxVal)){
                        // Permitir truncamiento si es un real que representa un entero
                        if(typeof idxVal === 'number' && idxVal === Math.trunc(idxVal)) {
                            idxVal = Math.trunc(idxVal);
                        } else {
                            throw new Error(`Error en línea ${numLineaOriginal}: Índice para '${arrMeta.name || token.original}' debe ser numérico entero. Se obtuvo '${indices[k]}'.`);
                        }
                    }
                    if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) {
                        throw new Error(`Error en línea ${numLineaOriginal}: Índice [${idxVal}] fuera de límites para dimensión ${k+1} de '${arrMeta.name || token.original}' (1..${arrMeta.dimensions[k]}).`);
                    }
                    if (k < token.dimensions - 1) {
                        currentLevel = currentLevel[idxVal];
                        if (currentLevel === undefined) {
                             throw new Error(`Error en línea ${numLineaOriginal}: Error accediendo sub-arreglo de '${arrMeta.name || token.original}'.`);
                        }
                    } else { // Última dimensión
                        valueStack.push(currentLevel[idxVal]);
                    }
                }
                break;
            }

            case 'OPERATOR_PLUS': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador '+'.`);
