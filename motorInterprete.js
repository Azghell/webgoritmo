// motorInterprete.js
// Contiene el núcleo del intérprete: utilidades de tipo/conversión,
// manejadores de instrucciones MVP, y motor de ejecución básico.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) {
    const tipoLower = String(tipo).toLowerCase();
    switch (tipoLower) {
        case 'entero': return 0;
        case 'real': return 0.0;
        case 'logico': return false;
        case 'caracter': return '';
        case 'cadena': return '';
        default:
            console.warn(`Tipo '${tipo}' no reconocido en obtenerValorPorDefecto. Usando null.`);
            return null;
    }
};
Webgoritmo.Interprete.inferirTipo = function(valor) {
    if (typeof valor === 'number') return Number.isInteger(valor) ? 'Entero' : 'Real';
    if (typeof valor === 'boolean') return 'Logico';
    if (typeof valor === 'string') return 'Cadena';
    return 'Desconocido';
};
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    const tipoDestinoLower = String(tipoDestino).toLowerCase();
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();
    if (tipoOrigen === tipoDestinoLower) return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return valor;
    if (typeof valor === 'string') {
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valor);
                // Check ensures the entire string was a valid integer representation
                if (isNaN(intVal) || String(intVal) !== valor.trim()) {
                    throw new Error(`La cadena '${valor}' no es un entero válido.`);
                }
                return intVal;
            case 'real':
                // Stricter check for real numbers: the entire string must represent a valid finite number.
                const valTrimmed = valor.trim();
                if (valTrimmed === "") { // Empty string is not a valid number
                    throw new Error(`La cadena '${valor}' (vacía) no es un número real válido.`);
                }
                const numRepresentation = Number(valTrimmed);
                if (!isFinite(numRepresentation)) { // Catches NaN, Infinity, -Infinity from non-numeric strings or actual "Infinity" text
                    throw new Error(`La cadena '${valTrimmed}' no es un número real válido.`);
                }
                return numRepresentation; // Use Number() for conversion as it's generally more robust for full string validation
            case 'logico':
                const lowerVal = valor.toLowerCase();
                if (lowerVal === 'verdadero') return true;
                if (lowerVal === 'falso') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
            case 'caracter': return valor.length > 0 ? valor.charAt(0) : '';
            case 'cadena': return valor;
        }
    } else if (typeof valor === 'number') {
        if (tipoDestinoLower === 'entero') return Math.trunc(valor);
        if (tipoDestinoLower === 'cadena') return String(valor);
        if (tipoDestinoLower === 'caracter') return String(valor).charAt(0) || '';
    } else if (typeof valor === 'boolean') {
        if (tipoDestinoLower === 'cadena') return valor ? 'Verdadero' : 'Falso';
        if (tipoDestinoLower === 'entero') return valor ? 1 : 0;
        if (tipoDestinoLower === 'real') return valor ? 1.0 : 0.0;
    }
    throw new Error(`Incompatibilidad de tipo: no se puede convertir ${tipoOrigen} a ${tipoDestinoLower}.`);
};

Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType, ambitoParaDefaultValor) {
    // dimensions: array of evaluated maximum indices e.g., [5, 3] for Dim A[5,3]
    // baseType: string like 'Entero', 'Cadena', 'desconocido'
    // ambitoParaDefaultValor: PSeInt doesn't have complex default values, but if it did, they might need scope. Not used now.
    const defaultValue = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType);

    function crearDimension(dimIndex) {
        const dimensionSize = dimensions[dimIndex];
        if (dimensionSize <= 0) { // Dimensiones deben ser positivas
            throw new Error(`Las dimensiones de un arreglo deben ser mayores que cero. Se encontró: ${dimensionSize}.`);
        }
        // Crear array de tamaño dimensionSize + 1 para 1-based indexing
        let arr = new Array(dimensionSize + 1);

        if (dimIndex === dimensions.length - 1) { // Última dimensión, llenar con valores por defecto
            for (let i = 1; i <= dimensionSize; i++) {
                // Para objetos o arreglos como valor por defecto, se necesitaría una copia profunda.
                // Para primitivas (numero, string, boolean), la asignación directa está bien.
                arr[i] = defaultValue;
            }
        } else { // No es la última dimensión, llenar con sub-arreglos
            for (let i = 1; i <= dimensionSize; i++) {
                arr[i] = crearDimension(dimIndex + 1);
            }
        }
        return arr;
    }

    if (!dimensions || dimensions.length === 0) {
        throw new Error("No se pueden inicializar arreglos sin dimensiones.");
    }
    return crearDimension(0);
};

Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaInicioSubProceso, indiceInicio, todasLasLineas) {
    // Regex para SubProceso:
    // Grupo 1 (opcional): varRetorno
    // Grupo 2 (opcional): operador de asignación para retorno ('<-' o '=')
    // Grupo 3: nombreFuncion
    // Grupo 4: paramsStr
    const regexDefSubProceso = /^\s*SubProceso\s+(?:([a-zA-Z_][a-zA-Z0-9_]*)\s*(<-|=)\s*)?([a-zA-Z_][a-zA-Z0-9_]+)\s*\((.*?)\)\s*$/i;
    const matchHeader = lineaInicioSubProceso.trim().match(regexDefSubProceso);

    if (!matchHeader) {
        throw new Error(`Sintaxis incorrecta en la definición de SubProceso en línea ${indiceInicio + 1}.`);
    }

    const varRetorno = matchHeader[1] ? matchHeader[1].trim() : null;
    const nombreFuncion = matchHeader[3].trim();
    const paramsStr = matchHeader[4].trim();
    const parametros = [];

    if (paramsStr) {
        const paramsList = paramsStr.split(',');
        for (const pStr of paramsList) {
            const paramTrimmed = pStr.trim();
            if (paramTrimmed === "") continue; // Permitir una coma extra al final, por ejemplo

            // Regex para cada parámetro: nombre [Como/Es Tipo] [Por Referencia]
            // Grupo 1: paramName
            // Grupo 2 (opcional): "Como" o "Es"
            // Grupo 3 (opcional): paramType
            // Grupo 4 (opcional): "Por Referencia"
            const regexParam = /^\s*([a-zA-Z_][a-zA-Z0-9_]+)(?:\s+(Como|Es)\s+([a-zA-Z_][a-zA-Z0-9_]+))?(?:\s+Por\s+Referencia)?\s*$/i;
            const matchParam = paramTrimmed.match(regexParam);

            if (!matchParam) {
                throw new Error(`Sintaxis incorrecta para el parámetro '${paramTrimmed}' de SubProceso '${nombreFuncion}' en línea ${indiceInicio + 1}.`);
            }
            const paramName = matchParam[1];
            let paramType = 'desconocido'; // PSeInt a menudo no requiere tipo para params, o infiere
            if (matchParam[3]) {
                const tipoParamLower = matchParam[3].toLowerCase();
                const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena'];
                if (!tiposConocidos.includes(tipoParamLower)) {
                    throw new Error(`Tipo de dato '${matchParam[3]}' no reconocido para parámetro '${paramName}' de '${nombreFuncion}' en línea ${indiceInicio + 1}.`);
                }
                paramType = tipoParamLower;
            }
            const isByRef = matchParam[0].toLowerCase().includes("por referencia"); // Chequeo sobre el match completo del parámetro

            parametros.push({ nombre: paramName, tipo: paramType, esPorReferencia: isByRef });
        }
    }

    const cuerpo = [];
    let i = indiceInicio + 1;
    let anidamiento = 0; // Para SubProceso/FinSubProceso anidados (aunque PSeInt no define funciones dentro de funciones)
    let finSubProcesoEncontrado = false;

    for (; i < todasLasLineas.length; i++) {
        const lineaCuerpoOriginal = todasLasLineas[i];
        let lineaCuerpoAnalisis = lineaCuerpoOriginal.split('//')[0].trim();
        if (lineaCuerpoAnalisis.startsWith('/*') && lineaCuerpoAnalisis.endsWith('*/')) {
            lineaCuerpoAnalisis = '';
        }
        const lineaCuerpoLower = lineaCuerpoAnalisis.toLowerCase();

        if (lineaCuerpoLower.startsWith("subproceso")) {
            anidamiento++;
            cuerpo.push(lineaCuerpoOriginal); // Añadir la línea original para preservar comentarios internos
        } else if (lineaCuerpoLower.startsWith("finsubproceso")) {
            if (anidamiento === 0) {
                finSubProcesoEncontrado = true;
                break;
            } else {
                anidamiento--;
                cuerpo.push(lineaCuerpoOriginal);
            }
        } else {
            cuerpo.push(lineaCuerpoOriginal);
        }
    }

    if (!finSubProcesoEncontrado) {
        throw new Error(`Se esperaba 'FinSubProceso' para cerrar la definición de '${nombreFuncion}' iniciada en línea ${indiceInicio + 1}.`);
    }

    return {
        nombre: nombreFuncion,
        retornoVar: varRetorno,
        parametros: parametros,
        cuerpo: cuerpo,
        lineaOriginalDef: indiceInicio + 1,
        indiceFinEnTodasLasLineas: i // El índice de la línea 'FinSubProceso'
    };
};

