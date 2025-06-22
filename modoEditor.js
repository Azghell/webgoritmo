// modoEditor.js
// Lógica de CodeMirror: inicialización y, más adelante, definición del modo "pseint" y sugerencias.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Editor = Webgoritmo.Editor || {};

Webgoritmo.Editor.editorCodigo = null; // Instancia del editor

Webgoritmo.Editor.inicializarEditor = function() {
    // Se espera que Webgoritmo.DOM.editorTextArea ya esté definido por app.js
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.editorTextArea) {
        console.error("modoEditor.js: Webgoritmo.DOM.editorTextArea no está definido. No se puede inicializar CodeMirror.");
        // Intentar añadir salida a la consola si uiManager ya estuviera cargado (no es el caso en este paso aún)
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida("[ERROR CRÍTICO]: Textarea del editor no disponible para CodeMirror.", "error");
        // }
        // Alternativamente, un alert simple si la consola de la UI no está lista:
        // alert("Error crítico: No se encontró el área del editor.");
        return;
    }

    try {
        Webgoritmo.Editor.editorCodigo = CodeMirror.fromTextArea(Webgoritmo.DOM.editorTextArea, {
            lineNumbers: true,
            mode: 'text/plain', // Modo simple para el MVP inicial
            theme: 'dracula',   // Usar un tema base de CodeMirror
            matchBrackets: true,
            // autoCloseBrackets: true, // Addon no incluido en el index.html MVP
            styleActiveLine: true
            // Los addons de foldgutter no se configuran aquí directamente, sino en 'gutters'
            // foldGutter: true, // Se activa con la opción 'gutters'
            // gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"] // Se pueden añadir gutters después
        });
        console.log("modoEditor.js: CodeMirror inicializado exitosamente sobre #code-input.");

        // En fases posteriores del MVP, aquí se adjuntarían listeners como:
        // Webgoritmo.Editor.editorCodigo.on('change', Webgoritmo.Editor.actualizarSugerencias);
        // Webgoritmo.Editor.editorCodigo.on('cursorActivity', function(cmInstance) {
        //     if (Webgoritmo.Editor.actualizarSugerencias) Webgoritmo.Editor.actualizarSugerencias();
        //     if (Webgoritmo.UI && Webgoritmo.UI.actualizarBarraEstadoCursor) {
        //         Webgoritmo.UI.actualizarBarraEstadoCursor(cmInstance);
        //     }
        // });

        // Y se podrían llamar funciones iniciales de UI que dependen del editor:
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.cargarPlantillaInicial === "function") {
        //      Webgoritmo.UI.cargarPlantillaInicial();
        // }
        // if (Webgoritmo.Editor.actualizarSugerencias) Webgoritmo.Editor.actualizarSugerencias();
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarBarraEstadoCursor === "function") {
        //      Webgoritmo.UI.actualizarBarraEstadoCursor(Webgoritmo.Editor.editorCodigo);
        // }

    } catch (e) {
        console.error("Error al inicializar CodeMirror:", e);
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida(`[ERROR CRÍTICO]: Fallo al inicializar el editor CodeMirror. ${e.message}`, "error");
        // } else {
        //     alert(`Error crítico al inicializar el editor: ${e.message}`);
        // }
    }
};
