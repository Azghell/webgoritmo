// uiManager.js
// Funciones de UI, incluyendo manejo para 'Leer'.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.UI = Webgoritmo.UI || {};

/**
 * Añade un mensaje a la consola de salida de la UI.
 * @param {string} mensaje El mensaje a mostrar.
 * @param {string} [tipo='normal'] El tipo de mensaje ('normal', 'error', 'warning', 'user-input', 'input-prompt').
 */
Webgoritmo.UI.añadirSalida = function(mensaje, tipo = 'normal') {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.consolaSalida) {
        console.error("uiManager.js: Webgoritmo.DOM.consolaSalida no está definido. No se puede añadir salida.");
        return;
    }
    const elementoLinea = document.createElement('div');
    elementoLinea.textContent = mensaje;
    elementoLinea.classList.add('console-line');
    if (tipo) {
        elementoLinea.classList.add(tipo);
    }
    Webgoritmo.DOM.consolaSalida.appendChild(elementoLinea);
    Webgoritmo.DOM.consolaSalida.scrollTop = Webgoritmo.DOM.consolaSalida.scrollHeight;
};

/**
 * Prepara la UI para recibir entrada del usuario (instrucción Leer).
 * @param {string} mensajePrompt El mensaje a mostrar al usuario antes del input.
 */
Webgoritmo.UI.prepararParaEntrada = function(mensajePrompt) {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.consoleInputArea || !Webgoritmo.DOM.entradaConsola || !Webgoritmo.DOM.btnEnviarEntrada) {
        console.error("prepararParaEntrada: Elementos DOM de la consola de entrada no definidos.");
        return;
    }

    if (mensajePrompt && typeof Webgoritmo.UI.añadirSalida === 'function') {
        Webgoritmo.UI.añadirSalida(mensajePrompt, 'input-prompt');
    }

    Webgoritmo.DOM.consoleInputArea.classList.remove('oculto');
    Webgoritmo.DOM.entradaConsola.disabled = false;
    Webgoritmo.DOM.entradaConsola.readOnly = false;
    Webgoritmo.DOM.btnEnviarEntrada.disabled = false;

    requestAnimationFrame(() => {
        Webgoritmo.DOM.entradaConsola.focus();
    });
    console.log("uiManager.js: UI preparada para entrada.");
};

/**
 * Restaura la UI después de que se ha procesado una entrada de Leer.
 */
Webgoritmo.UI.finalizarEntrada = function() {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.consoleInputArea || !Webgoritmo.DOM.entradaConsola || !Webgoritmo.DOM.btnEnviarEntrada) {
        console.error("finalizarEntrada: Elementos DOM de la consola de entrada no definidos.");
        return;
    }

    Webgoritmo.DOM.entradaConsola.value = '';
    Webgoritmo.DOM.entradaConsola.disabled = true;
    Webgoritmo.DOM.entradaConsola.readOnly = true;
    Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
    Webgoritmo.DOM.consoleInputArea.classList.add('oculto');

    console.log("uiManager.js: UI finalizada después de entrada.");
};

// Aquí se reincorporarían las otras funciones de UI que teníamos conceptualizadas
// en la refactorización anterior, adaptadas al namespace Webgoritmo.
// Por ejemplo: añadirAlertaSintaxis, mostrarConfirmacion, cargarPlantillaInicial, etc.
// Por ahora, solo las necesarias para el flujo de Leer y la salida básica.

console.log("uiManager.js cargado y Webgoritmo.UI actualizado con funciones para Leer y añadirSalida.");
