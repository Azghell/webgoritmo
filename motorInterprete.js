// motorInterprete.js - Reconstrucción Incremental - Bloque 3

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE (Bloques 1 y 2) ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) {
    const tipoLower = String(tipo).toLowerCase();
    switch (tipoLower) {
        case 'entero': return 0;
        case 'real': return 0.0;
        case 'logico': return false;
        case 'caracter': return '';
        case 'cadena': return '';
        case 'numero': return 0;
        default:
            console.warn(`Tipo '${tipo}' no reconocido en obtenerValorPorDefecto. Usando null.`);
            return null;
    }
};

Webgoritmo.Interprete.inferirTipo = function(valor) {
    if (typeof valor === 'number') {
        return Number.isInteger(valor) ? 'entero' : 'real';
    }
    if (typeof valor === 'boolean') {
        return 'logico';
    }
    if (typeof valor === 'string') {
        // En PSeInt, una cadena de un solo carácter puede ser 'caracter' o 'cadena'.
        // Para simplificar la inferencia inicial, lo tratamos como 'cadena'.
        // La conversión se encargará si el destino es 'caracter'.
        return 'cadena';
    }
    return 'desconocido';
};

Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    const tipoDestinoLower = String(tipoDestino).toLowerCase();
    // Si el valor es null o undefined, y el tipo destino no es 'desconocido', intentar usar valor por defecto.
    // Esto es más una salvaguarda, idealmente el valor evaluado no debería ser null a menos que sea un error.
    if (valor === null || typeof valor === 'undefined') {
        // Permitir asignar null si el tipo es 'desconocido' o si es parte de una inicialización.
        // Por ahora, si es un tipo específico, no permitimos null directamente desde una expresión evaluada a null.
        // Esto podría necesitar revisión para funciones que devuelven tipos especiales o para errores.
        if (tipoDestinoLower !== 'desconocido') {
             //throw new Error(`No se puede asignar un valor nulo/indefinido a un tipo '${tipoDestinoLower}'.`);
             // Devolver el valor por defecto del tipo podría ser una opción, pero puede ocultar errores.
             // Por ahora, lo dejamos pasar para ver qué tipo de `valor` llega aquí.
        }
    }

    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();

    if (tipoOrigen === tipoDestinoLower && tipoDestinoLower !== 'desconocido') return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return parseFloat(valor);
    if (tipoDestinoLower === 'numero') {
        if (tipoOrigen === 'entero' || tipoOrigen === 'real') return valor;
    }
    // Si el tipo destino es 'cadena', casi cualquier cosa se puede convertir
    if (tipoDestinoLower === 'cadena') {
        if (typeof valor === 'boolean') return valor ? 'Verdadero' : 'Falso';
        return String(valor);
    }
    // Si el tipo destino es 'caracter'
    if (tipoDestinoLower === 'caracter') {
        if (typeof valor === 'string' && valor.length > 0) return valor.charAt(0);
        if (typeof valor === 'string' && valor.length === 0) return ''; // Cadena vacía a caracter vacío
        // Otras conversiones a caracter podrían ser restrictivas o generar error
    }


    if (typeof valor === 'string') {
        const valTrimmed = valor.trim();
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valTrimmed, 10);
                // Validar que toda la cadena fue consumida y es un número
                if (isNaN(intVal) || !/^-?\d+$/.test(valTrimmed) ) { // Expresión regular para enteros
                    throw new Error(`La cadena '${valor}' no es un entero válido para la conversión.`);
                }
                return intVal;
            case 'real':
            case 'numero':
                if (valTrimmed === "") throw new Error(`La cadena vacía no es un número real válido.`);
                // Usar parseFloat para permitir decimales. Validar que no sea solo un "." o similar.
                const numRepresentation = parseFloat(valTrimmed);
                if (isNaN(numRepresentation) || !isFinite(numRepresentation) || !/^-?\d*(\.\d+)?$/.test(valTrimmed) && !/^-?\d+\.?$/.test(valTrimmed) ) {
                     if (valTrimmed.match(/^-?\d*\.$/)) { /* ok, like "123." */ }
                     else if (valTrimmed.match(/^-?\.\d+$/)) { /* ok, like "-.5" */ }
                     else throw new Error(`La cadena '${valor}' no es un número real válido para la conversión.`);
                }
                return numRepresentation;
            case 'logico':
                const lowerVal = valTrimmed.toLowerCase();
                if (lowerVal === 'verdadero' || lowerVal === 'v') return true;
                if (lowerVal === 'falso' || lowerVal === 'f') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
            case 'caracter': // Ya cubierto arriba si el destino es caracter
                return valTrimmed.length > 0 ? valTrimmed.charAt(0) : '';
            // case 'cadena': // Ya cubierto (string a string)
        }
    } else if (typeof valor === 'number') {
        switch (tipoDestinoLower) {
            case 'entero': return Math.trunc(valor);
            case 'real': return valor;
            case 'numero': return valor;
            // case 'cadena': // Cubierto por la conversión genérica a cadena
            case 'caracter': return String(valor).charAt(0) || '';
            case 'logico': throw new Error(`No se puede convertir directamente un número (${valor}) a lógico. Use una comparación.`);
        }
    } else if (typeof valor === 'boolean') {
         switch (tipoDestinoLower) {
            case 'entero': return valor ? 1 : 0;
            case 'real': return valor ? 1.0 : 0.0;
            case 'numero': return valor ? 1 : 0;
            // case 'cadena': // Cubierto
            case 'logico': return valor;
            case 'caracter': throw new Error(`No se puede convertir directamente un lógico a caracter.`);
        }
    }
    throw new Error(`Incompatibilidad de tipo: no se puede convertir '${tipoOrigen}' (valor: "${valor}") a '${tipoDestinoLower}'.`);
};

Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType) {
    const defaultValue = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType);
    function crearDimension(dimIndex) {
        const dimensionSize = dimensions[dimIndex];
        if (typeof dimensionSize !== 'number' || !Number.isInteger(dimensionSize) || dimensionSize <= 0) {
            throw new Error(`Las dimensiones de un arreglo deben ser números enteros positivos. Se encontró: ${dimensionSize}.`);
        }
        let arr = new Array(dimensionSize + 1);
        if (dimIndex === dimensions.length - 1) {
            for (let i = 1; i <= dimensionSize; i++) arr[i] = defaultValue;
        } else {
            for (let i = 1; i <= dimensionSize; i++) arr[i] = crearDimension(dimIndex + 1);
        }
        return arr;
    }
    if (!dimensions || dimensions.length === 0) throw new Error("No se pueden inicializar arreglos sin dimensiones.");
    return crearDimension(0);
};

Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaInicioSubProceso, indiceInicio, todasLasLineas) {
    const regexDefSubProceso = /^\s*SubProceso\s+(?:([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*)?([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/i;
    const matchHeader = lineaInicioSubProceso.trim().match(regexDefSubProceso);
    if (!matchHeader) throw new Error(`Sintaxis incorrecta en la definición de SubProceso en línea ${indiceInicio + 1}: '${lineaInicioSubProceso.trim()}'`);
    const varRetornoOriginal = matchHeader[1] ? matchHeader[1].trim() : null;
    const nombreFuncionOriginal = matchHeader[2].trim();
    const paramsStr = matchHeader[3].trim();
    const nombreFuncionLc = nombreFuncionOriginal.toLowerCase();
    const varRetornoLc = varRetornoOriginal ? varRetornoOriginal.toLowerCase() : null;
    const parametros = [];
    if (paramsStr) {
        const paramsList = paramsStr.split(',');
        for (const pStr of paramsList) {
            const paramTrimmed = pStr.trim();
            if (paramTrimmed === "") continue;
            const regexParam = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)/i;
            const matchParam = paramTrimmed.match(regexParam);
            if (!matchParam) throw new Error(`Sintaxis incorrecta para el parámetro '${paramTrimmed}' de SubProceso '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);
            const paramNameOriginal = matchParam[1];
            parametros.push({ nombreOriginal: paramNameOriginal, nombreLc: paramNameOriginal.toLowerCase(), tipo: 'desconocido', esPorReferencia: false });
        }
    }
    const cuerpo = [];
    let currentLineNum = indiceInicio + 1;
    let finSubProcesoEncontrado = false;
    for (; currentLineNum < todasLasLineas.length; currentLineNum++) {
        const lineaCuerpoOriginal = todasLasLineas[currentLineNum];
        let lineaCuerpoAnalisis = lineaCuerpoOriginal.split('//')[0].trim();
        if (lineaCuerpoAnalisis.startsWith('/*') && lineaCuerpoAnalisis.endsWith('*/')) lineaCuerpoAnalisis = '';
        const lineaCuerpoLower = lineaCuerpoAnalisis.toLowerCase();
        if (lineaCuerpoLower.startsWith("finsubproceso")) {
            finSubProcesoEncontrado = true; break;
        }
        cuerpo.push(lineaCuerpoOriginal);
    }
    if (!finSubProcesoEncontrado) throw new Error(`Se esperaba 'FinSubProceso' para cerrar la definición de '${nombreFuncionOriginal}' iniciada en línea ${indiceInicio + 1}.`);
    return {
        nombreOriginal: nombreFuncionOriginal, nombreLc: nombreFuncionLc,
        retornoVarOriginal: varRetornoOriginal, retornoVarLc: varRetornoLc,
        parametros: parametros, cuerpo: cuerpo,
        lineaOriginalDef: indiceInicio + 1, indiceFinEnTodasLasLineas: currentLineNum
    };
};

Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s*\[\s*(.+?)\s*\])?$/i);
    if (!coincidenciaDefinir) return false;
    const nombresVariablesOriginales = coincidenciaDefinir[1].split(',').map(s => s.trim());
    const tipoBaseStr = coincidenciaDefinir[2];
    const dimsStr = coincidenciaDefinir[3];
    let tipoBaseLc = tipoBaseStr.toLowerCase();
    const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena', 'numero', 'número', 'numerico', 'numérico'];
    if (!tiposConocidos.includes(tipoBaseLc)) {
        throw new Error(`Tipo '${tipoBaseStr}' no reconocido en línea ${numLineaOriginal}.`);
    }
    if (tipoBaseLc.startsWith("num")) tipoBaseLc = "numero";

    for (const nombreOriginal of nombresVariablesOriginales) {
        if (nombreOriginal === "") throw new Error(`Nombre de variable vacío en 'Definir' en línea ${numLineaOriginal}.`);
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreOriginal}' en 'Definir' en línea ${numLineaOriginal}.`);
        }
        const nombreLc = nombreOriginal.toLowerCase();
        if (ambitoActual.hasOwnProperty(nombreLc)) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA línea ${numLineaOriginal}]: Variable '${nombreOriginal}' ya definida. Se sobrescribirá.`, 'warning');
        }

        if (dimsStr) {
            // Para este bloque, las dimensiones deben ser literales numéricos o variables SIMPLES ya definidas cuyo valor sea numérico.
            // La evaluación completa de expresiones en dimensiones vendrá después.
            const dimExprs = dimsStr.split(',').map(s => s.trim());
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                let dimVal;
                // Intentar parsear como número literal primero
                if (/^\d+$/.test(expr)) {
                    dimVal = parseInt(expr, 10);
                } else { // Si no es literal, intentar evaluar como variable simple
                    try {
                        dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                    } catch (e) {
                        throw new Error(`Error evaluando dimensión '${expr}' para arreglo '${nombreOriginal}' en línea ${numLineaOriginal}: ${e.message}. En este bloque, las dimensiones deben ser números literales o variables simples ya definidas.`);
                    }
                }
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) {
                    throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}' (evaluado a ${dimVal}) para '${nombreOriginal}' línea ${numLineaOriginal}.`);
                }
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = {
                type: 'array', baseType: tipoBaseLc, dimensions: evalDimensiones,
                value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc),
                isFlexibleType: tipoBaseLc === 'numero'
            };
            if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreOriginal}'(${tipoBaseLc}) dimensionado con [${evalDimensiones.join(',')}] en línea ${numLineaOriginal} (Bloque 3).`, 'normal');
        } else {
            ambitoActual[nombreLc] = {
                value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc),
                type: tipoBaseLc,
                isFlexibleType: tipoBaseLc === 'numero'
            };
             if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Variable '${nombreOriginal}'(${tipoBaseLc}) definida en línea ${numLineaOriginal} (Bloque 3).`, 'normal');
        }
    }
    return true;
};

Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) {
    let keyword = linea.trim().toLowerCase().startsWith("dimensionar") ? "Dimensionar" : "Dimension";
    let declaracionStr = linea.trim().substring(keyword.length).trim();
    if (declaracionStr === "") throw new Error(`Declaración '${keyword}' vacía en línea ${numLineaOriginal}.`);

    const declaracionesIndividuales = declaracionStr.split(',');
    for (let decl of declaracionesIndividuales) {
        decl = decl.trim();
        // Regex un poco más permisivo para el contenido de los corchetes, luego se evalúa
        const matchArr = decl.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/i);
        if (!matchArr) throw new Error(`Sintaxis incorrecta para '${decl}' en '${keyword}' en línea ${numLineaOriginal}. Se esperan dimensiones (ej: A[5] o B[var1, var2+1]).`);

        const nombreArrOriginal = matchArr[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        const baseTypeParaArray = 'numero';
        const isFlexibleType = true;

        if (ambitoActual.hasOwnProperty(nombreArrLc)) {
             if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA línea ${numLineaOriginal}]: Arreglo '${nombreArrOriginal}' ya definido. Sobrescribiendo.`, 'warning');
        }

        const dimExprs = matchArr[2].split(',').map(s => s.trim());
        const evalDimensiones = [];
        for (const expr of dimExprs) {
            let dimVal;
            if (/^\d+$/.test(expr)) { // Literal numérico
                dimVal = parseInt(expr, 10);
            } else { // Expresión (simple por ahora)
                try {
                    dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                } catch (e) {
                    throw new Error(`Error evaluando dimensión '${expr}' para '${nombreArrOriginal}' en línea ${numLineaOriginal}: ${e.message}.`);
                }
            }
            if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) {
                throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}' (evaluado a ${dimVal}) para '${nombreArrOriginal}' línea ${numLineaOriginal}.`);
            }
            evalDimensiones.push(dimVal);
        }
        ambitoActual[nombreArrLc] = {
            type: 'array', baseType: baseTypeParaArray, dimensions: evalDimensiones,
            value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, baseTypeParaArray),
            isFlexibleType: isFlexibleType
        };
        if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' (${baseTypeParaArray}) dimensionado con [${evalDimensiones.join(',')}] usando '${keyword}' en línea ${numLineaOriginal} (Bloque 3).`, 'normal');
    }
    return true;
};