Webgoritmo.Interprete.convertirElementosArrayAString = function(arrayValue, dimensions, currentDimIndex = 0) {
    // arrayValue: el arreglo (o subarreglo) de JS actual.
    // dimensions: el arreglo de tamaños máximos de PSeInt (ej. [5, 3] para A[5,3]).
    // currentDimIndex: el índice de la dimensión actual que se está procesando.
    if (!arrayValue) {
        console.warn("convertirElementosArrayAString fue llamado con un arrayValue nulo/indefinido.");
        return;
    }

    const maxIndexThisDim = dimensions[currentDimIndex];

    for (let i = 1; i <= maxIndexThisDim; i++) { // Iterar desde 1 hasta el tamaño de la dimensión
        if (arrayValue[i] === undefined && currentDimIndex < dimensions.length -1 ) {
             console.warn(`Sub-arreglo indefinido encontrado en dimensión ${currentDimIndex + 1}, índice ${i} durante conversión a string. Saltando.`);
             continue;
        }

        if (currentDimIndex === dimensions.length - 1) { // Última dimensión (elementos de datos)
            if (arrayValue[i] !== null && arrayValue[i] !== undefined) {
                arrayValue[i] = String(arrayValue[i]);
            } else {
                arrayValue[i] = "";
            }
        } else { // No es la última dimensión, recursar
            if (Array.isArray(arrayValue[i])) {
                Webgoritmo.Interprete.convertirElementosArrayAString(arrayValue[i], dimensions, currentDimIndex + 1);
            } else {
                console.warn(`Elemento en dimensión ${currentDimIndex + 1}, índice ${i} no es un sub-arreglo durante conversión a string. Valor:`, arrayValue[i]);
                if (arrayValue[i] !== null && arrayValue[i] !== undefined) {
                     arrayValue[i] = String(arrayValue[i]);
                } else {
                     arrayValue[i] = "";
                }
            }
        }
    }
};

Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) {
    if (!Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        throw new Error("Error interno: Módulos no disponibles para 'Dimension'.");
    }
    let declaracionStr = linea.trim().substring("Dimension".length).trim();
    if (declaracionStr === "") {
        throw new Error(`Declaración 'Dimension' vacía en línea ${numLineaOriginal}.`);
    }

    // Regex para capturar cada declaración de arreglo: nombre[dims] o nombre(dims)
    // Esta regex es más simple y asume que las declaraciones están bien formadas y separadas por coma.
    // No maneja comas dentro de las expresiones de dimensión de forma robusta si no están en paréntesis balanceados.
    const declaracionesIndividuales = declaracionStr.split(',');

    for (let decl of declaracionesIndividuales) {
        decl = decl.trim();
        // Regex para capturar: nombre[dims] o nombre(dims) opcionalmente seguido por "Como/Es Tipo"
        // Grupo 1: nombreArr
        // Grupo 2: bracketOpen ('[' o '(')
        // Grupo 3: dimsStr
        // Grupo 4: bracketClose (']' o ')')
        // Grupo 5 (opcional): tipoEspecificado (e.g., "Entero", "Cadena")
        const matchArr = decl.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*([\[\(])\s*(.+?)\s*([\]\)])(?:\s+(?:Como|Es)\s+([a-zA-Z_][a-zA-Z0-9_]+))?\s*$/i);

        if (!matchArr) {
            throw new Error(`Sintaxis incorrecta en declaración de dimensión para '${decl}' en línea ${numLineaOriginal}. Se esperaba 'nombre[dims] [Como/Es Tipo]' o 'nombre(dims) [Como/Es Tipo]'`);
        }

        const nombreArr = matchArr[1];
        const bracketOpen = matchArr[2];
        const dimsStr = matchArr[3];
        const bracketClose = matchArr[4];
        const tipoEspecificadoStr = matchArr[5]; // Puede ser undefined
        let baseTypeParaArray;
        let isFlexibleType;

        if ((bracketOpen === '[' && bracketClose !== ']') || (bracketOpen === '(' && bracketClose !== ')')) {
            throw new Error(`Paréntesis/corchetes no coincidentes en la declaración de dimensión para '${nombreArr}' en línea ${numLineaOriginal}.`);
        }

        if (tipoEspecificadoStr) {
            const tipoLower = tipoEspecificadoStr.toLowerCase();
            const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena'];
            if (!tiposConocidos.includes(tipoLower)) {
                throw new Error(`Tipo de dato '${tipoEspecificadoStr}' no reconocido para el arreglo '${nombreArr}' en línea ${numLineaOriginal}.`);
            }
            baseTypeParaArray = tipoLower;
            isFlexibleType = false; // Type is explicitly defined
        } else {
            baseTypeParaArray = 'entero'; // Default for Dimension without "Como/Es Tipo"
            isFlexibleType = true;    // Type is flexible by default
        }

        if (ambitoActual.hasOwnProperty(nombreArr)) {
             if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: El arreglo '${nombreArr}' ya está definido. Sobrescribiendo.`, 'warning');
        }

        const dimExprs = dimsStr.split(',').map(s => s.trim());
        if (dimExprs.some(s => s === "")) {
            throw new Error(`Expresión de dimensión vacía para el arreglo '${nombreArr}' en línea ${numLineaOriginal}.`);
        }

        const evalDimensiones = [];
        for (const expr of dimExprs) {
            let dimVal;
            try {
                dimVal = Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
            } catch (e) {
                throw new Error(`Error evaluando dimensión '${expr}' para arreglo '${nombreArr}' en línea ${numLineaOriginal}: ${e.message}`);
            }
            if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) {
                throw new Error(`Las dimensiones de un arreglo deben ser enteros positivos. Se encontró '${expr}' (valor: ${dimVal}) para '${nombreArr}' en línea ${numLineaOriginal}.`);
            }
            evalDimensiones.push(dimVal);
        }

        ambitoActual[nombreArr] = {
            type: 'array',
            baseType: baseTypeParaArray,
            dimensions: evalDimensiones,
            value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, baseTypeParaArray, ambitoActual),
            isFlexibleType: isFlexibleType
        };
        const tipoMsg = tipoEspecificadoStr ? `tipo base '${baseTypeParaArray}' (fijo)` : "tipo base Entero (flexible por defecto)";
         if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArr}' (${tipoMsg}) dimensionado con [${evalDimensiones.join(', ')}] en línea ${numLineaOriginal}.`, 'normal');
    }
    return true; // Indica que la instrucción fue manejada
};


// --- MANEJADORES DE INSTRUCCIONES ---
Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) {
    // Regex actualizada para capturar opcionalmente las dimensiones del arreglo y aceptar "Como" o "Es"
    // Grupo 1: Lista de nombres de variables
    // Grupo 2: Tipo base (Entero, Real, etc.)
    // Grupo 3 (opcional): Cadena de dimensiones (ej. "10, 5" o "N+1, M")
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s+(?:Como|Es)\s+([a-zA-Z_][a-zA-Z0-9_]+)(?:\s*\[\s*(.+?)\s*\])?$/i);

    if (coincidenciaDefinir) {
        const nombresVariables = coincidenciaDefinir[1].split(',').map(s => s.trim());
        const tipoBaseStr = coincidenciaDefinir[2]; // Tipo base como string
        const dimsStr = coincidenciaDefinir[3]; // Puede ser undefined si no es un arreglo

        // Validar que el tipoBaseStr sea uno de los tipos conocidos
        const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena'];
        if (!tiposConocidos.includes(tipoBaseStr.toLowerCase())) {
            throw new Error(`Tipo de dato '${tipoBaseStr}' no reconocido en línea ${numLineaOriginal}.`);
        }

        for (const nombre of nombresVariables) {
            if (nombre === "") {
                throw new Error(`Nombre de variable vacío en definición en línea ${numLineaOriginal}.`);
            }
            if (ambitoActual.hasOwnProperty(nombre)) {
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: La variable '${nombre}' ya está definida. Sobrescribiendo.`, 'warning');
            }

            if (dimsStr) { // Es una declaración de arreglo
                const dimExprs = dimsStr.split(',').map(s => s.trim());
                if (dimExprs.some(s => s === "")) {
                    throw new Error(`Expresión de dimensión vacía para el arreglo '${nombre}' en línea ${numLineaOriginal}.`);
                }
                const evalDimensiones = [];
                for (const expr of dimExprs) {
                    let dimVal;
                    try {
                        dimVal = Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                    } catch (e) {
                        throw new Error(`Error evaluando dimensión '${expr}' para arreglo '${nombre}' en línea ${numLineaOriginal}: ${e.message}`);
                    }
                    if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) {
                        throw new Error(`Las dimensiones de un arreglo deben ser enteros positivos. Se encontró '${expr}' (valor: ${dimVal}) para '${nombre}' en línea ${numLineaOriginal}.`);
                    }
                    evalDimensiones.push(dimVal);
                }

                ambitoActual[nombre] = {
                    type: 'array',
                    baseType: tipoBaseStr.toLowerCase(),
                    dimensions: evalDimensiones,
                    value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseStr.toLowerCase(), ambitoActual),
                    isFlexibleType: false // Arrays defined with 'Definir' have a fixed type
                };
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombre}' de tipo '${tipoBaseStr}' (fijo) dimensionado con [${evalDimensiones.join(', ')}] en línea ${numLineaOriginal}.`, 'normal');

            } else { // Es una declaración de variable escalar
                ambitoActual[nombre] = {
                    value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseStr),
                    type: tipoBaseStr.toLowerCase() // Guardar el tipo en minúsculas
                };
            }
        }
        return true;
    }
    return false;
};

Webgoritmo.Interprete.convertirElementosArrayAString = function(arrayValue, dimensions, currentDimIndex = 0) {
    // arrayValue: el arreglo (o subarreglo) de JS actual.
    // dimensions: el arreglo de tamaños máximos de PSeInt (ej. [5, 3] para A[5,3]).
    // currentDimIndex: el índice de la dimensión actual que se está procesando.
    if (!arrayValue) {
        console.warn("convertirElementosArrayAString fue llamado con un arrayValue nulo/indefinido.");
        return;
    }

    const maxIndexThisDim = dimensions[currentDimIndex];

    for (let i = 1; i <= maxIndexThisDim; i++) { // Iterar desde 1 hasta el tamaño de la dimensión
        if (arrayValue[i] === undefined && currentDimIndex < dimensions.length -1 ) {
             console.warn(`Sub-arreglo indefinido encontrado en dimensión ${currentDimIndex + 1}, índice ${i} durante conversión a string. Saltando.`);
             continue;
        }

        if (currentDimIndex === dimensions.length - 1) { // Última dimensión (elementos de datos)
            if (arrayValue[i] !== null && arrayValue[i] !== undefined) {
                arrayValue[i] = String(arrayValue[i]);
            } else {
                arrayValue[i] = "";
            }
        } else { // No es la última dimensión, recursar
            if (Array.isArray(arrayValue[i])) {
                Webgoritmo.Interprete.convertirElementosArrayAString(arrayValue[i], dimensions, currentDimIndex + 1);
            } else {
                console.warn(`Elemento en dimensión ${currentDimIndex + 1}, índice ${i} no es un sub-arreglo durante conversión a string. Valor:`, arrayValue[i]);
                if (arrayValue[i] !== null && arrayValue[i] !== undefined) {
                     arrayValue[i] = String(arrayValue[i]);
                } else {
                     arrayValue[i] = "";
                }
            }
        }
    }
};

