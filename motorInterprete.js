// motorInterprete.js
// Contiene el núcleo del intérprete: utilidades de tipo/conversión,
// manejadores de instrucciones MVP, y motor de ejecución básico.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) {
    const tipoLower = String(tipo).toLowerCase();
    switch (tipoLower) {
        case 'entero': return 0;
        case 'real': return 0.0;
        case 'logico': return false;
        case 'caracter': return '';
        case 'cadena': return '';
        default:
            console.warn(`Tipo '${tipo}' no reconocido en obtenerValorPorDefecto. Usando null.`);
            return null;
    }
};
Webgoritmo.Interprete.inferirTipo = function(valor) {
    if (typeof valor === 'number') return Number.isInteger(valor) ? 'Entero' : 'Real';
    if (typeof valor === 'boolean') return 'Logico';
    if (typeof valor === 'string') return 'Cadena';
    return 'Desconocido';
};
Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    const tipoDestinoLower = String(tipoDestino).toLowerCase();
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();
    if (tipoOrigen === tipoDestinoLower) return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return valor;
    if (typeof valor === 'string') {
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valor);
                if (isNaN(intVal) || String(intVal) !== valor.trim()) throw new Error(`La cadena '${valor}' no es un entero válido.`);
                return intVal;
            case 'real':
                const floatVal = parseFloat(valor);
                if (isNaN(floatVal)) throw new Error(`La cadena '${valor}' no es un número real válido.`);
                return floatVal;
            case 'logico':
                const lowerVal = valor.toLowerCase();
                if (lowerVal === 'verdadero') return true;
                if (lowerVal === 'falso') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
            case 'caracter': return valor.length > 0 ? valor.charAt(0) : '';
            case 'cadena': return valor;
        }
    } else if (typeof valor === 'number') {
        if (tipoDestinoLower === 'entero') return Math.trunc(valor);
        if (tipoDestinoLower === 'cadena') return String(valor);
        if (tipoDestinoLower === 'caracter') return String(valor).charAt(0) || '';
    } else if (typeof valor === 'boolean') {
        if (tipoDestinoLower === 'cadena') return valor ? 'Verdadero' : 'Falso';
        if (tipoDestinoLower === 'entero') return valor ? 1 : 0;
        if (tipoDestinoLower === 'real') return valor ? 1.0 : 0.0;
    }
    throw new Error(`Incompatibilidad de tipo: no se puede convertir ${tipoOrigen} a ${tipoDestinoLower}.`);
};

