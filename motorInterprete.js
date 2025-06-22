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
    // Asumimos que Webgoritmo.Interprete.inferirTipo está disponible
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
        if (tipoDestinoLower === 'caracter') return String(valor).charAt(0) || ''; // Devuelve cadena vacía si el número es 0 y se convierte a "0"
    } else if (typeof valor === 'boolean') {
        if (tipoDestinoLower === 'cadena') return valor ? 'Verdadero' : 'Falso';
        if (tipoDestinoLower === 'entero') return valor ? 1 : 0;
        if (tipoDestinoLower === 'real') return valor ? 1.0 : 0.0;
    }
    throw new Error(`Incompatibilidad de tipo MVP: no se puede convertir ${tipoOrigen} a ${tipoDestinoLower}.`);
};

// --- MANEJADORES DE INSTRUCCIONES (MVP) ---
Webgoritmo.Interprete.handleDefinir = function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s+Como\s+(Entero|Real|Logico|Caracter|Cadena)/i);
    if (coincidenciaDefinir) {
        const nombresVariables = coincidenciaDefinir[1].split(',').map(s => s.trim());
        const tipoVariable = coincidenciaDefinir[2]; // Mantener casing para el 'type' almacenado

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
    const coincidenciaAsignacion = linea.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*<-\s*(.*)/); // MVP: solo variables simples
    if (coincidenciaAsignacion) {
        const nombreVar = coincidenciaAsignacion[1];
        const expresion = coincidenciaAsignacion[2].trim();

        if (!ambitoActual.hasOwnProperty(nombreVar)) {
            throw new Error(`Variable '${nombreVar}' no ha sido definida (en línea ${numLineaOriginal}).`);
        }

        const valorEvaluado = Webgoritmo.Expresiones.evaluarExpresion(expresion, ambitoActual);
        const varMeta = ambitoActual[nombreVar];

        varMeta.value = Webgoritmo.Interprete.convertirValorParaAsignacion(valorEvaluado, varMeta.type);
        return true;
    }
    return false;
};

Webgoritmo.Interprete.handleEscribir = function(linea, ambitoActual, numLineaOriginal) {
    const coincidenciaEscribir = linea.match(/^(Escribir|Imprimir|Mostrar)\s+(.*)/i);
    if (coincidenciaEscribir) {
        const cadenaArgs = coincidenciaEscribir[2];
        const args = cadenaArgs.split(',').map(arg => arg.trim()); // Simplificación MVP
        let partesMensajeSalida = [];
        for (const arg of args) {
            const parteEvaluada = Webgoritmo.Expresiones.evaluarExpresion(arg, ambitoActual);
            if (typeof parteEvaluada === 'boolean') {
                partesMensajeSalida.push(parteEvaluada ? 'Verdadero' : 'Falso');
            } else if (parteEvaluada === null) { // undefined es manejado por String() como "undefined"
                partesMensajeSalida.push('nulo');
            } else {
                partesMensajeSalida.push(String(parteEvaluada));
            }
        }
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
            Webgoritmo.UI.añadirSalida(partesMensajeSalida.join(''), 'normal'); // Unir sin espacio por defecto
        }
        return true;
    }
    return false;
};

// --- MOTOR DE EJECUCIÓN (MVP) ---
Webgoritmo.Interprete.ejecutarBloque = async function(lineas, ambitoActual, numLineaOriginalOffset = 0) {
    if (!Webgoritmo.estadoApp) { console.error("ejecutarBloque: Webgoritmo.estadoApp no definido."); return; }

    for (let i = 0; i < lineas.length; i++) {
        if (Webgoritmo.estadoApp.detenerEjecucion) {
            console.log("MVP: Detención de ejecución solicitada en ejecutarBloque.");
            break;
        }
        const lineaOriginal = lineas[i];
        const lineaTrimmed = lineaOriginal.trim();
        const numLineaActual = numLineaOriginalOffset + i + 1;

        if (lineaTrimmed === '' || lineaTrimmed.startsWith('//')) {
            continue;
        }

        let instruccionManejada = false;
        try {
            // Para MVP, el orden de los handlers es simple.
            if (lineaTrimmed.toLowerCase().startsWith('definir')) { // Más específico
                 instruccionManejada = await Webgoritmo.Interprete.handleDefinir(lineaTrimmed, ambitoActual, numLineaActual);
            } else if (lineaTrimmed.match(/^(escribir|imprimir|mostrar)/i)) { // Escribir/Imprimir/Mostrar
                 instruccionManejada = await Webgoritmo.Interprete.handleEscribir(lineaTrimmed, ambitoActual, numLineaActual);
            } else if (lineaTrimmed.includes('<-')) { // Asignación
                 instruccionManejada = await Webgoritmo.Interprete.handleAsignacion(lineaTrimmed, ambitoActual, numLineaActual);
            }
            // Añadir más 'else if' para otros handlers en el futuro (Leer, Si, Para, etc.)

            if (!instruccionManejada && lineaTrimmed) { // Si no fue manejada y no es una línea vacía (después de comentarios)
                throw new Error(`Instrucción no reconocida o no soportada en MVP: '${lineaTrimmed}'`);
            }
        } catch (e) {
            Webgoritmo.estadoApp.errorEjecucion = `Error en línea ${numLineaActual}: ${e.message}`;
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
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) {
        console.error("ejecutarPseudocodigo: Editor no inicializado.");
        if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("[ERROR]: El editor no está listo.", "error");
        return;
    }
    if (!Webgoritmo.estadoApp || !Webgoritmo.UI || !Webgoritmo.Expresiones || !Webgoritmo.Interprete) {
        console.error("ejecutarPseudocodigo: Módulos Webgoritmo esenciales no definidos.");
        return;
    }

    // restablecerEstado es llamado por el listener del botón en app.js ANTES de llamar a esta función.
    // Aquí solo nos preocupamos por la lógica de ejecución.

    if (Webgoritmo.UI.añadirSalida) {
        if(Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = '';
        Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (MVP) ---", "normal");
    }

    Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    // Webgoritmo.estadoApp.detenerEjecucion ya es false debido a restablecerEstado.
    // Webgoritmo.estadoApp.errorEjecucion ya es null debido a restablecerEstado.

    // MVP no tiene Proceso/Algoritmo, ejecuta todas las líneas.
    // El ámbito principal es Webgoritmo.estadoApp.variables.
    await Webgoritmo.Interprete.ejecutarBloque(Webgoritmo.estadoApp.lineasCodigo, Webgoritmo.estadoApp.variables, 0);

    if (Webgoritmo.UI.añadirSalida) {
        if (Webgoritmo.estadoApp.errorEjecucion) {
            Webgoritmo.UI.añadirSalida("--- Ejecución con errores (MVP) ---", "error");
        } else if (Webgoritmo.estadoApp.detenerEjecucion) { // Detenido por el usuario o un error no capturado por errorEjecucion
             Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida (MVP) ---", "warning");
        }else {
            Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (MVP) ---", "normal");
        }
    }

    // La lógica para resetear el botón de ejecutar/detener y estadoApp.ejecucionEnCurso
    // se encuentra en el listener de app.js, que se ejecuta después de que esta promesa resuelva.
    // Lo mismo para actualizar el panel de variables.
};

console.log("motorInterprete.js cargado y Webgoritmo.Interprete inicializado (MVP).");
