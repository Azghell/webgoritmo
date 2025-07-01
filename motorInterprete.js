// motorInterprete.js (Estado Estable: Post-Corrección Comentarios y Acceso Arreglos Básico)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

// --- FUNCIÓN DE UTILIDAD INTERNA ---
function limpiarComentariosYEspacios(linea) {
    if (typeof linea !== 'string') return "";
    let lineaLimpia = linea;
    const idxComentario = lineaLimpia.indexOf('//');
    if (idxComentario !== -1) {
        lineaLimpia = lineaLimpia.substring(0, idxComentario);
    }
    return lineaLimpia.trim();
}

function limpiarComentariosYEspaciosInternos(texto) { // Usada para partes de una línea (ej. args de Escribir)
    if (typeof texto !== 'string') return "";
    let limpio = texto;
    const idxComentario = limpio.indexOf('//');
    if (idxComentario !== -1) limpio = limpio.substring(0, idxComentario);
    return limpio.trim();
}


// --- NAMESPACE PARA UTILIDADES DEL INTÉRPRETE ---
Webgoritmo.Interprete.Utilidades = {
    obtenerValorPorDefectoSegunTipo: function(tipoTexto) {
        const tipoNormalizado = String(tipoTexto).toLowerCase();
        switch (tipoNormalizado) {
            case 'entero': return 0;
            case 'real': return 0.0;
            case 'logico': return false;
            case 'caracter': return '';
            case 'cadena': return '';
            default: console.warn(`Tipo '${tipoTexto}' no reconocido en obtenerValorPorDefectoSegunTipo.`); return null;
        }
    },
    crearDescriptorVariable: function(nombreOriginal, tipoDeclarado, valorInicial) {
        const tipoNormalizado = String(tipoDeclarado).toLowerCase();
        return {
            nombreOriginal: nombreOriginal, tipoDeclarado: tipoNormalizado,
            valor: valorInicial, esArreglo: false, dimensiones: []
        };
    },
    inferirTipoDesdeValor: function(valor) {
        if (typeof valor === 'number') return Number.isInteger(valor) ? 'entero' : 'real';
        if (typeof valor === 'boolean') return 'logico';
        if (typeof valor === 'string') return 'cadena';
        return 'desconocido';
    },
    convertirValorParaTipo: function(valor, tipoDestino, numeroLinea) {
        const tipoDestNormalizado = String(tipoDestino).toLowerCase();
        const tipoOrigenNormalizado = this.inferirTipoDesdeValor(valor);
        if (tipoOrigenNormalizado === tipoDestNormalizado) return valor;
        if (tipoDestNormalizado === 'real' && tipoOrigenNormalizado === 'entero') return parseFloat(valor);
        if (tipoDestNormalizado === 'cadena') return String(valor);
        if (tipoDestNormalizado === 'entero') {
            if (tipoOrigenNormalizado === 'real') return Math.trunc(valor);
            if (tipoOrigenNormalizado === 'cadena') {
                const num = parseInt(valor, 10);
                if (!isNaN(num) && String(num) === String(valor).trim()) return num;
            }
        }
        if (tipoDestNormalizado === 'real') {
            if (tipoOrigenNormalizado === 'cadena') {
                const num = parseFloat(valor);
                if (!isNaN(num) && String(num) === String(valor).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0') ) return num;
            }
        }
        if (tipoDestNormalizado === 'logico' && tipoOrigenNormalizado === 'cadena') {
            const valLower = String(valor).trim().toLowerCase();
            if (valLower === "verdadero" || valLower === "v") return true;
            if (valLower === "falso" || valLower === "f") return false;
        }
        throw new Error(`L${numeroLinea}: No se puede convertir '${valor}' (${tipoOrigenNormalizado}) a '${tipoDestNormalizado}'.`);
    },
    obtenerValorRealVariable: function(nombreVariable, ambitoActual, numeroLinea) {
        const nombreVarLc = String(nombreVariable).toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) {
            throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`);
        }
        const descriptor = ambitoActual[nombreVarLc];
        // En el evaluador de expresiones, si es un arreglo y se intenta usar como valor simple, fallará.
        // Aquí solo devolvemos el descriptor para que el evaluador decida.
        return descriptor; // Devolver el descriptor completo
    }
};

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaProcesada, ambitoActual, numeroLinea) {
    const regexEscribir = /^(?:escribir|imprimir|mostrar)\s+(.*)/i;
    const coincidencia = lineaProcesada.match(regexEscribir);
    if (!coincidencia || !coincidencia[1]) throw new Error("Instrucción Escribir mal formada.");

    const argumentosTextoLimpio = limpiarComentariosYEspaciosInternos(coincidencia[1]);
    if (argumentosTextoLimpio === "" && lineaProcesada.match(regexEscribir)[0].trim() !== coincidencia[0].split(" ")[0]) return true;
    if (argumentosTextoLimpio === "") throw new Error(`'${coincidencia[0].split(" ")[0]}' sin argumentos L${numeroLinea}.`);

    const listaExpresiones = [];
    let buffer = ""; let dentroDeComillas = false; let tipoComillas = '';
    for (let i = 0; i < argumentosTextoLimpio.length; i++) {
        const char = argumentosTextoLimpio[i];
        if ((char === '"' || char === "'") && (i === 0 || argumentosTextoLimpio[i-1] !== '\\')) {
            if (!dentroDeComillas) { dentroDeComillas = true; tipoComillas = char; buffer += char; }
            else if (char === tipoComillas) { dentroDeComillas = false; buffer += char; }
            else { buffer += char; }
        } else if (char === ',' && !dentroDeComillas) { listaExpresiones.push(buffer.trim()); buffer = ""; }
        else { buffer += char; }
    }
    if (buffer.trim() !== "") listaExpresiones.push(buffer.trim());

    let salidaFinal = "";
    for (const exprTexto of listaExpresiones) {
        if (exprTexto === "") continue;
        const valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprTexto, ambitoActual, numeroLinea);
        if (typeof valorEvaluado === 'boolean') salidaFinal += valorEvaluado ? "Verdadero" : "Falso";
        else salidaFinal += String(valorEvaluado);
    }
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(salidaFinal, 'normal');
    return true;
};

Webgoritmo.Interprete.procesarDefinicion = async function(lineaProcesada, ambitoEjecucion, numeroLinea) {
    console.log(`[DEBUG procesarDefinicion L${numeroLinea}] Entrando con línea: "${lineaProcesada}"`);
    const regexDefinir = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;
    const coincidencia = lineaProcesada.match(regexDefinir);
    if (!coincidencia || coincidencia.length < 3) throw new Error(`Sintaxis incorrecta 'Definir' L${numeroLinea}. Recibido: "${lineaProcesada}"`);
    const nombresVariables = coincidencia[1].split(',').map(nombre => nombre.trim());
    const tipoVariable = coincidencia[2].toLowerCase();
    for (const nombreVar of nombresVariables) {
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVar)) throw new Error(`Nombre var inválido: '${nombreVar}' L${numeroLinea}.`);
        const nombreVarLc = nombreVar.toLowerCase();
        if (ambitoEjecucion.hasOwnProperty(nombreVarLc)) if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Advertencia L${numeroLinea}: Var '${nombreVar}' redefinida.`,'warning');
        const valorPorDefecto = Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipoVariable);
        ambitoEjecucion[nombreVarLc] = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, valorPorDefecto);
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Variable '${nombreVar}' (${tipoVariable}) definida.`, 'debug');
    }
    return true;
};

Webgoritmo.Interprete.procesarAsignacion = async function(lineaProcesada, ambitoEjecucion, numeroLinea) {
    const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/;
    const coincidencia = lineaProcesada.match(regexAsignacion);
    if (!coincidencia) throw new Error("Sintaxis asignación incorrecta L"+numeroLinea);
    const destinoTexto = coincidencia[1].trim();
    const expresionTextoCruda = coincidencia[2]; // Comentarios ya deberían estar fuera por lineaProcesada
    const expresionAEvaluar = limpiarComentariosYEspaciosInternos(expresionTextoCruda); // Doble chequeo o para sub-partes
    if (expresionAEvaluar === "") throw new Error(`Expresión vacía L${numeroLinea}.`);
    const valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(expresionAEvaluar, ambitoEjecucion, numeroLinea);
    const accArrMatch = destinoTexto.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);
    if (accArrMatch) {
        const nombreArrOriginal = accArrMatch[1];
        const indicesTexto = limpiarComentariosYEspaciosInternos(accArrMatch[2]);
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoEjecucion.hasOwnProperty(nombreArrLc) || !ambitoEjecucion[nombreArrLc].esArreglo) throw new Error(`Arreglo '${nombreArrOriginal}' no definido L${numeroLinea}.`);
        const descriptorArreglo = ambitoEjecucion[nombreArrLc];
        const expresionesIndices = indicesTexto.split(',').map(s => s.trim());
        if (expresionesIndices.some(s=>s==="")) throw new Error(`Índice vacío para '${nombreArrOriginal}' L${numeroLinea}.`);
        if (expresionesIndices.length !== descriptorArreglo.dimensiones.length) throw new Error(`Dimensiones incorrectas para '${nombreArrOriginal}' L${numeroLinea}.`);
        const indicesEvaluados = [];
        for (const exprIndice of expresionesIndices) {
            const valIndice = await Webgoritmo.Expresiones.evaluarExpresion(exprIndice, ambitoEjecucion, numeroLinea);
            if (typeof valIndice !== 'number' || !Number.isInteger(valIndice)) throw new Error(`Índice para '${nombreArrOriginal}' debe ser entero. Se obtuvo '${valIndice}' de '${exprIndice}' L${numeroLinea}.`);
            if (valIndice <= 0 || valIndice > descriptorArreglo.dimensiones[indicesEvaluados.length]) throw new Error(`Índice [${valIndice}] fuera de límites para '${nombreArrOriginal}' L${numeroLinea}.`);
            indicesEvaluados.push(valIndice);
        }
        let nivelDestino = descriptorArreglo.valor;
        for (let k = 0; k < indicesEvaluados.length - 1; k++) nivelDestino = nivelDestino[indicesEvaluados[k]];
        nivelDestino[indicesEvaluados[indicesEvaluados.length - 1]] = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valorEvaluado, descriptorArreglo.tipoDeclarado, numeroLinea); // Asume tipoDeclarado del arreglo para todos elementos
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Arreglo '${descriptorArreglo.nombreOriginal}'[${indicesEvaluados.join(',')}] <- ${valorEvaluado}`, 'debug');
    } else {
        const varNomLc = destinoTexto.toLowerCase();
        if (!ambitoEjecucion.hasOwnProperty(varNomLc)) throw new Error(`Var '${destinoTexto}' no def L${numeroLinea}.`);
        const descVar = ambitoEjecucion[varNomLc];
        if (descVar.esArreglo) throw new Error(`Asignar a arreglo completo no permitido L${numeroLinea}.`);
        try {
            descVar.valor = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valorEvaluado, descVar.tipoDeclarado, numeroLinea);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`, 'debug');
        } catch (e) { throw e; }
    }
    return true;
};

Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaProcesada, ambitoEjecucion, numeroLinea) {
    const regexLeer = /^leer\s+(.+)/i;
    const coincidencia = lineaProcesada.match(regexLeer);
    if (!coincidencia || !coincidencia[1]) throw new Error("Sintaxis incorrecta para 'Leer'.");
    const nombresVariablesOriginalesTexto = limpiarComentariosYEspaciosInternos(coincidencia[1]);
    const nombresOriginalesParaPrompt = nombresVariablesOriginalesTexto.split(',').map(v => v.trim());
    const variablesDestinoEntrada = nombresOriginalesParaPrompt.map(n => n.toLowerCase());
    if (variablesDestinoEntrada.length === 0 || variablesDestinoEntrada.some(v => v === "")) throw new Error("Leer debe especificar variable(s).");
    for (const nombreVarLc of variablesDestinoEntrada) {
        const descriptor = ambitoEjecucion[nombreVarLc];
        const nombreOriginalCorrespondiente = nombresOriginalesParaPrompt.find(n => n.toLowerCase() === nombreVarLc) || nombreVarLc;
        if (!descriptor) throw new Error(`Variable '${nombreOriginalCorrespondiente}' no definida para 'Leer' L${numeroLinea}.`);
        if (descriptor.esArreglo) throw new Error(`Leer arreglo completo '${nombreOriginalCorrespondiente}' no soportado L${numeroLinea}.`);
    }
    let mensajePrompt = nombresOriginalesParaPrompt.length === 1 ? `Ingrese valor para ${nombresOriginalesParaPrompt[0]}:` : `Ingrese ${nombresOriginalesParaPrompt.length} valores para ${nombresOriginalesParaPrompt.join(', ')}:`;
    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') window.WebgoritmoGlobal.solicitarEntradaUsuario(mensajePrompt);
    else { console.error("solicitarEntradaUsuario no disponible"); if (Webgoritmo.UI.añadirSalida) { Webgoritmo.UI.añadirSalida(mensajePrompt, 'input-prompt'); Webgoritmo.UI.añadirSalida("[ERROR INTERNO: Campo de entrada no disponible]", "error");}}
    Webgoritmo.estadoApp.esperandoEntradaUsuario = true;
    Webgoritmo.estadoApp.variablesDestinoEntrada = variablesDestinoEntrada;
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = nombresOriginalesParaPrompt;
    Webgoritmo.estadoApp.promesaEntradaPendiente = new Promise(resolve => { Webgoritmo.estadoApp.resolverPromesaEntrada = resolve; if (Webgoritmo.estadoApp.detenerEjecucion) resolve(); });
    await Webgoritmo.estadoApp.promesaEntradaPendiente;
    Webgoritmo.estadoApp.promesaEntradaPendiente = null; Webgoritmo.estadoApp.esperandoEntradaUsuario = false;
    if (Webgoritmo.estadoApp.detenerEjecucion && Webgoritmo.estadoApp.errorEnEjecucion) throw new Error(Webgoritmo.estadoApp.errorEnEjecucion);
    return true;
};

// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida || !Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo || !Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) {
        console.error("Error: Módulos esenciales no están listos.");
        if(Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Error crítico: Módulos faltantes.", "error");
        return;
    }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (ESTADO ESTABLE REVERTIDO) ---", "normal");

    Webgoritmo.estadoApp.variablesGlobales = {}; Webgoritmo.estadoApp.funcionesDefinidas = {};
    Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.variablesDestinoEntrada = [];
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = []; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];
    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = 0;
    for (let i = 0; i < todasLasLineas.length; i++) {
        const lineaOriginal = todasLasLineas[i];
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginal);
        const lineaMinusculas = lineaProcesada.toLowerCase();
        if (lineaMinusculas.startsWith("algoritmo") || lineaMinusculas.startsWith("proceso")) {
            if (dentroBloquePrincipal) { Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: No anidar Algoritmo/Proceso.`; break; }
            dentroBloquePrincipal = true; numeroLineaInicioBloque = i;
        } else if (lineaMinusculas.startsWith("finalgoritmo") || lineaMinusculas.startsWith("finproceso")) {
            if (!dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: Fin inesperado.`;
            dentroBloquePrincipal = false; break;
        } else if (dentroBloquePrincipal) {
            lineasAlgoritmoPrincipal.push(lineaOriginal);
        } else if (lineaProcesada !== "") {
            Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: Instrucción '${lineaProcesada}' fuera de bloque.`; break;
        }
    }
    if (!Webgoritmo.estadoApp.errorEnEjecucion && numeroLineaInicioBloque === -1 && todasLasLineas.some(l => limpiarComentariosYEspacios(l) !== "")) Webgoritmo.estadoApp.errorEnEjecucion = "No se encontró bloque Algoritmo/Proceso.";
    else if (!Webgoritmo.estadoApp.errorEnEjecucion && dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Bloque L${numeroLineaInicioBloque + 1} no cerrado.`;

    if (Webgoritmo.estadoApp.errorEnEjecucion) { Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); Webgoritmo.UI.añadirSalida("--- Ejecución con errores de estructura ---", "error");}
    else if (lineasAlgoritmoPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque + 1);
    else if (numeroLineaInicioBloque !== -1) Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning");

    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo (ESTADO ESTABLE REVERTIDO) procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');
    let i = 0;
    while (i < lineasDelBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        const lineaOriginalFuente = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i;

        console.log(`[RAW L${numeroLineaActualGlobal}]: "${lineaOriginalFuente}"`);
        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginalFuente };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginalFuente);
        console.log(`[PROCESADA L${numeroLineaActualGlobal}]: "${lineaProcesada}"`);

        if (lineaProcesada === "") { i++; continue; }
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: ${lineaProcesada}`, 'debug');

        const lineaMinusculas = lineaProcesada.toLowerCase();
        let instruccionManejada = false;
        try {
            const regexAsignacion = /^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?\s*(?:<-|=)/;
            const esPotencialAsignacion = regexAsignacion.test(lineaProcesada);

            if (lineaMinusculas.startsWith("definir ")) {
                console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Detectado por startsWith: definir`);
                instruccionManejada = await Webgoritmo.Interprete.procesarDefinicion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("escribir ") || lineaMinusculas.startsWith("imprimir ") || lineaMinusculas.startsWith("mostrar ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarSalidaConsola(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("leer ")) {
                 console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Detectado por startsWith: leer`);
                instruccionManejada = await Webgoritmo.Interprete.procesarEntradaUsuario(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
            // FALTAN Si, Mientras, Para, etc. Se añadirán en sus fases.
            else if (esPotencialAsignacion) {
                 console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Detectado como ASIGNACIÓN por regex.`);
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else {
                const primeraPalabra = lineaMinusculas.split(" ")[0];
                const palabrasClaveConocidas = ["algoritmo","proceso","finalgoritmo","finproceso"];
                if (!palabrasClaveConocidas.includes(primeraPalabra) && lineaProcesada) { // Evitar error si la línea está vacía después de todo
                    throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);
                }
            }
        } catch (error) { Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`; Webgoritmo.estadoApp.detenerEjecucion = true; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); break;  }
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        i++;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===String(val).trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===String(val).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0'))return n;}}if(tipoDestN==='logico'&&tipoOriN==='cadena'){const valL=String(val).trim().toLowerCase();if(valL==="verdadero"||valL==="v")return true;if(valL==="falso"||valL==="f")return false;}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(Webgoritmo.Expresiones && Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal)) { throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en esta expresión.`); } return descriptor.valor; };
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn("Dimension no implementada"); return false;};
Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lA,aA,nLSi,lBC,iSiB) { console.warn("Si no implementado"); return iSiB;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn("llamarSubProceso no implementado"); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn("parsearDefinicionSubProceso no implementado"); return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (ESTADO ESTABLE REVERTIDO) cargado.");