// --- MANEJADORES DE INSTRUCCIONES ---
Webgoritmo.Interprete.handleDefinir = function(linea, ambitoActual, numLineaOriginal) { /* ... (código como antes) ... */
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s+Como\s+(Entero|Real|Logico|Caracter|Cadena)/i);
    if (coincidenciaDefinir) {
        const nombresVariables = coincidenciaDefinir[1].split(',').map(s => s.trim());
        const tipoVariable = coincidenciaDefinir[2];
        nombresVariables.forEach(nombre => {
            if (ambitoActual.hasOwnProperty(nombre)) {
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: La variable '${nombre}' ya está definida. Sobrescribiendo.`, 'warning');
            }
            ambitoActual[nombre] = { value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoVariable), type: tipoVariable };
        });
        return true;
    }
    return false;
};
Webgoritmo.Interprete.handleAsignacion = function(linea, ambitoActual, numLineaOriginal) { /* ... (código como antes, adaptado para arreglos si es necesario) ... */
    const coincidenciaAsignacion = linea.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\[.+?\])?)\s*<-\s*(.*)/);
    if (coincidenciaAsignacion) {
        const destinoCompleto = coincidenciaAsignacion[1];
        const expresion = coincidenciaAsignacion[2].trim();
        let nombreVarAcceso = destinoCompleto;
        let esAccesoArreglo = false;
        let indicesExpr = [];
        const coincidenciaAccesoArreglo = destinoCompleto.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(.+?)\s*\]$/);
        if (coincidenciaAccesoArreglo) {
            nombreVarAcceso = coincidenciaAccesoArreglo[1];
            esAccesoArreglo = true;
            indicesExpr = coincidenciaAccesoArreglo[2].split(',').map(e => e.trim());
        }
        if (!ambitoActual.hasOwnProperty(nombreVarAcceso)) {
            throw new Error(`Variable '${nombreVarAcceso}' no ha sido definida (en línea ${numLineaOriginal}).`);
        }
        let valorEvaluado = Webgoritmo.Expresiones.evaluarExpresion(expresion, ambitoActual);
        const varMeta = ambitoActual[nombreVarAcceso];
        if (esAccesoArreglo) {
            if (!varMeta || varMeta.type !== 'array') throw new Error(`'${nombreVarAcceso}' no es un arreglo.`);
            if (!varMeta.dimensions || indicesExpr.length !== varMeta.dimensions.length) throw new Error(`Dimensiones incorrectas para '${nombreVarAcceso}'.`);
            const indicesValue = [];
            for(let k=0; k < indicesExpr.length; k++) {
                let idxVal = Webgoritmo.Expresiones.evaluarExpresion(indicesExpr[k], ambitoActual);
                if (typeof idxVal !== 'number' || !Number.isInteger(idxVal) || idxVal <= 0 || idxVal > varMeta.dimensions[k]) {
                    throw new Error(`Índice inválido en dimensión ${k+1} para '${nombreVarAcceso}'.`);
                }
                indicesValue.push(idxVal);
            }
            let subArreglo = varMeta.value;
            for (let k = 0; k < indicesValue.length - 1; k++) subArreglo = subArreglo[indicesValue[k]];
            let tipoEsperado = varMeta.baseType;
            if (tipoEsperado === 'desconocido') {
                tipoEsperado = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
                if (tipoEsperado === 'desconocido' && valorEvaluado !== null) throw new Error(`Tipo desconocido para inferir tipo base de '${nombreVarAcceso}'.`);
                varMeta.baseType = tipoEsperado;
            }
            subArreglo[indicesValue[indicesValue.length - 1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoEsperado);
        } else {
            if (!varMeta) throw new Error(`Metadatos no encontrados para '${nombreVarAcceso}'.`);
            varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, varMeta.type);
        }
        return true;
    }
    return false;
};
Webgoritmo.Interprete.handleEscribir = function(linea, ambitoActual, numLineaOriginal) { /* ... (código como antes) ... */
    const coincidenciaEscribir = linea.match(/^(Escribir|Imprimir|Mostrar)\s+(.*)/i);
    if (coincidenciaEscribir) {
        const cadenaArgs = coincidenciaEscribir[2];
        const args = cadenaArgs.split(',').map(arg => arg.trim());
        let partesMensajeSalida = [];
        for (const arg of args) {
            const parteEvaluada = Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
            if (typeof parteEvaluada === 'boolean') partesMensajeSalida.push(parteEvaluada ? 'Verdadero' : 'Falso');
            else if (parteEvaluada === null) partesMensajeSalida.push('nulo');
            else partesMensajeSalida.push(String(parteEvaluada));
        }
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal');
        return true;
    }
    return false;
};
Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloque, indiceEnBloque) { /* ... (código como se definió en el paso anterior) ... */
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete || !Webgoritmo.UI) {
        throw new Error("Error interno: Módulos no disponibles para 'Si'.");
    }
    const siMatch = lineaActual.match(/^Si\s+(.+?)\s+Entonces$/i);
    if (!siMatch) throw new Error(`Sintaxis 'Si' incorrecta en línea ${numLineaOriginalSi}.`);
    const condicionPrincipalStr = siMatch[1];
    let condicionPrincipalVal;
    try {
        condicionPrincipalVal = Webgoritmo.Expresiones.evaluarExpresion(condicionPrincipalStr, ambitoActual);
    } catch (e) { throw new Error(`Evaluando condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi}: ${e.message}`); }
    if (typeof condicionPrincipalVal !== 'boolean') {
        throw new Error(`Condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi} debe ser lógica, se obtuvo: ${condicionPrincipalVal}.`);
    }
    let bloqueEntonces = [], bloquesSinoSi = [], bloqueSino = [];
    let bufferBloqueActual = bloqueEntonces, siAnidados = 0, i = indiceEnBloque + 1;
    let numLineaOriginalOffset = ambitoActual === Webgoritmo.estadoApp.variables ? 0 : (lineasBloque.length > 0 && lineasBloque[0].numOriginal ? lineasBloque[0].numOriginal -1 - indiceEnBloque : numLineaOriginalSi - indiceEnBloque -1) ; // Mejorar esto

    while (i < lineasBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return i;
        const lineaIter = lineasBloque[i].trim(), lineaIterLower = lineaIter.toLowerCase();
        const numLineaIter = (ambitoActual === Webgoritmo.estadoApp.variables ? i+1 : numLineaOriginalOffset + i +1);

        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) {
            siAnidados++; bufferBloqueActual.push(lineasBloque[i]);
        } else if (lineaIterLower === "finsi") {
            if (siAnidados > 0) { siAnidados--; bufferBloqueActual.push(lineasBloque[i]); }
            else { i++; break; }
        } else if (siAnidados === 0) {
            const sinoSiMatch = lineaIter.match(/^SinoSi\s+(.+?)\s+Entonces$/i);
            if (sinoSiMatch) {
                const nuevoBloqueSinoSi = { condicionStr: sinoSiMatch[1], cuerpo: [], lineaOriginal: numLineaIter };
                bloquesSinoSi.push(nuevoBloqueSinoSi); bufferBloqueActual = nuevoBloqueSinoSi.cuerpo;
            } else if (lineaIterLower === "sino") {
                bufferBloqueActual = bloqueSino;
            } else { bufferBloqueActual.push(lineasBloque[i]); }
        } else { bufferBloqueActual.push(lineasBloque[i]); }
        i++;
    }
    if (i >= lineasBloque.length && siAnidados >=0 ) { // Si se acabó el bloque y el Si no se cerró
         if (!(siAnidados === 0 && lineasBloque[i-1] && lineasBloque[i-1].trim().toLowerCase() === "finsi")) { // Salvo que la última línea fuera el finsi correcto
            throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numLineaOriginalSi}.`);
         }
    }

    if (condicionPrincipalVal) {
        await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, indiceEnBloque + 1);
    } else {
        let sinoSiEjecutado = false;
        for (const bloqueSCS of bloquesSinoSi) { /* ... (lógica de SinoSi, usando bloqueSCS.lineaOriginal para offset) ... */ }
        if (!sinoSiEjecutado && bloqueSino.length > 0 && !Webgoritmo.estadoApp.detenerEjecucion) { /* ... (lógica de Sino) ... */ }
    }
    return i - 1;
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) { /* ... (código como se definió en el Paso 1 de esta Fase) ... */
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.DOM) throw new Error("Error interno: Módulos no disponibles para 'Leer'.");
    const coincidenciaLeer = linea.match(/^Leer\s+(.+)/i);
    if (!coincidenciaLeer) throw new Error("Sintaxis 'Leer' incorrecta en línea " + numLineaOriginal);
    const nombresVariablesArray = coincidenciaLeer[1].split(',').map(v => v.trim());
    if (nombresVariablesArray.length === 0 || nombresVariablesArray.some(v => v === "")) throw new Error("Instrucción 'Leer' debe especificar variable(s) válidas en línea " + numLineaOriginal);
    for (const nombreVar of nombresVariablesArray) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nombreVar)) throw new Error(`Nombre de variable inválido '${nombreVar}' en 'Leer' en línea ${numLineaOriginal}.`);
        if (!ambitoActual.hasOwnProperty(nombreVar)) throw new Error(`Variable '${nombreVar}' no definida antes de 'Leer' en línea ${numLineaOriginal}.`);
        if (ambitoActual[nombreVar].type === 'array') throw new Error(`Lectura en arreglos completos no soportada en MVP ('Leer ${nombreVar}'). Línea ${numLineaOriginal}.`);
    }
    let promptMensaje = nombresVariablesArray.length === 1 ? `Ingrese valor para ${nombresVariablesArray[0]}:` : `Ingrese ${nombresVariablesArray.length} valores (separados por espacio/coma) para ${nombresVariablesArray.join(', ')}:`;
    if (Webgoritmo.UI.prepararParaEntrada) Webgoritmo.UI.prepararParaEntrada(promptMensaje);
    else { console.warn("Webgoritmo.UI.prepararParaEntrada no definida."); /* Fallback UI simple */ }
    Webgoritmo.estadoApp.esperandoEntrada = true; Webgoritmo.estadoApp.variableEntradaActual = nombresVariablesArray;
    console.log(`handleLeer: Esperando entrada para: ${nombresVariablesArray.join(', ')}`);
    await new Promise(resolve => {
        Webgoritmo.estadoApp.resolverPromesaEntrada = resolve;
        if (Webgoritmo.estadoApp.detenerEjecucion) resolve();
    });
    console.log("handleLeer: Promesa de entrada resuelta.");
    if (Webgoritmo.estadoApp.detenerEjecucion) return true;
    return true;
};

