// motorInterprete.js - Bloque 6.1 Corregido (SubProcesos + Limpieza de Comentarios en Expresiones)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIÓN DE UTILIDAD INTERNA ---
function limpiarComentariosDeExpresion(exprStr) {
    if (typeof exprStr !== 'string') return exprStr; // Devolver tal cual si no es string
    const idxComentario = exprStr.indexOf('//');
    if (idxComentario !== -1) {
        exprStr = exprStr.substring(0, idxComentario);
    }
    // Podríamos manejar comentarios /* ... */ aquí también si fueran permitidos en medio o al final de expresiones.
    // Por ahora, PSeInt no suele tenerlos así en expresiones evaluables directas.
    return exprStr.trim();
}

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE (sin cambios desde Bloque 5) ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) { /* ... */ };
Webgoritmo.Interprete.inferirTipo = function(valor) { /* ... */ };
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) { /* ... */ };
Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType) { /* ... */ };
Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaInicioSubProceso, indiceInicio, todasLasLineas) { /* ... (como en Bloque 6.1) ... */ };

// --- HANDLERS DE INSTRUCCIONES (ACTUALIZADOS para limpiar comentarios) ---
Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s*\[\s*(.+?)\s*\])?$/i);
    if (!coincidenciaDefinir) return false;
    const nombresVariablesOriginales = coincidenciaDefinir[1].split(',').map(s => s.trim());
    const tipoBaseStr = coincidenciaDefinir[2];
    const dimsStrRaw = coincidenciaDefinir[3]; // Puede tener comentarios
    let tipoBaseLc = tipoBaseStr.toLowerCase();
    // ... (validación de tipoBaseLc) ...
    const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena', 'numero', 'número', 'numerico', 'numérico'];
    if (!tiposConocidos.includes(tipoBaseLc)) throw new Error(`Tipo '${tipoBaseStr}' no reconocido L${numLineaOriginal}.`);
    if (tipoBaseLc.startsWith("num")) tipoBaseLc = "numero";

    for (const nombreOriginal of nombresVariablesOriginales) {
        // ... (validación de nombreOriginal) ...
        if (nombreOriginal === "") throw new Error(`Var vacía L${numLineaOriginal}.`);
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreOriginal)) throw new Error(`Var '${nombreOriginal}' inválida L${numLineaOriginal}.`);
        const nombreLc = nombreOriginal.toLowerCase();
        // ... (advertencia si ya existe) ...

        if (dimsStrRaw) {
            const dimsStrLimpio = limpiarComentariosDeExpresion(dimsStrRaw);
            if (dimsStrLimpio === "") throw new Error(`Expresión de dimensión vacía para arreglo '${nombreOriginal}' L${numLineaOriginal}.`);
            const dimExprs = dimsStrLimpio.split(',').map(s => s.trim());
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                if (expr === "") throw new Error(`Dimensión vacía (después de coma) para arreglo '${nombreOriginal}' L${numLineaOriginal}.`);
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual); // expr ya está limpio si viene de split de dimsStrLimpio
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}'->${dimVal} para '${nombreOriginal}' L${numLineaOriginal}.`);
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = { type: 'array', baseType: tipoBaseLc, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc), isFlexibleType: tipoBaseLc === 'numero', name: nombreOriginal };
            // ... (log info) ...
        } else {
            ambitoActual[nombreLc] = { value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc), type: tipoBaseLc, isFlexibleType: tipoBaseLc === 'numero', name: nombreOriginal };
            // ... (log info) ...
        }
    }
    return true;
};

Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) {
    let keyword = linea.trim().toLowerCase().startsWith("dimensionar") ? "Dimensionar" : "Dimension";
    let declaracionStr = limpiarComentariosDeExpresion(linea.trim().substring(keyword.length)); // Limpiar aquí
    if (declaracionStr === "") throw new Error(`Declaración '${keyword}' vacía L${numLineaOriginal}.`);

    const declaracionesIndividuales = declaracionStr.split(',');
    for (let decl of declaracionesIndividuales) {
        decl = decl.trim(); // Cada declaración individual ya no tendrá comentarios de fin de línea
        const matchArr = decl.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/i);
        if (!matchArr) throw new Error(`Sintaxis '${decl}' inválida en '${keyword}' L${numLineaOriginal}.`);

        const nombreArrOriginal = matchArr[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        const dimExprsStr = matchArr[2]; // Esto es solo la parte entre corchetes, ya limpia.
        // ... (resto de la lógica como antes) ...
        const baseTypeParaArray = 'numero'; const isFlexibleType = true;
        const dimExprs = dimExprsStr.split(',').map(s => s.trim());
        const evalDimensiones = [];
        for (const expr of dimExprs) {
             if (expr === "") throw new Error(`Dimensión vacía (después de coma) para arreglo '${nombreArrOriginal}' L${numLineaOriginal}.`);
            let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
            if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}'->${dimVal} para '${nombreArrOriginal}' L${numLineaOriginal}.`);
            evalDimensiones.push(dimVal);
        }
        ambitoActual[nombreArrLc] = { type: 'array', baseType: baseTypeParaArray, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, baseTypeParaArray), isFlexibleType: isFlexibleType, name: nombreArrOriginal };
        // ... (log) ...
    }
    return true;
};

