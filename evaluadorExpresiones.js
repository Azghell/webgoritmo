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
        { type: 'LBRACKET', regex: /\[/y }, // Corchete izquierdo
        { type: 'RBRACKET', regex: /\]/y }, // Corchete derecho
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

    switch (opToken.type) {
        case 'LPAREN':
        case 'LBRACKET':
            return 0; // Se manejan por emparejamiento.
        case 'OPERATOR_UNARY_MINUS':
            return 6;
        case 'OPERATOR_GET_ELEMENT': // Creado en infixToPostfix
            return 7; // Precedencia más alta, como llamada a función.
        // NOTA: OPERATOR_NOT se maneja por valor más abajo.
    }

    if (typeof opToken.value !== 'string') return 0;

    switch (opToken.value.toUpperCase()) {
        case 'NO': case '!': case '~': return 6; // NOT lógico (unario)
        case '^': return 5; // Potencia
        case '*': case '/': case 'MOD': case '%': case 'DIV': return 4;
        case '+': case '-': return 3; // Suma, Resta (binaria)
        case '=': case '<>': case '!=': case '<': case '>': case '<=': case '>=':
        case 'MENOR QUE': case 'MAYOR QUE': case 'MENOR O IGUAL QUE': case 'MAYOR O IGUAL QUE': case 'IGUAL QUE': case 'DISTINTO DE':
            return 2; // Relacionales
        case 'Y': case '&&': return 1; // AND lógico
        case 'O': case '||': return 1; // OR lógico
        default: return 0;
    }
};

Webgoritmo.Expresiones.isOperatorLeftAssociative = function(opToken) {
    if (!opToken) return true;
    return opToken.value !== '^'; // Potencia es asociativa a la derecha
};

