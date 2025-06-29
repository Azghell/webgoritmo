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
        // Considerar 'numero' si se usa como tipo genérico en Definir
        case 'numero': return 0; // Default para 'numero' podría ser 0 o 0.0
        default:
            console.warn(`Tipo '${tipo}' no reconocido en obtenerValorPorDefecto. Usando null.`);
            return null;
    }
};
Webgoritmo.Interprete.inferirTipo = function(valor) {
    if (typeof valor === 'number') return Number.isInteger(valor) ? 'entero' : 'real';
    if (typeof valor === 'boolean') return 'logico';
    if (typeof valor === 'string') return 'cadena'; // Podría ser 'caracter' si longitud es 1, pero PSeInt es flexible.
    return 'desconocido';
};
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    const tipoDestinoLower = String(tipoDestino).toLowerCase();
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();

    if (tipoOrigen === tipoDestinoLower && tipoDestinoLower !== 'desconocido') return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return valor; // Entero a Real es seguro
    if (tipoDestinoLower === 'numero') { // Si el destino es 'numero', permitir entero o real
        if (tipoOrigen === 'entero' || tipoOrigen === 'real') return valor;
    }


    if (typeof valor === 'string') {
        const valTrimmed = valor.trim();
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valTrimmed, 10);
                if (isNaN(intVal) || String(intVal) !== valTrimmed) { // Asegurar que toda la cadena fue un entero
                    throw new Error(`La cadena '${valor}' no es un entero válido.`);
                }
                return intVal;
            case 'real':
            case 'numero': // Tratar 'numero' como 'real' para conversión desde cadena
                if (valTrimmed === "") throw new Error(`La cadena vacía no es un número real válido.`);
                const numRepresentation = Number(valTrimmed);
                if (!isFinite(numRepresentation)) { // Cubre NaN, Infinity, -Infinity
                    throw new Error(`La cadena '${valor}' no es un número real válido.`);
                }
                return numRepresentation;
            case 'logico':
                const lowerVal = valTrimmed.toLowerCase();
                if (lowerVal === 'verdadero' || lowerVal === 'v') return true;
                if (lowerVal === 'falso' || lowerVal === 'f') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
            case 'caracter':
                return valTrimmed.length > 0 ? valTrimmed.charAt(0) : ''; // PSeInt podría devolver error si > 1 char
            case 'cadena':
                return valor; // Ya es string
        }
    } else if (typeof valor === 'number') {
        switch (tipoDestinoLower) {
            case 'entero': return Math.trunc(valor);
            case 'real': return valor; // Ya es número, podría ser entero o real
            case 'numero': return valor; // Ya es número
            case 'cadena': return String(valor);
            case 'caracter': return String(valor).charAt(0) || '';
            case 'logico': throw new Error(`No se puede convertir directamente un número a lógico. Use una comparación.`);
        }
    } else if (typeof valor === 'boolean') {
         switch (tipoDestinoLower) {
            case 'entero': return valor ? 1 : 0;
            case 'real': return valor ? 1.0 : 0.0;
            case 'numero': return valor ? 1 : 0;
            case 'cadena': return valor ? 'Verdadero' : 'Falso';
            case 'logico': return valor; // Ya es lógico
            case 'caracter': throw new Error(`No se puede convertir directamente un lógico a caracter.`);
        }
    }
    throw new Error(`Incompatibilidad de tipo: no se puede convertir '${tipoOrigen}' a '${tipoDestinoLower}'. Valor: ${valor}`);
};

Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType, ambitoParaDefaultValor) {
    const defaultValue = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType);
    function crearDimension(dimIndex) {
        const dimensionSize = dimensions[dimIndex];
        if (typeof dimensionSize !== 'number' || !Number.isInteger(dimensionSize) || dimensionSize <= 0) {
            throw new Error(`Las dimensiones de un arreglo deben ser números enteros positivos. Se encontró: ${dimensionSize}.`);
        }
        let arr = new Array(dimensionSize + 1); // PSeInt usa 1-based indexing, JS es 0-based. Dejar espacio en [0] o ajustar.
                                              // Usaremos 1-based para PSeInt, así que el tamaño es el índice máximo.
        if (dimIndex === dimensions.length - 1) { // Última dimensión
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
        const paramsList = paramsStr.split(','); // Simple split, puede fallar con args complejos
        for (const pStr of paramsList) {
            const paramTrimmed = pStr.trim();
            if (paramTrimmed === "") continue;
            // Regex para parámetro: nombre (OPCIONALMENTE Como Tipo) (OPCIONALMENTE Por Referencia)
            const regexParam = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)(?:\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+))?(?:\s+Por\s+Referencia)?\s*$/i;
            const matchParam = paramTrimmed.match(regexParam);
            if (!matchParam) throw new Error(`Sintaxis incorrecta para el parámetro '${paramTrimmed}' de SubProceso '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);

            const paramNameOriginal = matchParam[1];
            let paramType = 'desconocido'; // Tipo por defecto si no se especifica
            if (matchParam[2]) { // Grupo 2 es el tipo del parámetro
                const tipoParamStr = matchParam[2];
                const tipoParamLower = tipoParamStr.toLowerCase();
                const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena', 'numero', 'número', 'numerico', 'numérico'];
                if (!tiposConocidos.includes(tipoParamLower)) throw new Error(`Tipo de dato '${tipoParamStr}' no reconocido para parámetro '${paramNameOriginal}' de '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);
                paramType = tipoParamLower.startsWith('num') ? 'numero' : tipoParamLower; // Normalizar sinónimos de número
            }
            const isByRef = matchParam[0].toLowerCase().includes("por referencia");
            parametros.push({ nombreOriginal: paramNameOriginal, nombreLc: paramNameOriginal.toLowerCase(), tipo: paramType, esPorReferencia: isByRef });
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

        // PSeInt no permite SubProcesos anidados. Si se quisiera, se necesitaría contador de anidamiento.
        if (lineaCuerpoLower.startsWith("finsubproceso")) {
            finSubProcesoEncontrado = true; break;
        }
        cuerpo.push(lineaCuerpoOriginal);
    }
    if (!finSubProcesoEncontrado) throw new Error(`Se esperaba 'FinSubProceso' para cerrar la definición de '${nombreFuncionOriginal}' iniciada en línea ${indiceInicio + 1}.`);

    return {
        nombreOriginal: nombreFuncionOriginal, nombreLc: nombreFuncionLc,
        retornoVarOriginal: varRetornoOriginal, retornoVarLc: varRetornoLc,
        parametros: parametros,
        cuerpo: cuerpo,
        lineaOriginalDef: indiceInicio + 1,
        indiceFinEnTodasLasLineas: currentLineNum
    };
};