Webgoritmo.Interprete.handleEscribir = async function(linea, ambitoActual, numLineaOriginal) {
    const regexEscribir = /^(Escribir|Imprimir|Mostrar)\s+(.*)/i;
    const coincidenciaEscribir = linea.match(regexEscribir);
    if (!coincidenciaEscribir) return false;

    const cadenaArgsOriginal = coincidenciaEscribir[2]; // Puede tener comentarios al final
    const cadenaArgsLimpia = limpiarComentariosDeExpresion(cadenaArgsOriginal);
    if (cadenaArgsLimpia === "" && cadenaArgsOriginal.trim() !== "") { /* Escribir // comentario */ return true; }
    if (cadenaArgsLimpia === "") { throw new Error(`Instrucción '${coincidenciaEscribir[1]}' sin argumentos en línea ${numLineaOriginal}.`);}


    const args = []; let buffer = ""; let dentroDeComillasDobles = false; let dentroDeComillasSimples = false;
    for (let k = 0; k < cadenaArgsLimpia.length; k++) {
        const char = cadenaArgsLimpia[k];
        if (char === '"' && (k === 0 || cadenaArgsLimpia[k-1] !== '\\')) dentroDeComillasDobles = !dentroDeComillasDobles;
        else if (char === "'" && (k === 0 || cadenaArgsLimpia[k-1] !== '\\')) dentroDeComillasSimples = !dentroDeComillasSimples;
        if (char === ',' && !dentroDeComillasDobles && !dentroDeComillasSimples) { args.push(buffer.trim()); buffer = ""; }
        else buffer += char;
    }
    args.push(buffer.trim());

    let partesMensajeSalida = [];
    for (const arg of args) {
        if(arg === "") continue;
        // arg ya está limpio porque vino de cadenaArgsLimpia
        const parteEvaluada = await Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
        partesMensajeSalida.push( (typeof parteEvaluada === 'boolean') ? (parteEvaluada ? 'Verdadero' : 'Falso') : (parteEvaluada === null ? 'nulo' : String(parteEvaluada)) );
    }
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal');
    return true;
};

Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) {
    const asignacionMatch = linea.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.*)$/);
    if (!asignacionMatch) return false;

    const destinoStrOriginal = asignacionMatch[1].trim(); // El destino no debería tener comentarios
    const exprStrCruda = asignacionMatch[2]; // La expresión sí puede tenerlos
    const exprAEvaluar = limpiarComentariosDeExpresion(exprStrCruda);

    if (exprAEvaluar === "") throw new Error(`Expresión vacía en asignación en línea ${numLineaOriginal} (después de quitar comentarios).`);

    let valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprAEvaluar, ambitoActual);
    const accesoArregloMatch = destinoStrOriginal.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);

    if (accesoArregloMatch) {
        const nombreArrOriginal = accesoArregloMatch[1];
        const indiceExprsStr = limpiarComentariosDeExpresion(accesoArregloMatch[2]); // Limpiar también la expresión de índice
        // ... (resto de la lógica de asignación a arreglo como antes, usando indiceExprsStr) ...
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreArrLc) || ambitoActual[nombreArrLc].type !== 'array') throw new Error(`Arreglo '${nombreArrOriginal}' no def L${numLineaOriginal}.`);
        const arrMeta = ambitoActual[nombreArrLc];
        const indiceExprs = indiceExprsStr.split(',').map(s => s.trim());
        if (indiceExprs.some(s=>s==="")) throw new Error(`Índice vacío L${numLineaOriginal}.`);
        if (indiceExprs.length !== arrMeta.dimensions.length) throw new Error(`Dimensiones incorrectas L${numLineaOriginal}.`);
        const evalIndices = [];
        for (let k=0; k<indiceExprs.length; k++){
            let idxVal = await Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], ambitoActual);
            if(typeof idxVal!=='number'||!Number.isInteger(idxVal)){if(typeof idxVal==='number'&&idxVal===Math.trunc(idxVal))idxVal=Math.trunc(idxVal);else throw new Error(`Índice '${indiceExprs[k]}'->${idxVal} inválido L${numLineaOriginal}.`);}
            if(idxVal<=0||idxVal>arrMeta.dimensions[k])throw new Error(`Índice [${idxVal}] fuera de límites L${numLineaOriginal}.`);
            evalIndices.push(idxVal);
        }
        let targetLevel = arrMeta.value;
        for(let k=0; k<evalIndices.length-1;k++) targetLevel = targetLevel[evalIndices[k]];
        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestParaConv = arrMeta.isFlexibleType&&arrMeta.baseType==='numero'?tipoValorEntrante:arrMeta.baseType;
        if(arrMeta.isFlexibleType&&arrMeta.baseType==='numero'){if(tipoValorEntrante!=='desconocido'&&tipoValorEntrante!=='numero'){arrMeta.baseType=tipoValorEntrante; arrMeta.isFlexibleType=false; tipoDestParaConv=tipoValorEntrante;}}
        targetLevel[evalIndices[evalIndices.length-1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestParaConv);

    } else {
        // ... (lógica de asignación a variable simple como antes) ...
        const nombreVarOriginal = destinoStrOriginal;
        if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) throw new Error(`Var '${nombreVarOriginal}' inválida L${numLineaOriginal}.`);
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if(!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Var '${nombreVarOriginal}' no def L${numLineaOriginal}.`);
        const varMeta = ambitoActual[nombreVarLc];
        if(varMeta.type==='array') throw new Error(`Asignar a arreglo completo no permitido L${numLineaOriginal}.`);
        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestEscalar = varMeta.isFlexibleType&&varMeta.type==='numero'?tipoValorEntrante:varMeta.type;
        if(varMeta.isFlexibleType&&varMeta.type==='numero'){if(tipoValorEntrante!=='desconocido'&&tipoValorEntrante!=='numero'){varMeta.type=tipoValorEntrante;varMeta.isFlexibleType=false;tipoDestEscalar=tipoValorEntrante;}}
        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestEscalar);
    }
    return true;
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) { /* ... (sin cambios respecto a Bloque 4) ... */ };
Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloqueCompleto, indiceSiEnBloque) {
    const siMatch = lineaActual.match(/^Si\s+(.+?)\s+Entonces$/i);
    if (!siMatch) throw new Error(`Error interno Si L${numLineaOriginalSi}.`);

    const condicionPrincipalStrCruda = siMatch[1];
    const condicionPrincipalStrLimpia = limpiarComentariosDeExpresion(condicionPrincipalStrCruda);
    if(condicionPrincipalStrLimpia === "") throw new Error(`Condición vacía para 'Si' en línea ${numLineaOriginalSi}.`);

    let condicionPrincipalVal;
    try {
        condicionPrincipalVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionPrincipalStrLimpia, ambitoActual);
    } catch (e) {
        throw new Error(`Error evaluando condición del 'Si' ("${condicionPrincipalStrLimpia}") L${numLineaOriginalSi}: ${e.message}`);
    }
    if (typeof condicionPrincipalVal !== 'boolean') throw new Error(`Condición 'Si' ("${condicionPrincipalStrLimpia}") L${numLineaOriginalSi} debe ser lógica, no ${typeof condicionPrincipalVal}.`);

    // ... (resto de la lógica de handleSi como antes) ...
    let bloqueEntonces = []; let bloqueSino = []; let bufferBloqueActual = bloqueEntonces;
    let siAnidados = 0; let i = indiceSiEnBloque + 1; let finSiPrincipalEncontrado = false; let enBloqueSino = false;
    while (i < lineasBloqueCompleto.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return i;
        const lineaIterOriginal = lineasBloqueCompleto[i]; const lineaIterTrimmed = lineaIterOriginal.trim();
        const lineaIterLower = limpiarComentariosDeExpresion(lineaIterTrimmed.toLowerCase()); // Limpiar comentarios aquí también
        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) { siAnidados++; bufferBloqueActual.push(lineaIterOriginal); }
        else if (lineaIterLower === "sino") { if (siAnidados === 0) { if (enBloqueSino) throw new Error(`Múltiples 'Sino' L${numLineaOriginalSi}.`); enBloqueSino = true; bufferBloqueActual = bloqueSino; } else { bufferBloqueActual.push(lineaIterOriginal); } }
        else if (lineaIterLower === "finsi") { if (siAnidados === 0) { finSiPrincipalEncontrado = true; i++; break; } else { siAnidados--; bufferBloqueActual.push(lineaIterOriginal); } }
        else { bufferBloqueActual.push(lineaIterOriginal); }
        i++;
    }
    if (!finSiPrincipalEncontrado) throw new Error(`Falta 'FinSi' para 'Si' L${numLineaOriginalSi}.`);
    if (condicionPrincipalVal) { await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, numLineaOriginalSi); }
    else { if (bloqueSino.length > 0) { await Webgoritmo.Interprete.ejecutarBloque(bloqueSino, ambitoActual, numLineaOriginalSi + bloqueEntonces.length + (enBloqueSino ? 1:0) ); } }
    return i -1;
};

Webgoritmo.Interprete.ejecutarSubProcesoLlamada = async function(nombreFuncionOriginal, listaExprArgumentosStr, ambitoLlamador, numLineaOriginalLlamada) { /* ... (como en Bloque 6.1) ... */ };

Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    // ... (inicio sin cambios) ...
    let i = 0;
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Ejecución detenida en ejecutarBloque.", "debug");
            break;
        }

        const lineaOriginal = lineasBloqueParam[i];
        const lineaOriginalTrimmed = lineaOriginal.trim();
        // Aplicar limpieza de comentarios UNA VEZ para la línea que se va a analizar para detectar instrucciones
        const lineaParaAnalisis = limpiarComentariosDeExpresion(lineaOriginalTrimmed);

        if (lineaParaAnalisis === '') { // Si la línea queda vacía después de limpiar comentarios y espacios, saltarla.
            i++;
            continue;
        }

        const numLineaGlobal = numLineaOriginalOffset + i + 1;
        Webgoritmo.estadoApp.currentLineInfo = { numLineaOriginal: numLineaGlobal, contenido: lineaParaAnalisis }; // Usar la línea limpia para el log
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLineaGlobal}: ${lineaParaAnalisis}`, 'debug');


        let instruccionManejada = false;
        try {
            // Usar lineaParaAnalisis (ya limpia y trimeada) para la detección y para pasar a los handlers.
            // Convertir a minúsculas solo para las comparaciones de detección (startsWith, etc.).
            const lineaLowerParaDeteccion = lineaParaAnalisis.toLowerCase();

            const matchAsignacion = lineaParaAnalisis.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)/);
            const matchLlamadaSubProceso = lineaParaAnalisis.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/);

            if (lineaLowerParaDeteccion.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            } else if (lineaLowerParaDeteccion.startsWith('dimension ') || lineaLowerParaDeteccion.startsWith('dimensionar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            } else if (lineaLowerParaDeteccion.startsWith('escribir ') || lineaLowerParaDeteccion.startsWith('imprimir ') || lineaLowerParaDeteccion.startsWith('mostrar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            } else if (lineaLowerParaDeteccion.startsWith('leer ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            } else if (lineaLowerParaDeteccion.startsWith('si ') && lineaLowerParaDeteccion.endsWith(' entonces')) {
                 const indiceFinSiRelativo = await Webgoritmo.Interprete.handleSi(lineaParaAnalisis, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                 i = indiceFinSiRelativo;
                 instruccionManejada = true;
            }
            else if (matchAsignacion) {
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            } else if (matchLlamadaSubProceso) {
                const nombreFuncionLlamada = matchLlamadaSubProceso[1];
                const argsStrLlamada = matchLlamadaSubProceso[2].trim();
                let argExprsLlamada = [];
                if (argsStrLlamada !== "") {
                    argExprsLlamada = argsStrLlamada.split(',').map(arg => limpiarComentariosDeExpresion(arg.trim()));
                }
                if (Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(nombreFuncionLlamada.toLowerCase())) {
                    await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(nombreFuncionLlamada, argExprsLlamada, ambitoActual, numLineaGlobal);
                    instruccionManejada = true;
                }
            }

            const palabrasClaveDeBloque = /^(finsi|sino|finmientras|finpara|finsubproceso|finsegun|hasta que|proceso|algoritmo|finproceso|finalgoritmo)$/;
            // Usar lineaLowerParaDeteccion para el test de palabras clave de bloque
            if (!instruccionManejada && lineaParaAnalisis && !palabrasClaveDeBloque.test(lineaLowerParaDeteccion.split(/\s+/)[0])) {
                 if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Instrucción no reconocida: '${lineaParaAnalisis}' (L${numLineaGlobal})`, 'warning');
            }
        } catch (e) { Webgoritmo.estadoApp.errorEjecucion = e.message.includes(`L${numLineaGlobal}`)?e.message:`Error L${numLineaGlobal}: ${e.message}`; Webgoritmo.estadoApp.detenerEjecucion=true; if(Webgoritmo.UI&&Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion,'error'); else console.error(Webgoritmo.estadoApp.errorEjecucion); break; }

        if (Webgoritmo.estadoApp.detenerEjecucion) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Deteniendo ejecución después de manejar instrucción.", "debug");
            break;
        }
        i++;
    }
    Webgoritmo.estadoApp.currentLineInfo = null;
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() { /* ... (solo cambiar mensaje de log a Bloque 6.1 Corregido) ... */
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { /*...*/ return; }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { /*...*/ return; }
    if (!Webgoritmo.estadoApp) { /*...*/ return; }
    if (!Webgoritmo.Expresiones) { /*...*/ return; }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Bloque 6.1 Corregido) ---", "normal");
    Webgoritmo.estadoApp.variables = {}; Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntrada = false; Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.pilaLlamadas = [];
    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {}; const subProcesoLineIndices = new Set();
    // ... (resto igual)
    if (Webgoritmo.Interprete.parseDefinicionSubProceso) { for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) { const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[i]; let lineaParaAnalisis = limpiarComentariosDeExpresion(lineaOriginal.split('//')[0].trim()); if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = ''; const lineaLower = lineaParaAnalisis.toLowerCase(); if (lineaLower.startsWith("subproceso")) { try { const defSubProceso = Webgoritmo.Interprete.parseDefinicionSubProceso(lineaOriginal, i, Webgoritmo.estadoApp.lineasCodigo); if (Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(defSubProceso.nombreLc)) throw new Error(`SubProceso '${defSubProceso.nombreOriginal}' ya definido.`); Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc] = defSubProceso; for (let k = i; k <= defSubProceso.indiceFinEnTodasLasLineas; k++) subProcesoLineIndices.add(k); i = defSubProceso.indiceFinEnTodasLasLineas; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`SubProceso '${defSubProceso.nombreOriginal}' parseado (L${defSubProceso.lineaOriginalDef}).`, 'debug'); } catch (e) { Webgoritmo.estadoApp.errorEjecucion = e.message; Webgoritmo.estadoApp.detenerEjecucion = true; break; } } if (Webgoritmo.estadoApp.detenerEjecucion) break; } }
    if (Webgoritmo.estadoApp.detenerEjecucion) { if (Webgoritmo.UI.añadirSalida) { Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error'); Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Parseo SubProcesos) ---", "error");} return; }
    let lineasDelPrincipal = []; let inicioBloquePrincipalLineaNum = -1; let processingState = 'buscar_inicio'; for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) { if (subProcesoLineIndices.has(j)) continue; const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[j]; let lineaParaAnalisis = limpiarComentariosDeExpresion(lineaOriginal.split('//')[0].trim()); if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = ''; const lineaLower = lineaParaAnalisis.toLowerCase(); if (processingState === 'buscar_inicio') { if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) { inicioBloquePrincipalLineaNum = j + 1; processingState = 'en_bloque';} else if (lineaParaAnalisis !== "") { Webgoritmo.estadoApp.errorEjecucion = `Error L${j+1}: Código fuera de bloque.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;} } else if (processingState === 'en_bloque') { if (lineaLower.startsWith("finproceso") || lineaLower.startsWith("finalgoritmo")) processingState = 'bloque_terminado'; else if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) { Webgoritmo.estadoApp.errorEjecucion = `Error L${j+1}: Bloques anidados no permitidos.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;} else lineasDelPrincipal.push(lineaOriginal); } else if (processingState === 'bloque_terminado') { if (lineaParaAnalisis !== "") { Webgoritmo.estadoApp.errorEjecucion = `Error L${j+1}: Código después de FinAlgoritmo.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;} } }
    if (!Webgoritmo.estadoApp.errorEjecucion) { const tieneCodigoEfectivo = Webgoritmo.estadoApp.lineasCodigo.some((l, idx) => { if(subProcesoLineIndices.has(idx))return false; let t=limpiarComentariosDeExpresion(l.split('//')[0].trim()); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== ''; }); if (processingState === 'buscar_inicio' && tieneCodigoEfectivo) Webgoritmo.estadoApp.errorEjecucion = "No se encontró bloque 'Algoritmo'/'Proceso'."; else if (processingState === 'en_bloque') Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo'/'Proceso' L${inicioBloquePrincipalLineaNum} no cerrado.`;}
    if (Webgoritmo.estadoApp.errorEjecucion) { if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error'); Webgoritmo.estadoApp.detenerEjecucion = true; } else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') { if (lineasDelPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 ); else if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning"); } else { /* ... */ }
    if (Webgoritmo.UI.añadirSalida) { if (Webgoritmo.estadoApp.errorEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Bloque 6.1 Corregido) ---", "error"); else if (Webgoritmo.estadoApp.detenerEjecucion && !Webgoritmo.estadoApp.esperandoEntrada) Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida (Bloque 6.1 Corregido) ---", "warning");  else if (!Webgoritmo.estadoApp.esperandoEntrada) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Bloque 6.1 Corregido) ---", "normal");  }
    // ... (log de variables)
};

