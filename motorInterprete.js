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
Webgoritmo.Interprete.handleDefinir = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*,\s*[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)*)\s+(?:Como|Es)\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)(?:\s*\[\s*(.+?)\s*\])?$/i);
    if (!coincidenciaDefinir) return false;

    const nombresVariablesOriginales = coincidenciaDefinir[1].split(',').map(s => s.trim());
    const tipoBaseStr = coincidenciaDefinir[2];
    const dimsStr = coincidenciaDefinir[3]; // Puede ser null si no es array
    const tipoBaseLc = tipoBaseStr.toLowerCase();
    // Considerar si 'numero' es un tipo válido o si debe ser inferido/manejado de otra forma.
    const tiposConocidos = ['entero', 'real', 'logico', 'caracter', 'cadena', 'número'];
    if (!tiposConocidos.includes(tipoBaseLc)) {
        // Si el tipo no es conocido directamente, verificar si es un sinónimo o un caso especial
        if (tipoBaseLc === "numerico" || tipoBaseLc === "numérico") {
            // Tratar 'numerico' o 'numérico' como 'real' o un tipo genérico 'numero'
            // Esto es una decisión de diseño, PSeInt es flexible. Aquí lo mapeamos a 'real'.
            // tipoBaseLc = 'real';
            // O, si queremos un tipo 'numero' más genérico que pueda ser Entero o Real:
            // tipoBaseLc = 'numero'; // Necesitaría manejo especial en obtenerValorPorDefecto y conversión
        } else {
            throw new Error(`Tipo '${tipoBaseStr}' no reconocido en línea ${numLineaOriginal}. Tipos válidos: Entero, Real, Logico, Caracter, Cadena.`);
        }
    }


    for (const nombreOriginal of nombresVariablesOriginales) {
        if (nombreOriginal === "") throw new Error(`Nombre de variable vacío en 'Definir' en línea ${numLineaOriginal}.`);
        // Validar nombre de variable con la regex robusta
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreOriginal}' en 'Definir' en línea ${numLineaOriginal}.`);
        }
        const nombreLc = nombreOriginal.toLowerCase();

        if (ambitoActual.hasOwnProperty(nombreLc)) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: La variable '${nombreOriginal}' (como '${nombreLc}') ya está definida. Se sobrescribirá.`, 'warning');
        }

        if (dimsStr) { // Es una definición de arreglo
            const dimExprs = dimsStr.split(',').map(s => s.trim());
            if (dimExprs.some(s => s === "")) throw new Error(`Dimensión vacía para arreglo '${nombreOriginal}' en línea ${numLineaOriginal}.`);

            const evalDimensiones = [];
            for (const expr of dimExprs) {
                let dimVal = await Webgoritmo.Expresiones.evaluarExpresion(expr, ambitoActual);
                if (typeof dimVal !== 'number' || !Number.isInteger(dimVal) || dimVal <= 0) {
                    throw new Error(`Las dimensiones de un arreglo deben ser números enteros positivos. Error en '${expr}' para '${nombreOriginal}' en línea ${numLineaOriginal}.`);
                }
                evalDimensiones.push(dimVal);
            }
            ambitoActual[nombreLc] = {
                type: 'array',
                baseType: tipoBaseLc, // Usar tipo base normalizado
                dimensions: evalDimensiones,
                value: Webgoritmo.Interprete.inicializarArray(evalDimensiones, tipoBaseLc, ambitoActual),
                isFlexibleType: false // Definir Como establece un tipo fijo
            };
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreOriginal}' (como '${nombreLc}') de tipo '${tipoBaseLc}' dimensionado con [${evalDimensiones.join(', ')}] en línea ${numLineaOriginal}.`, 'normal');
        } else { // Es una variable escalar
            ambitoActual[nombreLc] = {
                value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoBaseLc),
                type: tipoBaseLc, // Usar tipo base normalizado
                isFlexibleType: false // Definir Como establece un tipo fijo
            };
        }
    }
    return true;
};