// Implementación ÚNICA Y CORRECTA de handleAsignacion
Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) {
    // Regex para soportar '<-' y '=' como operadores de asignación.
    // No incluye '==' para evitar conflicto con el operador de comparación.
    const asignacionMatch = linea.match(/^(.+?)\s*(?:<-|=)\s*(.*)$/);
    if (!asignacionMatch) return false;

    const destinoStr = asignacionMatch[1].trim();
    const exprStr = asignacionMatch[2].trim();

    let valorEvaluado;
    // Check if RHS is a user-defined function call
    const funcCallMatchRHS = exprStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*$/);
    if (funcCallMatchRHS && Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(funcCallMatchRHS[1])) {
        const funcName = funcCallMatchRHS[1];
        const argsStr = funcCallMatchRHS[2];
        const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[funcName];

        if (defFuncion.retornoVar === null) {
            throw new Error(`Error en línea ${numLineaOriginal}: El SubProceso '${funcName}' no devuelve un valor y no puede ser asignado.`);
        }

        let argExprsRHS = [];
        if (argsStr.trim() !== '') {
            // TODO: Robust argument parsing needed here too for commas in strings/calls
            argExprsRHS = argsStr.split(',').map(a => a.trim());
        }

        try {
            console.log(`[handleAsignacion] Detectada llamada a función definida por usuario en RHS: ${funcName}`);
            valorEvaluado = await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(
                funcName,
                argExprsRHS,
                ambitoActual,
                numLineaOriginal
            );
        } catch (e) {
            throw new Error(`Error en línea ${numLineaOriginal} durante la ejecución de la función '${funcName}' en el lado derecho de la asignación: ${e.message}`);
        }
    } else { // Not a direct user function call, evaluate as general expression
        try {
            valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprStr, ambitoActual); // evaluarExpresion is now async
        } catch (e) {
            throw new Error(`Error evaluando expresión RHS ('${exprStr}') para asignación en línea ${numLineaOriginal}: ${e.message}`);
        }
    }

    const accesoArregloMatch = destinoStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(.+?)\s*\]$/);

    if (accesoArregloMatch) { // Asignación a elemento de arreglo
        const nombreArr = accesoArregloMatch[1];
        const indicesStr = accesoArregloMatch[2];

        if (!ambitoActual.hasOwnProperty(nombreArr)) {
            throw new Error(`Arreglo '${nombreArr}' no ha sido definido (en línea ${numLineaOriginal}).`);
        }
        const arrMeta = ambitoActual[nombreArr];
        if (arrMeta.type !== 'array') {
            throw new Error(`La variable '${nombreArr}' no es un arreglo (en línea ${numLineaOriginal}).`);
        }

        const indiceExprs = indicesStr.split(',').map(s => s.trim());
        if (indiceExprs.some(s => s === "")) {
            throw new Error(`Expresión de índice vacía para el arreglo '${nombreArr}' en línea ${numLineaOriginal}.`);
        }
        if (indiceExprs.length !== arrMeta.dimensions.length) {
            throw new Error(`Número incorrecto de dimensiones para el arreglo '${nombreArr}'. Se esperaban ${arrMeta.dimensions.length}, se proporcionaron ${indiceExprs.length} (en línea ${numLineaOriginal}).`);
        }

        const evalIndices = [];
        for (let k = 0; k < indiceExprs.length; k++) {
            let idxVal;
            try {
                idxVal = Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], ambitoActual);
            } catch (e) {
                throw new Error(`Error evaluando índice '${indiceExprs[k]}' (dimensión ${k+1}) para arreglo '${nombreArr}' en línea ${numLineaOriginal}: ${e.message}`);
            }
            if (typeof idxVal !== 'number' || (!Number.isInteger(idxVal) && Math.floor(idxVal) !== idxVal)) {
                throw new Error(`Índice para la dimensión ${k+1} del arreglo '${nombreArr}' debe ser un entero. Se obtuvo '${indiceExprs[k]}' (valor: ${idxVal}) en línea ${numLineaOriginal}.`);
            }
            idxVal = Math.trunc(idxVal);
            if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) {
                throw new Error(`Índice [${idxVal}] fuera de los límites para la dimensión ${k+1} del arreglo '${nombreArr}' (válido: 1 a ${arrMeta.dimensions[k]}) en línea ${numLineaOriginal}.`);
            }
            evalIndices.push(idxVal);
        }

        let targetLevel = arrMeta.value;
        for (let k = 0; k < evalIndices.length - 1; k++) {
            if (!targetLevel || !targetLevel[evalIndices[k]]) {
                 console.error("Error Interno: Sub-arreglo no encontrado durante asignación.", nombreArr, evalIndices, k, arrMeta);
                 throw new Error(`Error interno accediendo a sub-arreglo de '${nombreArr}' en línea ${numLineaOriginal}.`);
            }
            targetLevel = targetLevel[evalIndices[k]];
        }

        // const tipoOriginalBaseArray = arrMeta.baseType; // No necesitamos esta variable local con la nueva lógica
        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestinoParaConversion = arrMeta.baseType; // Por defecto, el tipo de destino es el tipo base actual del arreglo

        if (arrMeta.isFlexibleType === true && arrMeta.baseType === 'entero' &&
            (tipoValorEntrante === 'cadena' || tipoValorEntrante === 'caracter')) {
            // Cambio dinámico de tipo de Entero (flexible) a Cadena para el arreglo
            arrMeta.baseType = 'cadena';
            tipoDestinoParaConversion = 'cadena'; // El destino para esta asignación ahora es cadena
            arrMeta.isFlexibleType = false; // El tipo ahora está fijado a Cadena
            Webgoritmo.Interprete.convertirElementosArrayAString(arrMeta.value, arrMeta.dimensions);
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArr}' cambió su tipo base a 'Cadena' (y se volvió de tipo fijo) debido a asignación en línea ${numLineaOriginal}.`, 'normal');
        }
        // El caso 'desconocido' para arrMeta.baseType ya no debería ocurrir para Dimension, ya que por defecto es 'entero'.
        // Si se reintroduce 'desconocido' como un tipo base posible (ej. para variantes de PSeInt),
        // la lógica de inferencia necesitaría ser:
        // else if (arrMeta.baseType === 'desconocido') {
        //     if (tipoValorEntrante !== 'desconocido' && valorEvaluado !== null) {
        //         arrMeta.baseType = tipoValorEntrante;
        //         tipoDestinoParaConversion = tipoValorEntrante;
        //         arrMeta.isFlexibleType = false; // Una vez que se infiere, se fija.
        //         // Aquí no se convierte el arreglo existente porque no había un tipo base previo definido.
        //         if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Tipo base del arreglo '${nombreArr}' inferido como '${arrMeta.baseType}' en línea ${numLineaOriginal}.`, 'normal');
        //     } else if (valorEvaluado === null) { // Asignando null a un arreglo desconocido
        //         tipoDestinoParaConversion = 'real'; // O algún otro default para null si no se puede inferir
        //     }
        // }


        let valorConvertido;
        try {
            valorConvertido = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoParaConversion);
        } catch (e) {
            throw new Error(`Error de tipo al asignar al arreglo '${nombreArr}' (tipo base: ${arrMeta.baseType}, intentando convertir a: ${tipoDestinoParaConversion}) en línea ${numLineaOriginal}: ${e.message}`);
        }

        targetLevel[evalIndices[evalIndices.length - 1]] = valorConvertido;

    } else { // Asignación a variable escalar
        const nombreVar = destinoStr;
        if (!ambitoActual.hasOwnProperty(nombreVar)) {
            throw new Error(`Variable '${nombreVar}' no ha sido definida (en línea ${numLineaOriginal}).`);
        }
        const varMeta = ambitoActual[nombreVar];
        if (varMeta.type === 'array') {
            throw new Error(`No se puede asignar un valor a un arreglo completo ('${nombreVar}') sin especificar índices (en línea ${numLineaOriginal}). Asigne a cada elemento individualmente.`);
        }
        try {
            varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, varMeta.type);
        } catch(e) {
            throw new Error(`Error de tipo al asignar a la variable '${nombreVar}' (tipo: ${varMeta.type}) en línea ${numLineaOriginal}: ${e.message}`);
        }
    }
    return true;
};

