// motorInterprete.js (Con Logs en procesarDefinicion y procesarAsignacion)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }

Webgoritmo.Interprete.Utilidades = {};

Webgoritmo.Interprete.Utilidades.PALABRAS_RESERVADAS = new Set([
    "PROCESO", "FINPROCESO", "ALGORITMO", "FINALGORITMO",
    "DEFINIR", "COMO", "LEER", "ESCRIBIR", "IMPRIMIR", "MOSTRAR",
    "SI", "ENTONCES", "SINO", "FINSI",
    "MIENTRAS", "HACER", "FINMIENTRAS",
    "PARA", "HASTA", "CON", "PASO", "FINPARA",
    "SEGUN", "DE", "OTRO", "MODO", "FINSEGUN",
    "FUNCION", "FINFUNCION", "SUBPROCESO", "FINSUBPROCESO",
    "Y", "O", "NO", "MOD",
    "VERDADERO", "FALSO",
    "ENTERO", "REAL", "LOGICO", "CARACTER", "CADENA", "NUMERO", "TEXTO"
]);

Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo: (tipoD.includes('[') && tipoD.includes(']')),dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===String(val).trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===String(val).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0'))return n;}}if(tipoDestN==='logico'&&tipoOriN==='cadena'){const valL=String(val).trim().toLowerCase();if(valL==="verdadero"||valL==="v")return true;if(valL==="falso"||valL==="f")return false;}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor = function(dims,baseT){const defV=this.obtenerValorPorDefectoSegunTipo(baseT);function cD(dI){const dS=dims[dI];if(typeof dS!=='number'||!Number.isInteger(dS)||dS<=0)throw new Error("Dim inválida.");let arr=new Array(dS+1);if(dI===dims.length-1){for(let i=1;i<=dS;i++)arr[i]=defV;}else{for(let i=1;i<=dS;i++)arr[i]=cD(dI+1);}return arr;}if(!dims||dims.length===0)throw new Error("No dims.");return cD(0);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(Webgoritmo.Expresiones && Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal)) { return descriptor;} return descriptor.valor; };

Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);if(argsTxt===""&&linea.match(rgx)[0].trim()!==m[0].split(" ")[0])return true; if(argsTxt==="")throw new Error(`'${m[0].split(" ")[0]}' sin args L${numLn}.`);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i]; if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if(exT==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(exT,ambito,numLn); outF+=typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart));} if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal'); return true;};
Webgoritmo.Interprete.procesarDefinicion = async function(linea,ambitoEjecucion,numLn){
    console.log(`[DEBUG procesarDefinicion L${numLn}] Entrando con línea: "${linea}"`);
    const regexDefinirArreglo = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)\s*\[\s*(.+?)\s*\]/i;
    const regexDefinirSimple = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;
    let coincidencia; let esDefinicionArreglo = false;
    coincidencia = linea.match(regexDefinirArreglo);
    if (coincidencia) { esDefinicionArreglo = true; } else { coincidencia = linea.match(regexDefinirSimple); }
    if (!coincidencia || coincidencia.length < 3) { throw new Error(`Sintaxis incorrecta 'Definir' L${numLn}. Recibido: "${linea}"`); }
    const nombresVariables = coincidencia[1].split(',').map(nombre => nombre.trim());
    const tipoVariable = coincidencia[2].toLowerCase();
    for (const nombreVar of nombresVariables) {
        if (nombreVar === "") throw new Error(`Nombre de variable no puede ser vacío en línea ${numLn}.`);
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVar)) throw new Error(`Nombre de variable inválido: '${nombreVar}' en línea ${numLn}.`);
        if (Webgoritmo.Interprete.Utilidades.PALABRAS_RESERVADAS.has(nombreVar.toUpperCase())) throw new Error(`Error en línea ${numLn}: El nombre de variable '${nombreVar}' es una palabra reservada.`);
        const nombreVarLc = nombreVar.toLowerCase();
        if (ambitoEjecucion.hasOwnProperty(nombreVarLc)) if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Advertencia L${numLn}: Var '${nombreVar}' redefinida.`,'warning');

        let descriptor;
        if (esDefinicionArreglo) {
            const dimsStrLimpio = limpiarComentariosYEspaciosInternos(coincidencia[3]);
            if (dimsStrLimpio === "") throw new Error(`Dimensión vacía para arreglo '${nombreVar}' L${numLn}.`);
            const dimExprs = dimsStrLimpio.split(',').map(s => s.trim()); const evalDimensiones = [];
            for (const expr of dimExprs) {
                if (expr === "") throw new Error(`Dimensión vacía (post-coma) para arreglo '${nombreVar}' L${numLn}.`);
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoEjecucion, numLn);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}'->${dimVal} para '${nombreVar}' L${numLn}.`);
                evalDimensiones.push(dimVal);
            }
            descriptor = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, null);
            descriptor.esArreglo = true; descriptor.dimensiones = evalDimensiones; descriptor.valor = Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor(evalDimensiones, tipoVariable); descriptor.tipoDeclarado = tipoVariable;
            console.log(`[DEBUG Definicion L${numLn}] CREADO Descriptor Arreglo para '${nombreVarLc}':`, descriptor);
            console.log(`[DEBUG Definicion L${numLn}] CREADO desc.nombreOriginal: ${descriptor ? descriptor.nombreOriginal : 'desc es undefined'}, desc.tipoDeclarado: ${descriptor ? descriptor.tipoDeclarado : 'desc es undefined'}, desc.esArreglo: ${descriptor ? descriptor.esArreglo : 'desc es undefined'}`);
            ambitoEjecucion[nombreVarLc] = descriptor;
            const descriptorDelAmbitoArr = ambitoEjecucion[nombreVarLc];
            console.log(`[DEBUG Definicion L${numLn}] ASIGNADO Descriptor Arreglo para '${nombreVarLc}' en ambito:`, descriptorDelAmbitoArr);
            console.log(`[DEBUG Definicion L${numLn}] ASIGNADO desc.nombreOriginal: ${descriptorDelAmbitoArr ? descriptorDelAmbitoArr.nombreOriginal : 'descDelAmbito es undefined'}, desc.tipoDeclarado: ${descriptorDelAmbitoArr ? descriptorDelAmbitoArr.tipoDeclarado : 'descDelAmbito es undefined'}, desc.esArreglo: ${descriptorDelAmbitoArr ? descriptorDelAmbitoArr.esArreglo : 'descDelAmbito es undefined'}`);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLn}: Arreglo '${nombreVar}' (${tipoVariable}[${evalDimensiones.join(',')}]) definido.`, 'debug');
        } else {
            const valorPorDefecto = Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipoVariable);
            descriptor = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, valorPorDefecto);
            console.log(`[DEBUG Definicion L${numLn}] CREADO Descriptor Simple para '${nombreVarLc}':`, descriptor);
            console.log(`[DEBUG Definicion L${numLn}] CREADO desc.nombreOriginal: ${descriptor ? descriptor.nombreOriginal : 'desc es undefined'}, desc.tipoDeclarado: ${descriptor ? descriptor.tipoDeclarado : 'desc es undefined'}, desc.valor: ${descriptor ? descriptor.valor : 'desc es undefined'}, desc.esArreglo: ${descriptor ? descriptor.esArreglo : 'desc es undefined'}`);
            ambitoEjecucion[nombreVarLc] = descriptor;
            const descriptorDelAmbitoSim = ambitoEjecucion[nombreVarLc];
            console.log(`[DEBUG Definicion L${numLn}] ASIGNADO Descriptor Simple para '${nombreVarLc}' en ambito:`, descriptorDelAmbitoSim);
            console.log(`[DEBUG Definicion L${numLn}] ASIGNADO desc.nombreOriginal: ${descriptorDelAmbitoSim ? descriptorDelAmbitoSim.nombreOriginal : 'descDelAmbito es undefined'}, desc.tipoDeclarado: ${descriptorDelAmbitoSim ? descriptorDelAmbitoSim.tipoDeclarado : 'descDelAmbito es undefined'}, desc.esArreglo: ${descriptorDelAmbitoSim ? descriptorDelAmbitoSim.esArreglo : 'descDelAmbito es undefined'}`);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLn}: Variable '${nombreVar}' (${tipoVariable}) definida.`, 'debug');
        }
        console.log(`[DEBUG Definicion L${numLn}] Claves actuales en ambitoEjecucion TRAS '${nombreVarLc}':`, JSON.stringify(Object.keys(ambitoEjecucion)));
    } return true;
};
Webgoritmo.Interprete.procesarAsignacion = async function(linea,ambito,numLn){
    const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/;
    const m=linea.match(regexAsignacion);
    if(!m)throw new Error("Sintaxis asignación incorrecta L"+numLn);
    const destStr=m[1].trim();
    const exprStrCruda=m[2];
    const exprAEval=limpiarComentariosYEspaciosInternos(exprStrCruda);
    if(exprAEval==="")throw new Error(`Expresión vacía L${numLn}.`);
    const valEval=await Webgoritmo.Expresiones.evaluarExpresion(exprAEval,ambito,numLn);
    const accArrMatch=destStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);
    if(accArrMatch){
        const arrNom=accArrMatch[1]; const idxTxt=limpiarComentariosYEspaciosInternos(accArrMatch[2]); const arrNomLc=arrNom.toLowerCase();
        console.log(`[DEBUG Asignacion L${numLn}] Asignando a ARREGLO: '${arrNomLc}'. En Ámbito (claves):`, JSON.stringify(Object.keys(ambito)));
        if(!ambito.hasOwnProperty(arrNomLc)||!ambito[arrNomLc].esArreglo)throw new Error(`Arreglo '${arrNom}' no def L${numLn}.`);
        const descArr=ambito[arrNomLc];
        console.log(`[DEBUG Asignacion L${numLn}] Descriptor RECUPERADO para ARREGLO '${arrNomLc}':`, descArr);
        console.log(`[DEBUG Asignacion L${numLn}] RECUPERADO descArr.nombreOriginal: ${descArr ? descArr.nombreOriginal : 'descArr es undefined'}, descArr.esArreglo: ${descArr ? descArr.esArreglo : 'descArr es undefined'}`);
        const exprIdxs=idxTxt.split(',').map(s=>s.trim()); if(exprIdxs.some(s=>s===""))throw new Error(`Índice vacío L${numLn}.`); if(exprIdxs.length!==descArr.dimensiones.length)throw new Error(`Dims incorrectas L${numLn}.`); const evalIdxs=[]; for(const exIdx of exprIdxs){const vIdx=await Webgoritmo.Expresiones.evaluarExpresion(exIdx,ambito,numLn); if(typeof vIdx!=='number'||!Number.isInteger(vIdx))throw new Error(`Índice para '${arrNom}' debe ser entero. Obt: '${vIdx}' de '${exIdx}' L${numLn}.`); if(vIdx<=0||vIdx>descArr.dimensiones[evalIdxs.length])throw new Error(`Índice [${vIdx}] fuera de límites L${numLn}.`); evalIdxs.push(vIdx);} let target=descArr.valor; for(let k=0;k<evalIdxs.length-1;k++)target=target[evalIdxs[k]]; const valConvElem=Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valEval,descArr.tipoDeclarado,numLn); target[evalIdxs[evalIdxs.length-1]]=valConvElem; if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Arreglo '${descArr.nombreOriginal}'[${evalIdxs.join(',')}] <- ${valConvElem}`,'debug');
    } else {
        const varNomLc=destStr.toLowerCase();
        console.log(`[DEBUG Asignacion L${numLn}] Asignando a VARIABLE: '${varNomLc}'. En Ámbito (claves):`, JSON.stringify(Object.keys(ambito)));
        if(!ambito.hasOwnProperty(varNomLc)) throw new Error(`Var '${destStr}' no definida L${numLn}.`);
        const descVar=ambito[varNomLc];
        console.log(`[DEBUG Asignacion L${numLn}] Descriptor RECUPERADO para VARIABLE '${varNomLc}':`, descVar);
        console.log(`[DEBUG Asignacion L${numLn}] RECUPERADO desc.nombreOriginal: ${descVar ? descVar.nombreOriginal : 'descVar es undefined'}, desc.tipoDeclarado: ${descVar ? descVar.tipoDeclarado : 'descVar es undefined'}, desc.esArreglo: ${descVar ? descVar.esArreglo : 'descVar es undefined'}`);
        if(descVar.esArreglo)throw new Error(`Asignar a arreglo completo no permitido L${numLn}.`);
        try{
            descVar.valor=Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valEval,descVar.tipoDeclarado,numLn);
            if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`,'debug');
        }catch(e){throw e;}
    }
    return true;
};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ /* ... (sin cambios) ... */ return true;};

Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    console.log("[motorInterprete DEBUG] Entrando a ejecutarAlgoritmoPrincipal.");
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { console.error("[motorInterprete DEBUG] UI.añadirSalida no disponible."); return; }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { Webgoritmo.UI.añadirSalida("Error crítico: Editor no inicializado.", "error"); return; }
    if (!Webgoritmo.estadoApp) { Webgoritmo.UI.añadirSalida("Error crítico: Estado de la aplicación no disponible.", "error"); return; }
    if (!Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) { Webgoritmo.UI.añadirSalida("Error crítico: Evaluador de expresiones no disponible.", "error"); return; }

    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución ---", "normal");

    Webgoritmo.estadoApp.variablesGlobales = {}; Webgoritmo.estadoApp.funcionesDefinidas = {}; Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null; Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.variablesDestinoEntrada = []; Webgoritmo.estadoApp.nombresOriginalesParaPrompt = []; Webgoritmo.estadoApp.promesaEntradaPendiente = null; Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];
    Webgoritmo.estadoApp.pilaControl = [];

    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = -1;

    for (let i = 0; i < todasLasLineas.length; i++) {
        const lineaOriginal = todasLasLineas[i];
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginal);
        const lineaMinusculas = lineaProcesada.toLowerCase();
        if (lineaMinusculas.startsWith("algoritmo") || lineaMinusculas.startsWith("proceso")) {
            if (dentroBloquePrincipal) { Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: No anidar Algoritmo/Proceso.`; break; }
            dentroBloquePrincipal = true; numeroLineaInicioBloque = i;
        } else if (lineaMinusculas.startsWith("finalgoritmo") || lineaMinusculas.startsWith("finproceso")) {
            if (!dentroBloquePrincipal) { Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: Fin inesperado.`; }
            dentroBloquePrincipal = false; break;
        } else if (dentroBloquePrincipal) {
            lineasAlgoritmoPrincipal.push(lineaOriginal);
        } else if (lineaProcesada !== "") {
            Webgoritmo.estadoApp.errorEnEjecucion = `Error L${i + 1}: Instrucción '${lineaProcesada}' fuera de bloque.`; break;
        }
    }
    if (numeroLineaInicioBloque === -1 && !Webgoritmo.estadoApp.errorEnEjecucion && todasLasLineas.some(l => limpiarComentariosYEspacios(l) !== "")) {
        Webgoritmo.estadoApp.errorEnEjecucion = "No se encontró bloque 'Algoritmo' o 'Proceso'.";
    } else if (dentroBloquePrincipal && !Webgoritmo.estadoApp.errorEnEjecucion) {
        Webgoritmo.estadoApp.errorEnEjecucion = `Bloque Algoritmo/Proceso (iniciado en línea ${numeroLineaInicioBloque + 1}) no fue cerrado.`;
    }

    if (Webgoritmo.estadoApp.errorEnEjecucion) {
        Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error");
        Webgoritmo.UI.añadirSalida("--- Ejecución con errores de estructura ---", "error");
    } else if (lineasAlgoritmoPrincipal.length > 0) {
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque + 1);
    } else if (numeroLineaInicioBloque !== -1) {
        Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal del algoritmo está vacío.", "warning");
    } else {
         Webgoritmo.UI.añadirSalida("No hay código para ejecutar.", "normal");
    }

    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) {
        Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
    } else if (Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) {
        Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
    }
};

