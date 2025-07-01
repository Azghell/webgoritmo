// motorInterprete.js (Fase 3 Reconstrucción: Implementar Leer)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

// --- NAMESPACE PARA UTILIDADES DEL INTÉRPRETE ---
Webgoritmo.Interprete.Utilidades = {
    obtenerValorPorDefectoSegunTipo: function(tipoTexto) { /* ... (como en Fase 2) ... */ },
    crearDescriptorVariable: function(nombreOriginal, tipoDeclarado, valorInicial) { /* ... (como en Fase 2) ... */ },
    inferirTipoDesdeValor: function(valor) { /* ... (como en Fase 2) ... */ },
    convertirTextoLiteralASuValor: function(textoLiteral) { /* ... (como en Fase 2) ... */ },
    convertirValorParaTipo: function(valor, tipoDestino, numeroLinea) { /* ... (como en Fase 2) ... */ }
};

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) { /* ... (como en Fase 2) ... */ };
Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 2) ... */ };
Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 2) ... */ };

/**
 * Procesa la instrucción Leer (Fase 3).
 * @param {string} lineaCompleta - La línea completa de la instrucción Leer.
 * @param {object} ambitoEjecucion - El ámbito donde se encuentran las variables.
 * @param {number} numeroLinea - El número de línea original.
 */
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
    const regexLeer = /leer\s+(.+)/i;
    const coincidencia = lineaCompleta.match(regexLeer);

    if (!coincidencia || !coincidencia[1]) {
        throw new Error("Sintaxis incorrecta para 'Leer'. Formato: Leer <variable1>, <variable2>, ...");
    }

    const nombresVariablesOriginalesTexto = limpiarComentariosYEspaciosInternos(coincidencia[1]);
    const nombresOriginalesParaPrompt = nombresVariablesOriginalesTexto.split(',').map(v => v.trim());
    const variablesDestinoEntrada = nombresOriginalesParaPrompt.map(n => n.toLowerCase());

    if (variablesDestinoEntrada.length === 0 || variablesDestinoEntrada.some(v => v === "")) {
        throw new Error("Instrucción 'Leer' debe especificar variable(s) válidas.");
    }

    // Validar que todas las variables existan y no sean arreglos completos
    for (const nombreVarLc of variablesDestinoEntrada) {
        const descriptor = ambitoEjecucion[nombreVarLc];
        if (!descriptor) {
            const nombreOriginalCorrespondiente = nombresOriginalesParaPrompt.find(n => n.toLowerCase() === nombreVarLc) || nombreVarLc;
            throw new Error(`Variable '${nombreOriginalCorrespondiente}' no ha sido definida antes de usarla en 'Leer'.`);
        }
        if (descriptor.esArreglo) { // Asumiendo que el descriptor tendrá una propiedad 'esArreglo'
            const nombreOriginalCorrespondiente = descriptor.nombreOriginal || nombreVarLc;
            throw new Error(`No se puede usar 'Leer' para asignar a un arreglo completo ('${nombreOriginalCorrespondiente}'). Especifique un elemento del arreglo.`);
        }
    }

    let mensajePrompt = nombresOriginalesParaPrompt.length === 1 ?
        `Ingrese valor para ${nombresOriginalesParaPrompt[0]}:` :
        `Ingrese ${nombresOriginalesParaPrompt.length} valores (separados por espacio/coma) para ${nombresOriginalesParaPrompt.join(', ')}:`;

    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') {
        window.WebgoritmoGlobal.solicitarEntradaUsuario(mensajePrompt);
    } else {
        console.error("Función global solicitarEntradaUsuario no disponible para 'Leer'.");
        if (Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(mensajePrompt, 'input-prompt');
            Webgoritmo.UI.añadirSalida("[ERROR INTERNO: No se pudo mostrar el campo de entrada.]", "error");
        }
    }

    Webgoritmo.estadoApp.esperandoEntradaUsuario = true;
    Webgoritmo.estadoApp.variablesDestinoEntrada = variablesDestinoEntrada; // Nombres en minúscula para la lógica de app.js
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = nombresOriginalesParaPrompt; // Nombres originales para mensajes de error en app.js

    console.log(`[motorInterprete] procesarEntradaUsuario: Esperando entrada para: ${nombresOriginalesParaPrompt.join(', ')}`);

    Webgoritmo.estadoApp.promesaEntradaPendiente = new Promise(resolve => {
        Webgoritmo.estadoApp.resolverPromesaEntrada = resolve;
        if (Webgoritmo.estadoApp.detenerEjecucion) { // Si ya se pidió detener, resolver de inmediato.
            console.log("[motorInterprete] procesarEntradaUsuario: Detención solicitada, resolviendo promesa de entrada.");
            resolve();
        }
    });

    await Webgoritmo.estadoApp.promesaEntradaPendiente;
    Webgoritmo.estadoApp.promesaEntradaPendiente = null; // Limpiar
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false; // Ya no estamos esperando directamente aquí

    console.log("[motorInterprete] procesarEntradaUsuario: Promesa de entrada resuelta.");

    // Si app.js encontró un error durante la conversión/asignación de la entrada, habrá puesto detenerEjecucion = true
    if (Webgoritmo.estadoApp.detenerEjecucion && Webgoritmo.estadoApp.errorEnEjecucion) {
        // El error ya fue (o será) mostrado por el bucle principal de ejecutarBloqueCodigo
        // Solo nos aseguramos de que la ejecución se detenga.
        throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); // Re-lanzar para detener el bloque actual
    }

    return true; // Instrucción Leer manejada.
};


// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    // ... (como en Fase 2, solo cambiar mensaje de log) ...
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { /* ... */ return; }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { /* ... */ return; }
    if (!Webgoritmo.estadoApp) { /* ... */ return; }
    if (!Webgoritmo.Expresiones) { Webgoritmo.UI.añadirSalida("Error: Evaluador de expresiones no listo (Fase 3).", "error"); return; }

    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Fase 3: Leer) ---", "normal");

    Webgoritmo.estadoApp.variablesGlobales = {};
    Webgoritmo.estadoApp.funcionesDefinidas = {};
    Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null;
    // Nuevas propiedades de estado para Leer
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false;
    Webgoritmo.estadoApp.variablesDestinoEntrada = [];
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = [];
    Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.resolverPromesaEntrada = null;
    Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];

    // ... (resto de la lógica de parseo de bloque principal como en Fase 2) ...
    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = -1;
    for (let i = 0; i < todasLasLineas.length; i++) { /* ... */ } // Simplificado para brevedad
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

    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Fase 3) ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase 3) ---", "error");
    // Si está esperando entrada, no se muestra "finalizada" aún.
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    // ... (inicio como en Fase 2) ...
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
            } else if (lineaMinusculas.startsWith("leer ")) { // NUEVO en Fase 3
                instruccionManejada = await Webgoritmo.Interprete.procesarEntradaUsuario(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
             else if (lineaProcesada.match(/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*\s*(?:<-|=)/)) {
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
            // ... más instrucciones en el futuro ...
            if (!instruccionManejada && lineaProcesada) {
                const primeraPalabra = lineaMinusculas.split(" ")[0];
                const palabrasClaveBloques = ["algoritmo","proceso","finalgoritmo","finproceso"];
                if (!palabrasClaveBloques.includes(primeraPalabra)) throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);
            }
        } catch (error) {
            Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error");
            break;
        }
        // Importante: Si procesarEntradaUsuario pausó la ejecución, y luego hubo un error (ej. el usuario cerró la pestaña o se detuvo manualmente)
        // detenerEjecucion será true aquí.
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

// --- Funciones de utilidad (copiadas para completitud, sin cambios funcionales desde Fase 2) ---
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t=String(tipo).toLowerCase();switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};}; // Añadido esArreglo y dimensiones
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirTextoLiteralASuValor = function(txtLit){const txtT=txtLit.trim();if(txtT.toLowerCase()==="verdadero")return true;if(txtT.toLowerCase()==="falso")return false;if((txtT.startsWith('"')&&txtT.endsWith('"'))||(txtT.startsWith("'")&&txtT.endsWith("'")))return txtT.substring(1,txtT.length-1);if(/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(txtT)){const n=Number(txtT);if(!isNaN(n))return n;}throw new Error(`'${txtLit}' no es literal simple.`);};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=this.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===val.trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===val.trim())return n;}}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i];if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if((exT.startsWith('"')&&exT.endsWith('"'))||(exT.startsWith("'")&&exT.endsWith("'"))){outF+=exT.substring(1,exT.length-1);}else{const nomLc=exT.toLowerCase();if(ambito.hasOwnProperty(nomLc)){const desc=ambito[nomLc];outF+=desc.tipoDeclarado==='logico'?(desc.valor?"Verdadero":"Falso"):String(desc.valor);}else throw new Error(`Variable '${exT}' no definida.`);}}if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal');return true;};
Webgoritmo.Interprete.procesarDefinicion = async function(linea,ambito,numLn){const rgx=/definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;const m=linea.match(rgx);if(!m||m.length<3)throw new Error("Sintaxis Definir incorrecta.");const noms=m[1].split(',').map(n=>n.trim());const tipo=m[2].toLowerCase();for(const nom of noms){if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nom))throw new Error(`Nombre var inválido: '${nom}'.`);const nomLc=nom.toLowerCase();if(ambito.hasOwnProperty(nomLc))if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`Advertencia L${numLn}: Var '${nom}' redefinida.`,'warning');const valDef=this.Utilidades.obtenerValorPorDefectoSegunTipo(tipo);ambito[nomLc]=this.Utilidades.crearDescriptorVariable(nom,tipo,valDef);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${nom}' (${tipo}) definida.`,'debug');}return true;};
Webgoritmo.Interprete.procesarAsignacion = async function(linea,ambito,numLn){const rgx=/^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*(.+)\s*$/;const m=linea.match(rgx);if(!m)throw new Error("Sintaxis asignación incorrecta.");const nomDest=m[1];const nomDestLc=nomDest.toLowerCase();const exprTxt=limpiarComentariosYEspaciosInternos(m[2]);if(!ambito.hasOwnProperty(nomDestLc))throw new Error(`Var '${nomDest}' no definida.`);const descVar=ambito[nomDestLc];let valLit;try{valLit=await Webgoritmo.Expresiones.evaluarLiteral(exprTxt);}catch(e){throw new Error(`Error interpretando literal '${exprTxt}' L${numLn}: ${e.message}`);}try{descVar.valor=this.Utilidades.convertirValorParaTipo(valLit,descVar.tipoDeclarado,numLn);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`,'debug');}catch(e){throw e;}return true;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (Fase 3 Reconstrucción: Leer) cargado.");
