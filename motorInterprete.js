// motorInterprete.js (Fase 5 Reconstrucción: Si-Entonces-Sino)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

Webgoritmo.Interprete.Utilidades = { /* ... (como en Fase 4) ... */ };

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) { /* ... (como en Fase 4) ... */ };
Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 4) ... */ };
Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 4) ... */ };
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 3) ... */ };

/**
 * Procesa una estructura Si-Entonces-Sino.
 * @param {string} lineaSiOriginal - La línea que contiene "Si <condicion> Entonces".
 * @param {object} ambitoEjecucion - El ámbito actual.
 * @param {number} numeroLineaSi - El número de línea donde comienza el Si.
 * @param {string[]} lineasDelBloquePadre - Todas las líneas del bloque donde se encuentra este Si.
 * @param {number} indiceSiEnPadre - El índice de la línea Si dentro de lineasDelBloquePadre.
 * @returns {Promise<number>} El índice de la línea DESPUÉS del FinSi correspondiente (relativo a lineasDelBloquePadre).
 */
Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lineaSiOriginal, ambitoEjecucion, numeroLineaSi, lineasDelBloquePadre, indiceSiEnPadre) {
    const regexSi = /si\s+(.+?)\s+entonces/i;
    const coincidenciaSi = lineaSiOriginal.match(regexSi);

    if (!coincidenciaSi || !coincidenciaSi[1]) {
        throw new Error(`Sintaxis incorrecta para 'Si' en línea ${numeroLineaSi}.`);
    }
    const expresionCondicion = limpiarComentariosYEspaciosInternos(coincidenciaSi[1]);
    if (expresionCondicion === "") {
        throw new Error(`Condición vacía para 'Si' en línea ${numeroLineaSi}.`);
    }

    let valorCondicion;
    try {
        valorCondicion = await Webgoritmo.Expresiones.evaluarExpresion(expresionCondicion, ambitoEjecucion, numeroLineaSi);
    } catch (e) {
        throw new Error(`Error evaluando condición del 'Si' ("${expresionCondicion}") en línea ${numeroLineaSi}: ${e.message}`);
    }

    if (typeof valorCondicion !== 'boolean') {
        throw new Error(`La condición del 'Si' ("${expresionCondicion}") en línea ${numeroLineaSi} debe evaluarse a un valor lógico (Verdadero/Falso), pero se obtuvo: ${valorCondicion} (tipo: ${typeof valorCondicion}).`);
    }

    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Condición Si (${expresionCondicion}) evaluada a: ${valorCondicion ? "Verdadero" : "Falso"}`, 'debug');

    let bloqueEntonces = [];
    let bloqueSino = [];
    let bufferActual = bloqueEntonces;
    let nivelAnidamientoSi = 0;
    let indiceActual = indiceSiEnPadre + 1;
    let encontradoSinoParaEsteSi = false;
    let encontradoFinSiParaEsteSi = false;

    while (indiceActual < lineasDelBloquePadre.length) {
        const lineaIteracionOriginal = lineasDelBloquePadre[indiceActual];
        const lineaIteracionProcesada = limpiarComentariosYEspacios(lineaIteracionOriginal);
        const lineaIteracionMinusculas = lineaIteracionProcesada.toLowerCase();

        if (lineaIteracionMinusculas.startsWith("si") && lineaIteracionMinusculas.includes("entonces")) {
            nivelAnidamientoSi++;
            bufferActual.push(lineaIteracionOriginal);
        } else if (lineaIteracionMinusculas === "sino") {
            if (nivelAnidamientoSi === 0) { // Pertenece a nuestro Si actual
                if (encontradoSinoParaEsteSi) throw new Error(`Múltiples 'Sino' para el 'Si' de la línea ${numeroLineaSi}.`);
                bufferActual = bloqueSino;
                encontradoSinoParaEsteSi = true;
            } else { // Pertenece a un Si anidado
                bufferActual.push(lineaIteracionOriginal);
            }
        } else if (lineaIteracionMinusculas === "finsi") {
            if (nivelAnidamientoSi === 0) { // Es el FinSi de nuestro Si actual
                encontradoFinSiParaEsteSi = true;
                indiceActual++; // Apuntar a la línea DESPUÉS del FinSi
                break;
            } else {
                nivelAnidamientoSi--;
                bufferActual.push(lineaIteracionOriginal);
            }
        } else {
            bufferActual.push(lineaIteracionOriginal);
        }
        indiceActual++;
    }

    if (!encontradoFinSiParaEsteSi) {
        throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numeroLineaSi}.`);
    }

    const offsetParaBloqueEntonces = numeroLineaSi; // Las líneas dentro del Entonces se numeran relativas al Si
    const offsetParaBloqueSino = numeroLineaSi + bloqueEntonces.length + (encontradoSinoParaEsteSi ? 1 : 0);


    if (valorCondicion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Ejecutando bloque Entonces.`, 'debug');
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(bloqueEntonces, ambitoEjecucion, offsetParaBloqueEntonces);
    } else {
        if (bloqueSino.length > 0) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Condición falsa. Ejecutando bloque Sino.`, 'debug');
            await Webgoritmo.Interprete.ejecutarBloqueCodigo(bloqueSino, ambitoEjecucion, offsetParaBloqueSino);
        } else {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Condición falsa. No hay bloque Sino.`, 'debug');
        }
    }
    return indiceActual -1; // Devolver el índice de la línea FinSi procesada
};


// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() { /* ... (como en Fase 4, solo actualizar mensaje de log) ... */
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { console.error("UI no lista"); return; }
    if (!Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) { Webgoritmo.UI.añadirSalida("Error: Evaluador de expresiones no listo (Fase 5 Si).", "error"); return; }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Fase 5: Si-Entonces-Sino) ---", "normal");
    // ... (resto igual que en Fase 4)
    Webgoritmo.estadoApp.variablesGlobales = {}; Webgoritmo.estadoApp.funcionesDefinidas = {}; Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null; Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.variablesDestinoEntrada = []; Webgoritmo.estadoApp.nombresOriginalesParaPrompt = []; Webgoritmo.estadoApp.promesaEntradaPendiente = null; Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = []; const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n'); let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = -1;
    for (let i = 0; i < todasLasLineas.length; i++) { const lineaActualOriginal = todasLasLineas[i]; const lineaActualProcesada = limpiarComentariosYEspacios(lineaActualOriginal); const lineaActualMinusculas = lineaActualProcesada.toLowerCase(); if (lineaActualMinusculas.startsWith("algoritmo") || lineaActualMinusculas.startsWith("proceso")) { if (dentroBloquePrincipal) { Webgoritmo.estadoApp.errorEnEjecucion = `Error en línea ${i + 1}: No anidar 'Algoritmo'/'Proceso'.`; break; } dentroBloquePrincipal = true; numeroLineaInicioBloque = i + 1; } else if (lineaActualMinusculas.startsWith("finalgoritmo") || lineaActualMinusculas.startsWith("finproceso")) { if (!dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Error en línea ${i + 1}: 'FinAlgoritmo'/'FinProceso' inesperado.`; dentroBloquePrincipal = false; break; } else if (dentroBloquePrincipal) { lineasAlgoritmoPrincipal.push(lineaActualOriginal); } else if (lineaActualProcesada !== "") { Webgoritmo.estadoApp.errorEnEjecucion = `Error en línea ${i + 1}: Instrucción '${lineaActualProcesada}' fuera de bloque.`; break; } }
    if (!Webgoritmo.estadoApp.errorEnEjecucion && numeroLineaInicioBloque === -1 && todasLasLineas.some(l => limpiarComentariosYEspacios(l) !== "")) Webgoritmo.estadoApp.errorEnEjecucion = "No se encontró bloque 'Algoritmo' o 'Proceso'."; else if (!Webgoritmo.estadoApp.errorEnEjecucion && dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Bloque L${numeroLineaInicioBloque} no cerrado.`;
    if (Webgoritmo.estadoApp.errorEnEjecucion) {Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); Webgoritmo.UI.añadirSalida("--- Ejecución con errores de estructura (Fase 5) ---", "error");}
    else if (lineasAlgoritmoPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque);
    else if (numeroLineaInicioBloque !== -1) Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning");
    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Fase 5) ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase 5) ---", "error");
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo (Fase 5) procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');
    let i = 0;
    while (i < lineasDelBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        const lineaOriginalFuente = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i;
        // console.log(`[RAW L${numeroLineaActualGlobal}]: "${lineaOriginalFuente}"`); // Logs RAW/PROCESADA pueden eliminarse si ya no son necesarios
        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginalFuente };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginalFuente);
        // console.log(`[PROCESADA L${numeroLineaActualGlobal}]: "${lineaProcesada}"`);
        if (lineaProcesada === "") { i++; continue; }
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: ${lineaProcesada}`, 'debug');
        const lineaMinusculas = lineaProcesada.toLowerCase();
        let instruccionManejada = false;
        try {
            const regexAsignacion = /^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?\s*(?:<-|=)/;
            const esPotencialAsignacion = regexAsignacion.test(lineaProcesada);

            if (lineaMinusculas.startsWith("definir ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarDefinicion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("escribir ") || lineaMinusculas.startsWith("imprimir ") || lineaMinusculas.startsWith("mostrar ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarSalidaConsola(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("leer ")) {
                instruccionManejada = await Webgoritmo.Interprete.procesarEntradaUsuario(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaMinusculas.startsWith("si ") && lineaMinusculas.includes(" entonces")) { // .includes en lugar de .endsWith para flexibilidad
                const nuevoIndiceDespuesDeFinSi = await Webgoritmo.Interprete.procesarSiEntoncesSino(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal, lineasDelBloque, i);
                i = nuevoIndiceDespuesDeFinSi; // El índice devuelto es el de la línea FinSi, el bucle incrementará a la siguiente
                instruccionManejada = true;
            } else if (esPotencialAsignacion) {
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else { /* ... (llamada a subproceso o error) ... */ }
            if (!instruccionManejada && lineaProcesada) { const pP = lineaMinusculas.split(" ")[0]; const kP = ["algoritmo","proceso","finalgoritmo","finproceso","sino","finsi"]; if (!kP.includes(pP)) throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);}
        } catch (error) { /* ... (manejo de error) ... */ Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`; Webgoritmo.estadoApp.detenerEjecucion = true; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); break;  }
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        i++;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

// --- Funciones de utilidad (copiadas y referenciadas) ---
function limpiarComentariosYEspacios(linea) { /* ... */ }
function limpiarComentariosYEspaciosInternos(texto) { /* ... */ }
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { /* ... */};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){ /* ... */};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){ /* ... */};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){ /* ... */};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { /* ... */ };
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) {return false;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) {return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (Fase 5 Reconstrucción: Si-Entonces-Sino) cargado.");

// Copiar las funciones de utilidad y handlers placeholder para mantener el archivo completo
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=this.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===val.trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===val.trim())return n;}}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(this.permitirArregloComoOperando)) { throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en esta expresión.`); } return descriptor.valor; };
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);if(argsTxt===""&&linea.match(rgx)[0].trim()!==m[0].split(" ")[0])return true; if(argsTxt==="")throw new Error(`'${m[0].split(" ")[0]}' sin args L${numLn}.`);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i]; if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if(exT==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(exT,ambito,numLn); outF+=typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart));} if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal'); return true;};
Webgoritmo.Interprete.procesarDefinicion = async function(linea,ambito,numLn){ console.log(`[DEBUG procesarDefinicion L${numLn}] Entrando con línea: "${linea}"`); const rgx=/definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;const m=linea.match(rgx);if(!m||m.length<3)throw new Error(`Sintaxis incorrecta 'Definir' L${numLn}. Esperado: Definir <var> Como <tipo>. Recibido: "${linea}"`);const noms=m[1].split(',').map(n=>n.trim());const tipo=m[2].toLowerCase();for(const nom of noms){if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nom))throw new Error(`Nombre var inválido: '${nom}' L${numLn}.`);const nomLc=nom.toLowerCase();if(ambito.hasOwnProperty(nomLc))if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`Advertencia L${numLn}: Var '${nom}' redefinida.`,'warning');const valDef=this.Utilidades.obtenerValorPorDefectoSegunTipo(tipo);ambito[nomLc]=this.Utilidades.crearDescriptorVariable(nom,tipo,valDef);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Variable '${nom}' (${tipo}) definida.`,'debug');}return true;};
Webgoritmo.Interprete.procesarAsignacion = async function(linea,ambito,numLn){ const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/; const m=linea.match(regexAsignacion); if(!m)throw new Error("Sintaxis asignación incorrecta L"+numLn); const destStr=m[1].trim(); const exprStrCruda=m[2]; const exprAEval=limpiarComentariosYEspaciosInternos(exprStrCruda); if(exprAEval==="")throw new Error(`Expresión vacía L${numLn}.`); const valEval=await Webgoritmo.Expresiones.evaluarExpresion(exprAEval,ambito,numLn); const accArrMatch=destStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/); if(accArrMatch){ throw new Error("Asignación a arreglos no implementada completamente en esta fase.");} else {const varNomLc=destStr.toLowerCase(); if(!ambito.hasOwnProperty(varNomLc))throw new Error(`Var '${destStr}' no def L${numLn}.`); const descVar=ambito[varNomLc]; if(descVar.esArreglo)throw new Error(`Asignar a arreglo completo no permitido L${numLn}.`); try{descVar.valor=this.Utilidades.convertirValorParaTipo(valEval,descVar.tipoDeclarado,numLn);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`,'debug');}catch(e){throw e;}} return true;};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ const matchLeer=linea.match(/^leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLn); const nomsOrigRaw=limpiarComentariosYEspaciosInternos(matchLeer[1]); const nomsPrompt=nomsOrigRaw.split(',').map(v=>v.trim()); const nomsDest=nomsPrompt.map(n=>n.toLowerCase()); if(nomsDest.length===0||nomsDest.some(v=>v===""))throw new Error("Leer sin vars L"+numLn); for(const nomLc of nomsDest){const nomP=nomsPrompt.find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomP}' inválida L${numLn}.`); if(!ambito.hasOwnProperty(nomLc))throw new Error(`Var '${nomP}' no def L${numLn}.`); if(ambito[nomLc].esArreglo)throw new Error(`Leer arreglo completo no soportado L${numLn}.`);} let pMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(pMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntradaUsuario=true; Webgoritmo.estadoApp.variablesDestinoEntrada=nomsDest; Webgoritmo.estadoApp.nombresOriginalesParaPrompt=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; Webgoritmo.estadoApp.esperandoEntradaUsuario=false; if(Webgoritmo.estadoApp.detenerEjecucion&&Webgoritmo.estadoApp.errorEnEjecucion)throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); return true;};
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn(`procesarDimensionArreglo no implementado`); return false;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn(`llamarSubProceso no implementado`); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn(`parsearDefinicionSubProceso no implementado`); return null;};He implementado la función `Webgoritmo.Interprete.procesarSiEntoncesSino` en `motorInterprete.js` y he actualizado `ejecutarBloqueCodigo` para que la invoque.

