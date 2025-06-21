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
    { keyword: 'leer', title: 'Leer / Entrada', tip: 'Lee un valor desde la entrada del usuario y lo asigna a una variable o elemento de arreglo.', code: 'Leer [nombre_variable]' },
    { keyword: 'si', title: 'Si-Entonces-Sino', tip: 'Ejecuta un bloque de código si una condición es Verdadera, y opcionalmente otro si es Falsa.', code: 'Si condicion Entonces\n\t// Código si Verdadero\nSino\n\t// Código si Falso\nFinSi' },
    { keyword: 'para', title: 'Para-Hasta-Hacer', tip: 'Bucle que se repite un número definido de veces, con un un valor inicial, final y paso.', code: 'Para i <- inicio Hasta fin Con Paso paso Hacer\n\t// Código a repetir\nFinPara' },
    { keyword: 'mientras', title: 'Mientras-Hacer', tip: 'Bucle que se repite mientras una condición booleana sea Verdadera. El código dentro se ejecuta cero o más veces.', code: 'Mientras condicion Hacer\n\t// Código a repetir\nFinMientras' },
    { keyword: 'repetir', title: 'Repetir-Hasta Que', tip: 'Bucle que se ejecuta al menos una vez y se repite hasta que una condición booleana sea Verdadera.', code: 'Repetir\n\t// Código a repetir\nHasta Que condicion' },
    { keyword: 'segun', title: 'Segun-Hacer', tip: 'Estructura de selección múltiple que ejecuta diferentes bloques de código según el valor de una expresión.', code: 'Segun variable Hacer\n\tvalor1:\n\t\t// Código para valor1\n\tvalor2:\n\t\t// Código para valor2\n\tDe Otro Modo:\n\t\t// Código para otros valores\nFinSegun' },
    { keyword: 'funcion', title: 'Funcion / SubProceso', tip: 'Define un bloque de código reutilizable que puede o no retornar un valor. (No ejecutado completamente en este simulador)', code: 'Funcion [resultado] = [nombre_funcion]([parametros])\n\t// Código de la función\nFinFuncion' },
    { keyword: 'proceso', title: 'Proceso / Algoritmo', tip: 'Define el bloque principal donde comienza y termina la ejecución de tu algoritmo.', code: 'Proceso [NombreDelProceso]\n\t// Tu código aquí\nFinProceso' },
    { keyword: '//', title: 'Comentario de una línea', tip: 'Ignora el texto desde // hasta el final de la línea.', code: '// Este es un comentario' },
    { keyword: '/*', title: 'Comentario de múltiples líneas', tip: 'Ignora el texto entre /* y */.', code: '/* Este es\\n   un comentario\\n   de varias líneas */' }
];

Webgoritmo.Editor.insertarSugerencia = function(codigoSugerido, charsARemover) {
    if (!Webgoritmo.Editor.editorCodigo) {
        console.error("[ERROR]: El editor de código no está inicializado. No se puede insertar la sugerencia.");
        return;
    }
    const editor = Webgoritmo.Editor.editorCodigo;
    const cursor = editor.getCursor();
    const inicioCaracter = cursor.ch - charsARemover;
    editor.replaceRange(codigoSugerido, { line: cursor.line, ch: inicioCaracter }, { line: cursor.line, ch: cursor.ch });
    const nuevaPosicionCursor = { line: cursor.line, ch: inicioCaracter + codigoSugerido.length };
    editor.setCursor(nuevaPosicionCursor);
    editor.focus();
    if (Webgoritmo.Editor.actualizarSugerencias) { // Verificar que la función exista en el namespace
        Webgoritmo.Editor.actualizarSugerencias();
    }
};

