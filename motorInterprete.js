// motorInterprete.js (Con Logs Detallados en crearDescriptorVariable y procesarDefinicion)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim().replace(/;$/, "").trim(); }
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

Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni, numLnContexto = 'Desconocida'){ // numLnContexto para logging
    console.log(`[DEBUG crearDescriptorVariable L${numLnContexto}] INICIO. nom: ${nom}, tipoD: ${tipoD}, valIni: ${valIni}`);
    const tipoN=String(tipoD).toLowerCase();
    const esArr = (tipoD.includes('[') && tipoD.includes(']'));
    const objReturn = {
        nombreOriginal:nom,
        tipoDeclarado:tipoN,
        valor:valIni,
        esArreglo: esArr,
        dimensiones:[]
    };
    console.log(`[DEBUG crearDescriptorVariable L${numLnContexto}] FIN. Objeto a retornar:`, objReturn);
    try {
        console.log(`[DEBUG crearDescriptorVariable L${numLnContexto}] FIN. JSON.stringify del objeto:`, JSON.stringify(objReturn));
    } catch (e) {
        console.error(`[DEBUG crearDescriptorVariable L${numLnContexto}] Error al stringify objReturn:`, e, "Objeto era:", objReturn);
    }
    return objReturn;
};

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
            console.log(`[DEBUG Definicion L${numLn}] ANTES de llamar crearDescriptorVariable para ARREGLO '${nombreVarLc}'. typeof:`, typeof Webgoritmo.Interprete.Utilidades.crearDescriptorVariable);
            descriptor = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, null, numLn);
            console.log(`[DEBUG Definicion L${numLn}] DESPUÉS de llamar crearDescriptorVariable para ARREGLO '${nombreVarLc}'. Descriptor obtenido:`, descriptor);
            console.log(`[DEBUG Definicion L${numLn}] Propiedades del descriptor CREADO (Arreglo) - nombreOriginal: ${descriptor ? descriptor.nombreOriginal : 'desc es undefined'}, tipoDeclarado: ${descriptor ? descriptor.tipoDeclarado : 'desc es undefined'}, esArreglo: ${descriptor ? descriptor.esArreglo : 'desc es undefined'}`);
            descriptor.esArreglo = true; descriptor.dimensiones = evalDimensiones; descriptor.valor = Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor(evalDimensiones, tipoVariable); descriptor.tipoDeclarado = tipoVariable;
            ambitoEjecucion[nombreVarLc] = descriptor;
            const descriptorDelAmbitoArr = ambitoEjecucion[nombreVarLc];
            console.log(`[DEBUG Definicion L${numLn}] ASIGNADO Descriptor Arreglo para '${nombreVarLc}' en ambito:`, descriptorDelAmbitoArr);
            console.log(`[DEBUG Definicion L${numLn}] Propiedades del descriptor ASIGNADO (Arreglo) - nombreOriginal: ${descriptorDelAmbitoArr ? descriptorDelAmbitoArr.nombreOriginal : 'descDelAmbito es undefined'}, tipoDeclarado: ${descriptorDelAmbitoArr ? descriptorDelAmbitoArr.tipoDeclarado : 'descDelAmbito es undefined'}, esArreglo: ${descriptorDelAmbitoArr ? descriptorDelAmbitoArr.esArreglo : 'descDelAmbito es undefined'}`);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLn}: Arreglo '${nombreVar}' (${tipoVariable}[${evalDimensiones.join(',')}]) definido.`, 'debug');
        } else {
            const valorPorDefecto = Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipoVariable);
            console.log(`[DEBUG Definicion L${numLn}] ANTES de llamar crearDescriptorVariable para SIMPLE '${nombreVarLc}'. typeof:`, typeof Webgoritmo.Interprete.Utilidades.crearDescriptorVariable);
            descriptor = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, valorPorDefecto, numLn);
            console.log(`[DEBUG Definicion L${numLn}] DESPUÉS de llamar crearDescriptorVariable para SIMPLE '${nombreVarLc}'. Descriptor obtenido:`, descriptor);
            console.log(`[DEBUG Definicion L${numLn}] Propiedades del descriptor CREADO (Simple) - nombreOriginal: ${descriptor ? descriptor.nombreOriginal : 'desc es undefined'}, tipoDeclarado: ${descriptor ? descriptor.tipoDeclarado : 'desc es undefined'}, valor: ${descriptor ? descriptor.valor : 'desc es undefined'}, esArreglo: ${descriptor ? descriptor.esArreglo : 'desc es undefined'}`);
            ambitoEjecucion[nombreVarLc] = descriptor;
            const descriptorDelAmbitoSim = ambitoEjecucion[nombreVarLc];
            console.log(`[DEBUG Definicion L${numLn}] ASIGNADO Descriptor Simple para '${nombreVarLc}' en ambito:`, descriptorDelAmbitoSim);
            console.log(`[DEBUG Definicion L${numLn}] Propiedades del descriptor ASIGNADO (Simple) - nombreOriginal: ${descriptorDelAmbitoSim ? descriptorDelAmbitoSim.nombreOriginal : 'descDelAmbito es undefined'}, tipoDeclarado: ${descriptorDelAmbitoSim ? descriptorDelAmbitoSim.tipoDeclarado : 'descDelAmbito es undefined'}, esArreglo: ${descriptorDelAmbitoSim ? descriptorDelAmbitoSim.esArreglo : 'descDelAmbito es undefined'}`);
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
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea, ambito, numLn) {
    console.log(`[procesarEntradaUsuario L${numLn}] INICIO. Línea: "${linea}"`);
    const regexLeer = /^\s*leer\s+(.*)/i;
    const match = linea.match(regexLeer);

    if (!match || !match[1]) {
        throw new Error(`Sintaxis de 'Leer' incorrecta en línea ${numLn}.`);
    }

    const nombresVariablesStr = limpiarComentariosYEspaciosInternos(match[1]);
    if (nombresVariablesStr.trim() === "") {
        throw new Error(`'Leer' sin variables especificadas en línea ${numLn}.`);
    }

    const nombresVariables = nombresVariablesStr.split(',').map(v => v.trim());
    const nombresOriginales = [];
    const nombresVarLc = [];

    for (const nombreVar of nombresVariables) {
        const nombreVarLc = nombreVar.toLowerCase();
        if (!ambito.hasOwnProperty(nombreVarLc)) {
            throw new Error(`Variable '${nombreVar}' no ha sido definida antes de 'Leer' en línea ${numLn}.`);
        }
        const descriptor = ambito[nombreVarLc];
        if (descriptor.esArreglo) {
            // Por ahora, no permitimos leer arreglos completos directamente.
            // Se podría extender para leer en un índice específico si la sintaxis lo permite.
            throw new Error(`No se puede usar 'Leer' directamente sobre un arreglo completo ('${nombreVar}') en línea ${numLn}.`);
        }
        nombresOriginales.push(descriptor.nombreOriginal);
        nombresVarLc.push(nombreVarLc);
    }

    // Configurar el estado de la aplicación para esperar la entrada del usuario
    Webgoritmo.estadoApp.esperandoEntradaUsuario = true;
    Webgoritmo.estadoApp.variablesDestinoEntrada = nombresVarLc;
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = nombresOriginales;
    Webgoritmo.estadoApp.variablesGlobales = ambito; // Guardar referencia al ámbito actual

    // Mostrar el prompt de entrada en la UI
    const promptMsg = `Esperando entrada para: ${nombresOriginales.join(', ')}...`;
    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') {
        window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMsg);
    } else {
        console.error("La función global para solicitar entrada de usuario no está disponible.");
        // Fallback: usar un prompt simple del navegador, aunque esto detiene el hilo principal
        // y no es ideal para una app asíncrona. Solo como último recurso.
        // alert(promptMsg);
        // Esta línea anterior es un mal fallback. Lo mejor es lanzar un error si la UI no está lista.
        throw new Error("El mecanismo de entrada de la interfaz de usuario no está conectado.");
    }

    // Devolver una promesa que se resolverá cuando el usuario haya ingresado los datos
    return new Promise(resolve => {
        Webgoritmo.estadoApp.resolverPromesaEntrada = () => {
            console.log(`[procesarEntradaUsuario L${numLn}] Promesa resuelta. Reanudando ejecución.`);
            Webgoritmo.estadoApp.esperandoEntradaUsuario = false;
            Webgoritmo.estadoApp.variablesDestinoEntrada = [];
            Webgoritmo.estadoApp.nombresOriginalesParaPrompt = [];
            // No limpiar variablesGlobales aquí, podría ser usado por el manejador de entrada.
            resolve(true); // Resuelve la promesa para que el bucle del intérprete continúe.
        };
    });
};

Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    console.log("[MOTOR DEBUG] INICIO ejecutarAlgoritmoPrincipal");
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Iniciando ejecución del algoritmo principal...", "info");

    Webgoritmo.estadoApp.variables = {};
    Webgoritmo.estadoApp.funciones = {};
    Webgoritmo.estadoApp.detenerEjecucion = false;
    Webgoritmo.estadoApp.esperandoEntrada = false;
    Webgoritmo.estadoApp.errorEnEjecucion = null;
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
    Webgoritmo.estadoApp.pilaControl = [];
    Webgoritmo.estadoApp.ejecucionEnCurso = true;

    const lineasCodigo = Webgoritmo.estadoApp.lineasCodigo;
    if (!lineasCodigo || lineasCodigo.length === 0) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("No hay código para ejecutar.", "warning");
        Webgoritmo.estadoApp.ejecucionEnCurso = false;
        return;
    }

    try {
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasCodigo, Webgoritmo.estadoApp.variables, 0);
    } catch (error) {
        Webgoritmo.estadoApp.errorEnEjecucion = error.message;
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Error fatal: " + error.message, "error");
    } finally {
        Webgoritmo.estadoApp.ejecucionEnCurso = false;
        Webgoritmo.estadoApp.lineaEnEjecucion = null;
        if (Webgoritmo.estadoApp.errorEnEjecucion) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Ejecución finalizada con error: ${Webgoritmo.estadoApp.errorEnEjecucion}`, "error");
        } else if (Webgoritmo.estadoApp.detenerEjecucion && !Webgoritmo.estadoApp.errorEnEjecucion) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Ejecución detenida por el usuario.", "info");
        } else {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Ejecución finalizada.", "info");
        }
        console.log("[MOTOR DEBUG] FIN ejecutarAlgoritmoPrincipal. Estado final:", Webgoritmo.estadoApp);
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
Webgoritmo.Interprete.regexSegunHacer = /^\s*segun\s+(.+?)\s+hacer\s*$/i;
Webgoritmo.Interprete.regexCaso = /^\s*caso\s+(.+?)\s*:\s*$/i;
Webgoritmo.Interprete.regexDeOtroModo = /^\s*de\s+otro\s+modo\s*:\s*$/i;
Webgoritmo.Interprete.regexFinSegun = /^\s*finsegun\s*$/i;
Webgoritmo.Interprete.regexRepetir = /^\s*repetir\s*$/i;
Webgoritmo.Interprete.regexHastaQue = /^\s*hasta\s+que\s+(.+)/i;