Webgoritmo.Interprete.handleAsignacion = async function(linea, ambitoActual, numLineaOriginal) {
    const asignacionMatch = linea.match(/^(.+?)\s*(?:<-|=)\s*(.*)$/); // General match, allows for complex LHS before full parse
    if (!asignacionMatch) return false;

    const destinoStrOriginal = asignacionMatch[1].trim();
    const exprStr = asignacionMatch[2].trim();
    let valorEvaluado;

    // Check for function call on RHS specifically for SubProcesos or Builtins
    const funcCallMatchRHS = exprStr.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\((.*?)\)\s*$/);
    let funcNameRHSOoriginal = null;
    if (funcCallMatchRHS) {
        funcNameRHSOoriginal = funcCallMatchRHS[1];
    }
    const funcNameRHSLc = funcNameRHSOoriginal ? funcNameRHSOoriginal.toLowerCase() : null;

    if (funcCallMatchRHS && Webgoritmo.estadoApp.funcionesDefinidas && Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(funcNameRHSLc)) {
        const defFuncion = Webgoritmo.estadoApp.funcionesDefinidas[funcNameRHSLc];
        if (defFuncion.retornoVarLc === null) {
            throw new Error(`Error línea ${numLineaOriginal}: SubProceso '${funcNameRHSOoriginal}' no devuelve valor y no puede ser usado en una asignación directa que espera un valor.`);
        }
        let argExprsRHS = funcCallMatchRHS[2].trim() === '' ? [] : funcCallMatchRHS[2].split(',').map(a => a.trim());
        valorEvaluado = await Webgoritmo.Interprete.ejecutarSubProcesoLlamada(funcNameRHSOoriginal, argExprsRHS, ambitoActual, numLineaOriginal);
    } else if (funcCallMatchRHS && Webgoritmo.Builtins && Webgoritmo.Builtins.funciones.hasOwnProperty(funcNameRHSLc)) {
        let argExprsRHS = funcCallMatchRHS[2].trim() === '' ? [] : funcCallMatchRHS[2].split(',').map(a => a.trim());
        const evaluadosArgs = [];
        for (const argExpr of argExprsRHS) {
            evaluadosArgs.push(await Webgoritmo.Expresiones.evaluarExpresion(argExpr, ambitoActual));
        }
        valorEvaluado = Webgoritmo.Builtins.funciones[funcNameRHSLc](evaluadosArgs, numLineaOriginal); // Built-ins might need ambitoActual too
    } else {
        valorEvaluado = await Webgoritmo.Expresiones.evaluarExpresion(exprStr, ambitoActual);
    }

    // Now handle LHS (destinoStrOriginal)
    const accesoArregloMatch = destinoStrOriginal.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*\[\s*(.+?)\s*\]$/);
    if (accesoArregloMatch) {
        const nombreArrOriginal = accesoArregloMatch[1];
        const nombreArrLc = nombreArrOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreArrLc)) {
            throw new Error(`Arreglo '${nombreArrOriginal}' no definido (línea ${numLineaOriginal}).`);
        }
        const arrMeta = ambitoActual[nombreArrLc];
        if (arrMeta.type !== 'array') {
            throw new Error(`Variable '${nombreArrOriginal}' no es un arreglo (línea ${numLineaOriginal}).`);
        }

        const indiceExprs = accesoArregloMatch[2].split(',').map(s => s.trim());
        if (indiceExprs.some(s => s === "")) {
            throw new Error(`Índice vacío o mal formado para arreglo '${nombreArrOriginal}' (línea ${numLineaOriginal}).`);
        }
        if (indiceExprs.length !== arrMeta.dimensions.length) {
            throw new Error(`Número incorrecto de dimensiones para arreglo '${nombreArrOriginal}'. Esperadas ${arrMeta.dimensions.length}, recibidas ${indiceExprs.length} (línea ${numLineaOriginal}).`);
        }

        const evalIndices = [];
        for (let k = 0; k < indiceExprs.length; k++) {
            let idxValRaw = await Webgoritmo.Expresiones.evaluarExpresion(indiceExprs[k], ambitoActual);
            let idxVal = idxValRaw; // Keep original raw value for potential error message

            if (typeof idxVal !== 'number' || (!Number.isInteger(idxVal) && Math.floor(idxVal) !== idxVal) ) { // Allow floats if they are whole numbers
                 idxVal = Math.trunc(idxVal); // Truncate to integer if it's like 3.0
            }
            // Now check if, after potential truncation, it's a valid number for an index
            if (typeof idxVal !== 'number' || isNaN(idxVal)) { // Check isNaN after potential truncation
                throw new Error(`Índice para dimensión ${k+1} de '${nombreArrOriginal}' debe ser numérico. Se obtuvo '${indiceExprs[k]}' (evaluado a ${idxValRaw}) (línea ${numLineaOriginal}).`);
            }
            idxVal = Math.trunc(idxVal); // Ensure integer for boundary checks
            if (idxVal <= 0 || idxVal > arrMeta.dimensions[k]) { // PSeInt arrays are 1-indexed
                throw new Error(`Índice [${idxVal}] fuera de límites para dimensión ${k+1} de '${nombreArrOriginal}' (1..${arrMeta.dimensions[k]}) (línea ${numLineaOriginal}).`);
            }
            evalIndices.push(idxVal);
        }

        let targetLevel = arrMeta.value;
        for (let k = 0; k < evalIndices.length - 1; k++) {
            if (!targetLevel || !Array.isArray(targetLevel[evalIndices[k]])) { // Check if it's an array
                throw new Error(`Error interno accediendo sub-arreglo de '${nombreArrOriginal}' en dimensión ${k+1} (línea ${numLineaOriginal}).`);
            }
            targetLevel = targetLevel[evalIndices[k]];
        }

        const tipoValorEntrante = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
        let tipoDestinoParaConversion = arrMeta.baseType;

        if (arrMeta.isFlexibleType === true && arrMeta.baseType === 'entero' && (tipoValorEntrante === 'cadena' || tipoValorEntrante === 'caracter')) {
            arrMeta.baseType = 'cadena'; // Cambiar el tipo base del arreglo a cadena
            tipoDestinoParaConversion = 'cadena';
            arrMeta.isFlexibleType = false; // Una vez que se convierte a cadena, se queda como cadena
            // Podríamos convertir todo el arreglo a cadena aquí si fuera necesario (opcional, PSeInt es flexible)
            // Webgoritmo.Interprete.convertirElementosArrayAString(arrMeta.value, arrMeta.dimensions); // Puede ser costoso
            if(Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO]: Arreglo '${nombreArrOriginal}' (como '${nombreArrLc}') cambió su tipo base a 'Cadena' debido a asignación en línea ${numLineaOriginal}.`, 'normal');
        }
        targetLevel[evalIndices[evalIndices.length - 1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestinoParaConversion);
    } else {
        // Asignación a variable escalar
        const nombreVarOriginal = destinoStrOriginal;
        // Validar nombre de variable
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreVarOriginal}' en asignación en línea ${numLineaOriginal}.`);
        }
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) {
            // PSeInt a veces permite asignación implícita, pero es mejor ser estricto si 'Definir' es obligatorio.
            // Para mayor compatibilidad con PSeInt, se podría definir implícitamente aquí.
            // Por ahora, lanzamos error si no está definida.
            throw new Error(`Variable '${nombreVarOriginal}' no definida antes de asignación (línea ${numLineaOriginal}). Considere usar 'Definir'.`);
        }
        const varMeta = ambitoActual[nombreVarLc];
        if (varMeta.type === 'array') {
            throw new Error(`No se puede asignar un valor directamente a un arreglo '${nombreVarOriginal}' sin especificar índices (línea ${numLineaOriginal}).`);
        }
        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, varMeta.type);
    }
    return true;
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
            const parteEvaluada = await Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
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
        condicionPrincipalVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionPrincipalStr, ambitoActual);
    } catch (e) { throw new Error(`Evaluando condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi}: ${e.message}`); }
    if (typeof condicionPrincipalVal !== 'boolean') {
        throw new Error(`Condición 'Si' ("${condicionPrincipalStr}") en línea ${numLineaOriginalSi} debe ser lógica, se obtuvo: ${condicionPrincipalVal}.`);
    }
    let bloqueEntonces = [];
    let bloquesSinoSi = []; // Array of {condicionStr, cuerpo, lineaOriginal}
    let bloqueSino = { cuerpo: [], lineaOriginal: -1 }; // Objeto para Sino con su línea original
    let bufferBloqueActual = bloqueEntonces;
    let siAnidados = 0;
    let i = indiceEnBloque + 1;
    // numLineaGlobalActualBase es el número de línea real de la línea ANTERIOR al inicio del cuerpo del Si.
    // Se usa para calcular el numLineaOriginal de los SinoSi/Sino.
    let numLineaGlobalActualBase = numLineaOriginalSi;

    while (i < lineasBloque.length) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return { indiceProcesado: i, error: true };
        const lineaIterOriginal = lineasBloque[i];
        const lineaIterTrimmed = lineaIterOriginal.trim();
        const lineaIterLower = lineaIterTrimmed.toLowerCase();
        // El número de línea global para la línea actual del SinoSi/Sino, etc.
        const numLineaGlobalIter = numLineaOriginalSi + (i - (indiceEnBloque + 1)) + 1;


        if (lineaIterLower.startsWith("si ") && lineaIterLower.includes(" entonces")) {
            siAnidados++;
            bufferBloqueActual.push(lineaIterOriginal);
        } else if (lineaIterLower === "finsi") {
            if (siAnidados > 0) {
                siAnidados--;
                bufferBloqueActual.push(lineaIterOriginal);
            } else {
                // Este es el FinSi del bloque Si actual.
                i++; // Avanzar más allá del FinSi para el retorno.
                break;
            }
        } else if (siAnidados === 0) { // Solo procesar SinoSi/Sino si no estamos dentro de un Si anidado.
            const sinoSiMatch = lineaIterTrimmed.match(/^SinoSi\s+(.+?)\s+Entonces$/i);
            if (sinoSiMatch) {
                if (bufferBloqueActual === bloqueSino.cuerpo) throw new Error(`'SinoSi' no puede aparecer después de 'Sino' (línea ${numLineaGlobalIter}).`);
                const nuevoBloqueSinoSi = {
                    condicionStr: sinoSiMatch[1],
                    cuerpo: [],
                    lineaOriginal: numLineaGlobalIter // línea del SinoSi
                };
                bloquesSinoSi.push(nuevoBloqueSinoSi);
                bufferBloqueActual = nuevoBloqueSinoSi.cuerpo;
                numLineaGlobalActualBase = numLineaGlobalIter; // Actualizar base para el siguiente bloque
            } else if (lineaIterLower === "sino") {
                if (bloqueSino.lineaOriginal !== -1) throw new Error(`Múltiples 'Sino' para el mismo 'Si' (línea ${numLineaGlobalIter}).`);
                bloqueSino.lineaOriginal = numLineaGlobalIter; // línea del Sino
                bufferBloqueActual = bloqueSino.cuerpo;
                numLineaGlobalActualBase = numLineaGlobalIter; // Actualizar base para el siguiente bloque
            } else {
                bufferBloqueActual.push(lineaIterOriginal);
            }
        } else { // Dentro de un Si anidado
            bufferBloqueActual.push(lineaIterOriginal);
        }
        i++;
    }

    if (siAnidados > 0 || (i >= lineasBloque.length && !(lineasBloque[i-1] && lineasBloque[i-1].trim().toLowerCase() === "finsi"))) {
         throw new Error(`Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en la línea ${numLineaOriginalSi}.`);
    }

    if (condicionPrincipalVal) {
        // El offset para ejecutarBloque es el número de línea del 'Si' original.
        // Las líneas en bloqueEntonces son relativas a este 'Si'.
        await Webgoritmo.Interprete.ejecutarBloque(bloqueEntonces, ambitoActual, numLineaOriginalSi);
    } else {
        let sinoSiEjecutado = false;
        for (const bloqueSCS of bloquesSinoSi) {
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
            let condicionSinoSiVal;
            try {
                condicionSinoSiVal = await Webgoritmo.Expresiones.evaluarExpresion(bloqueSCS.condicionStr, ambitoActual);
            } catch (e) { throw new Error(`Evaluando condición 'SinoSi' ("${bloqueSCS.condicionStr}") en línea ${bloqueSCS.lineaOriginal}: ${e.message}`); }

            if (typeof condicionSinoSiVal !== 'boolean') {
                throw new Error(`Condición 'SinoSi' ("${bloqueSCS.condicionStr}") en línea ${bloqueSCS.lineaOriginal} debe ser lógica, se obtuvo: ${condicionSinoSiVal}.`);
            }

            if (condicionSinoSiVal) {
                // El offset para ejecutarBloque es el número de línea del 'SinoSi'.
                await Webgoritmo.Interprete.ejecutarBloque(bloqueSCS.cuerpo, ambitoActual, bloqueSCS.lineaOriginal);
                sinoSiEjecutado = true;
                break;
            }
        }
        if (!sinoSiEjecutado && bloqueSino.lineaOriginal !== -1 && bloqueSino.cuerpo.length > 0 && !Webgoritmo.estadoApp.detenerEjecucion) {
            // El offset para ejecutarBloque es el número de línea del 'Sino'.
            await Webgoritmo.Interprete.ejecutarBloque(bloqueSino.cuerpo, ambitoActual, bloqueSino.lineaOriginal);
        }
    }
    return i - 1; // Devuelve el índice de la línea 'FinSi' procesada.
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) {
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.DOM) throw new Error("Error interno: Módulos no disponibles para 'Leer'.");
    const coincidenciaLeer = linea.match(/^Leer\s+(.+)/i);
    if (!coincidenciaLeer) throw new Error("Sintaxis 'Leer' incorrecta en línea " + numLineaOriginal);

    const nombresOriginales = coincidenciaLeer[1].split(',').map(v => v.trim());
    if (nombresOriginales.length === 0 || nombresOriginales.some(v => v === "")) {
        throw new Error("Instrucción 'Leer' debe especificar variable(s) válidas en línea " + numLineaOriginal);
    }

    const nombresLcParaEstado = [];
    for (const nombreVarOriginal of nombresOriginales) {
        if (!/^[a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*$/.test(nombreVarOriginal)) {
            throw new Error(`Nombre de variable inválido '${nombreVarOriginal}' en 'Leer' en línea ${numLineaOriginal}.`);
        }
        const nombreVarLc = nombreVarOriginal.toLowerCase();
        if (!ambitoActual.hasOwnProperty(nombreVarLc)) {
            throw new Error(`Variable '${nombreVarOriginal}' (como '${nombreVarLc}') no definida antes de 'Leer' en línea ${numLineaOriginal}.`);
        }
        if (ambitoActual[nombreVarLc].type === 'array') {
            throw new Error(`Lectura en arreglos completos no soportada ('Leer ${nombreVarOriginal}'). Línea ${numLineaOriginal}.`);
        }
        nombresLcParaEstado.push(nombreVarLc);
    }

    // Usar nombres originales para el prompt, pero nombres en minúscula para el estado interno.
    let promptMensaje = nombresOriginales.length === 1
        ? `Ingrese valor para ${nombresOriginales[0]}:`
        : `Ingrese ${nombresOriginales.length} valores (separados por espacio/coma) para ${nombresOriginales.join(', ')}:`;

    if (window.WebgoritmoGlobal && typeof window.WebgoritmoGlobal.solicitarEntradaUsuario === 'function') {
        window.WebgoritmoGlobal.solicitarEntradaUsuario(promptMensaje);
    } else {
        console.error("motorInterprete.js: La función global solicitarEntradaUsuario no está disponible.");
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(promptMensaje, 'input-prompt');
            Webgoritmo.UI.añadirSalida("[Error Interno: No se pudo preparar el área de input.]", 'error');
        }
    }

    Webgoritmo.estadoApp.esperandoEntrada = true;
    Webgoritmo.estadoApp.variableEntradaActual = nombresLcParaEstado; // Guardar nombres en minúscula
    Webgoritmo.estadoApp.nombresOriginalesParaEntrada = nombresOriginales; // Guardar originales para UI si es necesario

    console.log(`handleLeer: Esperando entrada para: ${nombresOriginales.join(', ')} (internamente: ${nombresLcParaEstado.join(', ')})`);

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

            const matchEscribir = lineaLower.match(/^(?:escribir|imprimir|mostrar)\s+.+/i);
            const matchAsignacion = lineaTrimmed.match(/^([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*(?:\s*\[.+?\])?)\s*(?:<-|=)/);


            if (lineaLower.startsWith('definir ')) {
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaGlobal);
            } else if (matchEscribir) {
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
        condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
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
            condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(condicionStr, ambitoActual);
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
            condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(estado.condicionStr, estado.ambitoActual);
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
                condicionVal = await Webgoritmo.Expresiones.evaluarExpresion(estado.condicionStr, estado.ambitoActual);
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
    // Regex mejorada para nombres de variables con acentos y ñ, y para permitir '=' además de '<-'
    const paraMatch = lineaActual.match(/^Para\s+([a-zA-Z_áéíóúÁÉÍÓÚñÑ][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]*)\s*(?:<-|=)\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i);
    if (!paraMatch) {
        throw new Error(`Sintaxis 'Para' incorrecta en línea ${numLineaOriginalPara}. Verifique la asignación (<- o =), 'Hasta', 'Con Paso' (opcional) y 'Hacer'.`);
    }

    const varControlOriginal = paraMatch[1];
    const varControlLc = varControlOriginal.toLowerCase();
    const valorInicialExpr = paraMatch[2];
    const valorFinalExpr = paraMatch[3];
    const valorPasoExpr = paraMatch[4]; // Puede ser undefined

    let valorInicial = await Webgoritmo.Expresiones.evaluarExpresion(valorInicialExpr, ambitoActual);
    let valorFinal = await Webgoritmo.Expresiones.evaluarExpresion(valorFinalExpr, ambitoActual);
    let paso = valorPasoExpr ? await Webgoritmo.Expresiones.evaluarExpresion(valorPasoExpr, ambitoActual) : (valorFinal >= valorInicial ? 1 : -1);

    if (typeof valorInicial !== 'number' || typeof valorFinal !== 'number' || typeof paso !== 'number') {
        throw new Error(`Los límites y el paso del bucle 'Para' deben ser numéricos (en línea ${numLineaOriginalPara}).`);
    }
    if (paso === 0) {
        throw new Error(`El paso del bucle 'Para' no puede ser cero (en línea ${numLineaOriginalPara}).`);
    }

    // Definir o actualizar la variable de control en el ámbito actual
    if (!ambitoActual.hasOwnProperty(varControlLc)) {
        const tipoImplicito = (Number.isInteger(valorInicial) && Number.isInteger(valorFinal) && Number.isInteger(paso)) ? 'entero' : 'real';
        ambitoActual[varControlLc] = { value: valorInicial, type: tipoImplicito, isFlexibleType: false }; // Loop vars usually have fixed type
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[INFO línea ${numLineaOriginalPara}]: Variable de control '${varControlOriginal}' (como '${varControlLc}') definida implícitamente como ${tipoImplicito}.`, 'normal');
    } else {
        ambitoActual[varControlLc].value = valorInicial; // Actualizar valor si ya existe
    }
    let variableControlObj = ambitoActual[varControlLc];

    let cuerpoPara = [];
    let finParaEncontrado = false;
    let anidamientoPara = 0;
    let i = indiceParaEnBloque + 1;

    for (; i < lineasBloqueCompleto.length; i++) {
        const lineaIterOriginal = lineasBloqueCompleto[i];
        const lineaIter = lineaIterOriginal.trim().toLowerCase();
        if (lineaIter.startsWith("para ") && (lineaIter.includes("<-") || lineaIter.includes("=")) && lineaIter.includes(" hasta ") && lineaIter.includes(" hacer")) {
            anidamientoPara++;
            cuerpoPara.push(lineaIterOriginal);
        } else if (lineaIter === "finpara") {
            if (anidamientoPara === 0) {
                finParaEncontrado = true;
                break;
            } else {
                anidamientoPara--;
                cuerpoPara.push(lineaIterOriginal);
            }
        } else {
            cuerpoPara.push(lineaIterOriginal);
        }
    }

    if (!finParaEncontrado) {
        throw new Error(`Se esperaba 'FinPara' para cerrar el bucle 'Para' iniciado en la línea ${numLineaOriginalPara}.`);
    }

    const indiceFinBloquePara = i; // Índice de la línea 'FinPara'

    // Loop de ejecución del Para
    while ((paso > 0 && variableControlObj.value <= valorFinal) || (paso < 0 && variableControlObj.value >= valorFinal)) {
        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        // El offset para ejecutarBloque es el número de línea del 'Para' original.
        await Webgoritmo.Interprete.ejecutarBloque(cuerpoPara, ambitoActual, numLineaOriginalPara);

        if (Webgoritmo.estadoApp.detenerEjecucion) break;

        // Manejo de 'Leer' dentro del bucle Para (si se implementa la lógica de estadoBuclePendiente)
        if (Webgoritmo.estadoApp.esperandoEntrada && Webgoritmo.estadoApp.estadoBuclePendiente) {
             // Si 'Leer' pausó y guardó estado, handlePara debe retornar para que el flujo principal maneje la pausa.
             // La reanudación se gestionará a través de reanudarBuclePendiente.
             // Es importante que el índice que devuelve ejecutarBloque sea el correcto para continuar después del Para.
             // Esto es complejo; la implementación de estadoBuclePendiente debe ser robusta.
             // Por ahora, si hay un estado pendiente, asumimos que el control de flujo se manejará externamente.
            return { nuevoIndiceRelativoAlBloque: indiceFinBloquePara, ejecutarSiguienteIteracion: true }; // Señalizar que se pausó
        }
        variableControlObj.value += paso;
    }
    return { nuevoIndiceRelativoAlBloque: indiceFinBloquePara, ejecutarSiguienteIteracion: false };
};


Webgoritmo.Interprete.llamarFuncion = async function(nombreFunc, args, numLineaLlamada) { /* ... (código MVP placeholder, a ser reemplazado por ejecutarSubProcesoLlamada o similar) ... */
    console.warn(`Llamada a función '${nombreFunc}' no implementada completamente en MVP. Argumentos:`, args, `Línea: ${numLineaLlamada}`);
    // Aquí iría la lógica para buscar en Webgoritmo.estadoApp.funcionesDefinidas
    // y ejecutar el subproceso/función, manejando ámbito y retorno.
    return undefined; // O el valor de retorno de la función
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) { /* ... error ... */ return; }
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) { /* ... error ... */ return; }

    // restablecerEstado es llamado desde app.js
    if (Webgoritmo.UI.añadirSalida) {
        if(Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
        Webgoritmo.UI.añadirSalida("--- Iniciando ejecución ---", "normal");
    }

    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    Webgoritmo.estadoApp.funcionesDefinidas = {};
    const subProcesoLineIndices = new Set();

    if (Webgoritmo.Interprete.parseDefinicionSubProceso) {
        for (let i = 0; i < Webgoritmo.estadoApp.lineasCodigo.length; i++) {
            const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[i];
            let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
            if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
            const lineaLower = lineaParaAnalisis.toLowerCase();
            if (lineaLower.startsWith("subproceso")) {
                try {
                    const defSubProceso = Webgoritmo.Interprete.parseDefinicionSubProceso(lineaOriginal, i, Webgoritmo.estadoApp.lineasCodigo);
                    if (Webgoritmo.estadoApp.funcionesDefinidas.hasOwnProperty(defSubProceso.nombreLc)) {
                        throw new Error(`SubProceso '${defSubProceso.nombreOriginal}' (como '${defSubProceso.nombreLc}') ya definido.`);
                    }
                    Webgoritmo.estadoApp.funcionesDefinidas[defSubProceso.nombreLc] = defSubProceso;
                    for (let k = i; k <= defSubProceso.indiceFinEnTodasLasLineas; k++) {
                        subProcesoLineIndices.add(k);
                    }
                    i = defSubProceso.indiceFinEnTodasLasLineas;
                } catch (e) {
                    Webgoritmo.estadoApp.errorEjecucion = e.message;
                    Webgoritmo.estadoApp.detenerEjecucion = true;
                    break;
                }
            }
            if (Webgoritmo.estadoApp.detenerEjecucion) break;
        }
    } else {
        console.warn("Webgoritmo.Interprete.parseDefinicionSubProceso no está definido. Subprocesos no serán parseados.");
    }

    if (Webgoritmo.estadoApp.detenerEjecucion) {
        if (Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores (Fase de parseo de SubProcesos) ---", "error");
        }
        return;
    }

    let lineasDelPrincipal = [];
    let inicioBloquePrincipalLineaNum = -1;
    let processingState = 'buscar_inicio';
    // Webgoritmo.estadoApp.errorEjecucion = null; // Ya debería estar null o con error de subproceso
    // Webgoritmo.estadoApp.detenerEjecucion = false; // Ya debería estar false o con error de subproceso

    for (let j = 0; j < Webgoritmo.estadoApp.lineasCodigo.length; j++) {
        if (subProcesoLineIndices.has(j)) continue; // Saltar líneas que son parte de un subproceso
        const lineaOriginal = Webgoritmo.estadoApp.lineasCodigo[j];
        let lineaParaAnalisis = lineaOriginal.split('//')[0].trim();
        if (lineaParaAnalisis.startsWith('/*') && lineaParaAnalisis.endsWith('*/')) lineaParaAnalisis = '';
        const lineaLower = lineaParaAnalisis.toLowerCase();

        if (processingState === 'buscar_inicio') {
            if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                inicioBloquePrincipalLineaNum = j + 1;
                processingState = 'en_bloque';
            } else if (lineaParaAnalisis !== "") {
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') fuera de bloque 'Algoritmo'/'Proceso'.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            }
        } else if (processingState === 'en_bloque') {
            if (lineaLower.startsWith("finproceso") || lineaLower.startsWith("finalgoritmo")) {
                processingState = 'bloque_terminado';
            } else if (lineaLower.startsWith("proceso") || lineaLower.startsWith("algoritmo")) {
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Bloques 'Algoritmo'/'Proceso' anidados no permitidos.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            } else {
                lineasDelPrincipal.push(lineaOriginal);
            }
        } else if (processingState === 'bloque_terminado') {
            if (lineaParaAnalisis !== "") {
                Webgoritmo.estadoApp.errorEjecucion = `Error línea ${j+1}: Código ('${lineaOriginal.trim()}') después de 'FinAlgoritmo'/'FinProceso'.`;
                Webgoritmo.estadoApp.detenerEjecucion = true; break;
            }
        }
    }

    if (!Webgoritmo.estadoApp.errorEjecucion) {
        const tieneCodigoEfectivo = Webgoritmo.estadoApp.lineasCodigo.some(l => {
            if (subProcesoLineIndices.has(Webgoritmo.estadoApp.lineasCodigo.indexOf(l))) return false;
            let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';
        });
        if (processingState === 'buscar_inicio' && tieneCodigoEfectivo) {
            Webgoritmo.estadoApp.errorEjecucion = "No se encontró bloque 'Algoritmo'/'Proceso' principal.";
        } else if (processingState === 'en_bloque') {
             Webgoritmo.estadoApp.errorEjecucion = `Bloque 'Algoritmo'/'Proceso' iniciado línea ${inicioBloquePrincipalLineaNum} no fue cerrado correctamente.`;
        }
    }

    if (Webgoritmo.estadoApp.errorEjecucion) {
        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
        Webgoritmo.estadoApp.detenerEjecucion = true;
    } else if (inicioBloquePrincipalLineaNum !== -1 && processingState === 'bloque_terminado') {
        if (lineasDelPrincipal.length > 0) {
            await Webgoritmo.Interprete.ejecutarBloque(lineasDelPrincipal, Webgoritmo.estadoApp.variables, inicioBloquePrincipalLineaNum -1 );
        } else if (Webgoritmo.UI.añadirSalida) {
             Webgoritmo.UI.añadirSalida("Advertencia: Bloque Algoritmo/Proceso vacío.", "warning");
        }
    } else if (inicioBloquePrincipalLineaNum === -1 && !Webgoritmo.estadoApp.lineasCodigo.some(l => {let t=l.split('//')[0].trim(); if(t.startsWith('/*')&&t.endsWith('*/'))t=''; return t !== '';})) {
        // No code at all, not an error.
    }


    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) {
            let mensajeErrorCompleto = Webgoritmo.estadoApp.errorEjecucion;
            // Add call stack if available from sub-process execution
            if (Webgoritmo.estadoApp.pilaLlamadas && Webgoritmo.estadoApp.pilaLlamadas.length > 0) {
                mensajeErrorCompleto += "\nPila de llamadas (SubProcesos):";
                for (let k = Webgoritmo.estadoApp.pilaLlamadas.length - 1; k >= 0; k--) {
                    const frame = Webgoritmo.estadoApp.pilaLlamadas[k];
                    mensajeErrorCompleto += `\n  - En SubProceso '${frame.nombre}' (definido en línea ~${frame.lineaDefinicion}), llamado desde línea ~${frame.lineaLlamada}.`;
                }
            }
            Webgoritmo.UI.añadirSalida(mensajeErrorCompleto, 'error');
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores ---", "error");
        }
        else if (Webgoritmo.estadoApp.detenerEjecucion) { Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida ---", "warning"); }
        else { Webgoritmo.UI.añadirSalida("--- Ejecución finalizada ---", "normal"); }
    }
};

console.log("motorInterprete.js cargado y Webgoritmo.Interprete inicializado (con handleSi y handleLeer).");
