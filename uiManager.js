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

    // Mapeo de claves a nombres descriptivos/cortos
    const nombresParaSelector = {
        salida_literal_f1: "Escribir: Literal",
        variables_basicas_f2: "Variables: Básico",
        entrada_leer_f3: "Leer: Básico",
        expresiones_f4: "Expresiones: Arit/Lóg",
        arreglos_dimension_f11: "Arreglos: Dimension", // Placeholder para futura fase
        // Se añadirán más a medida que se implementen ejemplos
        // Ejemplos anteriores que podríamos querer renombrar si los reutilizamos:
        // si_simple: "Si: Mayor de Edad",
        // prueba_si_simple: "Test: Si (Simple)",
        // si_sino: "Si-Sino: Positivo/Negativo",
        // prueba_si_sino: "Test: Si-Sino",
        // condicional_anidado: "Si: Anidado (Calificación)",
        // etc.
    };

    for (const clave in codigosEjemploObj) {
        if (codigosEjemploObj.hasOwnProperty(clave)) {
            const option = document.createElement('option');
            option.value = clave;
            option.textContent = nombresParaSelector[clave] || clave.replace(/_/g, ' ').charAt(0).toUpperCase() + clave.replace(/_/g, ' ').slice(1);
            ejemplosSelectEl.appendChild(option);
        }
    }
    console.log("uiManager.js: Selector de ejemplos poblado (Post Fase 4).");
};


Webgoritmo.UI.cargarPlantillaInicial = function() {
    // Cargar el ejemplo de la Fase 4 (expresiones) por defecto por ahora
    const claveEjemploPorDefecto = 'expresiones_f4';
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo &&
        Webgoritmo.Datos && Webgoritmo.Datos.codigosEjemplo &&
        Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto]) {

        let codigoInicial = Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto];
        Webgoritmo.Editor.editorCodigo.setValue(codigoInicial);
        console.log(`uiManager.js: Plantilla inicial '${claveEjemploPorDefecto}' cargada en el editor.`);
    } else {
        console.warn(`uiManager.js: No se pudo cargar la plantilla inicial '${claveEjemploPorDefecto}'. Verifique datosEjemplos.js.`);
        // Como fallback, cargar el primer ejemplo disponible si existe alguno
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


console.log("uiManager.js cargado y Webgoritmo.UI actualizado (Post Fase 4).");
