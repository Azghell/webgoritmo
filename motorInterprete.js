// motorInterprete.js - Bloque 6, Parte 1 (SubProcesos: Parseo y Llamada Simple)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD (sin cambios desde Bloque 5) ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) { /* ... */ };
Webgoritmo.Interprete.inferirTipo = function(valor) { /* ... */ };
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) { /* ... */ };
Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType) { /* ... */ };

// --- PARSEO DE SUBPROCESO (MEJORADO Bloque 6) ---
Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaInicioSubProceso, indiceInicio, todasLasLineas) {
    const regexDefSubProceso = /^\s*SubProceso\s+(?:([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*)?([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/i;
    const matchHeader = lineaInicioSubProceso.trim().match(regexDefSubProceso);

    if (!matchHeader) {
        throw new Error(`Sintaxis incorrecta en la definición de SubProceso en línea ${indiceInicio + 1}: '${lineaInicioSubProceso.trim()}'`);
    }

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

            // Regex mejorado para capturar nombre, tipo (opcional) y "Por Referencia" (opcional)
            // Ej: "arg1", "arg2 Como Entero", "arg3 Por Referencia", "arg4 Como Cadena Por Referencia"
            const regexParam = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s+Como\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+))?(?:\s+Por\s+Referencia)?\s*$/i;
            // Una segunda regex para capturar "Por Referencia" si no se capturó con el tipo
            const regexParamRefOnly = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)\s+Por\s+Referencia\s*$/i;

            let matchParam = paramTrimmed.match(regexParam);
            let esPorReferencia = false;

            if (matchParam && matchParam[0].toLowerCase().includes("por referencia")) {
                esPorReferencia = true;
            } else if (!matchParam) { // Si la primera regex falla, probar la que solo busca "Por Referencia"
                matchParam = paramTrimmed.match(regexParamRefOnly);
                if (matchParam) esPorReferencia = true;
            }

            if (!matchParam) {
                throw new Error(`Sintaxis incorrecta para el parámetro '${paramTrimmed}' de SubProceso '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);
            }

            const paramNameOriginal = matchParam[1];
            let paramType = 'desconocido'; // Tipo por defecto si no se especifica
            const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena', 'numero', 'número', 'numerico', 'numérico'];

            if (matchParam[2]) { // Si se especificó un tipo (ej. "Como Entero")
                const tipoParamStr = matchParam[2];
                let tipoParamLower = tipoParamStr.toLowerCase();
                if (!tiposConocidos.includes(tipoParamLower)) {
                    throw new Error(`Tipo de dato '${tipoParamStr}' no reconocido para parámetro '${paramNameOriginal}' de '${nombreFuncionOriginal}' en línea ${indiceInicio + 1}.`);
                }
                paramType = tipoParamLower.startsWith('num') ? 'numero' : tipoParamLower;
            }

            parametros.push({
                nombreOriginal: paramNameOriginal,
                nombreLc: paramNameOriginal.toLowerCase(),
                tipo: paramType,
                esPorReferencia: esPorReferencia
            });
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
    if (!finSubProcesoEncontrado) {
        throw new Error(`Se esperaba 'FinSubProceso' para cerrar la definición de '${nombreFuncionOriginal}' iniciada en línea ${indiceInicio + 1}.`);
    }

    return {
        nombreOriginal: nombreFuncionOriginal, nombreLc: nombreFuncionLc,
        retornoVarOriginal: varRetornoOriginal, retornoVarLc: varRetornoLc, // Nombre de la variable donde se guarda el retorno
        parametros: parametros,
        cuerpo: cuerpo,
        lineaOriginalDef: indiceInicio + 1,
        indiceFinEnTodasLasLineas: currentLineNum
    };
};


// --- HANDLERS DE INSTRUCCIONES (sin cambios desde Bloque 5) ---
Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) { /* ... */ };
Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) { /* ... */ };
Webgoritmo.Interprete.handleEscribir = async function(linea, ambitoActual, numLineaOriginal) { /* ... */ };
Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) { /* ... */ };
Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) { /* ... */ };
Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloqueCompleto, indiceSiEnBloque) { /* ... */};

// --- EJECUCIÓN DE SUBPROCESO (NUEVO Y ESQUELETO Bloque 6) ---
Webgoritmo.Interprete.ejecutarSubProcesoLlamada = async function(nombreFuncionOriginal, listaExprArgumentosStr, ambitoLlamador, numLineaOriginalLlamada) {
    const nombreFuncionLc = nombreFuncionOriginal.toLowerCase();
    if (!Webgoritmo.estadoApp.funcionesDefinidas || !Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(nombreFuncionLc)) {
        throw new Error(`Error línea ${numLineaOriginalLlamada}: SubProceso '${nombreFuncionOriginal}' no definido.`);
    }

    const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[nombreFuncionLc];

    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[DEBUG SubProceso L${numLineaOriginalLlamada}]: Llamando a '${defFuncion.nombreOriginal}'. Argumentos (str): ${listaExprArgumentosStr.join(', ')}`, 'debug');

    // Validación de número de argumentos (simple por ahora)
    if (listaExprArgumentosStr.length !== defFuncion.parametros.length) {
        throw new Error(`Error línea ${numLineaOriginalLlamada}: Número incorrecto de argumentos para '${defFuncion.nombreOriginal}'. Esperados ${defFuncion.parametros.length}, recibidos ${listaExprArgumentosStr.length}.`);
    }

    // Pila de llamadas para detectar recursión infinita
    if (!Webgoritmo.estadoApp.pilaLlamadas) Webgoritmo.estadoApp.pilaLlamadas = [];
    Webgoritmo.estadoApp.pilaLlamadas.push({ nombre: defFuncion.nombreOriginal, lineaLlamada: numLineaOriginalLlamada, lineaDefinicion: defFuncion.lineaOriginalDef });
    if (Webgoritmo.estadoApp.pilaLlamadas.length > 100) { // Límite de profundidad de pila
        throw new Error(`Error línea ${numLineaOriginalLlamada}: Profundidad máxima de pila de llamadas excedida (posible recursión infinita en '${defFuncion.nombreOriginal}').`);
    }

    // Crear un nuevo ámbito para el subproceso.
    // Por ahora, hereda del ámbito global (variables del algoritmo principal).
    // En PSeInt, los subprocesos tienen su propio ámbito para parámetros y variables locales,
    // pero pueden acceder/modificar variables globales si no hay colisión de nombres.
    // Esta implementación es simplificada. Una más robusta necesitaría una cadena de ámbitos.
    const ambitoLocal = Object.create(Webgoritmo.estadoApp.variables); // Hereda del ámbito global

    // TODO Bloque 6 Parte 2: Procesar parámetros (evaluar expresiones, asignar a ámbitoLocal, manejar por referencia)
    // TODO Bloque 6 Parte 3: Manejar variable de retorno

    let valorRetorno;
    try {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[DEBUG SubProceso L${numLineaOriginalLlamada}]: Ejecutando cuerpo de '${defFuncion.nombreOriginal}'.`, 'debug');
        await Webgoritmo.Interprete.ejecutarBloque(defFuncion.cuerpo, ambitoLocal, defFuncion.lineaOriginalDef -1 ); // El offset es la línea ANTERIOR al inicio del cuerpo

        // TODO Bloque 6 Parte 3: Obtener el valor de la variable de retorno del ambitoLocal si defFuncion.retornoVarLc existe
        valorRetorno = undefined; // Placeholder

    } catch (e) {
        // Re-lanzar el error añadiendo contexto de la llamada al subproceso
        throw new Error(`Error dentro de SubProceso '${defFuncion.nombreOriginal}' (llamado desde línea ${numLineaOriginalLlamada}): ${e.message}`);
    } finally {
        Webgoritmo.estadoApp.pilaLlamadas.pop(); // Sacar de la pila al finalizar
    }

    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[DEBUG SubProceso L${numLineaOriginalLlamada}]: Finalizó '${defFuncion.nombreOriginal}'. Retorno: ${valorRetorno}`, 'debug');
    return valorRetorno; // Por ahora, siempre undefined
};


// --- LÓGICA DE EJECUCIÓN (ACTUALIZADA Bloque 6) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    // ... (inicio sin cambios) ...
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) { /*...*/ return; }
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloque (Bloque 6.1) procesando ${lineasBloqueParam.length} líneas. Offset: ${numLineaOriginalOffset}`, 'debug');

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
            const lineaLower = lineaTrimmed.toLowerCase().split('//')[0].trim();
            const matchAsignacion = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)/);

            // NUEVO Bloque 6: Detección de llamada a SubProceso
            // Formato: NombreFuncion ( arg1, arg2, ... )  o  NombreFuncion()
            // No debe confundirse con una asignación si hay "<-" o "="
            const matchLlamadaSubProceso = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/);


            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('dimension ') || lineaLower.startsWith('dimensionar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('escribir ') || lineaLower.startsWith('imprimir ') || lineaLower.startsWith('mostrar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('leer ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('si ') && lineaLower.endsWith(' entonces')) {
                 const indiceFinSiRelativo = await Webgoritmo.Interprete.handleSi(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                 i = indiceFinSiRelativo;
                 instruccionManejada = true;
            }
            else if (matchAsignacion) { // Probar asignación ANTES de llamada a subproceso si la llamada pudiera estar en el lado derecho
                 // Si el lado izquierdo de la asignación es una variable que coincide con un nombre de función que devuelve valor,
                 // la evaluación de la expresión en handleAsignacion se encargará de llamar a ejecutarSubProcesoLlamada.
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (matchLlamadaSubProceso) { // Es una llamada a procedimiento (no devuelve valor o su valor no se asigna)
                const nombreFuncionLlamada = matchLlamadaSubProceso[1];
                const argsStrLlamada = matchLlamadaSubProceso[2].trim();
                let argExprsLlamada = [];
                if (argsStrLlamada !== "") {
                    // TODO: Split de argumentos más robusto que maneje comas dentro de strings o expresiones.
                    argExprsLlamada = argsStrLlamada.split(',').map(arg => arg.trim());
                }
                // Verificar si es una función definida por el usuario
                if (Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(nombreFuncionLlamada.toLowerCase())) {
                    await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(nombreFuncionLlamada, argExprsLlamada, ambitoActual, numLineaGlobal);
                    instruccionManejada = true;
                }
                // Aquí podrían ir llamadas a procedimientos built-in si los hubiera
            }

            const palabrasClaveDeBloque = /^(finsi|sino|finmientras|finpara|finsubproceso|finsegun|hasta que|proceso|algoritmo|finproceso|finalgoritmo)$/;
            if (!instruccionManejada && lineaTrimmed && !palabrasClaveDeBloque.test(lineaLower.split(/\s+/)[0])) {
                 if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Instrucción no reconocida en Bloque 6.1: '${lineaTrimmed}' (L${numLineaGlobal})`, 'warning');
            }

        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = e.message.startsWith(`Error en línea ${numLineaGlobal}`) || e.message.startsWith(`Error línea ${numLineaGlobal}`) || e.message.includes(`línea ${numLineaGlobal}`) ? e.message : `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }

        if (Webgoritmo.estadoApp.detenerEjecucion) { /*...*/ break; }
        i++;
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
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Reconstrucción Incremental - Bloque 6.1) ---", "normal");

    Webgoritmo.estadoApp.variables = {}; Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntrada = false; Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.pilaLlamadas = []; // Inicializar pila de llamadas
    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {}; const subProcesoLineIndices = new Set();

    if (Webgoritmo.Interprete.parseDefinicionSubProceso) {
        for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
            const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[i];
            let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
            if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
            const lineaLower = lineaParaAnalisis.toLowerCase();
            if (lineaLower.startsWith("subproceso")) {
                try {
                    const defSubProceso = Webgoritmo.Interprete.parseDefinicionSubProceso(lineaOriginal, i, Webgoritmo.estadoApp.lineasCodigo);
                    if (Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(defSubProceso.nombreLc)) throw new Error(`SubProceso '${defSubProceso.nombreOriginal}' ya definido en línea ${defSubProceso.lineaOriginalDef} (previamente en ${Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc].lineaOriginalDef}).`);
                    Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc] = defSubProceso;
                    for (let k = i; k <= defSubProceso.indiceFinEnTodasLasLineas; k++) subProcesoLineIndices.add(k);
                    i = defSubProceso.indiceFinEnTodasLasLineas;
                     if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`SubProceso '${defSubProceso.nombreOriginal}' parseado (L${defSubProceso.lineaOriginalDef}). Parámetros: ${defSubProceso.parametros.map(p=>p.nombreOriginal + (p.esPorReferencia ? " PorRef" : "")).join(', ')}`, 'debug');
                } catch (e) { Webgoritmo.estadoApp.errorEjecucion = e.message; Webgoritmo.estadoApp.detenerEjecucion = true; break; }
            }
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
        }
    }
    if (Webgoritmo.estadoApp.detenerEjecucion) {
        if (Webgoritmo.UI.añadirSalida) { Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error'); Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase de parseo de SubProcesos - Bloque 6.1) ---", "error");}
        return;
    }

    // ... (resto de ejecutarPseudocodigo sin cambios significativos, solo mensajes de log) ...
    let lineasDelPrincipal = []; let inicioBloquePrincipalLineaNum = -1; let processingState = 'buscar_inicio';
    for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) {
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
    if (!Webgoritmo.estadoApp.errorEjecucion) { /* ... */ }
    if (Webgoritmo.estadoApp.errorEjecucion) { /* ... */ }
    else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Bloque principal encontrado (L${inicioBloquePrincipalLineaNum}). Ejecutando ${lineasDelPrincipal.length} líneas.`, 'debug');
        if (lineasDelPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        else if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Advertencia: Bloque Algoritmo/Proceso vacío.", "warning");
    } else { /* ... */ }

    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Bloque 6.1) ---", "error");
        else if (Webgoritmo.estadoApp.detenerEjecucion && !Webgoritmo.estadoApp.esperandoEntrada) Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida (Bloque 6.1) ---", "warning");
        else if (!Webgoritmo.estadoApp.esperandoEntrada) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Bloque 6.1) ---", "normal");
    }
    if (Webgoritmo.UI.añadirSalida && Webgoritmo.estadoApp.variables && Object.keys(Webgoritmo.estadoApp.variables).length > 0 && !Webgoritmo.estadoApp.esperandoEntrada) { /* ... */ }
};

