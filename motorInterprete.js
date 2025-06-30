// motorInterprete.js - Reconstrucción Incremental - Bloque 5 (Si-Entonces-Sino)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE (Bloques 1-4) ---
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
        return 'cadena';
    }
    return 'desconocido';
};

Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    const tipoDestinoLower = String(tipoDestino).toLowerCase();
    if (valor === null || typeof valor === 'undefined') {
        // Manejo específico podría ser necesario si esto ocurre inesperadamente.
    }
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();

    if (tipoOrigen === tipoDestinoLower && tipoDestinoLower !== 'desconocido') return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return parseFloat(valor);
    if (tipoDestinoLower === 'numero') {
        if (tipoOrigen === 'entero' || tipoOrigen === 'real') return valor;
    }
    if (tipoDestinoLower === 'cadena') {
        if (typeof valor === 'boolean') return valor ? 'Verdadero' : 'Falso';
        return String(valor);
    }
    if (tipoDestinoLower === 'caracter') {
        if (typeof valor === 'string' && valor.length > 0) return valor.charAt(0);
        if (typeof valor === 'string' && valor.length === 0) return '';
    }

    if (typeof valor === 'string') {
        const valTrimmed = valor.trim();
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valTrimmed, 10);
                if (isNaN(intVal) || !/^-?\d+$/.test(valTrimmed) ) throw new Error(`La cadena '${valor}' no es un entero válido para la conversión.`);
                return intVal;
            case 'real':
            case 'numero':
                if (valTrimmed === "") throw new Error(`La cadena vacía no es un número real válido para Leer.`);
                const numRepresentation = parseFloat(valTrimmed);
                 if (isNaN(numRepresentation) || !isFinite(numRepresentation) || (!/^-?\d*(\.\d+)?$/.test(valTrimmed) && !/^-?\d+\.?$/.test(valTrimmed)) ) {
                     if (valTrimmed.match(/^-?\d*\.$/)) {} else if (valTrimmed.match(/^-?\.\d+$/)) {}
                     else throw new Error(`La cadena '${valor}' no es un número real válido para la conversión.`);
                }
                return numRepresentation;
            case 'logico':
                const lowerVal = valTrimmed.toLowerCase();
                if (lowerVal === 'verdadero' || lowerVal === 'v') return true;
                if (lowerVal === 'falso' || lowerVal === 'f') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
        }
    } else if (typeof valor === 'number') {
        switch (tipoDestinoLower) {
            case 'entero': return Math.trunc(valor);
            case 'real': return valor;
            case 'numero': return valor;
            case 'logico': throw new Error(`No se puede convertir directamente un número (${valor}) a lógico. Use una comparación.`);
        }
    } else if (typeof valor === 'boolean') {
         switch (tipoDestinoLower) {
            case 'entero': return valor ? 1 : 0;
            case 'real': return valor ? 1.0 : 0.0;
            case 'numero': return valor ? 1 : 0;
            case 'logico': return valor;
        }
    }
    throw new Error(`Incompatibilidad de tipo: no se puede convertir '${tipoOrigen}' (valor: "${valor}") a '${tipoDestinoLower}'.`);
};

Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType) {
    const defaultValue = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType);
    function crearDimension(dimIndex) {
        const dimensionSize = dimensions[dimIndex];
        if (typeof dimensionSize !== 'number' || !Number.isInteger(dimensionSize) || dimensionSize <= 0) throw new Error(`Las dimensiones de un arreglo deben ser números enteros positivos. Se encontró: ${dimensionSize}.`);
        let arr = new Array(dimensionSize + 1);
        if (dimIndex === dimensions.length - 1) { for (let i = 1; i <= dimensionSize; i++) arr[i] = defaultValue; }
        else { for (let i = 1; i <= dimensionSize; i++) arr[i] = crearDimension(dimIndex + 1); }
        return arr;
    }
    if (!dimensions || dimensions.length === 0) throw new Error("No se pueden inicializar arreglos sin dimensiones.");
    return crearDimension(0);
};

Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaInicioSubProceso, indiceInicio, todasLasLineas) {
    // ... (código de Bloques anteriores, sin cambios)
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
    // ... (código de Bloques anteriores, sin cambios)
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s*\[\s*(.+?)\s*\])?$/i);
    if (!coincidenciaDefinir) return false;
    const nombresVariablesOriginales = coincidenciaDefinir[1].split(',').map(s => s.trim());
    const tipoBaseStr = coincidenciaDefinir[2];
    const dimsStr = coincidenciaDefinir[3];
    let tipoBaseLc = tipoBaseStr.toLowerCase();
    const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena', 'numero', 'número', 'numerico', 'numérico'];
    if (!tiposConocidos.includes(tipoBaseLc)) throw new Error(`Tipo '${tipoBaseStr}' no reconocido en línea ${numLineaOriginal}.`);
    if (tipoBaseLc.startsWith("num")) tipoBaseLc = "numero";
    for (const nombreOriginal of nombresVariablesOriginales) {
        if (nombreOriginal === "") throw new Error(`Nombre de variable vacío en 'Definir' en línea ${numLineaOriginal}.`);
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreOriginal)) throw new Error(`Nombre de variable inválido '${nombreOriginal}' en 'Definir' en línea ${numLineaOriginal}.`);
        const nombreLc = nombreOriginal.toLowerCase();
        if (ambitoActual.hasOwnProperty(nombreLc)) if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA línea ${numLineaOriginal}]: Variable '${nombreOriginal}' ya definida. Se sobrescribirá.`, 'warning');
        if (dimsStr) {
            const dimExprs = dimsStr.split(',').map(s => s.trim());
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}' (evaluado a ${dimVal}) para '${nombreOriginal}' línea ${numLineaOriginal}.`);
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = { type: 'array', baseType: tipoBaseLc, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc), isFlexibleType: tipoBaseLc === 'numero', name: nombreOriginal };
            if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreOriginal}'(${tipoBaseLc}) dimensionado con [${evalDimensiones.join(',')}] en línea ${numLineaOriginal}.`, 'normal');
        } else {
            ambitoActual[nombreLc] = { value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc), type: tipoBaseLc, isFlexibleType: tipoBaseLc === 'numero', name: nombreOriginal };
            if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Variable '${nombreOriginal}'(${tipoBaseLc}) definida en línea ${numLineaOriginal}.`, 'normal');
        }
    }
    return true;
};

Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) {
    // ... (código de Bloques anteriores, sin cambios)
    let keyword = linea.trim().toLowerCase().startsWith("dimensionar") ? "Dimensionar" : "Dimension";
    let declaracionStr = linea.trim().substring(keyword.length).trim();
    if (declaracionStr === "") throw new Error(`Declaración '${keyword}' vacía en línea ${numLineaOriginal}.`);
    const declaracionesIndividuales = declaracionStr.split(',');
    for (let decl of declaracionesIndividuales) {
        decl = decl.trim();
        const matchArr = decl.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/i);
        if (!matchArr) throw new Error(`Sintaxis incorrecta para '${decl}' en '${keyword}' en línea ${numLineaOriginal}.`);
        const nombreArrOriginal = matchArr[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        const baseTypeParaArray = 'numero'; const isFlexibleType = true;
        if (ambitoActual.hasOwnProperty(nombreArrLc)) if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA línea ${numLineaOriginal}]: Arreglo '${nombreArrOriginal}' ya definido. Sobrescribiendo.`, 'warning');
        const dimExprs = matchArr[2].split(',').map(s => s.trim());
        const evalDimensiones = [];
        for (const expr of dimExprs) {
            let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
            if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}' (evaluado a ${dimVal}) para '${nombreArrOriginal}' línea ${numLineaOriginal}.`);
            evalDimensiones.push(dimVal);
        }
        ambitoActual[nombreArrLc] = { type: 'array', baseType: baseTypeParaArray, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, baseTypeParaArray), isFlexibleType: isFlexibleType, name: nombreArrOriginal };
        if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' (${baseTypeParaArray}) dimensionado con [${evalDimensiones.join(',')}] usando '${keyword}' en línea ${numLineaOriginal}.`, 'normal');
    }
    return true;
};

