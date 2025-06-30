// motorInterprete.js (Fase 2 Reconstrucción: Definir, Asignar Literales, Escribir Vars)

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {};

// --- NAMESPACE PARA UTILIDADES DEL INTÉRPRETE ---
Webgoritmo.Interprete.Utilidades = {
    /**
     * Obtiene el valor por defecto para un tipo de dato PSeInt.
     * @param {string} tipoTexto - El tipo de dato ('entero', 'real', 'cadena', 'logico', 'caracter').
     * @returns {number|string|boolean} El valor por defecto.
     */
    obtenerValorPorDefectoSegunTipo: function(tipoTexto) {
        const tipoNormalizado = String(tipoTexto).toLowerCase();
        switch (tipoNormalizado) {
            case 'entero': return 0;
            case 'real': return 0.0;
            case 'logico': return false;
            case 'caracter': return '';
            case 'cadena': return '';
            default:
                console.warn(`Tipo '${tipoTexto}' no reconocido en obtenerValorPorDefectoSegunTipo. Usando null.`);
                return null;
        }
    },

    /**
     * Crea un objeto descriptor para una variable.
     * @param {string} nombreOriginal - El nombre original de la variable.
     * @param {string} tipoDeclarado - El tipo de dato declarado para la variable.
     * @param {*} valorInicial - El valor inicial para la variable.
     * @returns {object} El objeto descriptor de la variable.
     */
    crearDescriptorVariable: function(nombreOriginal, tipoDeclarado, valorInicial) {
        const tipoNormalizado = String(tipoDeclarado).toLowerCase();
        return {
            nombreOriginal: nombreOriginal,
            tipoDeclarado: tipoNormalizado, // ej. 'entero', 'cadena'
            valor: valorInicial,
            // 'esArreglo' y 'dimensiones' se añadirán cuando implementemos arreglos
            // 'esPorReferencia' para parámetros de subprocesos
        };
    },

    /**
     * Infiere el tipo de dato PSeInt a partir de un valor JavaScript.
     * @param {*} valor - El valor JavaScript.
     * @returns {string} El tipo PSeInt inferido ('entero', 'real', 'cadena', 'logico', 'desconocido').
     */
    inferirTipoDesdeValor: function(valor) {
        if (typeof valor === 'number') {
            return Number.isInteger(valor) ? 'entero' : 'real';
        }
        if (typeof valor === 'boolean') {
            return 'logico';
        }
        if (typeof valor === 'string') {
            return 'cadena'; // Podría ser 'caracter' si se quisiera más granularidad
        }
        return 'desconocido';
    },

    /**
     * Convierte un texto que representa un literal a su valor JavaScript correspondiente.
     * No evalúa expresiones, solo literales directos.
     * @param {string} textoLiteral - La representación en cadena del literal.
     * @returns {*} El valor JavaScript.
     * @throws {Error} Si el literal no es reconocible.
     */
    convertirTextoLiteralASuValor: function(textoLiteral) {
        const textoTrim = textoLiteral.trim();
        // Booleano
        if (textoTrim.toLowerCase() === "verdadero") return true;
        if (textoTrim.toLowerCase() === "falso") return false;
        // Cadena
        if ((textoTrim.startsWith('"') && textoTrim.endsWith('"')) || (textoTrim.startsWith("'") && textoTrim.endsWith("'"))) {
            return textoTrim.substring(1, textoTrim.length - 1);
        }
        // Número (Entero o Real)
        // Regex mejorada para números, incluyendo negativos y decimales.
        if (/^-?\d+(?:\.\d+)?$/.test(textoTrim) || /^-?\.\d+$/.test(textoTrim)) {
            const num = Number(textoTrim);
            if (!isNaN(num)) return num; // Number() maneja la conversión a entero o real
        }
        throw new Error(`Literal '${textoLiteral}' no reconocido o no soportado en esta fase.`);
    },

    /**
     * Intenta convertir un valor a un tipo destino específico.
     * @param {*} valor - El valor a convertir.
     * @param {string} tipoDestino - El tipo PSeInt al que se desea convertir ('entero', 'real', 'cadena', 'logico').
     * @param {number} numeroLinea - Para mensajes de error.
     * @returns {*} El valor convertido.
     * @throws {Error} Si la conversión no es posible o no está definida.
     */
    convertirValorParaTipo: function(valor, tipoDestino, numeroLinea) {
        const tipoDestNormalizado = String(tipoDestino).toLowerCase();
        const tipoOrigenNormalizado = this.inferirTipoDesdeValor(valor);

        if (tipoOrigenNormalizado === tipoDestNormalizado) return valor;

        // Conversiones permitidas
        if (tipoDestNormalizado === 'real' && tipoOrigenNormalizado === 'entero') return parseFloat(valor);
        if (tipoDestNormalizado === 'cadena') return String(valor); // Casi todo se puede convertir a cadena

        if (tipoDestNormalizado === 'entero') {
            if (tipoOrigenNormalizado === 'real') return Math.trunc(valor);
            if (tipoOrigenNormalizado === 'cadena') {
                const num = parseInt(valor, 10);
                if (!isNaN(num) && String(num) === valor.trim()) return num; // Asegurar que toda la cadena fue un entero
            }
        }
        if (tipoDestNormalizado === 'real') {
            if (tipoOrigenNormalizado === 'cadena') {
                const num = parseFloat(valor);
                if (!isNaN(num) && String(num) === valor.trim()) return num; // Asegurar que toda la cadena fue un real
            }
        }
        // TODO: Más conversiones (ej. cadena a logico si es "Verdadero"/"Falso")

        throw new Error(`Error en línea ${numeroLinea}: No se puede convertir el valor '${valor}' (tipo ${tipoOrigenNormalizado}) al tipo '${tipoDestNormalizado}'.`);
    }
};

