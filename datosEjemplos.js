// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

// Estado correspondiente al commit donde PruebaAccesoArregloExpresion funcionaba completamente
Webgoritmo.Datos.codigosEjemplo = {
    expresiones_f4: `Algoritmo PruebaExpresiones
    Definir a, b, c Como Entero
    Definir resultado Como Real
    Definir esValido Como Logico
    Definir mensaje Como Cadena

    a <- 10
    b <- 4
    c <- 2
    mensaje <- "Resultado: "

    resultado <- (a + b) * c / (b - c) + (a MOD b) // Esperado: 16
    Escribir mensaje, resultado

    esValido <- (a > b Y b > c) O (a < 5) // Esperado: Verdadero
    Escribir "La condición es: ", esValido

    Escribir "Negación de esValido: ", NO esValido // Esperado: Falso
FinAlgoritmo`,
    prueba_acceso_arreglos_expresion: `Algoritmo PruebaArregloIndiceVariable
    Definir notas Como Real[3]

    notas[1] <- 10.5
    notas[2] <- 20.8
    notas[3] <- 30.2

    Escribir "notas[1] asignado como: ", notas[1]

    Definir idx Como Entero
    idx <- 1
    Escribir "Usando idx = 1, notas[idx] es: ", notas[idx] // Debe mostrar 10.5

    idx <- 2
    Escribir "Usando idx = 2, notas[idx] es: ", notas[idx] // Debe mostrar 20.8
FinAlgoritmo`,
    entrada_leer_f3: `Algoritmo PruebaLeerBasico
    Definir nombre Como Cadena
    Definir edad Como Entero
    Escribir "Bienvenido. Por favor, ingresa tu nombre:"
    Leer nombre
    Escribir "Hola ", nombre, ". Ahora ingresa tu edad:"
    Leer edad
    Escribir "Gracias, ", nombre, ". Tienes ", edad, " años."
FinAlgoritmo`
};

console.log("datosEjemplos.js (Actualizado con prueba de índice variable) cargado.");
