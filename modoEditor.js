// modoEditor.js (VERSIÓN CORREGIDA)
window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Editor = Webgoritmo.Editor || {};

Webgoritmo.Editor.editorCodigo = null;

Webgoritmo.Editor.inicializarEditor = function() {
    console.log("modoEditor.js: Entrando a inicializarEditor... (CORREGIDO v3)"); // v3 para nueva traza
    // Obtener la referencia al textarea DIRECTAMENTE AQUÍ
    const localEditorTextArea = document.getElementById('code-input');

    if (!localEditorTextArea) {
        console.error("modoEditor.js: Textarea #code-input NO ENCONTRADO directamente. Verificar ID en index.html.");
        // Si Webgoritmo.UI está disponible y añadirSalida también, podríamos usarlo aquí.
        // Por ahora, el console.error es suficiente para la depuración con Eruda.
        // if (window.Webgoritmo && Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida("[ERROR CRÍTICO]: Textarea del editor no encontrado por modoEditor.js.", "error");
        // }
        return; // Detener si no se encuentra el textarea
    }
    console.log("modoEditor.js: Textarea #code-input encontrado por getElementById.");

    try {
        if (typeof CodeMirror === 'undefined') {
            console.error("modoEditor.js: Objeto CodeMirror global NO DEFINIDO. Verificar carga de scripts CDN en index.html.");
            // if (window.Webgoritmo && Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
            //     Webgoritmo.UI.añadirSalida("[ERROR CRÍTICO]: Librería CodeMirror no cargada.", "error");
            // }
            return; // Detener si CodeMirror no está cargado
        }

        Webgoritmo.Editor.editorCodigo = CodeMirror.fromTextArea(localEditorTextArea, {
            lineNumbers: true,
            mode: 'text/plain',
            theme: 'dracula',
            matchBrackets: true,
            styleActiveLine: true
        });
        console.log("modoEditor.js: CodeMirror inicializado exitosamente sobre #code-input (modo text/plain) (CORREGIDO v3).");

    } catch (e) {
        console.error("Error al inicializar CodeMirror en modoEditor.js:", e);
        // if (window.Webgoritmo && Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida(`[ERROR CRÍTICO]: Fallo al inicializar CodeMirror. ${e.message}`, "error");
        // }
    }
};

console.log("modoEditor.js cargado y Webgoritmo.Editor.inicializarEditor definido (CORREGIDO v3).");