// --- FUNCIONES DE PROCESAMIENTO DE INSTRUCCIONES ---

/**
 * Procesa la instrucción Escribir (Fase 1: solo literales de cadena, Fase 2: variables simples).
 * @param {string} lineaCompleta - La línea completa de la instrucción Escribir.
 * @param {object} ambitoActual - El ámbito de variables actual.
 * @param {number} numeroLinea - El número de línea original.
 */
Webgoritmo.Interprete.procesarSalidaConsola = async function(lineaCompleta, ambitoActual, numeroLinea) {
    const regexEscribir = /^(?:escribir|imprimir|mostrar)\s+(.*)/i;
    const coincidencia = lineaCompleta.match(regexEscribir);
    if (!coincidencia || !coincidencia[1]) {
        throw new Error("Instrucción Escribir mal formada.");
    }

    const argumentosComoTexto = limpiarComentariosYEspaciosInternos(coincidencia[1]);
    const listaExpresiones = [];
    let buffer = "";
    let dentroDeComillas = false;
    let tipoComillas = '';

    for (let i = 0; i < argumentosComoTexto.length; i++) {
        const char = argumentosComoTexto[i];
        if ((char === '"' || char === "'") && (i === 0 || argumentosComoTexto[i-1] !== '\\')) {
            if (!dentroDeComillas) { dentroDeComillas = true; tipoComillas = char; buffer += char; }
            else if (char === tipoComillas) { dentroDeComillas = false; buffer += char; }
            else { buffer += char; }
        } else if (char === ',' && !dentroDeComillas) {
            listaExpresiones.push(buffer.trim()); buffer = "";
        } else { buffer += char; }
    }
    if (buffer.trim() !== "") listaExpresiones.push(buffer.trim());

    let salidaFinal = "";
    for (const exprTexto of listaExpresiones) {
        if (exprTexto.startsWith('"') && exprTexto.endsWith('"') || exprTexto.startsWith("'") && exprTexto.endsWith("'")) {
            salidaFinal += exprTexto.substring(1, exprTexto.length - 1);
        } else { // Asumir que es un nombre de variable (Fase 2)
            const nombreVarLc = exprTexto.toLowerCase(); // PSeInt no es sensible a may/min en nombres de var
            if (ambitoActual.hasOwnProperty(nombreVarLc)) {
                const descriptorVar = ambitoActual[nombreVarLc];
                // Para booleanos, PSeInt muestra "Verdadero" o "Falso"
                if (descriptorVar.tipoDeclarado === 'logico') {
                    salidaFinal += descriptorVar.valor ? "Verdadero" : "Falso";
                } else {
                    salidaFinal += String(descriptorVar.valor);
                }
            } else {
                // En Fase 1, esto sería un error si no es literal.
                // En Fase 2, si no se encuentra la variable, es un error.
                throw new Error(`Variable '${exprTexto}' no definida.`);
            }
        }
    }
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(salidaFinal, 'normal');
    return true;
};

