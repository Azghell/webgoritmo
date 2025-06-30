// motorInterprete.js - Estado Final del Bloque 3 (Definir, Asignar, Escribir, Dimension)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIÓN DE UTILIDAD INTERNA ---
function limpiarComentariosDeExpresion(exprStr) {
    if (typeof exprStr !== 'string') return exprStr;
    const idxComentario = exprStr.indexOf('//');
    if (idxComentario !== -1) {
        exprStr = exprStr.substring(0, idxComentario);
    }
    return exprStr.trim();
}

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) {
    const tipoLower = String(tipo).toLowerCase();
    switch (tipoLower) {
        case 'entero': return 0;
        case 'real': return 0.0;
        case 'logico': return false;
        case 'caracter': return '';
        case 'cadena': return '';
        case 'numero': return 0;
        default: console.warn(`Tipo '${tipo}' no reconocido. Usando null.`); return null;
    }
};

Webgoritmo.Interprete.inferirTipo = function(valor) {
    if (typeof valor === 'number') return Number.isInteger(valor) ? 'entero' : 'real';
    if (typeof valor === 'boolean') return 'logico';
    if (typeof valor === 'string') return 'cadena';
    return 'desconocido';
};

Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    const tipoDestinoLower = String(tipoDestino).toLowerCase();
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();

    if (tipoOrigen === tipoDestinoLower && tipoDestinoLower !== 'desconocido') return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return parseFloat(valor);
    if (tipoDestinoLower === 'numero' && (tipoOrigen === 'entero' || tipoOrigen === 'real')) return valor;
    if (tipoDestinoLower === 'cadena') return typeof valor === 'boolean' ? (valor ? 'Verdadero' : 'Falso') : String(valor);
    if (tipoDestinoLower === 'caracter' && typeof valor === 'string') return valor.length > 0 ? valor.charAt(0) : '';

    if (typeof valor === 'string') {
        const valTrimmed = valor.trim();
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valTrimmed, 10);
                if (isNaN(intVal) || !/^-?\d+$/.test(valTrimmed)) throw new Error(`La cadena '${valor}' no es un entero válido para la conversión.`);
                return intVal;
            case 'real':
            case 'numero':
                if (valTrimmed === "") throw new Error('Cadena vacía no es un número real válido para Leer o conversión.');
                const numRep = parseFloat(valTrimmed);
                if (isNaN(numRep) || !isFinite(numRep) || (!/^-?\d*(\.\d+)?$/.test(valTrimmed) && !/^-?\d+\.?$/.test(valTrimmed))) {
                     if (valTrimmed.match(/^-?\d*\.$/)) {} else if (valTrimmed.match(/^-?\.\d+$/)) {}
                     else throw new Error(`La cadena '${valor}' no es un número real válido para la conversión.`);
                }
                return numRep;
            case 'logico':
                const lVal = valTrimmed.toLowerCase();
                if (lVal === 'verdadero' || lVal === 'v') return true;
                if (lVal === 'falso' || lVal === 'f') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido.`);
        }
    } else if (typeof valor === 'number') {
        switch (tipoDestinoLower) {
            case 'entero': return Math.trunc(valor);
            case 'real': case 'numero': return valor;
            case 'logico': throw new Error(`No se puede convertir el número ${valor} a lógico directamente.`);
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
    const defVal = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType);
    function crDim(dimIdx) {
        const dimSz = dimensions[dimIdx];
        if (typeof dimSz !== 'number' || !Number.isInteger(dimSz) || dimSz <= 0) throw new Error(`Dimensión inválida: ${dimSz}.`);
        let arr = new Array(dimSz + 1);
        if (dimIdx === dimensions.length - 1) { for (let i = 1; i <= dimSz; i++) arr[i] = defVal; }
        else { for (let i = 1; i <= dimSz; i++) arr[i] = crDim(dimIdx + 1); }
        return arr;
    }
    if (!dimensions || dimensions.length === 0) throw new Error("Arreglo sin dimensiones.");
    return crDim(0);
};

Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaInicioSubProceso, indiceInicio, todasLasLineas) {
    // Implementación básica de parseo, se mejorará en Bloque 6
    const matchHeader = lineaInicioSubProceso.trim().match(/^\s*SubProceso\s+.*?\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\(.*?\)\s*$/i);
    if (!matchHeader) throw new Error(`Sintaxis SubProceso inválida L${indiceInicio + 1}`);
    const nombreFuncionOriginal = matchHeader[1]; // Asumiendo que el nombre está antes del (
    const nombreFuncionLc = nombreFuncionOriginal.toLowerCase();
    let currentLineNum = indiceInicio + 1;
    let finSubProcesoEncontrado = false;
    const cuerpo = [];
    for (; currentLineNum < todasLasLineas.length; currentLineNum++) {
        const lineaCuerpoOriginal = todasLasLineas[currentLineNum];
        let lineaCuerpoAnalisis = limpiarComentariosDeExpresion(lineaCuerpoOriginal.split('//')[0].trim());
        if (lineaCuerpoAnalisis.toLowerCase().startsWith("finsubproceso")) {
            finSubProcesoEncontrado = true; break;
        }
        cuerpo.push(lineaCuerpoOriginal);
    }
    if (!finSubProcesoEncontrado) throw new Error(`Falta 'FinSubProceso' para '${nombreFuncionOriginal}' L${indiceInicio + 1}.`);
    return { nombreOriginal: nombreFuncionOriginal, nombreLc: nombreFuncionLc, parametros: [], cuerpo: cuerpo, lineaOriginalDef: indiceInicio + 1, indiceFinEnTodasLasLineas: currentLineNum, retornoVarLc: null };
};


// --- HANDLERS DE INSTRUCCIONES ---
Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s*\[\s*(.+?)\s*\])?$/i);
    if (!coincidenciaDefinir) return false;
    const nombresVariablesOriginales = coincidenciaDefinir[1].split(',').map(s => s.trim());
    const tipoBaseStr = coincidenciaDefinir[2];
    const dimsStrRaw = coincidenciaDefinir[3];
    let tipoBaseLc = tipoBaseStr.toLowerCase();
    const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena', 'numero', 'número', 'numerico', 'numérico'];
    if (!tiposConocidos.includes(tipoBaseLc)) throw new Error(`Tipo '${tipoBaseStr}' no reconocido L${numLineaOriginal}.`);
    if (tipoBaseLc.startsWith("num")) tipoBaseLc = "numero";

    for (const nombreOriginal of nombresVariablesOriginales) {
        if (nombreOriginal === "") throw new Error(`Variable vacía en Definir L${numLineaOriginal}.`);
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreOriginal)) throw new Error(`Variable '${nombreOriginal}' inválida L${numLineaOriginal}.`);
        const nombreLc = nombreOriginal.toLowerCase();

        if (dimsStrRaw) {
            const dimsStrLimpio = limpiarComentariosDeExpresion(dimsStrRaw);
            if(dimsStrLimpio === "") throw new Error(`Dimensión vacía para arreglo '${nombreOriginal}' L${numLineaOriginal}.`);
            const dimExprs = dimsStrLimpio.split(',').map(s => s.trim());
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                if(expr === "") throw new Error(`Dimensión vacía (post-coma) para arreglo '${nombreOriginal}' L${numLineaOriginal}.`);
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensión '${expr}'->${dimVal} debe ser entero >0 para '${nombreOriginal}' L${numLineaOriginal}.`);
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = { type: 'array', baseType: tipoBaseLc, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc), isFlexibleType: tipoBaseLc === 'numero', name: nombreOriginal };
        } else {
            ambitoActual[nombreLc] = { value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc), type: tipoBaseLc, isFlexibleType: tipoBaseLc === 'numero', name: nombreOriginal };
        }
    }
    return true;
};

