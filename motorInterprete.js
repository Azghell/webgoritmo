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
Webgoritmo.Interprete.handleEscribir = function(linea, ambitoActual, numLineaOriginal) {
    const regexEscribir = /^(Escribir|Imprimir|Mostrar)\s+(.*)/i;
    const coincidenciaEscribir = linea.match(regexEscribir);

    console.log(`HANDLEESCRIBIR DEBUG: Recibida línea: "${linea}". Coincidencia con regexEscribir: `, coincidenciaEscribir);

    if (coincidenciaEscribir) {
        const cadenaArgs = coincidenciaEscribir[2];
        console.log(`HANDLEESCRIBIR DEBUG: cadenaArgs extraída: "${cadenaArgs}"`);

        // Intento de split más robusto para argumentos de Escribir, considerando comas dentro de strings
        const args = [];
        let buffer = "";
        let dentroDeComillasDobles = false;
        let dentroDeComillasSimples = false;

        for (let i = 0; i < cadenaArgs.length; i++) {
            const char = cadenaArgs[i];
            if (char === '"' && (i === 0 || cadenaArgs[i-1] !== '\\')) {
                dentroDeComillasDobles = !dentroDeComillasDobles;
            } else if (char === "'" && (i === 0 || cadenaArgs[i-1] !== '\\')) {
                dentroDeComillasSimples = !dentroDeComillasSimples;
            }

            if (char === ',' && !dentroDeComillasDobles && !dentroDeComillasSimples) {
                args.push(buffer.trim());
                buffer = "";
            } else {
                buffer += char;
            }
        }
        args.push(buffer.trim()); // Añadir el último argumento
        console.log(`HANDLEESCRIBIR DEBUG: Args parseados: `, args);


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

    // Llamar a la función global expuesta por app.js para mostrar el input
    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') {
        window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMensaje);
    } else {
        console.error("motorInterprete.js: La función global solicitarEntradaUsuario no está disponible.");
        // Fallback: intentar al menos mostrar el prompt en la consola de salida si la UI principal falla
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(promptMensaje, 'input-prompt');
            Webgoritmo.UI.añadirSalida("[Error Interno: No se pudo preparar el área de input. La ejecución podría no continuar correctamente después de este Leer.]", 'error');
        }
        // Considerar lanzar un error aquí o detener la ejecución si la UI de input es crítica y no se puede mostrar
        // throw new Error("No se pudo inicializar la UI para la entrada del usuario.");
    }

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
    let i = 0; // Declarar i fuera para que sea accesible después del bucle si es necesario (ej. handleMientras)
    while (i < lineasBloqueParam.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) { console.log("Ejecución detenida en ejecutarBloque."); break; }
        const lineaOriginal = lineasBloqueParam[i];
        const lineaTrimmed = lineaOriginal.trim();
        const numLineaGlobal = numLineaOriginalOffset + i + 1;

        console.log(`MOTOR DEBUG: Procesando línea ${numLineaGlobal}: "${lineaTrimmed}"`);

        if (lineaTrimmed === '' || lineaTrimmed.startsWith('//')) { i++; continue; }
        let instruccionManejada = false;
        try {
            const lineaLower = lineaTrimmed.toLowerCase();
            console.log(`MOTOR DEBUG: lineaLower para match: "${lineaLower}"`);

            // Intentar un match más específico y loguearlo directamente
            const matchEscribirDirecto = lineaLower.match(/^escribir\s+.+/);
            // const matchEscribirAlternativo = lineaLower.match(/^(escribir|imprimir|mostrar)\s/); // Mantenemos el original para comparar si es necesario
            console.log(`MOTOR DEBUG: Match directo con /^escribir\\s+.+/: `, matchEscribirDirecto);
            // console.log(`MOTOR DEBUG: Match alternativo con /^(escribir|imprimir|mostrar)\\s/: `, matchEscribirAlternativo);


            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (matchEscribirDirecto) { // Usar el resultado del match directo simplificado
                 console.log("MOTOR DEBUG: DETECTADO 'escribir' por match directo.");
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('leer ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleLeer(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('si ') && lineaLower.includes(' entonces')) {
                    const nuevoIndiceRelativoAlBloque = await Webgoritmo.Interprete.handleSi(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                    i = nuevoIndiceRelativoAlBloque;
                    instruccionManejada = true;
            } else if (lineaLower.startsWith('mientras ') && lineaLower.includes(' hacer')) {
                const { nuevoIndiceRelativoAlBloque, ejecutarSiguienteIteracion } = await Webgoritmo.Interprete.handleMientras(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque;
                instruccionManejada = true;
                if (ejecutarSiguienteIteracion) {
                    continue;
                }
            } else if (lineaTrimmed.includes('<-')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (lineaLower.startsWith('para ') && lineaLower.includes(' hacer')) {
                const { nuevoIndiceRelativoAlBloque, ejecutarSiguienteIteracion } = await Webgoritmo.Interprete.handlePara(lineaTrimmed, ambitoActual, numLineaGlobal, lineasBloqueParam, i);
                i = nuevoIndiceRelativoAlBloque;
                instruccionManejada = true;
                if (ejecutarSiguienteIteracion) {
                    continue;
                }
            }

            if (!instruccionManejada && lineaTrimmed &&
                !lineaLower.startsWith("finsi") &&
                !lineaLower.startsWith("sino") &&
                !lineaLower.startsWith("sinosi") &&
                !lineaLower.startsWith("finmientras") &&
                !lineaLower.startsWith("finpara")) {
                 // Las palabras clave de cierre de bloque son manejadas por sus respectivos handlers (Si, Mientras, Para)
                 // y no deben ser tratadas como instrucciones no reconocidas aquí.
                throw new Error(`Instrucción no reconocida o mal ubicada: '${lineaTrimmed}'`);
            }
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${numLineaGlobal}: ${e.message}`;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            else console.error(Webgoritmo.estadoApp.errorEjecucion);
            break;
        }

        i++; // Incrementar i para la siguiente línea del bloque

        if (Webgoritmo.estadoApp.esperandoEntrada && !Webgoritmo.estadoApp.detenerEjecucion) {
            console.log("ejecutarBloque: Pausando por 'Leer'.");
            // No rompemos el bucle 'while' aquí directamente.
            // Si 'Leer' está dentro de 'Mientras', 'handleMientras' devolverá 'ejecutarSiguienteIteracion = true'
            // y el 'continue' de arriba se activará.
            // Si 'Leer' está fuera de 'Mientras', la ejecución se pausará y se reanudará desde este punto.
            // La promesa en handleLeer detendrá el flujo hasta que se resuelva.
            await Webgoritmo.estadoApp.promesaEntradaPendiente; // Espera aquí si la promesa se creó
            Webgoritmo.estadoApp.promesaEntradaPendiente = null; // Limpia la promesa
            if(Webgoritmo.estadoApp.detenerEjecucion) break; // Si la entrada causó una detención
        }
    }
};

Webgoritmo.Interprete.handleMientras = async function(lineaActual, ambitoActual, numLineaOriginalMientras, lineasBloqueCompleto, indiceMientrasEnBloque) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        throw new Error("Error interno: Módulos no disponibles para 'Mientras'.");
    }

    const mientrasMatch = lineaActual.match(/^Mientras\s+(.+?)\s+Hacer$/i);
    if (!mientrasMatch) throw new Error(`Sintaxis 'Mientras' incorrecta en línea ${numLineaOriginalMientras}.`);

    const condicionStr = mientrasMatch[1];
    let cuerpoMientras = [];
    let finMientrasEncontrado = false;
    let anidamientoMientras = 0;
    let i = indiceMientrasEnBloque + 1;

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIter = lineasBloqueCompleto[i].trim().toLowerCase();
        if (lineaIter.startsWith("mientras ") && lineaIter.includes(" hacer")) {
            anidamientoMientras++;
            cuerpoMientras.push(lineasBloqueCompleto[i]);
        } else if (lineaIter === "finmientras") {
            if (anidamientoMientras === 0) {
                finMientrasEncontrado = true;
                break;
            } else {
                anidamientoMientras--;
                cuerpoMientras.push(lineasBloqueCompleto[i]);
            }
        } else {
            cuerpoMientras.push(lineasBloqueCompleto[i]);
        }
    }

    if (!finMientrasEncontrado) {
        throw new Error(`Se esperaba 'FinMientras' para cerrar el bucle 'Mientras' iniciado en la línea ${numLineaOriginalMientras}.`);
    }

    const indiceDespuesFinMientras = i + 1;
    let ejecutarSiguienteIteracionDelBloquePrincipal = false;

    // Bucle de ejecución del Mientras
    let primeraIteracion = true;
    let condicionVal;
    try {
        condicionVal = Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
    } catch (e) {
        throw new Error(`Evaluando condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras}: ${e.message}`);
    }
    if (typeof condicionVal !== 'boolean') {
        throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica, se obtuvo: ${condicionVal}.`);
    }

    while (condicionVal && !Webgoritmo.estadoApp.detenerEjecucion) {
        // El offset para las líneas dentro del Mientras es relativo al inicio del bloque completo + offset del Mientras + 1
        const offsetLineasCuerpo = numLineaOriginalMientras - indiceMientrasEnBloque -1 + indiceMientrasEnBloque +1;
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoMientras, ambitoActual, offsetLineasCuerpo);

        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        if (Webgoritmo.estadoApp.esperandoEntrada) {
            console.log("handleMientras: Pausando debido a 'Leer' dentro del bucle.");
            // Guardamos el estado para reanudar el bucle Mientras después de la entrada.
            Webgoritmo.estadoApp.estadoBuclePendiente = {
                tipo: 'Mientras',
                lineaOriginalMientras,
                condicionStr,
                cuerpoMientras,
                ambitoActual,
                indiceDespuesFinMientras,
                offsetLineasCuerpo
            };
            ejecutarSiguienteIteracionDelBloquePrincipal = true;
            return { nuevoIndiceRelativoAlBloque: indiceMientrasEnBloque, ejecutarSiguienteIteracion: true };
        }

        // Re-evaluar condición
        try {
            condicionVal = Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
        } catch (e) {
            throw new Error(`Re-evaluando condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras}: ${e.message}`);
        }
        if (typeof condicionVal !== 'boolean') {
            throw new Error(`Condición 'Mientras' ("${condicionStr}") en línea ${numLineaOriginalMientras} debe ser lógica, se obtuvo: ${condicionVal}.`);
        }
    }

    return { nuevoIndiceRelativoAlBloque: indiceDespuesFinMientras -1 , ejecutarSiguienteIteracion: ejecutarSiguienteIteracionDelBloquePrincipal };
};


