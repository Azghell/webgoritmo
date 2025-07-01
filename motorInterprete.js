// motorInterprete.js (Fase 6 Reconstrucción: Si-SinoSi-Sino)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

Webgoritmo.Interprete.Utilidades = { /* ... (como en Fase 5) ... */ };

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) { /* ... (como en Fase 5) ... */ };
Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 5) ... */ };
Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 5) ... */ };
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 5) ... */ };

/**
 * Procesa una estructura Si / Sino Si / Sino / FinSi.
 * @returns {Promise<number>} El índice de la línea DESPUÉS del FinSi correspondiente (relativo a lineasDelBloquePadre).
 */
Webgoritmo.Interprete.procesarSiGeneral = async function(lineaSiOriginal, ambitoEjecucion, numeroLineaSiEditor, lineasDelBloquePadre, indiceSiEnPadreEnBloquePadre) {
    const regexSiPrincipal = /si\s+(.+?)\s+entonces/i;
    const regexSinoSi = /sino\s+si\s+(.+?)\s+entonces/i; // O SiNo Si
    const regexSinoSiCompacto = /sinosi\s+(.+?)\s+entonces/i;

    let coincidenciaInicial = limpiarComentariosYEspacios(lineaSiOriginal).match(regexSiPrincipal);
    if (!coincidenciaInicial) throw new Error(`Error interno: procesarSiGeneral llamado con línea no válida: ${lineaSiOriginal}`);

    // Estructura para almacenar todas las ramas condicionales y el bloque Sino final
    const ramasCondicionales = [];
    let bloqueSinoFinal = null;
    let numeroLineaSinoFinal = -1;

    // Añadir la condición y bloque del 'Si' inicial
    ramasCondicionales.push({
        expresionCondicion: limpiarComentariosYEspaciosInternos(coincidenciaInicial[1]),
        lineasBloque: [],
        numeroLineaDeclaracion: numeroLineaSiEditor
    });

    let bufferActual = ramasCondicionales[0].lineasBloque;
    let nivelAnidamientoSi = 0;
    let indiceIteracionEnPadre = indiceSiEnPadreEnBloquePadre + 1;
    let encontradoFinSiParaEsteSi = false;

    while (indiceIteracionEnPadre < lineasDelBloquePadre.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return indiceIteracionEnPadre;

        const lineaOriginalIteracion = lineasDelBloquePadre[indiceIteracionEnPadre];
        const lineaProcesadaIteracion = limpiarComentariosYEspacios(lineaOriginalIteracion);
        const lineaMinusculasIteracion = lineaProcesadaIteracion.toLowerCase();

        // Número de línea global para la instrucción actual del bucle de parseo
        const numeroLineaGlobalIteracion = (numeroLineaSiEditor - (indiceSiEnPadreEnBloquePadre + 1)) + (indiceIteracionEnPadre +1) ;


        if (lineaMinusculasIteracion.startsWith("si") && lineaMinusculasIteracion.includes("entonces")) {
            nivelAnidamientoSi++;
            bufferActual.push(lineaOriginalIteracion);
        } else {
            let matchSinoSi = lineaProcesadaIteracion.match(regexSinoSi) || lineaProcesadaIteracion.match(regexSinoSiCompacto);
            if (matchSinoSi && nivelAnidamientoSi === 0) { // Es un Sino Si de nuestra estructura actual
                if (bloqueSinoFinal) throw new Error(`Error en línea ${numeroLineaGlobalIteracion}: 'Sino Si' no puede aparecer después de un 'Sino' final.`);
                ramasCondicionales.push({
                    expresionCondicion: limpiarComentariosYEspaciosInternos(matchSinoSi[1]),
                    lineasBloque: [],
                    numeroLineaDeclaracion: numeroLineaGlobalIteracion
                });
                bufferActual = ramasCondicionales[ramasCondicionales.length - 1].lineasBloque;
            } else if (lineaMinusculasIteracion === "sino" && nivelAnidamientoSi === 0) { // Es un Sino final
                if (bloqueSinoFinal) throw new Error(`Error en línea ${numeroLineaGlobalIteracion}: Múltiples 'Sino' para el mismo 'Si'.`);
                bloqueSinoFinal = [];
                bufferActual = bloqueSinoFinal;
                numeroLineaSinoFinal = numeroLineaGlobalIteracion;
            } else if (lineaMinusculasIteracion === "finsi") {
                if (nivelAnidamientoSi === 0) {
                    encontradoFinSiParaEsteSi = true;
                    break; // Fin de la estructura Si-SinoSi-Sino
                } else {
                    nivelAnidamientoSi--;
                    bufferActual.push(lineaOriginalIteracion);
                }
            } else {
                bufferActual.push(lineaOriginalIteracion);
            }
        }
        indiceIteracionEnPadre++;
    }

    if (!encontradoFinSiParaEsteSi) {
        throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numeroLineaSiEditor}.`);
    }

    // Ejecutar la lógica
    let algunaCondicionVerdadera = false;
    for (const rama of ramasCondicionales) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        if (rama.expresionCondicion === "") throw new Error(`Condición vacía para 'Si'/'Sino Si' en línea ${rama.numeroLineaDeclaracion}.`);

        let valorCondicionRama;
        try {
            valorCondicionRama = await Webgoritmo.Expresiones.evaluarExpresion(rama.expresionCondicion, ambitoEjecucion, rama.numeroLineaDeclaracion);
        } catch (e) { throw new Error(`Error evaluando condición ("${rama.expresionCondicion}") en línea ${rama.numeroLineaDeclaracion}: ${e.message}`); }
        if (typeof valorCondicionRama !== 'boolean') throw new Error(`Condición ("${rama.expresionCondicion}") en línea ${rama.numeroLineaDeclaracion} debe ser lógica, se obtuvo: ${typeof valorCondicionRama}.`);

        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${rama.numeroLineaDeclaracion}: Condición (${rama.expresionCondicion}) evaluada a: ${valorCondicionRama ? "Verdadero" : "Falso"}`, 'debug');

        if (valorCondicionRama) {
            algunaCondicionVerdadera = true;
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${rama.numeroLineaDeclaracion}: Ejecutando bloque correspondiente.`, 'debug');
            // El offset para ejecutarBloqueCodigo es el número de línea de la instrucción Si/SinoSi + 1
            await Webgoritmo.Interprete.ejecutarBloqueCodigo(rama.lineasBloque, ambitoEjecucion, rama.numeroLineaDeclaracion + 1);
            break;
        }
    }

    if (!algunaCondicionVerdadera && bloqueSinoFinal) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSinoFinal}: Ninguna condición verdadera. Ejecutando bloque Sino final.`, 'debug');
        // El offset para el bloque Sino es el número de línea del Sino + 1
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(bloqueSinoFinal, ambitoEjecucion, numeroLineaSinoFinal + 1);
    }

    return indiceIteracionEnPadre; // Devuelve el índice de la línea FinSi (relativo a lineasDelBloquePadre)
};


// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida || !Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo || !Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) { /* ... */ return; }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Fase 6: SinoSi) ---", "normal"); // Mensaje de Fase
    // ... (resto de inicialización de estadoApp como en Fase 5) ...
    Webgoritmo.estadoApp.variablesGlobales = {}; Webgoritmo.estadoApp.funcionesDefinidas = {}; Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null; Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.variablesDestinoEntrada = []; Webgoritmo.estadoApp.nombresOriginalesParaPrompt = []; Webgoritmo.estadoApp.promesaEntradaPendiente = null; Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = []; const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n'); let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = 0;
    for (let i = 0; i < todasLasLineas.length; i++) { const lineaOriginal = todasLasLineas[i]; const lineaProcesada = limpiarComentariosYEspacios(lineaOriginal); const lineaMinusculas = lineaProcesada.toLowerCase(); if (lineaMinusculas.startsWith("algoritmo") || lineaMinusculas.startsWith("proceso")) { if (dentroBloquePrincipal) { Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: No anidar Algoritmo/Proceso.`; break; } dentroBloquePrincipal = true; numeroLineaInicioBloque = i; } else if (lineaMinusculas.startsWith("finalgoritmo") || lineaMinusculas.startsWith("finproceso")) { if (!dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: Fin inesperado.`; dentroBloquePrincipal = false; break; } else if (dentroBloquePrincipal) { lineasAlgoritmoPrincipal.push(lineaOriginal); } else if (lineaProcesada !== "") { Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: Instrucción '${lineaProcesada}' fuera de bloque.`; break; } }
    if (!Webgoritmo.estadoApp.errorEnEjecucion && numeroLineaInicioBloque === -1 && todasLasLineas.some(l => limpiarComentariosYEspacios(l) !== "")) Webgoritmo.estadoApp.errorEnEjecucion = "No se encontró bloque Algoritmo/Proceso."; else if (!Webgoritmo.estadoApp.errorEnEjecucion && dentroBloquePrincipal) Webgoritmo.estadoApp.errorEnEjecucion = `Bloque L${numeroLineaInicioBloque + 1} no cerrado.`;
    if (Webgoritmo.estadoApp.errorEnEjecucion) {Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); Webgoritmo.UI.añadirSalida("--- Ejecución con errores de estructura ---", "error");}
    else if (lineasAlgoritmoPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque + 1);
    else if (numeroLineaInicioBloque !== -1) Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning");
    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo (Fase 6 SiNoSi) procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');
    let i = 0;
    while (i < lineasDelBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        const lineaOriginalFuente = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i;
        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginalFuente };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginalFuente);
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
            } else if (lineaMinusculas.startsWith("si ") && lineaMinusculas.includes(" entonces")) {
                const indiceUltimaLineaDelSi = await Webgoritmo.Interprete.procesarSiGeneral(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal, lineasDelBloque, i);
                i = indiceUltimaLineaDelSi;
                instruccionManejada = true;
            } else if (esPotencialAsignacion) {
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else { /* ... (llamada a subproceso o error) ... */ }
            if (!instruccionManejada && lineaProcesada) { const pP = lineaMinusculas.split(" ")[0]; const kP = ["algoritmo","proceso","finalgoritmo","finproceso","sino","finsi","sinosi"]; if (!kP.includes(pP)) throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);}
        } catch (error) { /* ... (manejo de error) ... */ Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`; Webgoritmo.estadoApp.detenerEjecucion = true; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); break;  }
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        i++;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

// --- Funciones de utilidad (sin cambios) ---
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
console.log("motorInterprete.js (Fase 6 Si-SinoSi-Sino) cargado.");

// --- Copiar las funciones de utilidad y handlers placeholder (reducido para brevedad) ---
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===String(val).trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===String(val).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0'))return n;}}if(tipoDestN==='logico'&&tipoOriN==='cadena'){const valL=String(val).trim().toLowerCase();if(valL==="verdadero"||valL==="v")return true;if(valL==="falso"||valL==="f")return false;}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(Webgoritmo.Expresiones.permitirArregloComoOperando)) { throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en esta expresión.`); } return descriptor.valor; };
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);if(argsTxt===""&&linea.match(rgx)[0].trim()!==m[0].split(" ")[0])return true; if(argsTxt==="")throw new Error(`'${m[0].split(" ")[0]}' sin args L${numLn}.`);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i]; if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if(exT==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(exT,ambito,numLn); outF+=typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart));} if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal'); return true;};
Webgoritmo.Interprete.procesarDefinicion = async function(linea,ambito,numLn){ console.log(`[DEBUG procesarDefinicion L${numLn}] Entrando con línea: "${linea}"`); const rgx=/definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;const m=linea.match(rgx);if(!m||m.length<3)throw new Error(`Sintaxis incorrecta 'Definir' L${numLn}. Esperado: Definir <var> Como <tipo>. Recibido: "${linea}"`);const noms=m[1].split(',').map(n=>n.trim());const tipo=m[2].toLowerCase();for(const nom of noms){if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nom))throw new Error(`Nombre var inválido: '${nom}' L${numLn}.`);const nomLc=nom.toLowerCase();if(ambito.hasOwnProperty(nomLc))if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`Advertencia L${numLn}: Var '${nom}' redefinida.`,'warning');const valDef=Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipo);ambito[nomLc]=Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nom,tipo,valDef);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Variable '${nom}' (${tipo}) definida.`,'debug');}return true;};
Webgoritmo.Interprete.procesarAsignacion = async function(linea,ambito,numLn){ const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/; const m=linea.match(regexAsignacion); if(!m)throw new Error("Sintaxis asignación incorrecta L"+numLn); const destStr=m[1].trim(); const exprStrCruda=m[2]; const exprAEval=limpiarComentariosYEspaciosInternos(exprStrCruda); if(exprAEval==="")throw new Error(`Expresión vacía L${numLn}.`); const valEval=await Webgoritmo.Expresiones.evaluarExpresion(exprAEval,ambito,numLn); const accArrMatch=destStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/); if(accArrMatch){ throw new Error("Asignación a arreglos no implementada completamente en esta fase.");} else {const varNomLc=destStr.toLowerCase(); if(!ambito.hasOwnProperty(varNomLc))throw new Error(`Var '${destStr}' no def L${numLn}.`); const descVar=ambito[varNomLc]; if(descVar.esArreglo)throw new Error(`Asignar a arreglo completo no permitido L${numLn}.`); try{descVar.valor=Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valEval,descVar.tipoDeclarado,numLn);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`,'debug');}catch(e){throw e;}} return true;};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ const matchLeer=linea.match(/^leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLn); const nomsOrigRaw=limpiarComentariosYEspaciosInternos(matchLeer[1]); const nomsPrompt=nomsOrigRaw.split(',').map(v=>v.trim()); const nomsDest=nomsPrompt.map(n=>n.toLowerCase()); if(nomsDest.length===0||nomsDest.some(v=>v===""))throw new Error("Leer sin vars L"+numLn); for(const nomLc of nomsDest){const nomP=nomsPrompt.find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomP}' inválida L${numLn}.`); if(!ambito.hasOwnProperty(nomLc))throw new Error(`Var '${nomP}' no def L${numLn}.`); if(ambito[nomLc].esArreglo)throw new Error(`Leer arreglo completo no soportado L${numLn}.`);} let pMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(pMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntradaUsuario=true; Webgoritmo.estadoApp.variablesDestinoEntrada=nomsDest; Webgoritmo.estadoApp.nombresOriginalesParaPrompt=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; Webgoritmo.estadoApp.esperandoEntradaUsuario=false; if(Webgoritmo.estadoApp.detenerEjecucion&&Webgoritmo.estadoApp.errorEnEjecucion)throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); return true;};
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn(`procesarDimensionArreglo no implementado`); return false;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn(`llamarSubProceso no implementado`); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn(`parsearDefinicionSubProceso no implementado`); return null;};He actualizado `motorInterprete.js` con la nueva función `procesarSiGeneral` (que reemplaza a `procesarSiEntoncesSino`) y he modificado `ejecutarBloqueCodigo` para llamarla. Esta nueva función está diseñada para manejar la cadena completa de `Si ... Sino Si ... Sino ... FinSi`.

**Puntos Clave de `procesarSiGeneral`:**
*   Parsea el `Si` inicial.
*   Luego entra en un bucle para encontrar y parsear cualquier cláusula `Sino Si` y el `Sino` final, hasta encontrar el `FinSi` que cierra la estructura principal.
*   Almacena cada condición y su bloque de código correspondiente.
*   Una vez parseada toda la estructura, itera sobre las condiciones (`Si` y `Sino Si`). La primera que sea verdadera ejecuta su bloque y la función termina (saltando al `FinSi`).
*   Si ninguna condición es verdadera y hay un bloque `Sino` final, se ejecuta ese bloque.
*   Maneja el anidamiento de `Si` dentro de los bloques.

Ahora, actualizaré `datosEjemplos.js` y `uiManager.js` para la Fase 6.

**1. `datosEjemplos.js` para la Fase 6:**