// --- NUEVAS FUNCIONES (Bloque 3) ---
Webgoritmo.Interprete.handleEscribir = async function(linea, ambitoActual, numLineaOriginal) {
    const regexEscribir = /^(Escribir|Imprimir|Mostrar)\s+(.*)/i;
    const coincidenciaEscribir = linea.match(regexEscribir);
    if (!coincidenciaEscribir) return false;

    const cadenaArgs = coincidenciaEscribir[2];
    // Separar argumentos por coma, respetando comillas (simplificado)
    // Esta es una forma básica, una solución más robusta usaría un mini-parser o FSM.
    const args = [];
    let buffer = "";
    let dentroDeComillasDobles = false;
    let dentroDeComillasSimples = false;

    for (let k = 0; k < cadenaArgs.length; k++) {
        const char = cadenaArgs[k];
        if (char === '"' && (k === 0 || cadenaArgs[k-1] !== '\\')) { // Manejar comillas escapadas \\"
            dentroDeComillasDobles = !dentroDeComillasDobles;
        } else if (char === "'" && (k === 0 || cadenaArgs[k-1] !== '\\')) { // Manejar comillas escapadas \\'
            dentroDeComillasSimples = !dentroDeComillasSimples;
        }

        if (char === ',' && !dentroDeComillasDobles && !dentroDeComillasSimples) {
            args.push(buffer.trim());
            buffer = "";
        } else {
            buffer += char;
        }
    }
    args.push(buffer.trim()); // El último argumento

    let partesMensajeSalida = [];
    for (const arg of args) {
        if(arg === "") continue; // Argumento vacío entre comas, ignorar
        try {
            const parteEvaluada = await Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
            // Convertir booleano a su representación en español para salida
            partesMensajeSalida.push( (typeof parteEvaluada === 'boolean') ? (parteEvaluada ? 'Verdadero' : 'Falso') : (parteEvaluada === null ? 'nulo' : String(parteEvaluada)) );
        } catch (e) {
            throw new Error(`Error evaluando argumento '${arg}' en 'Escribir' (línea ${numLineaOriginal}): ${e.message}`);
        }
    }

    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
        Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal'); // Unir sin espacios adicionales
    }
    return true;
};

Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) {
    // Regex para capturar: destino (variable o arreglo[indice]), operador (<- o =), expresión
    const asignacionMatch = linea.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.*)$/);
    if (!asignacionMatch) return false;

    const destinoStrOriginal = asignacionMatch[1].trim();
    const exprStr = asignacionMatch[2].trim();
    if (exprStr === "") throw new Error(`Expresión vacía en asignación en línea ${numLineaOriginal}.`);

    let valorEvaluado;
    try {
        valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprStr, ambitoActual);
    } catch (e) {
        throw new Error(`Error evaluando expresión '${exprStr}' en asignación (línea ${numLineaOriginal}): ${e.message}`);
    }

    // Verificar si el destino es un acceso a arreglo o una variable simple
    const accesoArregloMatch = destinoStrOriginal.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);

    if (accesoArregloMatch) { // Asignación a un elemento de arreglo
        const nombreArrOriginal = accesoArregloMatch[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreArrLc) || ambitoActual[nombreArrLc].type !== 'array') {
            throw new Error(`Arreglo '${nombreArrOriginal}' no definido o no es un arreglo (línea ${numLineaOriginal}).`);
        }
        const arrMeta = ambitoActual[nombreArrLc];

        const indiceExprs = accesoArregloMatch[2].split(',').map(s => s.trim());
        if (indiceExprs.some(s => s === "")) throw new Error(`Índice vacío para '${nombreArrOriginal}' (línea ${numLineaOriginal}).`);
        if (indiceExprs.length !== arrMeta.dimensions.length) {
            throw new Error(`Dimensiones incorrectas para '${nombreArrOriginal}'. Esperadas ${arrMeta.dimensions.length}, recibidas ${indiceExprs.length} (línea ${numLineaOriginal}).`);
        }

        const evalIndices = [];
        for (let k = 0; k < indiceExprs.length; k++) {
            let idxVal;
            // En este bloque, los índices pueden ser literales o variables simples
            if (/^\d+$/.test(indiceExprs[k])) {
                idxVal = parseInt(indiceExprs[k], 10);
            } else {
                try {
                    idxVal = await Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], ambitoActual);
                } catch (e) {
                     throw new Error(`Error evaluando índice '${indiceExprs[k]}' para '${nombreArrOriginal}' (línea ${numLineaOriginal}): ${e.message}`);
                }
            }
            // PSeInt usa índices base 1. La validación de tipo y rango es crucial.
            if (typeof idxVal !== 'number' || !Number.isInteger(idxVal) ) {
                 // Permitir truncamiento si es un real que representa un entero, ej. 3.0
                 if (typeof idxVal === 'number' && idxVal === Math.trunc(idxVal)) {
                    idxVal = Math.trunc(idxVal);
                 } else {
                    throw new Error(`Índice para '${nombreArrOriginal}' debe ser numérico entero. Se obtuvo '${indiceExprs[k]}' (evaluado a ${idxVal}) (línea ${numLineaOriginal}).`);
                 }
            }
            if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) {
                throw new Error(`Índice [${idxVal}] fuera de límites para dimensión ${k+1} de '${nombreArrOriginal}' (1..${arrMeta.dimensions[k]}) (línea ${numLineaOriginal}).`);
            }
            evalIndices.push(idxVal);
        }

        // Navegar hasta el sub-arreglo/elemento correcto
        let targetLevel = arrMeta.value;
        for (let k = 0; k < evalIndices.length - 1; k++) {
            if (!targetLevel || !Array.isArray(targetLevel[evalIndices[k]])) { // Debería ser un array si no es la última dim
                throw new Error(`Error interno accediendo sub-arreglo de '${nombreArrOriginal}' en dimensión ${k+1} (línea ${numLineaOriginal}).`);
            }
            targetLevel = targetLevel[evalIndices[k]];
        }

        // Determinar el tipo destino para la conversión
        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestinoParaConversion = arrMeta.isFlexibleType && arrMeta.baseType === 'numero' ? tipoValorEntrante : arrMeta.baseType;

        // Si el arreglo es de tipo 'numero' y aún no se ha fijado su tipo, fijarlo con el primer valor asignado
        if (arrMeta.isFlexibleType && arrMeta.baseType === 'numero') {
             // Solo fijar si el tipo entrante es más específico (entero, real, logico)
             if (tipoValorEntrante !== 'desconocido' && tipoValorEntrante !== 'numero') {
                arrMeta.baseType = tipoValorEntrante;
                arrMeta.isFlexibleType = false; // El tipo del arreglo ahora está fijado
                if(Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' fijó su tipo base a '${tipoValorEntrante}' en línea ${numLineaOriginal}.`, 'normal');
                tipoDestinoParaConversion = tipoValorEntrante; // Usar el tipo recién fijado para la conversión
             }
        }
        targetLevel[evalIndices[evalIndices.length - 1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoParaConversion);

    } else { // Asignación a una variable simple
        const nombreVarOriginal = destinoStrOriginal;
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreVarOriginal}' en asignación en línea ${numLineaOriginal}.`);
        }
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) {
            throw new Error(`Variable '${nombreVarOriginal}' no definida antes de asignarle valor (línea ${numLineaOriginal}).`);
        }
        const varMeta = ambitoActual[nombreVarLc];
        if (varMeta.type === 'array') { // No se puede asignar a un arreglo completo sin especificar índices
            throw new Error(`No se puede asignar un valor a un arreglo completo ('${nombreVarOriginal}') sin especificar índices (línea ${numLineaOriginal}).`);
        }

        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestinoEscalar = varMeta.isFlexibleType && varMeta.type === 'numero' ? tipoValorEntrante : varMeta.type;

        if (varMeta.isFlexibleType && varMeta.type === 'numero') {
            if (tipoValorEntrante !== 'desconocido' && tipoValorEntrante !== 'numero') {
                varMeta.type = tipoValorEntrante; // Fija el tipo de la variable 'numero'
                varMeta.isFlexibleType = false;
                tipoDestinoEscalar = tipoValorEntrante;
            }
        }
        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoEscalar);
    }
    return true; // Instrucción manejada
};