Webgoritmo.Interprete.handleEscribir = function(linea, ambitoActual, numLineaOriginal) {
    const regexEscribir = /^(Escribir|Imprimir|Mostrar)\s+(.*)/i;
    const coincidenciaEscribir = linea.match(regexEscribir);

    console.log(`HANDLEESCRIBIR DEBUG: Recibida línea: "${linea}". Coincidencia con regexEscribir: `, coincidenciaEscribir);

    if (coincidenciaEscribir) {
        const cadenaArgs = coincidenciaEscribir[2];
        console.log(`HANDLEESCRIBIR DEBUG: cadenaArgs extraída: "${cadenaArgs}"`);

        // Intento de split más robusto para argumentos de Escribir, considerando comas dentro de strings
        const args = [];
        let buffer = "";
        let dentroDeComillasDobles = false;
        let dentroDeComillasSimples = false;

        for (let i = 0; i < cadenaArgs.length; i++) {
            const char = cadenaArgs[i];
            if (char === '"' && (i === 0 || cadenaArgs[i-1] !== '\\')) {
                dentroDeComillasDobles = !dentroDeComillasDobles;
            } else if (char === "'" && (i === 0 || cadenaArgs[i-1] !== '\\')) {
                dentroDeComillasSimples = !dentroDeComillasSimples;
            }

            if (char === ',' && !dentroDeComillasDobles && !dentroDeComillasSimples) {
                args.push(buffer.trim());
                buffer = "";
            } else {
                buffer += char;
            }
        }
        args.push(buffer.trim()); // Añadir el último argumento
        console.log(`HANDLEESCRIBIR DEBUG: Args parseados: `, args);


        let partesMensajeSalida = [];
        for (const arg of args) {
            const parteEvaluada = Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
            if (typeof parteEvaluada === 'boolean') partesMensajeSalida.push(parteEvaluada ? 'Verdadero' : 'Falso');
            else if (parteEvaluada === null) partesMensajeSalida.push('nulo');
            else partesMensajeSalida.push(String(parteEvaluada));
        }
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal');
        return true;
    }
    return false;
};
Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloque, indiceEnBloque) { /* ... (código como se definió en el paso anterior) ... */
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete || !Webgoritmo.UI) {
        throw new Error("Error interno: Módulos no disponibles para 'Si'.");
    }
    const siMatch = lineaActual.match(/^Si\s+(.+?)\s+Entonces$/i);
    if (!siMatch) throw new Error(`Sintaxis 'Si' incorrecta en línea ${numLineaOriginalSi}.`);
    const condicionPrincipalStr = siMatch[1];
    let condicionPrincipalVal;
    try {
        condicionPrincipalVal = Webgoritmo.Expresiones.evaluarExpresion(condicionPrincipalStr, ambitoActual);
    } catch (e) { throw new Error(`Evaluando condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi}: ${e.message}`); }
    if (typeof condicionPrincipalVal !== 'boolean') {
        throw new Error(`Condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi} debe ser lógica, se obtuvo: ${condicionPrincipalVal}.`);
    }
    let bloqueEntonces = [], bloquesSinoSi = [], bloqueSino = { cuerpo: [], lineaOriginal: -1 }; // Modificado para incluir lineaOriginal
    let bufferBloqueActual = bloqueEntonces, siAnidados = 0, i = indiceEnBloque + 1;
    // El cálculo de numLineaOriginalOffset aquí es para saber el número de línea *global* de las líneas que se están parseando.
    // Este offset general NO se usa directamente para llamar a ejecutarBloque para los sub-bloques Si/SinoSi/Sino.
    // Es más para la detección de errores durante el parseo del bloque Si.
    let numLineaGlobalActualBase = numLineaOriginalSi - (indiceEnBloque + 1);


    while (i < lineasBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return i; // Si se detiene la ejecución, salir.
        const lineaIter = lineasBloque[i].trim(), lineaIterLower = lineaIter.toLowerCase();
        const numLineaGlobalIter = numLineaGlobalActualBase + i + 1;

        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) {
            siAnidados++;
            // Si bufferBloqueActual es null (inicio del Si o después de un SinoSi/Sino sin cuerpo aún)
            // esto es un error o un Si anidado que debería estar en el buffer de su padre.
            // Sin embargo, bufferBloqueActual es inicializado a bloqueEntonces.
            bufferBloqueActual.push(lineasBloque[i]);
        } else if (lineaIterLower === "finsi") {
            if (siAnidados > 0) {
                siAnidados--;
                bufferBloqueActual.push(lineasBloque[i]);
            } else {
                i++; // Avanzar más allá del FinSi para el valor de retorno
                break; // Fin del bloque Si-Sino-Si actual
            }
        } else if (siAnidados === 0) { // Solo procesar Sino si no estamos dentro de un Si anidado
            // Ya no se busca "SinoSi" como una sola palabra/construcción especial.
            // Un "Sino" seguido de un "Si" será un bloque Sino que contiene un Si anidado.
            if (lineaIterLower === "sino") {
                // Verificar que no estemos ya en un bloque Sino o SinoSi
                if (bufferBloqueActual === bloqueSino.cuerpo) {
                    throw new Error(`Múltiples 'Sino' consecutivos o mal ubicados cerca de la línea ${numLineaGlobalIter}.`);
                }
                // Si antes estábamos en bloqueEntonces o un bloqueSinoSi, ahora cambiamos a bloqueSino.
                // No hay más bloquesSinoSi explícitos, así que bloqueSino es el único colector para "else".
                bloqueSino.lineaOriginal = numLineaGlobalIter;
                bufferBloqueActual = bloqueSino.cuerpo;
            } else {
                // Cualquier otra línea que no sea un Si anidado, FinSi, o Sino, se añade al buffer actual
                // (que podría ser bloqueEntonces o bloqueSino.cuerpo).
                bufferBloqueActual.push(lineasBloque[i]);
            }
        } else { // Estamos dentro de un Si anidado (siAnidados > 0)
            bufferBloqueActual.push(lineasBloque[i]);
        }
        i++;
    }

    if (i >= lineasBloque.length && siAnidados >=0 ) {
         // Si se acabó el bloque de líneas y el 'Si' no se cerró correctamente con 'FinSi' (y no fue la última línea)
         if (!(siAnidados === 0 && lineasBloque[i-1] && lineasBloque[i-1].trim().toLowerCase() === "finsi")) {
            throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numLineaOriginalSi}.`);
         }
    }

    // --- LÓGICA DE EJECUCIÓN ---
    if (condicionPrincipalVal) {
        // El offset para ejecutarBloque es numLineaOriginalSi (línea del 'Si ... Entonces')
        await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, numLineaOriginalSi);
    } else {
        let sinoSiEjecutado = false;
        for (const bloqueSCS of bloquesSinoSi) {
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
            let condicionSinoSiVal;
            try {
                condicionSinoSiVal = Webgoritmo.Expresiones.evaluarExpresion(bloqueSCS.condicionStr, ambitoActual);
            } catch (e) {
                throw new Error(`Evaluando condición 'SinoSi' ("${bloqueSCS.condicionStr}") en línea ${bloqueSCS.lineaOriginal}: ${e.message}`);
            }
            if (typeof condicionSinoSiVal !== 'boolean') {
                throw new Error(`Condición 'SinoSi' ("${bloqueSCS.condicionStr}") en línea ${bloqueSCS.lineaOriginal} debe ser lógica, se obtuvo: ${condicionSinoSiVal}.`);
            }

            if (condicionSinoSiVal) {
                // El offset es bloqueSCS.lineaOriginal (línea del 'SinoSi ... Entonces')
                await Webgoritmo.Interprete.ejecutarBloque(bloqueSCS.cuerpo, ambitoActual, bloqueSCS.lineaOriginal);
                sinoSiEjecutado = true;
                break;
            }
        }

        if (!sinoSiEjecutado && bloqueSino.cuerpo.length > 0 && !Webgoritmo.estadoApp.detenerEjecucion) {
            // El offset es bloqueSino.lineaOriginal (línea del 'Sino')
            // Si lineaOriginal es -1, significa que no hubo un 'Sino' explícito,
            // lo cual es un caso que no debería llevar a ejecutar este bloque si cuerpo.length > 0.
            // Pero por seguridad, verificamos.
            if (bloqueSino.lineaOriginal === -1 && bloqueSino.cuerpo.length > 0) {
                 console.warn(`WARN: Bloque Sino tiene cuerpo pero no línea original registrada. Usando numLineaOriginalSi como fallback para offset. Esto es inesperado.`);
                 // Esto indicaría un error en la lógica de recolección si el cuerpo del Sino tiene contenido
                 // pero no se registró su línea. Por ahora, usamos un fallback, pero idealmente no debería ocurrir.
                 // El offset correcto para un bloque 'Sino' sería la línea donde apareció la palabra 'Sino'.
                 // Si no hay 'Sino' explícito, no debería haber 'bloqueSino.cuerpo'.
                 // Si 'Sino' no fue encontrado, pero hay líneas después de los SinoSi y antes del FinSi,
                 // esas líneas actualmente se añadirían al último bloqueSinoSi o al bloqueSino si fue el último.
                 // Esto necesita ser preciso.
                 // La lógica de recolección actual debería asegurar que bloqueSino.cuerpo solo tiene contenido
                 // si se encontró un "sino".
            }
            // La lineaOriginal del bloqueSino ya está ajustada al inicio del bloque Sino.
             await Webgoritmo.Interprete.ejecutarBloque(bloqueSino.cuerpo, ambitoActual, bloqueSino.lineaOriginal > 0 ? bloqueSino.lineaOriginal : numLineaOriginalSi + bloqueEntonces.length + bloquesSinoSi.reduce((acc, b) => acc + b.cuerpo.length +1, 0) );
        }
    }
    // Retornar el índice de la línea *después* del 'FinSi' en el contexto del bloque de líneas original.
    // 'i' se incrementó una última vez para salir del while (o apunta justo después del 'FinSi').
    // Entonces, i-1 es el índice del 'FinSi' o la última línea procesada si el FinSi no se encontró correctamente.
    // Dado que 'ejecutarBloque' incrementa su propio índice *después* de procesar la línea actual (que podría ser un 'Si'),
    // el valor devuelto por handleSi debe ser el índice de la última línea que consumió (el 'FinSi').
    // El bucle en ejecutarBloque luego incrementará este índice para pasar a la siguiente línea.
    return i - 1;
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) { /* ... (código como se definió en el Paso 1 de esta Fase) ... */
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.DOM) throw new Error("Error interno: Módulos no disponibles para 'Leer'.");
    const coincidenciaLeer = linea.match(/^Leer\s+(.+)/i);
    if (!coincidenciaLeer) throw new Error("Sintaxis 'Leer' incorrecta en línea " + numLineaOriginal);
    const nombresVariablesArray = coincidenciaLeer[1].split(',').map(v => v.trim());
    if (nombresVariablesArray.length === 0 || nombresVariablesArray.some(v => v === "")) throw new Error("Instrucción 'Leer' debe especificar variable(s) válidas en línea " + numLineaOriginal);
    for (const nombreVar of nombresVariablesArray) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nombreVar)) throw new Error(`Nombre de variable inválido '${nombreVar}' en 'Leer' en línea ${numLineaOriginal}.`);
        if (!ambitoActual.hasOwnProperty(nombreVar)) throw new Error(`Variable '${nombreVar}' no definida antes de 'Leer' en línea ${numLineaOriginal}.`);
        if (ambitoActual[nombreVar].type === 'array') throw new Error(`Lectura en arreglos completos no soportada en MVP ('Leer ${nombreVar}'). Línea ${numLineaOriginal}.`);
    }
    let promptMensaje = nombresVariablesArray.length === 1 ? `Ingrese valor para ${nombresVariablesArray[0]}:` : `Ingrese ${nombresVariablesArray.length} valores (separados por espacio/coma) para ${nombresVariablesArray.join(', ')}:`;

    // Llamar a la función global expuesta por app.js para mostrar el input
    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') {
        window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMensaje);
    } else {
        console.error("motorInterprete.js: La función global solicitarEntradaUsuario no está disponible.");
        // Fallback: intentar al menos mostrar el prompt en la consola de salida si la UI principal falla
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(promptMensaje, 'input-prompt');
            Webgoritmo.UI.añadirSalida("[Error Interno: No se pudo preparar el área de input. La ejecución podría no continuar correctamente después de este Leer.]", 'error');
        }
        // Considerar lanzar un error aquí o detener la ejecución si la UI de input es crítica y no se puede mostrar
        // throw new Error("No se pudo inicializar la UI para la entrada del usuario.");
    }

    Webgoritmo.estadoApp.esperandoEntrada = true; Webgoritmo.estadoApp.variableEntradaActual = nombresVariablesArray;
    console.log(`handleLeer: Esperando entrada para: ${nombresVariablesArray.join(', ')}`);
    await new Promise(resolve => {
        Webgoritmo.estadoApp.resolverPromesaEntrada = resolve;
        if (Webgoritmo.estadoApp.detenerEjecucion) resolve();
    });
    console.log("handleLeer: Promesa de entrada resuelta.");
    if (Webgoritmo.estadoApp.detenerEjecucion) return true;
    return true;
};

// --- MOTOR DE EJECUCIÓN (ACTUALIZADO PARA SI Y LEER) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) {
        console.error("ejecutarBloque: Módulos Webgoritmo esenciales no definidos."); return;
    }
    let i = 0; // Declarar i fuera para que sea accesible después del bucle si es necesario (ej. handleMientras)
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("Ejecución detenida en ejecutarBloque."); break; }
        const lineaOriginal = lineasBloqueParam[i];
        let lineaTrimmed = lineaOriginal.trim(); // Use 'let' as it will be modified
        const numLineaGlobal = numLineaOriginalOffset + i + 1;

        // 1. Strip trailing '//' comments
        const commentIndex = lineaTrimmed.indexOf('//');
        if (commentIndex !== -1) {
            lineaTrimmed = lineaTrimmed.substring(0, commentIndex).trim();
        }

        // 2. Handle full-line single-line block comments /* ... */ (simple case)
        // Note: This does NOT handle multi-line block comments.
        if (lineaTrimmed.startsWith('/*') && lineaTrimmed.endsWith('*/')) {
            lineaTrimmed = ''; // Treat as empty line
        }

        console.log(`MOTOR DEBUG: Procesando línea ${numLineaGlobal} (post-comment strip): "${lineaTrimmed}"`);

        // If line becomes empty after stripping comments, or was only a full-line '//' comment initially
        if (lineaTrimmed === '') {
            i++;
            continue;
        }
        // The original check `lineaTrimmed.startsWith('//')` is now covered by the above logic making lineaTrimmed empty.

        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();
            console.log(`MOTOR DEBUG: lineaLower para match: "${lineaLower}"`);

            // Intentar un match más específico y loguearlo directamente
            const matchEscribirDirecto = lineaLower.match(/^escribir\s+.+/);
            // const matchEscribirAlternativo = lineaLower.match(/^(escribir|imprimir|mostrar)\s/); // Mantenemos el original para comparar si es necesario
            console.log(`MOTOR DEBUG: Match directo con /^escribir\\s+.+/: `, matchEscribirDirecto);
            // console.log(`MOTOR DEBUG: Match alternativo con /^(escribir|imprimir|mostrar)\\s/: `, matchEscribirAlternativo);

            // Prioritized order of instruction handling:
            // 1. Declarations
            // 2. Control structures
            // 3. I/O
            // 4. Assignment (should be checked after specific keywords that might contain assignment-like symbols)

            if (lineaLower.startsWith('definir ')) {
                instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('dimension ') || lineaLower.startsWith('dimensionar ')) {
                instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('si ') && lineaLower.includes(' entonces')) {
                const nuevoIndiceRelativoAlBloque = await Webgoritmo.Interprete.handleSi(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque; // handleSi returns the index of FinSi
                instruccionManejada = true;
            } else if (lineaLower.startsWith('mientras ') && lineaLower.includes(' hacer')) {
                // Assuming handleMientras is updated to not need 'ejecutarSiguienteIteracion' for Leer
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleMientras(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque; // handleMientras returns the index of FinMientras
                instruccionManejada = true;
            } else if (lineaLower.startsWith('para ') && lineaLower.includes(' hacer')) {
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handlePara(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque; // handlePara returns the index of FinPara
                instruccionManejada = true;
            } else if (lineaLower.startsWith('repetir')) {
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleRepetir(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque; // handleRepetir returns the index of HastaQue
                instruccionManejada = true;
            } else if (lineaLower.startsWith('segun ') && lineaLower.includes(' hacer')) {
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleSegun(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque; // handleSegun returns the index of FinSegun
                instruccionManejada = true;
            } else if (lineaLower.startsWith('leer ')) {
                instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (matchEscribirDirecto) { // Escribir, Imprimir, Mostrar
                console.log("MOTOR DEBUG: DETECTADO 'escribir' por match directo.");
                instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaTrimmed.includes('<-') || (lineaTrimmed.includes('=') && !lineaTrimmed.match(/^(?:si|mientras|para|segun|caso|opcion)\s+/i) && !lineaTrimmed.match(/(?:<|>|!)=|=</i) && !lineaTrimmed.match(/=\s*>/)) ) {
                // Check for '=' as assignment only if it's not part of comparison operators or keywords that use '='.
                // This is a simplified check; a more robust parser would tokenize first.
                // The check for keywords helps avoid treating 'Si a=b Entonces' as an assignment.
                // The check for comparison operators avoids 'a == b', 'a <= b', 'a >= b'.
                instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else {
                // Intento de detectar llamada a SubProceso (procedimiento) como última opción
                const procCallMatch = lineaTrimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*$/);
                if (procCallMatch) {
                    const procName = procCallMatch[1];
                    const argsStr = procCallMatch[2];

                    if (Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(procName)) {
                        const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[procName];

                        let argExprsProc = [];
                        if (argsStr.trim() !== '') {
                            // TODO: Robust argument parsing for commas within strings/calls
                            argExprsProc = argsStr.split(',').map(a => a.trim());
                        }

                        console.log(`[ejecutarBloque] Detectada llamada a SubProceso: ${procName}`);
                        await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(
                            procName,
                            argExprsProc,
                            ambitoActual,
                            numLineaGlobal
                        );
                        // Si es una función llamada como procedimiento, su valor de retorno se ignora aquí.
                        instruccionManejada = true;
                    }
                }
            }


            if (!instruccionManejada && lineaTrimmed &&
                !lineaLower.startsWith("finsi") &&
                !lineaLower.startsWith("sino") &&
                !lineaLower.startsWith("sinosi") &&
                !lineaLower.startsWith("finmientras") &&
                !lineaLower.startsWith("finpara")) {
                 // Las palabras clave de cierre de bloque son manejadas por sus respectivos handlers (Si, Mientras, Para)
                 // y no deben ser tratadas como instrucciones no reconocidas aquí.
                throw new Error(`Instrucción no reconocida o mal ubicada: '${lineaTrimmed}'`);
            }
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }

        i++; // Incrementar i para la siguiente línea del bloque

        if (Webgoritmo.estadoApp.esperandoEntrada && !Webgoritmo.estadoApp.detenerEjecucion) {
            console.log("ejecutarBloque: Pausando por 'Leer'.");
            // No rompemos el bucle 'while' aquí directamente.
            // Si 'Leer' está dentro de 'Mientras', 'handleMientras' devolverá 'ejecutarSiguienteIteracion = true'
            // y el 'continue' de arriba se activará.
            // Si 'Leer' está fuera de 'Mientras', la ejecución se pausará y se reanudará desde este punto.
            // La promesa en handleLeer detendrá el flujo hasta que se resuelva.
            await Webgoritmo.estadoApp.promesaEntradaPendiente; // Espera aquí si la promesa se creó
            Webgoritmo.estadoApp.promesaEntradaPendiente = null; // Limpia la promesa
            if(Webgoritmo.estadoApp.detenerEjecucion) break; // Si la entrada causó una detención
        }
    }
};

Webgoritmo.Interprete.handleMientras = async function(lineaActual, ambitoActual, numLineaOriginalMientras, lineasBloqueCompleto, indiceMientrasEnBloque) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        throw new Error("Error interno: Módulos no disponibles para 'Mientras'.");
    }

    const mientrasMatch = lineaActual.match(/^Mientras\s+(.+?)\s+Hacer$/i);
    if (!mientrasMatch) throw new Error(`Sintaxis 'Mientras' incorrecta en línea ${numLineaOriginalMientras}.`);

    const condicionStr = mientrasMatch[1];
    let cuerpoMientras = [];
    let finMientrasEncontrado = false;
    let anidamientoMientras = 0;
    let i = indiceMientrasEnBloque + 1;

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIter = lineasBloqueCompleto[i].trim().toLowerCase();
        if (lineaIter.startsWith("mientras ") && lineaIter.includes(" hacer")) {
            anidamientoMientras++;
            cuerpoMientras.push(lineasBloqueCompleto[i]);
        } else if (lineaIter === "finmientras") {
            if (anidamientoMientras === 0) {
                finMientrasEncontrado = true;
                break;
            } else {
                anidamientoMientras--;
                cuerpoMientras.push(lineasBloqueCompleto[i]);
            }
        } else {
            cuerpoMientras.push(lineasBloqueCompleto[i]);
        }
    }

    if (!finMientrasEncontrado) {
        throw new Error(`Se esperaba 'FinMientras' para cerrar el bucle 'Mientras' iniciado en la línea ${numLineaOriginalMientras}.`);
    }

    const indiceDespuesFinMientras = i + 1;
    let ejecutarSiguienteIteracionDelBloquePrincipal = false;

    // Bucle de ejecución del Mientras
    let primeraIteracion = true;
    let condicionVal;
    try {
        condicionVal = Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
    } catch (e) {
        throw new Error(`Evaluando condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras}: ${e.message}`);
    }
    if (typeof condicionVal !== 'boolean') {
        throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica, se obtuvo: ${condicionVal}.`);
    }

    while (condicionVal && !Webgoritmo.estadoApp.detenerEjecucion) {
        // El offset para las líneas dentro del Mientras es relativo al inicio del bloque completo + offset del Mientras + 1
        const offsetLineasCuerpo = numLineaOriginalMientras - indiceMientrasEnBloque -1 + indiceMientrasEnBloque +1;
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoMientras, ambitoActual, offsetLineasCuerpo);

        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        if (Webgoritmo.estadoApp.esperandoEntrada) {
            console.log("handleMientras: Pausando debido a 'Leer' dentro del bucle.");
            // Guardamos el estado para reanudar el bucle Mientras después de la entrada.
            Webgoritmo.estadoApp.estadoBuclePendiente = {
                tipo: 'Mientras',
                lineaOriginalMientras,
                condicionStr,
                cuerpoMientras,
                ambitoActual,
                indiceDespuesFinMientras,
                offsetLineasCuerpo
            };
            ejecutarSiguienteIteracionDelBloquePrincipal = true;
            return { nuevoIndiceRelativoAlBloque: indiceMientrasEnBloque, ejecutarSiguienteIteracion: true };
        }

        // Re-evaluar condición
        try {
            condicionVal = Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
        } catch (e) {
            throw new Error(`Re-evaluando condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras}: ${e.message}`);
        }
        if (typeof condicionVal !== 'boolean') {
            throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica, se obtuvo: ${condicionVal}.`);
        }
    }

    return { nuevoIndiceRelativoAlBloque: indiceDespuesFinMientras -1 , ejecutarSiguienteIteracion: ejecutarSiguienteIteracionDelBloquePrincipal };
};

Webgoritmo.Interprete.handleRepetir = async function(lineaActual, ambitoActual, numLineaOriginalRepetir, lineasBloqueCompleto, indiceRepetirEnBloque) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        throw new Error("Error interno: Módulos no disponibles para 'Repetir'.");
    }

    // lineaActual es "Repetir". El cuerpo comienza en la siguiente línea.
    let cuerpoRepetir = [];
    let condicionHastaQueStr = null;
    let numLineaOriginalHastaQue = -1;
    let finBloqueEncontrado = false;
    let anidamientoRepetir = 0; // Para manejar 'Repetir' anidados correctamente
    let i = indiceRepetirEnBloque + 1;

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIter = lineasBloqueCompleto[i]; // Mantener espacios iniciales para reconstruir si es necesario
        const lineaIterTrimmedLower = lineaIter.trim().toLowerCase();

        if (lineaIterTrimmedLower.startsWith("repetir")) {
            anidamientoRepetir++;
            cuerpoRepetir.push(lineaIter);
        } else {
            const hastaQueMatch = lineaIter.trim().match(/^Hasta Que\s+(.+)/i);
            if (hastaQueMatch) {
                if (anidamientoRepetir === 0) {
                    condicionHastaQueStr = hastaQueMatch[1].trim();
                    // Calcular numLineaOriginalHastaQue:
                    // numLineaOriginalRepetir es la línea del 'Repetir'.
                    // indiceRepetirEnBloque es el índice de 'Repetir' en lineasBloqueCompleto.
                    // i es el índice actual de 'Hasta Que' en lineasBloqueCompleto.
                    // La diferencia de índices (i - indiceRepetirEnBloque) es el número de líneas *entre* Repetir y Hasta Que, MÁS UNO.
                    // O más simple: numLineaOriginalRepetir + (i - indiceRepetirEnBloque).
                    numLineaOriginalHastaQue = numLineaOriginalRepetir + (i - indiceRepetirEnBloque);
                    finBloqueEncontrado = true;
                    break;
                } else {
                    anidamientoRepetir--;
                    cuerpoRepetir.push(lineaIter);
                }
            } else {
                cuerpoRepetir.push(lineaIter);
            }
        }
    }

    if (!finBloqueEncontrado) {
        throw new Error(`Se esperaba 'Hasta Que <condicion>' para cerrar el bucle 'Repetir' iniciado en la línea ${numLineaOriginalRepetir}.`);
    }
    if (!condicionHastaQueStr) {
        throw new Error(`La cláusula 'Hasta Que' en la línea ${numLineaOriginalHastaQue} debe tener una condición.`);
    }

    const indiceDespuesHastaQue = i + 1; // Índice de la línea después del 'Hasta Que'

    let condicionVal;
    do {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        // El offset para las líneas dentro del Repetir es numLineaOriginalRepetir.
        // La primera línea del cuerpo (índice 0) se reportará como numLineaOriginalRepetir + 0 + 1.
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoRepetir, ambitoActual, numLineaOriginalRepetir);

        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        // Si ejecutarBloque pausó por 'Leer', esta función también habrá pausado.
        // Al reanudar, se evalúa la condición.

        try {
            condicionVal = Webgoritmo.Expresiones.evaluarExpresion(condicionHastaQueStr, ambitoActual);
        } catch (e) {
            throw new Error(`Evaluando condición 'Hasta Que' ("${condicionHastaQueStr}") en línea ${numLineaOriginalHastaQue}: ${e.message}`);
        }
        if (typeof condicionVal !== 'boolean') {
            throw new Error(`Condición 'Hasta Que' ("${condicionHastaQueStr}") en línea ${numLineaOriginalHastaQue} debe ser lógica, se obtuvo: ${condicionVal}.`);
        }

    } while (!condicionVal && !Webgoritmo.estadoApp.detenerEjecucion); // El bucle continúa si la condición es FALSA

    // Devolver el índice de la línea 'Hasta Que'.
    // El bucle en ejecutarBloque que llamó a handleRepetir incrementará este índice para pasar a la siguiente.
    return { nuevoIndiceRelativoAlBloque: i }; // 'i' es el índice de la línea 'Hasta Que'
};


Webgoritmo.Interprete.reanudarBuclePendiente = async function() {
    if (!Webgoritmo.estadoApp.estadoBuclePendiente) return;

    const estado = Webgoritmo.estadoApp.estadoBuclePendiente;
    Webgoritmo.estadoApp.estadoBuclePendiente = null; // Limpiar estado

    if (estado.tipo === 'Mientras') {
        console.log(`Reanudando bucle Mientras de línea ${estado.lineaOriginalMientras}`);
        let condicionVal;
        try {
            condicionVal = Webgoritmo.Expresiones.evaluarExpresion(estado.condicionStr, estado.ambitoActual);
        } catch (e) {
            throw new Error(`Re-evaluando condición 'Mientras' ("${estado.condicionStr}") al reanudar: ${e.message}`);
        }

        while (condicionVal && !Webgoritmo.estadoApp.detenerEjecucion) {
            await Webgoritmo.Interprete.ejecutarBloque(estado.cuerpoMientras, estado.ambitoActual, estado.offsetLineasCuerpo);
            if (Webgoritmo.estadoApp.detenerEjecucion) break;

            if (Webgoritmo.estadoApp.esperandoEntrada) {
                console.log("handleMientras (reanudar): Pausando de nuevo por 'Leer'.");
                Webgoritmo.estadoApp.estadoBuclePendiente = estado; // Guardar de nuevo para la próxima reanudación
                return; // Salir, la ejecución principal se detendrá
            }

            try {
                condicionVal = Webgoritmo.Expresiones.evaluarExpresion(estado.condicionStr, estado.ambitoActual);
            } catch (e) {
                 throw new Error(`Re-evaluando condición 'Mientras' ("${estado.condicionStr}") al reanudar: ${e.message}`);
            }
        }
        // Si el bucle terminó o se detuvo, necesitamos continuar la ejecución *después* del FinMientras.
        // Esto es un poco más complejo porque ejecutarBloque ya avanzó.
        // La forma en que está estructurado ahora, la reanudación ocurre *antes* de que ejecutarBloque avance su 'i'.
        // Así que al terminar aquí, ejecutarBloque continuará desde donde se pausó, que es la instrucción Leer.
        // Necesitamos que salte al final del Mientras.
        // Esto sugiere que la reanudación debe ser manejada más centralmente en app.js o que ejecutarBloque
        // necesita saber si una reanudación de bucle acaba de ocurrir.

        // Por ahora, la lógica en app.js que llama a reanudarBuclePendiente y luego
        // potencialmente reanuda ejecutarBloque (si no hay más bucles pendientes)
        // debería funcionar, ya que ejecutarBloque continuará.
        // El problema es que el índice `i` de `ejecutarBloque` no se actualiza al `indiceDespuesFinMientras`.
        // Esto necesita una revisión más profunda de cómo se maneja el flujo de control post-reanudación.

        // Solución temporal: si el bucle termina, la ejecución continuará después de la línea 'Leer'.
        // Si la línea 'Leer' era la última del bloque 'Mientras', entonces 'ejecutarBloque'
        // pasará a la siguiente línea *después* del 'FinMientras' si `handleMientras` devolvió
        // el índice correcto la primera vez.
    } else if (estado.tipo === 'Para') {
        console.log(`Reanudando bucle Para de línea ${estado.lineaOriginalPara}`);
        let variableControl = estado.ambitoActual[estado.variableControlNombre];

        // El valor de variableControl.value ya fue actualizado por Leer y la asignación.
        // Ahora solo necesitamos continuar el bucle desde donde se quedó.
        // El incremento/decremento y la re-evaluación de la condición ocurrirán al final de esta iteración reanudada.

        while ((estado.paso > 0 && variableControl.value <= estado.valorFinal) || (estado.paso < 0 && variableControl.value >= estado.valorFinal)) {
            if (Webgoritmo.estadoApp.detenerEjecucion) break;

            // Ejecutar el cuerpo. Si esta es la iteración que fue interrumpida, solo ejecutamos desde la línea siguiente al Leer.
            // Esto es complejo. Para simplificar, re-ejecutamos el cuerpo. Si el Leer está al principio, no hay problema.
            // Si está en medio, las líneas anteriores a Leer en esa iteración se re-ejecutarán.
            // Una solución más precisa requeriría guardar el punto exacto de interrupción dentro del cuerpo.
            await Webgoritmo.Interprete.ejecutarBloque(estado.cuerpoPara, estado.ambitoActual, estado.offsetLineasCuerpo);

            if (Webgoritmo.estadoApp.detenerEjecucion) break;

            if (Webgoritmo.estadoApp.esperandoEntrada) {
                console.log("handlePara (reanudar): Pausando de nuevo por 'Leer'.");
                // Necesitamos actualizar el valor de la variable de control en el estado guardado
                // por si el Leer cambió otra variable que afecta a la variable de control indirectamente (poco probable pero posible)
                // O si el Leer era sobre la propia variable de control (más probable).
                estado.ambitoActual[estado.variableControlNombre].value = variableControl.value;
                Webgoritmo.estadoApp.estadoBuclePendiente = estado;
                return;
            }

            variableControl.value += estado.paso;

            // Re-evaluar condición (implícita en el while)
        }
    }
};


Webgoritmo.Interprete.handlePara = async function(lineaActual, ambitoActual, numLineaOriginalPara, lineasBloqueCompleto, indiceParaEnBloque) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        throw new Error("Error interno: Módulos no disponibles para 'Para'.");
    }

    const paraMatch = lineaActual.match(/^Para\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*<-\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i);
    if (!paraMatch) throw new Error(`Sintaxis 'Para' incorrecta en línea ${numLineaOriginalPara}.`);

    const variableControlNombre = paraMatch[1];
    const valorInicialExpr = paraMatch[2];
    const valorFinalExpr = paraMatch[3];
    const valorPasoExpr = paraMatch[4]; // Puede ser undefined

    let valorInicial, valorFinal, paso;
    try {
        valorInicial = Webgoritmo.Expresiones.evaluarExpresion(valorInicialExpr, ambitoActual);
        valorFinal = Webgoritmo.Expresiones.evaluarExpresion(valorFinalExpr, ambitoActual);
        paso = valorPasoExpr ? Webgoritmo.Expresiones.evaluarExpresion(valorPasoExpr, ambitoActual) : (valorFinal >= valorInicial ? 1 : -1);
    } catch (e) {
        throw new Error(`Error evaluando límites/paso del bucle 'Para' en línea ${numLineaOriginalPara}: ${e.message}`);
    }

    if (typeof valorInicial !== 'number' || typeof valorFinal !== 'number' || typeof paso !== 'number') {
        throw new Error(`Los límites y el paso del bucle 'Para' deben ser numéricos (en línea ${numLineaOriginalPara}).`);
    }
    if (paso === 0) {
        throw new Error(`El paso del bucle 'Para' no puede ser cero (en línea ${numLineaOriginalPara}).`);
    }

    // Definir o actualizar la variable de control en el ámbito actual
    if (!ambitoActual.hasOwnProperty(variableControlNombre)) {
        // PSeInt permite definición implícita. Asumimos Entero si todos son enteros, sino Real.
        const tipoImplicito = (Number.isInteger(valorInicial) && Number.isInteger(valorFinal) && Number.isInteger(paso)) ? 'Entero' : 'Real';
        ambitoActual[variableControlNombre] = { value: valorInicial, type: tipoImplicito };
         if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO en línea ${numLineaOriginalPara}]: Variable de control '${variableControlNombre}' definida implícitamente como ${tipoImplicito}.`, 'normal');
    } else {
        // Si ya existe, solo actualizamos su valor. PSeInt es flexible con el tipo aquí.
        ambitoActual[variableControlNombre].value = valorInicial;
    }
    let variableControl = ambitoActual[variableControlNombre]; // Referencia al objeto de la variable

    let cuerpoPara = [];
    let finParaEncontrado = false;
    let anidamientoPara = 0;
    let i = indiceParaEnBloque + 1;

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIter = lineasBloqueCompleto[i].trim().toLowerCase();
        if (lineaIter.startsWith("para ") && lineaIter.includes(" hacer")) {
            anidamientoPara++;
            cuerpoPara.push(lineasBloqueCompleto[i]);
        } else if (lineaIter === "finpara") {
            if (anidamientoPara === 0) {
                finParaEncontrado = true;
                break;
            } else {
                anidamientoPara--;
                cuerpoPara.push(lineasBloqueCompleto[i]);
            }
        } else {
            cuerpoPara.push(lineasBloqueCompleto[i]);
        }
    }

    if (!finParaEncontrado) {
        throw new Error(`Se esperaba 'FinPara' para cerrar el bucle 'Para' iniciado en la línea ${numLineaOriginalPara}.`);
    }

    const indiceDespuesFinPara = i + 1; // Index in lineasBloqueCompleto right after FinPara

    // Asignación inicial del valor de la variable de control ya está hecha
    // cuando se define o actualiza variableControl antes de este punto.

    while ((paso > 0 && variableControl.value <= valorFinal) || (paso < 0 && variableControl.value >= valorFinal)) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        // El offset para las líneas dentro del Para es numLineaOriginalPara.
        // Así, la primera línea del cuerpo (índice 0) se reportará como numLineaOriginalPara + 0 + 1.
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoPara, ambitoActual, numLineaOriginalPara);

        if (Webgoritmo.estadoApp.detenerEjecucion) break; // Salir del bucle si se solicitó detener.

        // Si ejecutarBloque pausó por un 'Leer', la ejecución de esta función 'handlePara'
        // también habrá pausado en el 'await' anterior. Cuando se reanude,
        // la variable de control se incrementará y el bucle continuará si es necesario.
        // No se necesita una lógica especial de 'estadoBuclePendiente' aquí dentro.

        variableControl.value += paso;
    }

    // Devolver el índice de la línea FinPara en el contexto de lineasBloqueCompleto.
    // El bucle en ejecutarBloque que llamó a handlePara incrementará este índice.
    return { nuevoIndiceRelativoAlBloque: indiceDespuesFinPara - 1 };
};

