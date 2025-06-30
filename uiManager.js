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

// Las funciones Webgoritmo.UI.prepararParaEntrada y Webgoritmo.UI.finalizarEntrada
// han sido eliminadas. Su lógica será manejada directamente en app.js.

// Aquí se reincorporarían las otras funciones de UI que teníamos conceptualizadas
// en la refactorización anterior, adaptadas al namespace Webgoritmo.
// Por ejemplo: añadirAlertaSintaxis, mostrarConfirmacion, cargarPlantillaInicial, etc.
// Por ahora, solo las necesarias para el flujo de Leer y la salida básica.

Webgoritmo.UI.poblarSelectorEjemplos = function(dom, datos) { // Acepta dom y datos como parámetros
    // const dom = Webgoritmo.DOM; // Ya no se toma de global
    // const datos = Webgoritmo.Datos; // Ya no se toma de global
    const ejemplosSelectEl = dom ? dom.ejemplosSelect : null;
    // Usar la nueva estructura de datosEjemplos.js
    const codigosEjemploObj = datos ? datos.codigosEjemplo : null;

    // DEBUGGING:
    console.log("DEBUG: Entrando a poblarSelectorEjemplos (Fase 1 Reconstrucción)");
    console.log("DEBUG: dom:", dom);
    console.log("DEBUG: datos:", datos);
    console.log("DEBUG: ejemplosSelectEl:", ejemplosSelectEl);
    console.log("DEBUG: codigosEjemploObj:", codigosEjemploObj);


    if (!ejemplosSelectEl || !codigosEjemploObj) {
        console.error("poblarSelectorEjemplos: Elemento select o datos.codigosEjemplo no disponibles.");
        return;
    }

    // Limpiar opciones existentes (excepto la primera "-- Seleccione --")
    while (ejemplosSelectEl.options.length > 1) {
        ejemplosSelectEl.remove(1);
    }

    // Mapeo de claves a nombres para esta fase
    const nombresParaSelector = {
        salida_literal_cadena: "Escribir: Literales"
        // Se añadirán más a medida que se implementen ejemplos
    };

    for (const clave in codigosEjemploObj) {
        if (codigosEjemploObj.hasOwnProperty(clave)) {
            const option = document.createElement('option');
            option.value = clave;
            // Usar el nombre del mapeo o generar uno a partir de la clave
            option.textContent = nombresParaSelector[clave] || clave.replace(/_/g, ' ').charAt(0).toUpperCase() + clave.replace(/_/g, ' ').slice(1);
            ejemplosSelectEl.appendChild(option);
        }
    }
    console.log("uiManager.js: Selector de ejemplos poblado (Fase 1 Reconstrucción).");
};


Webgoritmo.UI.cargarPlantillaInicial = function() {
    // Ajustar para usar la nueva estructura y clave si es necesario, o eliminar si no se carga nada al inicio.
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo &&
        Webgoritmo.Datos && Webgoritmo.Datos.codigosEjemplo &&
        Webgoritmo.Datos.codigosEjemplo.salida_literal_cadena) {

        let codigoInicial = Webgoritmo.Datos.codigosEjemplo.salida_literal_cadena;
        Webgoritmo.Editor.editorCodigo.setValue(codigoInicial);
        console.log("uiManager.js: Plantilla inicial 'salida_literal_cadena' cargada en el editor.");
    } else {
        // console.warn("uiManager.js: No se pudo cargar la plantilla inicial (Fase 1).");
    }
};


console.log("uiManager.js cargado y Webgoritmo.UI actualizado (Fase 1 Reconstrucción).");
