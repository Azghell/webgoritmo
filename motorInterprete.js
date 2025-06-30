// motorInterprete.js - Reconstrucción Incremental - Bloque 2

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE (Del Bloque 1) ---
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
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();

    if (tipoOrigen === tipoDestinoLower && tipoDestinoLower !== 'desconocido') return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return parseFloat(valor);
    if (tipoDestinoLower === 'numero') {
        if (tipoOrigen === 'entero' || tipoOrigen === 'real') return valor;
    }

    if (typeof valor === 'string') {
        const valTrimmed = valor.trim();
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valTrimmed, 10);
                if (isNaN(intVal) || String(intVal) !== valTrimmed.replace(/^0+/, '') && valTrimmed !== '0') {
                    throw new Error(`La cadena '${valor}' no es un entero válido.`);
                }
                return intVal;
            case 'real':
            case 'numero':
                if (valTrimmed === "") throw new Error(`La cadena vacía no es un número real válido.`);
                const numRepresentation = Number(valTrimmed);
                if (!isFinite(numRepresentation)) {
                    throw new Error(`La cadena '${valor}' no es un número real válido.`);
                }
                return numRepresentation;
            case 'logico':
                const lowerVal = valTrimmed.toLowerCase();
                if (lowerVal === 'verdadero' || lowerVal === 'v') return true;
                if (lowerVal === 'falso' || lowerVal === 'f') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
            case 'caracter':
                return valTrimmed.length > 0 ? valTrimmed.charAt(0) : '';
            case 'cadena':
                return valor;
        }
    } else if (typeof valor === 'number') {
        switch (tipoDestinoLower) {
            case 'entero': return Math.trunc(valor);
            case 'real': return valor;
            case 'numero': return valor;
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
            case 'logico': return valor;
            case 'caracter': throw new Error(`No se puede convertir directamente un lógico a caracter.`);
        }
    }
    throw new Error(`Incompatibilidad de tipo: no se puede convertir '${tipoOrigen}' (valor: ${valor}) a '${tipoDestinoLower}'.`);
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