Webgoritmo.Interprete.handleSegun = async function(lineaActual, ambitoActual, numLineaOriginalSegun, lineasBloqueCompleto, indiceSegunEnBloque) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        throw new Error("Error interno: Módulos no disponibles para 'Segun'.");
    }

    const segunMatch = lineaActual.match(/^Segun\s+(.+?)\s+Hacer$/i);
    if (!segunMatch) {
        throw new Error(`Sintaxis 'Segun' incorrecta en línea ${numLineaOriginalSegun}. Se esperaba 'Segun <expresion> Hacer'.`);
    }
    const expresionAEvaluarStr = segunMatch[1].trim();
    let valorSegun;
    try {
        valorSegun = Webgoritmo.Expresiones.evaluarExpresion(expresionAEvaluarStr, ambitoActual);
    } catch (e) {
        throw new Error(`Error evaluando expresión de 'Segun' ("${expresionAEvaluarStr}") en línea ${numLineaOriginalSegun}: ${e.message}`);
    }

    let casos = [];
    let deOtroModo = { cuerpo: [], lineaOriginal: -1, encontrado: false };
    let bufferBloqueActual = null; // Temporalmente null, se asignará al cuerpo de un caso o deOtroModo
    let anidamientoSegun = 0;
    let i = indiceSegunEnBloque + 1;
    let numLineaGlobalActualBase = numLineaOriginalSegun - (indiceSegunEnBloque + 1);

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIter = lineasBloqueCompleto[i];
        const lineaIterTrimmed = lineaIter.trim();
        const lineaIterTrimmedLower = lineaIterTrimmed.toLowerCase();
        const numLineaGlobalIter = numLineaGlobalActualBase + i + 1;

        if (lineaIterTrimmedLower.startsWith("segun ") && lineaIterTrimmedLower.includes(" hacer")) {
            anidamientoSegun++;
            if (bufferBloqueActual) bufferBloqueActual.push(lineaIter); else throw new Error(`'Segun' anidado inesperado en línea ${numLineaGlobalIter} fuera de un bloque Caso/Opcion válido.`);
            continue;
        }
        if (lineaIterTrimmedLower === "finsegun") {
            if (anidamientoSegun === 0) {
                bufferBloqueActual = null; // Termina el bloque actual
                break; // Fin del Segun actual
            } else {
                anidamientoSegun--;
                if (bufferBloqueActual) bufferBloqueActual.push(lineaIter); else throw new Error(`'FinSegun' anidado inesperado en línea ${numLineaGlobalIter}.`);
                continue;
            }
        }

        if (anidamientoSegun > 0) { // Si estamos dentro de un Segun anidado, solo añadir al buffer actual.
            if (bufferBloqueActual) bufferBloqueActual.push(lineaIter);
            else throw new Error(`Línea ${numLineaGlobalIter} ('${lineaIterTrimmed}') encontrada dentro de un 'Segun' anidado pero fuera de un bloque 'Caso'/'Opcion'.`);
            continue;
        }

        // Parseo de Caso/Opcion y De Otro Modo
        const casoMatch = lineaIterTrimmed.match(/^(?:Caso|Opcion)\s+(.+?)\s*:/i);
        if (casoMatch) {
            bufferBloqueActual = []; // Iniciar nuevo cuerpo para este caso
            const valoresCasoStr = casoMatch[1];
            let valoresCaso = [];

            // Parsear los valores del caso (pueden ser literales numéricos, strings, o variables/constantes)
            // Esta es una forma simple de split por comas, no maneja comas dentro de strings.
            // Para un manejo robusto de comas en strings, se necesitaría un parser más avanzado.
            const partesValores = valoresCasoStr.split(',').map(v => v.trim());
            for (const parte of partesValores) {
                if (parte.match(/^".*"$/) || parte.match(/^'.*'$/)) { // String literal
                    valoresCaso.push(parte.substring(1, parte.length - 1));
                } else if (!isNaN(parseFloat(parte)) && isFinite(parte)) { // Number literal
                    valoresCaso.push(parseFloat(parte));
                } else { // Podría ser una constante o variable, evaluarla
                    try {
                        valoresCaso.push(Webgoritmo.Expresiones.evaluarExpresion(parte, ambitoActual));
                    } catch (e) {
                        throw new Error(`Error evaluando valor de Caso/Opcion '${parte}' en línea ${numLineaGlobalIter}: ${e.message}`);
                    }
                }
            }
            casos.push({ valores: valoresCaso, cuerpo: bufferBloqueActual, lineaOriginal: numLineaGlobalIter });
        } else if (lineaIterTrimmedLower === "de otro modo:") {
            if (deOtroModo.encontrado) throw new Error(`Múltiples bloques 'De Otro Modo' encontrados. El primero en línea ${deOtroModo.lineaOriginal}.`);
            deOtroModo.encontrado = true;
            deOtroModo.lineaOriginal = numLineaGlobalIter;
            bufferBloqueActual = deOtroModo.cuerpo;
        } else { // Línea dentro del cuerpo de un caso o deOtroModo
            if (bufferBloqueActual) {
                bufferBloqueActual.push(lineaIter);
            } else if (lineaIterTrimmed !== "") {
                // Ignorar líneas vacías entre casos, pero alertar por otras.
                // Opcionalmente, lanzar error si hay código entre casos no dentro de un bloque.
                console.warn(`[ADVERTENCIA en línea ${numLineaGlobalIter}]: Línea '${lineaIterTrimmed}' ignorada, no pertenece a ningún bloque Caso/Opcion o De Otro Modo.`);
            }
        }
    }

    if (i >= lineasBloqueCompleto.length && !(lineasBloqueCompleto[i-1] && lineasBloqueCompleto[i-1].trim().toLowerCase() === "finsegun") ) {
        throw new Error(`Se esperaba 'FinSegun' para cerrar el bloque 'Segun' iniciado en la línea ${numLineaOriginalSegun}.`);
    }

    // --- Lógica de Ejecución ---
    let casoEjecutado = false;
    for (const caso of casos) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        let coincidenciaEncontrada = false;
        for (const valorCaso of caso.valores) {
            // Comparación: PSeInt es generalmente flexible con tipos en Segun.
            // Ej: Segun num Hacer 1: Escribir "Uno"; "2": Escribir "Dos" (si num es 2 o "2")
            // JS '==' hace coerción de tipo, lo cual puede ser similar.
            // Si se necesita comparación estricta, habría que ser más cuidadoso.
            if (valorSegun == valorCaso) { // Usar '==' para permitir coerción (ej. 2 == "2")
                coincidenciaEncontrada = true;
                break;
            }
        }

        if (coincidenciaEncontrada) {
            await Webgoritmo.Interprete.ejecutarBloque(caso.cuerpo, ambitoActual, caso.lineaOriginal);
            casoEjecutado = true;
            break; // Salir del bucle de casos, solo se ejecuta uno
        }
    }

    if (!casoEjecutado && deOtroModo.encontrado && !Webgoritmo.estadoApp.detenerEjecucion) {
        await Webgoritmo.Interprete.ejecutarBloque(deOtroModo.cuerpo, ambitoActual, deOtroModo.lineaOriginal);
    }

    // 'i' es el índice de FinSegun (o la línea después si FinSegun fue la última)
    return { nuevoIndiceRelativoAlBloque: i };
};

