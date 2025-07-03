// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.codigosEjemplo = {
    prueba_si_entonces_simple: `Algoritmo PruebaSiEntoncesSimple
    Definir a, b Como Entero
    Definir mensaje Como Cadena

    a <- 10
    b <- 5
    mensaje <- "Inicial"

    Escribir "Antes del Si. a=", a, ", b=", b, ", mensaje='", mensaje, "'"

    Si a > b Entonces
        mensaje <- "a es mayor que b"
        Escribir "Dentro del Si (Condición Verdadera). Mensaje ahora es: '", mensaje, "'"
        a <- a + 1
    FinSi

    Escribir "Después del Primer Si. a=", a, ", b=", b, ", mensaje='", mensaje, "'" // a debería ser 11, mensaje cambiado

    // Prueba con condición falsa
    b <- 15 // Ahora b > a (a es 11, b es 15)
    Escribir "Preparando para Si con condición Falsa. a=", a, ", b=", b

    Si a > b Entonces // 11 > 15 es Falso, este bloque no debería ejecutarse
        mensaje <- "Este mensaje NO debería aparecer"
        Escribir "DENTRO DEL SI FALSO. Mensaje ahora es: '", mensaje, "'"
        a <- 999
    FinSi

    Escribir "Después del Segundo Si (Condición Falsa). a=", a, ", b=", b, ", mensaje='", mensaje, "'"
    // a debería seguir siendo 11, mensaje debería ser "a es mayor que b"

    // Prueba de Si anidado
    Escribir "--- Prueba Si Anidado ---"
    a <- 5
    b <- 10
    Definir c Como Entero
    c <- 15
    Escribir "Valores para Si anidado: a=",a,", b=",b,", c=",c

    Si a < b Entonces // 5 < 10 -> Verdadero
        Escribir "Exterior Si (V): a < b"
        mensaje <- "Exterior V"
        Si b < c Entonces // 10 < 15 -> Verdadero
            Escribir "Interior Si (V): b < c"
            mensaje <- "Interior V"
            a <- 100
        FinSi
        Escribir "Exterior Si (V) - Después de Interior. Mensaje='",mensaje,"', a=",a // mensaje="Interior V", a=100
        b <- 200
    FinSi
    Escribir "Después de Si anidado. Mensaje='",mensaje,"', a=",a,", b=",b // mensaje="Interior V", a=100, b=200

    // Prueba de Si anidado con el interno falso
    Escribir "--- Prueba Si Anidado (interno falso) ---"
    a <- 5
    b <- 15 // b > c para que el interno sea falso
    c <- 10
    Escribir "Valores: a=",a,", b=",b,", c=",c

    Si a < b Entonces // 5 < 15 -> Verdadero
        Escribir "Exterior Si (V): a < b"
        mensaje <- "Exterior V de nuevo"
        Si b < c Entonces // 15 < 10 -> Falso -> No se ejecuta
            Escribir "ESTO NO DEBERIA APARECER (Interior Si Falso)"
            mensaje <- "Interior Falso - ERROR"
            a <- 999
        FinSi
        Escribir "Exterior Si (V) - Después de Interior Falso. Mensaje='",mensaje,"', a=",a // mensaje="Exterior V de nuevo", a=5
        b <- 777
    FinSi
    Escribir "Después de Si anidado (interno falso). Mensaje='",mensaje,"', a=",a,", b=",b // mensaje="Exterior V de nuevo", a=5, b=777

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
    entrada_leer_f3: `Algoritmo PruebaLeerBasico
    Definir nombre Como Cadena
    Definir edad Como Entero
    Escribir "Bienvenido. Por favor, ingresa tu nombre:"
    Leer nombre
    Escribir "Hola ", nombre, ". Ahora ingresa tu edad:"
    Leer edad
    Escribir "Gracias, ", nombre, ". Tienes ", edad, " años."
FinAlgoritmo`,
    prueba_error_si_sin_finsi: `Algoritmo ErrorSiSinFinSi
    Definir x Como Entero
    x <- 10
    Si x > 5 Entonces
        Escribir "x es mayor que 5"
    // Falta FinSi aquí
    Escribir "Esta línea no debería alcanzarse si hay error"
FinAlgoritmo`,
    prueba_error_finsi_huerfano: `Algoritmo ErrorFinSiHuerfano
    Definir y Como Entero
    y <- 20
    Escribir "Valor de y: ", y
    FinSi // FinSi sin un Si previo
    Escribir "Esta línea tampoco debería alcanzarse"
FinAlgoritmo`
};

console.log("datosEjemplos.js (Actualizado con ejemplos de error para Si-Entonces) cargado.");
