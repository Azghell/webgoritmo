// modoEditor.js
window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Editor = Webgoritmo.Editor || {};

Webgoritmo.Editor.editorCodigo = null;

Webgoritmo.Editor.inicializarEditor = function() {
    console.log("modoEditor.js: Entrando a inicializarEditor...");
    const localEditorTextArea = document.getElementById('code-input'); // Obtener la referencia DIRECTAMENTE AQUÍ

    if (!localEditorTextArea) {
        console.error("modoEditor.js: Textarea #code-input NO ENCONTRADO directamente. Verificar ID en index.html.");
        // Como uiManager.js aún no está cargado en el plan MVP Fase 1, no podemos usar Webgoritmo.UI.añadirSalida aquí.
        // En una fase posterior, con uiManager.js cargado antes, esto sería posible:
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida("[ERROR CRÍTICO]: Textarea del editor no encontrado por modoEditor.js.", "error");
        // }
        return;
    }
    console.log("modoEditor.js: Textarea #code-input encontrado.");

    try {
        // Asegurarse de que el objeto CodeMirror global exista (cargado desde CDN)
        if (typeof CodeMirror === 'undefined') {
            console.error("modoEditor.js: Objeto CodeMirror global NO DEFINIDO. Verificar carga de scripts CDN en index.html.");
            // if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
            //     Webgoritmo.UI.añadirSalida("[ERROR CRÍTICO]: Librería CodeMirror no cargada.", "error");
            // }
            return;
        }

        Webgoritmo.Editor.editorCodigo = CodeMirror.fromTextArea(localEditorTextArea, {
            lineNumbers: true,
            mode: 'text/plain', // Modo simple para el MVP inicial
            theme: 'dracula',   // Usar un tema base de CodeMirror
            matchBrackets: true,
            styleActiveLine: true
        });
        console.log("modoEditor.js: CodeMirror inicializado exitosamente sobre #code-input (modo text/plain).");
        // Quitar los cambios de color de fondo de depuración para no interferir con los temas futuros
        // document.body.style.backgroundColor = 'palegreen';

    } catch (e) {
        console.error("Error al inicializar CodeMirror en modoEditor.js:", e);
        // document.body.style.backgroundColor = 'lightcoral';
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.añadirSalida === 'function') {
        //     Webgoritmo.UI.añadirSalida(`[ERROR CRÍTICO]: Fallo al inicializar CodeMirror. ${e.message}`, "error");
        // }
    }
};

console.log("modoEditor.js cargado y Webgoritmo.Editor.inicializarEditor definido.");