**Puntos Clave de la Implementación de `procesarSiEntoncesSino`:**

1.  **Parseo de Condición**: Extrae la expresión de la condición de la línea `Si ... Entonces`.
2.  **Evaluación de Condición**: Llama a `Webgoritmo.Expresiones.evaluarExpresion` para obtener el valor booleano de la condición. Valida que el resultado sea realmente un booleano.
3.  **Recopilación de Bloques**:
    *   Itera sobre las líneas siguientes a la línea del `Si`.
    *   Mantiene un contador `nivelAnidamientoSi` para identificar correctamente los bloques `Entonces`, `Sino` y el `FinSi` que corresponden al `Si` actual, ignorando los de los `Si` anidados.
    *   Las líneas se almacenan en `bloqueEntonces` o `bloqueSino`.
4.  **Ejecución Condicional**:
    *   Si la condición es verdadera, se ejecuta `bloqueEntonces` mediante una llamada recursiva a `ejecutarBloqueCodigo`.
    *   Si la condición es falsa y `bloqueSino` no está vacío, se ejecuta `bloqueSino` de la misma manera.
5.  **Retorno de Índice**: La función devuelve el índice de la línea *después* del `FinSi` correspondiente, para que el bucle de `ejecutarBloqueCodigo` que la llamó pueda continuar la ejecución desde el punto correcto.
6.  **Manejo de Errores**: Lanza errores si la sintaxis del `Si` es incorrecta, si la condición no es lógica, o si no se encuentra un `FinSi`.

**Archivos Modificados:**

*   `motorInterprete.js`: Añadida `procesarSiEntoncesSino` y actualizada `ejecutarBloqueCodigo`.
*   `datosEjemplos.js` y `uiManager.js` (en los siguientes pasos) para el nuevo ejemplo de prueba.

Ahora, actualizaré `datosEjemplos.js`.