Webgoritmo.Editor.actualizarSugerencias = function() {
    if (!Webgoritmo.Editor.editorCodigo) {
        // No hacer nada si el editor no está listo
        return;
    }
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.listaSugerencias) {
         // No hacer nada si la lista de sugerencias no está en el DOM (podría pasar durante la carga inicial si el orden no es perfecto)
        return;
    }

    Webgoritmo.DOM.listaSugerencias.innerHTML = '';
    const editor = Webgoritmo.Editor.editorCodigo;
    const codigo = editor.getValue();
    const cursor = editor.getCursor();
    const contenidoLinea = editor.getLine(cursor.line);
    const textoActualACoincidir = contenidoLinea.substring(0, cursor.ch).match(/([\w\s]+)$/);
    const palabraActual = textoActualACoincidir ? textoActualACoincidir[1].trimStart().toLowerCase() : "";

    let sugerenciasEncontradas = false;
    let alertasSintaxisEncontradas = false;

    const codigoLimpioParaBalance = codigo
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\*\s*.*$/gm, '');

    const verificarBalanceLocal = (palabraClaveAbrir, palabraClaveCerrar) => {
        const conteoAbrir = (codigoLimpioParaBalance.match(new RegExp(`\\b${palabraClaveAbrir}\\b`, 'gi')) || []).length;
        const conteoCerrar = (codigoLimpioParaBalance.match(new RegExp(`\\b${palabraClaveCerrar}\\b`, 'gi')) || []).length;

        if (conteoAbrir > conteoCerrar) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirAlertaSintaxis) Webgoritmo.UI.añadirAlertaSintaxis(`Falta '${palabraClaveCerrar}' para cerrar tu '${palabraClaveAbrir}'.`);
            alertasSintaxisEncontradas = true;
        } else if (conteoCerrar > conteoAbrir) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirAlertaSintaxis) Webgoritmo.UI.añadirAlertaSintaxis(`Hay un '${palabraClaveCerrar}' sin su correspondiente '${palabraClaveAbrir}'.`);
            alertasSintaxisEncontradas = true;
        }
    };

    const conteoInicioProceso = (codigoLimpioParaBalance.match(/\b(Proceso|Algoritmo)\b/gi) || []).length;
    const conteoFinProceso = (codigoLimpioParaBalance.match(/\b(FinProceso|FinAlgoritmo)\b/gi) || []).length;

    if (codigo.trim().length > 0) {
        if (conteoInicioProceso === 0) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirAlertaSintaxis) Webgoritmo.UI.añadirAlertaSintaxis("Tu código debe comenzar con 'Proceso' o 'Algoritmo'.");
            alertasSintaxisEncontradas = true;
        } else if (conteoInicioProceso > 1) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirAlertaSintaxis) Webgoritmo.UI.añadirAlertaSintaxis("Demasiados bloques 'Proceso' o 'Algoritmo'. Solo se permite uno principal.");
            alertasSintaxisEncontradas = true;
        } else if (conteoInicioProceso !== conteoFinProceso) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirAlertaSintaxis) Webgoritmo.UI.añadirAlertaSintaxis("Falta 'FinProceso' o 'FinAlgoritmo' para cerrar el proceso principal.");
            alertasSintaxisEncontradas = true;
        }
    }

    verificarBalanceLocal('Si', 'FinSi');
    verificarBalanceLocal('Mientras', 'FinMientras');
    verificarBalanceLocal('Para', 'FinPara');
    verificarBalanceLocal('Segun', 'FinSegun');
    verificarBalanceLocal('Funcion', 'FinFuncion');
    verificarBalanceLocal('SubProceso', 'FinSubProceso'); // Incluir sinónimos si se añaden al resaltador

    const conteoRepetir = (codigoLimpioParaBalance.match(new RegExp(`\\bRepetir\\b`, 'gi')) || []).length;
    const conteoHastaQue = (codigoLimpioParaBalance.match(new RegExp(`\\bHasta Que\\b`, 'gi')) || []).length;
    if (conteoRepetir !== conteoHastaQue) {
        if (Webgoritmo.UI && Webgoritmo.UI.añadirAlertaSintaxis) Webgoritmo.UI.añadirAlertaSintaxis("Cada 'Repetir' debe tener un 'Hasta Que' correspondiente y viceversa. Revisa tus bucles.");
        alertasSintaxisEncontradas = true;
    }

    if (palabraActual.length > 0) {
        const sugerenciasFiltradas = Webgoritmo.Editor.sugerencias.filter(sug => sug.keyword.startsWith(palabraActual));
        if (sugerenciasFiltradas.length > 0) {
            sugerenciasFiltradas.forEach(sug => {
                const li = document.createElement('li');
                li.className = 'suggestion-item';
                li.innerHTML = `<strong>${sug.title}</strong><br>${sug.tip}<pre>${sug.code}</pre>`;
                li.addEventListener('click', () => Webgoritmo.Editor.insertarSugerencia(sug.code, palabraActual.length));
                Webgoritmo.DOM.listaSugerencias.appendChild(li);
                sugerenciasEncontradas = true;
            });
        }
    }

    if (!sugerenciasEncontradas && !alertasSintaxisEncontradas) {
        const li = document.createElement('li');
        li.className = 'suggestion-item';
        li.textContent = "Escribe una palabra clave (ej: 'definir', 'si') para ver sugerencias.";
        Webgoritmo.DOM.listaSugerencias.appendChild(li);
    }
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
    ];
    const keywordsDefinition = ["Definir", "Como", "Dimension"];
    const types = ["Entero", "Real", "Logico", "Caracter", "Cadena", "Numerico", "Numero"]; // Numero/Numerico como alias
    const builtInFunctions = [
        "Escribir", "Imprimir", "Mostrar", "Leer",
        "Abs", "RC", "Sen", "Cos", "Tan", "Ln", "Exp", "Azar", "Aleatorio", "Trunc", "Redon",
        "Longitud", "Subcadena", "Mayusculas", "Minusculas", "ConvertirATexto", "ConvertirANumero",
        "LimpiarPantalla", "EsperarTecla", "Esperar"
    ];
    const literals = ["Verdadero", "Falso", "PI", "E"]; // PI y E como constantes literales
    const operators = ["Y", "O", "No", "Mod", "Div"]; // Operadores textuales

    // Ordenar por longitud para priorizar coincidencias más largas (ej. "Hasta Que" antes de "Hasta")
    function sortKeywords(arr) { return arr.sort((a,b) => b.length - a.length); }
    sortKeywords(keywordsControl);
    sortKeywords(keywordsDefinition);
    sortKeywords(types);
    sortKeywords(builtInFunctions);
    sortKeywords(literals);
    sortKeywords(operators);

    function crearRegexEspecifica(listaPalabras) {
        const palabrasEscapadas = listaPalabras.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s/g, '\\s+'));
        return new RegExp("^((" + palabrasEscapadas.join("|") + ")\\b)", "i");
    }

    const regexKeywordsControl = crearRegexEspecifica(keywordsControl);
    const regexKeywordsDefinition = crearRegexEspecifica(keywordsDefinition);
    const regexTypes = crearRegexEspecifica(types);
    const regexBuiltInFunctions = crearRegexEspecifica(builtInFunctions);
    const regexLiterals = crearRegexEspecifica(literals);
    const regexOperators = crearRegexEspecifica(operators);

    return {
        startState: function() { return { enComentarioBloque: false }; },
        token: function(stream, state) {
            if (state.enComentarioBloque) {
                if (stream.match(/^.*?\*\//)) { state.enComentarioBloque = false; return "comment"; }
                stream.next(); return "comment";
            }
            if (stream.match("/*")) { state.enComentarioBloque = true; return "comment"; }
            if (stream.match("//")) { stream.skipToEnd(); return "comment"; }
            if (stream.match(/^"(?:[^\\]|\\.)*?(?:"|$)/) || stream.match(/^'(?:[^\\]|\\.)*?(?:'|$)/)) return "string";
            if (stream.match(regexLiterals)) return "literal-boolean"; // O 'atom' según el tema
            if (stream.match(regexKeywordsControl)) return "keyword-control";
            if (stream.match(regexBuiltInFunctions)) return "builtin-function";
            if (stream.match(regexKeywordsDefinition)) return "keyword-definition";
            if (stream.match(regexTypes)) return "type";
            if (stream.match(regexOperators)) return "operator-logic"; // Token para Y, O, No, Mod, Div
            if (stream.match(/^(<-|<=|>=|==|<>|<|>|\+|-|\*|\/|\^|%)/)) return "operator";
            if (stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)) return "number";
            if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) return "variable";
            if (stream.match(/[(){}[\]]/)) return "punctuation";
            stream.next();
            return null;
        }
    };
});

