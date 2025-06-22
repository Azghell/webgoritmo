// motorInterprete.js
// Contiene el núcleo del intérprete para el MVP: utilidades de tipo/conversión,
// manejadores de instrucciones MVP, y motor de ejecución básico.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE (MVP) ---
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
    if (typeof valor === 'number') {
        return Number.isInteger(valor) ? 'Entero' : 'Real';
    }
    if (typeof valor === 'boolean') {
        return 'Logico';
    }
    if (typeof valor === 'string') {
        return 'Cadena'; // Simplificado para MVP
    }
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
    throw new Error(`Incompatibilidad de tipo MVP: no se puede convertir ${tipoOrigen} a ${tipoDestinoLower}.`);
};

// --- MANEJADORES DE INSTRUCCIONES (MVP + Si) ---
Webgoritmo.Interprete.handleDefinir = function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s+Como\s+(Entero|Real|Logico|Caracter|Cadena)/i);
    if (coincidenciaDefinir) {
        const nombresVariables = coincidenciaDefinir[1].split(',').map(s => s.trim());
        const tipoVariable = coincidenciaDefinir[2];

        nombresVariables.forEach(nombre => {
            if (ambitoActual.hasOwnProperty(nombre)) {
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: La variable '${nombre}' ya está definida. Sobrescribiendo.`, 'warning');
            }
            ambitoActual[nombre] = {
                value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoVariable),
                type: tipoVariable
            };
        });
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleAsignacion = function(linea, ambitoActual, numLineaOriginal) {
    // Asume que Webgoritmo.Expresiones.evaluarExpresion está disponible
    const coincidenciaAsignacion = linea.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\[.+?\])?)\s*<-\s*(.*)/); // Adaptado para posible acceso a array
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

        const valorEvaluado = Webgoritmo.Expresiones.evaluarExpresion(expresion, ambitoActual);
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

        } else { // Variable simple
            if (!varMeta) throw new Error(`Metadatos no encontrados para '${nombreVarAcceso}'.`);
            let tipoDestino = varMeta.type;
            if (tipoDestino === 'desconocido') { // No debería pasar si Definir es obligatorio
                tipoDestino = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
                if (tipoDestino === 'desconocido' && valorEvaluado !== null) throw new Error(`Tipo desconocido para inferir tipo de '${nombreVarAcceso}'.`);
                varMeta.type = tipoDestino;
            }
            varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, varMeta.type);
        }
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleEscribir = function(linea, ambitoActual, numLineaOriginal) {
    // Asume que Webgoritmo.Expresiones.evaluarExpresion y Webgoritmo.UI.añadirSalida están disponibles
    const coincidenciaEscribir = linea.match(/^(Escribir|Imprimir|Mostrar)\s+(.*)/i);
    if (coincidenciaEscribir) {
        const cadenaArgs = coincidenciaEscribir[2];
        const args = cadenaArgs.split(',').map(arg => arg.trim()); // Simplificación MVP
        let partesMensajeSalida = [];
        for (const arg of args) {
            const parteEvaluada = Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
            if (typeof parteEvaluada === 'boolean') {
                partesMensajeSalida.push(parteEvaluada ? 'Verdadero' : 'Falso');
            } else if (parteEvaluada === null) {
                partesMensajeSalida.push('nulo');
            } else {
                partesMensajeSalida.push(String(parteEvaluada));
            }
        }
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal'); // Unir sin espacio
        }
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleSi = async function(lineaActual, ambitoActual, numLineaOriginalSi, lineasBloque, indiceEnBloque) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete || !Webgoritmo.UI) {
        console.error("handleSi: Módulos Webgoritmo esenciales no definidos.");
        throw new Error("Error interno del intérprete al procesar 'Si'.");
    }

    const siMatch = lineaActual.match(/^Si\s+(.+?)\s+Entonces$/i);
    if (!siMatch) {
        throw new Error("Error de sintaxis: 'Si' mal formado en línea " + numLineaOriginalSi);
    }

    const condicionPrincipalStr = siMatch[1];
    let condicionPrincipalVal;
    try {
        condicionPrincipalVal = Webgoritmo.Expresiones.evaluarExpresion(condicionPrincipalStr, ambitoActual);
    } catch (e) {
        throw new Error(`Error al evaluar la condición del 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi}: ${e.message}`);
    }

    if (typeof condicionPrincipalVal !== 'boolean') {
        throw new Error(`La condición del 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi} debe ser lógica, se obtuvo: ${condicionPrincipalVal}.`);
    }

    let bloqueEntonces = [];
    let bloquesSinoSi = [];
    let bloqueSino = [];

    let bufferBloqueActual = bloqueEntonces;
    let estadoParseo = 'entonces'; // 'entonces', 'sinosi_cond', 'sinosi_cuerpo', 'sino'
    let siAnidados = 0;
    let i = indiceEnBloque + 1;

    while (i < lineasBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return i;

        const lineaIter = lineasBloque[i].trim();
        const lineaIterLower = lineaIter.toLowerCase();
        const numLineaIter = numLineaOriginalOffset + i + 1; // numLineaOriginalOffset es del bloque padre

        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) {
            siAnidados++;
            bufferBloqueActual.push(lineasBloque[i]);
        } else if (lineaIterLower === "finsi") {
            if (siAnidados > 0) {
                siAnidados--;
                bufferBloqueActual.push(lineasBloque[i]);
            } else {
                i++; // Avanzar más allá del FinSi
                break;
            }
        } else if (siAnidados === 0) {
            const sinoSiMatch = lineaIter.match(/^SinoSi\s+(.+?)\s+Entonces$/i);
            if (sinoSiMatch) {
                estadoParseo = 'sinosi_cuerpo';
                const nuevoBloqueSinoSi = { condicionStr: sinoSiMatch[1], cuerpo: [], lineaOriginal: numLineaIter };
                bloquesSinoSi.push(nuevoBloqueSinoSi);
                bufferBloqueActual = nuevoBloqueSinoSi.cuerpo;
            } else if (lineaIterLower === "sino") {
                estadoParseo = 'sino';
                bufferBloqueActual = bloqueSino;
            } else {
                bufferBloqueActual.push(lineasBloque[i]);
            }
        } else {
            bufferBloqueActual.push(lineasBloque[i]);
        }
        i++;
    }

    if (i >= lineasBloque.length && siAnidados >= 0 && estadoParseo !== 'finsi_encontrado') {
        // Si se acaba el bloque y no se cerró el Si actual (siAnidados === 0 implica que el FinSi principal no se encontró)
        if (siAnidados === 0 && bufferBloqueActual !== null) {} // No hacer nada si el último bloque estaba siendo llenado
        else throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numLineaOriginalSi}.`);
    }

    let offsetLineaBloque = indiceEnBloque + 1; // Línea después del 'Si ... Entonces'

    if (condicionPrincipalVal) {
        await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, offsetLineaBloque);
    } else {
        let sinoSiEjecutado = false;
        for (const bloqueSCS of bloquesSinoSi) {
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
            offsetLineaBloque = bloqueSCS.lineaOriginal - numLineaOriginalOffset; // Ajustar offset para el bloque SinoSi
            let condicionSCSVal;
            try {
                condicionSCSVal = Webgoritmo.Expresiones.evaluarExpresion(bloqueSCS.condicionStr, ambitoActual);
            } catch (e) { throw new Error(`Error evaluando 'SinoSi' ("${bloqueSCS.condicionStr}") en línea ${bloqueSCS.lineaOriginal}: ${e.message}`); }
            if (typeof condicionSCSVal !== 'boolean') throw new Error(`Condición 'SinoSi' ("${bloqueSCS.condicionStr}") en línea ${bloqueSCS.lineaOriginal} debe ser lógica.`);

            if (condicionSCSVal) {
                await Webgoritmo.Interprete.ejecutarBloque(bloqueSCS.cuerpo, ambitoActual, bloqueSCS.lineaOriginal);
                sinoSiEjecutado = true;
                break;
            }
        }
        if (!sinoSiEjecutado && bloqueSino.length > 0 && !Webgoritmo.estadoApp.detenerEjecucion) {
            // Encontrar la línea original del Sino
            let lineaSinoOriginal = -1;
            for(let k=indiceEnBloque + 1; k < i; k++) {
                if(lineasBloque[k].trim().toLowerCase() === "sino") {
                    lineaSinoOriginal = numLineaOriginalOffset + k +1;
                    break;
                }
            }
            await Webgoritmo.Interprete.ejecutarBloque(bloqueSino, ambitoActual, lineaSinoOriginal);
        }
    }
    return i -1; // Devuelve el índice de la línea FinSi (el bucle for en ejecutarBloque incrementará i)
};


