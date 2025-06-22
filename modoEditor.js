// modoEditor.js
// Contiene la definición del modo "pseint" de CodeMirror,
// lógica de sugerencias, y la inicialización del editor.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Editor = Webgoritmo.Editor || {};

Webgoritmo.Editor.editorCodigo = null;

Webgoritmo.Editor.sugerencias = [
    { keyword: 'definir', title: 'Definir Variable', tip: 'Declara una variable con un tipo de dato específico (Entero, Real, Logico, Caracter, Cadena).', code: 'Definir [nombre_variable] Como [TipoDato]' },
    { keyword: 'dimension', title: 'Dimensionar Arreglo', tip: 'Declara un arreglo (array) con un tamaño fijo y opcionalmente un tipo base.', code: 'Dimension miArreglo[tamaño] Como TipoDato' },
    { keyword: 'escribir', title: 'Escribir / Mostrar / Imprimir', tip: 'Muestra mensajes de texto o el valor de variables en la consola. Puedes concatenar con comas.', code: 'Escribir "Hola Mundo", miVariable' },
    {
        keyword: 'leer',
        title: 'Leer / Entrada de Datos',
        tip: 'Lee uno o más valores ingresados por el usuario desde la consola y los asigna a las variables especificadas.',
        code: 'Leer variable1\n// Para múltiples variables:\nLeer varA, varB, varC'
    },
    {
        keyword: 'si',
        title: 'Si-Entonces-Sino',
        tip: 'Ejecuta un bloque de código si una condición es Verdadera, y opcionalmente otro (Sino) o condiciones adicionales (SinoSi) si es Falsa.',
        code: 'Si <condición> Entonces\n\t// Acciones si la condición es Verdadera\nSinoSi <otra_condición> Entonces\n\t// Acciones si la otra condición es Verdadera\nSino\n\t// Acciones si ninguna condición anterior fue Verdadera\nFinSi'
    },
    {
        keyword: 'entonces',
        title: 'Entonces (parte de Si)',
        tip: 'Palabra clave que sigue a la condición en una estructura Si o SinoSi.',
        code: 'Si <condición> Entonces\n\t...'
    },
    {
        keyword: 'sino',
        title: 'Sino (parte de Si)',
        tip: 'Define el bloque de código a ejecutar si la condición del Si (y SinoSi anteriores) es Falsa.',
        code: 'Si <condición> Entonces\n\t...\nSino\n\t// Acciones si Falso\nFinSi'
    },
    {
        keyword: 'sinosi',
        title: 'SinoSi (parte de Si)',
        tip: 'Define una condición adicional y un bloque de código si la condición del Si principal (y SinoSi anteriores) es Falsa.',
        code: 'Si <condición1> Entonces\n\t...\nSinoSi <condición2> Entonces\n\t// Acciones si condición2 es Verdadera\nFinSi'
    },
    {
        keyword: 'finsi',
        title: 'FinSi (cierre de Si)',
        tip: 'Palabra clave que finaliza una estructura condicional Si-Entonces.',
        code: 'Si <condición> Entonces\n\t...\nFinSi'
    },
    { keyword: 'para', title: 'Para-Hasta-Hacer', tip: 'Bucle que se repite un número definido de veces, con un un valor inicial, final y paso.', code: 'Para i <- inicio Hasta fin Con Paso paso Hacer\n\t// Código a repetir\nFinPara' },
    { keyword: 'mientras', title: 'Mientras-Hacer', tip: 'Bucle que se repite mientras una condición booleana sea Verdadera. El código dentro se ejecuta cero o más veces.', code: 'Mientras condicion Hacer\n\t// Código a repetir\nFinMientras' },
    { keyword: 'repetir', title: 'Repetir-Hasta Que', tip: 'Bucle que se ejecuta al menos una vez y se repite hasta que una condición booleana sea Verdadera.', code: 'Repetir\n\t// Código a repetir\nHasta Que condicion' },
    { keyword: 'segun', title: 'Segun-Hacer', tip: 'Estructura de selección múltiple que ejecuta diferentes bloques de código según el valor de una expresión.', code: 'Segun variable Hacer\n\tvalor1:\n\t\t// Código para valor1\n\tvalor2:\n\t\t// Código para valor2\n\tDe Otro Modo:\n\t\t// Código para otros valores\nFinSegun' },
    { keyword: 'funcion', title: 'Funcion / SubProceso', tip: 'Define un bloque de código reutilizable que puede o no retornar un valor.', code: 'Funcion [resultado] = [nombre_funcion]([parametros])\n\t// Código de la función\nFinFuncion' },
    { keyword: 'proceso', title: 'Proceso / Algoritmo', tip: 'Define el bloque principal donde comienza y termina la ejecución de tu algoritmo.', code: 'Proceso [NombreDelProceso]\n\t// Tu código aquí\nFinProceso' },
    { keyword: '//', title: 'Comentario de una línea', tip: 'Ignora el texto desde // hasta el final de la línea.', code: '// Este es un comentario' },
    { keyword: '/*', title: 'Comentario de múltiples líneas', tip: 'Ignora el texto entre /* y */.', code: '/* Este es\\n   un comentario\\n   de varias líneas */' }
];

