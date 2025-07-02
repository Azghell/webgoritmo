// motorInterprete.js (ESTADO ESTABLE REVERTIDO + Corrección Asignación Arreglo)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

function limpiarComentariosYEspacios(linea) { /* ... (como antes) ... */ }
function limpiarComentariosYEspaciosInternos(texto) { /* ... (como antes) ... */ }

Webgoritmo.Interprete.Utilidades = {
    obtenerValorPorDefectoSegunTipo: function(tipoTexto) { /* ... (como antes) ... */ },
    crearDescriptorVariable: function(nombreOriginal, tipoDeclarado, valorInicial) {
        const tipoNormalizado = String(tipoDeclarado).toLowerCase();
        return {
            nombreOriginal: nombreOriginal, tipoDeclarado: tipoNormalizado,
            valor: valorInicial,
            // Propiedades para arreglos (se usarán cuando se implemente Dimension/Definir arreglo)
            esArreglo: (tipoDeclarado.includes('[') && tipoDeclarado.includes(']')) || tipoDeclarado === 'array', // Mejorar detección si es necesario
            dimensiones: [], // Se llenará al definir un arreglo
            // tipoBase: tipoNormalizado // Si no es arreglo, tipoDeclarado es el tipoBase
        };
    },
    inferirTipoDesdeValor: function(valor) { /* ... (como antes) ... */ },
    convertirValorParaTipo: function(valor, tipoDestino, numeroLinea) { /* ... (como antes) ... */ },
    obtenerValorRealVariable: function(nombreVariable, ambitoActual, numeroLinea) {
        const nombreVarLc = String(nombreVariable).toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) {
            throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`);
        }
        const descriptor = ambitoActual[nombreVarLc];
        // Si es un arreglo y se intenta usar como valor simple en una expresión (que no sea acceso a elemento)
        // Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal es una bandera hipotética que controlaríamos
        // para permitir o no que un arreglo entero sea un operando (generalmente no se permite en PSeInt para operaciones aritm/log).
        if (descriptor.esArreglo && !(Webgoritmo.Expresiones && Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal === true && nombreOperando !== "Arreglo base para acceso")) {
           // El chequeo de si es "Arreglo base para acceso" lo hace el evaluador RPN antes de llamar aquí si es para un get_element.
           // Aquí, si es un arreglo y no es para un acceso directo, es un error usarlo como valor simple.
           // Esta lógica es compleja y depende de cómo el evaluador RPN maneje los identificadores de arreglos.
           // Por ahora, si es un arreglo, y no estamos explícitamente obteniendo un elemento, devolvemos el descriptor.
           // El evaluador RPN (en sus operaciones) deberá entonces fallar si recibe un descriptor de arreglo donde espera un valor.
           // O, si es para `OPERATOR_GET_ELEMENT`, el evaluador RPN tomará este descriptor.
           return descriptor; // Devolver el descriptor completo para que el evaluador RPN decida
        }
        return descriptor.valor;
    }
};

Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaProcesada, ambitoActual, numeroLinea) { /* ... (como antes) ... */ };
Webgoritmo.Interprete.procesarDefinicion = async function(lineaProcesada, ambitoEjecucion, numeroLinea) {
    console.log(`[DEBUG procesarDefinicion L${numeroLinea}] Entrando con línea: "${lineaProcesada}"`);
    const regexDefinirArreglo = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)\s*\[\s*(.+?)\s*\]/i;
    const regexDefinirSimple = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;
    let coincidencia;
    let esDefinicionArreglo = false;

    coincidencia = lineaProcesada.match(regexDefinirArreglo);
    if (coincidencia) {
        esDefinicionArreglo = true;
    } else {
        coincidencia = lineaProcesada.match(regexDefinirSimple);
    }

    if (!coincidencia || coincidencia.length < 3) {
        throw new Error(`Sintaxis incorrecta 'Definir' L${numeroLinea}. Recibido: "${lineaProcesada}"`);
    }

    const nombresVariables = coincidencia[1].split(',').map(nombre => nombre.trim());
    const tipoVariable = coincidencia[2].toLowerCase();

    for (const nombreVar of nombresVariables) {
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVar)) throw new Error(`Nombre var inválido: '${nombreVar}' L${numeroLinea}.`);
        const nombreVarLc = nombreVar.toLowerCase();
        if (ambitoEjecucion.hasOwnProperty(nombreVarLc)) if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Advertencia L${numeroLinea}: Var '${nombreVar}' redefinida.`,'warning');

        if (esDefinicionArreglo) {
            const dimsStrLimpio = limpiarComentariosYEspaciosInternos(coincidencia[3]);
            if (dimsStrLimpio === "") throw new Error(`Expresión de dimensión vacía para arreglo '${nombreVar}' L${numeroLinea}.`);
            const dimExprs = dimsStrLimpio.split(',').map(s => s.trim());
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                if (expr === "") throw new Error(`Dimensión vacía (post-coma) para arreglo '${nombreVar}' L${numeroLinea}.`);
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoEjecucion, numeroLinea);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}'->${dimVal} para '${nombreVar}' L${numeroLinea}.`);
                evalDimensiones.push(dimVal);
            }
            const descriptor = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, null); // Valor inicial null para el contenedor
            descriptor.esArreglo = true;
            descriptor.dimensiones = evalDimensiones;
            descriptor.valor = Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor(evalDimensiones, tipoVariable); // Usar una función de utilidad renombrada
            descriptor.tipoDeclarado = tipoVariable; // tipo base del arreglo
            ambitoEjecucion[nombreVarLc] = descriptor;
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Arreglo '${nombreVar}' (${tipoVariable}[${evalDimensiones.join(',')}]) definido.`, 'debug');
        } else {
            const valorPorDefecto = Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipoVariable);
            ambitoEjecucion[nombreVarLc] = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, valorPorDefecto);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Variable '${nombreVar}' (${tipoVariable}) definida.`, 'debug');
        }
    }
    return true;
};

