// uiManager.js
// Funciones de UI, incluyendo manejo para 'Leer'.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.UI = Webgoritmo.UI || {};

Webgoritmo.UI.añadirSalida = function(mensaje, tipo = 'normal') {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.consolaSalida) {
        console.error("uiManager.js: Webgoritmo.DOM.consolaSalida no está definido.");
        return;
    }
    const elementoLinea = document.createElement('div');
    elementoLinea.textContent = mensaje;
    elementoLinea.classList.add('console-line');
    if (tipo) elementoLinea.classList.add(tipo);
    Webgoritmo.DOM.consolaSalida.appendChild(elementoLinea);
    Webgoritmo.DOM.consolaSalida.scrollTop = Webgoritmo.DOM.consolaSalida.scrollHeight;
};

Webgoritmo.UI.poblarSelectorEjemplos = function(dom, datos) {
    const ejemplosSelectEl = dom ? dom.ejemplosSelect : null;
    const codigosEjemploObj = datos ? datos.codigosEjemplo : null;

    if (!ejemplosSelectEl || !codigosEjemploObj) {
        console.error("poblarSelectorEjemplos: Elemento select o datos.codigosEjemplo no disponibles.");
        return;
    }

    while (ejemplosSelectEl.options.length > 1) { // Dejar la opción "-- Seleccione --"
        ejemplosSelectEl.remove(1);
    }

    // Mapeo de claves a nombres descriptivos/cortos
    const nombresParaSelector = {
        salida_literal_f1: "F1: Escribir Literal",
        variables_basicas_f2: "F2: Variables Básico",
        entrada_leer_f3: "F3: Leer Básico",
        expresiones_f4: "F4: Expresiones Arit/Lóg",
        condicional_si_f5: "F5: Si-Sino Básico",
        condicional_sinosi_f6: "F6: Si-SinoSi-Sino", // Nuevo para Fase 6
        arreglos_dimension_f11: "F11: Arreglos (Dimensión)",
        // Añadir más ejemplos de fases previas si se desea que aparezcan
    };

    // Crear opciones para cada ejemplo en codigosEjemploObj
    // Iterar sobre nombresParaSelector para controlar el orden y los nombres mostrados preferentemente
    for (const clave in nombresParaSelector) {
        if (codigosEjemploObj.hasOwnProperty(clave)) {
            const option = document.createElement('option');
            option.value = clave;
            option.textContent = nombresParaSelector[clave];
            ejemplosSelectEl.appendChild(option);
        }
    }

    // Añadir cualquier otro ejemplo en codigosEjemploObj que no esté en nombresParaSelector (para desarrollo)
    for (const clave in codigosEjemploObj) {
        if (codigosEjemploObj.hasOwnProperty(clave) && !nombresParaSelector.hasOwnProperty(clave)) {
            const option = document.createElement('option');
            option.value = clave;
            option.textContent = clave.replace(/_/g, ' ').charAt(0).toUpperCase() + clave.replace(/_/g, ' ').slice(1); // Nombre por defecto
            ejemplosSelectEl.appendChild(option);
        }
    }
    console.log("uiManager.js: Selector de ejemplos poblado (Fase 6 SinoSi).");
};

Webgoritmo.UI.cargarPlantillaInicial = function() {
    const claveEjemploPorDefecto = 'condicional_sinosi_f6'; // Cargar ejemplo de Si-SinoSi por defecto
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo &&
        Webgoritmo.Datos && Webgoritmo.Datos.codigosEjemplo &&
        Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto]) {

        let codigoInicial = Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto];
        Webgoritmo.Editor.editorCodigo.setValue(codigoInicial);
        console.log(`uiManager.js: Plantilla inicial '${claveEjemploPorDefecto}' cargada en el editor.`);
    } else {
        console.warn(`uiManager.js: No se pudo cargar plantilla inicial '${claveEjemploPorDefecto}'. Verifique datosEjemplos.js.`);
        if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo && Webgoritmo.Datos && Webgoritmo.Datos.codigosEjemplo) {
            const primeraClaveDisponible = Object.keys(Webgoritmo.Datos.codigosEjemplo)[0];
            if (primeraClaveDisponible) {
                Webgoritmo.Editor.editorCodigo.setValue(Webgoritmo.Datos.codigosEjemplo[primeraClaveDisponible]);
                console.log(`uiManager.js: Fallback: Plantilla inicial '${primeraClaveDisponible}' cargada.`);
            } else {
                 console.warn("uiManager.js: No hay ejemplos disponibles para cargar como fallback.");
            }
        }
    }
};

console.log("uiManager.js cargado y Webgoritmo.UI actualizado (Fase 6 SinoSi).");