Webgoritmo.Editor.inicializarEditor = function() {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.codeInputTextArea) {
        console.error("Textarea #code-input (Webgoritmo.DOM.codeInputTextArea) no encontrado. CodeMirror no puede inicializarse.");
        if(Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') Webgoritmo.UI.añadirSalida("[ERROR CRÍTICO] Textarea para editor no encontrado.", "error");
        return;
    }
    try {
        Webgoritmo.Editor.editorCodigo = CodeMirror.fromTextArea(Webgoritmo.DOM.codeInputTextArea, {
            mode: "pseint",
            lineNumbers: true,
            matchBrackets: true,
            autofocus: true,
            theme: "dracula",
            styleActiveLine: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });

        Webgoritmo.Editor.editorCodigo.on('change', Webgoritmo.Editor.actualizarSugerencias);
        Webgoritmo.Editor.editorCodigo.on('cursorActivity', function(cmInstance) {
            if (Webgoritmo.Editor.actualizarSugerencias) Webgoritmo.Editor.actualizarSugerencias();
            if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarBarraEstadoCursor === "function") {
                Webgoritmo.UI.actualizarBarraEstadoCursor(cmInstance);
            }
        });

        if (Webgoritmo.UI && typeof Webgoritmo.UI.cargarPlantillaInicial === "function") {
             Webgoritmo.UI.cargarPlantillaInicial();
        }
        if (Webgoritmo.Editor.actualizarSugerencias) Webgoritmo.Editor.actualizarSugerencias();
        if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarBarraEstadoCursor === "function" && Webgoritmo.Editor.editorCodigo) {
             Webgoritmo.UI.actualizarBarraEstadoCursor(Webgoritmo.Editor.editorCodigo);
        }

    } catch (e) {
        console.error("Error initializing CodeMirror editor:", e);
        if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === "function") {
            Webgoritmo.UI.añadirSalida(`[ERROR CRÍTICO]: No se pudo inicializar el editor de código.`, 'error');
        }
    }
};