Webgoritmo.Expresiones.infixToPostfix = function(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    const processedTokens = [];

    // Manejo de menos unario
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'OPERATOR_MINUS') {
            const prevToken = i > 0 ? tokens[i-1] : null;
            if (!prevToken || prevToken.type.startsWith('OPERATOR_') || prevToken.type === 'LPAREN' || prevToken.type === 'LBRACKET' || prevToken.type === 'COMMA') {
                processedTokens.push({ ...token, type: 'OPERATOR_UNARY_MINUS', value: '_UMINUS_' });
            } else {
                processedTokens.push(token); // Menos binario
            }
        } else {
            processedTokens.push(token);
        }
    }

    let lastTokenWasIdentifier = false; // Para ayudar a LBRACKET a saber si sigue a un IDENTIFIER

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
                // El IDENTIFIER precedente (nombre del arreglo) ya debería estar en outputQueue.
                operatorStack.push(token); // Empujar LBRACKET a la pila.
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
                // Añadir el operador de acceso a arreglo.
                // Por ahora, asumimos una dimensión. El evaluador RPN tomará un índice.
                // Para múltiples dimensiones, necesitaríamos contar comas o tener un token OPERATOR_GET_ELEMENT más inteligente.
                outputQueue.push({ type: 'OPERATOR_GET_ELEMENT', value: '[]', original: '[]', dimensions: 1 });
                lastTokenWasIdentifier = false;
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
                // Las comas se usan para separar argumentos de funciones o índices de arreglos.
                // Deben desapilar operadores hasta el LPAREN o LBRACKET correspondiente.
                let foundSeparator = false;
                while (operatorStack.length > 0 ) {
                    const topOp = operatorStack[operatorStack.length - 1];
                    if (topOp.type === 'LPAREN' || topOp.type === 'LBRACKET') {
                        foundSeparator = true;
                        break;
                    }
                    outputQueue.push(operatorStack.pop());
                }
                if (!foundSeparator && operatorStack.length === 0) { // Coma sin un LPAREN/LBRACKET antes en la pila
                    // Esto podría ser un error o una coma al inicio/final de una lista de argumentos.
                    // Por ahora, si no encuentra un delimitador, es un error.
                     throw new Error("Error de sintaxis: Coma inesperada o mal ubicada.");
                }
                // La coma en sí no se añade a la outputQueue para expresiones.
                // Su propósito es separar los operandos que ya están (o estarán) en la outputQueue.
                // El token OPERATOR_GET_ELEMENT o FUNCTION_CALL necesitará saber cuántos argumentos/índices consumir.
                // Para OPERATOR_GET_ELEMENT, estamos asumiendo `dimensions: 1` por ahora.
                // Para funciones, esto es más complejo y no está completamente implementado aquí.
                lastTokenWasIdentifier = false;
                break;

            default: // Operadores
                if (token.type.startsWith('OPERATOR_')) {
                    const op1 = token;
                    while (operatorStack.length > 0) {
                        const op2 = operatorStack[operatorStack.length - 1];
                        // No sacar LPAREN o LBRACKET de la pila con operadores normales.
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
        if (op.type === 'LPAREN' || op.type === 'LBRACKET') { // Si queda un LPAREN o LBRACKET, hay un error de emparejamiento.
            throw new Error("Error de sintaxis: Paréntesis o corchetes no coincidentes.");
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
                    // Para la evaluación RPN, si es un identificador, es el nombre de una variable o arreglo.
                    // Si es un arreglo, se pushea su objeto metadato. El OPERATOR_GET_ELEMENT lo usará.
                    // Si es una variable simple, se pushea su valor.
                    // La distinción entre valor y metadato se vuelve importante.
                    // Por ahora, pusheamos el metadato. Si se usa donde se espera un valor simple y es un array,
                    // los operadores binarios/unarios fallarán si no pueden operar con el objeto metadato.
                    valueStack.push(scope[varNameLc]); // PUSHEAR EL OBJETO METADATO COMPLETO
                } else {
                    throw new Error(`Error en línea ${numLineaOriginal}: Variable '${token.value}' no definida.`);
                }
                break;

            case 'OPERATOR_GET_ELEMENT': { // value: '[]', dimensions: 1 (por ahora)
                const dimensionsToPop = token.dimensions; // Debería ser 1 por ahora.
                if (valueStack.length < dimensionsToPop + 1) { // +1 para el propio arreglo en la pila
                    throw new Error(`Error en línea ${numLineaOriginal}: Argumentos insuficientes en la pila para el acceso al arreglo (necesita ${dimensionsToPop} índice(s) y el arreglo). Pila: ${JSON.stringify(valueStack)}`);
                }

                const indices = [];
                for (let d = 0; d < dimensionsToPop; d++) {
                    indices.unshift(valueStack.pop());
                }

                const arrOperand = valueStack.pop(); // Debería ser el objeto metadato del arreglo

                if (!arrOperand || typeof arrOperand !== 'object' || arrOperand.type !== 'array') {
                    // Si arrOperand es un valor simple (ej. un número que se pusheó de una variable con el mismo nombre que un arreglo pero en otro ámbito)
                    // esto es un error. El IDENTIFIER del arreglo debió pushear su objeto metadato.
                    let arrOriginalName = "desconocido";
                    // Intentar obtener el nombre original si es posible (no directamente desde arrOperand si ya es un valor)
                    // Esto es difícil aquí. El error debe ser claro.
                    throw new Error(`Error en línea ${numLineaOriginal}: Se intentó acceder con índices a algo que no es un arreglo. Se obtuvo: ${JSON.stringify(arrOperand)}`);
                }
                const arrMeta = arrOperand; // Ahora arrMeta ES el objeto {value, type, baseType, dimensions}

                if (arrMeta.dimensions.length !== dimensionsToPop) { // Validar contra las dimensiones reales del arreglo
                    throw new Error(`Error en línea ${numLineaOriginal}: Número incorrecto de dimensiones para el arreglo '${arrMeta.name || token.original}'. Esperadas ${arrMeta.dimensions.length}, se intentaron usar ${dimensionsToPop}.`);
                }

                let currentLevel = arrMeta.value; // Acceder al array JS interno
                for (let k = 0; k < dimensionsToPop; k++) {
                    let idxVal = indices[k];
                    // Validar y convertir índice
                    if (typeof idxVal !== 'number' || !Number.isInteger(idxVal)){
                        if(typeof idxVal === 'number' && idxVal === Math.trunc(idxVal)) {
                            idxVal = Math.trunc(idxVal);
                        } else {
                            throw new Error(`Error en línea ${numLineaOriginal}: Índice para '${arrMeta.name || token.original}' debe ser numérico entero. Se obtuvo '${indices[k]}'.`);
                        }
                    }
                    // Validar límites (PSeInt es 1-indexed)
                    if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) {
                        throw new Error(`Error en línea ${numLineaOriginal}: Índice [${idxVal}] fuera de límites para dimensión ${k+1} de '${arrMeta.name || token.original}' (1..${arrMeta.dimensions[k]}).`);
                    }

                    if (k < dimensionsToPop - 1) { // Si hay más dimensiones por acceder
                        currentLevel = currentLevel[idxVal];
                        if (currentLevel === undefined) { // Error si una sub-dimensión no existe (no debería pasar en PSeInt si está bien inicializado)
                             throw new Error(`Error en línea ${numLineaOriginal}: Error accediendo sub-arreglo de '${arrMeta.name || token.original}'.`);
                        }
                    } else { // Última dimensión, obtener el valor
                        valueStack.push(currentLevel[idxVal]);
                    }
                }
                break;
            }

            case 'OPERATOR_UNARY_MINUS': {
                if (valueStack.length < 1) throw new Error(`Error en línea ${numLineaOriginal}: Falta operando para '-' unario.`);
                let op = valueStack.pop();
                // Si op es un objeto metadato (porque era un IDENTIFIER), tomar su .value
                if (typeof op === 'object' && op !== null && op.hasOwnProperty('value')) op = op.value;

                const opType = Webgoritmo.Interprete.inferirTipo(op).toLowerCase();
                if (opType !== 'entero' && opType !== 'real') {
                    throw new Error(`Error en línea ${numLineaOriginal}: Operador '-' unario solo aplicable a números, se recibió '${opType}'.`);
                }
                valueStack.push(-op);
                break;
            }
            case 'OPERATOR_PLUS':
            case 'OPERATOR_MINUS':
            case 'OPERATOR_MULTIPLY':
            case 'OPERATOR_DIVIDE':
            case 'OPERATOR_MOD':
            case 'OPERATOR_POW': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador '${token.original}'.`);
                let op2 = valueStack.pop();
                let op1 = valueStack.pop();
                // Extraer .value si son metadatos de variables
                if (typeof op1 === 'object' && op1 !== null && op1.hasOwnProperty('value')) op1 = op1.value;
                if (typeof op2 === 'object' && op2 !== null && op2.hasOwnProperty('value')) op2 = op2.value;

                if (token.type === 'OPERATOR_PLUS') {
                    valueStack.push(Webgoritmo.Expresiones.__pseudoSuma__(op1, op2, numLineaOriginal));
                } else {
                    valueStack.push(Webgoritmo.Expresiones.__pseudoOperacionAritmetica__(op1, op2, token.value, numLineaOriginal));
                }
                break;
            }
            case 'OPERATOR_NOT': {
                if (valueStack.length < 1) throw new Error(`Error en línea ${numLineaOriginal}: Falta operando para el operador '${token.original}'.`);
                let op = valueStack.pop();
                if (typeof op === 'object' && op !== null && op.hasOwnProperty('value')) op = op.value;
                valueStack.push(Webgoritmo.Expresiones.__pseudoNot__(op, numLineaOriginal));
                break;
            }
            case 'OPERATOR_AND':
            case 'OPERATOR_OR': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador '${token.original}'.`);
                let op2 = valueStack.pop();
                let op1 = valueStack.pop();
                if (typeof op1 === 'object' && op1 !== null && op1.hasOwnProperty('value')) op1 = op1.value;
                if (typeof op2 === 'object' && op2 !== null && op2.hasOwnProperty('value')) op2 = op2.value;
                valueStack.push(Webgoritmo.Expresiones.__pseudoOpLogicaBinaria__(op1, op2, token.value, numLineaOriginal));
                break;
            }
            case 'OPERATOR_EQ':
            case 'OPERATOR_NEQ':
            case 'OPERATOR_LT':
            case 'OPERATOR_GT':
            case 'OPERATOR_LTE':
            case 'OPERATOR_GTE': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador de comparación '${token.original}'.`);
                let op2 = valueStack.pop();
                let op1 = valueStack.pop();
                if (typeof op1 === 'object' && op1 !== null && op1.hasOwnProperty('value')) op1 = op1.value;
                if (typeof op2 === 'object' && op2 !== null && op2.hasOwnProperty('value')) op2 = op2.value;
                valueStack.push(Webgoritmo.Expresiones.__pseudoComparacion__(op1, op2, token.value, numLineaOriginal));
                break;
            }
            default:
                throw new Error(`Error en línea ${numLineaOriginal}: Operador o token RPN no reconocido/implementado '${token.original}' (tipo: ${token.type}, valor: ${token.value}).`);
        }
    }

    if (valueStack.length !== 1) {
        console.error("Error en evaluador RPN: Pila de valores final no tiene un solo elemento.", valueStack, rpnQueue);
        throw new Error(`Error en línea ${numLineaOriginal}: Expresión mal formada o error interno del evaluador RPN.`);
    }
    // Si el valor final es un objeto metadato (porque era un IDENTIFIER de arreglo que no se accedió), extraer su .value
    let resultadoFinal = valueStack[0];
    if (typeof resultadoFinal === 'object' && resultadoFinal !== null && resultadoFinal.hasOwnProperty('value') && resultadoFinal.hasOwnProperty('type')) {
        // Si es un objeto metadato y se esperaba un valor simple (ej. `a <- miArreglo` sin índices), esto es un error semántico.
        // Pero si la expresión era solo "miArreglo", y la evaluación es para, digamos, inspección, podría ser válido devolver el objeto.
        // Por ahora, para evaluación de expresiones que resultan en valor simple, si queda un metadato de arreglo, es un error.
        if (resultadoFinal.type === 'array') {
             throw new Error(`Error en línea ${numLineaOriginal}: La expresión resultó en un arreglo ('${resultadoFinal.name || "arreglo"}') pero se esperaba un valor simple.`);
        }
        // Si no es array, pero es metadato, tomar el valor. Esto es para variables simples.
        resultadoFinal = resultadoFinal.value;
    }
    return resultadoFinal;
};

// Definiciones de Builtins y Helpers (__pseudoSuma__, etc.) sin cambios...
// ... (el resto del archivo es igual que antes)
window.Webgoritmo.Builtins = window.Webgoritmo.Builtins || {};
Webgoritmo.Builtins.funciones = {
    "rc": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función RC espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para RC debe ser numérico, se recibió '${typeof num}'.`);
        if (num < 0) throw new Error(`Error en línea ${numLineaOriginalLlamada}: No se puede calcular la raíz cuadrada de un número negativo (${num}).`);
        return Math.sqrt(num);
    },
    "raiz": function(args, numLineaOriginalLlamada) { return Webgoritmo.Builtins.funciones.rc(args, numLineaOriginalLlamada); },
    "abs": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función ABS espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para ABS debe ser numérico, se recibió '${typeof num}'.`);
        return Math.abs(num);
    },
    "ln": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función LN espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para LN debe ser numérico, se recibió '${typeof num}'.`);
        if (num <= 0) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para LN debe ser positivo (${num}).`);
        return Math.log(num);
    },
    "exp": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función EXP espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para EXP debe ser numérico, se recibió '${typeof num}'.`);
        return Math.exp(num);
    },
    "sen": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función SEN espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para SEN debe ser numérico, se recibió '${typeof num}'.`);
        return Math.sin(num);
    },
    "cos": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función COS espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para COS debe ser numérico, se recibió '${typeof num}'.`);
        return Math.cos(num);
    },
    "tan": function(args, numLineaOriginalLlamada) {
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
    "redon": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función REDON espera 1 argumento, se recibieron ${args.length}.`);
        const num = args[0];
        if (typeof num !== 'number') throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para REDON debe ser numérico, se recibió '${typeof num}'.`);
        return Math.round(num);
    },
    "azar": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función AZAR espera 1 argumento (límite superior exclusivo), se recibieron ${args.length}.`);
        const limite = args[0];
        if (typeof limite !== 'number' || !Number.isInteger(limite) || limite <= 0) {
            throw new Error(`Error en línea ${numLineaOriginalLlamada}: Argumento para AZAR debe ser un entero positivo, se recibió '${limite}'.`);
        }
        return Math.floor(Math.random() * limite);
    },
    "aleatorio": function(args, numLineaOriginalLlamada) {
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
    "longitud": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función LONGITUD espera 1 argumento, se recibieron ${args.length}.`);
        return String(args[0]).length;
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
        if (inicio <= 0) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Inicio para SUBCADENA debe ser positivo.`);
        return cad.substring(inicio - 1, fin);
    },
    "concatenar": function(args, numLineaOriginalLlamada) {
        if (args.length !== 2) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función CONCATENAR espera 2 argumentos, se recibieron ${args.length}.`);
        return String(args[0]) + String(args[1]);
    },
    "convertiranumero": function(args, numLineaOriginalLlamada) {
        if (args.length !== 1) throw new Error(`Error en línea ${numLineaOriginalLlamada}: Función CONVERTIRANUMERO espera 1 argumento, se recibieron ${args.length}.`);
        const val = args[0];
        if (typeof val === 'number') return val;
        const num = Number(String(val).trim());
        if (isNaN(num) || !isFinite(num)) {
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
};

function __pseudoSuma__(op1, op2, numLinea) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();
    if (tipo1 === 'entero' || tipo1 === 'real') {
        if (tipo2 === 'entero' || tipo2 === 'real') return op1 + op2;
        else throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. No se puede sumar '${tipo1}' con '${tipo2}'.`);
    } else if (tipo1 === 'cadena' || tipo1 === 'caracter') {
        if (tipo2 === 'cadena' || tipo2 === 'caracter') return String(op1) + String(op2);
        else if (tipo2 === 'entero' || tipo2 === 'real' || tipo2 === 'logico')
            throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. No se puede concatenar '${tipo1}' con '${tipo2}' implícitamente. Use CONVERTIRATEXTO.`);
        else throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. Operación no definida entre '${tipo1}' y '${tipo2}'.`);
    } else if (tipo1 === 'logico')
        throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '+'. No se puede usar '+' con tipo '${tipo1}'.`);
    throw new Error(`Error en línea ${numLinea}: Operación '+' no soportada para los tipos '${tipo1}' y '${tipo2}'.`);
}
Webgoritmo.Expresiones.__pseudoSuma__ = __pseudoSuma__;

