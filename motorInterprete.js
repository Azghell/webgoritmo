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
                if (isNaN(intVal) || String(intVal) !== valor.trim()) {
                    throw new Error(`La cadena '${valor}' no es un entero válido.`);
                }
                return intVal;
            case 'real':
                const valTrimmed = valor.trim();
                if (valTrimmed === "") {
                    throw new Error(`La cadena '${valor}' (vacía) no es un número real válido.`);
                }
                const numRepresentation = Number(valTrimmed);
                if (!isFinite(numRepresentation)) {
                    throw new Error(`La cadena '${valTrimmed}' no es un número real válido.`);
                }
                return numRepresentation;
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
    const defaultValue = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType);
    function crearDimension(dimIndex) {
        const dimensionSize = dimensions[dimIndex];
        if (dimensionSize <= 0) {
            throw new Error(`Las dimensiones de un arreglo deben ser mayores que cero. Se encontró: ${dimensionSize}.`);
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
    const regexDefSubProceso = /^\s*SubProceso\s+(?:([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*)?([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/i; // Nombres con acentos
    const matchHeader = lineaInicioSubProceso.trim().match(regexDefSubProceso);
    if (!matchHeader) throw new Error(`Sintaxis incorrecta en la definición de SubProceso en línea ${indiceInicio + 1}: '${lineaInicioSubProceso.trim()}'`);

    const varRetornoOriginal = matchHeader[1] ? matchHeader[1].trim() : null;
    const nombreFuncionOriginal = matchHeader[2].trim(); // Grupo 2 es el nombre
    const paramsStr = matchHeader[3].trim(); // Grupo 3 son los parámetros

    const nombreFuncionLc = nombreFuncionOriginal.toLowerCase();
    const varRetornoLc = varRetornoOriginal ? varRetornoOriginal.toLowerCase() : null;
    const parametros = [];

    if (paramsStr) {
        const paramsList = paramsStr.split(',');
        for (const pStr of paramsList) {
            const paramTrimmed = pStr.trim();
            if (paramTrimmed === "") continue;
            const regexParam = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)(?:\s+(?:Como|Es)\s+([a-zA-Z_][a-zA-Z0-9_]+))?(?:\s+Por\s+Referencia)?\s*$/i; // Nombres con acentos
            const matchParam = paramTrimmed.match(regexParam);
            if (!matchParam) throw new Error(`Sintaxis incorrecta para el parámetro '${paramTrimmed}' de SubProceso '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);

            const paramNameOriginal = matchParam[1];
            let paramType = 'desconocido';
            if (matchParam[3]) { // Grupo 3 es el tipo del parámetro
                const tipoParamLower = matchParam[3].toLowerCase();
                const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena'];
                if (!tiposConocidos.includes(tipoParamLower)) throw new Error(`Tipo de dato '${matchParam[3]}' no reconocido para parámetro '${paramNameOriginal}' de '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);
                paramType = tipoParamLower;
            }
            const isByRef = matchParam[0].toLowerCase().includes("por referencia");
            parametros.push({ nombreOriginal: paramNameOriginal, nombreLc: paramNameOriginal.toLowerCase(), tipo: paramType, esPorReferencia: isByRef });
        }
    }

    const cuerpo = [];
    let i = indiceInicio + 1;
    let anidamiento = 0;
    let finSubProcesoEncontrado = false;
    for (; i < todasLasLineas.length; i++) {
        const lineaCuerpoOriginal = todasLasLineas[i];
        let lineaCuerpoAnalisis = lineaCuerpoOriginal.split('//')[0].trim();
        if (lineaCuerpoAnalisis.startsWith('/*') && lineaCuerpoAnalisis.endsWith('*/')) lineaCuerpoAnalisis = '';
        const lineaCuerpoLower = lineaCuerpoAnalisis.toLowerCase();
        if (lineaCuerpoLower.startsWith("subproceso")) anidamiento++;
        else if (lineaCuerpoLower.startsWith("finsubproceso")) {
            if (anidamiento === 0) { finSubProcesoEncontrado = true; break; }
            else anidamiento--;
        }
        cuerpo.push(lineaCuerpoOriginal);
    }
    if (!finSubProcesoEncontrado) throw new Error(`Se esperaba 'FinSubProceso' para cerrar la definición de '${nombreFuncionOriginal}' iniciada en línea ${indiceInicio + 1}.`);

    return {
        nombreOriginal: nombreFuncionOriginal, nombreLc: nombreFuncionLc,
        retornoVarOriginal: varRetornoOriginal, retornoVarLc: varRetornoLc,
        parametros: parametros,
        cuerpo: cuerpo, lineaOriginalDef: indiceInicio + 1, indiceFinEnTodasLasLineas: i
    };
};

Webgoritmo.Interprete.convertirElementosArrayAString = function(arrayValue, dimensions, currentDimIndex = 0) {
    if (!arrayValue) { console.warn("convertirElementosArrayAString: arrayValue nulo/indefinido."); return; }
    const maxIndexThisDim = dimensions[currentDimIndex];
    for (let i = 1; i <= maxIndexThisDim; i++) {
        if (arrayValue[i] === undefined && currentDimIndex < dimensions.length -1 ) { console.warn(`Sub-arreglo indefinido en ${currentDimIndex + 1}[${i}]`); continue; }
        if (currentDimIndex === dimensions.length - 1) {
            arrayValue[i] = (arrayValue[i] !== null && arrayValue[i] !== undefined) ? String(arrayValue[i]) : "";
        } else if (Array.isArray(arrayValue[i])) {
            Webgoritmo.Interprete.convertirElementosArrayAString(arrayValue[i], dimensions, currentDimIndex + 1);
        } else {
            console.warn(`Elemento en ${currentDimIndex + 1}[${i}] no es sub-arreglo. Valor:`, arrayValue[i]);
            arrayValue[i] = (arrayValue[i] !== null && arrayValue[i] !== undefined) ? String(arrayValue[i]) : "";
        }
    }
};

Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) {
    let keyword = linea.trim().toLowerCase().startsWith("dimensionar") ? "Dimensionar" : "Dimension";
    let declaracionStr = linea.trim().substring(keyword.length).trim();
    if (declaracionStr === "") throw new Error(`Declaración '${keyword}' vacía en línea ${numLineaOriginal}.`);

    const declaracionesIndividuales = declaracionStr.split(',');
    for (let decl of declaracionesIndividuales) {
        decl = decl.trim();
        const matchArr = decl.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*([\[\(])\s*(.+?)\s*([\]\)])(?:\s+(?:Como|Es)\s+([a-zA-Z_][a-zA-Z0-9_]+))?\s*$/i);
        if (!matchArr) throw new Error(`Sintaxis incorrecta para '${decl}' en línea ${numLineaOriginal}.`);

        const nombreArrOriginal = matchArr[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        const tipoEspecificadoStr = matchArr[5];
        let baseTypeParaArray = 'entero', isFlexibleType = true;

        if (tipoEspecificadoStr) {
            const tipoLower = tipoEspecificadoStr.toLowerCase();
            const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena'];
            if (!tiposConocidos.includes(tipoLower)) throw new Error(`Tipo '${tipoEspecificadoStr}' no reconocido para arreglo '${nombreArrOriginal}' en línea ${numLineaOriginal}.`);
            baseTypeParaArray = tipoLower;
            isFlexibleType = false;
        }
        if (ambitoActual.hasOwnProperty(nombreArrLc)) console.warn(`[ADVERTENCIA línea ${numLineaOriginal}]: Arreglo '${nombreArrOriginal}' (como '${nombreArrLc}') ya definido. Sobrescribiendo.`);

        const dimExprs = matchArr[3].split(',').map(s => s.trim());
        if (dimExprs.some(s => s === "")) throw new Error(`Dimensión vacía para '${nombreArrOriginal}' en línea ${numLineaOriginal}.`);
        const evalDimensiones = [];
        for (const expr of dimExprs) {
            let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
            if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}' para '${nombreArrOriginal}' línea ${numLineaOriginal}.`);
            evalDimensiones.push(dimVal);
        }
        ambitoActual[nombreArrLc] = { type: 'array', baseType: baseTypeParaArray, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, baseTypeParaArray, ambitoActual), isFlexibleType: isFlexibleType };
        if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' (como '${nombreArrLc}') (${baseTypeParaArray}, flexible: ${isFlexibleType}) dimensionado con [${evalDimensiones.join(', ')}] en línea ${numLineaOriginal}.`, 'normal');
    }
    return true;
};

Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_][a-zA-Z0-9_]+)(?:\s*\[\s*(.+?)\s*\])?$/i);
    if (!coincidenciaDefinir) return false;

    const nombresVariablesOriginales = coincidenciaDefinir[1].split(',').map(s => s.trim());
    const tipoBaseStr = coincidenciaDefinir[2];
    const dimsStr = coincidenciaDefinir[3];
    const tipoBaseLc = tipoBaseStr.toLowerCase();
    const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena'];
    if (!tiposConocidos.includes(tipoBaseLc)) throw new Error(`Tipo '${tipoBaseStr}' no reconocido en línea ${numLineaOriginal}.`);

    for (const nombreOriginal of nombresVariablesOriginales) {
        if (nombreOriginal === "") throw new Error(`Nombre de variable vacío en línea ${numLineaOriginal}.`);
        const nombreLc = nombreOriginal.toLowerCase();
        if (ambitoActual.hasOwnProperty(nombreLc)) console.warn(`[ADVERTENCIA línea ${numLineaOriginal}]: Variable '${nombreOriginal}' (como '${nombreLc}') ya definida. Sobrescribiendo.`);

        if (dimsStr) { // Array
            const dimExprs = dimsStr.split(',').map(s => s.trim());
            if (dimExprs.some(s => s === "")) throw new Error(`Dimensión vacía para '${nombreOriginal}' en línea ${numLineaOriginal}.`);
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}' para '${nombreOriginal}' línea ${numLineaOriginal}.`);
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = { type: 'array', baseType: tipoBaseLc, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc, ambitoActual), isFlexibleType: false };
            if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreOriginal}' (como '${nombreLc}') de tipo '${tipoBaseLc}' (fijo) dimensionado con [${evalDimensiones.join(', ')}] en línea ${numLineaOriginal}.`, 'normal');
        } else { // Escalar
            ambitoActual[nombreLc] = { value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc), type: tipoBaseLc };
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

    const funcCallMatchRHS = exprStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/); // Nombres con acentos
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

    const accesoArregloMatch = destinoStrOriginal.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/); // Nombres con acentos
    if (accesoArregloMatch) {
        const nombreArrOriginal = accesoArregloMatch[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreArrLc)) throw new Error(`Arreglo '${nombreArrOriginal}' no definido (línea ${numLineaOriginal}).`);
        const arrMeta = ambitoActual[nombreArrLc];
        if (arrMeta.type !== 'array') throw new Error(`Variable '${nombreArrOriginal}' no es arreglo (línea ${numLineaOriginal}).`);

        const indiceExprs = accesoArregloMatch[2].split(',').map(s => s.trim());
        if (indiceExprs.some(s => s === "")) throw new Error(`Índice vacío para '${nombreArrOriginal}' (línea ${numLineaOriginal}).`);
        if (indiceExprs.length !== arrMeta.dimensions.length) throw new Error(`Dimensiones incorrectas para '${nombreArrOriginal}'. Esperadas ${arrMeta.dimensions.length}, recibidas ${indiceExprs.length} (línea ${numLineaOriginal}).`);

        const evalIndices = [];
        for (let k = 0; k < indiceExprs.length; k++) {
            let idxVal = await Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], ambitoActual);
            if (typeof idxVal !== 'number' || (!Number.isInteger(idxVal) && Math.floor(idxVal) !== idxVal)) throw new Error(`Índice para dim ${k+1} de '${nombreArrOriginal}' debe ser entero. Se obtuvo '${indiceExprs[k]}' (${idxVal}) (línea ${numLineaOriginal}).`);
            idxVal = Math.trunc(idxVal);
            if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) throw new Error(`Índice [${idxVal}] fuera de límites para dim ${k+1} de '${nombreArrOriginal}' (1..${arrMeta.dimensions[k]}) (línea ${numLineaOriginal}).`);
            evalIndices.push(idxVal);
        }
        let targetLevel = arrMeta.value;
        for (let k = 0; k < evalIndices.length - 1; k++) {
            if (!targetLevel || !targetLevel[evalIndices[k]]) throw new Error(`Error interno accediendo sub-arreglo de '${nombreArrOriginal}' (línea ${numLineaOriginal}).`);
            targetLevel = targetLevel[evalIndices[k]];
        }
        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestinoParaConversion = arrMeta.baseType;
        if (arrMeta.isFlexibleType === true && arrMeta.baseType === 'entero' && (tipoValorEntrante === 'cadena' || tipoValorEntrante === 'caracter')) {
            arrMeta.baseType = 'cadena';
            tipoDestinoParaConversion = 'cadena';
            arrMeta.isFlexibleType = false;
            Webgoritmo.Interprete.convertirElementosArrayAString(arrMeta.value, arrMeta.dimensions);
            if(Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' (como '${nombreArrLc}') cambió tipo base a 'Cadena' (fijo) en línea ${numLineaOriginal}.`, 'normal');
        }
        targetLevel[evalIndices[evalIndices.length - 1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoParaConversion);
    } else {
        const nombreVarOriginal = destinoStrOriginal;
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Variable '${nombreVarOriginal}' no definida (línea ${numLineaOriginal}).`);
        const varMeta = ambitoActual[nombreVarLc];
        if (varMeta.type === 'array') throw new Error(`No se puede asignar a arreglo '${nombreVarOriginal}' sin índices (línea ${numLineaOriginal}).`);
        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, varMeta.type);
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
        for (let i = 0; i < cadenaArgs.length; i++) {
            const char = cadenaArgs[i];
            if (char === '"' && (i === 0 || cadenaArgs[i-1] !== '\\')) dentroDeComillasDobles = !dentroDeComillasDobles;
            else if (char === "'" && (i === 0 || cadenaArgs[i-1] !== '\\')) dentroDeComillasSimples = !dentroDeComillasSimples;
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
    if (typeof condicionPrincipalVal !== 'boolean') throw new Error(`Condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi} debe ser lógica, se obtuvo: ${condicionPrincipalVal}.`);

    let bloqueEntonces = [], bloqueSino = { cuerpo: [], lineaOriginal: -1 };
    let bufferBloqueActual = bloqueEntonces, siAnidados = 0, i = indiceEnBloque + 1;
    let numLineaGlobalActualBase = numLineaOriginalSi - (indiceEnBloque + 1);

    while (i < lineasBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return i;
        const lineaIterOriginal = lineasBloque[i];
        const lineaIter = lineaIterOriginal.trim(), lineaIterLower = lineaIter.toLowerCase();
        const numLineaGlobalIter = numLineaGlobalActualBase + i + 1;

        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) {
            siAnidados++; bufferBloqueActual.push(lineaIterOriginal);
        } else if (lineaIterLower === "finsi") {
            if (siAnidados > 0) { siAnidados--; bufferBloqueActual.push(lineaIterOriginal); }
            else { i++; break; }
        } else if (siAnidados === 0) {
            if (lineaIterLower === "sino") {
                if (bufferBloqueActual === bloqueSino.cuerpo) throw new Error(`Múltiples 'Sino' cerca de línea ${numLineaGlobalIter}.`);
                bloqueSino.lineaOriginal = numLineaGlobalIter;
                bufferBloqueActual = bloqueSino.cuerpo;
            } else { bufferBloqueActual.push(lineaIterOriginal); }
        } else { bufferBloqueActual.push(lineaIterOriginal); }
        i++;
    }
    if (i >= lineasBloque.length && siAnidados >=0 ) {
         if (!(siAnidados === 0 && lineasBloque[i-1] && lineasBloque[i-1].trim().toLowerCase() === "finsi")) {
            throw new Error(`Se esperaba 'FinSi' para cerrar bloque 'Si' de línea ${numLineaOriginalSi}.`);
         }
    }
    if (condicionPrincipalVal) {
        await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, numLineaOriginalSi);
    } else if (bloqueSino.cuerpo.length > 0 && !Webgoritmo.estadoApp.detenerEjecucion) {
        await Webgoritmo.Interprete.ejecutarBloque(bloqueSino.cuerpo, ambitoActual, bloqueSino.lineaOriginal > 0 ? bloqueSino.lineaOriginal : numLineaOriginalSi + bloqueEntonces.length);
    }
    return i - 1;
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaLeer = linea.match(/^Leer\s+(.+)/i);
    if (!coincidenciaLeer) throw new Error("Sintaxis 'Leer' incorrecta en línea " + numLineaOriginal);
    const nombresVariablesOriginales = coincidenciaLeer[1].split(',').map(v => v.trim());
    if (nombresVariablesOriginales.length === 0 || nombresVariablesOriginales.some(v => v === "")) throw new Error("Instrucción 'Leer' debe especificar variable(s) válidas en línea " + numLineaOriginal);

    for (const nombreVarOriginal of nombresVariablesOriginales) {
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) throw new Error(`Nombre de variable inválido '${nombreVarOriginal}' en 'Leer' en línea ${numLineaOriginal}.`); // Nombres con acentos
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Variable '${nombreVarOriginal}' no definida antes de 'Leer' en línea ${numLineaOriginal}.`);
        if (ambitoActual[nombreVarLc].type === 'array') throw new Error(`Lectura en arreglos completos no soportada ('Leer ${nombreVarOriginal}'). Línea ${numLineaOriginal}.`);
    }
    Webgoritmo.estadoApp.variableEntradaActual = nombresVariablesOriginales.map(n => n.toLowerCase());

    let promptMensaje = nombresVariablesOriginales.length === 1 ? `Ingrese valor para ${nombresVariablesOriginales[0]}:` : `Ingrese ${nombresVariablesOriginales.length} valores (separados por espacio/coma) para ${nombresVariablesOriginales.join(', ')}:`;
    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') {
        window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMensaje);
    } else {
        console.error("motorInterprete.js: solicitarEntradaUsuario no disponible.");
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(promptMensaje, 'input-prompt');
            Webgoritmo.UI.añadirSalida("[Error Interno: UI de input no disponible.]", 'error');
        }
    }
    Webgoritmo.estadoApp.esperandoEntrada = true;
    console.log(`handleLeer: Esperando entrada para: ${nombresVariablesOriginales.join(', ')}`);
    await new Promise(resolve => { Webgoritmo.estadoApp.resolverPromesaEntrada = resolve; if (Webgoritmo.estadoApp.detenerEjecucion) resolve(); });
    console.log("handleLeer: Promesa de entrada resuelta.");
    if (Webgoritmo.estadoApp.detenerEjecucion) return true;
    return true;
};

Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) {
        console.error("ejecutarBloque: Módulos esenciales no definidos."); return;
    }
    let i = 0;
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("Ejecución detenida en ejecutarBloque."); break; }
        const lineaOriginal = lineasBloqueParam[i];
        let lineaTrimmed = lineaOriginal.trim();
        const numLineaGlobal = numLineaOriginalOffset + i + 1;

        const commentIndex = lineaTrimmed.indexOf('//');
        if (commentIndex !== -1) lineaTrimmed = lineaTrimmed.substring(0, commentIndex).trim();
        if (lineaTrimmed.startsWith('/*') && lineaTrimmed.endsWith('*/')) lineaTrimmed = '';

        Webgoritmo.estadoApp.currentLineInfo = { numLineaOriginal: numLineaGlobal, contenido: lineaTrimmed };

        console.log(`MOTOR DEBUG: Procesando línea ${numLineaGlobal} (post-comment strip): "${lineaTrimmed}"`);
        if (lineaTrimmed === '') { i++; continue; }

        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();
            const matchEscribirDirecto = lineaLower.match(/^(?:escribir|imprimir|mostrar)\s+.+/);

            if (lineaLower.startsWith('definir ')) {
                instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('dimension ') || lineaLower.startsWith('dimensionar ')) {
                instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaTrimmed, ambitoActual, numLineaGlobal);
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
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleRepetir(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque;
                instruccionManejada = true;
            } else if (lineaLower.startsWith('segun ') && lineaLower.includes(' hacer')) {
                const { nuevoIndiceRelativoAlBloque } = await Webgoritmo.Interprete.handleSegun(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque;
                instruccionManejada = true;
            } else if (lineaLower.startsWith('leer ')) {
                instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (matchEscribirDirecto) {
                instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\[.+?\])?)\s*(?:<-|=)/)) { // Asignación (más específica)
                instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else {
                const callMatch = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/); // Nombres con acentos
                if (callMatch) {
                    const callNameOriginal = callMatch[1];
                    const callNameLc = callNameOriginal.toLowerCase();
                    const argsStr = callMatch[2];
                    let argExprsCall = argsStr.trim() === '' ? [] : argsStr.split(',').map(a => a.trim());

                    if (Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(callNameLc)) {
                        await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(callNameOriginal, argExprsCall, ambitoActual, numLineaGlobal);
                        instruccionManejada = true;
                    } else if (Webgoritmo.Builtins && Webgoritmo.Builtins.funciones.hasOwnProperty(callNameLc)) {
                        console.warn(`[ejecutarBloque] ADVERTENCIA línea ${numLineaGlobal}: Función predefinida '${callNameOriginal}' llamada como procedimiento. Valor de retorno ignorado.`);
                        const evaluadosArgs = [];
                        for (const argExpr of argExprsCall) {
                            evaluadosArgs.push(await Webgoritmo.Expresiones.evaluarExpresion(argExpr, ambitoActual));
                        }
                        Webgoritmo.Builtins.funciones[callNameLc](evaluadosArgs, numLineaGlobal);
                        instruccionManejada = true;
                    }
                }
            }
            if (!instruccionManejada && lineaTrimmed && !/^(finsi|sino|finmientras|finpara|finsubproceso|finsegun|hasta que)$/.test(lineaLower.split(/\s+/)[0])) {
                 if(!lineaLower.startsWith("hasta que")) {
                    throw new Error(`Instrucción no reconocida o mal ubicada: '${lineaTrimmed}'`);
                 }
            }
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = e.message.startsWith(`Error en línea ${numLineaGlobal}`) ? e.message : `Error en línea ${numLineaGlobal}: ${e.message}`;
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
    if (typeof condicionVal !== 'boolean') throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica.`);

    while (condicionVal && !Webgoritmo.estadoApp.detenerEjecucion) {
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoMientras, ambitoActual, numLineaOriginalMientras);
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
        if (typeof condicionVal !== 'boolean') throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica.`);
    }
    return { nuevoIndiceRelativoAlBloque: i };
};

