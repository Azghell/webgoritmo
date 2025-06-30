// evaluadorExpresiones.js (Versión Mínima Absoluta)
window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Expresiones = {
  testProperty: "Expresiones Mínimas Cargadas",
  evaluarExpresion: async function(expr, scope) {
    console.log(`evaluarExpresion (MÍNIMO ABSOLUTO) llamado con: ${expr}`);
    // Devolver un valor mock para evitar errores si se llama
    if (expr.includes('"')) return expr.replace(/"/g, ''); // Si es literal de cadena
    if (!isNaN(parseFloat(expr))) return parseFloat(expr); // Si es número
    return 0; // Default
  }
};
console.log("evaluadorExpresiones.js (MÍNIMO ABSOLUTO) cargado. Webgoritmo.Expresiones DEFINIDO.");