Webgoritmo.Interprete.handleDimension = async function(linea, ambitoActual, numLineaOriginal) {
    let keyword = linea.trim().toLowerCase().startsWith("dimensionar") ? "Dimensionar" : "Dimension";
    let declaracionStr = limpiarComentariosDeExpresion(linea.trim().substring(keyword.length));
    if (declaracionStr === "") throw new Error(`Declaración '${keyword}' vacía L${numLineaOriginal}.`);
    const declaracionesIndividuales = declaracionStr.split(',');
    for (let decl of declaracionesIndividuales) {
        decl = decl.trim();
        const matchArr = decl.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/i);
        if (!matchArr) throw new Error(`Sintaxis '${decl}' inválida en '${keyword}' L${numLineaOriginal}.`);
        const nombreArrOriginal = matchArr[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        const dimExprsStr = matchArr[2];
        const baseTypeParaArray = 'numero'; const isFlexibleType = true;
        const dimExprs = dimExprsStr.split(',').map(s => s.trim());
        const evalDimensiones = [];
        for (const expr of dimExprs) {
            if(expr === "") throw new Error(`Dimensión vacía (post-coma) para '${nombreArrOriginal}' L${numLineaOriginal}.`);
            let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
            if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensión '${expr}'->${dimVal} debe ser entero >0 para '${nombreArrOriginal}' L${numLineaOriginal}.`);
            evalDimensiones.push(dimVal);
        }
        ambitoActual[nombreArrLc] = { type: 'array', baseType: baseTypeParaArray, dimensions: evalDimensiones, value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, baseTypeParaArray), isFlexibleType: isFlexibleType, name: nombreArrOriginal };
    }
    return true;
};

Webgoritmo.Interprete.handleEscribir = async function(linea, ambitoActual, numLineaOriginal) {
    const regexEscribir = /^(Escribir|Imprimir|Mostrar)\s+(.*)/i;
    const coincidenciaEscribir = linea.match(regexEscribir);
    if (!coincidenciaEscribir) return false;
    const cadenaArgsOriginal = coincidenciaEscribir[2];
    const cadenaArgsLimpia = limpiarComentariosDeExpresion(cadenaArgsOriginal);
    if (cadenaArgsLimpia === "" && cadenaArgsOriginal.trim() !== "") return true; // Solo comentario
    if (cadenaArgsLimpia === "") throw new Error(`'${coincidenciaEscribir[1]}' sin argumentos L${numLineaOriginal}.`);
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
        const parteEvaluada = await Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
        partesMensajeSalida.push( (typeof parteEvaluada === 'boolean') ? (parteEvaluada ? 'Verdadero' : 'Falso') : (parteEvaluada === null ? 'nulo' : String(parteEvaluada)) );
    }
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal');
    return true;
};

Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) {
    const asignacionMatch = linea.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.*)$/);
    if (!asignacionMatch) return false;
    const destinoStrOriginal = asignacionMatch[1].trim();
    const exprStrCruda = asignacionMatch[2];
    const exprAEvaluar = limpiarComentariosDeExpresion(exprStrCruda);
    if (exprAEvaluar === "") throw new Error(`Expresión vacía en asignación L${numLineaOriginal}.`);
    let valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprAEvaluar, ambitoActual);
    const accesoArregloMatch = destinoStrOriginal.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);

    if (accesoArregloMatch) {
        const nombreArrOriginal = accesoArregloMatch[1];
        const indiceExprsStr = limpiarComentariosDeExpresion(accesoArregloMatch[2]);
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreArrLc) || ambitoActual[nombreArrLc].type !== 'array') throw new Error(`Arreglo '${nombreArrOriginal}' no def. L${numLineaOriginal}.`);
        const arrMeta = ambitoActual[nombreArrLc];
        const indiceExprs = indiceExprsStr.split(',').map(s => s.trim());
        if (indiceExprs.some(s=>s==="")) throw new Error(`Índice vacío L${numLineaOriginal}.`);
        if (indiceExprs.length !== arrMeta.dimensions.length) throw new Error(`Dimensiones incorrectas L${numLineaOriginal}.`);
        const evalIndices = [];
        for(let k=0; k<indiceExprs.length; k++){
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
        const nombreVarOriginal = destinoStrOriginal;
        if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) throw new Error(`Var '${nombreVarOriginal}' inválida L${numLineaOriginal}.`);
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if(!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Var '${nombreVarOriginal}' no def. L${numLineaOriginal}.`);
        const varMeta = ambitoActual[nombreVarLc];
        if(varMeta.type==='array') throw new Error(`Asignar a arreglo completo no permitido L${numLineaOriginal}.`);
        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestEscalar = varMeta.isFlexibleType&&varMeta.type==='numero'?tipoValorEntrante:varMeta.type;
        if(varMeta.isFlexibleType&&varMeta.type==='numero'){if(tipoValorEntrante!=='desconocido'&&tipoValorEntrante!=='numero'){varMeta.type=tipoValorEntrante;varMeta.isFlexibleType=false;tipoDestEscalar=tipoValorEntrante;}}
        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestEscalar);
    }
    return true;
};

