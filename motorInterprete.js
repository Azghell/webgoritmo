// motorInterprete.js (Fase 4 Reconstrucción: Debug Definir)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

Webgoritmo.Interprete.Utilidades = {
    obtenerValorPorDefectoSegunTipo: function(tipoTexto) { /* ... */ },
    crearDescriptorVariable: function(nombreOriginal, tipoDeclarado, valorInicial) { /* ... */ },
    inferirTipoDesdeValor: function(valor) { /* ... */ },
    convertirValorParaTipo: function(valor, tipoDestino, numeroLinea) { /* ... */ },
    obtenerValorRealVariable: function(nombreVariable, ambitoActual, numeroLinea) { /* ... */ }
};

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) { /* ... (como en Fase 4 anterior) ... */ };

Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
    console.log(`[DEBUG procesarDefinicion L${numeroLinea}] Entrando con línea: "${lineaCompleta}"`); // LOG AÑADIDO
    const regexDefinir = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;
    const coincidencia = lineaCompleta.match(regexDefinir);

    if (!coincidencia || coincidencia.length < 3) {
        throw new Error(`Sintaxis incorrecta para 'Definir' en línea ${numeroLinea}. Formato esperado: Definir <variable(s)> Como <tipo>. Se obtuvo: "${lineaCompleta}"`);
    }

    const nombresVariables = coincidencia[1].split(',').map(nombre => nombre.trim());
    const tipoVariable = coincidencia[2].toLowerCase();

    for (const nombreVar of nombresVariables) {
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVar)) {
            throw new Error(`Nombre de variable inválido: '${nombreVar}' en línea ${numeroLinea}.`);
        }
        const nombreVarLc = nombreVar.toLowerCase();
        if (ambitoEjecucion.hasOwnProperty(nombreVarLc)) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Advertencia en línea ${numeroLinea}: Variable '${nombreVar}' ya estaba definida. Se redefinirá.`, 'warning');
        }
        const valorPorDefecto = Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipoVariable);
        ambitoEjecucion[nombreVarLc] = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, valorPorDefecto);
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Variable '${nombreVar}' (${tipoVariable}) definida.`, 'debug'); // Log de éxito cambiado
    }
    return true;
};

Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 4 anterior) ... */ };
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 3) ... */ };

// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() { /* ... (como en Fase 4 anterior, solo mensaje de log) ... */
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { console.error("UI no lista"); return; }
    if (!Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) { Webgoritmo.UI.añadirSalida("Error: Evaluador de expresiones no listo (F4 Debug Definir).", "error"); return; }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (F4 Debug Definir) ---", "normal");
    Webgoritmo.estadoApp.variablesGlobales = {};
    Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null;
    // ... (resto de inicialización de estadoApp)
    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    // ... (lógica de parseo de bloque principal)
    // ... (llamada a ejecutarBloqueCodigo)
    // ... (mensajes de finalización)
    // --- Código copiado para estructura principal ---
    Webgoritmo.estadoApp.funcionesDefinidas = {};
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

    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (F4 Debug Definir) ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (F4 Debug Definir) ---", "error");
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    for (let i = 0; i < lineasDelBloque.length; i++) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        const lineaOriginal = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i;
        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginal };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginal);
        if (lineaProcesada === "") { i++; continue; }
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: ${lineaProcesada}`, 'debug');

        const lineaMinusculas = lineaProcesada.toLowerCase();
        let instruccionManejada = false;

        // Logs de depuración específicos para la detección de Definir
        if (numeroLineaActualGlobal === 1 && lineaMinusculas.startsWith('definir ')) { // Asumiendo que tu L1 es la primera relevante
             console.log(`[DEBUG L${numeroLineaActualGlobal} para Definir] lineaProcesada: "${lineaProcesada}", lineaMinusculas: "${lineaMinusculas}"`);
        }


        try {
            if (lineaMinusculas.startsWith("definir ")) {
                console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] ENTRÓ AL IF DE DEFINIR`); // LOG
                instruccionManejada = await Webgoritmo.Interprete.procesarDefinicion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("escribir ") || lineaMinusculas.startsWith("imprimir ") || lineaMinusculas.startsWith("mostrar ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarSalidaConsola(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("leer ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarEntradaUsuario(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaProcesada.match(/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?\s*(?:<-|=)/)) {
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
            // ... más instrucciones en el futuro ...
            if (!instruccionManejada && lineaProcesada) {
                const primeraPalabra = lineaMinusculas.split(" ")[0];
                const palabrasClaveBloques = ["algoritmo","proceso","finalgoritmo","finproceso"];
                if (!palabrasClaveBloques.includes(primeraPalabra)) throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);
            }
        } catch (error) { Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`; Webgoritmo.estadoApp.detenerEjecucion = true; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); break;  }
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        i++;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

// --- Funciones de utilidad (copiadas y referenciadas) ---
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=this.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===val.trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===val.trim())return n;}}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo) { throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en una expresión.`); } return descriptor.valor; };

// Placeholder para funciones que aún no se han refactorizado completamente a la nueva nomenclatura o estructura.
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn(`procesarDimensionArreglo no implementado en Fase 4`); return false;};
Webgoritmo.Interprete.procesarSiCondicional = async function(lA,aA,nLSi,lBC,iSiB) { console.warn(`procesarSiCondicional no implementado`); return iSiB;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn(`llamarSubProceso no implementado`); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn(`parsearDefinicionSubProceso no implementado`); return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (F4 Debug Definir) cargado.");
