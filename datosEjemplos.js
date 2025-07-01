// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.codigosEjemplo = {
    expresiones_arit_log_f4: `Algoritmo PruebaExpresiones
    Definir a, b, c Como Entero
    Definir resultado Como Real
    Definir esValido Como Logico
    Definir mensaje Como Cadena

    a <- 10
    b <- 4
    c <- 2
    mensaje <- "Resultado: "

    resultado <- (a + b) * c / (b - c) + (a MOD b) // Esperado: (14 * 2) / (2) + (2) = 28 / 2 + 2 = 14 + 2 = 16
    Escribir mensaje, resultado

    esValido <- (a > b Y b > c) O (a < 5) // (V Y V) O F  => V O F => V
    Escribir "La condición es: ", esValido

    Escribir "Negación de esValido: ", NO esValido // NO V => F
FinAlgoritmo`
};

console.log("datosEjemplos.js cargado para Fase 4 (expresiones_arit_log_f4).");