Webgoritmo.Interprete.regexSiEntonces = /^\s*si\s+(.+?)\s+entonces\s*$/i;
Webgoritmo.Interprete.regexSino = /^\s*sino\s*$/i;
Webgoritmo.Interprete.regexFinSi = /^\s*finsi\s*$/i;
Webgoritmo.Interprete.regexParaHacer = /^\s*para\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*<-\s*(.+?)\s+hasta\s+(.+?)\s+hacer\s*$/i;
Webgoritmo.Interprete.regexParaConPasoHacer = /^\s*para\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*<-\s*(.+?)\s+hasta\s+(.+?)\s+con\s+paso\s+(.+?)\s+hacer\s*$/i;
Webgoritmo.Interprete.regexFinPara = /^\s*finpara\s*$/i;
Webgoritmo.Interprete.regexMientrasHacer = /^\s*mientras\s+(.+?)\s+hacer\s*$/i;
Webgoritmo.Interprete.regexFinMientras = /^\s*finmientras\s*$/i;


Webgoritmo.Interprete.escanearBloqueSiLogico = function(lineasDelBloque, indiceSiRelativoActual, numeroLineaGlobalSi) {
    let nivelAnidamiento = 0; let indiceSinoEncontrado = -1; let indiceFinSiEncontrado = -1;
    for (let j = indiceSiRelativoActual + 1; j < lineasDelBloque.length; j++) {
        const lineaActual = limpiarComentariosYEspacios(lineasDelBloque[j]).toLowerCase();
        if (Webgoritmo.Interprete.regexSiEntonces.test(lineaActual)) nivelAnidamiento++;
        else if (Webgoritmo.Interprete.regexSino.test(lineaActual)) { if (nivelAnidamiento === 0) { if (indiceSinoEncontrado !== -1) throw new Error(`Múltiples 'Sino' L${numeroLineaGlobalSi}.`); indiceSinoEncontrado = j; }}
        else if (Webgoritmo.Interprete.regexFinSi.test(lineaActual)) { if (nivelAnidamiento === 0) { indiceFinSiEncontrado = j; break; } else nivelAnidamiento--; }
    }
    if (indiceFinSiEncontrado === -1) throw new Error(`'Si' L${numeroLineaGlobalSi} sin 'FinSi'.`);
    if (indiceSinoEncontrado !== -1 && indiceSinoEncontrado >= indiceFinSiEncontrado) throw new Error(`'Sino' L${numeroLineaGlobalSi - indiceSiRelativoActual + indiceSinoEncontrado} después de 'FinSi' L${numeroLineaGlobalSi - indiceSiRelativoActual + indiceFinSiEncontrado}.`);
    return { indiceSinoRelativo: indiceSinoEncontrado, indiceFinSiRelativo: indiceFinSiEncontrado };
};