function __pseudoOperacionAritmetica__(op1, op2, operador, numLinea, permiteCeroDivisor = false) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();
    if ((tipo1 !== 'entero' && tipo1 !== 'real') || (tipo2 !== 'entero' && tipo2 !== 'real'))
        throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '${operador}'. Ambos operandos deben ser numéricos. Se encontraron '${tipo1}' y '${tipo2}'.`);
    if (!permiteCeroDivisor && (operador === '/' || operador.toUpperCase() === 'MOD' || operador === '%') && op2 === 0)
        throw new Error(`Error en línea ${numLinea}: División por cero (o módulo por cero) con el operador '${operador}'.`);
    if (operador === '/' && op2 === 0)  throw new Error(`Error en línea ${numLinea}: División por cero.`);
    switch (operador) {
        case '-': return op1 - op2;
        case '*': return op1 * op2;
        case '/': return op1 / op2;
        case 'MOD': case '%': return op1 % op2;
        case '^': return Math.pow(op1, op2);
        default: throw new Error(`Error interno: Operador aritmético desconocido '${operador}' en __pseudoOperacionAritmetica__.`);
    }
}
Webgoritmo.Expresiones.__pseudoOperacionAritmetica__ = __pseudoOperacionAritmetica__;

function __pseudoNot__(op, numLinea) {
    const tipoOp = Webgoritmo.Interprete.inferirTipo(op).toLowerCase();
    if (tipoOp !== 'logico')
        throw new Error(`Error en línea ${numLinea}: El operador 'NO' solo se puede aplicar a valores lógicos, se recibió '${tipoOp}'.`);
    return !op;
}
Webgoritmo.Expresiones.__pseudoNot__ = __pseudoNot__;

function __pseudoOpLogicaBinaria__(op1, op2, operador, numLinea) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();
    if (tipo1 !== 'logico' || tipo2 !== 'logico')
        throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '${operador}'. Ambos operandos deben ser lógicos. Se encontraron '${tipo1}' y '${tipo2}'.`);
    switch (operador.toUpperCase()) {
        case 'Y': case '&&': return op1 && op2;
        case 'O': case '||': return op1 || op2;
        default: throw new Error(`Error interno: Operador lógico binario desconocido '${operador}'.`);
    }
}
Webgoritmo.Expresiones.__pseudoOpLogicaBinaria__ = __pseudoOpLogicaBinaria__;

