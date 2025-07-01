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
    prueba_acceso_arreglos_expresion: `Algoritmo PruebaAccesoArregloExpresion
    Definir notas Como Real[3]
    Definir res Como Real

    notas[1] <- 10.0
    notas[2] <- 7.5
    Escribir "notas[1] es: ", notas[1]
    Escribir "notas[2] es: ", notas[2]

    res <- (notas[1] + notas[2]) / 2
    Escribir "El resultado de (notas[1] + notas[2]) / 2 es: ", res

    Definir otraNota Como Entero
    otraNota <- 1
    Escribir "Accediendo con variable de índice notas[otraNota]: ", notas[otraNota]

    // Prueba de asignación a un elemento usando una expresión de acceso
    notas[otraNota + 1] <- notas[1] - 1.5 // notas[2] <- 10.0 - 1.5 = 8.5
    Escribir "Nuevo notas[2] deberia ser 8.5: ", notas[2]
FinAlgoritmo`,
    // Otros ejemplos que teníamos en ese punto, si es necesario recuperarlos.
    // Por ahora, nos centramos en los que prueban la funcionalidad que se había alcanzado.
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

console.log("datosEjemplos.js (ESTADO ESTABLE REVERTIDO) cargado.");
