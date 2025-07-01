// motorInterprete.js (Fase 5 Reconstrucción: Si-Entonces-Sino - Intento 2)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

// --- NAMESPACE PARA UTILIDADES DEL INTÉRPRETE ---
Webgoritmo.Interprete.Utilidades = {
    obtenerValorPorDefectoSegunTipo: function(tipoTexto) {
        const tipoNormalizado = String(tipoTexto).toLowerCase();
        switch (tipoNormalizado) {
            case 'entero': return 0;
            case 'real': return 0.0;
            case 'logico': return false;
            case 'caracter': return '';
            case 'cadena': return '';
            default: console.warn(`Tipo '${tipoTexto}' no reconocido en obtenerValorPorDefectoSegunTipo.`); return null;
        }
    },
    crearDescriptorVariable: function(nombreOriginal, tipoDeclarado, valorInicial) {
        const tipoNormalizado = String(tipoDeclarado).toLowerCase();
        return {
            nombreOriginal: nombreOriginal, tipoDeclarado: tipoNormalizado,
            valor: valorInicial, esArreglo: false, dimensiones: [] // Añadido esArreglo y dimensiones para el futuro
        };
    },
    inferirTipoDesdeValor: function(valor) {
        if (typeof valor === 'number') return Number.isInteger(valor) ? 'entero' : 'real';
        if (typeof valor === 'boolean') return 'logico';
        if (typeof valor === 'string') return 'cadena';
        return 'desconocido';
    },
    convertirValorParaTipo: function(valor, tipoDestino, numeroLinea) {
        const tipoDestNormalizado = String(tipoDestino).toLowerCase();
        const tipoOrigenNormalizado = this.inferirTipoDesdeValor(valor); // 'this' aquí es correcto
        if (tipoOrigenNormalizado === tipoDestNormalizado) return valor;
        if (tipoDestNormalizado === 'real' && tipoOrigenNormalizado === 'entero') return parseFloat(valor);
        if (tipoDestNormalizado === 'cadena') return String(valor);
        if (tipoDestNormalizado === 'entero') {
            if (tipoOrigenNormalizado === 'real') return Math.trunc(valor);
            if (tipoOrigenNormalizado === 'cadena') {
                const num = parseInt(valor, 10);
                if (!isNaN(num) && String(num) === String(valor).trim()) return num;
            }
        }
        if (tipoDestNormalizado === 'real') {
            if (tipoOrigenNormalizado === 'cadena') {
                const num = parseFloat(valor);
                // Validar que la cadena completa fue un número válido, no solo el inicio.
                if (!isNaN(num) && String(num) === String(valor).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0') ) return num;
            }
        }
        if (tipoDestNormalizado === 'logico' && tipoOrigenNormalizado === 'cadena') {
            const valLower = String(valor).trim().toLowerCase();
            if (valLower === "verdadero" || valLower === "v") return true;
            if (valLower === "falso" || valLower === "f") return false;
        }
        throw new Error(`L${numeroLinea}: No se puede convertir '${valor}' (${tipoOrigenNormalizado}) a '${tipoDestNormalizado}'.`);
    },
    obtenerValorRealVariable: function(nombreVariable, ambitoActual, numeroLinea) {
        const nombreVarLc = String(nombreVariable).toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`);
        const descriptor = ambitoActual[nombreVarLc];
        if (descriptor.esArreglo) throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en una expresión.`);
        return descriptor.valor;
    }
};

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) {
    const regexEscribir = /^(?:escribir|imprimir|mostrar)\s+(.*)/i;
    const coincidencia = lineaCompleta.match(regexEscribir);
    if (!coincidencia || !coincidencia[1]) throw new Error("Instrucción Escribir mal formada.");
    const argumentosComoTexto = limpiarComentariosYEspaciosInternos(coincidencia[1]);
    if (argumentosComoTexto === "" && lineaCompleta.match(regexEscribir)[0].trim() !== coincidencia[0].split(" ")[0]) return true;
    if (argumentosComoTexto === "") throw new Error(`'${coincidencia[0].split(" ")[0]}' sin argumentos L${numeroLinea}.`);
    const listaExpresiones = []; let buffer = ""; let dentroDeComillas = false; let tipoComillas = '';
    for (let i = 0; i < argumentosComoTexto.length; i++) {
        const char = argumentosComoTexto[i];
        if ((char === '"' || char === "'") && (i === 0 || argumentosComoTexto[i-1] !== '\\')) {
            if (!dentroDeComillas) { dentroDeComillas = true; tipoComillas = char; buffer += char; }
            else if (char === tipoComillas) { dentroDeComillas = false; buffer += char; }
            else { buffer += char; }
        } else if (char === ',' && !dentroDeComillas) { listaExpresiones.push(buffer.trim()); buffer = ""; }
        else { buffer += char; }
    }
    if (buffer.trim() !== "") listaExpresiones.push(buffer.trim());
    let salidaFinal = "";
    for (const exprTexto of listaExpresiones) {
        if (exprTexto === "") continue;
        const valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprTexto, ambitoActual, numeroLinea);
        if (typeof valorEvaluado === 'boolean') salidaFinal += valorEvaluado ? "Verdadero" : "Falso";
        else salidaFinal += String(valorEvaluado);
    }
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(salidaFinal, 'normal');
    return true;
};

Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
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

Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
    const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)\s*(.+)\s*$/;
    const coincidencia = lineaCompleta.match(regexAsignacion);
    if (!coincidencia) throw new Error("Sintaxis asignación incorrecta L"+numeroLinea);
    const destinoTexto = coincidencia[1].trim();
    const expresionTextoCruda = coincidencia[2];
    const expresionAEvaluar = limpiarComentariosYEspaciosInternos(expresionTextoCruda);
    if (expresionAEvaluar === "") throw new Error(`Expresión vacía L${numeroLinea}.`);
    const valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(expresionAEvaluar, ambitoEjecucion, numeroLinea);
    const accArrMatch = destinoTexto.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);
    if (accArrMatch) {
        // Lógica para asignación a arreglos (se implementará en Fase Arreglos)
        throw new Error(`Fase ${Webgoritmo.estadoApp.faseActual}: Asignación a elementos de arreglo ('${destinoTexto}') aún no completamente implementada.`);
    } else {
        const varNomLc = destinoTexto.toLowerCase();
        if (!ambitoEjecucion.hasOwnProperty(varNomLc)) throw new Error(`Var '${destinoTexto}' no def L${numeroLinea}.`);
        const descVar = ambitoEjecucion[varNomLc];
        if (descVar.esArreglo) throw new Error(`Asignar a arreglo completo no permitido L${numeroLinea}.`);
        try {
            descVar.valor = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valorEvaluado, descVar.tipoDeclarado, numeroLinea);
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Var '${descVar.nombreOriginal}' <- ${descVar.valor}`, 'debug');
        } catch (e) { throw e; }
    }
    return true;
};

Webgoritmo.Interprete.procesarEntradaUsuario = async function(lineaCompleta, ambitoEjecucion, numeroLinea) { /* ... (como en Fase 3) ... */ };

Webgoritmo.Interprete.procesarSiEntoncesSino = async function(lineaSiOriginal, ambitoEjecucion, numeroLineaSi, lineasDelBloquePadre, indiceSiEnPadre) {
    const regexSi = /si\s+(.+?)\s+entonces/i;
    const coincidenciaSi = lineaSiOriginal.match(regexSi);
    if (!coincidenciaSi || !coincidenciaSi[1]) throw new Error(`Sintaxis incorrecta para 'Si' en línea ${numeroLineaSi}.`);
    const expresionCondicion = limpiarComentariosYEspaciosInternos(coincidenciaSi[1]);
    if (expresionCondicion === "") throw new Error(`Condición vacía para 'Si' en línea ${numeroLineaSi}.`);
    let valorCondicion;
    try {
        valorCondicion = await Webgoritmo.Expresiones.evaluarExpresion(expresionCondicion, ambitoEjecucion, numeroLineaSi);
    } catch (e) { throw new Error(`Error evaluando condición del 'Si' ("${expresionCondicion}") en línea ${numeroLineaSi}: ${e.message}`); }
    if (typeof valorCondicion !== 'boolean') throw new Error(`La condición del 'Si' ("${expresionCondicion}") en línea ${numeroLineaSi} debe ser lógica, se obtuvo: ${valorCondicion} (tipo: ${typeof valorCondicion}).`);
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Condición Si (${expresionCondicion}) evaluada a: ${valorCondicion ? "Verdadero" : "Falso"}`, 'debug');
    let bloqueEntonces = []; let bloqueSino = []; let bufferActual = bloqueEntonces;
    let nivelAnidamientoSi = 0; let indiceActual = indiceSiEnPadre + 1;
    let encontradoSinoParaEsteSi = false; let encontradoFinSiParaEsteSi = false;
    while (indiceActual < lineasDelBloquePadre.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return indiceActual;
        const lineaIteracionOriginal = lineasDelBloquePadre[indiceActual];
        const lineaIteracionProcesada = limpiarComentariosYEspacios(lineaIteracionOriginal);
        const lineaIteracionMinusculas = lineaIteracionProcesada.toLowerCase();
        if (lineaIteracionMinusculas.startsWith("si") && lineaIteracionMinusculas.includes("entonces")) { nivelAnidamientoSi++; bufferActual.push(lineaIteracionOriginal); }
        else if (lineaIteracionMinusculas === "sino") { if (nivelAnidamientoSi === 0) { if (encontradoSinoParaEsteSi) throw new Error(`Múltiples 'Sino' para el 'Si' de L${numeroLineaSi}.`); bufferActual = bloqueSino; encontradoSinoParaEsteSi = true; } else { bufferActual.push(lineaIteracionOriginal); } }
        else if (lineaIteracionMinusculas === "finsi") { if (nivelAnidamientoSi === 0) { encontradoFinSiParaEsteSi = true; indiceActual++; break; } else { nivelAnidamientoSi--; bufferActual.push(lineaIteracionOriginal); } }
        else { bufferActual.push(lineaIteracionOriginal); }
        indiceActual++;
    }
    if (!encontradoFinSiParaEsteSi) throw new Error(`Se esperaba 'FinSi' para 'Si' en L${numeroLineaSi}.`);
    const offsetLineasEntonces = numeroLineaSi;
    const offsetLineasSino = numeroLineaSi + bloqueEntonces.length + (encontradoSinoParaEsteSi ? 1 : 0) + indiceSiEnPadre +1 - numeroLineaOffset; // Ajuste más complejo necesario aquí para el número de línea real del Sino.
                                                                                                                                        // Por ahora, simplificamos el offset para la llamada recursiva. El número de línea global en log será más preciso.
    if (valorCondicion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Ejecutando bloque Entonces.`, 'debug');
        await Webgoritmo.Interprete.ejecutarBloqueCodigo(bloqueEntonces, ambitoEjecucion, numeroLineaSi); // Offset es la línea del Si
    } else {
        if (bloqueSino.length > 0) {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Condición falsa. Ejecutando bloque Sino.`, 'debug');
            // El offset para el bloque Sino debería ser la línea donde se encontró el Sino.
            // El cálculo del offset para el bloque sino es complejo; por ahora, usar una aproximación o la línea del Si.
            // Para los logs internos de ejecutarBloqueCodigo, el numeroLineaOffset que se pasa a la llamada recursiva
            // es el importante para que los errores DENTRO del bloque se reporten con el número de línea correcto del editor.
            // El numeroLineaOffset que recibe esta instancia de ejecutarBloqueCodigo (el padre) es numeroLineaOffset (param).
            // El Si está en indiceSiEnPadre dentro de lineasDelBloquePadre.
            // El Sino está algunas líneas después. El offset para las líneas DENTRO del sino sería:
            // numeroLineaOffset (del padre) + (indiceSiEnPadre + bloqueEntonces.length + 1)
             await Webgoritmo.Interprete.ejecutarBloqueCodigo(bloqueSino, ambitoEjecucion, (numeroLineaOffset + indiceSiEnPadre + bloqueEntonces.length + 1) );
        } else {
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLineaSi}: Condición falsa. No hay bloque Sino.`, 'debug');
        }
    }
    return indiceActual - 1;
};

// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida || !Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo || !Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Expresiones.evaluarExpresion) {
        console.error("Error: Módulos esenciales no están listos para ejecutarAlgoritmoPrincipal.");
        if(Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Error crítico: Módulos faltantes.", "error");
        return;
    }
    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Fase 5 Si-Entonces-Sino Intento 2) ---", "normal");
    Webgoritmo.estadoApp.variablesGlobales = {}; Webgoritmo.estadoApp.funcionesDefinidas = {};
    Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.variablesDestinoEntrada = [];
    Webgoritmo.estadoApp.nombresOriginalesParaPrompt = []; Webgoritmo.estadoApp.promesaEntradaPendiente = null;
    Webgoritmo.estadoApp.resolverPromesaEntrada = null; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];
    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = 0; // 0-indexed para offset
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
    else if (lineasAlgoritmoPrincipal.length > 0) await Webgoritmo.Interprete.ejecutarBloqueCodigo(lineasAlgoritmoPrincipal, Webgoritmo.estadoApp.variablesGlobales, numeroLineaInicioBloque + 1); // Pasar offset 1-indexed
    else if (numeroLineaInicioBloque !== -1) Webgoritmo.UI.añadirSalida("Advertencia: Bloque principal vacío.", "warning");

    if (!Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
    else if (Webgoritmo.estadoApp.errorEnEjecucion && !Webgoritmo.estadoApp.esperandoEntradaUsuario) Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`ejecutarBloqueCodigo (F5 Si) procesando ${lineasDelBloque.length} líneas. Offset: ${numeroLineaOffset}`, 'debug');
    let i = 0;
    while (i < lineasDelBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;
        const lineaOriginalFuente = lineasDelBloque[i];
        const numeroLineaActualGlobal = numeroLineaOffset + i; // Este es el número de línea real en el editor
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
                const indiceUltimaLineaDelSi = await Webgoritmo.Interprete.procesarSiEntoncesSino(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal, lineasDelBloque, i);
                // i se actualiza para que el bucle continúe DESPUÉS del FinSi.
                // procesarSiEntoncesSino devuelve el índice (relativo a lineasDelBloque) de la línea FinSi.
                // El bucle while hará i++, así que i debe ser el índice del FinSi para que la siguiente iteración sea la línea post-FinSi.
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

function limpiarComentariosYEspacios(linea) { if (typeof linea !== 'string') return ""; let l = linea; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
function limpiarComentariosYEspaciosInternos(texto) { if (typeof texto !== 'string') return ""; let l = texto; const i = l.indexOf('//'); if (i !== -1) l = l.substring(0, i); return l.trim(); }
Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo = function(tipo) { const t = String(tipo).toLowerCase(); switch(t){case 'entero':return 0;case 'real':return 0.0;case 'logico':return false;case 'caracter':return '';case 'cadena':return '';default:return null;}};
Webgoritmo.Interprete.Utilidades.crearDescriptorVariable = function(nom,tipoD,valIni){const tipoN=String(tipoD).toLowerCase();return{nombreOriginal:nom,tipoDeclarado:tipoN,valor:valIni,esArreglo:false,dimensiones:[]};};
Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor = function(v){if(typeof v==='number')return Number.isInteger(v)?'entero':'real';if(typeof v==='boolean')return 'logico';if(typeof v==='string')return 'cadena';return 'desconocido';};
Webgoritmo.Interprete.Utilidades.convertirValorParaTipo = function(val,tipoDest,numLn){const tipoDestN=String(tipoDest).toLowerCase();const tipoOriN=Webgoritmo.Interprete.Utilidades.inferirTipoDesdeValor(val);if(tipoOriN===tipoDestN)return val;if(tipoDestN==='real'&&tipoOriN==='entero')return parseFloat(val);if(tipoDestN==='cadena')return String(val);if(tipoDestN==='entero'){if(tipoOriN==='real')return Math.trunc(val);if(tipoOriN==='cadena'){const n=parseInt(val,10);if(!isNaN(n)&&String(n)===String(val).trim())return n;}}if(tipoDestN==='real'){if(tipoOriN==='cadena'){const n=parseFloat(val);if(!isNaN(n)&&String(n)===String(val).trim().replace(/^0+([1-9])/,'$1').replace(/^0+\.0+$/,'0'))return n;}}if(tipoDestN==='logico'&&tipoOriN==='cadena'){const valL=String(val).trim().toLowerCase();if(valL==="verdadero"||valL==="v")return true;if(valL==="falso"||valL==="f")return false;}throw new Error(`L${numLn}: No se puede convertir '${val}' (${tipoOriN}) a '${tipoDestN}'.`);};
Webgoritmo.Interprete.Utilidades.obtenerValorRealVariable = function(nombreVariable, ambitoActual, numeroLinea) { const nombreVarLc = String(nombreVariable).toLowerCase(); if (!ambitoActual.hasOwnProperty(nombreVarLc)) { throw new Error(`Error en línea ${numeroLinea}: Variable '${nombreVariable}' no definida.`); } const descriptor = ambitoActual[nombreVarLc]; if (descriptor.esArreglo && !(Webgoritmo.Expresiones.permitirArregloComoOperando)) { throw new Error(`Error en línea ${numeroLinea}: El arreglo '${descriptor.nombreOriginal}' debe usarse con índices en esta expresión.`); } return descriptor.valor; }; // Añadido chequeo this.permitirArregloComoOperando (necesita definirse en Expresiones)
Webgoritmo.Interprete.procesarEntradaUsuario = async function(linea,ambito,numLn){ const matchLeer=linea.match(/^leer\s+(.+)/i); if(!matchLeer)throw new Error("Error interno Leer L"+numLn); const nomsOrigRaw=limpiarComentariosYEspaciosInternos(matchLeer[1]); const nomsPrompt=nomsOrigRaw.split(',').map(v=>v.trim()); const nomsDest=nomsPrompt.map(n=>n.toLowerCase()); if(nomsDest.length===0||nomsDest.some(v=>v===""))throw new Error("Leer sin vars L"+numLn); for(const nomLc of nomsDest){const nomP=nomsPrompt.find(n=>n.toLowerCase()===nomLc)||nomLc; if(!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nomLc))throw new Error(`Var '${nomP}' inválida L${numLn}.`); if(!ambito.hasOwnProperty(nomLc))throw new Error(`Var '${nomP}' no def L${numLn}.`); if(ambito[nomLc].esArreglo)throw new Error(`Leer arreglo completo no soportado L${numLn}.`);} let pMsg=nomsPrompt.length===1?`Ingrese valor para ${nomsPrompt[0]}:`:`Ingrese ${nomsPrompt.length} valores (separados por espacio/coma) para ${nomsPrompt.join(', ')}:`; if(window.WebgoritmoGlobal&&typeof window.WebgoritmoGlobal.solicitarEntradaUsuario==='function')window.WebgoritmoGlobal.solicitarEntradaUsuario(pMsg); else {console.error("solicitarEntradaUsuario no disponible");} Webgoritmo.estadoApp.esperandoEntradaUsuario=true; Webgoritmo.estadoApp.variablesDestinoEntrada=nomsDest; Webgoritmo.estadoApp.nombresOriginalesParaPrompt=nomsPrompt; Webgoritmo.estadoApp.promesaEntradaPendiente=new Promise(resolve=>{Webgoritmo.estadoApp.resolverPromesaEntrada=resolve; if(Webgoritmo.estadoApp.detenerEjecucion)resolve();}); await Webgoritmo.estadoApp.promesaEntradaPendiente; Webgoritmo.estadoApp.promesaEntradaPendiente=null; Webgoritmo.estadoApp.esperandoEntradaUsuario=false; if(Webgoritmo.estadoApp.detenerEjecucion&&Webgoritmo.estadoApp.errorEnEjecucion)throw new Error(Webgoritmo.estadoApp.errorEnEjecucion); return true;};

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (Fase 5 Si-Entonces-Sino - Intento 2) cargado.");