Webgoritmo.Interprete.escanearBloqueSiLogico = function(lineasDelBloque, indiceSiRelativoActual, numeroLineaGlobalSi) { /* ... (sin cambios) ... */ };
Webgoritmo.Interprete.escanearParaFinPara = function(lineasDelBloque, indiceParaRelativoActual, numeroLineaGlobalPara) { /* ... (sin cambios) ... */ };

Webgoritmo.Interprete.escanearBloqueRepetir = function(lineasDelBloque, indiceRepetirRelativo, numeroLineaGlobalRepetir) {
    let contadorAnidado = 0;
    for (let i = indiceRepetirRelativo + 1; i < lineasDelBloque.length; i++) {
        const linea = limpiarComentariosYEspacios(lineasDelBloque[i]).toLowerCase();
        if (Webgoritmo.Interprete.regexRepetir.test(linea)) {
            contadorAnidado++;
        } else if (Webgoritmo.Interprete.regexHastaQue.test(linea)) {
            if (contadorAnidado === 0) {
                return i; // Devuelve el índice relativo del "Hasta Que"
            } else {
                contadorAnidado--;
            }
        }
    }
    throw new Error(`Error de sintaxis: Falta 'Hasta Que' para el 'Repetir' iniciado en línea ${numeroLineaGlobalRepetir}.`);
};

