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

Webgoritmo.UI.poblarSelectorEjemplos = function(dom, datos) {
    const ejemplosSelectEl = dom ? dom.ejemplosSelect : null;
    const codigosEjemploObj = datos ? datos.codigosEjemplo : null;

    // console.log("DEBUG: Entrando a poblarSelectorEjemplos (Fase 5)"); // Log actualizado
    // console.log("DEBUG: codigosEjemploObj:", codigosEjemploObj);

    if (!ejemplosSelectEl || !codigosEjemploObj) {
        console.error("poblarSelectorEjemplos: Elemento select o datos.codigosEjemplo no disponibles.");
        return;
    }

    while (ejemplosSelectEl.options.length > 1) {
        ejemplosSelectEl.remove(1);
    }

    const nombresParaSelector = {
        // salida_literal_f1: "Escribir: Literal", // Comentado si ya no existe en datosEjemplos
        // variables_basicas_f2: "Variables: Básico",
        // entrada_leer_f3: "Leer: Básico",
        expresiones_f4: "Expresiones: Arit/Lóg",
        condicional_si_f5: "Si-Sino: Básico", // Nuevo para Fase 5
        arreglos_dimension_f11: "Arreglos: Dimension",
    };

    for (const clave in codigosEjemploObj) {
        if (codigosEjemploObj.hasOwnProperty(clave)) {
            const option = document.createElement('option');
            option.value = clave;
            option.textContent = nombresParaSelector[clave] || clave.replace(/_/g, ' ').charAt(0).toUpperCase() + clave.replace(/_/g, ' ').slice(1);
            ejemplosSelectEl.appendChild(option);
        }
    }
    console.log("uiManager.js: Selector de ejemplos poblado (Fase 5 Si-Sino).");
};


Webgoritmo.UI.cargarPlantillaInicial = function() {
    const claveEjemploPorDefecto = 'condicional_si_f5'; // Cargar ejemplo de Si-Sino por defecto
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo &&
        Webgoritmo.Datos && Webgoritmo.Datos.codigosEjemplo &&
        Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto]) {

        let codigoInicial = Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto];
        Webgoritmo.Editor.editorCodigo.setValue(codigoInicial);
        console.log(`uiManager.js: Plantilla inicial '${claveEjemploPorDefecto}' cargada en el editor.`);
    } else {
        console.warn(`uiManager.js: No se pudo cargar la plantilla inicial '${claveEjemploPorDefecto}'. Verifique datosEjemplos.js.`);
        if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo && Webgoritmo.Datos && Webgoritmo.Datos.codigosEjemplo) {
            const primeraClaveDisponible = Object.keys(Webgoritmo.Datos.codigosEjemplo)[0];
            if (primeraClaveDisponible) {
                Webgoritmo.Editor.editorCodigo.setValue(Webgoritmo.Datos.codigosEjemplo[primeraClaveDisponible]);
                console.log(`uiManager.js: Fallback: Plantilla inicial '${primeraClaveDisponible}' cargada.`);
            } else {
                 console.warn("uiManager.js: No hay ejemplos disponibles en datosEjemplos.js para cargar como fallback.");
            }
        }
    }
};

console.log("uiManager.js cargado y Webgoritmo.UI actualizado (Fase 5 Si-Sino).");