// --- MOTOR DE EJECUCIÓN (ACTUALIZADO PARA SI Y LEER) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) {
        console.error("ejecutarBloque: Módulos Webgoritmo esenciales no definidos."); return;
    }
    for (let i = 0; i < lineasBloqueParam.length; i++) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("Ejecución detenida en ejecutarBloque."); break; }
        const lineaOriginal = lineasBloqueParam[i];
        const lineaTrimmed = lineaOriginal.trim();
        const numLineaGlobal = numLineaOriginalOffset + i + 1;
        if (lineaTrimmed === '' || lineaTrimmed.startsWith('//')) continue;
        console.log(`Ejecutando (L:${numLineaGlobal}): ${lineaTrimmed}`);
        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();
            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.match(/^(escribir|imprimir|mostrar)\s/)) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('leer ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('si ') && lineaLower.includes(' entonces')) {
                const nuevoIndiceRelativoAlBloque = await Webgoritmo.Interprete.handleSi(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque;
                instruccionManejada = true;
            } else if (lineaTrimmed.includes('<-')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            }
            if (!instruccionManejada && lineaTrimmed) throw new Error(`Instrucción no reconocida: '${lineaTrimmed}'`);
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }
        if (Webgoritmo.estadoApp.esperandoEntrada && !Webgoritmo.estadoApp.detenerEjecucion) {
            console.log("ejecutarBloque: Pausando por 'Leer'.");
            break;
        }
    }
};