// --- Resto de funciones de utilidad y handlers (copiadas para completitud, verificar si necesitan limpieza de comentarios también) ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':case 'cadena':return '';case 'numero':return 0;default:return null;}};
Webgoritmo.Interprete.inferirTipo = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) { const tipoDestinoLower=String(tipoDestino).toLowerCase();const tipoOrigen=Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();if(tipoOrigen===tipoDestinoLower&&tipoDestinoLower!=='desconocido')return valor;if(tipoDestinoLower==='real'&&tipoOrigen==='entero')return parseFloat(valor);if(tipoDestinoLower==='numero'&&(tipoOrigen==='entero'||tipoOrigen==='real'))return valor;if(tipoDestinoLower==='cadena')return typeof valor==='boolean'?(valor?'Verdadero':'Falso'):String(valor);if(tipoDestinoLower==='caracter'&&typeof valor==='string')return valor.length>0?valor.charAt(0):'';if(typeof valor==='string'){const vt=valor.trim();switch(tipoDestinoLower){case 'entero':const iv=parseInt(vt,10);if(isNaN(iv)||!/^-?\d+$/.test(vt))throw new Error(`'${valor}' no es entero.`);return iv;case 'real':case 'numero':if(vt==="")throw new Error('Cadena vacía no es número.');const nr=parseFloat(vt);if(isNaN(nr)||!isFinite(nr)||(!/^-?\d*(\.\d+)?$/.test(vt)&&!/^-?\d+\.?$/.test(vt))){if(vt.match(/^-?\d*\.$/)){}else if(vt.match(/^-?\.\d+$/)){}else throw new Error(`'${valor}' no es número real.`);}return nr;case 'logico':const lv=vt.toLowerCase();if(lv==='verdadero'||lv==='v')return true;if(lv==='falso'||lv==='f')return false;throw new Error(`'${valor}' no es lógico.`);}}else if(typeof valor==='number'){switch(tipoDestinoLower){case 'entero':return Math.trunc(valor);case 'real':case 'numero':return valor;case 'logico':throw new Error(`${valor} no es lógico.`);}}else if(typeof valor==='boolean'){switch(tipoDestinoLower){case 'entero':return valor?1:0;case 'real':return valor?1.0:0.0;case 'numero':return valor?1:0;case 'logico':return valor;}}throw new Error(`No se puede convertir '${tipoOrigen}' a '${tipoDestinoLower}'.`);};
Webgoritmo.Interprete.inicializarArray = function(dims,baseT){const defV=this.obtenerValorPorDefecto(baseT);function cD(dI){const dS=dims[dI];if(typeof dS!=='number'||!Number.isInteger(dS)||dS<=0)throw new Error("Dim inválida.");let arr=new Array(dS+1);if(dI===dims.length-1){for(let i=1;i<=dS;i++)arr[i]=defV;}else{for(let i=1;i<=dS;i++)arr[i]=cD(dI+1);}return arr;}if(!dims||dims.length===0)throw new Error("No dims.");return cD(0);};
Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaIni,idxIni,todasLns){const rgx=/^\s*SubProceso\s+(?:([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*)?([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/i;const mH=lineaIni.trim().match(rgx);if(!mH)throw new Error(`Sintaxis SubProceso L${idxIni+1}`);const vRetO=mH[1]?mH[1].trim():null;const nomFunO=mH[2].trim();const prmsStr=mH[3].trim();const nomFunLc=nomFunO.toLowerCase();const vRetLc=vRetO?vRetO.toLowerCase():null;const prms=[];if(prmsStr){const pLst=prmsStr.split(',');for(const pS of pLst){const pT=pS.trim();if(pT==="")continue;const rgxP=/^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s+Como\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+))?(?:\s+Por\s+Referencia)?\s*$/i;const rgxPR=/^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)\s+Por\s+Referencia\s*$/i;let mP=pT.match(rgxP);let esPR=false;if(mP&&mP[0].toLowerCase().includes("por referencia"))esPR=true;else if(!mP){mP=pT.match(rgxPR);if(mP)esPR=true;}if(!mP)throw new Error(`Sintaxis param '${pT}' L${idxIni+1}.`);const pNomO=mP[1];let pTipo='desconocido';const tiposK=['entero','real','logico','caracter','cadena','numero','número','numerico','numérico'];if(mP[2]){const tPStr=mP[2];let tPLo=tPStr.toLowerCase();if(!tiposK.includes(tPLo))throw new Error(`Tipo param '${tPStr}' no reconocido L${idxIni+1}.`);pTipo=tPLo.startsWith('num')?'numero':tPLo;}prms.push({nombreOriginal:pNomO,nombreLc:pNomO.toLowerCase(),tipo:pTipo,esPorReferencia:esPR});}}const cuerpo=[];let cLN=idxIni+1;let finSOK=false;for(;cLN<todasLns.length;cLN++){const lnCO=todasLns[cLN];let lnCA=limpiarComentariosDeExpresion(lnCO.split('//')[0].trim());if(lnCA.startsWith('/*')&&lnCA.endsWith('*/'))lnCA='';const lnCL=lnCA.toLowerCase();if(lnCL.startsWith("finsubproceso")){finSOK=true;break;}cuerpo.push(lnCO);}if(!finSOK)throw new Error(`Falta 'FinSubProceso' L${idxIni+1}.`);return{nombreOriginal:nomFunO,nombreLc:nomFunLc,retornoVarOriginal:vRetO,retornoVarLc:vRetLc,parametros:prms,cuerpo:cuerpo,lineaOriginalDef:idxIni+1,indiceFinEnTodasLasLineas:cLN};};
Webgoritmo.Interprete.ejecutarSubProcesoLlamada = async function(nomFunO,lstExprArgsStr,ambitoLlamador,numLnLlamada){const nomFunLc=nomFunO.toLowerCase();if(!Webgoritmo.estadoApp.funcionesDefinidas||!Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(nomFunLc))throw new Error(`L${numLnLlamada} SubProceso '${nomFunO}' no def.`);const defFun=Webgoritmo.estadoApp.funcionesDefinidas[nomFunLc];if(lstExprArgsStr.length!==defFun.parametros.length)throw new Error(`L${numLnLlamada} Args incorrectos para '${defFun.nombreOriginal}'. Esperados ${defFun.parametros.length}, recibidos ${lstExprArgsStr.length}.`);if(!Webgoritmo.estadoApp.pilaLlamadas)Webgoritmo.estadoApp.pilaLlamadas=[];Webgoritmo.estadoApp.pilaLlamadas.push({nombre:defFun.nombreOriginal,lineaLlamada:numLnLlamada,lineaDefinicion:defFun.lineaOriginalDef});if(Webgoritmo.estadoApp.pilaLlamadas.length>100)throw new Error(`L${numLnLlamada} Pila de llamadas excedida.`);const ambitoLocal=Object.create(Webgoritmo.estadoApp.variables);let valRet;try{await Webgoritmo.Interprete.ejecutarBloque(defFun.cuerpo,ambitoLocal,defFun.lineaOriginalDef-1);valRet=undefined;}catch(e){throw new Error(`Error en SubP '${defFun.nombreOriginal}' (L${numLnLlamada}): ${e.message}`);}finally{Webgoritmo.estadoApp.pilaLlamadas.pop();}return valRet;};

console.log("motorInterprete.js (Bloque 6.1 Corregido) cargado.");
