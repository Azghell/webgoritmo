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
    prueba_acceso_arreglos_expresion: `Algoritmo PruebaArregloExpresionIndice
    Definir notas Como Real[3]
    Definir idx Como Entero
    Definir valorCalculado Como Real

    // Asignar valores iniciales
    notas[1] <- 10.0
    notas[2] <- 20.0
    notas[3] <- 30.0
    idx <- 1

    Escribir "Valor inicial de notas[idx+1] (notas[2]): ", notas[idx+1] // Esperado: 20.0

    Escribir "Asignando 25.0 a notas[idx+1]..."
    notas[idx+1] <- 25.0 // notas[2] ahora debería ser 25.0
    Escribir "Nuevo valor de notas[2]: ", notas[2] // Esperado: 25.0

    // idx sigue siendo 1
    Escribir "Verificando notas[idx+1] de nuevo: ", notas[idx+1] // Esperado: 25.0

    valorCalculado <- notas[idx+1] * 2 // 25.0 * 2
    Escribir "notas[idx+1] * 2 (25.0 * 2): ", valorCalculado // Esperado: 50.0

    idx <- 0
    // Prueba con expresión más compleja en el índice
    notas[idx + (3 - 1)] <- notas[1] + 5.5 // notas[0 + 2] = notas[2] <- 10.0 + 5.5 = 15.5
                                           // Como notas[2] era 25.0, ahora será 15.5
    Escribir "Después de notas[idx + (3-1)] <- notas[1] + 5.5"
    Escribir "notas[1]: ", notas[1] // Esperado: 10.0
    Escribir "notas[2]: ", notas[2] // Esperado: 15.5
    Escribir "notas[3]: ", notas[3] // Esperado: 30.0

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

console.log("datosEjemplos.js (Actualizado con prueba de expresiones en índice) cargado.");