// --- LÓGICA DE EJECUCIÓN (ACTUALIZADA Bloque 3) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) {
        console.error("ejecutarBloque: Módulos Webgoritmo esenciales no definidos."); return;
    }
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloque (Bloque 3) procesando ${lineasBloqueParam.length} líneas. Offset: ${numLineaOriginalOffset}`, 'debug');

    let i = 0;
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("Ejecución detenida en ejecutarBloque (Bloque 3)."); break; }

        const lineaOriginal = lineasBloqueParam[i];
        const lineaTrimmed = lineaOriginal.trim();
        const numLineaGlobal = numLineaOriginalOffset + i + 1;

        Webgoritmo.estadoApp.currentLineInfo = { numLineaOriginal: numLineaGlobal, contenido: lineaTrimmed };

        if (lineaTrimmed === '' || lineaTrimmed.startsWith('//') || (lineaTrimmed.startsWith('/*') && lineaTrimmed.endsWith('*/'))) {
            i++; continue;
        }
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLineaGlobal}: ${lineaTrimmed}`, 'debug');

        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();
            const matchAsignacion = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)/);


            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('dimension ') || lineaLower.startsWith('dimensionar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('escribir ') || lineaLower.startsWith('imprimir ') || lineaLower.startsWith('mostrar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (matchAsignacion) { // La asignación debe probarse antes que otras que puedan parecerse (ej. llamadas a función)
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            }
            // En este bloque, no manejamos otras instrucciones aún.
            // Solo se loguearán como no reconocidas si no son comentarios o líneas vacías.

            if (!instruccionManejada && lineaTrimmed && !/^(finsi|sino|finmientras|finpara|finsubproceso|finsegun|hasta que|proceso|algoritmo|finproceso|finalgoritmo)$/.test(lineaLower.split(/\s+/)[0])) {
                 if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Instrucción no reconocida en Bloque 3: '${lineaTrimmed}' (L${numLineaGlobal})`, 'warning');
            }

        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = e.message.startsWith(`Error en línea ${numLineaGlobal}`) || e.message.startsWith(`Error línea ${numLineaGlobal}`) ? e.message : `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }
        i++;
    }
    Webgoritmo.estadoApp.currentLineInfo = null;
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { console.error("Webgoritmo.UI.añadirSalida no está disponible."); return; }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { Webgoritmo.UI.añadirSalida("Error: El editor de código no está listo.", "error"); return; }
    if (!Webgoritmo.estadoApp) { Webgoritmo.UI.añadirSalida("Error: El estado de la aplicación no está listo.", "error"); return; }
    if (!Webgoritmo.Expresiones) { Webgoritmo.UI.añadirSalida("Error: El evaluador de expresiones no está listo.", "error"); return; }

    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Reconstrucción Incremental - Bloque 3) ---", "normal");

    Webgoritmo.estadoApp.variables = {};
    Webgoritmo.estadoApp.detenerEjecucion = false;
    Webgoritmo.estadoApp.errorEjecucion = null;
    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {};
    const subProcesoLineIndices = new Set();

    if (Webgoritmo.Interprete.parseDefinicionSubProceso) {
        for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
            const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[i];
            let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
            if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
            const lineaLower = lineaParaAnalisis.toLowerCase();
            if (lineaLower.startsWith("subproceso")) {
                try {
                    const defSubProceso = Webgoritmo.Interprete.parseDefinicionSubProceso(lineaOriginal, i, Webgoritmo.estadoApp.lineasCodigo);
                    if (Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(defSubProceso.nombreLc)) {
                        throw new Error(`SubProceso '${defSubProceso.nombreOriginal}' ya definido.`);
                    }
                    Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc] = defSubProceso;
                    for (let k = i; k <= defSubProceso.indiceFinEnTodasLasLineas; k++) subProcesoLineIndices.add(k);
                    i = defSubProceso.indiceFinEnTodasLasLineas;
                     if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`SubProceso '${defSubProceso.nombreOriginal}' parseado (Bloque 3).`, 'debug');
                } catch (e) {
                    Webgoritmo.estadoApp.errorEjecucion = e.message; Webgoritmo.estadoApp.detenerEjecucion = true; break;
                }
            }
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
        }
    }

    if (Webgoritmo.estadoApp.detenerEjecucion) {
        if (Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase de parseo de SubProcesos - Bloque 3) ---", "error");
        }
        return;
    }

    let lineasDelPrincipal = [];
    let inicioBloquePrincipalLineaNum = -1;
    let processingState = 'buscar_inicio';

    for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) {
        if (subProcesoLineIndices.has(j)) continue;
        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[j];
        let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
        if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
        const lineaLower = lineaParaAnalisis.toLowerCase();

        if (processingState === 'buscar_inicio') {
            if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                inicioBloquePrincipalLineaNum = j + 1; processingState = 'en_bloque';
            } else if (lineaParaAnalisis !== "") {
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') fuera de bloque 'Algoritmo'/'Proceso'.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            }
        } else if (processingState === 'en_bloque') {
            if (lineaLower.startsWith("finproceso") || lineaLower.startsWith("finalgoritmo")) {
                processingState = 'bloque_terminado';
            } else if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Bloques 'Algoritmo'/'Proceso' anidados no permitidos.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            } else {
                lineasDelPrincipal.push(lineaOriginal);
            }
        } else if (processingState === 'bloque_terminado') {
            if (lineaParaAnalisis !== "") {
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') después de 'FinAlgoritmo'/'FinProceso'.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            }
        }
    }

    if (!Webgoritmo.estadoApp.errorEjecucion) {
        const tieneCodigoEfectivo = Webgoritmo.estadoApp.lineasCodigo.some((l, idx) => {
            if (subProcesoLineIndices.has(idx)) return false;
            let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';
        });
        if (processingState === 'buscar_inicio' && tieneCodigoEfectivo) {
            Webgoritmo.estadoApp.errorEjecucion = "No se encontró bloque 'Algoritmo'/'Proceso' principal.";
        } else if (processingState === 'en_bloque') {
             Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo'/'Proceso' iniciado en línea ${inicioBloquePrincipalLineaNum} no fue cerrado.`;
        }
    }

    if (Webgoritmo.estadoApp.errorEjecucion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        Webgoritmo.estadoApp.detenerEjecucion = true;
    } else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Bloque principal encontrado (L${inicioBloquePrincipalLineaNum}). Ejecutando ${lineasDelPrincipal.length} líneas.`, 'debug');
        if (lineasDelPrincipal.length > 0) {
            await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        } else if (Webgoritmo.UI.añadirSalida) {
             Webgoritmo.UI.añadirSalida("Advertencia: Bloque Algoritmo/Proceso vacío.", "warning");
        }
    } else if (inicioBloquePrincipalLineaNum === -1 && !Webgoritmo.estadoApp.lineasCodigo.some((l, idx) => { /* ... */ })) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("No se encontró código en el bloque principal para ejecutar.", "normal");
    } else if (processingState === 'buscar_inicio' && !Webgoritmo.estadoApp.lineasCodigo.some(l => { /* ... */ })) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("El archivo de código está vacío.", "normal");
    }

    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) {
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Bloque 3) ---", "error");
        }
        else if (Webgoritmo.estadoApp.detenerEjecucion) { Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida (Bloque 3) ---", "warning"); }
        else { Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Bloque 3) ---", "normal"); }
    }

    if (Webgoritmo.UI.añadirSalida && Webgoritmo.estadoApp.variables && Object.keys(Webgoritmo.estadoApp.variables).length > 0) {
        Webgoritmo.UI.añadirSalida("Estado final de variables (Bloque 3):", "debug");
        for (const varName in Webgoritmo.estadoApp.variables) {
            const meta = Webgoritmo.estadoApp.variables[varName];
            let valueStr = meta.value;
            if (typeof meta.value === 'boolean') valueStr = meta.value ? 'Verdadero' : 'Falso';
            else if (meta.type === 'array') {
                try { valueStr = JSON.stringify(meta.value); } catch (e) { valueStr = "[Arreglo complejo]";}
            } else {
                valueStr = String(meta.value);
            }
            Webgoritmo.UI.añadirSalida(`  ${varName} (${meta.type}): ${valueStr}`, "debug");
        }
    }
};

console.log("motorInterprete.js (Reconstrucción Incremental - BLOQUE 3) cargado.");
console.log("handleEscribir, handleAsignacion añadidos. Lógica de ejecución actualizada.");
console.log("Webgoritmo.Interprete:", Webgoritmo.Interprete);