// Copiar las funciones de utilidad que no cambian
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) { const tipoLower = String(tipo).toLowerCase(); switch (tipoLower) { case 'entero': return 0; case 'real': return 0.0; case 'logico': return false; case 'caracter': return ''; case 'cadena': return ''; case 'numero': return 0; default: console.warn(`Tipo '${tipo}' no reconocido. Usando null.`); return null; } };
Webgoritmo.Interprete.inferirTipo = function(valor) { if (typeof valor === 'number') return Number.isInteger(valor) ? 'entero' : 'real'; if (typeof valor === 'boolean') return 'logico'; if (typeof valor === 'string') return 'cadena'; return 'desconocido'; };
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) { /* ... (como antes) ... */ const tipoDestinoLower = String(tipoDestino).toLowerCase(); const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase(); if (tipoOrigen === tipoDestinoLower && tipoDestinoLower !== 'desconocido') return valor; if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return parseFloat(valor); if (tipoDestinoLower === 'numero' && (tipoOrigen === 'entero' || tipoOrigen === 'real')) return valor; if (tipoDestinoLower === 'cadena') return typeof valor === 'boolean' ? (valor ? 'Verdadero' : 'Falso') : String(valor); if (tipoDestinoLower === 'caracter' && typeof valor === 'string') return valor.length > 0 ? valor.charAt(0) : ''; if (typeof valor === 'string') { const valTrimmed = valor.trim(); switch (tipoDestinoLower) { case 'entero': const intVal = parseInt(valTrimmed, 10); if (isNaN(intVal) || !/^-?\d+$/.test(valTrimmed)) throw new Error(`'${valor}' no es entero.`); return intVal; case 'real': case 'numero': if (valTrimmed === "") throw new Error(`Cadena vacía no es número.`); const numRep = parseFloat(valTrimmed); if (isNaN(numRep) || !isFinite(numRep) || (!/^-?\d*(\.\d+)?$/.test(valTrimmed) && !/^-?\d+\.?$/.test(valTrimmed))) { if (valTrimmed.match(/^-?\d*\.$/)) {} else if (valTrimmed.match(/^-?\.\d+$/)) {} else throw new Error(`'${valor}' no es número real.`);} return numRep; case 'logico': const lVal = valTrimmed.toLowerCase(); if (lVal==='verdadero'||lVal==='v')return true; if(lVal==='falso'||lVal==='f')return false; throw new Error(`'${valor}' no es lógico.`);}} else if (typeof valor === 'number') {switch (tipoDestinoLower){case 'entero':return Math.trunc(valor);case 'real':case 'numero':return valor;case 'logico':throw new Error(`${valor} no es lógico.`);}} else if(typeof valor === 'boolean'){switch(tipoDestinoLower){case 'entero':return valor?1:0;case 'real':return valor?1.0:0.0;case 'numero':return valor?1:0;case 'logico':return valor;}} throw new Error(`No se puede convertir '${tipoOrigen}' a '${tipoDestinoLower}'.`);};
Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType) { /* ... (como antes) ... */ const defVal = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType); function crDim(dimIdx){const dimSz=dimensions[dimIdx]; if(typeof dimSz!=='number'||!Number.isInteger(dimSz)||dimSz<=0)throw new Error(`Dimensión ${dimSz} inválida.`); let arr=new Array(dimSz+1); if(dimIdx===dimensions.length-1){for(let i=1;i<=dimSz;i++)arr[i]=defVal;}else{for(let i=1;i<=dimSz;i++)arr[i]=crDim(dimIdx+1);}return arr;}if(!dimensions||dimensions.length===0)throw new Error("Sin dimensiones.");return crDim(0);};
Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) { /* ... (como antes, solo asegurar que 'name' se guarda en meta) ... */ const matchDef = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s*\[\s*(.+?)\s*\])?$/i); if(!matchDef)return false; const vars=matchDef[1].split(',').map(s=>s.trim()); const tipoStr=matchDef[2]; let tipoLc=tipoStr.toLowerCase(); const dimsStr=matchDef[3]; const tiposOk=['entero','real','logico','caracter','cadena','numero','número','numerico','numérico']; if(!tiposOk.includes(tipoLc))throw new Error(`Tipo '${tipoStr}' no reconocido L${numLineaOriginal}.`); if(tipoLc.startsWith("num"))tipoLc="numero"; for(const nombreVar of vars){ if(nombreVar==="")throw new Error(`Var vacía L${numLineaOriginal}.`); if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVar))throw new Error(`Var '${nombreVar}' inválida L${numLineaOriginal}.`); const nombreLc=nombreVar.toLowerCase(); if(dimsStr){const dimExprs=dimsStr.split(',').map(s=>s.trim()); const evalDims=[]; for(const expr of dimExprs){let dimVal=await Webgoritmo.Expresiones.evaluarExpresion(expr,ambitoActual); if(typeof dimVal!=='number'||!Number.isInteger(dimVal)||dimVal<=0)throw new Error(`Dimensión '${expr}'->${dimVal} inválida L${numLineaOriginal}.`); evalDims.push(dimVal);} ambitoActual[nombreLc]={type:'array',baseType:tipoLc,dimensions:evalDims,value:Webgoritmo.Interprete.inicializarArray(evalDims,tipoLc),isFlexibleType:tipoLc==='numero',name:nombreVar};} else {ambitoActual[nombreLc]={value:Webgoritmo.Interprete.obtenerValorPorDefecto(tipoLc),type:tipoLc,isFlexibleType:tipoLc==='numero',name:nombreVar};}} return true;};
Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) { /* ... (como antes, solo asegurar que 'name' se guarda en meta) ... */ let kw=linea.trim().toLowerCase().startsWith("dimensionar")?"Dimensionar":"Dimension"; let declStr=linea.trim().substring(kw.length).trim(); if(declStr==="")throw new Error(`'${kw}' vacía L${numLineaOriginal}.`); const decls=declStr.split(','); for(let decl of decls){decl=decl.trim(); const matchArr=decl.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/i); if(!matchArr)throw new Error(`Sintaxis '${decl}' inválida L${numLineaOriginal}.`); const nombreArr=matchArr[1]; const nombreLc=nombreArr.toLowerCase(); const baseT='numero'; const flexT=true; const dimExprs=matchArr[2].split(',').map(s=>s.trim()); const evalDims=[]; for(const expr of dimExprs){let dimVal=await Webgoritmo.Expresiones.evaluarExpresion(expr,ambitoActual); if(typeof dimVal!=='number'||!Number.isInteger(dimVal)||dimVal<=0)throw new Error(`Dimensión '${expr}'->${dimVal} inválida L${numLineaOriginal}.`); evalDims.push(dimVal);} ambitoActual[nombreLc]={type:'array',baseType:baseT,dimensions:evalDims,value:Webgoritmo.Interprete.inicializarArray(evalDims,baseT),isFlexibleType:flexT,name:nombreArr};} return true;};
Webgoritmo.Interprete.handleEscribir = async function(linea, ambitoActual, numLineaOriginal) { /* ... (como antes) ... */ const matchEsc=linea.match(/^(Escribir|Imprimir|Mostrar)\s+(.*)/i); if(!matchEsc)return false; const argsStr=matchEsc[2]; const args=[]; let buff=""; let inDQ=false; let inSQ=false; for(let k=0;k<argsStr.length;k++){const ch=argsStr[k]; if(ch==='"'&& (k===0||argsStr[k-1]!=='\\'))inDQ=!inDQ; else if(ch==='\''&&(k===0||argsStr[k-1]!=='\\'))inSQ=!inSQ; if(ch===','&&!inDQ&&!inSQ){args.push(buff.trim());buff="";}else buff+=ch;} args.push(buff.trim()); let outParts=[]; for(const arg of args){if(arg==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(arg,ambitoActual); outParts.push(typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart)));} if(Webgoritmo.UI&&Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outParts.join(''),'normal'); return true;};
Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) { /* ... (como antes) ... */ const matchAsig=linea.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.*)$/); if(!matchAsig)return false; const destStr=matchAsig[1].trim(); const exprStr=matchAsig[2].trim(); if(exprStr==="")throw new Error(`Expresión vacía L${numLineaOriginal}.`); let evalVal=await Webgoritmo.Expresiones.evaluarExpresion(exprStr,ambitoActual); const accArrMatch=destStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/); if(accArrMatch){const arrNom=accArrMatch[1]; const arrNomLc=arrNom.toLowerCase(); if(!ambitoActual.hasOwnProperty(arrNomLc)||ambitoActual[arrNomLc].type!=='array')throw new Error(`Arreglo '${arrNom}' no def L${numLineaOriginal}.`); const arrMeta=ambitoActual[arrNomLc]; const idxExprs=accArrMatch[2].split(',').map(s=>s.trim()); if(idxExprs.some(s=>s===""))throw new Error(`Índice vacío L${numLineaOriginal}.`); if(idxExprs.length!==arrMeta.dimensions.length)throw new Error(`Dimensiones incorrectas L${numLineaOriginal}.`); const evalIdxs=[]; for(let k=0;k<idxExprs.length;k++){let idxVal=await Webgoritmo.Expresiones.evaluarExpresion(idxExprs[k],ambitoActual); if(typeof idxVal!=='number'||!Number.isInteger(idxVal)){if(typeof idxVal==='number'&&idxVal===Math.trunc(idxVal))idxVal=Math.trunc(idxVal); else throw new Error(`Índice '${idxExprs[k]}'->${idxVal} inválido L${numLineaOriginal}.`);} if(idxVal<=0||idxVal>arrMeta.dimensions[k])throw new Error(`Índice [${idxVal}] fuera de límites L${numLineaOriginal}.`); evalIdxs.push(idxVal);} let target=arrMeta.value; for(let k=0;k<evalIdxs.length-1;k++){target=target[evalIdxs[k]];} const valTipoIn=Webgoritmo.Interprete.inferirTipo(evalVal).toLowerCase(); let tipoDestConv=arrMeta.isFlexibleType&&arrMeta.baseType==='numero'?valTipoIn:arrMeta.baseType; if(arrMeta.isFlexibleType&&arrMeta.baseType==='numero'){if(valTipoIn!=='desconocido'&&valTipoIn!=='numero'){arrMeta.baseType=valTipoIn; arrMeta.isFlexibleType=false; tipoDestConv=valTipoIn;}} target[evalIdxs[evalIdxs.length-1]]=Webgoritmo.Interprete.convertirValorParaAsignacion(evalVal,tipoDestConv);} else {const varNom=destStr; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(varNom))throw new Error(`Var '${varNom}' inválida L${numLineaOriginal}.`); const varNomLc=varNom.toLowerCase(); if(!ambitoActual.hasOwnProperty(varNomLc))throw new Error(`Var '${varNom}' no def L${numLineaOriginal}.`); const varMeta=ambitoActual[varNomLc]; if(varMeta.type==='array')throw new Error(`No se puede asignar a arreglo completo L${numLineaOriginal}.`); const valTipoIn=Webgoritmo.Interprete.inferirTipo(evalVal).toLowerCase(); let tipoDestEsc=varMeta.isFlexibleType&&varMeta.type==='numero'?valTipoIn:varMeta.type; if(varMeta.isFlexibleType&&varMeta.type==='numero'){if(valTipoIn!=='desconocido'&&valTipoIn!=='numero'){varMeta.type=valTipoIn;varMeta.isFlexibleType=false;tipoDestEsc=valTipoIn;}} varMeta.value=Webgoritmo.Interprete.convertirValorParaAsignacion(evalVal,tipoDestEsc);} return true;};
Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) { /* ... (como antes) ... */ const matchLeer=linea.match(/^Leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLineaOriginal); const nomsOrig=matchLeer[1].split(',').map(v=>v.trim().toLowerCase()); if(nomsOrig.length===0||nomsOrig.some(v=>v===""))throw new Error("Leer sin vars L"+numLineaOriginal); for(const nomLc of nomsOrig){const nomPrompt=matchLeer[1].split(',').map(v=>v.trim()).find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomPrompt}' inválida L${numLineaOriginal}.`); if(!ambitoActual.hasOwnProperty(nomLc))throw new Error(`Var '${nomPrompt}' no def L${numLineaOriginal}.`); if(ambitoActual[nomLc].type==='array')throw new Error(`Leer arreglo completo no soportado L${numLineaOriginal}.`);} const nomsPrompt=matchLeer[1].split(',').map(v=>v.trim()); let promptMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntrada=true; Webgoritmo.estadoApp.variableEntradaActual=nomsOrig; Webgoritmo.estadoApp.nombresOriginalesParaEntrada=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; return true;};
Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloqueCompleto, indiceSiEnBloque) { /* ... (como antes) ... */ const siMatch=lineaActual.match(/^Si\s+(.+?)\s+Entonces$/i); if(!siMatch)throw new Error(`Error interno Si L${numLineaOriginalSi}.`); const condStr=siMatch[1]; let condVal; try{condVal=await Webgoritmo.Expresiones.evaluarExpresion(condStr,ambitoActual);}catch(e){throw new Error(`Error evaluando cond 'Si' ("${condStr}") L${numLineaOriginalSi}: ${e.message}`);} if(typeof condVal!=='boolean')throw new Error(`Cond 'Si' ("${condStr}") L${numLineaOriginalSi} debe ser lógica, no ${typeof condVal}.`); let blqEntonces=[]; let blqSino=[]; let buffActual=blqEntonces; let siAnid=0; let i=indiceSiEnBloque+1; let finSiOK=false; let enSino=false; while(i<lineasBloqueCompleto.length){if(Webgoritmo.estadoApp.detenerEjecucion)return i; const iterLineaOrig=lineasBloqueCompleto[i]; const iterLineaTrim=iterLineaOrig.trim(); const iterLineaLc=iterLineaTrim.toLowerCase().split('//')[0].trim(); if(iterLineaLc.startsWith("si ")&&iterLineaLc.includes(" entonces")){siAnid++; buffActual.push(iterLineaOrig);}else if(iterLineaLc==="sino"){if(siAnid===0){if(enSino)throw new Error(`Múltiples 'Sino' L${numLineaOriginalSi}.`); enSino=true; buffActual=blqSino;}else{buffActual.push(iterLineaOrig);}}else if(iterLineaLc==="finsi"){if(siAnid===0){finSiOK=true; i++; break;}else{siAnid--; buffActual.push(iterLineaOrig);}}else{buffActual.push(iterLineaOrig);} i++;} if(!finSiOK)throw new Error(`Falta 'FinSi' para 'Si' L${numLineaOriginalSi}.`); if(condVal){await Webgoritmo.Interprete.ejecutarBloque(blqEntonces,ambitoActual,numLineaOriginalSi);}else{if(blqSino.length>0){await Webgoritmo.Interprete.ejecutarBloque(blqSino,ambitoActual,numLineaOriginalSi+blqEntonces.length+(enSino?1:0));}} return i-1;};

console.log("motorInterprete.js (Reconstrucción Incremental - BLOQUE 6.1: SubProcesos - Parseo y Llamada Simple) cargado.");
console.log("parseDefinicionSubProceso mejorado. ejecutarSubProcesoLlamada (esqueleto) y detección en ejecutarBloque añadidos.");
console.log("Webgoritmo.Interprete:", Webgoritmo.Interprete);
