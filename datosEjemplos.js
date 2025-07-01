// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

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

    resultado <- (a + b) * c / (b - c) + (a MOD b) // Esperado: (14 * 2) / (2) + (2) = 28 / 2 + 2 = 14 + 2 = 16
    Escribir mensaje, resultado

    esValido <- (a > b Y b > c) O (a < 5) // (V Y V) O F  => V O F => V
    Escribir "La condición es: ", esValido

    Escribir "Negación de esValido: ", NO esValido // NO V => F
FinAlgoritmo`,
    // Ejemplo para futura Fase de Arreglos (F11), usando Dimension
    // Lo mantenemos simple por ahora, sin la complejidad de la tipificación flexible total de PSeInt
    arreglos_dimension_f11: `Algoritmo PruebaDimensionBasica
    Dimension temperaturas[7] // Se asumirá numérico por defecto por el intérprete actual
    Definir i Como Entero

    Escribir "Cargando temperaturas de la semana:"
    Para i <- 1 Hasta 7 Hacer // Este bucle Para aún no funciona
        // Leer temperaturas[i] // Leer en arreglos aún no funciona
        temperaturas[i] <- 20 + i // Asignación simple por ahora
    FinPara

    Escribir "Temperaturas ingresadas:"
    Para i <- 1 Hasta 7 Hacer // Este bucle Para aún no funciona
        Escribir "Día ", i, ": ", temperaturas[i], "°C"
    FinPara

    Dimension nombres[3]
    nombres[1] <- "Ana"
    nombres[2] <- "Luis"
    nombres[3] <- "Eva"
    Escribir "Nombres: ", nombres[1], ", ", nombres[2], ", ", nombres[3]
FinAlgoritmo`
    // Aquí se irán añadiendo los ejemplos de cada fase:
    // salida_literal_f1
    // variables_basicas_f2
    // entrada_leer_f3
    // condicional_si_f5
    // etc.
};

console.log("datosEjemplos.js cargado y actualizado (Post Fase 4).");
