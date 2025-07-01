// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.codigosEjemplo = {
    entrada_leer_f3: `Algoritmo PruebaLeerBasico
    Definir nombre Como Cadena
    Definir edad Como Entero

    Escribir "Bienvenido. Por favor, ingresa tu nombre:"
    Leer nombre
    Escribir "Hola ", nombre, ". Ahora ingresa tu edad:"
    Leer edad
    Escribir "Gracias, ", nombre, ". Tienes ", edad, " años."

    Definir val1 Como Entero
    Definir val2 Como Cadena
    Escribir "Ingresa un número y luego una palabra (separados por espacio o coma):"
    Leer val1, val2
    Escribir "Número ingresado: ", val1
    Escribir "Palabra ingresada: ", val2
FinAlgoritmo`
};

console.log("datosEjemplos.js cargado para Fase 3 (entrada_leer_f3).");
