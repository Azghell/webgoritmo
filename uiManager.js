// uiManager.js (ESTADO ESTABLE REVERTIDO)
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

    while (ejemplosSelectEl.options.length > 1) {
        ejemplosSelectEl.remove(1);
    }

    // Nombres en el estado en que estaban cuando las expresiones con arreglos funcionaban
    const nombresParaSelector = {
        expresiones_f4: "Expresiones: Arit/Lóg", // Este era el nombre que tenía
        prueba_acceso_arreglos_expresion: "Test: Arreglos en Expr.",
        entrada_leer_f3: "Test: Leer Básico",
        // Aquí podrían faltar los ejemplos de F1, F2 si no estaban en ese commit específico.
        // Por ahora, nos enfocamos en los que estaban al momento de la estabilidad.
    };

    for (const clave in codigosEjemploObj) {
        if (codigosEjemploObj.hasOwnProperty(clave)) {
            const option = document.createElement('option');
            option.value = clave;
            option.textContent = nombresParaSelector[clave] || clave.replace(/_/g, ' ').charAt(0).toUpperCase() + clave.replace(/_/g, ' ').slice(1);
            ejemplosSelectEl.appendChild(option);
        }
    }
    console.log("uiManager.js: Selector de ejemplos poblado (ESTADO ESTABLE REVERTIDO).");
};

Webgoritmo.UI.cargarPlantillaInicial = function() {
    // Cargar el ejemplo de prueba de acceso a arreglos por defecto, ya que ese funcionaba
    const claveEjemploPorDefecto = 'prueba_acceso_arreglos_expresion';
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo &&
        Webgoritmo.Datos && Webgoritmo.Datos.codigosEjemplo &&
        Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto]) {

        let codigoInicial = Webgoritmo.Datos.codigosEjemplo[claveEjemploPorDefecto];
        Webgoritmo.Editor.editorCodigo.setValue(codigoInicial);
        console.log(`uiManager.js: Plantilla inicial '${claveEjemploPorDefecto}' cargada (ESTADO ESTABLE REVERTIDO).`);
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

console.log("uiManager.js cargado y Webgoritmo.UI actualizado (ESTADO ESTABLE REVERTIDO).");