Webgoritmo.Interprete.procesarAsignacion = async function(lineaProcesada, ambitoEjecucion, numeroLinea) {
    const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/;
    const coincidencia = lineaProcesada.match(regexAsignacion);
    if (!coincidencia) throw new Error("Sintaxis asignación incorrecta L"+numeroLinea);

    const destinoTexto = coincidencia[1].trim();
    const expresionTextoCruda = coincidencia[2];
    const expresionAEvaluar = limpiarComentariosYEspaciosInternos(expresionTextoCruda);
    if (expresionAEvaluar === "") throw new Error(`Expresión vacía L${numeroLinea}.`);

    const valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(expresionAEvaluar, ambitoEjecucion, numeroLinea);

    const accArrMatch = destinoTexto.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);

    if (accArrMatch) {
        const nombreArrOriginal = accArrMatch[1];
        const indicesTexto = limpiarComentariosYEspaciosInternos(accArrMatch[2]);
        const nombreArrLc = nombreArrOriginal.toLowerCase();

        if (!ambitoEjecucion.hasOwnProperty(nombreArrLc) || ambitoEjecucion[nombreArrLc].type !== 'array' && !ambitoEjecucion[nombreArrLc].esArreglo) { // Verificación CORREGIDA
            throw new Error(`Arreglo '${nombreArrOriginal}' no definido o no es un arreglo (L${numeroLinea}).`);
        }
        const descriptorArreglo = ambitoEjecucion[nombreArrLc];
        if (!descriptorArreglo.esArreglo) { // Doble chequeo por si type es genérico pero esArreglo sí está
             throw new Error(`Variable '${nombreArrOriginal}' no es un arreglo (L${numeroLinea}).`);
        }

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

        // Usar el tipoDeclarado del arreglo (que es el tipo base de sus elementos) para la conversión
        const valorConvertidoElemento = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valorEvaluado, descriptorArreglo.tipoDeclarado, numeroLinea);
        nivelDestino[indicesEvaluados[indicesEvaluados.length - 1]] = valorConvertidoElemento;
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Arreglo '${descriptorArreglo.nombreOriginal}'[${indicesEvaluados.join(',')}] <- ${valorConvertidoElemento}`, 'debug');
    } else {
        const varNomLc = destinoTexto.toLowerCase();
        if (!ambitoEjecucion.hasOwnProperty(varNomLc)) throw new Error(`Var '${destinoTexto}' no def L${numeroLinea}.`);
        const descVar = ambitoEjecucion[varNomLc];
        if (descVar.type === 'array' || descVar.esArreglo) { // CORREGIDO
             throw new Error(`No se puede asignar un valor a un arreglo completo ('${descVar.nombreOriginal}') sin especificar índices (L${numeroLinea}).`);
        }
        try {
            descVar.valor = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valorEvaluado, descVar.tipoDeclarado, numeroLinea);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`, 'debug');
        } catch (e) { throw e; }
    }
    return true;
};

Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaProcesada, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 3) ... */ };
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() { /* ... (como en ESTADO ESTABLE REVERTIDO) ... */ };
Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) { /* ... (como en ESTADO ESTABLE REVERTIDO, con logs RAW/PROCESADA y detección de Definir/Asignacion) ... */ };

