// motorInterprete.js (Fase 4 Reconstrucción: VERIFICACIÓN LOGS RAW/PROCESADA)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

Webgoritmo.Interprete.Utilidades = { /* ... (como en la versión anterior de Fase 4) ... */ };

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) { /* ... (como en Fase 4 anterior) ... */ };
Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
    console.log(`[DEBUG procesarDefinicion L${numeroLinea}] Entrando con línea: "${lineaCompleta}"`);
    const regexDefinir = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;
    const coincidencia = lineaCompleta.match(regexDefinir);
    if (!coincidencia || coincidencia.length < 3) throw new Error(`Sintaxis incorrecta 'Definir' L${numeroLinea}. Recibido: "${lineaCompleta}"`);
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
Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 4 anterior) ... */ };
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 3) ... */ };

// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { console.error("UI no lista"); return; }
    if (!Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) { Webgoritmo.UI.añadirSalida("Error: Evaluador de expresiones no listo (VERIFICACIÓN LOGS).", "error"); return; }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    // CAMBIO VISIBLE AQUÍ:
    Webgoritmo.UI.añadirSalida("--- INICIANDO EJECUCIÓN (VERIFICACIÓN DE LOGS RAW/PROCESADA) ---", "normal");

    Webgoritmo.estadoApp.variablesGlobales = {};
    Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null;
    Webgoritmo.estadoApp.funcionesDefinidas = {};
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.variablesDestinoEntrada = [];
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = []; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];
    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
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

    if (Webgoritmo.estadoApp.errorEnEjecucion) {
        Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error");
        Webgoritmo.UI.añadirSalida("--- Ejecución con errores de estructura (VERIFICACIÓN LOGS) ---", "error");
    } else if (lineasAlgoritmoPrincipal.length > 0) {
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque);
    } else if (numeroLineaInicioBloque !== -1) {
        Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning");
    }

    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (VERIFICACIÓN LOGS) ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion) { /* El error ya se mostró arriba o en ejecutarBloqueCodigo */ }
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo (VERIFICACIÓN LOGS) procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');

    let i = 0;
    while (i < lineasDelBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        const lineaOriginalFuente = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i;

        // LOGS CRUCIALES A VERIFICAR
        console.log(`[RAW L${numeroLineaActualGlobal}]: "${lineaOriginalFuente}"`);

        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginalFuente };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginalFuente);

        console.log(`[PROCESADA L${numeroLineaActualGlobal}]: "${lineaProcesada}"`);
        // FIN DE LOGS CRUCIALES

        if (lineaProcesada === "") {
            i++;
            continue;
        }

        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: ${lineaProcesada}`, 'debug');

        const lineaMinusculas = lineaProcesada.toLowerCase();
        let instruccionManejada = false;

        try {
            const regexAsignacion = /^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?\s*(?:<-|=)/;
            const esPotencialAsignacion = regexAsignacion.test(lineaProcesada);

            if (lineaProcesada.includes("<-") || lineaProcesada.includes("=")) {
                 console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Para línea: "${lineaProcesada}"`);
                 console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Test regex asignación: ${esPotencialAsignacion}`);
            }
            if (lineaMinusculas.startsWith("definir ")) {
                 console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Detectado por startsWith: definir`);
            }

            if (lineaMinusculas.startsWith("definir ")) {
                console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] ENTRÓ AL IF DE DEFINIR`);
                instruccionManejada = await Webgoritmo.Interprete.procesarDefinicion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("escribir ") || lineaMinusculas.startsWith("imprimir ") || lineaMinusculas.startsWith("mostrar ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarSalidaConsola(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("leer ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarEntradaUsuario(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
            else if (esPotencialAsignacion) {
                console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Detectado como ASIGNACIÓN por regex.`);
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
            else {
                const matchLlamadaSubProceso = lineaProcesada.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/);
                if (matchLlamadaSubProceso) {
                    console.log(`[DEBUG ejecutarBloque L${numeroLineaActualGlobal}] Detectado como LLAMADA A SUBPROCESO por regex.`);
                     if (Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(matchLlamadaSubProceso[1].toLowerCase())) {
                        console.warn(`Llamada a subproceso ${matchLlamadaSubProceso[1]} detectada pero aún no ejecutada funcionalmente.`);
                        instruccionManejada = true;
                     } else { throw new Error(`SubProceso '${matchLlamadaSubProceso[1]}' no definido.`); }
                } else if (lineaProcesada) {
                     const primeraPalabra = lineaMinusculas.split(" ")[0];
                     const palabrasClaveBloques = ["algoritmo","proceso","finalgoritmo","finproceso"];
                     if (!palabrasClaveBloques.includes(primeraPalabra)) {
                        throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);
                     }
                }
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
Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);if(argsTxt===""&&linea.match(rgx)[0].trim()!==m[0].split(" ")[0])return true; if(argsTxt==="")throw new Error(`'${m[0].split(" ")[0]}' sin args L${numLn}.`);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i]; if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if(exT==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(exT,ambito,numLn); outF+=typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart));} if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal'); return true;};
Webgoritmo.Interprete.procesarAsignacion = async function(linea,ambito,numLn){ const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/; const m=linea.match(regexAsignacion); if(!m)throw new Error("Sintaxis asignación incorrecta L"+numLn); const destStr=m[1].trim(); const exprStrCruda=m[2]; const exprAEval=limpiarComentariosYEspaciosInternos(exprStrCruda); if(exprAEval==="")throw new Error(`Expresión vacía L${numLn}.`); const valEval=await Webgoritmo.Expresiones.evaluarExpresion(exprAEval,ambito,numLn); const accArrMatch=destStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/); if(accArrMatch){ throw new Error("Asignación a arreglos no implementada completamente en esta fase.");} else {const varNomLc=destStr.toLowerCase(); if(!ambito.hasOwnProperty(varNomLc))throw new Error(`Var '${destStr}' no def L${numLn}.`); const descVar=ambito[varNomLc]; if(descVar.esArreglo)throw new Error(`Asignar a arreglo completo no permitido L${numLn}.`); try{descVar.valor=this.Utilidades.convertirValorParaTipo(valEval,descVar.tipoDeclarado,numLn);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`,'debug');}catch(e){throw e;}} return true;};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ const matchLeer=linea.match(/^leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLn); const nomsOrigRaw=limpiarComentariosYEspaciosInternos(matchLeer[1]); const nomsPrompt=nomsOrigRaw.split(',').map(v=>v.trim()); const nomsDest=nomsPrompt.map(n=>n.toLowerCase()); if(nomsDest.length===0||nomsDest.some(v=>v===""))throw new Error("Leer sin vars L"+numLn); for(const nomLc of nomsDest){const nomP=nomsPrompt.find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomP}' inválida L${numLn}.`); if(!ambito.hasOwnProperty(nomLc))throw new Error(`Var '${nomP}' no def L${numLn}.`); if(ambito[nomLc].esArreglo)throw new Error(`Leer arreglo completo no soportado L${numLn}.`);} let pMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(pMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntradaUsuario=true; Webgoritmo.estadoApp.variablesDestinoEntrada=nomsDest; Webgoritmo.estadoApp.nombresOriginalesParaPrompt=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; Webgoritmo.estadoApp.esperandoEntradaUsuario=false; if(Webgoritmo.estadoApp.detenerEjecucion&&Webgoritmo.estadoApp.errorEnEjecucion)throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); return true;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lineaIni,idxIni,todasLns){ /* ... (como en Bloque 6.1) ... */ return null;};
Webgoritmo.Interprete.llamarSubProceso = async function(nomFunO,lstExprArgsStr,ambitoLlamador,numLnLlamada){ /* ... (como en Bloque 6.1) ... */ return undefined;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (VERIFICACIÓN LOGS RAW/PROCESADA) cargado.");
