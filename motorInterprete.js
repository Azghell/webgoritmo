// motorInterprete.js (Fase 5 Reconstrucción: Si-Entonces-Sino - Intento 3 Corregido)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

Webgoritmo.Interprete.Utilidades = { /* ... (como en Fase 4) ... */ };

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) { /* ... (como en Fase 4) ... */ };
Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 4) ... */ };
Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 4) ... */ };
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 3) ... */ };

Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lineaSiOriginal, ambitoEjecucion, numeroLineaSiEditor, lineasDelBloquePadre, indiceSiEnPadreEnBloquePadre) {
    const regexSi = /si\s+(.+?)\s+entonces/i;
    const coincidenciaSi = limpiarComentariosYEspacios(lineaSiOriginal).match(regexSi); // Limpiar la línea del Si antes de regex

    if (!coincidenciaSi || !coincidenciaSi[1]) {
        throw new Error(`Sintaxis incorrecta para 'Si' en línea ${numeroLineaSiEditor}.`);
    }
    const expresionCondicion = limpiarComentariosYEspaciosInternos(coincidenciaSi[1]);
    if (expresionCondicion === "") {
        throw new Error(`Condición vacía para 'Si' en línea ${numeroLineaSiEditor}.`);
    }

    let valorCondicion;
    try {
        valorCondicion = await Webgoritmo.Expresiones.evaluarExpresion(expresionCondicion, ambitoEjecucion, numeroLineaSiEditor);
    } catch (e) {
        throw new Error(`Error evaluando condición del 'Si' ("${expresionCondicion}") en línea ${numeroLineaSiEditor}: ${e.message}`);
    }

    if (typeof valorCondicion !== 'boolean') {
        throw new Error(`La condición del 'Si' ("${expresionCondicion}") en línea ${numeroLineaSiEditor} debe ser lógica, se obtuvo: ${valorCondicion} (tipo: ${typeof valorCondicion}).`);
    }

    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSiEditor}: Condición Si (${expresionCondicion}) evaluada a: ${valorCondicion ? "Verdadero" : "Falso"}`, 'debug');

    let bloqueEntonces = [];
    let bloqueSino = [];
    let bufferActual = bloqueEntonces;
    let nivelAnidamientoSi = 0;
    let indiceIteracionEnPadre = indiceSiEnPadreEnBloquePadre + 1; // Empezar a escanear desde la línea DESPUÉS del "Si...Entonces"
    let encontradoSinoParaEsteSi = false;
    let encontradoFinSiParaEsteSi = false;
    let lineaDelSinoOriginal = -1;


    while (indiceIteracionEnPadre < lineasDelBloquePadre.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return indiceIteracionEnPadre;

        const lineaOriginalIteracion = lineasDelBloquePadre[indiceIteracionEnPadre];
        const lineaProcesadaIteracion = limpiarComentariosYEspacios(lineaOriginalIteracion);
        const lineaMinusculasIteracion = lineaProcesadaIteracion.toLowerCase();

        if (lineaMinusculasIteracion.startsWith("si") && lineaMinusculasIteracion.includes("entonces")) {
            nivelAnidamientoSi++;
            bufferActual.push(lineaOriginalIteracion);
        } else if (lineaMinusculasIteracion === "sino") {
            if (nivelAnidamientoSi === 0) {
                if (encontradoSinoParaEsteSi) throw new Error(`Múltiples 'Sino' para el 'Si' de la línea ${numeroLineaSiEditor}.`);
                bufferActual = bloqueSino;
                encontradoSinoParaEsteSi = true;
                // Para el offset del bloque Sino, necesitamos el número de línea global donde se encuentra "Sino".
                // El numeroLineaOffset del bloque padre es (numeroLineaSiEditor - (indiceSiEnPadreEnBloquePadre + 1))
                // La línea actual del Sino es (offset del padre + indiceIteracionEnPadre + 1)
                // Esta línea es la que se pasa como offset a ejecutarBloqueCodigo para el bloque Sino.
                // El numeroLineaOffset que recibe ejecutarBloqueCodigo es el número de la primera línea DEL BLOQUE que se le pasa.
                // Entonces, para el bloqueSino, el offset es el número de línea global del "Sino".
                // NO, es el número de línea global de la PRIMERA INSTRUCCIÓN DENTRO DEL SINO.
                // El "numeroLineaOffset" para ejecutarBloqueCodigo(bloqueSino,...) debe ser el número de línea de la primera instrucción del bloque Sino.
                // El "Sino" en sí mismo no tiene un offset de bloque, sino la línea siguiente.
                // numeroLineaSiEditor ya es el número global de la línea "Si".
                // El bloque Entonces empieza en numeroLineaSiEditor + 1 (conceptual).
                // El bloque Sino empieza después de la línea "Sino".
                // Vamos a pasar el número de línea del Si/Sino mismo como offset, y ejecutarBloqueCodigo sumará el índice local.
                lineaDelSinoOriginal = numeroLineaSiEditor + (indiceIteracionEnPadre - indiceSiEnPadreEnBloquePadre);

            } else {
                bufferActual.push(lineaOriginalIteracion);
            }
        } else if (lineaMinusculasIteracion === "finsi") {
            if (nivelAnidamientoSi === 0) {
                encontradoFinSiParaEsteSi = true;
                // No hacer indiceIteracionEnPadre++ aquí, el bucle lo hará. El índice devuelto será el del FinSi.
                break;
            } else {
                nivelAnidamientoSi--;
                bufferActual.push(lineaOriginalIteracion);
            }
        } else {
            bufferActual.push(lineaOriginalIteracion);
        }
        indiceIteracionEnPadre++;
    }

    if (!encontradoFinSiParaEsteSi) {
        throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numeroLineaSiEditor}.`);
    }

    if (valorCondicion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSiEditor}: Ejecutando bloque Entonces.`, 'debug');
        // El offset para las líneas del bloque Entonces es el número de línea del "Si" + 1 (la primera línea DENTRO del Entonces)
        // pero ejecutarBloqueCodigo espera el offset de la primera línea del array que se le pasa, relativo al editor.
        // Si lineasDelBloquePadre[indiceSiEnPadreEnBloquePadre+1] es la primera línea del Entonces, su número global es numeroLineaSiEditor+1.
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(bloqueEntonces, ambitoEjecucion, numeroLineaSiEditor + 1);
    } else {
        if (bloqueSino.length > 0) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSiEditor}: Condición falsa. Ejecutando bloque Sino.`, 'debug');
            // El offset para las líneas del bloque Sino es el número de línea del "Sino" + 1
            await Webgoritmo.Interprete.ejecutarBloqueCodigo(bloqueSino, ambitoEjecucion, lineaDelSinoOriginal + 1);
        } else {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSiEditor}: Condición falsa. No hay bloque Sino.`, 'debug');
        }
    }
    return indiceIteracionEnPadre; // Devolver el índice de la línea FinSi (relativo a lineasDelBloquePadre)
};


// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() { /* ... (como en Fase 5 Intento 2, solo mensaje de log) ... */
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida || !Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo || !Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) {
        console.error("Error: Módulos esenciales no están listos para ejecutarAlgoritmoPrincipal.");
        if(Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Error crítico: Módulos faltantes.", "error");
        return;
    }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Fase 5 Si-Entonces-Sino Intento 3) ---", "normal");
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
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo (F5 Si Int3) procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');
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
                // Pasa el numeroLineaOffset del bloque actual para que procesarSiEntoncesSino pueda calcular offsets globales correctos
                const indiceUltimaLineaDelSi = await Webgoritmo.Interprete.procesarSiEntoncesSino(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal, lineasDelBloque, i);
                i = indiceUltimaLineaDelSi;
                instruccionManejada = true;
            } else if (esPotencialAsignacion) {
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else { /* ... (llamada a subproceso o error) ... */ }
            if (!instruccionManejada && lineaProcesada) { const pP = lineaMinusculas.split(" ")[0]; const kP = ["algoritmo","proceso","finalgoritmo","finproceso","sino","finsi"]; if (!kP.includes(pP)) throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);}
        } catch (error) { Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`; Webgoritmo.estadoApp.detenerEjecucion = true; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); break;  }
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        i++;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

