// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.exampleCodes = {
    entrada_salida_basica: `Algoritmo Saludo
	Definir nombre Como Cadena
	Escribir "Por favor, ingresa tu nombre:"
	Leer nombre
	Escribir "Hola, ", nombre, " ¡Bienvenido a Webgoritmo!"
FinAlgoritmo`,
    si_simple: `Algoritmo EjemploSiSimple
	Definir edad Como Entero
	Escribir "Ingrese su edad:"
	Leer edad

	Escribir "Edad ingresada: ", edad
	Si edad >= 18 Entonces
		Escribir "Usted es mayor de edad."
	FinSi
	Escribir "Evaluación de edad completada."
FinAlgoritmo`,
    si_sino: `Algoritmo EjemploSiSino
	Definir numero Como Entero
	Escribir "Ingrese un número:"
	Leer numero

	Escribir "Número ingresado: ", numero
	Si numero > 0 Entonces
		Escribir "El número es positivo."
	Sino
		Escribir "El número NO es positivo."
	FinSi
FinAlgoritmo`,
    condicional_anidado: `Algoritmo EjemploCondicionalAnidado
	Definir calificacion Como Real
	Escribir "Ingrese la calificación (0-10):"
	Leer calificacion

	Escribir "Calificación: ", calificacion
	Si calificacion >= 9 Y calificacion <= 10 Entonces
		Escribir "Sobresaliente."
	Sino
		Si calificacion >= 7 Y calificacion < 9 Entonces
			Escribir "Notable."
		Sino
			Si calificacion >= 5 Y calificacion < 7 Entonces
				Escribir "Aprobado."
			Sino
				Si calificacion >= 0 Y calificacion < 5 Entonces
					Escribir "Reprobado."
				Sino
					Escribir "Calificación fuera de rango o inválida."
				FinSi
			FinSi
		FinSi
	FinSi
FinAlgoritmo`, // Nota: El condicional_complejo original usaba SinoSi, que ahora se interpreta como anidado.
    operadores_logicos: `Algoritmo PruebaLogicaAvanzada
	Definir a Como Entero
	Definir b Como Logico
	a <- 5
	b <- Falso

	Escribir "Prueba de operadores lógicos con a=5, b=Falso:"
	Si a = 5 O b Entonces
		Escribir "  Condición (a=5 O b) es Verdadera"
	FinSi

	Si No b Entonces
		Escribir "  Condición (No b) es Verdadera"
	FinSi

	Si a > 10 Y (No b) Entonces
		Escribir "  Esto NO debería aparecer (a > 10 Y No b)"
	Sino
		Escribir "  Condición (a > 10 Y No b) es Falsa, se ejecuta Sino"
	FinSi
FinAlgoritmo`,
    segun_dia_semana: `Algoritmo DiaSemana
	Definir dia Como Entero
	Escribir "Ingresa un numero del 1 al 7 para el dia de la semana:"
	Leer dia
    Escribir "Día ingresado: ", dia
	Segun dia Hacer
		1: Escribir "Lunes"; 2: Escribir "Martes"; 3: Escribir "Miércoles";
		4: Escribir "Jueves"; 5: Escribir "Viernes"; 6: Escribir "Sábado";
		7: Escribir "Domingo";
		De Otro Modo:
			Escribir "Numero invalido.";
	FinSegun
FinAlgoritmo`,
    mientras_contador: `Algoritmo ContadorMientras
	Definir contador Como Entero
	contador <- 1
	Mientras contador <= 3 Hacer
		Escribir "Contador: ", contador
		contador <- contador + 1
	FinMientras
	Escribir "Fin del contador."
FinAlgoritmo`,
    mientras_con_lectura: `Algoritmo SumaHastaNegativo
    Definir num, suma Como Entero
    suma <- 0
    num <- 0

    Escribir "Ingrese números para sumar. Ingrese un número negativo para terminar."

    Mientras num >= 0 Hacer
        Escribir "Suma actual: ", suma, ". Ingrese un número:"
        Leer num
        Si num >= 0 Entonces
            suma <- suma + num
        FinSi
    FinMientras

    Escribir "Suma final: ", suma
FinAlgoritmo`,
    mientras_anidado_tablas: `Algoritmo TablasMultiplicarBasicas
    Definir tabla, i Como Entero
    tabla <- 1

    Mientras tabla <= 2 Hacer
        Escribir "Tabla del ", tabla, ":"
        i <- 1
        Mientras i <= 3 Hacer
            Escribir tabla, " x ", i, " = ", tabla * i
            i <- i + 1
        FinMientras
        tabla <- tabla + 1
        Escribir ""
    FinMientras
FinAlgoritmo`,
    para_suma_numeros: `Algoritmo SumaDeNumeros
	Definir i, suma, num_max Como Entero
	suma <- 0
	Escribir "Hasta que numero quieres sumar (ej: 3):"
	Leer num_max

	Para i <- 1 Hasta num_max Con Paso 1 Hacer
		suma <- suma + i
	FinPara
	Escribir "La suma total hasta ", num_max, " es: ", suma
FinAlgoritmo`,
    para_cuenta_regresiva: `Algoritmo CuentaRegresiva
    Definir i Como Entero
    Escribir "Cuenta regresiva:"
    Para i <- 5 Hasta 1 Con Paso -1 Hacer
        Escribir i
    FinPara
    Escribir "¡Despegue!"
FinAlgoritmo`,
    para_con_lectura_promedio: `Algoritmo PromedioNotas
    Definir num_notas, i Como Entero
    Definir nota, suma_notas, promedio Como Real

    suma_notas <- 0
    Escribir "Ingrese el número de notas a promediar:"
    Leer num_notas

    Si num_notas > 0 Entonces
        Para i <- 1 Hasta num_notas Hacer
            Escribir "Ingrese la nota ", i, ":"
            Leer nota
            suma_notas <- suma_notas + nota
        FinPara
        promedio <- suma_notas / num_notas
        Escribir "El promedio de las ", num_notas, " notas es: ", promedio
    Sino
        Escribir "No se ingresaron notas para promediar."
    FinSi
FinAlgoritmo`,
    para_no_ejecuta: `Algoritmo ParaNoEjecuta
    Definir x Como Entero
    Escribir "Inicio del algoritmo ParaNoEjecuta"
    Para x <- 10 Hasta 5 Con Paso 1 Hacer
        Escribir "Esta línea NO debería aparecer en la consola."
    FinPara
    Escribir "Fin del algoritmo ParaNoEjecuta"
FinAlgoritmo`,
    repetir_hasta_que_adivina: `Algoritmo AdivinaNumeroSimple
	Definir intento Como Entero
	Definir secreto Como Entero
	secreto <- 7
	Repetir
		Escribir "Adivina el numero secreto (pista: es 7):"
		Leer intento
		Si intento <> secreto Entonces
			Escribir "Incorrecto. Intenta de nuevo."
		FinSi
	Hasta Que intento = secreto
	Escribir "¡Correcto! El numero era ", secreto, "."
FinAlgoritmo`,
    leer_multiples_valores: `Algoritmo LeerMultiplesValores
    Definir nombre Como Cadena
    Definir edad Como Entero
    Definir ciudad Como Cadena

    Escribir "Ingresa tu nombre, edad y ciudad, separados por coma o espacio:"
    Leer nombre, edad, ciudad

    Escribir "Te llamas ", nombre, ", tienes ", edad, " años y vives en ", ciudad, "."
FinAlgoritmo`,
    arreglos_basico: `Algoritmo EjemploArreglosBasico
    // Usando Dimension para declaración implícita de tipo
    Dimension notas_flexibles[3]
    Definir i Como Entero

    Escribir "Arreglo 'notas_flexibles' (tipo se infiere en primera asignación):"
    notas_flexibles[1] <- 70 // Se vuelve Entero/Real
    Escribir "notas_flexibles[1] (después de asignar 70): ", notas_flexibles[1]

    notas_flexibles[2] <- "matematicas" // Ahora todo el arreglo debería tratar de ser Cadena
    Escribir "notas_flexibles[1] (después de asignar texto a [2]): ", notas_flexibles[1]
    Escribir "notas_flexibles[2]: ", notas_flexibles[2]

    notas_flexibles[3] <- Verdadero // Ahora todo el arreglo podría ser Cadena (o fallar si es muy estricto)
    Escribir "notas_flexibles[1] (después de asignar lógico a [3]): ", notas_flexibles[1]
    Escribir "notas_flexibles[2]: ", notas_flexibles[2]
    Escribir "notas_flexibles[3]: ", notas_flexibles[3]


    Escribir "--- Ejemplo con arreglo definido con tipo explícito (Definir) ---"
    Definir nombres Como Cadena[2]
    nombres[1] <- "Ana"
    nombres[2] <- "Juan"
    Escribir "Nombres: ", nombres[1], ", ", nombres[2]

    Definir edades Como Entero[2]
    edades[1] <- 20
    //edades[2] <- "treinta" // Esto debería dar error de tipo si el intérprete es estricto después de definir como Entero
    edades[2] <- 30
    Escribir "Edades: ", edades[1], ", ", edades[2]
FinAlgoritmo`,
    ejemplo_modulo: `Algoritmo ModuloEjemplo
	Definir N, M, Resultado Como Real
	Escribir "Ingrese el dividendo:"
    Leer N
    Escribir "Ingrese el divisor:"
	Leer M

	Escribir "Calculando ", N, " MOD ", M
	Si M = 0 Entonces
	    Escribir "Error: No se puede calcular módulo por cero."
	Sino
        Resultado <- N MOD M
		Escribir "El resto es: ", Resultado
	FinSi
FinAlgoritmo`,
    potencia_y_conversion: `Algoritmo EjemploPotenciaConversion
	Definir base, exponente, resultado Como Real
	Escribir "Ingrese la base para la potencia:"
    Leer base
    Escribir "Ingrese el exponente:"
	Leer exponente

	resultado <- base ^ exponente
	Escribir base, " elevado a ", exponente, " es: ", resultado

    Definir textoNum Como Cadena
    Definir numConvertido Como Real
    Definir valorLogico Como Logico

	textoNum <- "123.45"
	numConvertido <- ConvertirANumero(textoNum)
	Escribir "Cadena '", textoNum, "' convertida a número: ", numConvertido

	valorLogico <- Verdadero
	Escribir "Valor lógico ", valorLogico, " como texto: ", ConvertirATexto(valorLogico)
FinAlgoritmo`,
    funciones_y_subprocesos: `Algoritmo PrincipalConFunciones
    Definir num1, num2, resultadoSuma Como Entero
    Definir mensaje Como Cadena

    num1 <- 10
    num2 <- 5
    mensaje <- "Valores iniciales"

    MostrarValores(mensaje, num1, num2)

    resultadoSuma <- SumarNumeros(num1, num2)
    Escribir "La suma es: ", resultadoSuma

    Escribir "Valores antes de intercambiar (por referencia): num1=", num1, ", num2=", num2
    Intercambiar(num1, num2)
    Escribir "Valores después de intercambiar (por referencia): num1=", num1, ", num2=", num2
FinAlgoritmo

SubProceso MostrarValores (prefijo Como Cadena, val1 Como Entero, val2 Como Entero)
    Escribir prefijo, ": val1=", val1, ", val2=", val2
FinSubProceso

SubProceso sumaAux <- SumarNumeros (n1 Como Entero, n2 Como Entero)
    sumaAux <- n1 + n2
FinSubProceso

SubProceso Intercambiar (numA Por Referencia, numB Por Referencia)
    Definir temp Como Entero
    temp <- numA
    numA <- numB
    numB <- temp
    Escribir "(Dentro de Intercambiar: numA=", numA, ", numB=", numB, ")"
FinSubProceso`,
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
    prueba_si_simple: `Algoritmo PruebaSiSimple
    Definir edad Como Entero
    Escribir "Ingresa tu edad:"
    Leer edad
    Si edad >= 18 Entonces
        Escribir "Eres mayor de edad."
    FinSi
    Escribir "Fin de la prueba."
FinAlgoritmo`,
    prueba_si_sino: `Algoritmo PruebaSiSino
    Definir numero Como Entero
    Escribir "Ingresa un número:"
    Leer numero
    Si numero > 0 Entonces
        Escribir "El número es positivo."
    Sino
        Escribir "El número NO es positivo (es cero o negativo)."
    FinSi
    Escribir "Evaluación completada."
FinAlgoritmo`
};

console.log("datosEjemplos.js cargado y Webgoritmo.Datos.exampleCodes actualizado con prueba_acceso_arreglos_expresion, PruebaSiSimple y PruebaSiSino.");
