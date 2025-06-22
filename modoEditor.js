// modoEditor.js
// Lógica de CodeMirror: inicialización para el MVP.
// El modo "pseint" completo y las sugerencias se añadirán después.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Editor = Webgoritmo.Editor || {};

Webgoritmo.Editor.editorCodigo = null; // Instancia del editor CodeMirror

Webgoritmo.Editor.inicializarEditor = function() {
    // Se espera que Webgoritmo.DOM.editorTextArea ya esté definido por app.js
    // y que app.js llame a esta función dentro de DOMContentLoaded.
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.editorTextArea) {
        console.error("modoEditor.js: Webgoritmo.DOM.editorTextArea no está definido. No se puede inicializar CodeMirror.");
        // En un caso real, podríamos querer mostrar un error en la UI.
        // Por ahora, el console.error es la depuración principal.
        // Si Webgoritmo.UI.añadirSalida estuviera disponible, se podría usar:
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida("[ERROR CRÍTICO]: Textarea del editor no disponible para CodeMirror.", "error");
        // }
        return;
    }

    try {
        Webgoritmo.Editor.editorCodigo = CodeMirror.fromTextArea(Webgoritmo.DOM.editorTextArea, {
            lineNumbers: true,
            mode: 'text/plain', // Modo muy simple para el MVP inicial. El modo "pseint" se definirá después.
            theme: 'dracula',   // Usar un tema base de CodeMirror. Los estilos CSS lo adaptarán.
            matchBrackets: true,
            styleActiveLine: true
            // Addons como foldGutter se configurarán cuando se implemente el modo "pseint" completo.
        });
        console.log("modoEditor.js: CodeMirror inicializado exitosamente sobre #code-input (modo text/plain).");

        // En fases posteriores del MVP, aquí se adjuntarían listeners como 'change' y 'cursorActivity'
        // para funcionalidades como sugerencias o la barra de estado.
        // Ejemplo:
        // Webgoritmo.Editor.editorCodigo.on('cursorActivity', function(cmInstance) {
        //     if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarBarraEstadoCursor === "function") {
        //         Webgoritmo.UI.actualizarBarraEstadoCursor(cmInstance);
        //     }
        // });

        // También se podrían llamar funciones iniciales de UI que dependen del editor,
        // como cargar una plantilla inicial, si esa lógica estuviera en Webgoritmo.UI.
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.cargarPlantillaInicial === "function") {
        //      Webgoritmo.UI.cargarPlantillaInicial();
        // }

    } catch (e) {
        console.error("Error al inicializar CodeMirror en modoEditor.js:", e);
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida(`[ERROR CRÍTICO]: Fallo al inicializar el editor CodeMirror. ${e.message}`, "error");
        // }
        // alert(`Error crítico al inicializar el editor: ${e.message}`); // Fallback si la consola de UI no está
    }
};