/**
 * Procesa la instrucción Definir (Fase 2).
 * @param {string} lineaCompleta - La línea completa de la instrucción Definir.
 * @param {object} ambitoEjecucion - El ámbito donde se definirán las variables.
 * @param {number} numeroLinea - El número de línea original.
 */
Webgoritmo.Interprete.procesarDefinicion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
    const regexDefinir = /definir\s+(.+?)\s+como\s+(entero|real|logico|caracter|cadena)/i;
    const coincidencia = lineaCompleta.match(regexDefinir);

    if (!coincidencia || coincidencia.length < 3) {
        throw new Error("Sintaxis incorrecta para 'Definir'. Formato: Definir <variable(s)> Como <tipo>");
    }

    const nombresVariables = coincidencia[1].split(',').map(nombre => nombre.trim());
    const tipoVariable = coincidencia[2].toLowerCase();

    for (const nombreVar of nombresVariables) {
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVar)) {
            throw new Error(`Nombre de variable inválido: '${nombreVar}'.`);
        }
        const nombreVarLc = nombreVar.toLowerCase();
        if (ambitoEjecucion.hasOwnProperty(nombreVarLc)) {
            // PSeInt flexible permite redefinir, pero podríamos advertir.
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Advertencia en línea ${numeroLinea}: Variable '${nombreVar}' ya estaba definida. Se redefinirá.`, 'warning');
        }
        const valorPorDefecto = Webgoritmo.Interprete.Utilidades.obtenerValorPorDefectoSegunTipo(tipoVariable);
        ambitoEjecucion[nombreVarLc] = Webgoritmo.Interprete.Utilidades.crearDescriptorVariable(nombreVar, tipoVariable, valorPorDefecto);
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Variable '${nombreVar}' definida como ${tipoVariable}.`, 'debug');
    }
    return true;
};

/**
 * Procesa una instrucción de asignación (Fase 2: solo literales).
 * @param {string} lineaCompleta - La línea completa de la instrucción de asignación.
 * @param {object} ambitoEjecucion - El ámbito donde se encuentra la variable.
 * @param {number} numeroLinea - El número de línea original.
 */
