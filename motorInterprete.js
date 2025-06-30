// motorInterprete.js (Versión Mínima de Prueba)
window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Interprete = {
  testProperty: "Versión mínima cargada correctamente",
  ejecutarPseudocodigo: async function() {
    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
      Webgoritmo.UI.añadirSalida("Ejecutando desde la versión MÍNIMA de motorInterprete.js", "normal");
      Webgoritmo.UI.añadirSalida("La prueba mínima parece funcionar. El problema está en el contenido completo del motor.", "normal");
    }
    console.log("Versión mínima de ejecutarPseudocodigo llamada.");
  }
};

console.log("motorInterprete.js (VERSIÓN MÍNIMA) cargado. Webgoritmo.Interprete DEBERÍA estar definido.");
