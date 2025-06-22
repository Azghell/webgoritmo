// uiManager.js
// Funciones de UI para el MVP, como añadir salida a la consola.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.UI = Webgoritmo.UI || {};

/**
 * Añade un mensaje a la consola de salida de la UI.
 * @param {string} mensaje El mensaje a mostrar.
 * @param {string} [tipo='normal'] El tipo de mensaje ('normal', 'error', 'warning', 'user-input', 'input-prompt').
 */
Webgoritmo.UI.añadirSalida = function(mensaje, tipo = 'normal') {
    // Se espera que Webgoritmo.DOM.consolaSalida esté definido en app.js
    // y que app.js se ejecute después de que el DOM esté listo.
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.consolaSalida) {
        console.error("uiManager.js: Webgoritmo.DOM.consolaSalida no está definido. No se puede añadir salida.");
        // Fallback muy básico si la consola de UI no está disponible (ej. durante pruebas muy tempranas)
        // console.log(`Salida Consola (fallback): [${tipo}] ${mensaje}`);
        return;
    }

    const elementoLinea = document.createElement('div');
    elementoLinea.textContent = mensaje;
    elementoLinea.classList.add('console-line'); // Clase base para todas las líneas
    if (tipo) {
        elementoLinea.classList.add(tipo); // Añade la clase específica del tipo (ej. 'error', 'normal')
    }

    Webgoritmo.DOM.consolaSalida.appendChild(elementoLinea);
    // Asegurar que el scroll esté al final después de añadir nueva salida
    Webgoritmo.DOM.consolaSalida.scrollTop = Webgoritmo.DOM.consolaSalida.scrollHeight;
};

// En el futuro, más funciones de UI irán aquí:
// Webgoritmo.UI.actualizarPanelVariables = function() { /* ... */ };
// Webgoritmo.UI.mostrarErrorSintaxisEnEditor = function(...) { /* ... */ };
// Webgoritmo.UI.limpiarConsola = function() { Webgoritmo.DOM.consolaSalida.innerHTML = ''; };
// etc.

console.log("uiManager.js cargado y Webgoritmo.UI inicializado con añadirSalida.");