Webgoritmo.Interprete.escanearBloqueSegun = function(lineasDelBloque, indiceSegunRelativo, numeroLineaGlobalSegun) {
    console.log(`[DEBUG escanearBloqueSegun L${numeroLineaGlobalSegun}] INICIO. Buscando estructura para Segun.`);
    let indiceFinSegunRelativo = -1;
    const casos = []; // { valorExpr: string, indiceRelativo: number }
    let indiceDeOtroModoRelativo = -1;
    let contadorSegunAnidados = 0;

    for (let i = indiceSegunRelativo + 1; i < lineasDelBloque.length; i++) {
        const linea = limpiarComentariosYEspacios(lineasDelBloque[i]);
        const lineaMinusculas = linea.toLowerCase();

        if (Webgoritmo.Interprete.regexSegunHacer.test(lineaMinusculas)) {
            contadorSegunAnidados++;
        } else if (Webgoritmo.Interprete.regexFinSegun.test(lineaMinusculas)) {
            if (contadorSegunAnidados === 0) {
                indiceFinSegunRelativo = i;
                break; // Fin de la estructura
            } else {
                contadorSegunAnidados--;
            }
        } else if (contadorSegunAnidados === 0) {
            if (Webgoritmo.Interprete.regexCaso.test(lineaMinusculas)) {
                const matchCaso = linea.match(Webgoritmo.Interprete.regexCaso);
                casos.push({ valorExpr: matchCaso[1].trim(), indiceRelativo: i });
            } else if (Webgoritmo.Interprete.regexDeOtroModo.test(lineaMinusculas)) {
                if (indiceDeOtroModoRelativo !== -1) {
                    throw new Error(`Error de sintaxis: Múltiples 'De Otro Modo' para el 'Segun' en línea ${numeroLineaGlobalSegun}.`);
                }
                indiceDeOtroModoRelativo = i;
            }
        }
    }

    if (indiceFinSegunRelativo === -1) {
        throw new Error(`Error de sintaxis: Falta 'FinSegun' para el 'Segun' iniciado en línea ${numeroLineaGlobalSegun}.`);
    }

    console.log(`[DEBUG escanearBloqueSegun L${numeroLineaGlobalSegun}] FIN. FinSegun: L${numeroLineaGlobalSegun + (indiceFinSegunRelativo - indiceSegunRelativo)}, Casos: ${casos.length}, DeOtroModo: ${indiceDeOtroModoRelativo !== -1}`);
    return { indiceFinSegunRelativo, casos, indiceDeOtroModoRelativo };
};