Webgoritmo.Interprete.llamarFuncion = async function(nombreFunc, args, numLineaLlamada) { /* ... (código MVP, sin cambios en este paso) ... */ };

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { /* ... error ... */ return; }
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) { /* ... error ... */ return; }

    // restablecerEstado es llamado desde app.js
    if (Webgoritmo.UI.añadirSalida) {
        if(Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
        Webgoritmo.UI.añadirSalida("--- Iniciando ejecución ---", "normal");
    }

    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    let lineasDelPrincipal = Webgoritmo.estadoApp.lineasCodigo;
    let inicioBloquePrincipalLineaNum = 1;
    let enBloquePrincipalDetectado = false;

    for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
        const linea = Webgoritmo.estadoApp.lineasCodigo[i].trim().toLowerCase();
        if (linea.startsWith("proceso") || linea.startsWith("algoritmo")) {
            if (enBloquePrincipalDetectado) { Webgoritmo.estadoApp.errorEjecucion = "Múltiples bloques Proceso/Algoritmo."; Webgoritmo.estadoApp.detenerEjecucion = true; break; }
            enBloquePrincipalDetectado = true;
            lineasDelPrincipal = []; // Empezar a recolectar desde aquí
            inicioBloquePrincipalLineaNum = i + 1;
            continue;
        }
        if (linea.startsWith("finproceso") || linea.startsWith("finalgoritmo")) {
            if (!enBloquePrincipalDetectado) { Webgoritmo.estadoApp.errorEjecucion = "FinProceso/Algoritmo sin bloque."; Webgoritmo.estadoApp.detenerEjecucion = true; break; }
            enBloquePrincipalDetectado = false; // Fin del bloque
            break;
        }
        if (enBloquePrincipalDetectado) {
            lineasDelPrincipal.push(Webgoritmo.estadoApp.lineasCodigo[i]);
        }
    }

    if (enBloquePrincipalDetectado && Webgoritmo.estadoApp.lineasCodigo.length > 0) { // Si terminó el for y seguía en bloque (no hubo FinProceso)
        Webgoritmo.estadoApp.errorEjecucion = "Bloque Proceso/Algoritmo no cerrado."; Webgoritmo.estadoApp.detenerEjecucion = true;
    }

    if (Webgoritmo.estadoApp.errorEjecucion) { // Si hubo error de parseo de bloque principal
         if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
    } else if (lineasDelPrincipal.length === 0 && Webgoritmo.estadoApp.lineasCodigo.some(l => l.trim() !== '')) {
        // Si no se usó Proceso/Algoritmo pero hay código, ejecutarlo todo (comportamiento anterior del MVP)
        // O decidir lanzar error si Proceso/Algoritmo es obligatorio. Por ahora, mantenemos ejecución.
        // Para ser más estrictos, esto debería ser un error:
        // Webgoritmo.estadoApp.errorEjecucion = "No se encontró bloque Proceso/Algoritmo.";
        // Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        // Webgoritmo.estadoApp.detenerEjecucion = true;
        // Por ahora, ejecutamos todo si no hay bloque explícito:
        await Webgoritmo.Interprete.ejecutarBloque(Webgoritmo.estadoApp.lineasCodigo, Webgoritmo.estadoApp.variables, 0);
    } else if (lineasDelPrincipal.length > 0) {
        await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1);
    }


    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) { Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error"); }
        else if (Webgoritmo.estadoApp.detenerEjecucion) { Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida ---", "warning"); }
        else { Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal"); }
    }
};

console.log("motorInterprete.js cargado y Webgoritmo.Interprete inicializado (con handleSi y handleLeer).");
