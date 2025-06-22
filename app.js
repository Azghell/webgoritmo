// app.js
// Punto de entrada principal de la aplicación Webgoritmo (MVP).
// Maneja DOMContentLoaded, define referencias DOM iniciales.

// Se asume que configGlobal.js (que define window.Webgoritmo y Webgoritmo.estadoApp)
// ya ha sido cargado.

document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que el namespace Webgoritmo y Webgoritmo.DOM existan
    window.Webgoritmo = window.Webgoritmo || {};
    Webgoritmo.DOM = Webgoritmo.DOM || {};

    // Referencias a elementos del DOM para el MVP
    Webgoritmo.DOM.editorTextArea = document.getElementById('code-input');
    Webgoritmo.DOM.consolaSalida = document.getElementById('console-output');
    Webgoritmo.DOM.btnEjecutar = document.getElementById('run-code-btn');
    // Webgoritmo.DOM.sidePanel = document.querySelector('.mvp-side-panel'); // Se añadirá si/cuando se necesite

    // Log para depuración inicial
    if (Webgoritmo.DOM.editorTextArea && Webgoritmo.DOM.consolaSalida && Webgoritmo.DOM.btnEjecutar) {
        console.log("app.js: DOMContentLoaded. Referencias DOM para MVP (editor, consola, btnEjecutar) asignadas a Webgoritmo.DOM.");
    } else {
        console.error("app.js: DOMContentLoaded. ERROR al obtener alguna de las referencias DOM esenciales para el MVP.");
        if (!Webgoritmo.DOM.editorTextArea) console.error(" - Textarea #code-input no encontrado.");
        if (!Webgoritmo.DOM.consolaSalida) console.error(" - Div #console-output no encontrado.");
        if (!Webgoritmo.DOM.btnEjecutar) console.error(" - Botón #run-code-btn no encontrado.");
    }

    // En el siguiente paso (Paso 5), llamaremos a Webgoritmo.Editor.inicializarEditor() aquí.

    // INICIALIZACIÓN DEL EDITOR
    if (Webgoritmo.Editor && typeof Webgoritmo.Editor.inicializarEditor === "function") {
        Webgoritmo.Editor.inicializarEditor();
    } else {
        console.error("app.js: Webgoritmo.Editor.inicializarEditor no está definido. Asegúrate de que modoEditor.js se carga antes que app.js y define la función correctamente.");
        if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) { // Intenta mostrar error en UI si es posible
            const errorDiv = document.createElement('div');
            errorDiv.className = 'console-line error';
            errorDiv.textContent = '[ERROR CRÍTICO EN APP]: No se pudo encontrar la función para inicializar el editor.';
            Webgoritmo.DOM.consolaSalida.appendChild(errorDiv);
        } else {
            alert("Error crítico: Fallo en la inicialización del editor.");
        }
    }

    // Otros listeners y lógica de inicialización principal irán aquí en fases posteriores.
    // Por ejemplo, la función Webgoritmo.restablecerEstado() se definirá aquí más adelante y se llamará.
    // if(typeof Webgoritmo.restablecerEstado === "function") {
    //     Webgoritmo.restablecerEstado();
    // }
});