Webgoritmo.Interprete.escanearParaFinMientras = function(lineasDelBloque, indiceMientrasRelativoActual, numeroLineaGlobalMientras) {
    console.log(`[DEBUG escanearParaFinMientras L${numeroLineaGlobalMientras}] INICIO. Buscando FinMientras para Mientras en L${numeroLineaGlobalMientras} (índice relativo ${indiceMientrasRelativoActual}). Total líneas en bloque: ${lineasDelBloque.length}`);
    let contadorMientrasAnidados = 0;
    for (let i = indiceMientrasRelativoActual + 1; i < lineasDelBloque.length; i++) {
        const linea = limpiarComentariosYEspacios(lineasDelBloque[i]);
        const lineaMinusculas = linea.toLowerCase();
        console.log(`[DEBUG escanearParaFinMientras L${numeroLineaGlobalMientras}] Escaneando L${numeroLineaGlobalMientras + (i - indiceMientrasRelativoActual)} (índice relativo ${i}): "${linea}"`);

        if (Webgoritmo.Interprete.regexMientrasHacer.test(lineaMinusculas)) {
            contadorMientrasAnidados++;
            console.log(`[DEBUG escanearParaFinMientras L${numeroLineaGlobalMientras}] Encontrado Mientras anidado en L${numeroLineaGlobalMientras + (i - indiceMientrasRelativoActual)}. Contador anidado: ${contadorMientrasAnidados}`);
        } else if (Webgoritmo.Interprete.regexFinMientras.test(lineaMinusculas)) {
            if (contadorMientrasAnidados === 0) {
                console.log(`[DEBUG escanearParaFinMientras L${numeroLineaGlobalMientras}] FIN. FinMientras encontrado en L${numeroLineaGlobalMientras + (i - indiceMientrasRelativoActual)} (índice relativo ${i}).`);
                return i; // Devuelve el índice relativo al bloque actual
            } else {
                contadorMientrasAnidados--;
                console.log(`[DEBUG escanearParaFinMientras L${numeroLineaGlobalMientras}] Encontrado FinMientras de bucle anidado en L${numeroLineaGlobalMientras + (i - indiceMientrasRelativoActual)}. Contador anidado restante: ${contadorMientrasAnidados}`);
            }
        }
    }
    console.error(`[DEBUG escanearParaFinMientras L${numeroLineaGlobalMientras}] ERROR: No se encontró FinMientras para el Mientras en L${numeroLineaGlobalMientras}.`);
    throw new Error(`Error de sintaxis: Falta FinMientras para el Mientras iniciado en línea ${numeroLineaGlobalMientras}.`);
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) { /* ... (sin cambios en la estructura principal, solo los logs dentro de procesarDefinicion y procesarAsignacion que ya están arriba) ... */
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
            } else if (controlActual.tipo === "SEGUN") {
                const lineaActualEsCaso = Webgoritmo.Interprete.regexCaso.test(lineaMinusculas);
                const lineaActualEsDeOtroModo = Webgoritmo.Interprete.regexDeOtroModo.test(lineaMinusculas);

                if (controlActual.casoEncontrado) {
                    // Si ya encontramos nuestro caso, saltamos hasta el FinSegun.
                    i = controlActual.indiceFinSegunRelativo - 1; // -1 por el i++ del bucle
                    console.log(`[DEBUG Salto-Segun L${numeroLineaActualGlobal}] Caso ya procesado. Saltando a FinSegun L${numeroLineaOffset + controlActual.indiceFinSegunRelativo}.`);
                    continue; // Continuar al siguiente ciclo para que el i++ nos posicione correctamente.
                }

                // Si aún no hemos encontrado un caso que coincida
                if (lineaActualEsCaso) {
                    const matchCaso = lineaProcesada.match(Webgoritmo.Interprete.regexCaso);
                    const exprCaso = matchCaso[1].trim();
                    const valorCaso = await Webgoritmo.Expresiones.evaluarExpresion(exprCaso, ambitoEjecucion, numeroLineaActualGlobal);

                    if (valorCaso === controlActual.valorEvaluado) {
                        controlActual.casoEncontrado = true;
                        console.log(`[DEBUG Salto-Segun L${numeroLineaActualGlobal}] Coincidencia encontrada. Ejecutando caso.`);
                        // No saltar, dejar que se ejecuten las siguientes líneas.
                    } else {
                        debeSaltarEstePaso = true; // No es el caso, saltar esta línea y las siguientes.
                    }
                } else if (lineaActualEsDeOtroModo) {
                    controlActual.casoEncontrado = true;
                    console.log(`[DEBUG Salto-Segun L${numeroLineaActualGlobal}] Ningún caso coincidió. Ejecutando 'De Otro Modo'.`);
                    // No saltar.
                } else {
                    // Si no es un 'Caso' ni 'De Otro Modo', es una línea que hay que saltar porque no hemos encontrado coincidencia.
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

                    console.log(`[DEBUG ejecutarBloqueCodigo L${numeroLineaActualGlobal}] ANTES de llamar a escanearParaFinMientras. Línea actual (i): ${i}, Total líneas bloque: ${lineasDelBloque.length}`);
                    const indiceFinMientrasRelativo = Webgoritmo.Interprete.escanearParaFinMientras(lineasDelBloque, i, numeroLineaActualGlobal);
                    console.log(`[DEBUG ejecutarBloqueCodigo L${numeroLineaActualGlobal}] DESPUÉS de llamar a escanearParaFinMientras. Índice devuelto: ${indiceFinMientrasRelativo}`);

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
            } else if (Webgoritmo.Interprete.regexSegunHacer.test(lineaMinusculas)) {
                const matchSegun = lineaProcesada.match(Webgoritmo.Interprete.regexSegunHacer);
                const exprVariable = limpiarComentariosYEspaciosInternos(matchSegun[1]);
                if (exprVariable === "") throw new Error(`Expresión vacía en 'Segun' L${numeroLineaActualGlobal}.`);

                const valorVariable = await Webgoritmo.Expresiones.evaluarExpresion(exprVariable, ambitoEjecucion, numeroLineaActualGlobal);
                const { indiceFinSegunRelativo, casos, indiceDeOtroModoRelativo } = Webgoritmo.Interprete.escanearBloqueSegun(lineasDelBloque, i, numeroLineaActualGlobal);

                Webgoritmo.estadoApp.pilaControl.push({
                    tipo: "SEGUN",
                    lineaSegunRelativa: i,
                    valorEvaluado: valorVariable,
                    casos: casos,
                    indiceDeOtroModoRelativo: indiceDeOtroModoRelativo,
                    indiceFinSegunRelativo: indiceFinSegunRelativo,
                    casoEncontrado: false // Para saltar al FinSegun después de un caso
                });
                console.log(`[DEBUG Segun L${numeroLineaActualGlobal}] Valor: ${valorVariable}. FinSegun: L${numeroLineaOffset + indiceFinSegunRelativo}. Pila:`, JSON.stringify(Webgoritmo.estadoApp.pilaControl));
                instruccionManejada = true;

            } else if (Webgoritmo.Interprete.regexCaso.test(lineaMinusculas) || Webgoritmo.Interprete.regexDeOtroModo.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0 || pila[pila.length - 1].tipo !== "SEGUN") throw new Error(`'Caso' o 'De Otro Modo' inesperado L${numeroLineaActualGlobal}.`);
                // Este bloque ahora solo sirve para validar la estructura.
                // La lógica de salto y ejecución se maneja completamente en la sección de "Salto"
                // al principio del bucle while. Dejar este bloque vacío previene el doble procesamiento.
                instruccionManejada = true;

            } else if (Webgoritmo.Interprete.regexFinSegun.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0 || pila[pila.length - 1].tipo !== "SEGUN") throw new Error(`'FinSegun' inesperado L${numeroLineaActualGlobal}.`);
                const segunCtx = pila[pila.length - 1];
                if (i !== segunCtx.indiceFinSegunRelativo) throw new Error(`Error estructura: 'FinSegun' L${numeroLineaActualGlobal} no esperado.`);
                pila.pop();
                console.log(`[DEBUG FinSegun L${numeroLineaActualGlobal}] Popeado Segun de L${numeroLineaOffset + segunCtx.lineaSegunRelativa}. Pila:`, JSON.stringify(pila));
                instruccionManejada = true;

            } else {
                const regexAsignacion = /^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?\s*(?:<-|=)/;
                const esPotencialAsignacion = regexAsignacion.test(lineaProcesada);

                if (Webgoritmo.Interprete.regexRepetir.test(lineaMinusculas)) {
                    const indiceHastaQue = Webgoritmo.Interprete.escanearBloqueRepetir(lineasDelBloque, i, numeroLineaActualGlobal);
                    Webgoritmo.estadoApp.pilaControl.push({
                        tipo: "REPETIR",
                        lineaRepetirRelativa: i,
                        indiceHastaQueRelativo: indiceHastaQue
                    });
                    instruccionManejada = true;
                } else if (Webgoritmo.Interprete.regexHastaQue.test(lineaMinusculas)) {
                    const pila = Webgoritmo.estadoApp.pilaControl;
                    if (pila.length === 0 || pila[pila.length - 1].tipo !== "REPETIR") {
                        throw new Error(`'Hasta Que' inesperado en línea ${numeroLineaActualGlobal}.`);
                    }
                    const repetirCtx = pila[pila.length - 1];
                    if (i !== repetirCtx.indiceHastaQueRelativo) {
                        throw new Error(`Error de estructura: 'Hasta Que' en línea ${numeroLineaActualGlobal} no corresponde al 'Repetir' de la línea ${numeroLineaOffset + repetirCtx.lineaRepetirRelativa}.`);
                    }
                    const matchHastaQue = lineaProcesada.match(Webgoritmo.Interprete.regexHastaQue);
                    const exprCondicion = limpiarComentariosYEspaciosInternos(matchHastaQue[1]);
                    const resultadoCondicion = await Webgoritmo.Expresiones.evaluarExpresion(exprCondicion, ambitoEjecucion, numeroLineaActualGlobal);
                    if (typeof resultadoCondicion !== 'boolean') {
                        throw new Error(`La condición de 'Hasta Que' debe ser lógica, pero se obtuvo ${typeof resultadoCondicion} en línea ${numeroLineaActualGlobal}.`);
                    }

                    if (!resultadoCondicion) {
                        // La condición es falsa, volver al inicio del bucle Repetir.
                        i = repetirCtx.lineaRepetirRelativa;
                    } else {
                        // La condición es verdadera, el bucle termina. Sacar de la pila.
                        pila.pop();
                    }
                    instruccionManejada = true;
                } else if (lineaMinusculas.startsWith("definir ")) {
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

Webgoritmo.Interprete.escanearBloqueSiLogico = function(lineasDelBloque, indiceSiRelativoActual, numeroLineaGlobalSi) { /* ... (sin cambios) ... */ };
Webgoritmo.Interprete.escanearParaFinPara = function(lineasDelBloque, indiceParaRelativoActual, numeroLineaGlobalPara) { /* ... (sin cambios) ... */ };
Webgoritmo.Interprete.escanearParaFinMientras = function(lineasDelBloque, indiceMientrasRelativoActual, numeroLineaGlobalMientras) { /* ... (sin cambios) ... */ };

Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn("Dimension no implementada"); return false;};
Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lA,aA,nLSi,lBC,iSiB) { console.warn("Si-Entonces-Sino aún no implementado"); return iSiB;}; // Placeholder antiguo
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn("llamarSubProceso no implementado"); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn("parsearDefinicionSubProceso no implementado"); return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function(lineasCodigo, ambitoGlobal = null) {
    console.log("[MOTOR DEBUG] INICIO ejecutarPseudocodigo");
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Iniciando ejecución de pseudocodigo (bloque)...", "info");

    // Configuración similar a ejecutarAlgoritmoPrincipal pero para un bloque más genérico
    // Si no se provee un ámbito, se usa uno nuevo (podría ser el global de estadoApp o uno temporal)
    const ambitoEjecucion = ambitoGlobal || { ...Webgoritmo.estadoApp.variables }; // Copia para no afectar global si es temporal

    // No se reinicia todo el estadoApp necesariamente, solo lo relevante para este bloque
    Webgoritmo.estadoApp.detenerEjecucion = false;
    Webgoritmo.estadoApp.errorEnEjecucion = null;
    // Webgoritmo.estadoApp.pilaControl = []; // ¿Debería reiniciarse aquí o ser gestionada por el llamador? Por ahora, sí.
    Webgoritmo.estadoApp.pilaControl = [];


    if (!lineasCodigo || lineasCodigo.length === 0) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("No hay código en el bloque para ejecutar.", "warning");
        return;
    }

    try {
        // El offset es 0 porque las líneas son relativas al bloque actual
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasCodigo, ambitoEjecucion, 0);
    } catch (error) {
        // Este error debería ser manejado por ejecutarBloqueCodigo y reflejado en estadoApp.errorEnEjecucion
        // Pero por si acaso, lo capturamos aquí también.
        if (Webgoritmo.UI.añadirSalida && !Webgoritmo.estadoApp.errorEnEjecucion) {
             Webgoritmo.UI.añadirSalida("Error fatal en bloque: " + error.message, "error");
        }
         Webgoritmo.estadoApp.errorEnEjecucion = Webgoritmo.estadoApp.errorEnEjecucion || error.message;
    } finally {
        // No se cambia ejecucionEnCurso global aquí, eso lo maneja el flujo principal
        if (Webgoritmo.estadoApp.errorEnEjecucion) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Bloque finalizado con error: ${Webgoritmo.estadoApp.errorEnEjecucion}`, "error");
        } else if (Webgoritmo.estadoApp.detenerEjecucion) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Bloque detenido por el usuario.", "info");
        } else {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Bloque finalizado.", "info");
        }
        console.log("[MOTOR DEBUG] FIN ejecutarPseudocodigo.");
    }
};

// Mantener la asignación si ejecutarAlgoritmoPrincipal es el punto de entrada principal desde la UI
// Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
// Sin embargo, app.js llama a Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal directamente.
// Si se quiere que ejecutarPseudocodigo sea el único entry point, app.js debería llamar a este.
// Por ahora, son dos funciones con propósitos ligeramente distintos.

console.log("motorInterprete.js (con Mientras y logs detallados para Definicion/Asignacion y logs en puntos de entrada) cargado.");