// --- MOTOR DE EJECUCIÓN (MVP) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloqueParam, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Expresiones) {
        console.error("ejecutarBloque: Módulos Webgoritmo esenciales no definidos.");
        return;
    }

    for (let i = 0; i < lineasBloqueParam.length; i++) {
        if (Webgoritmo.estadoApp.detenerEjecucion) {
            console.log("Ejecución detenida en ejecutarBloque.");
            break;
        }

        const lineaOriginal = lineasBloqueParam[i];
        const lineaTrimmed = lineaOriginal.trim();
        // El numLineaActual es relativo al inicio del pseudocódigo completo, no solo del bloque actual
        const numLineaActual = numLineaOriginalOffset + i + 1;


        if (lineaTrimmed === '' || lineaTrimmed.startsWith('//')) {
            continue;
        }

        console.log(`Ejecutando (Bloque L:${numLineaActual}): ${lineaTrimmed}`);
        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();

            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaActual);
            } else if (lineaLower.match(/^(escribir|imprimir|mostrar)\s/)) {
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaActual);
            } else if (lineaTrimmed.includes('<-')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaActual);
            } else if (lineaLower.startsWith('si ') && lineaLower.includes(' entonces')) {
                // El numLineaActual es el de la propia línea "Si..."
                const nuevoIndiceBloque = await Webgoritmo.Interprete.handleSi(lineaTrimmed, ambitoActual, numLineaActual, lineasBloqueParam, i);
                i = nuevoIndiceBloque; // Actualizar el índice 'i' para saltar el bloque Si-FinSi procesado.
                instruccionManejada = true;
            }

            if (!instruccionManejada && lineaTrimmed) {
                throw new Error(`Instrucción no reconocida: '${lineaTrimmed}'`);
            }
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${numLineaActual}: ${e.message}`; // Usar numLineaActual que es la línea real
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
                Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            } else {
                console.error(Webgoritmo.estadoApp.errorEjecucion);
            }
            break;
        }
    }
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    // ... (resto del código de ejecutarPseudocodigo como en la versión anterior,
    //      asegurándose de que numLineaOriginalOffset para el primer ejecutarBloque sea 0) ...
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { /* ... error ... */ return; }
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) { /* ... error ... */ return; }

    // restablecerEstado es llamado desde app.js antes de esta función.
    if (Webgoritmo.UI.añadirSalida) {
        if(Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
        Webgoritmo.UI.añadirSalida("--- Iniciando ejecución ---", "normal"); // Mensaje actualizado
    }

    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');

    // Encontrar Proceso/Algoritmo principal
    let enBloquePrincipal = false;
    let lineasDelPrincipal = [];
    let inicioBloquePrincipalLineaNum = 0;

    for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
        const linea = Webgoritmo.estadoApp.lineasCodigo[i].trim().toLowerCase();
        if (linea.startsWith("proceso") || linea.startsWith("algoritmo")) {
            if (enBloquePrincipal) throw new Error("Múltiples bloques Proceso/Algoritmo definidos.");
            enBloquePrincipal = true;
            inicioBloquePrincipalLineaNum = i + 1; // 1-based para el usuario
            continue;
        }
        if (linea.startsWith("finproceso") || linea.startsWith("finalgoritmo")) {
            if (!enBloquePrincipal) throw new Error("FinProceso/FinAlgoritmo sin un bloque principal iniciado.");
            enBloquePrincipal = false; // Fin del bloque principal a parsear
            break;
        }
        if (enBloquePrincipal) {
            lineasDelPrincipal.push(Webgoritmo.estadoApp.lineasCodigo[i]); // Guardar línea original con su indentación
        }
    }

    if (enBloquePrincipal) { // Si el bucle terminó y todavía estamos enBloquePrincipal
        throw new Error("Bloque Proceso/Algoritmo no fue cerrado con FinProceso/FinAlgoritmo.");
    }
    if (lineasDelPrincipal.length === 0 && Webgoritmo.estadoApp.lineasCodigo.some(l => l.trim() !== "")) {
        // Si no se encontraron líneas para el principal pero hay código, es probable que falte Proceso/Algoritmo
         throw new Error("No se encontró un bloque Proceso/Algoritmo principal.");
    }


    await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1); // Offset es 0-based

    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) {
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
        } else if (Webgoritmo.estadoApp.detenerEjecucion) {
             Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida ---", "warning");
        }else {
            Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal");
        }
    }
    // La lógica del botón y estadoApp.ejecucionEnCurso se maneja en app.js
};

console.log("motorInterprete.js cargado y Webgoritmo.Interprete inicializado (con handleSi).");