Webgoritmo.Interprete.reanudarBuclePendiente = async function() {
    if (!Webgoritmo.estadoApp.estadoBuclePendiente) return;

    const estado = Webgoritmo.estadoApp.estadoBuclePendiente;
    Webgoritmo.estadoApp.estadoBuclePendiente = null; // Limpiar estado

    if (estado.tipo === 'Mientras') {
        console.log(`Reanudando bucle Mientras de línea ${estado.lineaOriginalMientras}`);
        let condicionVal;
        try {
            condicionVal = Webgoritmo.Expresiones.evaluarExpresion(estado.condicionStr, estado.ambitoActual);
        } catch (e) {
            throw new Error(`Re-evaluando condición 'Mientras' ("${estado.condicionStr}") al reanudar: ${e.message}`);
        }

        while (condicionVal && !Webgoritmo.estadoApp.detenerEjecucion) {
            await Webgoritmo.Interprete.ejecutarBloque(estado.cuerpoMientras, estado.ambitoActual, estado.offsetLineasCuerpo);
            if (Webgoritmo.estadoApp.detenerEjecucion) break;

            if (Webgoritmo.estadoApp.esperandoEntrada) {
                console.log("handleMientras (reanudar): Pausando de nuevo por 'Leer'.");
                Webgoritmo.estadoApp.estadoBuclePendiente = estado; // Guardar de nuevo para la próxima reanudación
                return; // Salir, la ejecución principal se detendrá
            }

            try {
                condicionVal = Webgoritmo.Expresiones.evaluarExpresion(estado.condicionStr, estado.ambitoActual);
            } catch (e) {
                 throw new Error(`Re-evaluando condición 'Mientras' ("${estado.condicionStr}") al reanudar: ${e.message}`);
            }
        }
        // Si el bucle terminó o se detuvo, necesitamos continuar la ejecución *después* del FinMientras.
        // Esto es un poco más complejo porque ejecutarBloque ya avanzó.
        // La forma en que está estructurado ahora, la reanudación ocurre *antes* de que ejecutarBloque avance su 'i'.
        // Así que al terminar aquí, ejecutarBloque continuará desde donde se pausó, que es la instrucción Leer.
        // Necesitamos que salte al final del Mientras.
        // Esto sugiere que la reanudación debe ser manejada más centralmente en app.js o que ejecutarBloque
        // necesita saber si una reanudación de bucle acaba de ocurrir.

        // Por ahora, la lógica en app.js que llama a reanudarBuclePendiente y luego
        // potencialmente reanuda ejecutarBloque (si no hay más bucles pendientes)
        // debería funcionar, ya que ejecutarBloque continuará.
        // El problema es que el índice `i` de `ejecutarBloque` no se actualiza al `indiceDespuesFinMientras`.
        // Esto necesita una revisión más profunda de cómo se maneja el flujo de control post-reanudación.

        // Solución temporal: si el bucle termina, la ejecución continuará después de la línea 'Leer'.
        // Si la línea 'Leer' era la última del bloque 'Mientras', entonces 'ejecutarBloque'
        // pasará a la siguiente línea *después* del 'FinMientras' si `handleMientras` devolvió
        // el índice correcto la primera vez.
    } else if (estado.tipo === 'Para') {
        console.log(`Reanudando bucle Para de línea ${estado.lineaOriginalPara}`);
        let variableControl = estado.ambitoActual[estado.variableControlNombre];

        // El valor de variableControl.value ya fue actualizado por Leer y la asignación.
        // Ahora solo necesitamos continuar el bucle desde donde se quedó.
        // El incremento/decremento y la re-evaluación de la condición ocurrirán al final de esta iteración reanudada.

        while ((estado.paso > 0 && variableControl.value <= estado.valorFinal) || (estado.paso < 0 && variableControl.value >= estado.valorFinal)) {
            if (Webgoritmo.estadoApp.detenerEjecucion) break;

            // Ejecutar el cuerpo. Si esta es la iteración que fue interrumpida, solo ejecutamos desde la línea siguiente al Leer.
            // Esto es complejo. Para simplificar, re-ejecutamos el cuerpo. Si el Leer está al principio, no hay problema.
            // Si está en medio, las líneas anteriores a Leer en esa iteración se re-ejecutarán.
            // Una solución más precisa requeriría guardar el punto exacto de interrupción dentro del cuerpo.
            await Webgoritmo.Interprete.ejecutarBloque(estado.cuerpoPara, estado.ambitoActual, estado.offsetLineasCuerpo);

            if (Webgoritmo.estadoApp.detenerEjecucion) break;

            if (Webgoritmo.estadoApp.esperandoEntrada) {
                console.log("handlePara (reanudar): Pausando de nuevo por 'Leer'.");
                // Necesitamos actualizar el valor de la variable de control en el estado guardado
                // por si el Leer cambió otra variable que afecta a la variable de control indirectamente (poco probable pero posible)
                // O si el Leer era sobre la propia variable de control (más probable).
                estado.ambitoActual[estado.variableControlNombre].value = variableControl.value;
                Webgoritmo.estadoApp.estadoBuclePendiente = estado;
                return;
            }

            variableControl.value += estado.paso;

            // Re-evaluar condición (implícita en el while)
        }
    }
};