Webgoritmo.Interprete.handleRepetir = async function(lineaActual, ambitoActual, numLineaOriginalRepetir, lineasBloqueCompleto, indiceRepetirEnBloque) {
    let cuerpoRepetir = [];
    let condicionHastaQueStr = null;
    let numLineaOriginalHastaQue = -1;
    let finBloqueEncontrado = false;
    let anidamientoRepetir = 0;
    let i = indiceRepetirEnBloque + 1;
    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIterOriginal = lineasBloqueCompleto[i];
        let lineaIterAnalisis = lineaIterOriginal.split('//')[0].trim();
        if(lineaIterAnalisis.startsWith('/*') && lineaIterAnalisis.endsWith('*/')) lineaIterAnalisis = '';
        const lineaIterLower = lineaIterAnalisis.toLowerCase();
        if (lineaIterLower.startsWith("repetir")) { anidamientoRepetir++; cuerpoRepetir.push(lineaIterOriginal); }
        else {
            const hastaQueMatch = lineaIterAnalisis.match(/^Hasta Que\s+(.+)/i);
            if (hastaQueMatch) {
                if (anidamientoRepetir === 0) {
                    condicionHastaQueStr = hastaQueMatch[1].trim();
                    numLineaOriginalHastaQue = numLineaOriginalRepetir + (i - indiceRepetirEnBloque);
                    finBloqueEncontrado = true; break;
                } else { anidamientoRepetir--; cuerpoRepetir.push(lineaIterOriginal); }
            } else { cuerpoRepetir.push(lineaIterOriginal); }
        }
    }
    if (!finBloqueEncontrado) throw new Error(`Se esperaba 'Hasta Que <condicion>' para cerrar 'Repetir' de línea ${numLineaOriginalRepetir}.`);
    if (!condicionHastaQueStr) throw new Error(`'Hasta Que' en línea ${numLineaOriginalHastaQue} debe tener condición.`);

    let condicionVal;
    do {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoRepetir, ambitoActual, numLineaOriginalRepetir);
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionHastaQueStr, ambitoActual);
        if (typeof condicionVal !== 'boolean') throw new Error(`Condición 'Hasta Que' ("${condicionHastaQueStr}") en línea ${numLineaOriginalHastaQue} debe ser lógica.`);
    } while (!condicionVal && !Webgoritmo.estadoApp.detenerEjecucion);
    return { nuevoIndiceRelativoAlBloque: i };
};