Webgoritmo.Interprete.escanearParaFinPara = function(lineasDelBloque, indiceParaRelativoActual, numeroLineaGlobalPara) {
    let nivelAnidamiento = 0;
    for (let j = indiceParaRelativoActual + 1; j < lineasDelBloque.length; j++) {
        const lineaActual = limpiarComentariosYEspacios(lineasDelBloque[j]).toLowerCase();
        if (Webgoritmo.Interprete.regexParaHacer.test(lineaActual) || Webgoritmo.Interprete.regexParaConPasoHacer.test(lineaActual)) nivelAnidamiento++;
        else if (Webgoritmo.Interprete.regexFinPara.test(lineaActual)) { if (nivelAnidamiento === 0) return j; else nivelAnidamiento--; }
    }
    throw new Error(`'Para' L${numeroLineaGlobalPara} sin 'FinPara'.`);
};

Webgoritmo.Interprete.escanearParaFinMientras = function(lineasDelBloque, indiceMientrasRelativoActual, numeroLineaGlobalMientras) {
    let nivelAnidamiento = 0;
    for (let j = indiceMientrasRelativoActual + 1; j < lineasDelBloque.length; j++) {
        const lineaActual = limpiarComentariosYEspacios(lineasDelBloque[j]).toLowerCase();
        if (Webgoritmo.Interprete.regexMientrasHacer.test(lineaActual)) {
            nivelAnidamiento++;
        } else if (Webgoritmo.Interprete.regexFinMientras.test(lineaActual)) {
            if (nivelAnidamiento === 0) {
                return j;
            } else {
                nivelAnidamiento--;
            }
        }
    }
    throw new Error(`Error de sintaxis: La estructura 'Mientras' iniciada en la línea ${numeroLineaGlobalMientras} no tiene un 'FinMientras' correspondiente.`);
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    console.log(`[motorInterprete DEBUG] Entrando a ejecutarBloqueCodigo con ${lineasDelBloque ? lineasDelBloque.length : 'N/A'} líneas. Offset: ${numeroLineaOffset}`);
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');

    let i = 0;
    while (i < lineasDelBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        const lineaOriginalFuente = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i;
        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginalFuente };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginalFuente);
        const lineaMinusculas = lineaProcesada.toLowerCase();

        // Lógica de Salto para Estructuras de Control
        if (Webgoritmo.estadoApp.pilaControl.length > 0) {
            const controlActual = Webgoritmo.estadoApp.pilaControl[Webgoritmo.estadoApp.pilaControl.length - 1];
            let debeSaltarEstePaso = false;
            if (controlActual.tipo === "SI") {
                if (!controlActual.condicionOriginalFueVerdadera && !controlActual.seHaProcesadoElSino) {
                    const destino = controlActual.indiceSinoRelativo !== -1 ? controlActual.indiceSinoRelativo : controlActual.indiceFinSiRelativo;
                    if (i < destino) debeSaltarEstePaso = true;
                } else if (controlActual.condicionOriginalFueVerdadera && controlActual.seHaProcesadoElSino) {
                    if (i < controlActual.indiceFinSiRelativo) debeSaltarEstePaso = true;
                }
            } else if (controlActual.tipo === "PARA") {
                if (controlActual.saltarBloquePara && i < controlActual.indiceFinParaRelativo) debeSaltarEstePaso = true;
            } else if (controlActual.tipo === "MIENTRAS") {
                if (controlActual.saltarBloqueMientras) {
                    if (i < controlActual.indiceFinMientrasRelativo) {
                        debeSaltarEstePaso = true;
                    } else if (i === controlActual.indiceFinMientrasRelativo) {
                        Webgoritmo.estadoApp.pilaControl.pop();
                        console.log(`[DEBUG Salto-Mientras L${numeroLineaActualGlobal}] Alcanzado FinMientras de bucle no ejecutado. Popeado. Pila:`, JSON.stringify(Webgoritmo.estadoApp.pilaControl));
                    }
                }
            } else if (controlActual.tipo === "MIENTRAS_SALTANDO_AL_FIN") {
                 if (i < controlActual.indiceFinMientrasRelativo) {
                    debeSaltarEstePaso = true;
                }
            }

            if (debeSaltarEstePaso) {
                if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: [SALTANDO] ${lineaProcesada}`, 'debug-skip');
                i++; continue;
            }
        }

        if (lineaProcesada === "") { i++; continue; }
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: ${lineaProcesada}`, 'debug');

        let instruccionManejada = false;
        try {
            if (Webgoritmo.Interprete.regexSiEntonces.test(lineaMinusculas)) {
                const matchSi = lineaMinusculas.match(Webgoritmo.Interprete.regexSiEntonces);
                const exprCond = limpiarComentariosYEspaciosInternos(matchSi[1]);
                if (exprCond === "") throw new Error("Condición 'Si' vacía.");
                const resCond = await Webgoritmo.Expresiones.evaluarExpresion(exprCond, ambitoEjecucion, numeroLineaActualGlobal);
                if (typeof resCond !== 'boolean') throw new Error(`Condición 'Si' debe ser lógica, obtuvo ${typeof resCond}.`);
                const { indiceSinoRelativo, indiceFinSiRelativo } = Webgoritmo.Interprete.escanearBloqueSiLogico(lineasDelBloque, i, numeroLineaActualGlobal);
                Webgoritmo.estadoApp.pilaControl.push({ tipo: "SI", lineaSiRelativa: i, condicionOriginalFueVerdadera: resCond, indiceSinoRelativo, indiceFinSiRelativo, seHaProcesadoElSino: false });
                console.log(`[DEBUG Si L${numeroLineaActualGlobal}] Cond:${resCond}. Sino:L${indiceSinoRelativo!==-1?numeroLineaOffset+indiceSinoRelativo:'N/A'}. FinSi:L${numeroLineaOffset+indiceFinSiRelativo}. Pila:`,JSON.stringify(Webgoritmo.estadoApp.pilaControl));
                instruccionManejada = true;
            } else if (Webgoritmo.Interprete.regexSino.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0 || pila[pila.length-1].tipo !== "SI") throw new Error(`'Sino' inesperado L${numeroLineaActualGlobal}.`);
                const siCtx = pila[pila.length-1];
                if (i !== siCtx.indiceSinoRelativo) throw new Error(`Error estructura: 'Sino' L${numeroLineaActualGlobal} no esperado.`);
                siCtx.seHaProcesadoElSino = true;
                if (siCtx.condicionOriginalFueVerdadera) console.log(`[DEBUG Sino L${numeroLineaActualGlobal}] Cond Si V. Saltando Sino.`); else console.log(`[DEBUG Sino L${numeroLineaActualGlobal}] Cond Si F. Ejecutando Sino.`);
                instruccionManejada = true;
            } else if (Webgoritmo.Interprete.regexFinSi.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0 || pila[pila.length-1].tipo !== "SI") throw new Error(`'FinSi' inesperado L${numeroLineaActualGlobal}.`);
                const siCtx = pila[pila.length-1];
                if (i !== siCtx.indiceFinSiRelativo) throw new Error(`Error estructura: 'FinSi' L${numeroLineaActualGlobal} no esperado.`);
                pila.pop(); console.log(`[DEBUG FinSi L${numeroLineaActualGlobal}] Popeado Si de L${numeroLineaOffset+siCtx.lineaSiRelativa}. Pila:`,JSON.stringify(pila));
                instruccionManejada = true;
            } else if (Webgoritmo.Interprete.regexParaHacer.test(lineaMinusculas) || Webgoritmo.Interprete.regexParaConPasoHacer.test(lineaMinusculas)) {
                let matchPara = lineaMinusculas.match(Webgoritmo.Interprete.regexParaConPasoHacer);
                let conPaso = true; if (!matchPara) { matchPara = lineaMinusculas.match(Webgoritmo.Interprete.regexParaHacer); conPaso = false; }
                const vcNombre = limpiarComentariosYEspaciosInternos(matchPara[1]); const exprIniStr = limpiarComentariosYEspaciosInternos(matchPara[2]);
                const exprFinStr = limpiarComentariosYEspaciosInternos(matchPara[3]); const exprPasoStr = conPaso ? limpiarComentariosYEspaciosInternos(matchPara[4]) : "1";
                if (!vcNombre || !exprIniStr || !exprFinStr) throw new Error(`Sintaxis 'Para' incompleta L${numeroLineaActualGlobal}.`);
                const vcNombreLc = vcNombre.toLowerCase();
                if (!ambitoEjecucion.hasOwnProperty(vcNombreLc)) throw new Error(`Var control '${vcNombre}' no definida L${numeroLineaActualGlobal}.`);
                const descVC = ambitoEjecucion[vcNombreLc];
                if (descVC.esArreglo || !['entero','real','numero'].includes(descVC.tipoDeclarado)) throw new Error(`Var control '${vcNombre}' debe ser numérica L${numeroLineaActualGlobal}.`);
                const valIni = await Webgoritmo.Expresiones.evaluarExpresion(exprIniStr, ambitoEjecucion, numeroLineaActualGlobal);
                const valFin = await Webgoritmo.Expresiones.evaluarExpresion(exprFinStr, ambitoEjecucion, numeroLineaActualGlobal);
                const valPaso = await Webgoritmo.Expresiones.evaluarExpresion(exprPasoStr, ambitoEjecucion, numeroLineaActualGlobal);
                if (typeof valIni !== 'number' || typeof valFin !== 'number' || typeof valPaso !== 'number') throw new Error(`Valores 'Para' deben ser numéricos L${numeroLineaActualGlobal}.`);
                if (valPaso === 0) throw new Error(`Paso 'Para' no puede ser cero L${numeroLineaActualGlobal}.`);
                descVC.valor = valIni;
                if(Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: Var '${descVC.nombreOriginal}' (control Para) <- ${descVC.valor}`, 'debug');
                let contBucle = (valPaso > 0) ? (descVC.valor <= valFin) : (descVC.valor >= valFin);
                const idxFinParaRel = Webgoritmo.Interprete.escanearParaFinPara(lineasDelBloque, i, numeroLineaActualGlobal);
                Webgoritmo.estadoApp.pilaControl.push({ tipo: "PARA", lineaParaRelativa: i, variableControlNombreLc: vcNombreLc, valorFinal: valFin, paso: valPaso, indiceFinParaRelativo: idxFinParaRel, saltarBloquePara: !contBucle });
                console.log(`[DEBUG Para L${numeroLineaActualGlobal}] VC:${vcNombre}, Ini:${valIni}, Fin:${valFin}, Paso:${valPaso}. CondEntrada:${contBucle}. FinParaRel:${idxFinParaRel}. Pila:`, JSON.stringify(Webgoritmo.estadoApp.pilaControl));
                instruccionManejada = true;
            } else if (Webgoritmo.Interprete.regexFinPara.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0 || pila[pila.length-1].tipo !== "PARA") throw new Error(`'FinPara' inesperado L${numeroLineaActualGlobal}.`);
                const paraCtx = pila[pila.length-1];
                if (i !== paraCtx.indiceFinParaRelativo) throw new Error(`Error estructura: 'FinPara' L${numeroLineaActualGlobal} no esperado.`);
                const descVC = ambitoEjecucion[paraCtx.variableControlNombreLc];
                descVC.valor += paraCtx.paso;
                if(Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: Var '${descVC.nombreOriginal}' (control Para) actualizada a ${descVC.valor}`, 'debug');
                let contBucle = (paraCtx.paso > 0) ? (descVC.valor <= paraCtx.valorFinal) : (descVC.valor >= paraCtx.valorFinal);
                if (contBucle) {
                    i = paraCtx.lineaParaRelativa;
                    console.log(`[DEBUG FinPara L${numeroLineaActualGlobal}] Continuando bucle. Saltando a L rel ${i + 1}. VC: ${descVC.valor}`);
                } else {
                    pila.pop(); console.log(`[DEBUG FinPara L${numeroLineaActualGlobal}] Bucle Para (L${numeroLineaOffset+paraCtx.lineaParaRelativa}) finalizado. Popeado. Pila:`,JSON.stringify(pila));
                }
                instruccionManejada = true;
            } else if (Webgoritmo.Interprete.regexMientrasHacer.test(lineaMinusculas)) {
                const matchMientras = lineaMinusculas.match(Webgoritmo.Interprete.regexMientrasHacer);
                const expresionCondicionStr = limpiarComentariosYEspaciosInternos(matchMientras[1]);
                if (expresionCondicionStr === "") throw new Error(`Condición del 'Mientras' vacía L${numeroLineaActualGlobal}.`);

                let resultadoCondicion = false;
                const pila = Webgoritmo.estadoApp.pilaControl;
                const esReevaluacion = pila.length > 0 && pila[pila.length - 1].tipo === "MIENTRAS" && pila[pila.length - 1].lineaMientrasRelativa === i;

                if (esReevaluacion) {
                    const mientrasContext = pila[pila.length - 1];
                    resultadoCondicion = await Webgoritmo.Expresiones.evaluarExpresion(mientrasContext.condicionOriginalStr, ambitoEjecucion, numeroLineaActualGlobal);
                    if (typeof resultadoCondicion !== 'boolean') throw new Error(`Condición 'Mientras' L${numeroLineaActualGlobal} debe ser lógica.`);

                    if (!resultadoCondicion) {
                        pila.pop();
                        console.log(`[DEBUG Mientras L${numeroLineaActualGlobal}] Cond F (re-eval). Bucle terminado. Popeado. Pila:`, JSON.stringify(pila));
                        pila.push({
                            tipo: "MIENTRAS_SALTANDO_AL_FIN",
                            indiceFinMientrasRelativo: mientrasContext.indiceFinMientrasRelativo
                        });
                    } else {
                        console.log(`[DEBUG Mientras L${numeroLineaActualGlobal}] Cond V (re-eval). Continuando bucle.`);
                    }
                } else {
                    resultadoCondicion = await Webgoritmo.Expresiones.evaluarExpresion(expresionCondicionStr, ambitoEjecucion, numeroLineaActualGlobal);
                    if (typeof resultadoCondicion !== 'boolean') throw new Error(`Condición 'Mientras' L${numeroLineaActualGlobal} debe ser lógica.`);
                    const indiceFinMientrasRelativo = Webgoritmo.Interprete.escanearParaFinMientras(lineasDelBloque, i, numeroLineaActualGlobal);
                    pila.push({
                        tipo: "MIENTRAS",
                        lineaMientrasRelativa: i,
                        indiceFinMientrasRelativo: indiceFinMientrasRelativo,
                        condicionOriginalStr: expresionCondicionStr,
                        saltarBloqueMientras: !resultadoCondicion
                    });
                    console.log(`[DEBUG Mientras L${numeroLineaActualGlobal}] Cond ${resultadoCondicion} (inicial). FinMientras L${numeroLineaOffset + indiceFinMientrasRelativo}. Pila:`, JSON.stringify(pila));
                }
                instruccionManejada = true;
            } else if (Webgoritmo.Interprete.regexFinMientras.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0) throw new Error(`'FinMientras' inesperado L${numeroLineaActualGlobal} (pila vacía).`);

                const contextoTope = pila[pila.length - 1];

                if (contextoTope.tipo === "MIENTRAS_SALTANDO_AL_FIN") {
                    if (i !== contextoTope.indiceFinMientrasRelativo)  throw new Error(`Error estructura: 'FinMientras' L${numeroLineaActualGlobal} no esperado durante MIENTRAS_SALTANDO_AL_FIN.`);
                    pila.pop();
                    console.log(`[DEBUG FinMientras L${numeroLineaActualGlobal}] FinMientras procesado para MIENTRAS_SALTANDO_AL_FIN. Popeado. Pila:`, JSON.stringify(pila));
                } else if (contextoTope.tipo === "MIENTRAS") {
                    if (i !== contextoTope.indiceFinMientrasRelativo) {
                        throw new Error(`Error estructura: 'FinMientras' L${numeroLineaActualGlobal} no esperado para MIENTRAS en L${numeroLineaOffset + contextoTope.lineaMientrasRelativa}.`);
                    }
                    i = contextoTope.lineaMientrasRelativa;
                    console.log(`[DEBUG FinMientras L${numeroLineaActualGlobal}] Re-iterando Mientras. Saltando a L${numeroLineaOffset + i}.`);
                    instruccionManejada = true;
                    continue;
                } else {
                    throw new Error(`'FinMientras' inesperado L${numeroLineaActualGlobal}. Contexto en pila: ${contextoTope.tipo}.`);
                }
                instruccionManejada = true;
            } else {
                const regexAsignacion = /^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?\s*(?:<-|=)/;
                const esPotencialAsignacion = regexAsignacion.test(lineaProcesada);

                if (lineaMinusculas.startsWith("definir ")) {
                    instruccionManejada = await Webgoritmo.Interprete.procesarDefinicion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
                } else if (lineaMinusculas.startsWith("escribir ") || lineaMinusculas.startsWith("imprimir ") || lineaMinusculas.startsWith("mostrar ")) {
                    instruccionManejada = await Webgoritmo.Interprete.procesarSalidaConsola(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
                } else if (lineaMinusculas.startsWith("leer ")) {
                    instruccionManejada = await Webgoritmo.Interprete.procesarEntradaUsuario(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
                } else if (esPotencialAsignacion) {
                    instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
                } else {
                    const primeraPalabra = lineaMinusculas.split(" ")[0];
                    const palabrasClaveConocidas = ["algoritmo","proceso","finalgoritmo","finproceso", "si", "entonces", "sino", "finsi", "para", "hacer", "con", "paso", "finpara", "mientras", "finmientras"];
                    if (!palabrasClaveConocidas.includes(primeraPalabra) && lineaProcesada) {
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

Webgoritmo.Interprete.obtenerIndiceSiOriginal = function(pilaControl) {
    if (!pilaControl || pilaControl.length === 0) return "desconocida";
    for (let i = pilaControl.length - 1; i >= 0; i--) {
        if (pilaControl[i].tipo === "SI" && pilaControl[i].hasOwnProperty('lineaSiRelativa')) {
            return pilaControl[i].lineaSiRelativa;
        }
    }
    return "desconocida";
};

Webgoritmo.Interprete.regexSiEntonces = /^\s*si\s+(.+?)\s+entonces\s*$/i;
Webgoritmo.Interprete.regexSino = /^\s*sino\s*$/i;
Webgoritmo.Interprete.regexFinSi = /^\s*finsi\s*$/i;
Webgoritmo.Interprete.regexParaHacer = /^\s*para\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*<-\s*(.+?)\s+hasta\s+(.+?)\s+hacer\s*$/i;
Webgoritmo.Interprete.regexParaConPasoHacer = /^\s*para\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*<-\s*(.+?)\s+hasta\s+(.+?)\s+con\s+paso\s+(.+?)\s+hacer\s*$/i;
Webgoritmo.Interprete.regexFinPara = /^\s*finpara\s*$/i;
Webgoritmo.Interprete.regexMientrasHacer = /^\s*mientras\s+(.+?)\s+hacer\s*$/i;
Webgoritmo.Interprete.regexFinMientras = /^\s*finmientras\s*$/i;

Webgoritmo.Interprete.escanearBloqueSiLogico = function(lineasDelBloque, indiceSiRelativoActual, numeroLineaGlobalSi) {
    let nivelAnidamiento = 0;
    let indiceSinoEncontrado = -1;
    let indiceFinSiEncontrado = -1;
    for (let j = indiceSiRelativoActual + 1; j < lineasDelBloque.length; j++) {
        const lineaActual = limpiarComentariosYEspacios(lineasDelBloque[j]).toLowerCase();
        if (Webgoritmo.Interprete.regexSiEntonces.test(lineaActual)) {
            nivelAnidamiento++;
        } else if (Webgoritmo.Interprete.regexSino.test(lineaActual)) {
            if (nivelAnidamiento === 0) {
                if (indiceSinoEncontrado !== -1) {
                    throw new Error(`Error de sintaxis: Múltiples 'Sino' para el 'Si' de la línea ${numeroLineaGlobalSi}. Segundo 'Sino' en línea ${numeroLineaGlobalSi - indiceSiRelativoActual + j}.`);
                }
                indiceSinoEncontrado = j;
            }
        } else if (Webgoritmo.Interprete.regexFinSi.test(lineaActual)) {
            if (nivelAnidamiento === 0) {
                indiceFinSiEncontrado = j;
                break;
            } else {
                nivelAnidamiento--;
            }
        }
    }
    if (indiceFinSiEncontrado === -1) {
        throw new Error(`Error de sintaxis: La estructura 'Si' iniciada en la línea ${numeroLineaGlobalSi} no tiene un 'FinSi' correspondiente.`);
    }
    if (indiceSinoEncontrado !== -1 && indiceSinoEncontrado >= indiceFinSiEncontrado) {
        throw new Error(`Error de sintaxis: 'Sino' en línea ${numeroLineaGlobalSi - indiceSiRelativoActual + indiceSinoEncontrado} debe aparecer antes del 'FinSi' (L${numeroLineaGlobalSi - indiceSiRelativoActual + indiceFinSiEncontrado}) para el 'Si' de la línea ${numeroLineaGlobalSi}.`);
    }
    return {
        indiceSinoRelativo: indiceSinoEncontrado,
        indiceFinSiRelativo: indiceFinSiEncontrado
    };
};

Webgoritmo.Interprete.escanearParaFinPara = function(lineasDelBloque, indiceParaRelativoActual, numeroLineaGlobalPara) {
    let nivelAnidamiento = 0;
    for (let j = indiceParaRelativoActual + 1; j < lineasDelBloque.length; j++) {
        const lineaActual = limpiarComentariosYEspacios(lineasDelBloque[j]).toLowerCase();
        if (Webgoritmo.Interprete.regexParaHacer.test(lineaActual) || Webgoritmo.Interprete.regexParaConPasoHacer.test(lineaActual)) {
            nivelAnidamiento++;
        } else if (Webgoritmo.Interprete.regexFinPara.test(lineaActual)) {
            if (nivelAnidamiento === 0) return j;
            else nivelAnidamiento--;
        }
    }
    throw new Error(`Error de sintaxis: La estructura 'Para' iniciada en la línea ${numeroLineaGlobalPara} no tiene un 'FinPara' correspondiente.`);
};

Webgoritmo.Interprete.escanearParaFinMientras = function(lineasDelBloque, indiceMientrasRelativoActual, numeroLineaGlobalMientras) {
    let nivelAnidamiento = 0;
    for (let j = indiceMientrasRelativoActual + 1; j < lineasDelBloque.length; j++) {
        const lineaActual = limpiarComentariosYEspacios(lineasDelBloque[j]).toLowerCase();
        if (Webgoritmo.Interprete.regexMientrasHacer.test(lineaActual)) {
            nivelAnidamiento++;
        } else if (Webgoritmo.Interprete.regexFinMientras.test(lineaActual)) {
            if (nivelAnidamiento === 0) {
                return j;
            } else {
                nivelAnidamiento--;
            }
        }
    }
    throw new Error(`Error de sintaxis: La estructura 'Mientras' iniciada en la línea ${numeroLineaGlobalMientras} no tiene un 'FinMientras' correspondiente.`);
};

Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { /* ... */ };
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){ /* ... */ };
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){ /* ... */ };
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){ /* ... */ };
Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor = function(dims,baseT){ /* ... */ };
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { /* ... */ };

Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn("Dimension no implementada"); return false;};
Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lA,aA,nLSi,lBC,iSiB) { console.warn("Si-Entonces-Sino aún no implementado"); return iSiB;}; // Placeholder antiguo
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn("llamarSubProceso no implementado"); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn("parsearDefinicionSubProceso no implementado"); return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (con Mientras y corrección de punto y comas) cargado.");