Webgoritmo.Interprete.handlePara = async function(lineaActual, ambitoActual, numLineaOriginalPara, lineasBloqueCompleto, indiceParaEnBloque) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        throw new Error("Error interno: Módulos no disponibles para 'Para'.");
    }

    const paraMatch = lineaActual.match(/^Para\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*<-\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i);
    if (!paraMatch) throw new Error(`Sintaxis 'Para' incorrecta en línea ${numLineaOriginalPara}.`);

    const variableControlNombre = paraMatch[1];
    const valorInicialExpr = paraMatch[2];
    const valorFinalExpr = paraMatch[3];
    const valorPasoExpr = paraMatch[4]; // Puede ser undefined

    let valorInicial, valorFinal, paso;
    try {
        valorInicial = Webgoritmo.Expresiones.evaluarExpresion(valorInicialExpr, ambitoActual);
        valorFinal = Webgoritmo.Expresiones.evaluarExpresion(valorFinalExpr, ambitoActual);
        paso = valorPasoExpr ? Webgoritmo.Expresiones.evaluarExpresion(valorPasoExpr, ambitoActual) : (valorFinal >= valorInicial ? 1 : -1);
    } catch (e) {
        throw new Error(`Error evaluando límites/paso del bucle 'Para' en línea ${numLineaOriginalPara}: ${e.message}`);
    }

    if (typeof valorInicial !== 'number' || typeof valorFinal !== 'number' || typeof paso !== 'number') {
        throw new Error(`Los límites y el paso del bucle 'Para' deben ser numéricos (en línea ${numLineaOriginalPara}).`);
    }
    if (paso === 0) {
        throw new Error(`El paso del bucle 'Para' no puede ser cero (en línea ${numLineaOriginalPara}).`);
    }

    // Definir o actualizar la variable de control en el ámbito actual
    if (!ambitoActual.hasOwnProperty(variableControlNombre)) {
        // PSeInt permite definición implícita. Asumimos Entero si todos son enteros, sino Real.
        const tipoImplicito = (Number.isInteger(valorInicial) && Number.isInteger(valorFinal) && Number.isInteger(paso)) ? 'Entero' : 'Real';
        ambitoActual[variableControlNombre] = { value: valorInicial, type: tipoImplicito };
         if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO en línea ${numLineaOriginalPara}]: Variable de control '${variableControlNombre}' definida implícitamente como ${tipoImplicito}.`, 'normal');
    } else {
        // Si ya existe, solo actualizamos su valor. PSeInt es flexible con el tipo aquí.
        ambitoActual[variableControlNombre].value = valorInicial;
    }
    let variableControl = ambitoActual[variableControlNombre]; // Referencia al objeto de la variable

    let cuerpoPara = [];
    let finParaEncontrado = false;
    let anidamientoPara = 0;
    let i = indiceParaEnBloque + 1;

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIter = lineasBloqueCompleto[i].trim().toLowerCase();
        if (lineaIter.startsWith("para ") && lineaIter.includes(" hacer")) {
            anidamientoPara++;
            cuerpoPara.push(lineasBloqueCompleto[i]);
        } else if (lineaIter === "finpara") {
            if (anidamientoPara === 0) {
                finParaEncontrado = true;
                break;
            } else {
                anidamientoPara--;
                cuerpoPara.push(lineasBloqueCompleto[i]);
            }
        } else {
            cuerpoPara.push(lineasBloqueCompleto[i]);
        }
    }

    if (!finParaEncontrado) {
        throw new Error(`Se esperaba 'FinPara' para cerrar el bucle 'Para' iniciado en la línea ${numLineaOriginalPara}.`);
    }

    const indiceDespuesFinPara = i + 1;
    let ejecutarSiguienteIteracionDelBloquePrincipal = false;

    // Asignación inicial ya hecha arriba al definir/actualizar variableControl.
    // variableControl.value = valorInicial; // No es necesario reasignar aquí.

    while ((paso > 0 && variableControl.value <= valorFinal) || (paso < 0 && variableControl.value >= valorFinal)) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        const offsetLineasCuerpo = numLineaOriginalPara - indiceParaEnBloque -1 + indiceParaEnBloque +1;
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoPara, ambitoActual, offsetLineasCuerpo);

        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        if (Webgoritmo.estadoApp.esperandoEntrada) {
            console.log("handlePara: Pausando debido a 'Leer' dentro del bucle.");
            Webgoritmo.estadoApp.estadoBuclePendiente = {
                tipo: 'Para',
                lineaOriginalPara,
                variableControlNombre, // Nombre de la variable
                // valorInicial, // No es necesario, ya que el valor actual está en la variable
                valorFinal,
                paso,
                cuerpoPara,
                ambitoActual, // El ámbito donde está la variable de control
                indiceDespuesFinPara,
                offsetLineasCuerpo
            };
            ejecutarSiguienteIteracionDelBloquePrincipal = true;
            return { nuevoIndiceRelativoAlBloque: indiceParaEnBloque, ejecutarSiguienteIteracion: true };
        }

        variableControl.value += paso;
    }

    return { nuevoIndiceRelativoAlBloque: indiceDespuesFinPara - 1, ejecutarSiguienteIteracion: ejecutarSiguienteIteracionDelBloquePrincipal };
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