// --- LÓGICA DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) { console.error("ejecutarBloque: Módulos esenciales no definidos."); return; }

    let i = 0;
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        const lineaOriginal = lineasBloqueParam[i];
        const lineaParaAnalisis = limpiarComentariosDeExpresion(lineaOriginal.trim());
        const numLineaGlobal = numLineaOriginalOffset + i + 1;

        if (lineaParaAnalisis === '') { i++; continue; }
        Webgoritmo.estadoApp.currentLineInfo = { numLineaOriginal: numLineaGlobal, contenido: lineaParaAnalisis };
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLineaGlobal}: ${lineaParaAnalisis}`, 'debug');

        let instruccionManejada = false;
        try {
            const lineaLowerParaDeteccion = lineaParaAnalisis.toLowerCase();
            const matchAsignacion = lineaParaAnalisis.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)/);
            // No hay llamadas a subproceso en Bloque 3

            if (lineaLowerParaDeteccion.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            } else if (lineaLowerParaDeteccion.startsWith('dimension ') || lineaLowerParaDeteccion.startsWith('dimensionar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDimension(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            } else if (lineaLowerParaDeteccion.startsWith('escribir ') || lineaLowerParaDeteccion.startsWith('imprimir ') || lineaLowerParaDeteccion.startsWith('mostrar ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            }
            // No Leer, Si, bucles, etc. en Bloque 3
            else if (matchAsignacion) {
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaParaAnalisis, ambitoActual, numLineaGlobal);
            }

            const palabrasClaveDeBloque = /^(proceso|algoritmo|finproceso|finalgoritmo)$/; // Solo estas en Bloque 3
            if (!instruccionManejada && lineaParaAnalisis && !palabrasClaveDeBloque.test(lineaLowerParaDeteccion.split(/\s+/)[0])) {
                 if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Instrucción no reconocida (Bloque 3): '${lineaParaAnalisis}' (L${numLineaGlobal})`, 'warning');
            }
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = e.message.includes(`L${numLineaGlobal}`)?e.message:`Error L${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion=true;
            if(Webgoritmo.UI&&Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion,'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }
        if(Webgoritmo.estadoApp.detenerEjecucion) break;
        i++;
    }
    Webgoritmo.estadoApp.currentLineInfo = null;
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida || !Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo || !Webgoritmo.estadoApp || !Webgoritmo.Expresiones) {
        console.error("Módulos esenciales no listos para ejecutarPseudocodigo.");
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Error crítico: Módulos no listos.", "error");
        return;
    }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Estado Bloque 3) ---", "normal");

    Webgoritmo.estadoApp.variables = {}; Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEjecucion = null;
    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {}; const subProcesoLineIndices = new Set(); // Parseo básico

    if (Webgoritmo.Interprete.parseDefinicionSubProceso) {
        for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
            const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[i];
            let lineaParaAnalisis = limpiarComentariosDeExpresion(lineaOriginal.split('//')[0].trim());
            if (lineaParaAnalisis.toLowerCase().startsWith("subproceso")) {
                try {
                    const defSubProceso = Webgoritmo.Interprete.parseDefinicionSubProceso(lineaOriginal, i, Webgoritmo.estadoApp.lineasCodigo);
                    Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc] = defSubProceso;
                    for (let k = i; k <= defSubProceso.indiceFinEnTodasLasLineas; k++) subProcesoLineIndices.add(k);
                    i = defSubProceso.indiceFinEnTodasLasLineas;
                } catch (e) { /* Error de parseo de subproceso se ignora o se loguea como debug en esta fase */ }
            }
        }
    }

    let lineasDelPrincipal = []; let inicioBloquePrincipalLineaNum = -1; let processingState = 'buscar_inicio';
    for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) {
        if (subProcesoLineIndices.has(j)) continue;
        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[j];
        let lineaParaAnalisis = limpiarComentariosDeExpresion(lineaOriginal.split('//')[0].trim());
        const lineaLower = lineaParaAnalisis.toLowerCase();
        if (processingState === 'buscar_inicio') {
            if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) { inicioBloquePrincipalLineaNum = j + 1; processingState = 'en_bloque';}
            else if (lineaParaAnalisis !== "") { Webgoritmo.estadoApp.errorEjecucion = `Error L${j+1}: Código fuera de bloque.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;}
        } else if (processingState === 'en_bloque') {
            if (lineaLower.startsWith("finproceso") || lineaLower.startsWith("finalgoritmo")) processingState = 'bloque_terminado';
            else if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) { Webgoritmo.estadoApp.errorEjecucion = `Error L${j+1}: Bloques anidados no permitidos.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;}
            else lineasDelPrincipal.push(lineaOriginal); // Pushear original para mantener comentarios para el usuario si se re-edita
        } else if (processingState === 'bloque_terminado') {
            if (lineaParaAnalisis !== "") { Webgoritmo.estadoApp.errorEjecucion = `Error L${j+1}: Código después de FinAlgoritmo.`; Webgoritmo.estadoApp.detenerEjecucion = true; break;}
        }
    }

    if (!Webgoritmo.estadoApp.errorEjecucion) {
        const tieneCodigoEfectivo = Webgoritmo.estadoApp.lineasCodigo.some((l, idx) => { if(subProcesoLineIndices.has(idx))return false; let t=limpiarComentariosDeExpresion(l.split('//')[0].trim()); return t !== ''; });
        if (processingState === 'buscar_inicio' && tieneCodigoEfectivo) Webgoritmo.estadoApp.errorEjecucion = "No se encontró bloque 'Algoritmo'/'Proceso'.";
        else if (processingState === 'en_bloque') Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo'/'Proceso' L${inicioBloquePrincipalLineaNum} no cerrado.`;
    }

    if (Webgoritmo.estadoApp.errorEjecucion) { Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');}
    else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (lineasDelPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        else Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning");
    } else if (!Webgoritmo.estadoApp.lineasCodigo.some(l => limpiarComentariosDeExpresion(l.trim()) !== '')) {
        Webgoritmo.UI.añadirSalida("El código está vacío.", "normal");
    } else if (processingState !== 'bloque_terminado' && !Webgoritmo.estadoApp.errorEjecucion) {
         Webgoritmo.UI.añadirSalida("Error: No se encontró un bloque Algoritmo/Proceso completo y bien formado.", "error");
    }


    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Estado Bloque 3) ---", "error");
        else Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Estado Bloque 3) ---", "normal");
    }
};