Webgoritmo.Editor.insertarSugerencia = function(codigoSugerido, charsARemover) {
    // ... (código como antes, usando Webgoritmo.Editor.editorCodigo y Webgoritmo.Editor.actualizarSugerencias) ...
    if (!Webgoritmo.Editor.editorCodigo) { console.error("[ERROR]: Editor no inicializado."); return; }
    const editor = Webgoritmo.Editor.editorCodigo; const cursor = editor.getCursor();
    const inicio = { line: cursor.line, ch: cursor.ch - charsARemover };
    editor.replaceRange(codigoSugerido, inicio, cursor); editor.focus();
    if (Webgoritmo.Editor.actualizarSugerencias) Webgoritmo.Editor.actualizarSugerencias();
};

Webgoritmo.Editor.actualizarSugerencias = function() {
    // ... (código como antes, usando Webgoritmo.DOM.listaSugerencias, Webgoritmo.UI.añadirAlertaSintaxis, etc.) ...
    if (!Webgoritmo.Editor.editorCodigo || !Webgoritmo.DOM || !Webgoritmo.DOM.listaSugerencias) return;
    Webgoritmo.DOM.listaSugerencias.innerHTML = ''; const editor = Webgoritmo.Editor.editorCodigo;
    const codigo = editor.getValue(); const cursor = editor.getCursor();
    const contenidoLinea = editor.getLine(cursor.line);
    const textoActual = contenidoLinea.substring(0, cursor.ch).match(/([\w\s]+)$/);
    const palabraActual = textoActual ? textoActual[1].trimStart().toLowerCase() : "";
    let sugerenciasEncontradas = false, alertasSintaxisEncontradas = false;
    const codigoLimpio = codigo.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const verificarBalance = (abrir, cerrar) => { /* ... (lógica como antes, usando Webgoritmo.UI.añadirAlertaSintaxis) ... */ };
    verificarBalance('Si', 'FinSi'); // Y otros balances
    // ... (resto de la lógica de actualizarSugerencias) ...
    if (palabraActual.length > 0) {
        const sugerenciasFiltradas = Webgoritmo.Editor.sugerencias.filter(sug => sug.keyword.toLowerCase().startsWith(palabraActual));
        if (sugerenciasFiltradas.length > 0) {
            sugerenciasFiltradas.forEach(sug => { /* ... crear y añadir li ... */ });
            sugerenciasEncontradas = true;
        }
    }
    if (!sugerenciasEncontradas && !alertasSintaxisEncontradas && Webgoritmo.DOM.listaSugerencias) { /* ... añadir mensaje por defecto ... */ }
};

