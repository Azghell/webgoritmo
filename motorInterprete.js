// motorInterprete.js (Versión Mínima Absoluta)
window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {
  testProperty: "Interprete Mínimo Cargado",
  ejecutarPseudocodigo: async function() {
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
      Webgoritmo.UI.añadirSalida("Ejecución desde el intérprete MÍNIMO ABSOLUTO.", "normal");
    }
    console.log("ejecutarPseudocodigo del intérprete MÍNIMO ABSOLUTO llamado.");
  }
};
console.log("motorInterprete.js (MÍNIMO ABSOLUTO) cargado. Webgoritmo.Interprete DEFINIDO.");
