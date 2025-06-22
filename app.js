// app.js (Punto de Entrada Principal para MVP Fase 1)
// Maneja DOMContentLoaded, define referencias DOM iniciales, e inicializa el editor.

// Se asume que configGlobal.js (define Webgoritmo y Webgoritmo.estadoApp)
// y modoEditor.js (define Webgoritmo.Editor.inicializarEditor) ya han sido cargados.

document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que el namespace Webgoritmo exista y preparar sub-namespaces
    window.Webgoritmo = window.Webgoritmo || {};
    Webgoritmo.DOM = Webgoritmo.DOM || {};
    // Webgoritmo.UI = Webgoritmo.UI || {}; // Se definirá en uiManager.js en Fase 2 del MVP
    // Webgoritmo.Interprete = Webgoritmo.Interprete || {}; // Se definirá en motorInterprete.js en Fase 2 del MVP

    // I. REFERENCIAS A ELEMENTOS DEL DOM (MVP)
    // =========================================================================
    Webgoritmo.DOM.editorTextArea = document.getElementById('code-input');
    Webgoritmo.DOM.consolaSalida = document.getElementById('console-output');
    Webgoritmo.DOM.btnEjecutar = document.getElementById('run-code-btn');
    // Webgoritmo.DOM.sidePanel = document.querySelector('.mvp-side-panel'); // Para fases posteriores

    // Log para depuración inicial de referencias DOM
    if (Webgoritmo.DOM.editorTextArea && Webgoritmo.DOM.consolaSalida && Webgoritmo.DOM.btnEjecutar) {
        console.log("app.js: DOMContentLoaded. Referencias DOM para MVP (editor, consola, btnEjecutar) asignadas a Webgoritmo.DOM.");
    } else {
        console.error("app.js: DOMContentLoaded. ERROR al obtener alguna de las referencias DOM esenciales para el MVP.");
        if (!Webgoritmo.DOM.editorTextArea) console.error(" - Textarea #code-input no encontrado en app.js.");
        if (!Webgoritmo.DOM.consolaSalida) console.error(" - Div #console-output no encontrado en app.js.");
        if (!Webgoritmo.DOM.btnEjecutar) console.error(" - Botón #run-code-btn no encontrado en app.js.");
    }

    // INICIALIZACIÓN DEL EDITOR
    // =========================================================================
    if (Webgoritmo.Editor && typeof Webgoritmo.Editor.inicializarEditor === "function") {
        console.log("app.js: Llamando a Webgoritmo.Editor.inicializarEditor().");
        Webgoritmo.Editor.inicializarEditor();
    } else {
        console.error("app.js: Webgoritmo.Editor.inicializarEditor no está definida. Asegúrate de que modoEditor.js se carga antes que app.js y define la función correctamente en el namespace.");
        if (Webgoritmo.DOM && Webgoritmo.DOM.consolaSalida) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'console-line error'; // Asumiendo que esta clase ya está en pseudocode.css
            errorDiv.textContent = '[ERROR CRÍTICO EN APP]: No se pudo encontrar la función para inicializar el editor.';
            Webgoritmo.DOM.consolaSalida.appendChild(errorDiv);
        } else {
            // alert("Error crítico: Fallo en la inicialización del editor (función no encontrada).");
        }
    }

    // EVENT LISTENERS INICIALES (MVP)
    // =========================================================================
    if (Webgoritmo.DOM.btnEjecutar) {
        Webgoritmo.DOM.btnEjecutar.addEventListener('click', function() {
            console.log("Botón 'Ejecutar' presionado (MVP - sin acción de intérprete aún).");
            if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) {
                const codigo = Webgoritmo.Editor.editorCodigo.getValue();
                console.log("Código actual en el editor:", codigo);

                // Simulación de salida a la consola de la UI
                if (Webgoritmo.DOM.consolaSalida) {
                    Webgoritmo.DOM.consolaSalida.innerHTML = ''; // Limpiar consola
                    const placeholderLine = document.createElement('div');
                    placeholderLine.className = 'console-line placeholder';
                    placeholderLine.textContent = 'Ejecutando... (simulado)';
                    Webgoritmo.DOM.consolaSalida.appendChild(placeholderLine);

                    const codeLine = document.createElement('div');
                    codeLine.className = 'console-line'; // Estilo normal
                    codeLine.textContent = `Simulación: Se ejecutaría el código (primeras 100 chars):\n${codigo.substring(0,100)}${codigo.length > 100 ? '...' : ''}`;
                    Webgoritmo.DOM.consolaSalida.appendChild(codeLine);
                }
            } else {
                console.error("El editor no está inicializado. No se puede ejecutar.");
                 if (Webgoritmo.DOM.consolaSalida) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'console-line error';
                    errorDiv.textContent = 'Error: El editor no está listo.';
                    Webgoritmo.DOM.consolaSalida.appendChild(errorDiv);
                 }
            }
        });
    }

    console.log("app.js: Fin de la configuración de DOMContentLoaded (MVP Fase 1).");
});
