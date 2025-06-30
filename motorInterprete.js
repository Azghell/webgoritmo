// motorInterprete.js - Reconstrucción Incremental - Bloque 1

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = Webgoritmo.Interprete || {};

// --- FUNCIONES DE UTILIDAD DEL INTÉRPRETE (Bloque 1) ---
Webgoritmo.Interprete.obtenerValorPorDefecto = function(tipo) {
    const tipoLower = String(tipo).toLowerCase();
    switch (tipoLower) {
        case 'entero': return 0;
        case 'real': return 0.0;
        case 'logico': return false;
        case 'caracter': return '';
        case 'cadena': return '';
        case 'numero': return 0; // Tipo genérico numérico
        default:
            console.warn(`Tipo '${tipo}' no reconocido en obtenerValorPorDefecto. Usando null.`);
            return null;
    }
};

Webgoritmo.Interprete.inferirTipo = function(valor) {
    if (typeof valor === 'number') {
        return Number.isInteger(valor) ? 'entero' : 'real';
    }
    if (typeof valor === 'boolean') {
        return 'logico';
    }
    if (typeof valor === 'string') {
        return 'cadena'; // Simplificado, podría ser 'caracter' si longitud es 1.
    }
    return 'desconocido';
};

Webgoritmo.Interprete.convertirValorParaAsignacion = function(valor, tipoDestino) {
    const tipoDestinoLower = String(tipoDestino).toLowerCase();
    const tipoOrigen = Webgoritmo.Interprete.inferirTipo(valor).toLowerCase();

    // Casos simples
    if (tipoOrigen === tipoDestinoLower && tipoDestinoLower !== 'desconocido') return valor;
    if (tipoDestinoLower === 'real' && tipoOrigen === 'entero') return parseFloat(valor); // Un entero es un real
    if (tipoDestinoLower === 'numero') { // Acepta entero o real si el destino es 'numero'
        if (tipoOrigen === 'entero' || tipoOrigen === 'real') return valor;
    }


    if (typeof valor === 'string') {
        const valTrimmed = valor.trim();
        switch (tipoDestinoLower) {
            case 'entero':
                const intVal = parseInt(valTrimmed, 10);
                if (isNaN(intVal) || String(intVal) !== valTrimmed.replace(/^0+/, '') && valTrimmed !== '0') { // Manejar "007" vs "7"
                    throw new Error(`La cadena '${valor}' no es un entero válido.`);
                }
                return intVal;
            case 'real':
            case 'numero': // Permitir asignación de cadena a 'numero' si es convertible
                if (valTrimmed === "") throw new Error(`La cadena vacía no es un número real válido.`);
                const numRepresentation = Number(valTrimmed);
                if (!isFinite(numRepresentation)) { // Chequea NaN, Infinity
                    throw new Error(`La cadena '${valor}' no es un número real válido.`);
                }
                return numRepresentation;
            case 'logico':
                const lowerVal = valTrimmed.toLowerCase();
                if (lowerVal === 'verdadero' || lowerVal === 'v') return true;
                if (lowerVal === 'falso' || lowerVal === 'f') return false;
                throw new Error(`La cadena '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
            case 'caracter':
                return valTrimmed.length > 0 ? valTrimmed.charAt(0) : ''; // Tomar el primer caracter
            case 'cadena':
                return valor; // Ya es cadena
        }
    } else if (typeof valor === 'number') { // Origen es numérico (entero o real)
        switch (tipoDestinoLower) {
            case 'entero': return Math.trunc(valor);
            case 'real': return valor; // Ya es número, puede ser real
            case 'numero': return valor; // Ya es número
            case 'cadena': return String(valor);
            case 'caracter': return String(valor).charAt(0) || ''; // Tomar primer dígito como caracter
            case 'logico': throw new Error(`No se puede convertir directamente un número a lógico. Use una comparación.`);
        }
    } else if (typeof valor === 'boolean') { // Origen es lógico
         switch (tipoDestinoLower) {
            case 'entero': return valor ? 1 : 0;
            case 'real': return valor ? 1.0 : 0.0;
            case 'numero': return valor ? 1 : 0;
            case 'cadena': return valor ? 'Verdadero' : 'Falso';
            case 'logico': return valor; // Ya es lógico
            case 'caracter': throw new Error(`No se puede convertir directamente un lógico a caracter.`);
        }
    }

    // Si ninguna conversión fue posible
    throw new Error(`Incompatibilidad de tipo: no se puede convertir '${tipoOrigen}' (valor: ${valor}) a '${tipoDestinoLower}'.`);
};

Webgoritmo.Interprete.inicializarArray = function(dimensions, baseType) {
    // Implementación simplificada o placeholder por ahora si es compleja
    // Por ahora, solo nos aseguramos que la función exista.
    // La lógica original era:
    const defaultValue = Webgoritmo.Interprete.obtenerValorPorDefecto(baseType);
    function crearDimension(dimIndex) {
        const dimensionSize = dimensions[dimIndex];
        if (typeof dimensionSize !== 'number' || !Number.isInteger(dimensionSize) || dimensionSize <= 0) {
            throw new Error(`Las dimensiones de un arreglo deben ser números enteros positivos. Se encontró: ${dimensionSize}.`);
        }
        let arr = new Array(dimensionSize + 1); // PSeInt es base 1
        if (dimIndex === dimensions.length - 1) {
            // Última dimensión, llenar con valores por defecto
            for (let i = 1; i <= dimensionSize; i++) arr[i] = defaultValue;
        } else {
            // Dimensión anidada, llamar recursivamente
            for (let i = 1; i <= dimensionSize; i++) arr[i] = crearDimension(dimIndex + 1);
        }
        return arr;
    }
    if (!dimensions || dimensions.length === 0) throw new Error("No se pueden inicializar arreglos sin dimensiones.");
    return crearDimension(0);
};


// --- ESQUELETO DE EJECUCIÓN (Bloque 1) ---
Webgoritmo.Interprete.ejecutarPseudocodigo = async function() {
    if (!Webgoritmo.UI || !Webgoritmo.UI.añadirSalida) {
        console.error("Webgoritmo.UI.añadirSalida no está disponible.");
        return;
    }
    if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) {
        Webgoritmo.UI.añadirSalida("Error: El editor de código no está listo.", "error");
        return;
    }
     if (!Webgoritmo.estadoApp) {
        Webgoritmo.UI.añadirSalida("Error: El estado de la aplicación no está listo.", "error");
        return;
    }


    Webgoritmo.UI.añadirSalida("--- Iniciando ejecución (Reconstrucción Incremental - Bloque 1) ---", "normal");

    // Lógica de ejecución muy simplificada por ahora
    // const lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
    // Webgoritmo.UI.añadirSalida(`Se leyeron ${lineasCodigo.length} líneas de código.`, "normal");
    // Webgoritmo.UI.añadirSalida("El intérprete actual (Bloque 1) solo muestra este mensaje y no ejecuta el código.", "warning");

    // Simular una ejecución muy simple o solo verificar dependencias
    try {
        Webgoritmo.estadoApp.lineasCodigo = Webgoritmo.Editor.editorCodigo.getValue().split('\n');
        Webgoritmo.UI.añadirSalida("Líneas de código obtenidas. El intérprete (Bloque 1) no las procesará aún.", "normal");

        // Intentar usar una de las funciones de utilidad para ver si están definidas
        const tipoTest = Webgoritmo.Interprete.inferirTipo(123);
        Webgoritmo.UI.añadirSalida(`Prueba de inferirTipo(123): ${tipoTest}`, "normal");

        const conversionTest = Webgoritmo.Interprete.convertirValorParaAsignacion("10.5", "real");
        Webgoritmo.UI.añadirSalida(`Prueba de convertirValorParaAsignacion("10.5", "real"): ${conversionTest}`, "normal");

    } catch (e) {
        Webgoritmo.UI.añadirSalida(`Error durante la ejecución simulada del Bloque 1: ${e.message}`, "error");
        console.error("Error en Bloque 1:", e);
    }

    Webgoritmo.UI.añadirSalida("--- Ejecución finalizada (Reconstrucción Incremental - Bloque 1) ---", "normal");
};

console.log("motorInterprete.js (Reconstrucción Incremental - BLOQUE 1) cargado.");
console.log("Funciones de utilidad básicas y esqueleto de ejecutarPseudocodigo deberían estar definidos.");
console.log("Webgoritmo.Interprete:", Webgoritmo.Interprete);
