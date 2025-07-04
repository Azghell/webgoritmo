// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.codigosEjemplo = {
    /* REVERTIDO - Ejemplo Mientras comentado para evitar errores ya que la funcionalidad no está.
    prueba_mientras_simple: `Algoritmo PruebaMientrasSimple
    Definir contador Como Entero
    Definir limite Como Entero

    Escribir "--- Prueba 1: Bucle Mientras que se ejecuta varias veces ---"
    contador <- 0
    limite <- 3
    Mientras contador < limite Hacer
        Escribir "Contador: ", contador
        contador <- contador + 1
    FinMientras
    Escribir "Bucle Mientras finalizado. Contador final: ", contador // Esperado: 3

    Escribir "---------------------------------------------"
    Escribir "--- Prueba 2: Bucle Mientras cuya condición es falsa inicialmente ---"
    contador <- 5
    limite <- 3
    // Condición (5 < 3) es Falsa, el bloque no debería ejecutarse
    Mientras contador < limite Hacer
        Escribir "DENTRO DEL BUCLE MIENTRAS (NO DEBERIA APARECER) - Contador: ", contador
        contador <- contador + 100
    FinMientras
    Escribir "Bucle Mientras (condición falsa) finalizado. Contador final: ", contador // Esperado: 5

    Escribir "---------------------------------------------"
    // Prueba 3 (Corregida para terminar)
    Escribir "--- Prueba 3 (Corregida): Bucle Mientras que termina ---"
    contador <- 0
    Definir seguirEnBucle Como Logico
    seguirEnBucle <- Verdadero
    Mientras seguirEnBucle Hacer
        Escribir "Iteración Mientras (Prueba 3): ", contador
        contador <- contador + 1
        Si contador >= 2 Entonces
            seguirEnBucle <- Falso
        FinSi
    FinMientras
    Escribir "Bucle Mientras (Prueba 3) finalizado. Contador: ", contador // Esperado: 2

FinAlgoritmo`,
    */
    prueba_para_simple: `Algoritmo PruebaParaComplejo
    Definir i, j, k, suma Como Entero
    Definir x, varY, z, p Como Entero // 'y' fue cambiada a 'varY' para no ser palabra reservada

    Escribir "CASO 1: Bucle Para simple (1 a 3, paso 1)"
    suma <- 0
    Para i <- 1 Hasta 3 Hacer
        Escribir "Iteración i: ", i
        suma <- suma + i
    FinPara
    Escribir "Bucle (1 a 3) finalizado. Suma: ", suma // Esperado: 6

    Escribir "-------------------------------------"
    Escribir "CASO 2: Bucle Para con paso negativo (3 a 1, paso -1)"
    suma <- 0
    Para i <- 3 Hasta 1 Con Paso -1 Hacer
        Escribir "Iteración i: ", i
        suma <- suma + i
    FinPara
    Escribir "Bucle (3 a 1, paso -1) finalizado. Suma: ", suma // Esperado: 6

    Escribir "-------------------------------------"
    Escribir "CASO 3: Bucle Para que no se ejecuta (5 a 1, paso 1)"
    suma <- 100
    Para i <- 5 Hasta 1 Hacer
        Escribir "DENTRO DE BUCLE NO EJECUTADO (5 a 1) - ERROR SI APARECE"
        suma <- 999
    FinPara
    Escribir "Bucle (5 a 1) no ejecutado finalizado. Suma: ", suma // Esperado: 100

    Escribir "-------------------------------------"
    Escribir "CASO 4: Bucle Para con expresiones en límites y paso"
    x <- 1
    varY <- 2
    z <- 3
    p <- 5
    // Bucle de x=1 hasta varY+p=(2+5)=7 con paso z-1=(3-1)=2  => i = 1, 3, 5, 7
    suma <- 0
    Para i <- x Hasta varY+p Con Paso z-1 Hacer
        Escribir "Iteración i con expresiones: ", i
        suma <- suma + i
    FinPara
    Escribir "Bucle con expresiones finalizado. Suma: ", suma // Esperado: 1+3+5+7 = 16

    Escribir "-------------------------------------"
    Escribir "CASO 5: Bucles Para anidados"
    Para i <- 1 Hasta 2 Hacer
        Escribir "  Ciclo Exterior i: ", i
        Para j <- 1 Hasta 3 Hacer
            Escribir "    Ciclo Interior j: ", j
        FinPara
        Escribir "  --- Fin ciclo interno j ---"
    FinPara
    Escribir "Bucles anidados finalizados."

    Escribir "-------------------------------------"
    Escribir "CASO 6: Bucle Para con Si-Entonces-Sino anidado"
    Para k <- 1 Hasta 5 Hacer
        Escribir "k = ", k
        Si k MOD 2 = 0 Entonces
            Escribir "  ", k, " es par"
            Si k = 4 Entonces
                Escribir "    Además, k es cuatro!"
            Sino
                Escribir "    k no es cuatro, pero es par."
            FinSi
        Sino
            Escribir "  ", k, " es impar"
            Si k = 1 O k = 5 Entonces
                 Escribir "    k es uno o cinco!"
            FinSi
        FinSi
        Escribir "  ---"
    FinPara
    Escribir "Bucle Para con Si-Entonces-Sino anidado finalizado."

FinAlgoritmo`,
    prueba_si_entonces_simple: `Algoritmo PruebaSiEntoncesSinoCompleto
    Definir a, b, c Como Entero
    Definir mensaje Como Cadena

    Escribir "--- Caso 1: Si Verdadero, con Sino ---"
    a <- 10
    b <- 5
    mensaje <- "Inicial"
    Si a > b Entonces
        mensaje <- "a > b (VERDADERO)"
        Escribir "Bloque Entonces ejecutado. Mensaje: ", mensaje
        a <- 100
    Sino
        mensaje <- "a NO > b (FALSO) - ERROR SI APARECE"
        Escribir "Bloque Sino ejecutado. Mensaje: ", mensaje
        b <- 200
    FinSi
    Escribir "Resultado Caso 1: a=", a, ", b=", b, ", mensaje='", mensaje, "'"

    Escribir "--- Caso 2: Si Falso, con Sino ---"
    a <- 5
    b <- 10
    mensaje <- "Inicial"
    Si a > b Entonces
        mensaje <- "a > b (VERDADERO) - ERROR SI APARECE"
        Escribir "Bloque Entonces ejecutado. Mensaje: ", mensaje
        a <- 100
    Sino
        mensaje <- "a NO > b (FALSO)"
        Escribir "Bloque Sino ejecutado. Mensaje: ", mensaje
        b <- 200
    FinSi
    Escribir "Resultado Caso 2: a=", a, ", b=", b, ", mensaje='", mensaje, "'"

    Escribir "--- Caso 3: Si Anidado con Sino ---"
    a <- 1
    b <- 2
    c <- 3
    mensaje <- "Anidado Ini"
    Si a < b Entonces
        mensaje <- "Exterior V"
        Escribir "Exterior Si (V). Mensaje: ", mensaje
        Si b < c Entonces
            mensaje <- "Interior V"
            Escribir "Interior Si (V). Mensaje: ", mensaje
            a <- 10
        Sino
            mensaje <- "Interior F - ERROR"
            Escribir "Interior Sino (ERROR). Mensaje: ", mensaje
            b <- 20
        FinSi
        Escribir "Exterior Si (V) - Post Interior. Mensaje: ", mensaje, ", a=",a,", b=",b
        c <- 30
    Sino
        mensaje <- "Exterior F - ERROR"
        Escribir "Exterior Sino (ERROR). Mensaje: ", mensaje
        c <- 40
    FinSi
    Escribir "Resultado Caso 3: a=",a,", b=",b,", c=",c,", mensaje='",mensaje,"'"

    Escribir "--- Caso 4: Si Anidado con Sino (Interior Falso) ---"
    a <- 1
    b <- 3
    c <- 2
    mensaje <- "Anidado Ini 2"
    Si a < b Entonces
        mensaje <- "Exterior V (2)"
        Escribir "Exterior Si (V) (2). Mensaje: ", mensaje
        Si b < c Entonces
            mensaje <- "Interior V - ERROR (2)"
            Escribir "Interior Si (ERROR) (2). Mensaje: ", mensaje
            a <- 10
        Sino
            mensaje <- "Interior F (2)"
            Escribir "Interior Sino (2). Mensaje: ", mensaje
            b <- 20
        FinSi
        Escribir "Exterior Si (V) - Post Interior (2). Mensaje: ", mensaje, ", a=",a,", b=",b
        c <- 30
    Sino
        mensaje <- "Exterior F - ERROR (2)"
        Escribir "Exterior Sino (ERROR) (2). Mensaje: ", mensaje
        c <- 40
    FinSi
    Escribir "Resultado Caso 4: a=",a,", b=",b,", c=",c,", mensaje='",mensaje,"'"

    Escribir "--- Caso 5: Si Anidado (Exterior Falso) ---"
    a <- 3
    b <- 1
    c <- 2
    mensaje <- "Anidado Ini 3"
    Si a < b Entonces
        mensaje <- "Exterior V - ERROR (3)"
        Escribir "Exterior Si (ERROR) (3). Mensaje: ", mensaje
        a <- 10
    Sino
        mensaje <- "Exterior F (3)"
        Escribir "Exterior Sino (3). Mensaje: ", mensaje
        Si b < c Entonces
             mensaje <- "Interior (en Exterior F) V (3)"
             Escribir "Interior (en Ext F) Si (V) (3). Mensaje: ", mensaje
             b <- 200
        Sino
             mensaje <- "Interior (en Exterior F) F - ERROR (3)"
             Escribir "Interior (en Ext F) Sino (ERROR) (3). Mensaje: ", mensaje
             c <- 300
        FinSi
        Escribir "Exterior Sino (3) - Post Interior. Mensaje: ", mensaje, ", b=",b,", c=",c
        a <- 500
    FinSi
    Escribir "Resultado Caso 5: a=",a,", b=",b,", c=",c,", mensaje='",mensaje,"'"

FinAlgoritmo`,
    prueba_acceso_arreglos_expresion: `Algoritmo PruebaArregloLogicoRelacional
    Definir notas Como Real[3]
    Definir idx Como Entero
    Definir esVerdadero, esFalso Como Logico
    Definir condicionA, condicionB, condicionFinal Como Logico

    notas[1] <- 10.0
    notas[2] <- 20.0
    notas[3] <- 10.0
    idx <- 1
    Escribir "Valores iniciales: notas[1]=", notas[1], ", notas[2]=", notas[2], ", notas[3]=", notas[3], ", idx=", idx
    esVerdadero <- notas[idx+1] > notas[idx]
    Escribir "notas[idx+1] > notas[idx] (20.0 > 10.0) es: ", esVerdadero
    esFalso <- notas[idx] > notas[idx+1]
    Escribir "notas[idx] > notas[idx+1] (10.0 > 20.0) es: ", esFalso
    condicionA <- notas[idx] = notas[3]
    Escribir "notas[idx] = notas[3] (10.0 = 10.0) es: ", condicionA
    condicionB <- notas[1] <> notas[3]
    Escribir "notas[1] <> notas[3] (10.0 <> 10.0) es: ", condicionB
    Escribir "--- Pruebas Lógicas ---"
    condicionFinal <- esVerdadero Y condicionA
    Escribir "esVerdadero Y condicionA (V Y V) es: ", condicionFinal
    condicionFinal <- esVerdadero Y esFalso
    Escribir "esVerdadero Y esFalso (V Y F) es: ", condicionFinal
    condicionFinal <- esFalso O condicionA
    Escribir "esFalso O condicionA (F O V) es: ", condicionFinal
    condicionFinal <- NO esFalso
    Escribir "NO esFalso es: ", condicionFinal
    idx <- 2
    condicionA <- (notas[idx] > 15.0) Y (notas[idx-1] < 15.0)
    Escribir "(notas[idx] > 15.0) Y (notas[idx-1] < 15.0) es: ", condicionA
    condicionB <- (notas[1] = 10.0) O (notas[3] < 5.0)
    Escribir "(notas[1] = 10.0) O (notas[3] < 5.0) es: ", condicionB
    condicionFinal <- NO (condicionA Y condicionB) Y ( (notas[1]+notas[3])/2 = 10.0 )
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
    resultado <- (a + b) * c / (b - c) + (a MOD b)
    Escribir mensaje, resultado
    esValido <- (a > b Y b > c) O (a < 5)
    Escribir "La condición es: ", esValido
    Escribir "Negación de esValido: ", NO esValido
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
    Definir i Como Entero
    i <- 20
    Escribir "Valor de i: ", i
    FinSi // FinSi sin un Si previo
    Escribir "Esta línea tampoco debería alcanzarse"
FinAlgoritmo`
};

console.log("datosEjemplos.js (Restaurado PruebaParaComplejo, Mientras comentado) cargado.");