Webgoritmo.Interprete.ejecutarSubProcesoLlamada = async function(nombreFuncion, listaExprArgumentos, ambitoLlamador, numLineaOriginalLlamada) {
    if (!Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(nombreFuncion)) {
        throw new Error(`Error en línea ${numLineaOriginalLlamada}: El SubProceso o Función '${nombreFuncion}' no está definido.`);
    }
    const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[nombreFuncion];

    if (listaExprArgumentos.length !== defFuncion.parametros.length) {
        throw new Error(`Error en línea ${numLineaOriginalLlamada}: Número incorrecto de argumentos para '${nombreFuncion}'. Se esperaban ${defFuncion.parametros.length}, se recibieron ${listaExprArgumentos.length}.`);
    }

    // Push to call stack
    if (!Webgoritmo.estadoApp.pilaLlamadas) Webgoritmo.estadoApp.pilaLlamadas = []; // Ensure pilaLlamadas exists
    Webgoritmo.estadoApp.pilaLlamadas.push({
        nombre: nombreFuncion,
        lineaLlamada: numLineaOriginalLlamada,
        lineaDefinicion: defFuncion.lineaOriginalDef
    });

    try {
        // 1. Evaluar todos los argumentos en el ámbito del llamador PRIMERO
        const argumentosEvaluados = [];
        for (const exprArg of listaExprArgumentos) {
            try {
                // evaluarExpresion es ahora async
                argumentosEvaluados.push(await Webgoritmo.Expresiones.evaluarExpresion(exprArg, ambitoLlamador));
            } catch (e) {
                throw new Error(`Error en línea ${numLineaOriginalLlamada} al evaluar argumento '${exprArg}' para '${nombreFuncion}': ${e.message}`);
            }
        }

        // 2. Crear nuevo ámbito local
        const ambitoLocal = Object.create(Webgoritmo.estadoApp.variables); // Hereda del global

        // 3. Pasar parámetros
    for (let k = 0; k < defFuncion.parametros.length; k++) {
        const paramDef = defFuncion.parametros[k];
        const argExprOriginal = listaExprArgumentos[k].trim(); // String original del argumento

        if (paramDef.esPorReferencia) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(argExprOriginal) || !ambitoLlamador.hasOwnProperty(argExprOriginal)) {
                 // Para pasar por referencia, el argumento DEBE ser una variable existente en el ámbito del llamador.
                 // No puede ser una expresión compleja ni un literal.
                throw new Error(`Error en línea ${numLineaOriginalLlamada}: El argumento ('${argExprOriginal}') para el parámetro por referencia '${paramDef.nombre}' de '${nombreFuncion}' debe ser una variable existente.`);
            }
            // Asignar la referencia al objeto de metadatos de la variable original
            ambitoLocal[paramDef.nombre] = ambitoLlamador[argExprOriginal];
        } else { // Por Valor
            const valorArgumento = argumentosEvaluados[k];
            let tipoParametroDestino = paramDef.tipo;
            if (paramDef.tipo === 'desconocido') {
                tipoParametroDestino = Webgoritmo.Interprete.inferirTipo(valorArgumento).toLowerCase();
                if (tipoParametroDestino === 'desconocido' && valorArgumento !== null) tipoParametroDestino = 'real'; // Fallback
                else if (valorArgumento === null) tipoParametroDestino = 'real'; // Default for null
            }

            let valorParametroFinal;
            try {
                valorParametroFinal = Webgoritmo.Interprete.convertirValorParaAsignacion(valorArgumento, tipoParametroDestino);
            } catch (e) {
                throw new Error(`Error en línea ${numLineaOriginalLlamada}: Incompatibilidad de tipo para el parámetro '${paramDef.nombre}' de '${nombreFuncion}'. Se esperaba '${tipoParametroDestino}', se recibió valor de tipo '${Webgoritmo.Interprete.inferirTipo(valorArgumento).toLowerCase()}'. Detalle: ${e.message}`);
            }

            ambitoLocal[paramDef.nombre] = {
                value: valorParametroFinal,
                type: tipoParametroDestino,
                isFlexibleType: false, // Los parámetros por valor tienen su tipo fijado para la llamada
                // Si el tipo del parámetro era 'desconocido', toma el tipo del argumento.
                // Si el tipo del parámetro estaba definido, el argumento se convierte a ese tipo.
                dimensions: ambitoLlamador[argExprOriginal] && ambitoLlamador[argExprOriginal].type === 'array' ? ambitoLlamador[argExprOriginal].dimensions : undefined, // Copiar dimensiones si se pasa un array por valor
                baseType: ambitoLlamador[argExprOriginal] && ambitoLlamador[argExprOriginal].type === 'array' ? ambitoLlamador[argExprOriginal].baseType : undefined
            };
             // Pasar arreglos por valor implica una copia profunda en PSeInt.
             // Esta implementación simple copia la referencia del valor del arreglo, lo que significa que
             // la modificación interna de elementos del arreglo pasado por valor SÍ afectaría al original.
             // Para un verdadero paso por valor de arreglos, se necesitaría una copia profunda de arrMeta.value.
             // TODO: Implementar copia profunda para arreglos pasados por valor. Por ahora, es copia superficial de la referencia al 'value'.
            if (ambitoLocal[paramDef.nombre].type === 'array' && valorArgumento) { // Si es un array y se pasó algo (no solo la definición)
                 // Esto es incorrecto para paso por valor de arreglos, es superficial.
                 // Se debe hacer una copia profunda del contenido del arreglo.
                 // ambitoLocal[paramDef.nombre].value = JSON.parse(JSON.stringify(valorArgumento)); // Ejemplo de copia profunda simple (limitada)
                 // Una copia profunda correcta respetando la estructura 1-indexada es más compleja.
                 console.warn(`ADVERTENCIA: Paso de arreglos por valor actualmente implementado como copia superficial de referencia al contenido para '${paramDef.nombre}' en '${nombreFuncion}'. Modificaciones internas a elementos del arreglo afectarán al original.`);
            }
        }
    }

    // 4. Ejecutar cuerpo del SubProceso
    await Webgoritmo.Interprete.ejecutarBloque(defFuncion.cuerpo, ambitoLocal, defFuncion.lineaOriginalDef -1); // -1 porque ejecutarBloque suma offset+i+1

    // 5. Obtener valor de retorno (si es una función)
    if (defFuncion.retornoVar) {
        if (!ambitoLocal.hasOwnProperty(defFuncion.retornoVar)) {
            throw new Error(`Error en SubProceso '${nombreFuncion}' (definido en línea ${defFuncion.lineaOriginalDef}): La variable de retorno '${defFuncion.retornoVar}' no fue asignada.`);
        }
        // Devolver el valor de la variable de retorno desde el ámbito local de la función
        return ambitoLocal[defFuncion.retornoVar].value;
    }

    return undefined; // Para procedimientos (SubProcesos sin variable de retorno)
    } finally {
        // Pop from call stack
        if (Webgoritmo.estadoApp.pilaLlamadas && Webgoritmo.estadoApp.pilaLlamadas.length > 0) {
            Webgoritmo.estadoApp.pilaLlamadas.pop();
        }
    }
};


