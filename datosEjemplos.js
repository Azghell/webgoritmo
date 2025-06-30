// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.codigosEjemplo = { // Cambiado a 'codigosEjemplo' para reflejar nuevo enfoque
    salida_literal_cadena: `Algoritmo PruebaSalidaLiteral
    Escribir "Hola Mundo desde Webgoritmo!"
    Escribir "Esta es otra línea de texto."
    Escribir "Y una más, con números: 12345"
FinAlgoritmo`
};

// También actualizaremos uiManager.js para usar esta nueva estructura y nombres.
// Por ahora, el console.log se referirá al nombre antiguo hasta que se actualice uiManager.
console.log("datosEjemplos.js cargado y Webgoritmo.Datos.codigosEjemplo definido con el primer ejemplo nuevo.");