// --- Copiar el resto de funciones de utilidad y placeholders ---
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===String(val).trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===String(val).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0'))return n;}}if(tipoDestN==='logico'&&tipoOriN==='cadena'){const valL=String(val).trim().toLowerCase();if(valL==="verdadero"||valL==="v")return true;if(valL==="falso"||valL==="f")return false;}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor = function(dims,baseT){const defV=this.obtenerValorPorDefectoSegunTipo(baseT);function cD(dI){const dS=dims[dI];if(typeof dS!=='number'||!Number.isInteger(dS)||dS<=0)throw new Error("Dim inválida.");let arr=new Array(dS+1);if(dI===dims.length-1){for(let i=1;i<=dS;i++)arr[i]=defV;}else{for(let i=1;i<=dS;i++)arr[i]=cD(dI+1);}return arr;}if(!dims||dims.length===0)throw new Error("No dims.");return cD(0);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(Webgoritmo.Expresiones && Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal)) { /* ... */ } return descriptor.esArreglo ? descriptor : descriptor.valor; }; // Modificado para devolver descriptor si es arreglo
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);if(argsTxt===""&&linea.match(rgx)[0].trim()!==m[0].split(" ")[0])return true; if(argsTxt==="")throw new Error(`'${m[0].split(" ")[0]}' sin args L${numLn}.`);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i]; if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if(exT==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(exT,ambito,numLn); outF+=typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart));} if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal'); return true;};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ const matchLeer=linea.match(/^leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLn); const nomsOrigRaw=limpiarComentariosYEspaciosInternos(matchLeer[1]); const nomsPrompt=nomsOrigRaw.split(',').map(v=>v.trim()); const nomsDest=nomsPrompt.map(n=>n.toLowerCase()); if(nomsDest.length===0||nomsDest.some(v=>v===""))throw new Error("Leer sin vars L"+numLn); for(const nomLc of nomsDest){const nomP=nomsPrompt.find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomP}' inválida L${numLn}.`); if(!ambito.hasOwnProperty(nomLc))throw new Error(`Var '${nomP}' no def L${numLn}.`); if(ambito[nomLc].esArreglo)throw new Error(`Leer arreglo completo no soportado L${numLn}.`);} let pMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(pMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntradaUsuario=true; Webgoritmo.estadoApp.variablesDestinoEntrada=nomsDest; Webgoritmo.estadoApp.nombresOriginalesParaPrompt=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; Webgoritmo.estadoApp.esperandoEntradaUsuario=false; if(Webgoritmo.estadoApp.detenerEjecucion&&Webgoritmo.estadoApp.errorEnEjecucion)throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); return true;};
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn("Dimension aún no implementada en esta fase de reconstrucción."); return false;}; // Placeholder
Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lA,aA,nLSi,lBC,iSiB) { console.warn("Si-Entonces-Sino aún no implementado en esta fase."); return iSiB;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn("llamarSubProceso no implementado."); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn("parsearDefinicionSubProceso no implementado."); return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (ESTABLE REVERTIDO + Corrección Asignación Arreglo) cargado.");
