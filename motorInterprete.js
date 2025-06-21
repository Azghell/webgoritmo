// motorInterprete.js
// Contiene el núcleo del intérprete: utilidades, manejadores de instrucciones y motor de ejecución.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) {
    switch (tipo.toLowerCase()) {
        case 'entero': return 0;
        case 'real': return 0.0;
        case 'logico': return false;
        case 'caracter': return '';
        case 'cadena': return '';
        default: return null;
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
        return valor.length === 1 ? 'Caracter' : 'Cadena';
    }
    return 'Desconocido';
};

Webgoritmo.Interprete.dividirArgumentos = function(cadenaArgs) {
    const args = [];
    let enCadena = false;
    let buffer = '';
    for (let i = 0; i < cadenaArgs.length; i++) {
        const char = cadenaArgs[i];
        if (char === '"' || char === "'") {
            enCadena = !enCadena;
            buffer += char;
        } else if (char === ',' && !enCadena) {
            args.push(buffer.trim());
            buffer = '';
        } else {
            buffer += char;
        }
    }
    args.push(buffer.trim());
    return args;
};

Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    tipoDestino = tipoDestino.toLowerCase();
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();

    if (tipoOrigen === tipoDestino || (tipoDestino === 'real' && tipoOrigen === 'entero')) {
        return valor;
    }
    if (typeof valor === 'string') {
        switch (tipoDestino) {
            case 'entero':
                const intVal = parseInt(valor);
                if (isNaN(intVal)) throw new Error(`La entrada '${valor}' no es un entero válido.`);
                return intVal;
            case 'real':
                const floatVal = parseFloat(valor);
                if (isNaN(floatVal)) throw new Error(`La entrada '${valor}' no es un número real válido.`);
                return floatVal;
            case 'logico':
                const lowerVal = valor.toLowerCase();
                if (lowerVal === 'verdadero') return true;
                if (lowerVal === 'falso') return false;
                throw new Error(`La entrada '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
            case 'caracter': return valor.length > 0 ? valor.charAt(0) : '';
            case 'cadena': return valor;
        }
    } else if (typeof valor === 'number') {
        if (tipoDestino === 'entero') return Math.trunc(valor);
        if (tipoDestino === 'cadena' || tipoDestino === 'caracter') return String(valor);
    } else if (typeof valor === 'boolean') {
        if (tipoDestino === 'cadena') return valor ? 'Verdadero' : 'Falso';
    }
    throw new Error(`Incompatibilidad de tipo: no se puede convertir ${tipoOrigen} a ${tipoDestino}.`);
};

// --- MANEJADORES DE INSTRUCCIONES ---
Webgoritmo.Interprete.handleDefinir = function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s+Como\s+(Entero|Real|Logico|Caracter|Cadena)/i);
    if (coincidenciaDefinir) {
        const nombresVariables = coincidenciaDefinir[1].split(',').map(s => s.trim());
        const tipoVariable = coincidenciaDefinir[2].toLowerCase();
        nombresVariables.forEach(nombre => {
            if (ambitoActual.hasOwnProperty(nombre)) {
                Webgoritmo.UI.añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: La variable '${nombre}' ya está definida. Sobrescribiendo.`, 'advertencia');
            }
            ambitoActual[nombre] = { value: Webgoritmo.Interprete.obtenerValorPorDefecto(tipoVariable), type: tipoVariable };
        });
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleDimension = function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDimension = linea.match(/^Dimension\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(\d+(?:\s*,\s*\d+)*)\s*\](?:\s+Como\s+(Entero|Real|Logico|Caracter|Cadena))?/i);
    if (coincidenciaDimension) {
        const nombreArreglo = coincidenciaDimension[1];
        const cadenaDimensiones = coincidenciaDimension[2];
        const tipoBase = (coincidenciaDimension[4] || 'desconocido').toLowerCase();
        const dimensiones = cadenaDimensiones.split(',').map(d => parseInt(d.trim()));

        for (const tamaño of dimensiones) {
            if (isNaN(tamaño) || tamaño <= 0) {
                throw new Error(`Tamaño de dimensión inválido para '${nombreArreglo}': '${tamaño}'. Debe ser un entero positivo.`);
            }
        }
        if (ambitoActual.hasOwnProperty(nombreArreglo)) {
            Webgoritmo.UI.añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: El arreglo '${nombreArreglo}' ya está definido. Sobrescribiendo.`, 'advertencia');
        }

        function crearArregloAnidado(dims, tipo) {
            const tamActual = dims[0];
            const arreglo = Array(tamActual + 1).fill(null);
            if (dims.length === 1) {
                for (let i = 1; i <= tamActual; i++) arreglo[i] = Webgoritmo.Interprete.obtenerValorPorDefecto(tipo);
            } else {
                const subDims = dims.slice(1);
                for (let i = 1; i <= tamActual; i++) arreglo[i] = crearArregloAnidado(subDims, tipo);
            }
            return arreglo;
        }
        const valoresArreglo = crearArregloAnidado(dimensiones, tipoBase);
        ambitoActual[nombreArreglo] = {
            value: valoresArreglo, type: 'array', baseType: tipoBase, dimensions: dimensiones
        };
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleAsignacion = function(linea, ambitoActual, numLineaOriginal) {
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

        if (!(nombreVarAcceso in ambitoActual)) {
            // ... (lógica de advertencia y error si no está definida, usando Webgoritmo.UI.añadirAdvertenciaSugerencia)
            let foundSimilarCaseKey = null;
            for (const key in ambitoActual) {
                if (key.toLowerCase() === nombreVarAcceso.toLowerCase()) { foundSimilarCaseKey = key; break; }
            }
            if (foundSimilarCaseKey) Webgoritmo.UI.añadirAdvertenciaSugerencia(`La variable '${nombreVarAcceso}' no está definida. ¿Quizás quisiste decir '${foundSimilarCaseKey}'?`);
            throw new Error(`La variable o arreglo '${nombreVarAcceso}' no está definida.`);
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
                varMeta.baseType = tipoEsperado; // Podría necesitar reinicializar todo el arreglo con valores por defecto del nuevo tipo.
            }
            subArreglo[indicesValue[indicesValue.length - 1]] = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoEsperado);
        } else {
            if (!varMeta) throw new Error(`Metadatos no encontrados para '${nombreVarAcceso}'.`);
            let tipoDestino = varMeta.type;
            if (tipoDestino === 'desconocido') {
                tipoDestino = Webgoritmo.Interprete.inferirTipo(valorEvaluado).toLowerCase();
                if (tipoDestino === 'desconocido' && valorEvaluado !== null) throw new Error(`Tipo desconocido para inferir tipo de '${nombreVarAcceso}'.`);
                varMeta.type = tipoDestino;
            }
            varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, tipoDestino);
        }
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleEscribir = function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaEscribir = linea.match(/^(Escribir|Imprimir|Mostrar)\s+(.*)/i);
    if (coincidenciaEscribir) {
        const cadenaArgs = coincidenciaEscribir[2];
        const args = Webgoritmo.Interprete.dividirArgumentos(cadenaArgs);
        let partesMensajeSalida = [];
        for (const arg of args) {
            let parteEvaluada;
            if (ambitoActual.hasOwnProperty(arg) && typeof ambitoActual[arg] === 'object' && ambitoActual[arg] !== null && ambitoActual[arg].hasOwnProperty('value')) {
                parteEvaluada = ambitoActual[arg].value;
                if (ambitoActual[arg].type === 'array') {
                    // TODO: Implementar formateo de arreglos multidimensionales para salida
                    parteEvaluada = JSON.stringify(parteEvaluada.slice(1)); // Simplificado, quita el null de la base 0
                }
            } else {
                parteEvaluada = Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
            }
            if (typeof parteEvaluada === 'boolean') partesMensajeSalida.push(parteEvaluada ? 'Verdadero' : 'Falso');
            else if (parteEvaluada === undefined || parteEvaluada === null) partesMensajeSalida.push('nulo');
            else partesMensajeSalida.push(parteEvaluada);
        }
        Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(' '), 'normal');
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleLeer = async function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaLeer = linea.match(/^Leer\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\[.+?\])?(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*(?:\[.+?\])?)*)/i);
    if (coincidenciaLeer) {
        const destinosCompletos = coincidenciaLeer[1].split(',').map(s => s.trim());
        if (destinosCompletos.length > 1) Webgoritmo.UI.añadirSalida(`[ADVERTENCIA]: Leer con múltiples variables espera valores separados por espacio/coma.`, 'advertencia');

        if (Webgoritmo.DOM.consoleInputArea) Webgoritmo.DOM.consoleInputArea.classList.remove('oculto');
        Webgoritmo.DOM.entradaConsola.disabled = false;
        Webgoritmo.DOM.entradaConsola.readOnly = false;
        Webgoritmo.UI.añadirSalida('Escribe tu entrada aquí...', 'input-prompt');
        requestAnimationFrame(() => { Webgoritmo.DOM.entradaConsola.focus(); Webgoritmo.DOM.entradaConsola.select(); });
        Webgoritmo.DOM.btnEnviarEntrada.disabled = false;
        Webgoritmo.estadoApp.esperandoEntrada = true;
        Webgoritmo.estadoApp.variableEntradaActual = destinosCompletos;

        await new Promise(resolve => {
            Webgoritmo.estadoApp.resolverPromesaEntrada = resolve;
            if (Webgoritmo.estadoApp.detenerEjecucion) resolve();
        });
        if(Webgoritmo.estadoApp.detenerEjecucion) return true;
        // La lógica de procesamiento de la entrada se queda en el event listener de app.js por ahora
        return true;
    }
    return false;
};

// Definiciones de handleSi, handlePara, handleMientras, handleRepetir, handleSegun,
// handleLlamadaFuncion (el que parsea la línea), handleRetornar
// irían aquí, adaptadas para usar Webgoritmo.Namespace.funcion()

// Ejemplo adaptado de handleSi:
Webgoritmo.Interprete.handleSi = async function(linea, ambitoActual, numLineaOriginal, lineasBloque, currentLineIndex) {
    const siMatch = linea.match(/^Si\s+(.*)\s+Entonces$/i);
    if (siMatch) {
        let condition = Webgoritmo.Expresiones.evaluarExpresion(siMatch[1], ambitoActual);
        // ... resto de la lógica de handleSi, llamando a Webgoritmo.Interprete.ejecutarBloque ...
        // (Es largo, no lo replico todo)
        return true; // o el nuevo índice j
    }
    return false;
};
// ... (Los demás handlers seguirían un patrón similar de adaptación)


// --- MOTOR DE EJECUCIÓN ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineasBloque, ambitoActual, desplazamientoLineaOriginal = 0) {
    if (Webgoritmo.estadoApp.detenerEjecucion) return;
    for (let i = 0; i < lineasBloque.length; i++) {
        if (Webgoritmo.estadoApp.detenerEjecucion) return;
        const lineaCompleta = lineasBloque[i];
        const numLineaOriginal = desplazamientoLineaOriginal + i + 1;
        let linea = lineaCompleta.trim();
        // ... (manejo de comentarios) ...
        if (linea === '') continue;
        try {
            let handled = false;
            // Llamadas a los Webgoritmo.Interprete.handle<Nombre>
            if (await Webgoritmo.Interprete.handleDefinir(linea, ambitoActual, numLineaOriginal)) handled = true;
            else if (await Webgoritmo.Interprete.handleDimension(linea, ambitoActual, numLineaOriginal)) handled = true;
            // ... etc. para todos los handlers ...
            else if (linea.toLowerCase().startsWith('si ')) { /* Usa Webgoritmo.Interprete.handleSi */ }
            // ...
            else if (await Webgoritmo.Interprete.handleLlamadaFuncion(linea, ambitoActual, numLineaOriginal)) handled = true;

            if (!handled) throw new Error(`Instrucción no reconocida: '${linea}'`);
        } catch (e) {
            Webgoritmo.UI.añadirSalida(`[ERROR en línea ${numLineaOriginal}]: ${e.message}`, 'error');
            Webgoritmo.estadoApp.errorEjecucion = e.message;
            Webgoritmo.estadoApp.detenerEjecucion = true;
            if (Webgoritmo.estadoApp.resolverPromesaEntrada) {
                Webgoritmo.estadoApp.resolverPromesaEntrada();
                Webgoritmo.estadoApp.resolverPromesaEntrada = null;
            }
            return;
        }
    }
};

Webgoritmo.Interprete.llamarFuncion = async function(nombreFunc, args, numLineaLlamada) {
    const func = Webgoritmo.estadoApp.funciones[nombreFunc.toLowerCase()];
    if (!func) { /* error usando Webgoritmo.UI.añadirSalida */ return; }
    if (args.length !== func.params.length) { /* error usando Webgoritmo.UI.añadirSalida */ return; }
    const ambitoFuncion = {};
    for (let k = 0; k < func.params.length; k++) {
        ambitoFuncion[func.params[k]] = { value: args[k], type: Webgoritmo.Interprete.inferirTipo(args[k]).toLowerCase() };
    }
    const estadoAnteriorDetener = Webgoritmo.estadoApp.detenerEjecucion;
    Webgoritmo.estadoApp.detenerEjecucion = false;
    await Webgoritmo.Interprete.ejecutarBloque(func.body, ambitoFuncion, func.lineaInicio + 1);
    const valorRetornado = ambitoFuncion._valor_retorno_;
    Webgoritmo.estadoApp.detenerEjecucion = estadoAnteriorDetener || Webgoritmo.estadoApp.detenerEjecucion;
    if (func.returnVar && valorRetornado === undefined && !Webgoritmo.estadoApp.detenerEjecucion) { /* error usando Webgoritmo.UI.añadirSalida */ }
    return valorRetornado;
};

Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (Webgoritmo.estadoApp.ejecucionEnCurso && Webgoritmo.DOM && Webgoritmo.DOM.btnEjecutarCodigo) { // Prevenir ejecuciones múltiples
        // Esta lógica de botón debería estar en app.js o uiManager.js
    } else if (Webgoritmo.DOM && Webgoritmo.DOM.btnEjecutarCodigo) { // Asegurar que el botón exista
        Webgoritmo.estadoApp.ejecucionEnCurso = true;
        Webgoritmo.DOM.btnEjecutarCodigo.innerHTML = '<i class="fas fa-stop"></i> Detener';
        Webgoritmo.DOM.btnEjecutarCodigo.title = "Detener Ejecución";
    }

    if (typeof Webgoritmo.restablecerEstado === "function") Webgoritmo.restablecerEstado(); // De app.js

    Webgoritmo.UI.añadirSalida("--------------------", 'normal');
    Webgoritmo.UI.añadirSalida("Ejecutando código...", 'normal');
    Webgoritmo.UI.añadirSalida("--------------------", 'normal');

    // Webgoritmo.estadoApp.detenerEjecucion ya es false por restablecerEstado()
    // Webgoritmo.estadoApp.errorEjecucion ya es null por restablecerEstado()

    const codigo = Webgoritmo.Editor.editorCodigo.getValue();
    Webgoritmo.estadoApp.lineasCodigo = codigo.split('\n');
    Webgoritmo.estadoApp.indiceLineaActual = 0;

    // ... (Pre-parseo de funciones, adaptado para usar Webgoritmo.estadoApp.funciones) ...
    // ... (Lógica de encontrar Proceso/Algoritmo y validaciones, adaptado) ...
    // ... (Llamada a Webgoritmo.Interprete.ejecutarBloque, adaptado) ...

    // Bloque final adaptado
    if (!Webgoritmo.estadoApp.esperandoEntrada) {
        if (Webgoritmo.estadoApp.detenerEjecucion && !Webgoritmo.estadoApp.errorEjecucion) {
             Webgoritmo.UI.añadirSalida("--------------------", 'normal');
             Webgoritmo.UI.añadirSalida("Ejecución interrumpida por el usuario.", 'normal');
        } else if (!Webgoritmo.estadoApp.errorEjecucion) {
            Webgoritmo.UI.añadirSalida("--------------------", 'normal');
            Webgoritmo.UI.añadirSalida("Ejecución finalizada.", 'normal');
        } else {
            Webgoritmo.UI.añadirSalida("--------------------", 'normal');
            Webgoritmo.UI.añadirSalida("Ejecución detenida debido a un error.", 'error');
        }

        if (Webgoritmo.DOM && Webgoritmo.DOM.btnEjecutarCodigo) { // Asegurar que exista
            Webgoritmo.DOM.btnEjecutarCodigo.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
            Webgoritmo.DOM.btnEjecutarCodigo.title = "Ejecutar Código (Ctrl+R)";
        }
    }
    Webgoritmo.estadoApp.ejecucionEnCurso = false; // Asegurar que esto se setee siempre al final

    if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarPanelVariables === "function") {
        Webgoritmo.UI.actualizarPanelVariables();
    }
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) {
        Webgoritmo.Editor.editorCodigo.refresh();
    }
};

// Nota: Faltaría replicar y adaptar todos los handle<Instruccion> y la lógica interna
// de ejecutarPseudocodigo (pre-parseo, búsqueda de bloque principal) de forma completa.
// Esto es una representación estructural de cómo se vería.