Webgoritmo.Interprete.reanudarBuclePendiente = async function() { /* ... (Esta función puede necesitar revisión o ser eliminada si el async/await es suficiente) ... */ };

Webgoritmo.Interprete.handlePara = async function(lineaActual, ambitoActual, numLineaOriginalPara, lineasBloqueCompleto, indiceParaEnBloque) {
    const paraMatch = lineaActual.match(/^Para\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i);
    if (!paraMatch) throw new Error(`Sintaxis 'Para' incorrecta en línea ${numLineaOriginalPara}. Detalles: '${lineaActual}'`);

    const varControlOriginal = paraMatch[1];
    const varControlLc = varControlOriginal.toLowerCase();
    const valorInicialExpr = paraMatch[2];
    const valorFinalExpr = paraMatch[3];
    const valorPasoExpr = paraMatch[4];

    let valorInicial = await Webgoritmo.Expresiones.evaluarExpresion(valorInicialExpr, ambitoActual);
    let valorFinal = await Webgoritmo.Expresiones.evaluarExpresion(valorFinalExpr, ambitoActual);
    let paso = valorPasoExpr ? await Webgoritmo.Expresiones.evaluarExpresion(valorPasoExpr, ambitoActual) : (valorFinal >= valorInicial ? 1 : -1);

    if (typeof valorInicial !== 'number' || typeof valorFinal !== 'number' || typeof paso !== 'number') throw new Error(`Límites y paso de 'Para' deben ser numéricos (línea ${numLineaOriginalPara}).`);
    if (paso === 0) throw new Error(`Paso de 'Para' no puede ser cero (línea ${numLineaOriginalPara}).`);

    if (!ambitoActual.hasOwnProperty(varControlLc)) {
        const tipoImplicito = (Number.isInteger(valorInicial) && Number.isInteger(valorFinal) && Number.isInteger(paso)) ? 'entero' : 'real';
        ambitoActual[varControlLc] = { value: valorInicial, type: tipoImplicito, isFlexibleType: false }; // Loop vars are fixed type
        if(Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO línea ${numLineaOriginalPara}]: Variable de control '${varControlOriginal}' (como '${varControlLc}') definida implícitamente como ${tipoImplicito}.`, 'normal');
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
        if (lineaIter.startsWith("para ") && lineaIter.includes(" hacer")) { anidamientoPara++; cuerpoPara.push(lineaIterOriginal); }
        else if (lineaIter === "finpara") {
            if (anidamientoPara === 0) { finParaEncontrado = true; break; }
            else { anidamientoPara--; cuerpoPara.push(lineaIterOriginal); }
        } else { cuerpoPara.push(lineaIterOriginal); }
    }
    if (!finParaEncontrado) throw new Error(`Se esperaba 'FinPara' para cerrar bucle 'Para' de línea ${numLineaOriginalPara}.`);

    while ((paso > 0 && variableControlObj.value <= valorFinal) || (paso < 0 && variableControlObj.value >= valorFinal)) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoPara, ambitoActual, numLineaOriginalPara);
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        variableControlObj.value += paso;
    }
    return { nuevoIndiceRelativoAlBloque: i };
};

Webgoritmo.Interprete.handleSegun = async function(lineaActual, ambitoActual, numLineaOriginalSegun, lineasBloqueCompleto, indiceSegunEnBloque) {
    const segunMatch = lineaActual.match(/^Segun\s+(.+?)\s+Hacer$/i);
    if (!segunMatch) throw new Error(`Sintaxis 'Segun' incorrecta en línea ${numLineaOriginalSegun}.`);
    const expresionAEvaluarStr = segunMatch[1].trim();
    let valorSegun = await Webgoritmo.Expresiones.evaluarExpresion(expresionAEvaluarStr, ambitoActual);

    let casos = [];
    let deOtroModo = { cuerpo: [], lineaOriginal: -1, encontrado: false };
    let bufferBloqueActual = null;
    let anidamientoSegun = 0;
    let i = indiceSegunEnBloque + 1;
    let numLineaGlobalActualBase = numLineaOriginalSegun - (indiceSegunEnBloque + 1);

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIterOriginal = lineasBloqueCompleto[i];
        const lineaIterTrimmed = lineaIterOriginal.trim();
        const lineaIterTrimmedLower = lineaIterTrimmed.toLowerCase();
        const numLineaGlobalIter = numLineaGlobalActualBase + i + 1;

        if (lineaIterTrimmedLower.startsWith("segun ") && lineaIterTrimmedLower.includes(" hacer")) {
            anidamientoSegun++; if (bufferBloqueActual) bufferBloqueActual.push(lineaIterOriginal); else throw new Error(`'Segun' anidado inesperado línea ${numLineaGlobalIter}.`); continue;
        }
        if (lineaIterTrimmedLower === "finsegun") {
            if (anidamientoSegun === 0) { bufferBloqueActual = null; break; }
            else { anidamientoSegun--; if (bufferBloqueActual) bufferBloqueActual.push(lineaIterOriginal); else throw new Error(`'FinSegun' anidado inesperado línea ${numLineaGlobalIter}.`); continue; }
        }
        if (anidamientoSegun > 0) { if (bufferBloqueActual) bufferBloqueActual.push(lineaIterOriginal); else throw new Error(`Línea ${numLineaGlobalIter} en 'Segun' anidado fuera de bloque 'Caso'.`); continue; }

        const casoMatch = lineaIterTrimmed.match(/^(?:Caso|Opcion)\s+(.+?)\s*:/i);
        if (casoMatch) {
            bufferBloqueActual = [];
            const valoresCasoStr = casoMatch[1];
            let valoresCaso = [];
            const partesValores = valoresCasoStr.split(',').map(v => v.trim()); // TODO: Robust comma split
            for (const parte of partesValores) {
                if (parte.match(/^".*"$/) || parte.match(/^'.*'$/)) valoresCaso.push(parte.substring(1, parte.length - 1));
                else if (!isNaN(parseFloat(parte)) && isFinite(parte)) valoresCaso.push(parseFloat(parte));
                else valoresCaso.push(await Webgoritmo.Expresiones.evaluarExpresion(parte, ambitoActual));
            }
            casos.push({ valores: valoresCaso, cuerpo: bufferBloqueActual, lineaOriginal: numLineaGlobalIter });
        } else if (lineaIterTrimmedLower === "de otro modo:") {
            if (deOtroModo.encontrado) throw new Error(`Múltiples 'De Otro Modo' (línea ${deOtroModo.lineaOriginal}).`);
            deOtroModo.encontrado = true; deOtroModo.lineaOriginal = numLineaGlobalIter; bufferBloqueActual = deOtroModo.cuerpo;
        } else {
            if (bufferBloqueActual) bufferBloqueActual.push(lineaIterOriginal);
            else if (lineaIterTrimmed !== "") console.warn(`[ADVERTENCIA línea ${numLineaGlobalIter}]: Línea '${lineaIterTrimmed}' ignorada.`);
        }
    }
    if (i >= lineasBloqueCompleto.length && !(lineasBloqueCompleto[i-1] && lineasBloqueCompleto[i-1].trim().toLowerCase() === "finsegun") ) throw new Error(`Se esperaba 'FinSegun' para cerrar 'Segun' de línea ${numLineaOriginalSegun}.`);

    let casoEjecutado = false;
    for (const caso of casos) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        if (caso.valores.some(valorCaso => valorSegun == valorCaso)) { // '==' for type coercion
            await Webgoritmo.Interprete.ejecutarBloque(caso.cuerpo, ambitoActual, caso.lineaOriginal);
            casoEjecutado = true; break;
        }
    }
    if (!casoEjecutado && deOtroModo.encontrado && !Webgoritmo.estadoApp.detenerEjecucion) {
        await Webgoritmo.Interprete.ejecutarBloque(deOtroModo.cuerpo, ambitoActual, deOtroModo.lineaOriginal);
    }
    return { nuevoIndiceRelativoAlBloque: i };
};

Webgoritmo.Interprete.ejecutarSubProcesoLlamada = async function(nombreFuncionOriginal, listaExprArgumentos, ambitoLlamador, numLineaOriginalLlamada) {
    const nombreFuncionLc = nombreFuncionOriginal.toLowerCase();
    if (!Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(nombreFuncionLc)) throw new Error(`Error línea ${numLineaOriginalLlamada}: SubProceso '${nombreFuncionOriginal}' no definido.`);

    const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[nombreFuncionLc];
    if (listaExprArgumentos.length !== defFuncion.parametros.length) throw new Error(`Error línea ${numLineaOriginalLlamada}: Args para '${defFuncion.nombreOriginal}'. Esperados ${defFuncion.parametros.length}, recibidos ${listaExprArgumentos.length}.`);

    if (!Webgoritmo.estadoApp.pilaLlamadas) Webgoritmo.estadoApp.pilaLlamadas = [];
    Webgoritmo.estadoApp.pilaLlamadas.push({ nombre: defFuncion.nombreOriginal, lineaLlamada: numLineaOriginalLlamada, lineaDefinicion: defFuncion.lineaOriginalDef });

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
        const ambitoLocal = Object.create(Webgoritmo.estadoApp.variables);

        // Inicializar variable de retorno en el ámbito local (si es una función)
        if (defFuncion.retornoVarLc) {
            ambitoLocal[defFuncion.retornoVarLc] = {
                value: Webgoritmo.Interprete.obtenerValorPorDefecto('entero'),
                type: 'entero',
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
                let tipoParametroDestino = paramDef.tipo;
                if (paramDef.tipo === 'desconocido') {
                    tipoParametroDestino = Webgoritmo.Interprete.inferirTipo(valorArgumento).toLowerCase();
                    if (tipoParametroDestino === 'desconocido' && valorArgumento !== null) tipoParametroDestino = 'real';
                    else if (valorArgumento === null) tipoParametroDestino = 'real';
                }
                let valorParametroFinal = Webgoritmo.Interprete.convertirValorParaAsignacion(valorArgumento, tipoParametroDestino);
                ambitoLocal[paramDef.nombreLc] = { value: valorParametroFinal, type: tipoParametroDestino, isFlexibleType: false };

                if (ambitoLocal[paramDef.nombreLc].type === 'array' && valorArgumento ) {
                     const argOriginalMetadata = ambitoLlamador.hasOwnProperty(nombreVarArgLc) ? ambitoLlamador[nombreVarArgLc] : null;
                     if (argOriginalMetadata && argOriginalMetadata.type === 'array') {
                        console.warn(`ADVERTENCIA: Paso de arreglos por valor es superficial para '${paramDef.nombreOriginal}' en '${defFuncion.nombreOriginal}'.`);
                        // ambitoLocal[paramDef.nombreLc].value = JSON.parse(JSON.stringify(argOriginalMetadata.value)); // Simple deep copy, has limitations
                        // TODO: Implement proper deep copy for PSeInt array structure
                        ambitoLocal[paramDef.nombreLc].dimensions = [...argOriginalMetadata.dimensions];
                        ambitoLocal[paramDef.nombreLc].baseType = argOriginalMetadata.baseType;
                        ambitoLocal[paramDef.nombreLc].isFlexibleType = argOriginalMetadata.isFlexibleType;
                        // For true by-value, a deep copy of .value is needed.
                     }
                }
            }
        }
        await Webgoritmo.Interprete.ejecutarBloque(defFuncion.cuerpo, ambitoLocal, defFuncion.lineaOriginalDef -1);
        if (defFuncion.retornoVarLc) {
            if (!ambitoLocal.hasOwnProperty(defFuncion.retornoVarLc)) throw new Error(`Error en SubProceso '${defFuncion.nombreOriginal}': Variable de retorno '${defFuncion.retornoVarOriginal}' no asignada.`);
            return ambitoLocal[defFuncion.retornoVarLc].value;
        }
        return undefined;
    } finally {
        if (Webgoritmo.estadoApp.pilaLlamadas && Webgoritmo.estadoApp.pilaLlamadas.length > 0) Webgoritmo.estadoApp.pilaLlamadas.pop();
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
                    if (Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(defSubProceso.nombreLc)) throw new Error(`SubProceso '${defSubProceso.nombreOriginal}' ya definido.`);
                    Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc] = defSubProceso;
                    for (let k = i; k <= defSubProceso.indiceFinEnTodasLasLineas; k++) subProcesoLineIndices.add(k);
                    i = defSubProceso.indiceFinEnTodasLasLineas;
                } catch (e) { Webgoritmo.estadoApp.errorEjecucion = e.message; Webgoritmo.estadoApp.detenerEjecucion = true; break; }
            }
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
        }
    } else console.warn("parseDefinicionSubProceso no definido.");

    if (Webgoritmo.estadoApp.detenerEjecucion) {
        if (Webgoritmo.UI.añadirSalida) { Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error'); Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase 1) ---", "error"); }
        return;
    }

    let lineasDelPrincipal = [];
    let inicioBloquePrincipalLineaNum = -1;
    let processingState = 'buscar_inicio';
    Webgoritmo.estadoApp.errorEjecucion = null;
    Webgoritmo.estadoApp.detenerEjecucion = false;

    for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) {
        if (subProcesoLineIndices.has(j)) continue;
        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[j];
        let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
        if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
        const lineaLower = lineaParaAnalisis.toLowerCase();

        if (processingState === 'buscar_inicio') {
            if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                inicioBloquePrincipalLineaNum = j + 1; // Linea 1-based
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
        const tieneCodigoEfectivo = Webgoritmo.estadoApp.lineasCodigo.some(l => { let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';});
        if (processingState === 'buscar_inicio' && tieneCodigoEfectivo) Webgoritmo.estadoApp.errorEjecucion = "No se encontró bloque 'Algoritmo'/'Proceso' principal.";
        else if (processingState === 'en_bloque') Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo'/'Proceso' iniciado línea ${inicioBloquePrincipalLineaNum} no fue cerrado.`;
    }

    if (Webgoritmo.estadoApp.errorEjecucion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        Webgoritmo.estadoApp.detenerEjecucion = true;
    } else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (lineasDelPrincipal.length > 0) {
            await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 ); // Offset 0-based
        } else if (Webgoritmo.UI.añadirSalida) {
             Webgoritmo.UI.añadirSalida("Advertencia: Bloque Algoritmo/Proceso vacío.", "warning");
        }
    } else if (inicioBloquePrincipalLineaNum === -1 && !Webgoritmo.estadoApp.lineasCodigo.some(l => {let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';})) {
        // No code at all, not an error.
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
            Webgoritmo.UI.añadirSalida(mensajeErrorCompleto, 'error'); // Muestra el error principal y la pila
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
        } else if (Webgoritmo.estadoApp.detenerEjecucion) {
            Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida ---", "warning");
        } else {
            Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
        }
    }
};

console.log("motorInterprete.js cargado y Webgoritmo.Interprete inicializado (con handleSi y handleLeer).");

[end of motorInterprete.js]