// --- NUEVAS FUNCIONES (Bloque 2) ---
Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaInicioSubProceso, indiceInicio, todasLasLineas) {
    // Esta es la función original, la incluimos para que la estructura de `ejecutarPseudocodigo` no falle,
    // pero la ejecución real de subprocesos vendrá en un bloque posterior.
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
            // Simplificamos regex de param para este bloque, validación completa después
            const regexParam = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)/i;
            const matchParam = paramTrimmed.match(regexParam);
            if (!matchParam) throw new Error(`Sintaxis incorrecta para el parámetro '${paramTrimmed}' de SubProceso '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);

            const paramNameOriginal = matchParam[1];
            // Por ahora, tipo y por referencia se omiten para simplificar
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
        parametros: parametros,
        cuerpo: cuerpo, // El cuerpo no se ejecutará en este bloque
        lineaOriginalDef: indiceInicio + 1,
        indiceFinEnTodasLasLineas: currentLineNum
    };
};


Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) {
    // Versión simplificada para este bloque, sin evaluación de expresiones en dimensiones de arreglos
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s*\[\s*(.+?)\s*\])?$/i);
    if (!coincidenciaDefinir) return false; // No es una instrucción 'Definir' válida

    const nombresVariablesOriginales = coincidenciaDefinir[1].split(',').map(s => s.trim());
    const tipoBaseStr = coincidenciaDefinir[2];
    const dimsStr = coincidenciaDefinir[3]; // String de dimensiones, ej: "5" o "3,4"
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

        if (dimsStr) { // Es un arreglo
            // En este bloque, las dimensiones deben ser números literales, no expresiones
            const dimLiterals = dimsStr.split(',').map(s => s.trim());
            const evalDimensiones = [];
            for (const literal of dimLiterals) {
                const dimVal = parseInt(literal, 10);
                if (isNaN(dimVal) || String(dimVal) !== literal || dimVal <= 0) {
                    throw new Error(`Dimensiones deben ser enteros literales >0 en este bloque. Error en '${literal}' para '${nombreOriginal}' línea ${numLineaOriginal}.`);
                }
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = {
                type: 'array', baseType: tipoBaseLc, dimensions: evalDimensiones,
                value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc),
                isFlexibleType: tipoBaseLc === 'numero'
            };
            if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreOriginal}'(${tipoBaseLc}) dimensionado con [${evalDimensiones.join(',')}] en línea ${numLineaOriginal} (Bloque 2).`, 'normal');
        } else { // Variable simple
            ambitoActual[nombreLc] = {
                value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc),
                type: tipoBaseLc,
                isFlexibleType: tipoBaseLc === 'numero'
            };
             if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Variable '${nombreOriginal}'(${tipoBaseLc}) definida en línea ${numLineaOriginal} (Bloque 2).`, 'normal');
        }
    }
    return true; // Instrucción manejada
};

Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) {
    // Similar a handleDefinir para arreglos, pero con sintaxis Dimension/Dimensionar
    // Versión simplificada para este bloque
    let keyword = linea.trim().toLowerCase().startsWith("dimensionar") ? "Dimensionar" : "Dimension";
    let declaracionStr = linea.trim().substring(keyword.length).trim();
    if (declaracionStr === "") throw new Error(`Declaración '${keyword}' vacía en línea ${numLineaOriginal}.`);

    const declaracionesIndividuales = declaracionStr.split(',');
    for (let decl of declaracionesIndividuales) {
        decl = decl.trim();
        // Regex simplificado para este bloque, asumiendo dimensiones literales
        const matchArr = decl.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*([0-9]+(?:\s*,\s*[0-9]+)*)\s*\]$/i);
        if (!matchArr) throw new Error(`Sintaxis incorrecta para '${decl}' en '${keyword}' en línea ${numLineaOriginal}. Se esperan dimensiones literales (ej: A[5] o B[3,4]).`);

        const nombreArrOriginal = matchArr[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        // Para este bloque, el tipo no se especifica en Dimension, se asume 'numero' o se infiere luego.
        // Por ahora, usamos 'numero' como base para simplificar.
        const baseTypeParaArray = 'numero';
        const isFlexibleType = true;

        if (ambitoActual.hasOwnProperty(nombreArrLc)) {
             if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA línea ${numLineaOriginal}]: Arreglo '${nombreArrOriginal}' ya definido. Sobrescribiendo.`, 'warning');
        }

        const dimLiterals = matchArr[2].split(',').map(s => s.trim());
        const evalDimensiones = [];
        for (const literal of dimLiterals) {
            const dimVal = parseInt(literal, 10);
            if (isNaN(dimVal) || String(dimVal) !== literal || dimVal <= 0) {
                 throw new Error(`Dimensiones deben ser enteros literales >0. Error en '${literal}' para '${nombreArrOriginal}' línea ${numLineaOriginal}.`);
            }
            evalDimensiones.push(dimVal);
        }
        ambitoActual[nombreArrLc] = {
            type: 'array', baseType: baseTypeParaArray, dimensions: evalDimensiones,
            value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, baseTypeParaArray),
            isFlexibleType: isFlexibleType
        };
        if (Webgoritmo.UI) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' (${baseTypeParaArray}) dimensionado con [${evalDimensiones.join(',')}] usando '${keyword}' en línea ${numLineaOriginal} (Bloque 2).`, 'normal');
    }
    return true; // Instrucción manejada
};