// --- HANDLERS RESTAURADOS Y MEJORADOS ---

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
    if (tipoBaseLc.startsWith("num")) tipoBaseLc = "numero"; // Normalizar 'numero', 'numerico', etc.

    for (const nombreOriginal of nombresVariablesOriginales) {
        if (nombreOriginal === "") throw new Error(`Nombre de variable vacío en 'Definir' en línea ${numLineaOriginal}.`);
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreOriginal}' en 'Definir' en línea ${numLineaOriginal}.`);
        }
        const nombreLc = nombreOriginal.toLowerCase();

        if (ambitoActual.hasOwnProperty(nombreLc)) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA línea ${numLineaOriginal}]: Variable '${nombreOriginal}' (como '${nombreLc}') ya definida. Se sobrescribirá.`, 'warning');
        }

        if (dimsStr) {
            const dimExprs = dimsStr.split(',').map(s => s.trim());
            if (dimExprs.some(s => s === "")) throw new Error(`Dimensión vacía para arreglo '${nombreOriginal}' en línea ${numLineaOriginal}.`);
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) {
                    throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}' para '${nombreOriginal}' línea ${numLineaOriginal}.`);
                }
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = {
                type: 'array',
                baseType: tipoBaseLc,
                dimensions: evalDimensiones,
                value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc, ambitoActual),
                isFlexibleType: tipoBaseLc === 'numero' // Solo 'numero' es flexible inicialmente para arrays
            };
            if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreOriginal}'(${tipoBaseLc}) dimensionado con [${evalDimensiones.join(',')}] en línea ${numLineaOriginal}.`, 'normal');
        } else {
            ambitoActual[nombreLc] = {
                value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc),
                type: tipoBaseLc,
                isFlexibleType: tipoBaseLc === 'numero' // Tipo 'numero' es flexible hasta primera asignación
            };
        }
    }
    return true;
};

Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) {
    const asignacionMatch = linea.match(/^(.+?)\s*(?:<-|=)\s*(.*)$/);
    if (!asignacionMatch) return false;

    const destinoStrOriginal = asignacionMatch[1].trim();
    const exprStr = asignacionMatch[2].trim();
    let valorEvaluado;

    const funcCallMatchRHS = exprStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/);
    let funcNameRHSOoriginal = null;
    if (funcCallMatchRHS) funcNameRHSOoriginal = funcCallMatchRHS[1];
    const funcNameRHSLc = funcNameRHSOoriginal ? funcNameRHSOoriginal.toLowerCase() : null;

    if (funcCallMatchRHS && Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(funcNameRHSLc)) {
        const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[funcNameRHSLc];
        if (defFuncion.retornoVarLc === null) throw new Error(`Error línea ${numLineaOriginal}: SubProceso '${funcNameRHSOoriginal}' no devuelve valor y no puede ser asignado.`);
        let argExprsRHS = funcCallMatchRHS[2].trim() === '' ? [] : funcCallMatchRHS[2].split(',').map(a => a.trim());
        valorEvaluado = await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(funcNameRHSOoriginal, argExprsRHS, ambitoActual, numLineaOriginal);
    } else if (funcCallMatchRHS && Webgoritmo.Builtins && Webgoritmo.Builtins.funciones.hasOwnProperty(funcNameRHSLc)) {
        let argExprsRHS = funcCallMatchRHS[2].trim() === '' ? [] : funcCallMatchRHS[2].split(',').map(a => a.trim());
        const evaluadosArgs = [];
        for (const argExpr of argExprsRHS) evaluadosArgs.push(await Webgoritmo.Expresiones.evaluarExpresion(argExpr, ambitoActual));
        valorEvaluado = Webgoritmo.Builtins.funciones[funcNameRHSLc](evaluadosArgs, numLineaOriginal);
    } else {
        valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprStr, ambitoActual);
    }

    const accesoArregloMatch = destinoStrOriginal.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);
    if (accesoArregloMatch) {
        const nombreArrOriginal = accesoArregloMatch[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreArrLc)) throw new Error(`Arreglo '${nombreArrOriginal}' no definido (línea ${numLineaOriginal}).`);
        const arrMeta = ambitoActual[nombreArrLc];
        if (arrMeta.type !== 'array') throw new Error(`Variable '${nombreArrOriginal}' no es un arreglo (línea ${numLineaOriginal}).`);

        const indiceExprs = accesoArregloMatch[2].split(',').map(s => s.trim());
        if (indiceExprs.some(s => s === "")) throw new Error(`Índice vacío para '${nombreArrOriginal}' (línea ${numLineaOriginal}).`);
        if (indiceExprs.length !== arrMeta.dimensions.length) throw new Error(`Dimensiones incorrectas para '${nombreArrOriginal}'. Esperadas ${arrMeta.dimensions.length}, recibidas ${indiceExprs.length} (línea ${numLineaOriginal}).`);

        const evalIndices = [];
        for (let k = 0; k < indiceExprs.length; k++) {
            let idxValRaw = await Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], ambitoActual);
            let idxVal = idxValRaw;
            if (typeof idxVal !== 'number' || (!Number.isInteger(idxVal) && Math.floor(idxVal) !== idxVal) ) {
                 idxVal = Math.trunc(idxVal);
            }
            if (typeof idxVal !== 'number' || isNaN(idxVal)) {
                throw new Error(`Índice para dimensión ${k+1} de '${nombreArrOriginal}' debe ser numérico. Se obtuvo '${indiceExprs[k]}' (evaluado a ${idxValRaw}) (línea ${numLineaOriginal}).`);
            }
            idxVal = Math.trunc(idxVal);
            if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) throw new Error(`Índice [${idxVal}] fuera de límites para dim ${k+1} de '${nombreArrOriginal}' (1..${arrMeta.dimensions[k]}) (línea ${numLineaOriginal}).`);
            evalIndices.push(idxVal);
        }
        let targetLevel = arrMeta.value;
        for (let k = 0; k < evalIndices.length - 1; k++) {
            if (!targetLevel || !Array.isArray(targetLevel[evalIndices[k]])) throw new Error(`Error interno accediendo sub-arreglo de '${nombreArrOriginal}' en dimensión ${k+1} (línea ${numLineaOriginal}).`);
            targetLevel = targetLevel[evalIndices[k]];
        }

        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestinoParaConversion = arrMeta.isFlexibleType && arrMeta.baseType === 'numero' ? tipoValorEntrante : arrMeta.baseType;

        if (arrMeta.isFlexibleType && arrMeta.baseType === 'numero') {
            arrMeta.baseType = tipoValorEntrante; // Fija el tipo del arreglo a partir de la primera asignación
            arrMeta.isFlexibleType = false;
             if(Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' fijó su tipo base a '${tipoValorEntrante}' en línea ${numLineaOriginal}.`, 'normal');
        } else if (arrMeta.isFlexibleType && arrMeta.baseType === 'entero' && (tipoValorEntrante === 'cadena' || tipoValorEntrante === 'caracter')) {
            // Este caso es más específico de PSeInt si se quiere promoción automática a cadena
            // arrMeta.baseType = 'cadena'; tipoDestinoParaConversion = 'cadena'; arrMeta.isFlexibleType = false;
        }
        targetLevel[evalIndices[evalIndices.length - 1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoParaConversion);
    } else {
        const nombreVarOriginal = destinoStrOriginal;
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreVarOriginal}' en asignación en línea ${numLineaOriginal}.`);
        }
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Variable '${nombreVarOriginal}' no definida (línea ${numLineaOriginal}).`);
        const varMeta = ambitoActual[nombreVarLc];
        if (varMeta.type === 'array') throw new Error(`No se puede asignar a arreglo '${nombreVarOriginal}' sin índices (línea ${numLineaOriginal}).`);

        let tipoDestinoEscalar = varMeta.isFlexibleType && varMeta.type === 'numero' ? Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase() : varMeta.type;
        if (varMeta.isFlexibleType && varMeta.type === 'numero') {
            varMeta.type = tipoDestinoEscalar;
            varMeta.isFlexibleType = false;
        }
        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoEscalar);
    }
    return true;
};

Webgoritmo.Interprete.handleEscribir = async function(linea, ambitoActual, numLineaOriginal) {
    const regexEscribir = /^(Escribir|Imprimir|Mostrar)\s+(.*)/i;
    const coincidenciaEscribir = linea.match(regexEscribir);
    if (coincidenciaEscribir) {
        const cadenaArgs = coincidenciaEscribir[2];
        const args = [];
        let buffer = "";
        let dentroDeComillasDobles = false;
        let dentroDeComillasSimples = false;
        for (let k = 0; k < cadenaArgs.length; k++) {
            const char = cadenaArgs[k];
            if (char === '"' && (k === 0 || cadenaArgs[k-1] !== '\\')) dentroDeComillasDobles = !dentroDeComillasDobles;
            else if (char === "'" && (k === 0 || cadenaArgs[k-1] !== '\\')) dentroDeComillasSimples = !dentroDeComillasSimples;
            if (char === ',' && !dentroDeComillasDobles && !dentroDeComillasSimples) { args.push(buffer.trim()); buffer = ""; }
            else buffer += char;
        }
        args.push(buffer.trim());
        let partesMensajeSalida = [];
        for (const arg of args) {
            if(arg === "") continue;
            const parteEvaluada = await Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
            partesMensajeSalida.push( (typeof parteEvaluada === 'boolean') ? (parteEvaluada ? 'Verdadero' : 'Falso') : (parteEvaluada === null ? 'nulo' : String(parteEvaluada)) );
        }
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal');
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloque, indiceEnBloque) {
    const siMatch = lineaActual.match(/^Si\s+(.+?)\s+Entonces$/i);
    if (!siMatch) throw new Error(`Sintaxis 'Si' incorrecta en línea ${numLineaOriginalSi}.`);
    const condicionPrincipalStr = siMatch[1];
    let condicionPrincipalVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionPrincipalStr, ambitoActual);
    if (typeoficionPrincipalVal !== 'boolean') throw new Error(`Condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi} debe ser lógica, se obtuvo: ${condicionPrincipalVal}.`);

    let bloqueEntonces = [];
    let bloquesSinoSi = [];
    let bloqueSino = { cuerpo: [], lineaOriginal: -1 };
    let bufferBloqueActual = bloqueEntonces;
    let siAnidados = 0;
    let i = indiceEnBloque + 1;

    while (i < lineasBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return i;
        const lineaIterOriginal = lineasBloque[i];
        const lineaIterTrimmed = lineaIterOriginal.trim();
        const lineaIterLower = lineaIterTrimmed.toLowerCase();
        const numLineaGlobalIter = numLineaOriginalSi + (i - (indiceEnBloque + 1)) + 1;

        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) {
            siAnidados++; bufferBloqueActual.push(lineaIterOriginal);
        } else if (lineaIterLower === "finsi") {
            if (siAnidados > 0) { siAnidados--; bufferBloqueActual.push(lineaIterOriginal); }
            else { i++; break; }
        } else if (siAnidados === 0) {
            const sinoSiMatch = lineaIterTrimmed.match(/^SinoSi\s+(.+?)\s+Entonces$/i);
            if (sinoSiMatch) {
                if (bufferBloqueActual === bloqueSino.cuerpo) throw new Error(`'SinoSi' no puede aparecer después de 'Sino' (línea ${numLineaGlobalIter}).`);
                const nuevoBloqueSinoSi = { condicionStr: sinoSiMatch[1], cuerpo: [], lineaOriginal: numLineaGlobalIter };
                bloquesSinoSi.push(nuevoBloqueSinoSi); bufferBloqueActual = nuevoBloqueSinoSi.cuerpo;
            } else if (lineaIterLower === "sino") {
                if (bloqueSino.lineaOriginal !== -1) throw new Error(`Múltiples 'Sino' para el mismo 'Si' (línea ${numLineaGlobalIter}).`);
                bloqueSino.lineaOriginal = numLineaGlobalIter; bufferBloqueActual = bloqueSino.cuerpo;
            } else { bufferBloqueActual.push(lineaIterOriginal); }
        } else { bufferBloqueActual.push(lineaIterOriginal); }
        i++;
    }
    if (siAnidados > 0 || (i >= lineasBloque.length && !(lineasBloque[i-1] && lineasBloque[i-1].trim().toLowerCase() === "finsi"))) {
         throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numLineaOriginalSi}.`);
    }

    if (condicionPrincipalVal) {
        await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, numLineaOriginalSi);
    } else {
        let sinoSiEjecutado = false;
        for (const bloqueSCS of bloquesSinoSi) {
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
            let condicionSinoSiVal = await Webgoritmo.Expresiones.evaluarExpresion(bloqueSCS.condicionStr, ambitoActual);
            if (typeof condicionSinoSiVal !== 'boolean') throw new Error(`Condición 'SinoSi' ("${bloqueSCS.condicionStr}") en línea ${bloqueSCS.lineaOriginal} debe ser lógica, se obtuvo: ${condicionSinoSiVal}.`);
            if (condicionSinoSiVal) {
                await Webgoritmo.Interprete.ejecutarBloque(bloqueSCS.cuerpo, ambitoActual, bloqueSCS.lineaOriginal);
                sinoSiEjecutado = true; break;
            }
        }
        if (!sinoSiEjecutado && bloqueSino.lineaOriginal !== -1 && bloqueSino.cuerpo.length > 0 && !Webgoritmo.estadoApp.detenerEjecucion) {
            await Webgoritmo.Interprete.ejecutarBloque(bloqueSino.cuerpo, ambitoActual, bloqueSino.lineaOriginal);
        }
    }
    return i - 1;
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaLeer = linea.match(/^Leer\s+(.+)/i);
    if (!coincidenciaLeer) throw new Error("Sintaxis 'Leer' incorrecta en línea " + numLineaOriginal);

    const nombresOriginales = coincidenciaLeer[1].split(',').map(v => v.trim());
    if (nombresOriginales.length === 0 || nombresOriginales.some(v => v === "")) {
        throw new Error("Instrucción 'Leer' debe especificar variable(s) válidas en línea " + numLineaOriginal);
    }

    const nombresLcParaEstado = [];
    for (const nombreVarOriginal of nombresOriginales) {
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreVarOriginal}' en 'Leer' en línea ${numLineaOriginal}.`);
        }
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) {
            throw new Error(`Variable '${nombreVarOriginal}' (como '${nombreVarLc}') no definida antes de 'Leer' en línea ${numLineaOriginal}.`);
        }
        if (ambitoActual[nombreVarLc].type === 'array') {
            throw new Error(`Lectura en arreglos completos no soportada ('Leer ${nombreVarOriginal}'). Línea ${numLineaOriginal}.`);
        }
        nombresLcParaEstado.push(nombreVarLc);
    }

    let promptMensaje = nombresOriginales.length === 1
        ? `Ingrese valor para ${nombresOriginales[0]}:`
        : `Ingrese ${nombresOriginales.length} valores (separados por espacio/coma) para ${nombresOriginales.join(', ')}:`;

    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') {
        window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMensaje);
    } else {
        console.error("motorInterprete.js: La función global solicitarEntradaUsuario no está disponible.");
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(promptMensaje, 'input-prompt');
            Webgoritmo.UI.añadirSalida("[Error Interno: No se pudo preparar el área de input.]", 'error');
        }
    }

    Webgoritmo.estadoApp.esperandoEntrada = true;
    Webgoritmo.estadoApp.variableEntradaActual = nombresLcParaEstado;
    Webgoritmo.estadoApp.nombresOriginalesParaEntrada = nombresOriginales;

    console.log(`handleLeer: Esperando entrada para: ${nombresOriginales.join(', ')} (internamente: ${nombresLcParaEstado.join(', ')})`);

    await new Promise(resolve => {
        Webgoritmo.estadoApp.resolverPromesaEntrada = resolve;
        if (Webgoritmo.estadoApp.detenerEjecucion) resolve();
    });
    console.log("handleLeer: Promesa de entrada resuelta.");
    if (Webgoritmo.estadoApp.detenerEjecucion) return true;
    return true;
};

Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) {
        console.error("ejecutarBloque: Módulos Webgoritmo esenciales no definidos."); return;
    }
    let i = 0;
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("Ejecución detenida en ejecutarBloque."); break; }
        const lineaOriginal = lineasBloqueParam[i];
        const lineaTrimmed = lineaOriginal.trim();
        const numLineaGlobal = numLineaOriginalOffset + i + 1;

        Webgoritmo.estadoApp.currentLineInfo = { numLineaOriginal: numLineaGlobal, contenido: lineaTrimmed }; // Para errores

        if (lineaTrimmed === '' || lineaTrimmed.startsWith('//') || (lineaTrimmed.startsWith('/*') && lineaTrimmed.endsWith('*/'))) {
            i++; continue;
        }

        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();

            const matchEscribir = lineaLower.match(/^(?:escribir|imprimir|mostrar)\s+.+/i);
            const matchAsignacion = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)/);
            const callMatch = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/);


            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('dimension ') || lineaLower.startsWith('dimensionar ')) { // Añadido dimension/dimensionar
                 instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaTrimmed, ambitoActual, numLineaGlobal); // Asumimos que handleDimension existe
            } else if (matchEscribir) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('leer ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('si ') && lineaLower.includes(' entonces')) {
                 const nuevoIndice = await Webgoritmo.Interprete.handleSi(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                 i = nuevoIndice;
                 instruccionManejada = true;
            } else if (lineaLower.startsWith('mientras ') && lineaLower.includes(' hacer')) {
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleMientras(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque;
                instruccionManejada = true;
            } else if (lineaLower.startsWith('para ') && (lineaLower.includes('<-') || lineaLower.includes('=')) && lineaLower.includes(' hasta ') && lineaLower.includes(' hacer')) {
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handlePara(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque;
                instruccionManejada = true;
            } else if (lineaLower.startsWith('repetir')) {
                // const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleRepetir(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                // i = nuevoIndiceRelativoAlBloque;
                // instruccionManejada = true;
                // TODO: Implementar handleRepetir
                throw new Error("Instrucción 'Repetir' aún no implementada.");
            } else if (lineaLower.startsWith('segun ') && lineaLower.includes(' hacer')) {
                // const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleSegun(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                // i = nuevoIndiceRelativoAlBloque;
                // instruccionManejada = true;
                // TODO: Implementar handleSegun
                throw new Error("Instrucción 'Segun' aún no implementada.");
            } else if (matchAsignacion) {
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (callMatch) { // Llamada a SubProceso o función built-in que no devuelve valor
                const callNameOriginal = callMatch[1];
                const callNameLc = callNameOriginal.toLowerCase();
                const argsStrCall = callMatch[2];
                let argExprsCall = argsStrCall.trim() === '' ? [] : argsStrCall.split(',').map(a => a.trim());

                if (Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(callNameLc)) {
                    await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(callNameOriginal, argExprsCall, ambitoActual, numLineaGlobal);
                    instruccionManejada = true;
                } else if (Webgoritmo.Builtins && Webgoritmo.Builtins.procedimientos && Webgoritmo.Builtins.procedimientos.hasOwnProperty(callNameLc)) { // Suponiendo Webgoritmo.Builtins.procedimientos
                    // const evaluadosArgs = [];
                    // for (const argExpr of argExprsCall) evaluadosArgs.push(await Webgoritmo.Expresiones.evaluarExpresion(argExpr, ambitoActual));
                    // await Webgoritmo.Builtins.procedimientos[callNameLc](evaluadosArgs, ambitoActual, numLineaGlobal);
                    // instruccionManejada = true;
                    // TODO: Implementar procedimientos built-in como LimpiarPantalla, Esperar Tecla, etc.
                    throw new Error(`Procedimiento predefinido '${callNameOriginal}' no implementado.`);
                }
            }

            if (!instruccionManejada && lineaTrimmed && !/^(finsi|sino|finmientras|finpara|finsubproceso|finsegun|hasta que)$/.test(lineaLower.split(/\s+/)[0])) {
                 if(!lineaLower.startsWith("hasta que")) {
                    throw new Error(`Instrucción no reconocida o mal ubicada: '${lineaTrimmed}'`);
                 }
            }
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = e.message.startsWith(`Error en línea ${numLineaGlobal}`) || e.message.startsWith(`Error línea ${numLineaGlobal}`) ? e.message : `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }
        i++;
        if (Webgoritmo.estadoApp.esperandoEntrada && !Webgoritmo.estadoApp.detenerEjecucion) {
            await Webgoritmo.estadoApp.promesaEntradaPendiente;
            Webgoritmo.estadoApp.promesaEntradaPendiente = null;
            if(Webgoritmo.estadoApp.detenerEjecucion) break;
        }
    }
    Webgoritmo.estadoApp.currentLineInfo = null;
};

Webgoritmo.Interprete.handleMientras = async function(lineaActual, ambitoActual, numLineaOriginalMientras, lineasBloqueCompleto, indiceMientrasEnBloque) {
    const mientrasMatch = lineaActual.match(/^Mientras\s+(.+?)\s+Hacer$/i);
    if (!mientrasMatch) throw new Error(`Sintaxis 'Mientras' incorrecta en línea ${numLineaOriginalMientras}.`);
    const condicionStr = mientrasMatch[1];
    let cuerpoMientras = [];
    let finMientrasEncontrado = false;
    let anidamientoMientras = 0;
    let i = indiceMientrasEnBloque + 1;
    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIterOriginal = lineasBloqueCompleto[i];
        const lineaIter = lineaIterOriginal.trim().toLowerCase();
        if (lineaIter.startsWith("mientras ") && lineaIter.includes(" hacer")) { anidamientoMientras++; cuerpoMientras.push(lineaIterOriginal); }
        else if (lineaIter === "finmientras") {
            if (anidamientoMientras === 0) { finMientrasEncontrado = true; break; }
            else { anidamientoMientras--; cuerpoMientras.push(lineaIterOriginal); }
        } else { cuerpoMientras.push(lineaIterOriginal); }
    }
    if (!finMientrasEncontrado) throw new Error(`Se esperaba 'FinMientras' para cerrar bucle 'Mientras' de línea ${numLineaOriginalMientras}.`);

    let condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
    if (typeoficionVal !== 'boolean') throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica.`);

    while (condicionVal && !Webgoritmo.estadoApp.detenerEjecucion) {
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoMientras, ambitoActual, numLineaOriginalMientras);
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        // TODO: Manejo de 'Leer' dentro de Mientras con estadoBuclePendiente si es necesario
        condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
        if (typeoficionVal !== 'boolean') throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica.`);
    }
    return { nuevoIndiceRelativoAlBloque: i }; // i apunta al FinMientras o más allá
};


Webgoritmo.Interprete.reanudarBuclePendiente = async function() { /* Placeholder, la lógica compleja de reanudación fue eliminada para simplificar y se integrará mejor si es necesaria */ };

Webgoritmo.Interprete.handlePara = async function(lineaActual, ambitoActual, numLineaOriginalPara, lineasBloqueCompleto, indiceParaEnBloque) {
    const paraMatch = lineaActual.match(/^Para\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i);
    if (!paraMatch) {
        throw new Error(`Sintaxis 'Para' incorrecta en línea ${numLineaOriginalPara}. Verifique la asignación (<- o =), 'Hasta', 'Con Paso' (opcional) y 'Hacer'.`);
    }

    const varControlOriginal = paraMatch[1];
    const varControlLc = varControlOriginal.toLowerCase();
    const valorInicialExpr = paraMatch[2];
    const valorFinalExpr = paraMatch[3];
    const valorPasoExpr = paraMatch[4];

    let valorInicial = await Webgoritmo.Expresiones.evaluarExpresion(valorInicialExpr, ambitoActual);
    let valorFinal = await Webgoritmo.Expresiones.evaluarExpresion(valorFinalExpr, ambitoActual);
    let paso = valorPasoExpr ? await Webgoritmo.Expresiones.evaluarExpresion(valorPasoExpr, ambitoActual) : (valorFinal >= valorInicial ? 1 : -1);

    if (typeof valorInicial !== 'number' || typeof valorFinal !== 'number' || typeof paso !== 'number') {
        throw new Error(`Los límites y el paso del bucle 'Para' deben ser numéricos (en línea ${numLineaOriginalPara}).`);
    }
    if (paso === 0) {
        throw new Error(`El paso del bucle 'Para' no puede ser cero (en línea ${numLineaOriginalPara}).`);
    }

    if (!ambitoActual.hasOwnProperty(varControlLc)) {
        const tipoImplicito = (Number.isInteger(valorInicial) && Number.isInteger(valorFinal) && Number.isInteger(paso)) ? 'entero' : 'real';
        ambitoActual[varControlLc] = { value: valorInicial, type: tipoImplicito, isFlexibleType: false };
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO línea ${numLineaOriginalPara}]: Variable de control '${varControlOriginal}' (como '${varControlLc}') definida implícitamente como ${tipoImplicito}.`, 'normal');
    } else {
        ambitoActual[varControlLc].value = valorInicial;
    }
    let variableControlObj = ambitoActual[varControlLc];

    let cuerpoPara = [];
    let finParaEncontrado = false;
    let anidamientoPara = 0;
    let i = indiceParaEnBloque + 1;

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIterOriginal = lineasBloqueCompleto[i];
        const lineaIter = lineaIterOriginal.trim().toLowerCase();
        if (lineaIter.startsWith("para ") && (lineaIter.includes("<-") || lineaIter.includes("=")) && lineaIter.includes(" hasta ") && lineaIter.includes(" hacer")) {
            anidamientoPara++; cuerpoPara.push(lineaIterOriginal);
        } else if (lineaIter === "finpara") {
            if (anidamientoPara === 0) { finParaEncontrado = true; break; }
            else { anidamientoPara--; cuerpoPara.push(lineaIterOriginal); }
        } else { cuerpoPara.push(lineaIterOriginal); }
    }

    if (!finParaEncontrado) {
        throw new Error(`Se esperaba 'FinPara' para cerrar el bucle 'Para' iniciado en la línea ${numLineaOriginalPara}.`);
    }
    const indiceFinBloquePara = i;

    while ((paso > 0 && variableControlObj.value <= valorFinal) || (paso < 0 && variableControlObj.value >= valorFinal)) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoPara, ambitoActual, numLineaOriginalPara);
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        // TODO: Manejo de 'Leer' dentro de Para con estadoBuclePendiente si es necesario
        variableControlObj.value += paso;
    }
    return { nuevoIndiceRelativoAlBloque: indiceFinBloquePara };
};