function __pseudoComparacion__(op1, op2, operador, numLinea) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();
    if ((tipo1 === 'entero' || tipo1 === 'real') && (tipo2 === 'entero' || tipo2 === 'real')) { /* ok */ }
    else if ((tipo1 === 'cadena' || tipo1 === 'caracter') && (tipo2 === 'cadena' || tipo2 === 'caracter')) { op1 = String(op1); op2 = String(op2); }
    else if (tipo1 === 'logico' && tipo2 === 'logico' && (operador === '=' || operador === '<>')) { /* ok */ }
    else throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador de comparación '${operador}'. No se pueden comparar '${tipo1}' con '${tipo2}'.`);
    switch (operador) {
        case '=': return op1 == op2;
        case '<>': return op1 != op2;
        case '<': return op1 < op2;
        case '>': return op1 > op2;
        case '<=': return op1 <= op2;
        case '>=': return op1 >= op2;
        default: throw new Error(`Error interno: Operador de comparación desconocido '${operador}'.`);
    }
}
Webgoritmo.Expresiones.__pseudoComparacion__ = __pseudoComparacion__;

Webgoritmo.Expresiones.evaluarExpresion = async function(expr, scope) {
    console.log(`ULTRA DEBUG evalExpr: expr CRUDA = "${expr}" (length: ${expr ? expr.length : 'N/A'}) | typeof: ${typeof expr} | JSON: ${JSON.stringify(expr)}`);
    const originalExprStr = String(expr).trim();
    const funcCallMatch = originalExprStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*$/);
    const numLinea = (Webgoritmo.estadoApp && Webgoritmo.estadoApp.currentLineInfo) ? Webgoritmo.estadoApp.currentLineInfo.numLineaOriginal : 'expresión';

    if (funcCallMatch) {
        const funcName = funcCallMatch[1].toLowerCase();
        const argsStr = funcCallMatch[2];
        let argExprs = [];
        if (argsStr.trim() !== '') {
            // TODO: Parser de argumentos más robusto. Simple split por ahora.
             argExprs = argsStr.split(',').map(a => a.trim());
        }
        if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(funcName)) {
            // ... (llamada a función de usuario) ...
            throw new Error(`Llamada a funciones de usuario (${funcName}) no completamente implementada en este punto de evaluarExpresion.`);
        } else if (Webgoritmo.Builtins && Webgoritmo.Builtins.funciones.hasOwnProperty(funcName)) {
            console.log(`[evaluarExpresion] Llamando a función predefinida: ${funcName}`);
            const evaluadosArgs = [];
            for (const argExpr of argExprs) {
                evaluadosArgs.push(await Webgoritmo.Expresiones.evaluarExpresion(argExpr, scope));
            }
            return Webgoritmo.Builtins.funciones[funcName](evaluadosArgs, numLinea);
        } else {
            // No es función de usuario ni builtin, podría ser un identificador con paréntesis que no es función (error)
            // o una expresión que casualmente parece una llamada (ej. (a+b)(c+d) que es inválido)
            // Dejar que el parser RPN lo maneje o falle.
        }
    }

    console.log(`[evaluarExpresion] Evaluando con RPN: "${originalExprStr}"`);
    try {
        const tokens = Webgoritmo.Expresiones.tokenize(originalExprStr);
        console.log("[evaluarExpresion] Tokens:", JSON.stringify(tokens.map(t => ({type: t.type, value: String(t.value), original: t.original})))); // Stringify value para evitar problemas con objetos complejos en log
        const rpn = Webgoritmo.Expresiones.infixToPostfix(tokens);
        console.log("[evaluarExpresion] RPN:", JSON.stringify(rpn.map(t => ({type: t.type, value: String(t.value), original: t.original}))));
        const resultado = await Webgoritmo.Expresiones.evaluateRPN(rpn, scope, numLinea);
        console.log(`[evaluarExpresion] Resultado RPN para "${originalExprStr}":`, resultado);
        return resultado;
    } catch (e) {
        const errorMsg = e.message.includes(`línea ${numLinea}`) || e.message.includes("tokenización") || e.message.includes("sintaxis") ? e.message : `Error en línea ${numLinea} evaluando expresión '${originalExprStr}': ${e.message}`;
        console.error(errorMsg, e);
        throw new Error(errorMsg);
    }
};

console.log("evaluadorExpresiones.js cargado (con correcciones para precedencia y acceso a arreglos v2).");