Webgoritmo.Interprete.procesarAsignacion = async function(lineaCompleta, ambitoEjecucion, numeroLinea) {
    const regexAsignacion = /^\s*([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*(.+)\s*$/;
    const coincidencia = lineaCompleta.match(regexAsignacion);

    if (!coincidencia) {
        throw new Error("Sintaxis de asignación incorrecta.");
    }

    const nombreVariableDestino = coincidencia[1];
    const nombreVarDestinoLc = nombreVariableDestino.toLowerCase();
    const expresionValorComoTexto = limpiarComentariosYEspaciosInternos(coincidencia[2]);

    if (!ambitoEjecucion.hasOwnProperty(nombreVarDestinoLc)) {
        throw new Error(`Variable '${nombreVariableDestino}' no ha sido definida antes de asignarle un valor.`);
    }

    const descriptorVariable = ambitoEjecucion[nombreVarDestinoLc];

    // Fase 2: Solo se evalúan literales directos.
    let valorLiteral;
    try {
        // Usar la función de Webgoritmo.Expresiones (que haremos en el siguiente paso para evaluadorExpresiones.js)
        valorLiteral = await Webgoritmo.Expresiones.evaluarLiteral(expresionValorComoTexto);
    } catch (e) {
        throw new Error(`Error al interpretar el valor literal '${expresionValorComoTexto}' para la asignación: ${e.message}`);
    }

    // Convertir y asignar
    try {
        descriptorVariable.valor = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(valorLiteral, descriptorVariable.tipoDeclarado, numeroLinea);
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`L${numeroLinea}: Variable '${descriptorVariable.nombreOriginal}' <- ${descriptorVariable.valor}`, 'debug');
    } catch (e) {
        throw e; // Re-lanzar error de conversión
    }
    return true;
};


// --- FUNCIONES PRINCIPALES DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal = async function() {
    // ... (lógica de inicialización y obtención de bloque principal como en Fase 1) ...
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) { console.error("Error: Webgoritmo.UI.añadirSalida no está disponible."); return; }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { Webgoritmo.UI.añadirSalida("Error: El editor de código no está listo.", "error"); return; }
    if (!Webgoritmo.estadoApp) { Webgoritmo.UI.añadirSalida("Error: El estado de la aplicación (estadoApp) no está listo.", "error"); return;}
    if (!Webgoritmo.Expresiones) { Webgoritmo.UI.añadirSalida("Error: El evaluador de expresiones no está listo (Fase 2).", "error"); return; }


    if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Fase 2: Definir/Asignar/Escribir) ---", "normal");

    Webgoritmo.estadoApp.variablesGlobales = {};
    Webgoritmo.estadoApp.funcionesDefinidas = {};
    Webgoritmo.estadoApp.detenerEjecucion = false; Webgoritmo.estadoApp.errorEnEjecucion = null;
    Webgoritmo.estadoApp.esperandoEntradaUsuario = false; Webgoritmo.estadoApp.pilaLlamadasSubprocesos = [];

    const todasLasLineas = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    let lineasAlgoritmoPrincipal = []; let dentroBloquePrincipal = false; let numeroLineaInicioBloque = -1;

    for (let i = 0; i < todasLasLineas.length; i++) {
        const lineaActualOriginal = todasLasLineas[i]; // Mantener original para el bloque
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

    if (!Webgoritmo.estadoApp.errorEnEjecucion) Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Fase 2) ---", "normal");
    else Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase 2) ---", "error");
};

Webgoritmo.Interprete.ejecutarBloqueCodigo = async function(lineasDelBloque, ambitoEjecucion, numeroLineaOffset) {
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
            } else if (lineaMinusculas.startsWith("definir ")) { // Fase 2
                instruccionManejada = await Webgoritmo.Interprete.procesarDefinicion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            } else if (lineaProcesada.match(/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*\s*(?:<-|=)/)) { // Fase 2 - Asignación simple
                instruccionManejada = await Webgoritmo.Interprete.procesarAsignacion(lineaProcesada, ambitoEjecucion, numeroLineaActualGlobal);
            }
            // ... más instrucciones en el futuro ...
            if (!instruccionManejada && lineaProcesada) {
                const primeraPalabra = lineaMinusculas.split(" ")[0];
                const palabrasClaveBloques = ["algoritmo","proceso","finalgoritmo","finproceso"]; // Expandir con más
                if (!palabrasClaveBloques.includes(primeraPalabra)) throw new Error(`Instrucción no reconocida: '${lineaProcesada}'`);
            }
        } catch (error) {
            Webgoritmo.estadoApp.errorEnEjecucion = error.message.startsWith(`Error en línea ${numeroLineaActualGlobal}`) ? error.message : `Error en línea ${numeroLineaActualGlobal}: ${error.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, "error");
            break;
        }
    }
    Webgoritmo.estadoApp.lineaEnEjecucion = null;
};

function limpiarComentariosYEspacios(linea) {
    if (typeof linea !== 'string') return "";
    let lineaLimpia = linea; const idxComentario = lineaLimpia.indexOf('//');
    if (idxComentario !== -1) lineaLimpia = lineaLimpia.substring(0, idxComentario);
    return lineaLimpia.trim();
}
// Función interna para limpiar comentarios ANTES de splitear argumentos de Escribir, etc.
function limpiarComentariosYEspaciosInternos(texto) {
    if (typeof texto !== 'string') return "";
    let limpio = texto; const idxComentario = limpio.indexOf('//');
    if (idxComentario !== -1) limpio = limpio.substring(0, idxComentario);
    return limpio.trim(); // Trim final después de quitar comentario
}

Webgoritmo.Interprete.ejecutarPseudocodigo = Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal;
console.log("motorInterprete.js (Fase 2 Reconstrucción) cargado.");