Webgoritmo.Interprete.ejecutarSubProcesoLlamada = async function(nombreFuncionOriginal, listaExprArgumentos, ambitoLlamador, numLineaOriginalLlamada) {
    const nombreFuncionLc = nombreFuncionOriginal.toLowerCase();
    if (!Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(nombreFuncionLc)) {
        throw new Error(`Error línea ${numLineaOriginalLlamada}: SubProceso '${nombreFuncionOriginal}' no definido.`);
    }

    const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[nombreFuncionLc];
    if (listaExprArgumentos.length !== defFuncion.parametros.length) {
        throw new Error(`Error línea ${numLineaOriginalLlamada}: Número incorrecto de argumentos para '${defFuncion.nombreOriginal}'. Esperados ${defFuncion.parametros.length}, recibidos ${listaExprArgumentos.length}.`);
    }

    if (!Webgoritmo.estadoApp.pilaLlamadas) Webgoritmo.estadoApp.pilaLlamadas = [];
    Webgoritmo.estadoApp.pilaLlamadas.push({ nombre: defFuncion.nombreOriginal, lineaLlamada: numLineaOriginalLlamada, lineaDefinicion: defFuncion.lineaOriginalDef });
    if (Webgoritmo.estadoApp.pilaLlamadas.length > 100) { // Límite de recursión
        throw new Error(`Error línea ${numLineaOriginalLlamada}: Profundidad máxima de pila de llamadas excedida (posible recursión infinita en '${defFuncion.nombreOriginal}').`);
    }

    try {
        const argumentosEvaluados = [];
        for(let k=0; k < listaExprArgumentos.length; k++) {
             const exprArg = listaExprArgumentos[k];
             try {
                 argumentosEvaluados.push(await Webgoritmo.Expresiones.evaluarExpresion(exprArg, ambitoLlamador));
             } catch (e) {
                 throw new Error(`Error línea ${numLineaOriginalLlamada} evaluando argumento #${k+1} ('${exprArg}') para '${defFuncion.nombreOriginal}': ${e.message}`);
             }
        }

        const ambitoLocal = Object.create(Webgoritmo.estadoApp.variables); // Hereda del ámbito global

        if (defFuncion.retornoVarLc) {
            ambitoLocal[defFuncion.retornoVarLc] = {
                value: Webgoritmo.Interprete.obtenerValorPorDefecto('numero'), // Tipo por defecto para retorno
                type: 'numero',
                isFlexibleType: true
            };
        }

        for (let k = 0; k < defFuncion.parametros.length; k++) {
            const paramDef = defFuncion.parametros[k];
            const argExprOriginal = listaExprArgumentos[k].trim();
            const nombreVarOriginalArg = argExprOriginal;
            const nombreVarArgLc = nombreVarOriginalArg.toLowerCase();

            if (paramDef.esPorReferencia) {
                if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginalArg) || !ambitoLlamador.hasOwnProperty(nombreVarArgLc)) {
                    throw new Error(`Error línea ${numLineaOriginalLlamada}: El argumento ('${argExprOriginal}') para el parámetro por referencia '${paramDef.nombreOriginal}' de '${defFuncion.nombreOriginal}' debe ser una variable existente en el ámbito del llamador.`);
                }
                ambitoLocal[paramDef.nombreLc] = ambitoLlamador[nombreVarArgLc];
            } else {
                const valorArgumento = argumentosEvaluados[k];
                let tipoParametroDestino = paramDef.tipo === 'desconocido' ? Webgoritmo.Interprete.inferirTipo(valorArgumento).toLowerCase() : paramDef.tipo;
                if (tipoParametroDestino === 'desconocido' && valorArgumento === null) tipoParametroDestino = 'numero'; // Asumir numero para nulls sin tipo

                let valorParametroFinal = Webgoritmo.Interprete.convertirValorParaAsignacion(valorArgumento, tipoParametroDestino);
                ambitoLocal[paramDef.nombreLc] = { value: valorParametroFinal, type: tipoParametroDestino, isFlexibleType: paramDef.tipo === 'desconocido' || paramDef.tipo === 'numero' };
            }
        }

        // El offset para ejecutarBloque es el número de línea de la definición del SubProceso - 1 (porque ejecutarBloque suma 1)
        await Webgoritmo.Interprete.ejecutarBloque(defFuncion.cuerpo, ambitoLocal, defFuncion.lineaOriginalDef -1 );

        if (defFuncion.retornoVarLc) {
            if (!ambitoLocal.hasOwnProperty(defFuncion.retornoVarLc)) { // Debería existir por la inicialización
                throw new Error(`Error en SubProceso '${defFuncion.nombreOriginal}': Variable de retorno '${defFuncion.retornoVarOriginal}' no asignada o no encontrada en ámbito local.`);
            }
            return ambitoLocal[defFuncion.retornoVarLc].value;
        }
        return undefined;
    } finally {
        if (Webgoritmo.estadoApp.pilaLlamadas && Webgoritmo.estadoApp.pilaLlamadas.length > 0) {
            Webgoritmo.estadoApp.pilaLlamadas.pop();
        }
    }
};


Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (Webgoritmo.UI.añadirSalida) {
        if(Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
        Webgoritmo.UI.añadirSalida("--- Iniciando ejecución ---", "normal");
    }

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
                        throw new Error(`SubProceso '${defSubProceso.nombreOriginal}' (como '${defSubProceso.nombreLc}') ya definido.`);
                    }
                    Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc] = defSubProceso;
                    for (let k = i; k <= defSubProceso.indiceFinEnTodasLasLineas; k++) {
                        subProcesoLineIndices.add(k);
                    }
                    i = defSubProceso.indiceFinEnTodasLasLineas;
                } catch (e) {
                    Webgoritmo.estadoApp.errorEjecucion = e.message;
                    Webgoritmo.estadoApp.detenerEjecucion = true;
                    break;
                }
            }
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
        }
    } else {
        console.warn("Webgoritmo.Interprete.parseDefinicionSubProceso no está definido. Subprocesos no serán parseados.");
    }

    if (Webgoritmo.estadoApp.detenerEjecucion) {
        if (Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase de parseo de SubProcesos) ---", "error");
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
                inicioBloquePrincipalLineaNum = j + 1;
                processingState = 'en_bloque';
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
             Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo'/'Proceso' iniciado línea ${inicioBloquePrincipalLineaNum} no fue cerrado correctamente.`;
        }
    }

    if (Webgoritmo.estadoApp.errorEjecucion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        Webgoritmo.estadoApp.detenerEjecucion = true;
    } else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (lineasDelPrincipal.length > 0) {
            await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        } else if (Webgoritmo.UI.añadirSalida) {
             Webgoritmo.UI.añadirSalida("Advertencia: Bloque Algoritmo/Proceso vacío.", "warning");
        }
    } else if (inicioBloquePrincipalLineaNum === -1 && !Webgoritmo.estadoApp.lineasCodigo.some((l, idx) => {
        if(subProcesoLineIndices.has(idx)) return false;
        let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';
    })) {
        // No code at all (outside of subprocs), not an error.
    } else if (processingState === 'buscar_inicio' && !Webgoritmo.estadoApp.lineasCodigo.some(l => {let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';})) {
        // Also no code at all.
    }


    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) {
            let mensajeErrorCompleto = Webgoritmo.estadoApp.errorEjecucion;
            if (Webgoritmo.estadoApp.pilaLlamadas && Webgoritmo.estadoApp.pilaLlamadas.length > 0) {
                mensajeErrorCompleto += "\nPila de llamadas (SubProcesos):";
                for (let k = Webgoritmo.estadoApp.pilaLlamadas.length - 1; k >= 0; k--) {
                    const frame = Webgoritmo.estadoApp.pilaLlamadas[k];
                    mensajeErrorCompleto += `\n  - En SubProceso '${frame.nombre}' (definido en línea ~${frame.lineaDefinicion}), llamado desde línea ~${frame.lineaLlamada}.`;
                }
            }
            Webgoritmo.UI.añadirSalida(mensajeErrorCompleto, 'error');
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
        }
        else if (Webgoritmo.estadoApp.detenerEjecucion) { Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida ---", "warning"); }
        else { Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal"); }
    }
};

console.log("motorInterprete.js cargado y Webgoritmo.Interprete inicializado (con handleSi y handleLeer).");

[end of motorInterprete.js]