// Re-copiando funciones de utilidad por si se perdieron en la sobrescritura anterior.
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':case 'cadena':return '';case 'numero':return 0;default:return null;}};
Webgoritmo.Interprete.inferirTipo = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) { const tipoDestinoLower=String(tipoDestino).toLowerCase();const tipoOrigen=Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();if(tipoOrigen===tipoDestinoLower&&tipoDestinoLower!=='desconocido')return valor;if(tipoDestinoLower==='real'&&tipoOrigen==='entero')return parseFloat(valor);if(tipoDestinoLower==='numero'&&(tipoOrigen==='entero'||tipoOrigen==='real'))return valor;if(tipoDestinoLower==='cadena')return typeof valor==='boolean'?(valor?'Verdadero':'Falso'):String(valor);if(tipoDestinoLower==='caracter'&&typeof valor==='string')return valor.length>0?valor.charAt(0):'';if(typeof valor==='string'){const vt=valor.trim();switch(tipoDestinoLower){case 'entero':const iv=parseInt(vt,10);if(isNaN(iv)||!/^-?\d+$/.test(vt))throw new Error(`'${valor}' no es entero.`);return iv;case 'real':case 'numero':if(vt==="")throw new Error('Cadena vacía no es número.');const nr=parseFloat(vt);if(isNaN(nr)||!isFinite(nr)||(!/^-?\d*(\.\d+)?$/.test(vt)&&!/^-?\d+\.?$/.test(vt))){if(vt.match(/^-?\d*\.$/)){}else if(vt.match(/^-?\.\d+$/)){}else throw new Error(`'${valor}' no es número real.`);}return nr;case 'logico':const lv=vt.toLowerCase();if(lv==='verdadero'||lv==='v')return true;if(lv==='falso'||lv==='f')return false;throw new Error(`'${valor}' no es lógico.`);}}else if(typeof valor==='number'){switch(tipoDestinoLower){case 'entero':return Math.trunc(valor);case 'real':case 'numero':return valor;case 'logico':throw new Error(`${valor} no es lógico.`);}}else if(typeof valor==='boolean'){switch(tipoDestinoLower){case 'entero':return valor?1:0;case 'real':return valor?1.0:0.0;case 'numero':return valor?1:0;case 'logico':return valor;}}throw new Error(`No se puede convertir '${tipoOrigen}' a '${tipoDestinoLower}'.`);};
Webgoritmo.Interprete.inicializarArray = function(dims,baseT){const defV=this.obtenerValorPorDefecto(baseT);function cD(dI){const dS=dims[dI];if(typeof dS!=='number'||!Number.isInteger(dS)||dS<=0)throw new Error("Dim inválida.");let arr=new Array(dS+1);if(dI===dims.length-1){for(let i=1;i<=dS;i++)arr[i]=defV;}else{for(let i=1;i<=dS;i++)arr[i]=cD(dI+1);}return arr;}if(!dims||dims.length===0)throw new Error("No dims.");return cD(0);};
Webgoritmo.Interprete.parseDefinicionSubProceso = function(lineaIni,idxIni,todasLns){const rgx=/^\s*SubProceso\s+.*?\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\(.*?\)\s*$/i;const mH=lineaIni.trim().match(rgx);if(!mH)throw new Error(`Sintaxis SubProceso L${idxIni+1}`);const nomFunO=mH[1];const nomFunLc=nomFunO.toLowerCase();let cLN=idxIni+1;let finSOK=false;const cuerpo=[];for(;cLN<todasLns.length;cLN++){const lnCO=todasLns[cLN];let lnCA=limpiarComentariosDeExpresion(lnCO.split('//')[0].trim());if(lnCA.toLowerCase().startsWith("finsubproceso")){finSOK=true;break;}cuerpo.push(lnCO);}if(!finSOK)throw new Error(`Falta 'FinSubProceso' L${idxIni+1}.`);return{nombreOriginal:nomFunO,nombreLc:nomFunLc,parametros:[],cuerpo:cuerpo,lineaOriginalDef:idxIni+1,indiceFinEnTodasLasLineas:cLN,retornoVarLc:null};};

console.log("motorInterprete.js (ESTADO FINAL BLOQUE 3) cargado. Webgoritmo.Interprete DEFINIDO.");
