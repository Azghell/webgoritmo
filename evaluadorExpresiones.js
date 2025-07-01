// evaluadorExpresiones.js (Fase 4 Reconstrucción: Evaluador Completo Básico)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = {};

Webgoritmo.Expresiones.TiposDeToken = {
    NUMERO: 'NUMERO', CADENA: 'CADENA', BOOLEANO: 'BOOLEANO', IDENTIFICADOR: 'IDENTIFICADOR',
    OPERADOR: 'OPERADOR', PARENTESIS_IZQ: 'PARENTESIS_IZQ', PARENTESIS_DER: 'PARENTESIS_DER',
    CORCHETE_IZQ: 'CORCHETE_IZQ', CORCHETE_DER: 'CORCHETE_DER', COMA: 'COMA',
    OPERADOR_UNARIO: 'OPERADOR_UNARIO', // Para distinguir menos unario
    OPERADOR_ACCESO_ARREGLO: 'OPERADOR_ACCESO_ARREGLO' // Para ej. miArreglo[indice]
    // FIN_DE_EXPRESION: 'FIN_DE_EXPRESION' // Opcional
};

Webgoritmo.Expresiones.Util = {
    obtenerPrecedenciaOperador: function(tokenOperador) {
        if (!tokenOperador) return 0;
        const Tipos = Webgoritmo.Expresiones.TiposDeToken;
        switch (tokenOperador.tipo) {
            case Tipos.PARENTESIS_IZQ: case Tipos.CORCHETE_IZQ: return 0;
            case Tipos.OPERADOR_ACCESO_ARREGLO: return 8; // Muy alta, como llamada a función
            case Tipos.OPERADOR_UNARIO: return 6; // Menos/No unario
        }
        if (tokenOperador.tipo !== Tipos.OPERADOR || typeof tokenOperador.valor !== 'string') return 0;
        switch (tokenOperador.valor.toUpperCase()) {
            case 'NO': return 6; // NOT lógico (unario, pero se maneja como operador aquí)
            case '^': return 5;
            case '*': case '/': case 'MOD': case '%': return 4;
            case '+': case '-': return 3;
            case '=': case '<>': case '!=': case '<': case '>': case '<=': case '>=': return 2;
            case 'Y': case '&&': return 1;
            case 'O': case '||': return 1;
            default: return 0;
        }
    },
    esAsociativoIzquierda: function(tokenOperador) {
        if (!tokenOperador || typeof tokenOperador.valor !== 'string') return true;
        return tokenOperador.valor !== '^'; // Potencia es asociativa a la derecha
    },
    // Funciones de operaciones (serán llamadas por evaluarRPN)
    realizarSuma: function(a, b, nL) { if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Suma solo entre números.`); return a + b; },
    realizarResta: function(a, b, nL) { if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Resta solo entre números.`); return a - b; },
    realizarMultiplicacion: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Multiplicación solo números.`);return a*b;},
    realizarDivision: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: División solo números.`);if(b===0)throw new Error(`L${nL}: División por cero.`);return a/b;},
    realizarModulo: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number'||!Number.isInteger(a)||!Number.isInteger(b))throw new Error(`L${nL}: MOD solo enteros.`);if(b===0)throw new Error(`L${nL}: MOD por cero.`);return a%b;},
    realizarPotencia: function(a,b,nL){if(typeof a!=='number'||typeof b!=='number')throw new Error(`L${nL}: Potencia solo números.`);return Math.pow(a,b);},
    realizarAND: function(a,b,nL){if(typeof a!=='boolean'||typeof b!=='boolean')throw new Error(`L${nL}: Y solo lógicos.`);return a&&b;},
    realizarOR: function(a,b,nL){if(typeof a!=='boolean'||typeof b!=='boolean')throw new Error(`L${nL}: O solo lógicos.`);return a||b;},
    realizarNOT: function(a,nL){if(typeof a!=='boolean')throw new Error(`L${nL}: NO solo lógico.`);return !a;},
    realizarComparacion: function(a,b,op,nL){
        // Simplificado: PSeInt tiene reglas de comparación más complejas entre tipos.
        // Aquí, si son tipos diferentes y no son ambos números o ambos cadenas, podría ser problemático.
        // Por ahora, JS hará su coerción para == y !=, y comparaciones estrictas para <, >, <=, >=
        if ((typeof a === 'string' && typeof b === 'string') || (typeof a === 'number' && typeof b === 'number') || (typeof a === 'boolean' && typeof b === 'boolean')) {
            // Comparación homogénea
        } else if (typeof a === 'number' && typeof b === 'string' && !isNaN(Number(b))) { b = Number(b); }
        else if (typeof b === 'number' && typeof a === 'string' && !isNaN(Number(a))) { a = Number(a); }
        // else if (op !== '=' && op !== '<>') throw new Error(`L${nL}: Comparación entre tipos incompatibles (${typeof a} ${op} ${typeof b}).`);

        switch(op){
            case '=': case '==': return a == b; // Coerción de JS
            case '<>': case '!=': return a != b; // Coerción de JS
            case '<': return a < b;
            case '>': return a > b;
            case '<=': return a <= b;
            case '>=': return a >= b;
            default: throw new Error(`L${nL}: Operador comparación desconocido '${op}'.`);
        }
    }
};

