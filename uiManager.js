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
    const dom = Webgoritmo.DOM; // Copia local de Webgoritmo.DOM
    const consoleInputAreaEl = dom ? dom.consoleInputArea : null;
    const entradaConsolaEl = dom ? dom.entradaConsola : null;
    const btnEnviarEntradaEl = dom ? dom.btnEnviarEntrada : null;

    // DEBUGGING:
    console.log("DEBUG: Entrando a prepararParaEntrada");
    console.log("DEBUG: Copia local dom:", dom);
    console.log("DEBUG: Copia local consoleInputAreaEl:", consoleInputAreaEl);
    console.log("DEBUG: Copia local entradaConsolaEl:", entradaConsolaEl);
    console.log("DEBUG: Copia local btnEnviarEntradaEl:", btnEnviarEntradaEl);

    if (!consoleInputAreaEl || !entradaConsolaEl || !btnEnviarEntradaEl) {
        console.error("prepararParaEntrada: Elementos DOM (copia local) de la consola de entrada no definidos.");
        if (!consoleInputAreaEl) console.error("DEBUG: consoleInputAreaEl (copia local) es null/undefined");
        if (!entradaConsolaEl) console.error("DEBUG: entradaConsolaEl (copia local) es null/undefined");
        if (!btnEnviarEntradaEl) console.error("DEBUG: btnEnviarEntradaEl (copia local) es null/undefined");
        return;
    }

    if (mensajePrompt && typeof Webgoritmo.UI.añadirSalida === 'function') {
        Webgoritmo.UI.añadirSalida(mensajePrompt, 'input-prompt');
    }

    consoleInputAreaEl.classList.remove('oculto');
    entradaConsolaEl.disabled = false;
    entradaConsolaEl.readOnly = false;
    btnEnviarEntradaEl.disabled = false;

    requestAnimationFrame(() => {
        if (entradaConsolaEl) entradaConsolaEl.focus(); // Asegurarse de que aún exista
    });
    console.log("uiManager.js: UI preparada para entrada.");
};

/**
 * Restaura la UI después de que se ha procesado una entrada de Leer.
 * @param {object} dom Un objeto que contiene las referencias a los elementos del DOM necesarios.
 */
Webgoritmo.UI.finalizarEntrada = function(dom) { // Acepta dom como parámetro
    // const dom = Webgoritmo.DOM; // Ya no se toma de global aquí
    const consoleInputAreaEl = dom ? dom.consoleInputArea : null;
    const entradaConsolaEl = dom ? dom.entradaConsola : null;
    const btnEnviarEntradaEl = dom ? dom.btnEnviarEntrada : null;

    // DEBUGGING:
    console.log("DEBUG: Entrando a finalizarEntrada");
    console.log("DEBUG: Copia local dom:", dom);
    console.log("DEBUG: Copia local consoleInputAreaEl:", consoleInputAreaEl);
    console.log("DEBUG: Copia local entradaConsolaEl:", entradaConsolaEl);
    console.log("DEBUG: Copia local btnEnviarEntradaEl:", btnEnviarEntradaEl);

    if (!consoleInputAreaEl || !entradaConsolaEl || !btnEnviarEntradaEl) {
        console.error("finalizarEntrada: Elementos DOM (copia local) de la consola de entrada no definidos.");
        if (!consoleInputAreaEl) console.error("DEBUG: consoleInputAreaEl (copia local) es null/undefined al finalizar");
        if (!entradaConsolaEl) console.error("DEBUG: entradaConsolaEl (copia local) es null/undefined al finalizar");
        if (!btnEnviarEntradaEl) console.error("DEBUG: btnEnviarEntradaEl (copia local) es null/undefined al finalizar");
        return;
    }

    entradaConsolaEl.value = '';
    entradaConsolaEl.disabled = true;
    entradaConsolaEl.readOnly = true;
    btnEnviarEntradaEl.disabled = true;
    consoleInputAreaEl.classList.add('oculto');

    console.log("uiManager.js: UI finalizada después de entrada.");
};

// Aquí se reincorporarían las otras funciones de UI que teníamos conceptualizadas
// en la refactorización anterior, adaptadas al namespace Webgoritmo.
// Por ejemplo: añadirAlertaSintaxis, mostrarConfirmacion, cargarPlantillaInicial, etc.
// Por ahora, solo las necesarias para el flujo de Leer y la salida básica.

Webgoritmo.UI.poblarSelectorEjemplos = function(dom, datos) { // Acepta dom y datos como parámetros
    // const dom = Webgoritmo.DOM; // Ya no se toma de global
    // const datos = Webgoritmo.Datos; // Ya no se toma de global
    const ejemplosSelectEl = dom ? dom.ejemplosSelect : null;
    const exampleCodesObj = datos ? datos.exampleCodes : null;

    // DEBUGGING:
    console.log("DEBUG: Entrando a poblarSelectorEjemplos");
    console.log("DEBUG: Parámetro dom:", dom);
    console.log("DEBUG: Parámetro datos:", datos);
    console.log("DEBUG: ejemplosSelectEl (de param dom):", ejemplosSelectEl);
    console.log("DEBUG: exampleCodesObj (de param datos):", exampleCodesObj);


    if (!ejemplosSelectEl || !exampleCodesObj) {
        console.error("poblarSelectorEjemplos: Elemento select o datos de ejemplos (desde parámetros) no disponibles.");
        if (!ejemplosSelectEl) console.error("DEBUG: ejemplosSelectEl (desde param dom) es null/undefined.");
        if (!exampleCodesObj) console.error("DEBUG: exampleCodesObj (desde param datos) es null/undefined.");
        return;
    }

    // Limpiar opciones existentes (excepto la primera "-- Seleccione --")
    while (ejemplosSelectEl.options.length > 1) {
        ejemplosSelectEl.remove(1);
    }

    for (const clave in exampleCodesObj) {
        if (exampleCodesObj.hasOwnProperty(clave)) { // Usar la copia local exampleCodesObj
            const option = document.createElement('option');
            option.value = clave;
            let textoOpcion = clave.replace(/_/g, ' ');
            textoOpcion = textoOpcion.charAt(0).toUpperCase() + textoOpcion.slice(1);
            option.textContent = textoOpcion;
            ejemplosSelectEl.appendChild(option); // Usar la copia local ejemplosSelectEl
        }
    }
    console.log("uiManager.js: Selector de ejemplos poblado.");
};


Webgoritmo.UI.cargarPlantillaInicial = function() {
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo && Webgoritmo.Datos && Webgoritmo.Datos.exampleCodes && Webgoritmo.Datos.exampleCodes.simple_io) {
        // Cargar el ejemplo 'simple_io' por defecto o el que se decida
        let codigoInicial = Webgoritmo.Datos.exampleCodes.simple_io;
        // Si la estructura de exampleCodes cambió a {titulo, codigo}, ajustar aquí:
        // codigoInicial = Webgoritmo.Datos.exampleCodes.simple_io.codigo;
        Webgoritmo.Editor.editorCodigo.setValue(codigoInicial);
        console.log("uiManager.js: Plantilla inicial cargada en el editor.");
    } else {
        console.warn("uiManager.js: No se pudo cargar la plantilla inicial (editor o datos no listos).");
    }
};


console.log("uiManager.js cargado y Webgoritmo.UI actualizado con funciones para Leer, añadirSalida y poblarSelectorEjemplos.");