Webgoritmo.Interprete.handleEscribir = async function(linea, ambitoActual, numLineaOriginal) {
    // ... (código de Bloques anteriores, sin cambios)
    const regexEscribir = /^(Escribir|Imprimir|Mostrar)\s+(.*)/i;
    const coincidenciaEscribir = linea.match(regexEscribir);
    if (!coincidenciaEscribir) return false;
    const cadenaArgs = coincidenciaEscribir[2]; const args = []; let buffer = "";
    let dentroDeComillasDobles = false; let dentroDeComillasSimples = false;
    for (let k = 0; k < cadenaArgs.length; k++) {
        const char = cadenaArgs[k];
        if (char === '"' && (k === 0 || cadenaArgs[k-1] !== '\\')) dentroDeComillasDobles = !dentroDeComillasDobles;
        else if (char === "'" && (k === 0 || cadenaArgs[k-1] !== '\\')) dentroDeComillasSimples = !dentroDeComillasSimples;
        if (char === ',' && !dentroDeComillasDobles && !dentroDeComillasSimples) { args.push(buffer.trim()); buffer = ""; }
        else buffer += char;
    }
    args.push(buffer.trim()); let partesMensajeSalida = [];
    for (const arg of args) {
        if(arg === "") continue;
        const parteEvaluada = await Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
        partesMensajeSalida.push( (typeof parteEvaluada === 'boolean') ? (parteEvaluada ? 'Verdadero' : 'Falso') : (parteEvaluada === null ? 'nulo' : String(parteEvaluada)) );
    }
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal');
    return true;
};

Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) {
    // ... (código de Bloques anteriores, sin cambios)
    const asignacionMatch = linea.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.*)$/);
    if (!asignacionMatch) return false;
    const destinoStrOriginal = asignacionMatch[1].trim(); const exprStr = asignacionMatch[2].trim();
    if (exprStr === "") throw new Error(`Expresión vacía en asignación en línea ${numLineaOriginal}.`);
    let valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprStr, ambitoActual);
    const accesoArregloMatch = destinoStrOriginal.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);
    if (accesoArregloMatch) {
        const nombreArrOriginal = accesoArregloMatch[1]; const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreArrLc) || ambitoActual[nombreArrLc].type !== 'array') throw new Error(`Arreglo '${nombreArrOriginal}' no definido o no es un arreglo (línea ${numLineaOriginal}).`);
        const arrMeta = ambitoActual[nombreArrLc]; const indiceExprs = accesoArregloMatch[2].split(',').map(s => s.trim());
        if (indiceExprs.some(s => s === "")) throw new Error(`Índice vacío para '${nombreArrOriginal}' (línea ${numLineaOriginal}).`);
        if (indiceExprs.length !== arrMeta.dimensions.length) throw new Error(`Dimensiones incorrectas para '${nombreArrOriginal}'. Esperadas ${arrMeta.dimensions.length}, recibidas ${indiceExprs.length} (línea ${numLineaOriginal}).`);
        const evalIndices = [];
        for (let k = 0; k < indiceExprs.length; k++) {
            let idxVal = await Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], ambitoActual);
            if (typeof idxVal !== 'number' || !Number.isInteger(idxVal) ) {
                 if (typeof idxVal === 'number' && idxVal === Math.trunc(idxVal)) idxVal = Math.trunc(idxVal);
                 else throw new Error(`Índice para '${nombreArrOriginal}' debe ser numérico entero. Se obtuvo '${indiceExprs[k]}' (evaluado a ${idxVal}) (línea ${numLineaOriginal}).`);
            }
            if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) throw new Error(`Índice [${idxVal}] fuera de límites para dimensión ${k+1} de '${nombreArrOriginal}' (1..${arrMeta.dimensions[k]}) (línea ${numLineaOriginal}).`);
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
             if (tipoValorEntrante !== 'desconocido' && tipoValorEntrante !== 'numero') {
                arrMeta.baseType = tipoValorEntrante; arrMeta.isFlexibleType = false;
                if(Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' fijó su tipo base a '${tipoValorEntrante}' en línea ${numLineaOriginal}.`, 'normal');
                tipoDestinoParaConversion = tipoValorEntrante;
             }
        }
        targetLevel[evalIndices[evalIndices.length - 1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoParaConversion);
    } else {
        const nombreVarOriginal = destinoStrOriginal;
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) throw new Error(`Nombre de variable inválido '${nombreVarOriginal}' en asignación en línea ${numLineaOriginal}.`);
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Variable '${nombreVarOriginal}' no definida antes de asignarle valor (línea ${numLineaOriginal}).`);
        const varMeta = ambitoActual[nombreVarLc];
        if (varMeta.type === 'array') throw new Error(`No se puede asignar un valor a un arreglo completo ('${nombreVarOriginal}') sin especificar índices (línea ${numLineaOriginal}).`);
        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestinoEscalar = varMeta.isFlexibleType && varMeta.type === 'numero' ? tipoValorEntrante : varMeta.type;
        if (varMeta.isFlexibleType && varMeta.type === 'numero') {
            if (tipoValorEntrante !== 'desconocido' && tipoValorEntrante !== 'numero') {
                varMeta.type = tipoValorEntrante; varMeta.isFlexibleType = false; tipoDestinoEscalar = tipoValorEntrante;
            }
        }
        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoEscalar);
    }
    return true;
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) {
    // ... (código de Bloque 4, sin cambios)
    const coincidenciaLeer = linea.match(/^Leer\s+(.+)/i);
    if (!coincidenciaLeer) throw new Error("Error interno: Fallo en coincidencia de 'Leer' en handleLeer. Línea: " + numLineaOriginal);
    const nombresOriginales = coincidenciaLeer[1].split(',').map(v => v.trim().toLowerCase());
    if (nombresOriginales.length === 0 || nombresOriginales.some(v => v === "")) throw new Error("Instrucción 'Leer' debe especificar variable(s) válidas en línea " + numLineaOriginal);
    for (const nombreVarLc of nombresOriginales) {
        const nombreVarOriginalParaPrompt = coincidenciaLeer[1].split(',').map(v => v.trim()).find(n => n.toLowerCase() === nombreVarLc) || nombreVarLc;
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarLc)) throw new Error(`Nombre de variable inválido '${nombreVarOriginalParaPrompt}' en 'Leer' en línea ${numLineaOriginal}.`);
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Variable '${nombreVarOriginalParaPrompt}' no definida antes de 'Leer' en línea ${numLineaOriginal}.`);
        if (ambitoActual[nombreVarLc].type === 'array') throw new Error(`Lectura en arreglos completos no soportada ('Leer ${nombreVarOriginalParaPrompt}'). Línea ${numLineaOriginal}.`);
    }
    const nombresOriginalesParaPrompt = coincidenciaLeer[1].split(',').map(v => v.trim());
    let promptMensaje = nombresOriginalesParaPrompt.length === 1 ? `Ingrese valor para ${nombresOriginalesParaPrompt[0]}:` : `Ingrese ${nombresOriginalesParaPrompt.length} valores (separados por espacio/coma) para ${nombresOriginalesParaPrompt.join(', ')}:`;
    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMensaje);
    else { console.error("motorInterprete.js: La función global solicitarEntradaUsuario no está disponible."); if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) { Webgoritmo.UI.añadirSalida(promptMensaje, 'input-prompt'); Webgoritmo.UI.añadirSalida("[Error Interno: No se pudo preparar el área de input.]", 'error');}}
    Webgoritmo.estadoApp.esperandoEntrada = true; Webgoritmo.estadoApp.variableEntradaActual = nombresOriginales; Webgoritmo.estadoApp.nombresOriginalesParaEntrada = nombresOriginalesParaPrompt;
    console.log(`handleLeer: Esperando entrada para: ${nombresOriginalesParaPrompt.join(', ')} (internamente: ${nombresOriginales.join(', ')})`);
    Webgoritmo.estadoApp.promesaEntradaPendiente = new Promise(resolve => { Webgoritmo.estadoApp.resolverPromesaEntrada = resolve; if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("handleLeer: Detención solicitada antes de esperar la promesa, resolviendo inmediatamente."); resolve(); }});
    await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    console.log("handleLeer: Promesa de entrada resuelta.");
    if (Webgoritmo.estadoApp.detenerEjecucion) { if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Lectura cancelada debido a interrupción.", "warning"); return true; }
    return true;
};