Webgoritmo.Interprete.llamarFuncion = async function(nombreFunc, args, numLineaLlamada) { /* ... (código MVP, sin cambios en este paso) ... */ };

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { /* ... error ... */ return; }
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) { /* ... error ... */ return; }

    // restablecerEstado es llamado desde app.js
    if (Webgoritmo.UI.añadirSalida) {
        if(Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
        Webgoritmo.UI.añadirSalida("--- Iniciando ejecución ---", "normal");
    }

    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {}; // Nueva estructura para almacenar funciones
    const lineasParaBloquePrincipal = []; // Líneas que no son parte de definiciones de SubProceso

    // --- FASE 1: Pre-parseo para identificar y extraer definiciones de SubProceso ---
    let inSubProcesoDef = false;
    let currentSubProcesoDef = null;
    let subProcesoNesting = 0;

    for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[i];
        let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
        if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) {
            lineaParaAnalisis = '';
        }
        const lineaLower = lineaParaAnalisis.toLowerCase();

        if (lineaLower.startsWith("subproceso")) {
            if (subProcesoNesting === 0) { // Inicio de una nueva definición de SubProceso (nivel superior)
                if (inSubProcesoDef) { // Error: SubProceso iniciado antes de que el anterior terminara
                    Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${i + 1}: Definición de SubProceso inesperada. ¿Faltó un FinSubProceso anterior?`;
                    Webgoritmo.estadoApp.detenerEjecucion = true;
                    break;
                }
                try {
                    // Llamar a un helper para parsear la definición completa y obtener el cuerpo y el índice final
                    // Esta función parseDefinicionSubProceso se definirá más adelante
                    currentSubProcesoDef = Webgoritmo.Interprete.parseDefinicionSubProceso(lineaOriginal, i, Webgoritmo.estadoApp.lineasCodigo);
                    if (Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(currentSubProcesoDef.nombre)) {
                        throw new Error(`SubProceso '${currentSubProcesoDef.nombre}' ya está definido (definición previa en línea ${Webgoritmo.estadoApp.funcionesDefinidas[currentSubProcesoDef.nombre].lineaOriginalDef}).`);
                    }
                    Webgoritmo.estadoApp.funcionesDefinidas[currentSubProcesoDef.nombre] = currentSubProcesoDef;
                    i = currentSubProcesoDef.indiceFinEnTodasLasLineas; // Saltar al FinSubProceso
                    // No añadir estas líneas a lineasParaBloquePrincipal
                    currentSubProcesoDef = null; // Reset for next potential definition
                } catch (e) {
                    Webgoritmo.estadoApp.errorEjecucion = e.message; // Error ya incluye línea si parseDefinicionSubProceso lo hace bien
                    Webgoritmo.estadoApp.detenerEjecucion = true;
                    break;
                }
            } else { // SubProceso anidado (PSeInt no lo permite como definición válida)
                 Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${i + 1}: No se permiten definiciones de SubProceso anidadas.`;
                 Webgoritmo.estadoApp.detenerEjecucion = true;
                 break;
            }
            // No incrementar subProcesoNesting aquí, parseDefinicionSubProceso maneja su propio anidamiento interno para encontrar su FinSubProceso
        } else if (lineaLower.startsWith("finsubproceso")) {
             if(!inSubProcesoDef && subProcesoNesting === 0) { // FinSubProceso sin un SubProceso abierto
                Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${i + 1}: 'FinSubProceso' inesperado fuera de una definición de SubProceso.`;
                Webgoritmo.estadoApp.detenerEjecucion = true;
                break;
             }
             // Este FinSubProceso debería haber sido consumido por parseDefinicionSubProceso. Si llegamos aquí, algo está mal.
        } else {
            if (!inSubProcesoDef) { // Si no estamos parseando un SubProceso, la línea pertenece al principal o es Algoritmo/FinAlgoritmo
                lineasParaBloquePrincipal.push(lineaOriginal);
            }
            // Si inSubProcesoDef es true, parseDefinicionSubProceso ya se encargó de estas líneas.
        }
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
    }

    if (Webgoritmo.estadoApp.detenerEjecucion) { // Si hubo error en pre-parseo de SubProcesos
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
        return;
    }

    // --- FASE 2: Parseo del bloque principal Algoritmo/Proceso ---
    let lineasDelPrincipal = [];
    let inicioBloquePrincipalLineaNum = -1; // -1 indica no encontrado
    let processingState = 'buscar_inicio'; // 'buscar_inicio', 'en_bloque', 'bloque_terminado'
    Webgoritmo.estadoApp.errorEjecucion = null; // Limpiar errores previos de estructura
    Webgoritmo.estadoApp.detenerEjecucion = false;


    for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[i];
        let lineaParaAnalisis = lineaOriginal.split('//')[0].trim(); // Quitar comentarios //
        if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) { // Quitar comentarios /* */ en una sola linea
            lineaParaAnalisis = '';
        }
        const lineaLower = lineaParaAnalisis.toLowerCase();

        if (processingState === 'buscar_inicio') {
            if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                inicioBloquePrincipalLineaNum = i + 1;
                processingState = 'en_bloque';
                 // Extraer nombre del algoritmo/proceso si se desea (no hecho actualmente)
            } else if (lineaParaAnalisis !== "") {
                Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${i+1}: Se encontró código ('${lineaOriginal.trim()}') fuera de un bloque 'Algoritmo' o 'Proceso'. Todo código debe estar contenido en dicho bloque.`;
                Webgoritmo.estadoApp.detenerEjecucion = true;
                break;
            }
        } else if (processingState === 'en_bloque') {
            if (lineaLower.startsWith("finproceso") || lineaLower.startsWith("finalgoritmo")) {
                processingState = 'bloque_terminado';
            } else if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${i+1}: No se permiten bloques 'Algoritmo' o 'Proceso' anidados.`;
                Webgoritmo.estadoApp.detenerEjecucion = true;
                break;
            } else {
                lineasDelPrincipal.push(lineaOriginal); // Guardar la línea original para ejecutarla (con sus comentarios si los tuviera internamente)
            }
        } else if (processingState === 'bloque_terminado') {
            if (lineaParaAnalisis !== "") {
                Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${i+1}: Se encontró código ('${lineaOriginal.trim()}') después de 'FinAlgoritmo' o 'FinProceso'.`;
                Webgoritmo.estadoApp.detenerEjecucion = true;
                break;
            }
        }
    }

    if (!Webgoritmo.estadoApp.errorEjecucion) {
        const tieneCodigoEfectivo = Webgoritmo.estadoApp.lineasCodigo.some(l => {
            let temp = l.split('//')[0].trim();
            if (temp.startsWith('/*') && temp.endsWith('*/')) temp = '';
            return temp !== '';
        });

        if (processingState === 'buscar_inicio' && tieneCodigoEfectivo) {
            Webgoritmo.estadoApp.errorEjecucion = "No se encontró un bloque 'Algoritmo' o 'Proceso' principal.";
        } else if (processingState === 'en_bloque') {
            Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo' o 'Proceso' iniciado en línea ${inicioBloquePrincipalLineaNum} no fue cerrado con 'FinAlgoritmo' o 'FinProceso'.`;
        }
    }

    if (Webgoritmo.estadoApp.errorEjecucion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        Webgoritmo.estadoApp.detenerEjecucion = true; // Asegurar detención si hay error estructural
    } else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') { // Solo ejecutar si se encontró un bloque y se cerró
        if (lineasDelPrincipal.length > 0) {
            await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        } else if (Webgoritmo.UI.añadirSalida) { // Bloque principal encontrado y cerrado, pero vacío
             Webgoritmo.UI.añadirSalida("Advertencia: El bloque Algoritmo/Proceso está vacío.", "warning");
        }
    } else if (inicioBloquePrincipalLineaNum === -1 && !Webgoritmo.estadoApp.lineasCodigo.some(l => l.trim() !== '')) {
        // No hay código en absoluto, no es un error, simplemente no hacer nada.
    }


    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) {
            let mensajeErrorCompleto = Webgoritmo.estadoApp.errorEjecucion;
            if (Webgoritmo.estadoApp.pilaLlamadas && Webgoritmo.estadoApp.pilaLlamadas.length > 0) {
                mensajeErrorCompleto += "\nPila de llamadas (SubProcesos):";
                // Mostrar la pila en orden inverso (de la más reciente a la más antigua)
                for (let k = Webgoritmo.estadoApp.pilaLlamadas.length - 1; k >= 0; k--) {
                    const frame = Webgoritmo.estadoApp.pilaLlamadas[k];
                    mensajeErrorCompleto += `\n  - En SubProceso '${frame.nombre}' (definido en línea ~${frame.lineaDefinicion}), llamado desde línea ~${frame.lineaLlamada}.`;
                }
            }
            Webgoritmo.UI.añadirSalida(mensajeErrorCompleto, 'error');
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
        } else if (Webgoritmo.estadoApp.detenerEjecucion) {
            Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida ---", "warning");
        } else {
            Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
        }
    }
};

console.log("motorInterprete.js cargado y Webgoritmo.Interprete inicializado (con handleSi y handleLeer).");
