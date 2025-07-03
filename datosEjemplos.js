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
    prueba_acceso_arreglos_expresion: `Algoritmo PruebaArregloLogicoRelacional
    Definir notas Como Real[3]
    Definir idx Como Entero
    Definir esVerdadero, esFalso Como Logico
    Definir condicionA, condicionB, condicionFinal Como Logico

    // Asignar valores iniciales
    notas[1] <- 10.0
    notas[2] <- 20.0
    notas[3] <- 10.0 // notas[3] igual a notas[1] para algunas pruebas
    idx <- 1

    Escribir "Valores iniciales: notas[1]=", notas[1], ", notas[2]=", notas[2], ", notas[3]=", notas[3], ", idx=", idx

    // Pruebas Relacionales
    esVerdadero <- notas[idx+1] > notas[idx]  // 20.0 > 10.0 -> Verdadero
    Escribir "notas[idx+1] > notas[idx] (20.0 > 10.0) es: ", esVerdadero

    esFalso <- notas[idx] > notas[idx+1]    // 10.0 > 20.0 -> Falso
    Escribir "notas[idx] > notas[idx+1] (10.0 > 20.0) es: ", esFalso

    condicionA <- notas[idx] = notas[3]      // 10.0 = 10.0 -> Verdadero
    Escribir "notas[idx] = notas[3] (10.0 = 10.0) es: ", condicionA

    condicionB <- notas[1] <> notas[3]     // 10.0 <> 10.0 -> Falso
    Escribir "notas[1] <> notas[3] (10.0 <> 10.0) es: ", condicionB

    // Pruebas Lógicas
    Escribir "--- Pruebas Lógicas ---"
    condicionFinal <- esVerdadero Y condicionA  // Verdadero Y Verdadero -> Verdadero
    Escribir "esVerdadero Y condicionA (V Y V) es: ", condicionFinal

    condicionFinal <- esVerdadero Y esFalso     // Verdadero Y Falso -> Falso
    Escribir "esVerdadero Y esFalso (V Y F) es: ", condicionFinal

    condicionFinal <- esFalso O condicionA      // Falso O Verdadero -> Verdadero
    Escribir "esFalso O condicionA (F O V) es: ", condicionFinal

    condicionFinal <- NO esFalso               // NO Falso -> Verdadero
    Escribir "NO esFalso es: ", condicionFinal

    // Combinada más compleja
    idx <- 2 // notas[idx] es notas[2] = 20.0
             // notas[idx-1] es notas[1] = 10.0
    condicionA <- (notas[idx] > 15.0) Y (notas[idx-1] < 15.0) // (20.0 > 15.0) Y (10.0 < 15.0) -> V Y V -> V
    Escribir "(notas[idx] > 15.0) Y (notas[idx-1] < 15.0) es: ", condicionA

    condicionB <- (notas[1] = 10.0) O (notas[3] < 5.0)       // (10.0 = 10.0) O (10.0 < 5.0) -> V O F -> V
    Escribir "(notas[1] = 10.0) O (notas[3] < 5.0) es: ", condicionB

    condicionFinal <- NO (condicionA Y condicionB) Y ( (notas[1]+notas[3])/2 = 10.0 ) // NO(V Y V) Y ( (10+10)/2 = 10 ) -> NO(V) Y (V) -> F Y V -> F
    Escribir "NO(condA Y condB) Y ((notas[1]+notas[3])/2 = 10.0) es: ", condicionFinal
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

console.log("datosEjemplos.js (Actualizado con prueba de ops lógicos/relacionales en arreglos) cargado.");
