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

Webgoritmo.Expresiones.tokenize = function(exprStr) {
    const tokens = [];
    let i = 0;
    const originalLength = exprStr.length;

    // Order matters: keywords and longer operators first. 'y' flag for sticky.
    // Case-insensitive matching for keywords via 'i' flag in regex.
    const tokenPatterns = [
        // Literals
        { type: 'NUMBER', regex: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\.\d+(?:[eE][+-]?\d+)?\b/y },
        { type: 'STRING_LITERAL', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y },
        { type: 'BOOLEAN_TRUE', regex: /\bVerdadero\b/iy },
        { type: 'BOOLEAN_FALSE', regex: /\bFalso\b/iy },

        // Operators (longest first for multi-char ops)
        { type: 'OPERATOR_LTE', regex: /<=|menor o igual que/iy },
        { type: 'OPERATOR_GTE', regex: />=|mayor o igual que/iy },
        { type: 'OPERATOR_NEQ', regex: /<>|!=|distinto de/iy }, // != is common PSeInt extension
        { type: 'OPERATOR_EQ', regex: /==|=igual que/iy }, // PSeInt uses single '=' for comparison, '==' also for robustness
        { type: 'OPERATOR_LT', regex: /<|menor que/iy },
        { type: 'OPERATOR_GT', regex: />|mayor que/iy },

        { type: 'OPERATOR_AND', regex: /\bY\b|&&/iy }, // PSeInt Y, common &&
        { type: 'OPERATOR_OR', regex: /\bO\b|\|\|/iy },  // PSeInt O, common ||
        { type: 'OPERATOR_NOT', regex: /\bNO\b|!|~/iy },// PSeInt NO, common ! or ~
        { type: 'OPERATOR_MOD', regex: /\bMOD\b|%/iy }, // PSeInt MOD, common %

        { type: 'OPERATOR_POW', regex: /\^/y },
        { type: 'OPERATOR_MULTIPLY', regex: /\*/y },
        { type: 'OPERATOR_DIVIDE', regex: /\//y },
        { type: 'OPERATOR_PLUS', regex: /\+/y },
        { type: 'OPERATOR_MINUS', regex: /-/y }, // Unary/binary distinction handled by parser

        // Parentheses, Brackets, Comma
        { type: 'LPAREN', regex: /\(/y },
        { type: 'RPAREN', regex: /\)/y },
        { type: 'LBRACKET', regex: /\[/y },
        { type: 'RBRACKET', regex: /\]/y },
        { type: 'COMMA', regex: /,/y },

        // Identifiers last as a fallback
        { type: 'IDENTIFIER', regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/y } // Allow Spanish chars in identifiers
    ];

    while (i < originalLength) {
        // Skip whitespace
        const whitespaceRegex = /\s+/y;
        whitespaceRegex.lastIndex = i;
        const wsMatch = whitespaceRegex.exec(exprStr);
        if (wsMatch && wsMatch.index === i) {
            i = whitespaceRegex.lastIndex;
            if (i >= originalLength) break;
        }

        let matched = false;
        for (const pattern of tokenPatterns) {
            pattern.regex.lastIndex = i; // Set search start for sticky regex
            const match = pattern.regex.exec(exprStr);

            if (match && match.index === i) { // Ensure match is at current position
                let value = match[0];
                let type = pattern.type;

                if (type === 'NUMBER') {
                    value = parseFloat(value);
                } else if (type === 'STRING_LITERAL') {
                    value = value.substring(1, value.length - 1).replace(/\\(["'\\])/g, '$1'); // Unescape common
                } else if (type === 'BOOLEAN_TRUE') {
                    value = true;
                } else if (type === 'BOOLEAN_FALSE') {
                    value = false;
                } else if (type === 'IDENTIFIER') {
                    // Re-classify if it's a known keyword operator/literal that wasn't caught by more specific regexes
                    // (This helps if regexes for keywords are not perfectly ordered or comprehensive)
                    const lowerVal = value.toLowerCase();
                    if (lowerVal === "mod") type = 'OPERATOR_MOD';
                    else if (lowerVal === "y" || value === "&&") type = 'OPERATOR_AND';
                    else if (lowerVal === "o" || value === "||") type = 'OPERATOR_OR';
                    else if (lowerVal === "no" || value === "!" || value === "~") type = 'OPERATOR_NOT';
                    else if (lowerVal === "verdadero") { type = 'BOOLEAN_TRUE'; value = true; }
                    else if (lowerVal === "falso") { type = 'BOOLEAN_FALSE'; value = false; }
                }
                 // For operators like '=', '<=', '>=', '<>', ensure we use a canonical value if multiple text forms exist
                if (type === 'OPERATOR_EQ') value = '='; // Canonical for comparison
                if (type === 'OPERATOR_NEQ') value = '<>'; // Canonical for PSeInt
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
            // Log the problematic part of the expression for easier debugging
            const errorContext = exprStr.substring(Math.max(0, i - 10), Math.min(exprStr.length, i + 10));
            const pointer = " ".repeat(Math.min(10, i)) + "^";
            throw new Error(`Error de tokenización: Caracter inesperado '${exprStr[i]}' en la expresión.\nContexto: ...${errorContext}...\n          ${pointer}`);
        }
    }
    return tokens;
};

Webgoritmo.Expresiones.getOperatorPrecedence = function(opToken) {
    if (!opToken || opToken.type === 'LPAREN' || opToken.type === 'RPAREN') return 0; // Parentheses handled differently
    // Based on PSeInt operator precedence
    switch (opToken.value.toUpperCase()) { // Use value for actual operator symbol/keyword
        case '^': return 5; // Potencia
        case '*': case '/': case 'MOD': case '%': case 'DIV': return 4; // Multiplicación, División, Módulo
        case '+': case '-': return 3; // Suma, Resta (binaria)
        case '=': case '<>': case '!=': case '<': case '>': case '<=': case '>=':
        case 'MENOR QUE': case 'MAYOR QUE': case 'MENOR O IGUAL QUE': case 'MAYOR O IGUAL QUE': case 'IGUAL QUE': case 'DISTINTO DE':
            return 2; // Relacionales
        case 'NO': case '!': case '~': return 6; // NOT lógico (alta precedencia, unario) - adjust if needed
        case 'Y': case '&&': return 1; // AND lógico (baja precedencia)
        case 'O': case '||': return 1; // OR lógico (misma o menor que AND, PSeInt Y/O son usualmente mismo nivel bajo)
        default: return 0; // Default for unknown or non-operators handled by Shunting-yard
    }
};

Webgoritmo.Expresiones.isOperatorLeftAssociative = function(opToken) {
    // La mayoría de los operadores de PSeInt son asociativos a la izquierda, excepto la potencia.
    if (!opToken) return true;
    return opToken.value !== '^'; // Potencia es asociativa a la derecha
};

Webgoritmo.Expresiones.infixToPostfix = function(tokens) {
    const outputQueue = [];
    const operatorStack = [];

    // Helper to identify if a token is an operator that goes on the operatorStack
    const isStackableOperator = (token) =>
        token.type.startsWith('OPERATOR_') ||
        token.type === 'LPAREN' || // LPAREN goes on stack
        token.type === 'RPAREN'; // RPAREN is processed but not directly stacked long-term

    // Handling unary minus:
    // A minus is unary if:
    // 1. It's the first token.
    // 2. The preceding token was an operator or an LPAREN.
    const processedTokens = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'OPERATOR_MINUS') {
            const prevToken = i > 0 ? tokens[i-1] : null;
            if (!prevToken || prevToken.type.startsWith('OPERATOR_') || prevToken.type === 'LPAREN' || prevToken.type === 'COMMA') {
                // This is a unary minus. We can represent it with a special type or value.
                // For simplicity in RPN evaluation, let's make it a special operator or use a 0-operand convention.
                // Let's change its type for now. The RPN evaluator will need to handle UNARY_MINUS.
                processedTokens.push({ ...token, type: 'OPERATOR_UNARY_MINUS', value: '_UMINUS_' });
            } else {
                processedTokens.push(token); // Binary minus
            }
        } else {
            processedTokens.push(token);
        }
    }
    // Adjust precedence for UNARY_MINUS if needed (typically higher than multiplication)
    // Webgoritmo.Expresiones.getOperatorPrecedence needs to know about _UMINUS_ if we change its value.
    // Or, the RPN evaluator handles it by knowing it takes 1 operand.
    // For now, let's assume UNARY_MINUS will be handled specially by RPN evaluator.

    for (const token of processedTokens) {
        switch (token.type) {
            case 'NUMBER':
            case 'STRING_LITERAL':
            case 'BOOLEAN_TRUE':
            case 'BOOLEAN_FALSE':
            case 'IDENTIFIER': // Variables and function names (if not handled as functions below)
                outputQueue.push(token);
                break;

            // TODO: Handle function calls (IDENTIFIER followed by LPAREN) more explicitly if needed here.
            // For now, IDENTIFIERs are pushed; if it's a function, RPN eval will see it before its args.

            case 'LPAREN':
                operatorStack.push(token);
                break;

            case 'RPAREN':
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
                    throw new Error("Error de sintaxis: Paréntesis no coincidentes (falta '(').");
                }
                operatorStack.pop(); // Discard LPAREN
                // TODO: If top of stack is now a function identifier, pop it to output.
                // This is more complex if function names are just IDENTIFIERs.
                break;

            case 'COMMA': // For function arguments primarily
                 while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
                    outputQueue.push(operatorStack.pop());
                }
                // Comma itself isn't pushed to output or stack in basic Shunting-yard for expressions.
                // It acts as a separator. The RPN evaluator for functions will need to know how many args to expect.
                break;

            default: // Assumed to be an operator if type starts with OPERATOR_
                if (token.type.startsWith('OPERATOR_')) {
                    const op1 = token;
                    while (operatorStack.length > 0) {
                        const op2 = operatorStack[operatorStack.length - 1];
                        if (op2.type === 'LPAREN') break; // Don't pop LPAREN

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
                     // This case should ideally not be reached if tokenizer is complete and types are specific
                     console.warn("Shunting-yard: Token desconocido o no manejado:", token);
                }
                break;
        }
    }

    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op.type === 'LPAREN') {
            throw new Error("Error de sintaxis: Paréntesis no coincidentes (sobra '(').");
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
                const varNameLc = token.value.toLowerCase(); // Identifiers are stored as original case in token for now
                if (scope.hasOwnProperty(varNameLc) && scope[varNameLc].type !== 'array') { // Ensure it's not an un-indexed array
                    valueStack.push(scope[varNameLc].value);
                } else if (scope.hasOwnProperty(varNameLc) && scope[varNameLc].type === 'array') {
                    throw new Error(`Error en línea ${numLineaOriginal}: No se puede usar el arreglo '${token.value}' sin especificar índices en esta expresión.`);
                } else {
                    throw new Error(`Error en línea ${numLineaOriginal}: Variable o función '${token.value}' no definida.`);
                }
                break;

            case 'OPERATOR_PLUS': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador '+'.`);
                const op2 = valueStack.pop();
                const op1 = valueStack.pop();
                valueStack.push(Webgoritmo.Expresiones.__pseudoSuma__(op1, op2, numLineaOriginal));
                break;
            }
            case 'OPERATOR_UNARY_MINUS': { // Assuming value is '_UMINUS_'
                if (valueStack.length < 1) throw new Error(`Error en línea ${numLineaOriginal}: Falta operando para '-' unario.`);
                const op = valueStack.pop();
                const opType = Webgoritmo.Interprete.inferirTipo(op).toLowerCase();
                if (opType !== 'entero' && opType !== 'real') {
                    throw new Error(`Error en línea ${numLineaOriginal}: Operador '-' unario solo aplicable a números, se recibió '${opType}'.`);
                }
                valueStack.push(-op);
                break;
            }
            // --- Implement other operators with strict typing using __pseudoOperacionAritmetica__ ---
            case 'OPERATOR_MINUS':
            case 'OPERATOR_MULTIPLY':
            case 'OPERATOR_DIVIDE':
            case 'OPERATOR_MOD': // Handles 'MOD' and '%' due to tokenizer canonical value
            case 'OPERATOR_POW': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador '${token.original}'.`);
                const op2 = valueStack.pop();
                const op1 = valueStack.pop();
                // Note: token.value might be '%' but token.original was "MOD". We need the canonical operator symbol for __pseudoOperacionAritmetica__.
                // The tokenizer currently stores the original matched string in token.original, and a potentially canonical one in token.value (e.g. MOD -> MOD, % -> %)
                // Let's assume token.value is the canonical symbol like '-', '*', '/', 'MOD', '^'
                // For MOD, tokenizer puts 'MOD' or '%' into value. __pseudoOperacionAritmetica handles both.
                valueStack.push(Webgoritmo.Expresiones.__pseudoOperacionAritmetica__(op1, op2, token.value, numLineaOriginal));
                break;
            }
            case 'OPERATOR_NOT': {
                if (valueStack.length < 1) throw new Error(`Error en línea ${numLineaOriginal}: Falta operando para el operador '${token.original}'.`);
                const op = valueStack.pop();
                valueStack.push(Webgoritmo.Expresiones.__pseudoNot__(op, numLineaOriginal));
                break;
            }
            case 'OPERATOR_AND':
            case 'OPERATOR_OR': {
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador '${token.original}'.`);
                const op2 = valueStack.pop();
                const op1 = valueStack.pop();
                valueStack.push(Webgoritmo.Expresiones.__pseudoOpLogicaBinaria__(op1, op2, token.value, numLineaOriginal)); // token.value is 'Y' or 'O' (or &&, ||)
                break;
            }
            case 'OPERATOR_EQ': // = (o ==)
            case 'OPERATOR_NEQ': // <> (o !=)
            case 'OPERATOR_LT': // <
            case 'OPERATOR_GT': // >
            case 'OPERATOR_LTE': // <=
            case 'OPERATOR_GTE': { // >=
                if (valueStack.length < 2) throw new Error(`Error en línea ${numLineaOriginal}: Faltan operandos para el operador de comparación '${token.original}'.`);
                const op2 = valueStack.pop();
                const op1 = valueStack.pop();
                // token.value should be the canonical operator e.g., '=', '<>', '<', etc. as set by tokenizer
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
    return valueStack[0];
};


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

function __pseudoOperacionAritmetica__(op1, op2, operador, numLinea, permiteCeroDivisor = false) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();

    if ((tipo1 !== 'entero' && tipo1 !== 'real') || (tipo2 !== 'entero' && tipo2 !== 'real')) {
        throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '${operador}'. Ambos operandos deben ser numéricos. Se encontraron '${tipo1}' y '${tipo2}'.`);
    }
    if (!permiteCeroDivisor && (operador === '/' || operador.toUpperCase() === 'MOD' || operador === '%') && op2 === 0) {
        throw new Error(`Error en línea ${numLinea}: División por cero (o módulo por cero) con el operador '${operador}'.`);
    }
    if (operador === '/' && op2 === 0) { // Específico para / si se quiere un error diferente o si permiteCeroDivisor es true para otros
         throw new Error(`Error en línea ${numLinea}: División por cero.`);
    }


    switch (operador) {
        case '-': return op1 - op2;
        case '*': return op1 * op2;
        case '/': return op1 / op2; // PSeInt '/' es división real
        case 'MOD': case '%': return op1 % op2; // PSeInt MOD es el resto de la división entera
        case '^': return Math.pow(op1, op2);
        default: // No debería llegar aquí si se llama correctamente
            throw new Error(`Error interno: Operador aritmético desconocido '${operador}' en __pseudoOperacionAritmetica__.`);
    }
}
Webgoritmo.Expresiones.__pseudoOperacionAritmetica__ = __pseudoOperacionAritmetica__;