// --- Funciones de utilidad (sin cambios desde la última versión funcional) ---
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===String(val).trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===String(val).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0'))return n;}}if(tipoDestN==='logico'&&tipoOriN==='cadena'){const valL=String(val).trim().toLowerCase();if(valL==="verdadero"||valL==="v")return true;if(valL==="falso"||valL==="f")return false;}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(Webgoritmo.Expresiones.permitirArregloComoOperando)) { throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en esta expresión.`); } return descriptor.valor; };
Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);if(argsTxt===""&&linea.match(rgx)[0].trim()!==m[0].split(" ")[0])return true; if(argsTxt==="")throw new Error(`'${m[0].split(" ")[0]}' sin args L${numLn}.`);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i]; if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if(exT==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(exT,ambito,numLn); outF+=typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart));} if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal'); return true;};
Webgoritmo.Interprete.procesarDefinicion = async function(linea,ambito,numLn){ console.log(`[DEBUG procesarDefinicion L${numLn}] Entrando con línea: "${linea}"`); const rgx=/definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;const m=linea.match(rgx);if(!m||m.length<3)throw new Error(`Sintaxis incorrecta 'Definir' L${numLn}. Esperado: Definir <var> Como <tipo>. Recibido: "${linea}"`);const noms=m[1].split(',').map(n=>n.trim());const tipo=m[2].toLowerCase();for(const nom of noms){if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nom))throw new Error(`Nombre var inválido: '${nom}' L${numLn}.`);const nomLc=nom.toLowerCase();if(ambito.hasOwnProperty(nomLc))if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`Advertencia L${numLn}: Var '${nom}' redefinida.`,'warning');const valDef=Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipo);ambito[nomLc]=Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nom,tipo,valDef);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Variable '${nom}' (${tipo}) definida.`,'debug');}return true;};
Webgoritmo.Interprete.procesarAsignacion = async function(linea,ambito,numLn){ const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/; const m=linea.match(regexAsignacion); if(!m)throw new Error("Sintaxis asignación incorrecta L"+numLn); const destStr=m[1].trim(); const exprStrCruda=m[2]; const exprAEval=limpiarComentariosYEspaciosInternos(exprStrCruda); if(exprAEval==="")throw new Error(`Expresión vacía L${numLn}.`); const valEval=await Webgoritmo.Expresiones.evaluarExpresion(exprAEval,ambito,numLn); const accArrMatch=destStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/); if(accArrMatch){ throw new Error("Asignación a arreglos no implementada completamente en esta fase.");} else {const varNomLc=destStr.toLowerCase(); if(!ambito.hasOwnProperty(varNomLc))throw new Error(`Var '${destStr}' no def L${numLn}.`); const descVar=ambito[varNomLc]; if(descVar.esArreglo)throw new Error(`Asignar a arreglo completo no permitido L${numLn}.`); try{descVar.valor=Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valEval,descVar.tipoDeclarado,numLn);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`,'debug');}catch(e){throw e;}} return true;};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ const matchLeer=linea.match(/^leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLn); const nomsOrigRaw=limpiarComentariosYEspaciosInternos(matchLeer[1]); const nomsPrompt=nomsOrigRaw.split(',').map(v=>v.trim()); const nomsDest=nomsPrompt.map(n=>n.toLowerCase()); if(nomsDest.length===0||nomsDest.some(v=>v===""))throw new Error("Leer sin vars L"+numLn); for(const nomLc of nomsDest){const nomP=nomsPrompt.find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomP}' inválida L${numLn}.`); if(!ambito.hasOwnProperty(nomLc))throw new Error(`Var '${nomP}' no def L${numLn}.`); if(ambito[nomLc].esArreglo)throw new Error(`Leer arreglo completo no soportado L${numLn}.`);} let pMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(pMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntradaUsuario=true; Webgoritmo.estadoApp.variablesDestinoEntrada=nomsDest; Webgoritmo.estadoApp.nombresOriginalesParaPrompt=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; Webgoritmo.estadoApp.esperandoEntradaUsuario=false; if(Webgoritmo.estadoApp.detenerEjecucion&&Webgoritmo.estadoApp.errorEnEjecucion)throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); return true;};
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn(`procesarDimensionArreglo no implementado`); return false;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn(`llamarSubProceso no implementado`); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn(`parsearDefinicionSubProceso no implementado`); return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (Fase 5 Si-Entonces-Sino - Intento 3) cargado.");
