// motorInterprete.js (ESTADO ESTABLE REVERTIDO + Logs Adicionales en Ejecución)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

function limpiarComentariosYEspacios(linea) { /* ... (como antes) ... */ }
function limpiarComentariosYEspaciosInternos(texto) { /* ... (como antes) ... */ }

Webgoritmo.Interprete.Utilidades = {
    PALABRAS_RESERVADAS: new Set([
        "PROCESO", "FINPROCESO", "ALGORITMO", "FINALGORITMO",
        "DEFINIR", "COMO", "LEER", "ESCRIBIR", "IMPRIMIR", "MOSTRAR",
        "SI", "ENTONCES", "SINO", "FINSI",
        "MIENTRAS", "HACER", "FINMIENTRAS",
        "PARA", "HASTA", "CON", "PASO", "FINPARA",
        "SEGUN", "DE", "OTRO", "MODO", "FINSEGUN",
        "FUNCION", "FINFUNCION", "SUBPROCESO", "FINSUBPROCESO",
        "Y", "O", "NO", "MOD",
        "VERDADERO", "FALSO",
        // Tipos de datos también se consideran reservados para nombres de variables
        "ENTERO", "REAL", "LOGICO", "CARACTER", "CADENA", "NUMERO", "TEXTO"
        // Añadir más si es necesario (ej. Dimension)
    ])
    /* ... (resto de utilidades como antes) ... */
};

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaProcesada, ambitoActual, numeroLinea) { /* ... (como antes) ... */ };
Webgoritmo.Interprete.procesarDefinicion = async function(lineaProcesada, ambitoEjecucion, numeroLinea) { /* ... (como antes) ... */ };
Webgoritmo.Interprete.procesarAsignacion = async function(lineaProcesada, ambitoEjecucion, numeroLinea) { /* ... (como antes) ... */ };
Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaProcesada, ambitoEjecucion, numeroLinea) { /* ... (como antes) ... */ };

// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    console.log("[motorInterprete DEBUG] Entrando a ejecutarAlgoritmoPrincipal."); // LOG AÑADIDO

    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) {
        console.error("[motorInterprete DEBUG] UI.añadirSalida no disponible en ejecutarAlgoritmoPrincipal.");
        return;
    }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) {
        console.error("[motorInterprete DEBUG] Editor o editorCodigo no está listo en ejecutarAlgoritmoPrincipal.");
        Webgoritmo.UI.añadirSalida("Error crítico: Editor no inicializado.", "error");
        return;
    }
    console.log("[motorInterprete DEBUG] Webgoritmo.Editor.editorCodigo SÍ está definido antes de getValue()."); // LOG AÑADIDO

    if (!Webgoritmo.estadoApp) {
        console.error("[motorInterprete DEBUG] estadoApp no listo en ejecutarAlgoritmoPrincipal.");
        Webgoritmo.UI.añadirSalida("Error crítico: Estado de la aplicación no disponible.", "error");
        return;
    }
    if (!Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) {
        console.error("[motorInterprete DEBUG] Expresiones.evaluarExpresion no listo en ejecutarAlgoritmoPrincipal.");
        Webgoritmo.UI.añadirSalida("Error crítico: Evaluador de expresiones no disponible.", "error");
        return;
    }

    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (ESTADO ESTABLE REVERTIDO + Logs Adicionales) ---", "normal");

    Webgoritmo.estadoApp.variablesGlobales = {};
    Webgoritmo.estadoApp.funcionesDefinidas = {};
    Webgoritmo.estadoApp.detenerEjecucion = false;
    Webgoritmo.estadoApp.errorEnEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false;
    Webgoritmo.estadoApp.variablesDestinoEntrada = [];
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = [];
    Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.resolverPromesaEntrada = null;
    Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];
    Webgoritmo.estadoApp.pilaControl = []; // <--- AÑADIDO para Si-Entonces

    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    console.log(`[motorInterprete DEBUG] Código obtenido, ${todasLasLineas.length} líneas.`); // LOG AÑADIDO

    let lineasAlgoritmoPrincipal = [];
    let dentroBloquePrincipal = false;
    let numeroLineaInicioBloque = 0;

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

    if (!Webgoritmo.estadoApp.errorEnEjecucion && numeroLineaInicioBloque === -1 && todasLasLineas.some(l => limpiarComentariosYEspacios(l) !== "")) {
        Webgoritmo.estadoApp.errorEnEjecucion = "No se encontró bloque 'Algoritmo' o 'Proceso'.";
    } else if (!Webgoritmo.estadoApp.errorEnEjecucion && dentroBloquePrincipal) {
        Webgoritmo.estadoApp.errorEnEjecucion = `Bloque Algoritmo/Proceso (iniciado en línea ${numeroLineaInicioBloque + 1} del editor) no fue cerrado correctamente.`;
    }

    if (Webgoritmo.estadoApp.errorEnEjecucion) {
        Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error");
        Webgoritmo.UI.añadirSalida("--- Ejecución con errores de estructura ---", "error");
    } else if (lineasAlgoritmoPrincipal.length > 0) {
        console.log(`[motorInterprete DEBUG] Llamando a ejecutarBloqueCodigo para el bloque principal (Offset: ${numeroLineaInicioBloque + 1}).`); // LOG AÑADIDO
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque + 1);
    } else if (numeroLineaInicioBloque !== -1) { // Bloque principal vacío pero correctamente delimitado
        Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal del algoritmo está vacío.", "warning");
    } else { // Sin bloque principal y sin otras instrucciones (código completamente vacío)
         Webgoritmo.UI.añadirSalida("No hay código para ejecutar.", "normal");
    }

    // Mensaje de finalización
    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) {
        Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
    } else if (Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) {
        // El error ya se mostró, solo añadimos el banner de finalización con errores
        Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
    }
    // Si está esperandoEntradaUsuario, no se muestra "finalizada" ni "con errores" aquí.
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    console.log(`[motorInterprete DEBUG] Entrando a ejecutarBloqueCodigo con ${lineasDelBloque ? lineasDelBloque.length : 'N/A'} líneas. Offset: ${numeroLineaOffset}`); // LOG AÑADIDO
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo (ESTADO ESTABLE REVERTIDO + Logs) procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');

    let i = 0;
    while (i < lineasDelBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        const lineaOriginalFuente = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i; // Número de línea global para mensajes de error, etc.

        Webgoritmo.estadoApp.lineaEnEjecucion = { numero: numeroLineaActualGlobal, contenidoOriginal: lineaOriginalFuente };
        const lineaProcesada = limpiarComentariosYEspacios(lineaOriginalFuente);
        const lineaMinusculas = lineaProcesada.toLowerCase();

        // Inicio de Lógica de Salto para Si-Entonces-Sino
        if (Webgoritmo.estadoApp.pilaControl.length > 0) {
            const controlActual = Webgoritmo.estadoApp.pilaControl[Webgoritmo.estadoApp.pilaControl.length - 1];
            if (controlActual.tipo === "SI") {
                let debeSaltarEstePaso = false;
                if (!controlActual.condicionOriginalFueVerdadera && !controlActual.seHaProcesadoElSino) {
                    // Condición del Si fue FALSA, y aún no hemos procesado/llegado al Sino (o al FinSi si no hay Sino).
                    // Destino del salto es el Sino (si existe) o el FinSi.
                    const destinoSaltoInmediato = controlActual.indiceSinoRelativo !== -1 ? controlActual.indiceSinoRelativo : controlActual.indiceFinSiRelativo;
                    if (i < destinoSaltoInmediato) {
                        debeSaltarEstePaso = true;
                        // console.log(`[DEBUG Si-Salto L${numeroLineaActualGlobal}] CondFalsa. Saltando "${lineaProcesada}" hacia Sino/FinSi en L${numeroLineaOffset + destinoSaltoInmediato}`);
                    }
                } else if (controlActual.condicionOriginalFueVerdadera && controlActual.seHaProcesadoElSino) {
                    // Condición del Si fue VERDADERA, y ya hemos procesado la línea Sino.
                    // Debemos saltar el bloque de código del Sino, hasta el FinSi.
                    if (i < controlActual.indiceFinSiRelativo) {
                        debeSaltarEstePaso = true;
                        // console.log(`[DEBUG Si-Salto L${numeroLineaActualGlobal}] CondVerdadera, PostSino. Saltando "${lineaProcesada}" hacia FinSi en L${numeroLineaOffset + controlActual.indiceFinSiRelativo}`);
                    }
                }

                if (debeSaltarEstePaso) {
                    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: [SALTANDO] ${lineaProcesada}`, 'debug-skip');
                    i++;
                    continue;
                }
            }
        }
        // Fin de Lógica de Salto

        console.log(`[RAW L${numeroLineaActualGlobal}]: "${lineaOriginalFuente}"`);
        console.log(`[PROCESADA L${numeroLineaActualGlobal}]: "${lineaProcesada}"`);

        if (lineaProcesada === "") { i++; continue; }
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaActualGlobal}: ${lineaProcesada}`, 'debug');

        let instruccionManejada = false;
        try {
            // Las regex globales Webgoritmo.Interprete.regexSiEntonces, regexSino, regexFinSi ya están definidas.

            if (Webgoritmo.Interprete.regexSiEntonces.test(lineaMinusculas)) {
                const matchSi = lineaMinusculas.match(Webgoritmo.Interprete.regexSiEntonces);
                const expresionCondicion = limpiarComentariosYEspaciosInternos(matchSi[1]);
                if (expresionCondicion === "") throw new Error("Condición del 'Si' está vacía.");

                const resultadoCondicion = await Webgoritmo.Expresiones.evaluarExpresion(expresionCondicion, ambitoEjecucion, numeroLineaActualGlobal);
                if (typeof resultadoCondicion !== 'boolean') {
                    throw new Error(`La condición del 'Si' debe ser lógica, se obtuvo '${resultadoCondicion}' (tipo: ${typeof resultadoCondicion}).`);
                }

                const { indiceSinoRelativo, indiceFinSiRelativo } = Webgoritmo.Interprete.escanearBloqueSiLogico(lineasDelBloque, i, numeroLineaActualGlobal);

                Webgoritmo.estadoApp.pilaControl.push({
                    tipo: "SI",
                    lineaSiRelativa: i,
                    condicionOriginalFueVerdadera: resultadoCondicion,
                    indiceSinoRelativo: indiceSinoRelativo,
                    indiceFinSiRelativo: indiceFinSiRelativo,
                    seHaProcesadoElSino: false
                });
                console.log(`[DEBUG Si L${numeroLineaActualGlobal}] Cond: ${resultadoCondicion}. Sino: L${indiceSinoRelativo !== -1 ? numeroLineaOffset + indiceSinoRelativo : 'N/A'}. FinSi: L${numeroLineaOffset + indiceFinSiRelativo}. Pila:`, JSON.stringify(Webgoritmo.estadoApp.pilaControl));
                // El salto (si !resultadoCondicion) se maneja al inicio del bucle en la siguiente iteración.
                instruccionManejada = true;

            } else if (Webgoritmo.Interprete.regexSino.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0 || pila[pila.length - 1].tipo !== "SI") {
                    throw new Error(`'Sino' inesperado en línea ${numeroLineaActualGlobal} sin un 'Si' correspondiente.`);
                }
                const siContext = pila[pila.length - 1];
                if (i !== siContext.indiceSinoRelativo) {
                    throw new Error(`Error de estructura: 'Sino' en línea ${numeroLineaActualGlobal} no está en la posición esperada (L${numeroLineaOffset + siContext.indiceSinoRelativo}) para el 'Si' de la línea ${numeroLineaOffset + siContext.lineaSiRelativa}.`);
                }

                siContext.seHaProcesadoElSino = true; // Marcar que hemos procesado la instrucción Sino

                if (siContext.condicionOriginalFueVerdadera) {
                    // Si la condición original fue V, el bloque Entonces se ejecutó. Ahora debemos saltar el bloque Sino.
                    // La lógica de salto al inicio del bucle se encargará a partir de la siguiente línea.
                    console.log(`[DEBUG Sino L${numeroLineaActualGlobal}] Condición del Si fue Verdadera. Se saltará el bloque Sino.`);
                } else {
                    // Condición original fue F, el bloque Entonces se saltó. Este bloque Sino se ejecuta.
                    console.log(`[DEBUG Sino L${numeroLineaActualGlobal}] Condición del Si fue Falsa. Se ejecutará el bloque Sino.`);
                }
                instruccionManejada = true;

            } else if (Webgoritmo.Interprete.regexFinSi.test(lineaMinusculas)) {
                const pila = Webgoritmo.estadoApp.pilaControl;
                if (pila.length === 0 || pila[pila.length - 1].tipo !== "SI") {
                    throw new Error(`'FinSi' inesperado en línea ${numeroLineaActualGlobal} sin un 'Si' correspondiente.`);
                }
                const siContext = pila[pila.length - 1];
                if (i !== siContext.indiceFinSiRelativo) {
                    throw new Error(`Error de estructura: 'FinSi' en línea ${numeroLineaActualGlobal} no está en la posición esperada (L${numeroLineaOffset + siContext.indiceFinSiRelativo}) para el 'Si' de la línea ${numeroLineaOffset + siContext.lineaSiRelativa}.`);
                }
                pila.pop();
                console.log(`[DEBUG FinSi L${numeroLineaActualGlobal}] FinSi correspondiente al Si (L${numeroLineaOffset + siContext.lineaSiRelativa}) encontrado y popeado. Pila:`, JSON.stringify(pila));
                instruccionManejada = true;

            } else { // Comprobación de otras instrucciones existentes
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
                    // Añadir Si, Sino, FinSi a palabras clave que no deberían dar "no reconocida" si se alcanzan erróneamente
                    const palabrasClaveConocidas = ["algoritmo","proceso","finalgoritmo","finproceso", "si", "entonces", "sino", "finsi"];
                    if (!palabrasClaveConocidas.includes(primeraPalabra) && lineaProcesada) {
                        throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);
                    }
                    // Si es una palabra clave de control que no se manejó (ej. Sino sin Si), el error se lanza arriba o se ignora si es parte de un salto.
                }
            }
        } catch (error) { Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`; Webgoritmo.estadoApp.detenerEjecucion = true; if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error"); break;  }

        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        i++;
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

// --- Funciones de utilidad y placeholders (copiadas del estado estable) ---

// Helper para obtener el índice original del Si (para mensajes de error)
// Esta función asume que el contexto Si tiene una propiedad `lineaSiOriginalGlobal`
Webgoritmo.Interprete.obtenerIndiceSiOriginal = function(pilaControl) {
    if (!pilaControl || pilaControl.length === 0) return "desconocida";
    for (let i = pilaControl.length - 1; i >= 0; i--) {
        if (pilaControl[i].tipo === "SI" && pilaControl[i].hasOwnProperty('lineaSiOriginalGlobal')) {
            return pilaControl[i].lineaSiOriginalGlobal;
        }
    }
    return "desconocida";
};

Webgoritmo.Interprete.regexSiEntonces = /^\s*si\s+(.+?)\s+entonces\s*$/i;
Webgoritmo.Interprete.regexSino = /^\s*sino\s*$/i;
Webgoritmo.Interprete.regexFinSi = /^\s*finsi\s*$/i;

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
                break; // FinSi encontrado para el Si actual, terminar escaneo.
            } else {
                nivelAnidamiento--;
            }
        }
    }

    if (indiceFinSiEncontrado === -1) {
        throw new Error(`Error de sintaxis: La estructura 'Si' iniciada en la línea ${numeroLineaGlobalSi} no tiene un 'FinSi' correspondiente.`);
    }

    // Validar que el Sino, si existe, esté antes del FinSi
    if (indiceSinoEncontrado !== -1 && indiceSinoEncontrado >= indiceFinSiEncontrado) {
        throw new Error(`Error de sintaxis: 'Sino' en línea ${numeroLineaGlobalSi - indiceSiRelativoActual + indiceSinoEncontrado} debe aparecer antes del 'FinSi' (L${numeroLineaGlobalSi - indiceSiRelativoActual + indiceFinSiEncontrado}) para el 'Si' de la línea ${numeroLineaGlobalSi}.`);
    }

    return {
        indiceSinoRelativo: indiceSinoEncontrado,
        indiceFinSiRelativo: indiceFinSiEncontrado
    };
};

Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo: (tipoD.includes('[') && tipoD.includes(']')) || tipoD === 'array',dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===String(val).trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===String(val).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0'))return n;}}if(tipoDestN==='logico'&&tipoOriN==='cadena'){const valL=String(val).trim().toLowerCase();if(valL==="verdadero"||valL==="v")return true;if(valL==="falso"||valL==="f")return false;}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor = function(dims,baseT){const defV=this.obtenerValorPorDefectoSegunTipo(baseT);function cD(dI){const dS=dims[dI];if(typeof dS!=='number'||!Number.isInteger(dS)||dS<=0)throw new Error("Dim inválida.");let arr=new Array(dS+1);if(dI===dims.length-1){for(let i=1;i<=dS;i++)arr[i]=defV;}else{for(let i=1;i<=dS;i++)arr[i]=cD(dI+1);}return arr;}if(!dims||dims.length===0)throw new Error("No dims.");return cD(0);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(Webgoritmo.Expresiones && Webgoritmo.Expresiones.permitirArregloComoOperandoGlobal)) { return descriptor;} return descriptor.valor; };
function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.procesarSalidaConsola = async function(linea,ambito,numLn){const rgx= /^(?:escribir|imprimir|mostrar)\s+(.*)/i;const m=linea.match(rgx);if(!m||!m[1])throw new Error("Escribir mal formado.");const argsTxt=limpiarComentariosYEspaciosInternos(m[1]);if(argsTxt===""&&linea.match(rgx)[0].trim()!==m[0].split(" ")[0])return true; if(argsTxt==="")throw new Error(`'${m[0].split(" ")[0]}' sin args L${numLn}.`);const exprs=[];let buff="";let inQ=false;let qT='';for(let i=0;i<argsTxt.length;i++){const ch=argsTxt[i]; if((ch==='"'||ch==="'")&&(i===0||argsTxt[i-1]!=='\\')){if(!inQ){inQ=true;qT=ch;buff+=ch;}else if(ch===qT){inQ=false;buff+=ch;}else{buff+=ch;}}else if(ch===','&&!inQ){exprs.push(buff.trim());buff="";}else{buff+=ch;}}if(buff.trim()!=="")exprs.push(buff.trim());let outF="";for(const exT of exprs){if(exT==="")continue; const evalPart=await Webgoritmo.Expresiones.evaluarExpresion(exT,ambito,numLn); outF+=typeof evalPart==='boolean'?(evalPart?'Verdadero':'Falso'):(evalPart===null?'nulo':String(evalPart));} if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(outF,'normal'); return true;};
Webgoritmo.Interprete.procesarDefinicion = async function(linea,ambitoEjecucion,numLn){
    console.log(`[DEBUG procesarDefinicion L${numLn}] Entrando con línea: "${linea}"`);
    const regexDefinirArreglo = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)\s*\[\s*(.+?)\s*\]/i;
    const regexDefinirSimple = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;
    let coincidencia;
    let esDefinicionArreglo = false;

    coincidencia = linea.match(regexDefinirArreglo);
    if (coincidencia) {
        esDefinicionArreglo = true;
    } else {
        coincidencia = linea.match(regexDefinirSimple);
    }

    if (!coincidencia || coincidencia.length < 3) {
        throw new Error(`Sintaxis incorrecta 'Definir' L${numLn}. Recibido: "${linea}"`);
    }

    const nombresVariables = coincidencia[1].split(',').map(nombre => nombre.trim());
    const tipoVariable = coincidencia[2].toLowerCase();

    for (const nombreVar of nombresVariables) {
        if (nombreVar === "") { // Chequeo adicional por si split produce nombres vacíos (ej. "Definir ,a Como Entero")
             throw new Error(`Nombre de variable no puede ser vacío en línea ${numLn}.`);
        }
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVar)) {
            throw new Error(`Nombre de variable inválido: '${nombreVar}' en línea ${numLn}. Contiene caracteres no permitidos.`);
        }
        // Validar contra palabras reservadas
        if (Webgoritmo.Interprete.Utilidades.PALABRAS_RESERVADAS.has(nombreVar.toUpperCase())) {
            throw new Error(`Error en línea ${numLn}: El nombre de variable '${nombreVar}' es una palabra reservada y no puede ser utilizado.`);
        }

        const nombreVarLc = nombreVar.toLowerCase();
        if (ambitoEjecucion.hasOwnProperty(nombreVarLc)) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Advertencia L${numLn}: Var '${nombreVar}' redefinida.`,'warning');
        }

        if (esDefinicionArreglo) {
            const dimsStrLimpio = limpiarComentariosYEspaciosInternos(coincidencia[3]);
            if (dimsStrLimpio === "") throw new Error(`Expresión de dimensión vacía para arreglo '${nombreVar}' L${numLn}.`);
            const dimExprs = dimsStrLimpio.split(',').map(s => s.trim());
            const evalDimensiones = [];
            for (const expr of dimExprs) {
                if (expr === "") throw new Error(`Dimensión vacía (post-coma) para arreglo '${nombreVar}' L${numLn}.`);
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoEjecucion, numLn);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) {
                    throw new Error(`Dimensiones deben ser enteros >0. Error en '${expr}'->${dimVal} para '${nombreVar}' L${numLn}.`);
                }
                evalDimensiones.push(dimVal);
            }
            const descriptor = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, null);
            descriptor.esArreglo = true;
            descriptor.dimensiones = evalDimensiones;
            descriptor.valor = Webgoritmo.Interprete.Utilidades.inicializarArregloConDescriptor(evalDimensiones, tipoVariable);
            descriptor.tipoDeclarado = tipoVariable; // Asegurar que tipoDeclarado sea el tipo base del arreglo
            ambitoEjecucion[nombreVarLc] = descriptor;
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLn}: Arreglo '${nombreVar}' (${tipoVariable}[${evalDimensiones.join(',')}]) definido.`, 'debug');
        } else {
            const valorPorDefecto = Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipoVariable);
            ambitoEjecucion[nombreVarLc] = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, valorPorDefecto);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numLn}: Variable '${nombreVar}' (${tipoVariable}) definida.`, 'debug');
        }
    }
    return true;
};
Webgoritmo.Interprete.procesarAsignacion = async function(linea,ambito,numLn){ const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/; const m=linea.match(regexAsignacion); if(!m)throw new Error("Sintaxis asignación incorrecta L"+numLn); const destStr=m[1].trim(); const exprStrCruda=m[2]; const exprAEval=limpiarComentariosYEspaciosInternos(exprStrCruda); if(exprAEval==="")throw new Error(`Expresión vacía L${numLn}.`); const valEval=await Webgoritmo.Expresiones.evaluarExpresion(exprAEval,ambito,numLn); const accArrMatch=destStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/); if(accArrMatch){const arrNom=accArrMatch[1]; const idxTxt=limpiarComentariosYEspaciosInternos(accArrMatch[2]); const arrNomLc=arrNom.toLowerCase(); if(!ambito.hasOwnProperty(arrNomLc)||!ambito[arrNomLc].esArreglo)throw new Error(`Arreglo '${arrNom}' no def L${numLn}.`); const descArr=ambito[arrNomLc]; const exprIdxs=idxTxt.split(',').map(s=>s.trim()); if(exprIdxs.some(s=>s===""))throw new Error(`Índice vacío L${numLn}.`); if(exprIdxs.length!==descArr.dimensiones.length)throw new Error(`Dims incorrectas L${numLn}.`); const evalIdxs=[]; for(const exIdx of exprIdxs){const vIdx=await Webgoritmo.Expresiones.evaluarExpresion(exIdx,ambito,numLn); if(typeof vIdx!=='number'||!Number.isInteger(vIdx))throw new Error(`Índice para '${arrNom}' debe ser entero. Obt: '${vIdx}' de '${exIdx}' L${numLn}.`); if(vIdx<=0||vIdx>descArr.dimensiones[evalIdxs.length])throw new Error(`Índice [${vIdx}] fuera de límites L${numLn}.`); evalIdxs.push(vIdx);} let target=descArr.valor; for(let k=0;k<evalIdxs.length-1;k++)target=target[evalIdxs[k]]; const valConvElem=Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valEval,descArr.tipoDeclarado,numLn); target[evalIdxs[evalIdxs.length-1]]=valConvElem; if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Arreglo '${descArr.nombreOriginal}'[${evalIdxs.join(',')}] <- ${valConvElem}`,'debug');} else {const varNomLc=destStr.toLowerCase(); if(!ambito.hasOwnProperty(varNomLc))throw new Error(`Var '${destStr}' no def L${numLn}.`); const descVar=ambito[varNomLc]; if(descVar.esArreglo)throw new Error(`Asignar a arreglo completo no permitido L${numLn}.`); try{descVar.valor=Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valEval,descVar.tipoDeclarado,numLn);if(Webgoritmo.UI.añadirSalida)Webgoritmo.UI.añadirSalida(`L${numLn}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`,'debug');}catch(e){throw e;}} return true;};
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ const matchLeer=linea.match(/^leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLn); const nomsOrigRaw=limpiarComentariosYEspaciosInternos(matchLeer[1]); const nomsPrompt=nomsOrigRaw.split(',').map(v=>v.trim()); const nomsDest=nomsPrompt.map(n=>n.toLowerCase()); if(nomsDest.length===0||nomsDest.some(v=>v===""))throw new Error("Leer sin vars L"+numLn); for(const nomLc of nomsDest){const nomP=nomsPrompt.find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomP}' inválida L${numLn}.`); if(!ambito.hasOwnProperty(nomLc))throw new Error(`Var '${nomP}' no def L${numLn}.`); if(ambito[nomLc].esArreglo)throw new Error(`Leer arreglo completo no soportado L${numLn}.`);} let pMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(pMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntradaUsuario=true; Webgoritmo.estadoApp.variablesDestinoEntrada=nomsDest; Webgoritmo.estadoApp.nombresOriginalesParaPrompt=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; Webgoritmo.estadoApp.esperandoEntradaUsuario=false; if(Webgoritmo.estadoApp.detenerEjecucion&&Webgoritmo.estadoApp.errorEnEjecucion)throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); return true;};
Webgoritmo.Interprete.procesarDimensionArreglo = async function(l,a,nL) { console.warn("Dimension no implementada"); return false;};
Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lA,aA,nLSi,lBC,iSiB) { console.warn("Si-Entonces-Sino aún no implementado"); return iSiB;};
Webgoritmo.Interprete.llamarSubProceso = async function(nFO,lEAStr,aL,nLL) { console.warn("llamarSubProceso no implementado"); return undefined;};
Webgoritmo.Interprete.parsearDefinicionSubProceso = function(lI,idxI,tLs){ console.warn("parsearDefinicionSubProceso no implementado"); return null;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (VERIFICACIÓN LOGS RAW/PROCESADA) cargado.");