// --- LÓGICA DE EJECUCIÓN (ACTUALIZADA Bloque 2) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) {
        console.error("ejecutarBloque: Módulos Webgoritmo esenciales no definidos."); return;
    }
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloque (Bloque 2) procesando ${lineasBloqueParam.length} líneas. Offset: ${numLineaOriginalOffset}`, 'debug');

    let i = 0;
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("Ejecución detenida en ejecutarBloque (Bloque 2)."); break; }

        const lineaOriginal = lineasBloqueParam[i];
        const lineaTrimmed = lineaOriginal.trim();
        const numLineaGlobal = numLineaOriginalOffset + i + 1; // Asumiendo que el offset es -1 si las líneas son 0-indexed desde el inicio del bloque principal

        Webgoritmo.estadoApp.currentLineInfo = { numLineaOriginal: numLineaGlobal, contenido: lineaTrimmed };

        if (lineaTrimmed === '' || lineaTrimmed.startsWith('//') || (lineaTrimmed.startsWith('/*') && lineaTrimmed.endsWith('*/'))) {
            i++; continue;
        }
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLineaGlobal}: ${lineaTrimmed}`, 'debug');

        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();

            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('dimension ') || lineaLower.startsWith('dimensionar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaTrimmed, ambitoActual, numLineaGlobal);
            }
            // En este bloque, no manejamos otras instrucciones aún.
            // Solo se loguearán como no reconocidas si no son comentarios o líneas vacías.

            if (!instruccionManejada && lineaTrimmed && !/^(finsi|sino|finmientras|finpara|finsubproceso|finsegun|hasta que|proceso|algoritmo|finproceso|finalgoritmo)$/.test(lineaLower.split(/\s+/)[0])) {
                 if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Instrucción no reconocida en Bloque 2: '${lineaTrimmed}' (L${numLineaGlobal})`, 'warning');
            }

        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = e.message.startsWith(`Error en línea ${numLineaGlobal}`) || e.message.startsWith(`Error línea ${numLineaGlobal}`) ? e.message : `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }
        i++;
        // No hay manejo de 'esperandoEntrada' en este bloque.
    }
    Webgoritmo.estadoApp.currentLineInfo = null;
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { console.error("Webgoritmo.UI.añadirSalida no está disponible."); return; }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { Webgoritmo.UI.añadirSalida("Error: El editor de código no está listo.", "error"); return; }
    if (!Webgoritmo.estadoApp) { Webgoritmo.UI.añadirSalida("Error: El estado de la aplicación no está listo.", "error"); return; }
    if (!Webgoritmo.Expresiones) { Webgoritmo.UI.añadirSalida("Error: El evaluador de expresiones no está listo.", "error"); return; }


    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Reconstrucción Incremental - Bloque 2) ---", "normal");

    // Reiniciar estado de variables para cada ejecución
    Webgoritmo.estadoApp.variables = {};
    Webgoritmo.estadoApp.detenerEjecucion = false;
    Webgoritmo.estadoApp.errorEjecucion = null;

    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {}; // Parseo de funciones, pero no ejecución aún.
    const subProcesoLineIndices = new Set();

    // Fase 1: Parsear SubProcesos (solo estructura, no ejecución)
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
                    i = defSubProceso.indiceFinEnTodasLasLineas; // Saltar el cuerpo del subproceso
                     if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`SubProceso '${defSubProceso.nombreOriginal}' parseado (Bloque 2).`, 'debug');
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
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase de parseo de SubProcesos - Bloque 2) ---", "error");
        }
        return;
    }

    // Fase 2: Encontrar y ejecutar el bloque principal (Algoritmo/Proceso)
    let lineasDelPrincipal = [];
    let inicioBloquePrincipalLineaNum = -1; // Número de línea original (1-indexed)
    let processingState = 'buscar_inicio'; // buscar_inicio, en_bloque, bloque_terminado

    for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) {
        if (subProcesoLineIndices.has(j)) continue; // Saltar líneas que son parte de un subproceso

        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[j];
        let lineaParaAnalisis = lineaOriginal.split('//')[0].trim(); // Ignorar comentarios
        if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
        const lineaLower = lineaParaAnalisis.toLowerCase();

        if (processingState === 'buscar_inicio') {
            if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                inicioBloquePrincipalLineaNum = j + 1;
                processingState = 'en_bloque';
            } else if (lineaParaAnalisis !== "") { // Código fuera de un bloque principal
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') fuera de bloque 'Algoritmo'/'Proceso'.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            }
        } else if (processingState === 'en_bloque') {
            if (lineaLower.startsWith("finproceso") || lineaLower.startsWith("finalgoritmo")) {
                processingState = 'bloque_terminado';
            } else if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) { // Inicio de bloque anidado no permitido
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Bloques 'Algoritmo'/'Proceso' anidados no permitidos.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            } else {
                lineasDelPrincipal.push(lineaOriginal);
            }
        } else if (processingState === 'bloque_terminado') {
            if (lineaParaAnalisis !== "") { // Código después de FinProceso/FinAlgoritmo
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') después de 'FinAlgoritmo'/'FinProceso'.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            }
        }
    }

    // Validaciones finales de la estructura del bloque principal
    if (!Webgoritmo.estadoApp.errorEjecucion) {
        const tieneCodigoEfectivo = Webgoritmo.estadoApp.lineasCodigo.some((l, idx) => {
            if (subProcesoLineIndices.has(idx)) return false; // No contar subprocesos como código efectivo aquí
            let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';
        });

        if (processingState === 'buscar_inicio' && tieneCodigoEfectivo) {
            Webgoritmo.estadoApp.errorEjecucion = "No se encontró bloque 'Algoritmo'/'Proceso' principal.";
        } else if (processingState === 'en_bloque') {
             Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo'/'Proceso' iniciado en línea ${inicioBloquePrincipalLineaNum} no fue cerrado correctamente con 'FinAlgoritmo' o 'FinProceso'.`;
        }
    }

    if (Webgoritmo.estadoApp.errorEjecucion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        Webgoritmo.estadoApp.detenerEjecucion = true; // Asegurar que se detenga
    } else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Bloque principal encontrado (L${inicioBloquePrincipalLineaNum}). Ejecutando ${lineasDelPrincipal.length} líneas.`, 'debug');
        if (lineasDelPrincipal.length > 0) {
            // El offset para ejecutarBloque debe ser el número de línea ANTERIOR al inicio del bloque principal (0-indexed)
            // o, si inicioBloquePrincipalLineaNum es 1-indexed, entonces offset = inicioBloquePrincipalLineaNum - 1
            await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        } else if (Webgoritmo.UI.añadirSalida) {
             Webgoritmo.UI.añadirSalida("Advertencia: Bloque Algoritmo/Proceso vacío.", "warning");
        }
    } else if (inicioBloquePrincipalLineaNum === -1 && !Webgoritmo.estadoApp.lineasCodigo.some((l, idx) => {
        if(subProcesoLineIndices.has(idx)) return false;
        let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';
    })) {
        // No hay código principal, solo (quizás) subprocesos o vacío. No es error.
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("No se encontró código en el bloque principal para ejecutar.", "normal");
    } else if (processingState === 'buscar_inicio' && !Webgoritmo.estadoApp.lineasCodigo.some(l => {let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';})) {
        // Archivo completamente vacío.
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("El archivo de código está vacío.", "normal");
    }


    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) {
            // El error ya se mostró donde ocurrió o en la validación de bloque.
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Bloque 2) ---", "error");
        }
        else if (Webgoritmo.estadoApp.detenerEjecucion) { Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida (Bloque 2) ---", "warning"); }
        else { Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Bloque 2) ---", "normal"); }
    }

    // Opcional: Mostrar estado de variables al final (para depuración)
    if (Webgoritmo.UI.añadirSalida && Webgoritmo.estadoApp.variables && Object.keys(Webgoritmo.estadoApp.variables).length > 0) {
        Webgoritmo.UI.añadirSalida("Estado final de variables (Bloque 2):", "debug");
        for (const varName in Webgoritmo.estadoApp.variables) {
            const meta = Webgoritmo.estadoApp.variables[varName];
            let valueStr = String(meta.value);
            if (meta.type === 'array') {
                // Podríamos intentar una serialización simple del arreglo para debug
                try { valueStr = JSON.stringify(meta.value); } catch (e) { valueStr = "[Arreglo complejo]";}
            }
            Webgoritmo.UI.añadirSalida(`  ${varName} (${meta.type}): ${valueStr}`, "debug");
        }
    }

};

console.log("motorInterprete.js (Reconstrucción Incremental - BLOQUE 2) cargado.");
console.log("handleDefinir, handleDimension, parseo básico de SubProceso y estructura de ejecución actualizados.");
console.log("Webgoritmo.Interprete:", Webgoritmo.Interprete);