Webgoritmo.Expresiones.tokenizar = function(cadenaExpresion) { /* ... (como se definió en sub-paso anterior) ... */ return []; };
Webgoritmo.Expresiones.convertirInfijoAPostfijo = function(listaTokens) { /* ... (se implementará ahora) ... */ return []; };
Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) { /* ... (se implementará ahora) ... */ return null; };

// --- Implementación del Tokenizador (copiado de la Fase 4, sub-paso 1) ---
Webgoritmo.Expresiones.tokenizar = function(cadenaExpresion) {
    const tokens = []; let cursor = 0; const Tipos = Webgoritmo.Expresiones.TiposDeToken;
    const patronesTokens = [
        { tipo: Tipos.NUMERO,         regex: /-?\b\d+(?:\.\d*)?\b|\.\d+\b/y },
        { tipo: Tipos.CADENA,         regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y },
        { tipo: Tipos.BOOLEANO,       regex: /\b(?:Verdadero|Falso)\b/iy },
        { tipo: Tipos.OPERADOR,       regex: /<=|>=|<>|==|!=|<-/y },
        { tipo: Tipos.OPERADOR,       regex: /\b(?:Y|O|NO|MOD)\b/iy },
        { tipo: Tipos.OPERADOR,       regex: /[+\-*/\^=<>()\[\],]/y },
        { tipo: Tipos.IDENTIFICADOR,  regex: /[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*/y }
    ];
    const regexEspacio = /\s+/y;
    while (cursor < cadenaExpresion.length) {
        regexEspacio.lastIndex = cursor; const matchEspacio = regexEspacio.exec(cadenaExpresion);
        if (matchEspacio && matchEspacio.index === cursor) { cursor = regexEspacio.lastIndex; continue; }
        let coincidenciaEncontrada = false;
        for (const patron of patronesTokens) {
            patron.regex.lastIndex = cursor; const match = patron.regex.exec(cadenaExpresion);
            if (match && match.index === cursor) {
                let valor = match[0]; let tipoActual = patron.tipo;
                if (tipoActual === Tipos.OPERADOR) {
                    if (valor === '(') tipoActual = Tipos.PARENTESIS_IZQ;
                    else if (valor === ')') tipoActual = Tipos.PARENTESIS_DER;
                    else if (valor === '[') tipoActual = Tipos.CORCHETE_IZQ;
                    else if (valor === ']') tipoActual = Tipos.CORCHETE_DER;
                    else if (valor === ',') tipoActual = Tipos.COMA;
                    else if (/\b(?:Y|O|NO|MOD)\b/i.test(valor)) valor = valor.toUpperCase();
                }
                if (tipoActual === Tipos.NUMERO) valor = Number(valor);
                else if (tipoActual === Tipos.CADENA) valor = valor.substring(1, valor.length - 1).replace(/\\(["'])/g, '$1');
                else if (tipoActual === Tipos.BOOLEANO) valor = valor.toLowerCase() === "verdadero";
                tokens.push({ tipo: tipoActual, valor: valor, original: match[0] });
                cursor = patron.regex.lastIndex; coincidenciaEncontrada = true; break;
            }
        }
        if (!coincidenciaEncontrada) throw new Error(`Tokenización: Carácter inesperado '${cadenaExpresion[cursor]}' en pos ${cursor} de '${cadenaExpresion}'.`);
    }
    return tokens;
};

// --- Implementación de Shunting-Yard ---
Webgoritmo.Expresiones.convertirInfijoAPostfijo = function(listaTokens) {
    const colaSalida = [];
    const pilaOperadores = [];
    const Tipos = Webgoritmo.Expresiones.TiposDeToken;
    const Util = Webgoritmo.Expresiones.Util;

    // Manejo de menos unario (y NO unario)
    const tokensProcesados = [];
    for (let i = 0; i < listaTokens.length; i++) {
        const token = listaTokens[i];
        if ((token.valor === '-' || token.valor === 'NO') && token.tipo === Tipos.OPERADOR) {
            const prevToken = i > 0 ? tokensProcesados[tokensProcesados.length - 1] : null;
            if (!prevToken || prevToken.tipo === Tipos.OPERADOR || prevToken.tipo === Tipos.PARENTESIS_IZQ || prevToken.tipo === Tipos.COMA || prevToken.tipo === Tipos.CORCHETE_IZQ) {
                tokensProcesados.push({ ...token, tipo: Tipos.OPERADOR_UNARIO });
            } else {
                tokensProcesados.push(token); // Operador binario
            }
        } else {
            tokensProcesados.push(token);
        }
    }

    for (const token of tokensProcesados) {
        switch (token.tipo) {
            case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO: case Tipos.IDENTIFICADOR:
                colaSalida.push(token);
                break;
            // TODO: Manejo de funciones y acceso a arreglos más adelante.
            // Por ahora, IDENTIFICADOR se trata como variable.
            case Tipos.PARENTESIS_IZQ:
            case Tipos.CORCHETE_IZQ: // Tratar [ similar a ( para precedencia de índice
                pilaOperadores.push(token);
                break;
            case Tipos.PARENTESIS_DER:
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) {
                    colaSalida.push(pilaOperadores.pop());
                }
                if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.PARENTESIS_IZQ) throw new Error("Paréntesis izquierdos y derechos no coinciden.");
                pilaOperadores.pop(); // Sacar el '('
                break;
            case Tipos.CORCHETE_DER: // Fin de acceso a arreglo
                while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) {
                    colaSalida.push(pilaOperadores.pop());
                }
                if (pilaOperadores.length === 0 || pilaOperadores[pilaOperadores.length - 1].tipo !== Tipos.CORCHETE_IZQ) throw new Error("Corchetes izquierdos y derechos no coinciden.");
                pilaOperadores.pop(); // Sacar el '['
                // El IDENTIFICADOR del arreglo ya está en la colaSalida.
                // Añadir un operador especial para el acceso. Asumimos 1D por ahora.
                colaSalida.push({ tipo: Tipos.OPERADOR_ACCESO_ARREGLO, valor: '[]', original: '[]', dimensions: 1 });
                break;
            case Tipos.OPERADOR:
            case Tipos.OPERADOR_UNARIO:
                while (pilaOperadores.length > 0) {
                    const opEnPila = pilaOperadores[pilaOperadores.length - 1];
                    if (opEnPila.tipo === Tipos.PARENTESIS_IZQ || opEnPila.tipo === Tipos.CORCHETE_IZQ) break;
                    if (Util.obtenerPrecedenciaOperador(opEnPila) > Util.obtenerPrecedenciaOperador(token) ||
                        (Util.obtenerPrecedenciaOperador(opEnPila) === Util.obtenerPrecedenciaOperador(token) && Util.esAsociativoIzquierda(token))) {
                        colaSalida.push(pilaOperadores.pop());
                    } else {
                        break;
                    }
                }
                pilaOperadores.push(token);
                break;
            case Tipos.COMA: // Ignorar comas por ahora, se usarán para funciones/múltiples índices
                break;
        }
    }
    while (pilaOperadores.length > 0) {
        const op = pilaOperadores.pop();
        if (op.tipo === Tipos.PARENTESIS_IZQ || op.tipo === Tipos.CORCHETE_IZQ) throw new Error("Paréntesis/Corchetes no balanceados.");
        colaSalida.push(op);
    }
    return colaSalida;
};

// --- Implementación del Evaluador RPN ---
Webgoritmo.Expresiones.evaluarRPN = async function(colaRPN, ambitoActual, numeroLinea) {
    const pilaValores = [];
    const Tipos = Webgoritmo.Expresiones.TiposDeToken;
    const UtilExpr = Webgoritmo.Expresiones.Util;
    const UtilInterprete = Webgoritmo.Interprete.Utilidades; // Para obtenerValorRealVariable

    for (const token of colaRPN) {
        if (Webgoritmo.estadoApp && Webgoritmo.estadoApp.detenerEjecucion) throw new Error("Ejecución detenida.");

        switch (token.tipo) {
            case Tipos.NUMERO: case Tipos.CADENA: case Tipos.BOOLEANO:
                pilaValores.push(token.valor);
                break;
            case Tipos.IDENTIFICADOR:
                // Aquí se usa la utilidad del intérprete para obtener el valor.
                // Esto asume que Webgoritmo.Interprete.Utilidades está disponible.
                pilaValores.push(UtilInterprete.obtenerValorRealVariable(token.valor, ambitoActual, numeroLinea));
                break;
            case Tipos.OPERADOR_ACCESO_ARREGLO: // Ej: miArreglo[indice]
                // En esta fase simplificada, el IDENTIFICADOR del arreglo y el valor del ÍNDICE ya están en la pila.
                if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para acceso a arreglo.`);
                const indice = obtenerValorReal(pilaValores.pop(), numeroLinea, "Índice de arreglo"); // El índice es el último en entrar
                const arregloCrudo = pilaValores.pop(); // El arreglo (o su descriptor) es el anterior

                const descriptorArreglo = (typeof arregloCrudo === 'object' && arregloCrudo.hasOwnProperty('tipoDeclarado')) ? arregloCrudo : null;

                if (!descriptorArreglo || !descriptorArreglo.esArreglo) { // Asumiendo que el descriptor tiene 'esArreglo'
                    throw new Error(`L${numeroLinea}: '${arregloCrudo.nombreOriginal || 'Variable'}' no es un arreglo.`);
                }
                if (typeof indice !== 'number' || !Number.isInteger(indice)) throw new Error(`L${numeroLinea}: Índice [${indice}] no es entero.`);
                if (indice <= 0 || indice > descriptorArreglo.dimensiones[0]) throw new Error(`L${numeroLinea}: Índice [${indice}] fuera de rango para '${descriptorArreglo.nombreOriginal}'.`);
                pilaValores.push(descriptorArreglo.valor[indice]);
                break;
            case Tipos.OPERADOR_UNARIO:
                if (pilaValores.length < 1) throw new Error(`L${numeroLinea}: Falta operando para '${token.valor}'.`);
                let operandoU = obtenerValorReal(pilaValores.pop(), numeroLinea);
                if (token.valor === '_UMINUS_') {
                    if(typeof operandoU !== 'number') throw new Error(`L${numeroLinea}: Menos unario solo para números.`);
                    pilaValores.push(-operandoU);
                } else if (token.valor.toUpperCase() === 'NO') {
                    pilaValores.push(UtilExpr.realizarNOT(operandoU, numeroLinea));
                } else {
                    throw new Error(`L${numeroLinea}: Operador unario '${token.valor}' desconocido.`);
                }
                break;
            case Tipos.OPERADOR:
                if (pilaValores.length < 2) throw new Error(`L${numeroLinea}: Faltan operandos para '${token.valor}'.`);
                let op2 = obtenerValorReal(pilaValores.pop(), numeroLinea);
                let op1 = obtenerValorReal(pilaValores.pop(), numeroLinea);
                switch (token.valor.toUpperCase()) {
                    case '+': pilaValores.push(UtilExpr.realizarSuma(op1, op2, numeroLinea)); break;
                    case '-': pilaValores.push(UtilExpr.realizarResta(op1, op2, numeroLinea)); break;
                    case '*': pilaValores.push(UtilExpr.realizarMultiplicacion(op1,op2,numeroLinea)); break;
                    case '/': pilaValores.push(UtilExpr.realizarDivision(op1,op2,numeroLinea)); break;
                    case 'MOD': case '%': pilaValores.push(UtilExpr.realizarModulo(op1,op2,numeroLinea)); break;
                    case '^': pilaValores.push(UtilExpr.realizarPotencia(op1,op2,numeroLinea)); break;
                    case 'Y': case '&&': pilaValores.push(UtilExpr.realizarAND(op1,op2,numeroLinea)); break;
                    case 'O': case '||': pilaValores.push(UtilExpr.realizarOR(op1,op2,numeroLinea)); break;
                    case '=': case '==': case '<>': case '!=': case '<': case '>': case '<=': case '>=':
                        pilaValores.push(UtilExpr.realizarComparacion(op1,op2,token.valor,numeroLinea)); break;
                    default: throw new Error(`L${numeroLinea}: Operador binario '${token.valor}' desconocido.`);
                }
                break;
            default: throw new Error(`L${numeroLinea}: Token RPN desconocido: ${token.tipo} ('${token.valor}').`);
        }
    }
    if (pilaValores.length !== 1) throw new Error(`Error en línea ${numeroLinea}: Pila de evaluación RPN no unitaria al final.`);
    return obtenerValorReal(pilaValores[0], numeroLinea, "Resultado de expresión"); // Asegurar que el resultado final sea un valor
};


Webgoritmo.Expresiones.evaluarExpresion = async function(expresionComoTexto, ambitoActual, numeroLinea = 'expresión') {
    console.log(`[evaluadorExpresiones (Fase 4)] evaluando: "${expresionComoTexto}"`);
    if (!Webgoritmo.Interprete || !Webgoritmo.Interprete.Utilidades || !Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable) {
        throw new Error("Error interno: Dependencia 'obtenerValorRealVariable' no encontrada.");
    }
    try {
        const tokens = Webgoritmo.Expresiones.tokenizar(expresionComoTexto);
        console.log(`[F4 Tokens] para "${expresionComoTexto}":`, JSON.stringify(tokens.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const rpn = Webgoritmo.Expresiones.convertirInfijoAPostfijo(tokens);
        console.log(`[F4 RPN] para "${expresionComoTexto}":`, JSON.stringify(rpn.map(t=>({t:t.tipo,v:String(t.valor)}))));
        const resultado = await Webgoritmo.Expresiones.evaluarRPN(rpn, ambitoActual, numeroLinea);
        console.log(`[F4 Resultado] para "${expresionComoTexto}":`, resultado);
        return resultado;
    } catch (e) {
        const msjError = e.message.startsWith(`Error en línea ${numeroLinea}`) || e.message.startsWith('Tokenización') || e.message.startsWith('Sintaxis') ? e.message : `Error en línea ${numeroLinea} evaluando '${expresionComoTexto}': ${e.message}`;
        console.error(msjError, e);
        throw new Error(msjError);
    }
};

// Copiar funciones de utilidad de motorInterprete.js que son necesarias aquí
// (Solo para mantenerlo autónomo si se prueba por separado, idealmente se importan o se accede vía Webgoritmo.Interprete.Utilidades)
function obtenerValorReal(operando, numLineaOriginal, nombreOperando = "Operando") {
    if (operando === null || operando === undefined) {
        throw new Error(`Error en línea ${numLineaOriginal}: ${nombreOperando} es nulo o indefinido.`);
    }
    // Se asume que si es un objeto, es un descriptor de variable/arreglo del ámbito
    if (typeof operando === 'object' && operando.hasOwnProperty('tipoDeclarado')) {
        if (operando.esArreglo && nombreOperando !== "Arreglo base para acceso") { // Si es un arreglo y no se está accediendo a un elemento
            throw new Error(`Error en línea ${numLineaOriginal}: No se puede usar el arreglo '${operando.nombreOriginal || 'arreglo'}' directamente como valor. Se requieren índices.`);
        }
        return operando.valor; // Devolver el valor almacenado
    }
    return operando; // Ya es un valor primitivo (resultado de una operación anterior, o un literal)
}


console.log("evaluadorExpresiones.js (Fase 4 Reconstrucción: Tokenizador, Shunting-Yard, RPN Básico) cargado.");
