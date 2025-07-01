// motorInterprete.js (Fase 4 Reconstrucción: Preparado para evaluador de expresiones completo)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

Webgoritmo.Interprete.Utilidades = {
    obtenerValorPorDefectoSegunTipo: function(tipoTexto) { /* ... (como en Fase 2) ... */ },
    crearDescriptorVariable: function(nombreOriginal, tipoDeclarado, valorInicial) { /* ... (como en Fase 2) ... */ },
    inferirTipoDesdeValor: function(valor) { /* ... (como en Fase 2) ... */ },
    convertirTextoLiteralASuValor: function(textoLiteral) { /* ... (como en Fase 2) ... */ }, // Podría quedar obsoleto si evaluarExpresion maneja todo
    convertirValorParaTipo: function(valor, tipoDestino, numeroLinea) { /* ... (como en Fase 2) ... */ },

    /**
     * Obtiene el valor real de una variable desde el ámbito.
     * @param {string} nombreVariable El nombre de la variable (se convertirá a minúsculas).
     * @param {object} ambitoActual El ámbito donde buscar la variable.
     * @param {number} numeroLinea El número de línea para mensajes de error.
     * @returns {*} El valor de la variable.
     * @throws {Error} Si la variable no está definida o es un arreglo usado sin índice.
     */
    obtenerValorRealVariable: function(nombreVariable, ambitoActual, numeroLinea) {
        const nombreVarLc = String(nombreVariable).toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) {
            throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`);
        }
        const descriptor = ambitoActual[nombreVarLc];
        if (descriptor.esArreglo) { // Asumiendo 'esArreglo' en el descriptor
            throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en una expresión.`);
        }
        return descriptor.valor;
    }
};

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) {
    const regexEscribir = /^(?:escribir|imprimir|mostrar)\s+(.*)/i;
    const coincidencia = lineaCompleta.match(regexEscribir);
    if (!coincidencia || !coincidencia[1]) throw new Error("Instrucción Escribir mal formada.");
    const argumentosComoTexto = limpiarComentariosYEspaciosInternos(coincidencia[1]);
    if (argumentosComoTexto === "" && lineaCompleta.match(regexEscribir)[0].trim() !== coincidencia[0].split(" ")[0]) return true; // Escribir // comentario
    if (argumentosComoTexto === "") throw new Error(`'${coincidencia[0].split(" ")[0]}' sin argumentos L${numeroLinea}.`);

    const listaExpresiones = []; /* ... (lógica de split de args como en Fase 2/3) ... */
    let buffer = ""; let dentroDeComillas = false; let tipoComillas = '';
    for (let i = 0; i < argumentosComoTexto.length; i++) {
        const char = argumentosComoTexto[i];
        if ((char === '"' || char === "'") && (i === 0 || argumentosComoTexto[i-1] !== '\\')) {
            if (!dentroDeComillas) { dentroDeComillas = true; tipoComillas = char; buffer += char; }
            else if (char === tipoComillas) { dentroDeComillas = false; buffer += char; }
            else { buffer += char; }
        } else if (char === ',' && !dentroDeComillas) {
            listaExpresiones.push(buffer.trim()); buffer = "";
        } else { buffer += char; }
    }
    if (buffer.trim() !== "") listaExpresiones.push(buffer.trim());

    let salidaFinal = "";
    for (const exprTexto of listaExpresiones) {
        if (exprTexto === "") continue;
        // Ahora TODOS los argumentos de Escribir se evalúan como expresiones
        const valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprTexto, ambitoActual, numeroLinea);

        if (typeof valorEvaluado === 'boolean') {
            salidaFinal += valorEvaluado ? "Verdadero" : "Falso";
        } else {
            salidaFinal += String(valorEvaluado);
        }
    }
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(salidaFinal, 'normal');
    return true;
};

Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 2) ... */ };
Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
    const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/; // Modificado para permitir acceso a arreglo en lado izq
    const coincidencia = lineaCompleta.match(regexAsignacion);
    if (!coincidencia) throw new Error("Sintaxis de asignación incorrecta.");

    const destinoTexto = coincidencia[1].trim();
    const expresionTextoCruda = coincidencia[2];
    const expresionAEvaluar = limpiarComentariosYEspaciosInternos(expresionTextoCruda);

    if (expresionAEvaluar === "") throw new Error(`Expresión vacía en asignación en línea ${numeroLinea}.`);

    const valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(expresionAEvaluar, ambitoEjecucion, numeroLinea);

    // TODO Fase Arreglos: Manejar asignación a elementos de arreglo: miArreglo[indice] <- valor
    // Por ahora, solo asignación a variables simples:
    const nombreVarDestinoLc = destinoTexto.toLowerCase();
    if (!ambitoEjecucion.hasOwnProperty(nombreVarDestinoLc)) {
        throw new Error(`Variable '${destinoTexto}' no definida antes de asignarle valor (L${numeroLinea}).`);
    }
    const descriptorVariable = ambitoEjecucion[nombreVarDestinoLc];
    if (descriptorVariable.esArreglo) { // Asumiendo propiedad 'esArreglo'
         throw new Error(`Error en línea ${numeroLinea}: No se puede asignar directamente a un arreglo ('${descriptorVariable.nombreOriginal}'). Especifique un índice.`);
    }

    try {
        descriptorVariable.valor = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valorEvaluado, descriptorVariable.tipoDeclarado, numeroLinea);
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Variable '${descriptorVariable.nombreOriginal}' <- ${descriptorVariable.valor}`, 'debug');
    } catch (e) { throw e; }
    return true;
};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 3) ... */ };

// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { /* ... */ return; } /* ... (otros chequeos) ... */
    if (!Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) { Webgoritmo.UI.añadirSalida("Error: Evaluador de expresiones (completo) no listo.", "error"); return; }

    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Fase 4: Expresiones Arit/Lóg) ---", "normal");

    Webgoritmo.estadoApp.variablesGlobales = {};
    // ... (resto de inicialización de estadoApp como en Fase 3) ...
    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    // ... (lógica de parseo de bloque principal como en Fases anteriores) ...
    // ... (llamada a ejecutarBloqueCodigo) ...
    // ... (mensajes de finalización) ...
    // --- Código copiado de Fase 3 para estructura principal ---
    Webgoritmo.estadoApp.funcionesDefinidas = {};
    Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.variablesDestinoEntrada = [];
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = []; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];
    let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = -1;
    for (let i = 0; i < todasLasLineas.length; i++) {
        const lineaActualOriginal = todasLasLineas[i];
        const lineaActualProcesada = limpiarComentariosYEspacios(lineaActualOriginal);
        const lineaActualMinusculas = lineaActualProcesada.toLowerCase();
        if (lineaActualMinusculas.startsWith("algoritmo") || lineaActualMinusculas.startsWith("proceso")) {
            if (dentroBloquePrincipal) { Webgoritmo.estadoApp.errorEnEjecucion = `Error en línea ${i + 1}: No anidar 'Algoritmo'/'Proceso'.`; break; }
            dentroBloquePrincipal = true; numeroLineaInicioBloque = i + 1;
        } else if (lineaActualMinusculas.startsWith("finalgoritmo") || lineaActualMinusculas.startsWith("finproceso")) {
            if (!dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Error en línea ${i + 1}: 'FinAlgoritmo'/'FinProceso' inesperado.`;
            dentroBloquePrincipal = false; break;
        } else if (dentroBloquePrincipal) {
            lineasAlgoritmoPrincipal.push(lineaActualOriginal);
        } else if (lineaActualProcesada !== "") {
            Webgoritmo.estadoApp.errorEnEjecucion = `Error en línea ${i + 1}: Instrucción '${lineaActualProcesada}' fuera de bloque.`; break;
        }
    }
    if (!Webgoritmo.estadoApp.errorEnEjecucion && numeroLineaInicioBloque === -1 && todasLasLineas.some(l => limpiarComentariosYEspacios(l) !== "")) Webgoritmo.estadoApp.errorEnEjecucion = "No se encontró bloque 'Algoritmo' o 'Proceso'.";
    else if (!Webgoritmo.estadoApp.errorEnEjecucion && dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Bloque L${numeroLineaInicioBloque} no cerrado.`;

    if (Webgoritmo.estadoApp.errorEnEjecucion) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error");
    else if (lineasAlgoritmoPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque);
    else if (numeroLineaInicioBloque !== -1) Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning");

    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Fase 4) ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase 4) ---", "error");
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    // ... (lógica de iteración y limpieza de línea como en Fase 3) ...
    for (let i = 0; i < lineasDelBloque.length; i++) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        const lineaOriginal = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i;
        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginal };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginal);
        if (lineaProcesada === "") continue;
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: ${lineaProcesada}`, 'debug');
        const lineaMinusculas = lineaProcesada.toLowerCase();
        let instruccionManejada = false;

        try {
            if (lineaMinusculas.startsWith("escribir ") || lineaMinusculas.startsWith("imprimir ") || lineaMinusculas.startsWith("mostrar ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarSalidaConsola(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("definir ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarDefinicion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("leer ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarEntradaUsuario(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
             else if (lineaProcesada.match(/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?\s*(?:<-|=)/)) { // Permitir acceso a arreglo en lado izq
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
            // ... más instrucciones en el futuro ...
            if (!instruccionManejada && lineaProcesada) { /* ... (error instrucción no reconocida) ... */ }
        } catch (error) { /* ... (manejo de error) ... */  Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`; Webgoritmo.estadoApp.detenerEjecucion = true; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); break;  }
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

// --- Funciones de utilidad (copiadas para completitud) ---
function limpiarComentariosYEspacios(linea) { /* ... */ }
function limpiarComentariosYEspaciosInternos(texto) { /* ... */ }
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { /* ... */};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){ /* ... */};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){ /* ... */};
Webgoritmo.Interprete.Utilidades.convertirTextoLiteralASuValor = function(txtLit){ /* ... */}; // Obsoleto
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){ /* ... */};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (Fase 4 Reconstrucción: Preparado para evaluador expr.) cargado.");

// Funciones placeholder que estaban al final del archivo anterior, ahora correctamente en el namespace Util o como handlers placeholder
Webgoritmo.Interprete.procesarDimensionArreglo = async function(linea, ambitoActual, numLineaOriginal) {return false;};
Webgoritmo.Interprete.procesarSiCondicional = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloqueCompleto, indiceSiEnBloque) {return indiceSiEnBloque;};
Webgoritmo.Interprete.llamarSubProceso = async function(nombreFuncionOriginal, listaExprArgumentosStr, ambitoLlamador, numLineaOriginalLlamada) {return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lineaIni,idxIni,todasLns){ return null;};

// Copiar definiciones de funciones de utilidad para mantener consistencia
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=this.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===val.trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===val.trim())return n;}}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