CodeMirror.defineMode("pseint", function() {
    const keywordsControl = [
        "Proceso", "Algoritmo", "FinProceso", "FinAlgoritmo",
        "Si", "Entonces", "Sino", "FinSi", "SinoSi",
        "Para", "Hasta", "Con", "Paso", "Hacer", "FinPara",
        "Mientras", "FinMientras",
        "Repetir", "Hasta Que",
        "Segun", "De Otro Modo", "FinSegun",
        "Funcion", "SubProceso", "Subrutina", "Procedimiento",
        "FinFuncion", "FinSubProceso", "FinSubrutina", "FinProcedimiento",
        "Retornar"
    ].map(k => k.toLowerCase());

    const keywordsDefinition = ["Definir", "Como", "Dimension"].map(k => k.toLowerCase());
    const types = ["Entero", "Real", "Logico", "Caracter", "Cadena", "Numerico", "Numero"].map(k => k.toLowerCase());

    const builtInFunctions = [ // Asegurar que Leer esté aquí
        "Escribir", "Imprimir", "Mostrar", "Leer",
        "Abs", "RC", "Sen", "Cos", "Tan", "Ln", "Exp", "Azar", "Aleatorio", "Trunc", "Redon",
        "Longitud", "Subcadena", "Mayusculas", "Minusculas", "ConvertirATexto", "ConvertirANumero",
        "LimpiarPantalla", "EsperarTecla", "Esperar"
    ].map(k => k.toLowerCase());

    const literals = ["Verdadero", "Falso", "PI", "E"].map(k => k.toLowerCase());
    const operatorsTextual = ["Y", "O", "No", "Mod", "Div"].map(k => k.toLowerCase());

    const regexIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*/;
    const regexOperators = /^(<-|<=|>=|==|<>|<|>|\+|-|\*|\/|\^|%)/;

    return {
        startState: function() { return { inBlockComment: false }; },
        token: function(stream, state) {
            // ... (lógica de tokenización como antes, asegurando que 'leer' sea tokenizado como 'builtin-function') ...
            if (state.inBlockComment) { /* ... */ }
            if (stream.match("/*")) { /* ... */ }
            if (stream.match("//")) { /* ... */ }
            if (stream.match(/^"(?:[^\\]|\\.)*?(?:"|$)/) || stream.match(/^'(?:[^\\]|\\.)*?(?:'|$)/)) return "string";
            if (stream.match(regexOperators)) return "operator";
            if (stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)) return "number";

            let wordMatch;
            if (wordMatch = stream.match(regexIdentifier)) { // Asignación y comprobación
                const word = wordMatch[0].toLowerCase();
                if (keywordsControl.includes(word)) return "keyword-control";
                if (builtInFunctions.includes(word)) return "builtin-function"; // 'leer' caerá aquí
                if (keywordsDefinition.includes(word)) return "keyword-definition";
                if (types.includes(word)) return "type";
                if (literals.includes(word)) return "literal-boolean";
                if (operatorsTextual.includes(word)) return "operator-logic";
                return "variable";
            }
            if (stream.match(/[(){}[\]]/)) return "punctuation";
            stream.next();
            return null;
        }
    };
});

Webgoritmo.Editor.inicializarEditor = function() {
    // ... (código como antes, usando document.getElementById('code-input') y llamando a Webgoritmo.UI.cargarPlantillaInicial, etc.) ...
    console.log("modoEditor.js: Entrando a inicializarEditor... (CORREGIDO v3)");
    const localEditorTextArea = document.getElementById('code-input');
    if (!localEditorTextArea) { /* ... error ... */ return; }
    console.log("modoEditor.js: Textarea #code-input encontrado por getElementById.");
    try {
        if (typeof CodeMirror === 'undefined') { /* ... error ... */ return; }
        Webgoritmo.Editor.editorCodigo = CodeMirror.fromTextArea(localEditorTextArea, {
            mode: "pseint", lineNumbers: true, matchBrackets: true, autofocus: true,
            theme: 'dracula', styleActiveLine: true, foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });
        console.log("modoEditor.js: CodeMirror inicializado OK (modo pseint)."); // Cambiado a modo pseint
        // Llamadas iniciales a funciones de UI y Editor
        if (Webgoritmo.UI && typeof Webgoritmo.UI.cargarPlantillaInicial === 'function') Webgoritmo.UI.cargarPlantillaInicial();
        if (Webgoritmo.Editor.actualizarSugerencias) Webgoritmo.Editor.actualizarSugerencias();
        if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarBarraEstadoCursor === 'function' && Webgoritmo.Editor.editorCodigo) {
             Webgoritmo.UI.actualizarBarraEstadoCursor(Webgoritmo.Editor.editorCodigo);
        }
    } catch (e) { /* ... error ... */ }
};

console.log("modoEditor.js cargado y Webgoritmo.Editor.inicializarEditor definido (con soporte 'Leer' en modo/sugerencias).");