function __pseudoNot__(op, numLinea) {
    const tipoOp = Webgoritmo.Interprete.inferirTipo(op).toLowerCase();
    if (tipoOp !== 'logico') {
        throw new Error(`Error en línea ${numLinea}: El operador 'NO' solo se puede aplicar a valores lógicos, se recibió '${tipoOp}'.`);
    }
    return !op;
}
Webgoritmo.Expresiones.__pseudoNot__ = __pseudoNot__;

function __pseudoOpLogicaBinaria__(op1, op2, operador, numLinea) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();
    if (tipo1 !== 'logico' || tipo2 !== 'logico') {
        throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador '${operador}'. Ambos operandos deben ser lógicos. Se encontraron '${tipo1}' y '${tipo2}'.`);
    }
    switch (operador.toUpperCase()) { // Tokenizer stores canonical 'Y' or 'O' in value
        case 'Y': case '&&': return op1 && op2;
        case 'O': case '||': return op1 || op2;
        default:
             throw new Error(`Error interno: Operador lógico binario desconocido '${operador}'.`);
    }
}
Webgoritmo.Expresiones.__pseudoOpLogicaBinaria__ = __pseudoOpLogicaBinaria__;

function __pseudoComparacion__(op1, op2, operador, numLinea) {
    const tipo1 = Webgoritmo.Interprete.inferirTipo(op1).toLowerCase();
    const tipo2 = Webgoritmo.Interprete.inferirTipo(op2).toLowerCase();

    // PSeInt comparisons: numbers with numbers, strings with strings, logical with logical (for =,<>)
    // Mixed types usually result in false or error depending on strictness.
    // For now, enforce type consistency for <, >, <=, >= and allow some coercion for = , <> like JS '=='

    if ((tipo1 === 'entero' || tipo1 === 'real') && (tipo2 === 'entero' || tipo2 === 'real')) {
        // Numeric comparison
    } else if ((tipo1 === 'cadena' || tipo1 === 'caracter') && (tipo2 === 'cadena' || tipo2 === 'caracter')) {
        // String comparison
        op1 = String(op1); op2 = String(op2); // Ensure they are JS strings for comparison
    } else if (tipo1 === 'logico' && tipo2 === 'logico' && (operador === '=' || operador === '<>')) {
        // Boolean comparison for equality/inequality
    } else {
        // Mixed types not directly comparable for ordering, or invalid types for equality (e.g. logico < numero)
        throw new Error(`Error en línea ${numLinea}: Tipos incompatibles para el operador de comparación '${operador}'. No se pueden comparar '${tipo1}' con '${tipo2}'.`);
    }

    switch (operador) { // Tokenizer stores canonical value e.g. '=', '<>', '<', '<=', '>', '>='
        case '=': return op1 == op2; // JS '==' for loose equality (PSeInt often similar for '=')
        case '<>': return op1 != op2; // JS '!=' for loose inequality
        case '<': return op1 < op2;
        case '>': return op1 > op2;
        case '<=': return op1 <= op2;
        case '>=': return op1 >= op2;
        default:
            throw new Error(`Error interno: Operador de comparación desconocido '${operador}'.`);
    }
}
Webgoritmo.Expresiones.__pseudoComparacion__ = __pseudoComparacion__;


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

    // Si no es una llamada a función que ocupa toda la expresión, ni un acceso directo a arreglo,
    // ni un literal simple, entonces proceder con tokenización y evaluación RPN.
    // Esto reemplaza la lógica de reemplazo de regex y eval().

    console.log(`[evaluarExpresion] Evaluando con RPN: "${originalExprStr}"`);
    const numLinea = (Webgoritmo.estadoApp && Webgoritmo.estadoApp.currentLineInfo) ? Webgoritmo.estadoApp.currentLineInfo.numLineaOriginal : 'expresión';
    try {
        const tokens = Webgoritmo.Expresiones.tokenize(originalExprStr);
        console.log("[evaluarExpresion] Tokens:", JSON.stringify(tokens));
        const rpn = Webgoritmo.Expresiones.infixToPostfix(tokens);
        console.log("[evaluarExpresion] RPN:", JSON.stringify(rpn));
        // evaluateRPN es ahora async porque puede llamar a evaluarExpresion para argumentos de funciones (si se implementa así)
        // o si las funciones built-in se hicieran async.
        // Pero aquí estamos evaluando el RPN principal, no llamando a evaluarExpresion recursivamente desde aquí.
        // La llamada a evaluarExpresion para argumentos de funciones built-in YA es async.
        const resultado = await Webgoritmo.Expresiones.evaluateRPN(rpn, scope, numLinea);
        console.log(`[evaluarExpresion] Resultado RPN para "${originalExprStr}":`, resultado);
        return resultado;
    } catch (e) {
        // Agregar más contexto al error si es posible
        const errorMsg = e.message.includes(`línea ${numLinea}`) ? e.message : `Error en línea ${numLinea} evaluando expresión '${originalExprStr}': ${e.message}`;
        console.error(errorMsg, e);
        throw new Error(errorMsg);
    }
};

console.log("evaluadorExpresiones.js cargado y Webgoritmo.Expresiones.evaluarExpresion (expandido) definido.");
