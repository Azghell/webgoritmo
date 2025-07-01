// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.codigosEjemplo = {
    variables_basicas_f2: `Algoritmo PruebaVariablesBasicas
    Definir mensaje Como Cadena
    Definir contador Como Entero
    Definir precio Como Real
    Definir activo Como Logico

    mensaje <- "Bienvenido"
    contador <- 10
    precio <- 99.95
    activo <- Verdadero

    Escribir "Mensaje: ", mensaje
    Escribir "Contador: ", contador
    Escribir "Precio: ", precio
    Escribir "Activo: ", activo

    // La siguiente línea está diseñada para fallar en Fase 2,
    // ya que el evaluador de expresiones aún no maneja operaciones.
    // Debería producir un error como "'contador + 5' no es un literal simple".
    contador <- contador + 5
    Escribir "Contador modificado (espera error o no cambio): ", contador
FinAlgoritmo`
};

console.log("datosEjemplos.js cargado y Webgoritmo.Datos.codigosEjemplo actualizado para Fase 2 (variables_basicas_f2).");