// --- NUEVA FUNCIÓN (Bloque 5) ---
Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloqueCompleto, indiceSiEnBloque) {
    const siMatch = lineaActual.match(/^Si\s+(.+?)\s+Entonces$/i);
    if (!siMatch) { // Esto no debería pasar si la regex en ejecutarBloque es la misma
        throw new Error(`Error interno: Fallo en coincidencia de 'Si' en handleSi. Línea: ${numLineaOriginalSi}.`);
    }
    const condicionPrincipalStr = siMatch[1];
    let condicionPrincipalVal;
    try {
        condicionPrincipalVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionPrincipalStr, ambitoActual);
    } catch (e) {
        throw new Error(`Error evaluando condición del 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi}: ${e.message}`);
    }

    if (typeof condicionPrincipalVal !== 'boolean') {
        throw new Error(`La condición del 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi} debe ser lógica, pero se evaluó a: ${condicionPrincipalVal} (tipo: ${typeof condicionPrincipalVal}).`);
    }

    let bloqueEntonces = [];
    let bloqueSino = [];
    let bufferBloqueActual = bloqueEntonces; // Empezamos recolectando para el bloque Entonces

    let siAnidados = 0; // Contador para manejar Si/FinSi anidados
    let i = indiceSiEnBloque + 1; // Empezar a buscar desde la línea siguiente al 'Si ... Entonces'
    let finSiPrincipalEncontrado = false;
    let enBloqueSino = false;

    while (i < lineasBloqueCompleto.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return i; // Salir temprano si hay interrupción

        const lineaIterOriginal = lineasBloqueCompleto[i];
        const lineaIterTrimmed = lineaIterOriginal.trim();
        const lineaIterLower = lineaIterTrimmed.toLowerCase().split('//')[0].trim(); // Ignorar comentarios para la lógica

        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) {
            siAnidados++;
            bufferBloqueActual.push(lineaIterOriginal);
        } else if (lineaIterLower === "sino") {
            if (siAnidados === 0) { // Sino del Si principal
                if (enBloqueSino) throw new Error(`Múltiples 'Sino' para el mismo 'Si' en línea ${numLineaOriginalSi}. Último 'Sino' en línea ${numLineaOriginalSi + (i - indiceSiEnBloque)}.`);
                enBloqueSino = true;
                bufferBloqueActual = bloqueSino; // Cambiar a recolectar para el bloque Sino
            } else { // Sino de un Si anidado
                bufferBloqueActual.push(lineaIterOriginal);
            }
        } else if (lineaIterLower === "finsi") {
            if (siAnidados === 0) { // FinSi del Si principal
                finSiPrincipalEncontrado = true;
                i++; // Avanzar el índice para que apunte a la línea DESPUÉS del FinSi
                break;
            } else { // FinSi de un Si anidado
                siAnidados--;
                bufferBloqueActual.push(lineaIterOriginal);
            }
        } else { // Cualquier otra línea
            bufferBloqueActual.push(lineaIterOriginal);
        }
        i++;
    }

    if (!finSiPrincipalEncontrado) {
        throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numLineaOriginalSi}.`);
    }

    if (condicionPrincipalVal) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[DEBUG Si L${numLineaOriginalSi}]: Condición Verdadera. Ejecutando bloque Entonces.`, 'debug');
        await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, numLineaOriginalSi); // Offset es la línea del Si original
    } else {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[DEBUG Si L${numLineaOriginalSi}]: Condición Falsa. ${bloqueSino.length > 0 ? 'Ejecutando bloque Sino.' : 'No hay bloque Sino.'}`, 'debug');
        if (bloqueSino.length > 0) {
            // El offset para el bloque Sino debería ser la línea donde se encontró el Sino.
            // Esto es complicado de rastrear exactamente sin guardar la línea del Sino.
            // Por ahora, usamos el offset del Si original. Esto podría desfasar los números de línea en errores dentro del Sino.
            // Una mejora sería pasar la línea original del Sino a ejecutarBloque.
            await Webgoritmo.Interprete.ejecutarBloque(bloqueSino, ambitoActual, numLineaOriginalSi + bloqueEntonces.length + (enBloqueSino ? 1:0) );
        }
    }
    return i -1; // Devolver el índice de la última línea procesada por handleSi (el FinSi)
};


// --- LÓGICA DE EJECUCIÓN (ACTUALIZADA Bloque 5) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    // ... (inicio sin cambios) ...
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) { /*...*/ return; }
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloque (Bloque 5) procesando ${lineasBloqueParam.length} líneas. Offset: ${numLineaOriginalOffset}`, 'debug');

    let i = 0;
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { /*...*/ break; }

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
            const lineaLower = lineaTrimmed.toLowerCase().split('//')[0].trim(); // Ignorar comentarios para la lógica de detección
            const matchAsignacion = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)/);

            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('dimension ') || lineaLower.startsWith('dimensionar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('escribir ') || lineaLower.startsWith('imprimir ') || lineaLower.startsWith('mostrar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('leer ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('si ') && lineaLower.endsWith(' entonces')) { // NUEVO en Bloque 5
                 // handleSi se encargará de ejecutar los bloques internos y devolverá el índice de la línea *después* del FinSi
                 // El índice devuelto por handleSi es relativo al array `lineasBloqueParam`
                 const indiceFinSiRelativo = await Webgoritmo.Interprete.handleSi(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                 i = indiceFinSiRelativo; // Actualizar i para saltar todo el bloque Si-Sino-FinSi
                 instruccionManejada = true;
            }
            else if (matchAsignacion) {
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            }

            // Palabras clave que finalizan bloques y no deben ser "instrucción no reconocida"
            const palabrasClaveDeBloque = /^(finsi|sino|finmientras|finpara|finsubproceso|finsegun|hasta que|proceso|algoritmo|finproceso|finalgoritmo)$/;
            if (!instruccionManejada && lineaTrimmed && !palabrasClaveDeBloque.test(lineaLower.split(/\s+/)[0])) {
                 if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Instrucción no reconocida en Bloque 5: '${lineaTrimmed}' (L${numLineaGlobal})`, 'warning');
            }

        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = e.message.startsWith(`Error en línea ${numLineaGlobal}`) || e.message.startsWith(`Error línea ${numLineaGlobal}`) || e.message.includes(`línea ${numLineaGlobal}`) ? e.message : `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }

        if (Webgoritmo.estadoApp.detenerEjecucion) { /*...*/ break; }
        i++; // Incrementar i aquí, ya que handleSi actualiza i directamente para saltar el bloque.
    }
    Webgoritmo.estadoApp.currentLineInfo = null;
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    // ... (inicio sin cambios, solo el mensaje de log) ...
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { /*...*/ return; }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { /*...*/ return; }
    if (!Webgoritmo.estadoApp) { /*...*/ return; }
    if (!Webgoritmo.Expresiones) { /*...*/ return; }

    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Reconstrucción Incremental - Bloque 5) ---", "normal");

    Webgoritmo.estadoApp.variables = {}; Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntrada = false; Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {}; const subProcesoLineIndices = new Set();

    // Parseo de SubProcesos (sin cambios)
    if (Webgoritmo.Interprete.parseDefinicionSubProceso) {
        for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
            // ... (lógica de parseo de subprocesos) ...
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
                     if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`SubProceso '${defSubProceso.nombreOriginal}' parseado (Bloque 5).`, 'debug');
                } catch (e) { Webgoritmo.estadoApp.errorEjecucion = e.message; Webgoritmo.estadoApp.detenerEjecucion = true; break; }
            }
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
        }
    }
    if (Webgoritmo.estadoApp.detenerEjecucion) { /* ... (manejo de error) ... */ return; }

    // Parseo del bloque principal (sin cambios)
    let lineasDelPrincipal = []; let inicioBloquePrincipalLineaNum = -1; let processingState = 'buscar_inicio';
    for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) {
        // ... (lógica de parseo del bloque principal) ...
        if (subProcesoLineIndices.has(j)) continue;
        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[j];
        let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
        if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
        const lineaLower = lineaParaAnalisis.toLowerCase();
        if (processingState === 'buscar_inicio') {
            if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) { inicioBloquePrincipalLineaNum = j + 1; processingState = 'en_bloque';}
            else if (lineaParaAnalisis !== "") { Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') fuera de bloque 'Algoritmo'/'Proceso'.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;}
        } else if (processingState === 'en_bloque') {
            if (lineaLower.startsWith("finproceso") || lineaLower.startsWith("finalgoritmo")) processingState = 'bloque_terminado';
            else if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) { Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Bloques 'Algoritmo'/'Proceso' anidados no permitidos.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;}
            else lineasDelPrincipal.push(lineaOriginal);
        } else if (processingState === 'bloque_terminado') {
            if (lineaParaAnalisis !== "") { Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') después de 'FinAlgoritmo'/'FinProceso'.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;}
        }
    }
    if (!Webgoritmo.estadoApp.errorEjecucion) { /* ... (validaciones de bloque) ... */ }

    // Ejecución y finalización (sin cambios)
    if (Webgoritmo.estadoApp.errorEjecucion) { /* ... */ }
    else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Bloque principal encontrado (L${inicioBloquePrincipalLineaNum}). Ejecutando ${lineasDelPrincipal.length} líneas.`, 'debug');
        if (lineasDelPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        else if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Advertencia: Bloque Algoritmo/Proceso vacío.", "warning");
    } else { /* ... (otros casos de no ejecución) ... */ }

    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Bloque 5) ---", "error");
        else if (Webgoritmo.estadoApp.detenerEjecucion && !Webgoritmo.estadoApp.esperandoEntrada) Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida (Bloque 5) ---", "warning");
        else if (!Webgoritmo.estadoApp.esperandoEntrada) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Bloque 5) ---", "normal");
    }
    if (Webgoritmo.UI.añadirSalida && Webgoritmo.estadoApp.variables && Object.keys(Webgoritmo.estadoApp.variables).length > 0 && !Webgoritmo.estadoApp.esperandoEntrada) { /* ... (log de variables) ... */ }
};

console.log("motorInterprete.js (Reconstrucción Incremental - BLOQUE 5: Si-Entonces-Sino) cargado.");
console.log("handleSi añadido. Lógica de ejecución actualizada para Si.");
console.log("Webgoritmo.Interprete:", Webgoritmo.Interprete);
