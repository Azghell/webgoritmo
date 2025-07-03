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
    prueba_acceso_arreglos_expresion: `Algoritmo PruebaArreglosExpresiones
    Definir notas Como Real
    Dimension notas[3] // Define 'notas' como un arreglo de 3 elementos de tipo Real
    Definir res Como Real
    Definir otraNota Como Entero

    Escribir "Asignando valores iniciales..."
    notas[1] <- 10.0
    notas[2] <- 7.5
    notas[3] <- 9.0 // Inicializar todos los elementos

    Escribir "notas[1] es: ", notas[1]
    Escribir "notas[2] es: ", notas[2]
    Escribir "notas[3] es: ", notas[3]

    res <- (notas[1] + notas[2] + notas[3]) / 3
    Escribir "El promedio de las tres notas es: ", res

    otraNota <- 1
    Escribir "Accediendo con variable de índice notas[otraNota]: ", notas[otraNota]

    Escribir "Modificando notas[otraNota + 1] (es decir, notas[2])..."
    // notas[2] actualmente es 7.5
    // se le asignará notas[1] - 1.5  => 10.0 - 1.5 = 8.5
    notas[otraNota + 1] <- notas[1] - 1.5
    Escribir "Nuevo valor de notas[2] (debería ser 8.5): ", notas[2]

    Escribir "Verificando el promedio de nuevo con el valor modificado..."
    // (10.0 + 8.5 + 9.0) / 3 = 27.5 / 3 = 9.166...
    res <- (notas[1] + notas[2] + notas[3]) / 3
    Escribir "El nuevo promedio es: ", res
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

console.log("datosEjemplos.js (Actualizado con ejemplo de arreglos mejorado) cargado.");
