// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.exampleCodes = {
    simple_io: `Algoritmo Saludo
	Definir nombre Como Cadena
	Escribir "Por favor, ingresa tu nombre:"
	Leer nombre
	Escribir "Hola, ", nombre, " ¡Bienvenido a Webgoritmo!"
FinAlgoritmo`,
    if_simple: `Algoritmo EjemploSiSimple
	Definir edad Como Entero
	Escribir "Ingrese su edad:"
	Leer edad

	Escribir "Edad ingresada: ", edad
	Si edad >= 18 Entonces
		Escribir "Usted es mayor de edad."
	FinSi
	Escribir "Evaluación de edad completada."
FinAlgoritmo`,
    if_else: `Algoritmo EjemploSiSino
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
    condicional_complejo: `Algoritmo EjemploSiSinoSiSino
	Definir calificacion Como Real
	Escribir "Ingrese la calificación (0-10):"
	Leer calificacion

	Escribir "Calificación: ", calificacion
	Si calificacion >= 9 Y calificacion <= 10 Entonces
		Escribir "Sobresaliente."
	SinoSi calificacion >= 7 Y calificacion < 9 Entonces
		Escribir "Notable."
	SinoSi calificacion >= 5 Y calificacion < 7 Entonces
		Escribir "Aprobado."
	SinoSi calificacion >= 0 Y calificacion < 5 Entonces
		Escribir "Reprobado."
	Sino
		Escribir "Calificación fuera de rango o inválida."
	FinSi
FinAlgoritmo`,
    operadores_logicos: `Algoritmo PruebaLogicaAvanzada
	Definir a Como Entero
	Definir b Como Logico
	a <- 5
	b <- Falso // O Leer b (después de que Leer Logico funcione bien)

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
    segun: `Algoritmo DiaSemana
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
    while_loop: `Algoritmo ContadorMientras
	Definir contador Como Entero
	contador <- 1
	Mientras contador <= 3 Hacer
		Escribir "Contador: ", contador
		contador <- contador + 1
	FinMientras
	Escribir "Fin del contador."
FinAlgoritmo`,
    while_con_leer: `Algoritmo SumaHastaNegativo
    Definir num, suma Como Entero
    suma <- 0
    num <- 0 // Inicializar para que el bucle comience

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
    while_anidado_simple: `Algoritmo TablasMultiplicarBasicas
    Definir tabla, i Como Entero
    tabla <- 1

    Mientras tabla <= 2 Hacer // Solo tablas del 1 y 2 para brevedad
        Escribir "Tabla del ", tabla, ":"
        i <- 1
        Mientras i <= 3 Hacer // Solo hasta el 3 para brevedad
            Escribir tabla, " x ", i, " = ", tabla * i
            i <- i + 1
        FinMientras
        tabla <- tabla + 1
        Escribir "" // Línea en blanco para separar
    FinMientras
FinAlgoritmo`,
    for_loop: `Algoritmo SumaDeNumeros
	Definir i, suma, num_max Como Entero
	suma <- 0
	Escribir "Hasta que numero quieres sumar (ej: 3):"
	Leer num_max

	Para i <- 1 Hasta num_max Con Paso 1 Hacer
		suma <- suma + i
	FinPara
	Escribir "La suma total hasta ", num_max, " es: ", suma
FinAlgoritmo`,
    for_con_paso_negativo: `Algoritmo CuentaRegresiva
    Definir i Como Entero
    Escribir "Cuenta regresiva:"
    Para i <- 5 Hasta 1 Con Paso -1 Hacer
        Escribir i
    FinPara
    Escribir "¡Despegue!"
FinAlgoritmo`,
    for_con_leer: `Algoritmo PromedioNotas
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
    for_no_ejecuta: `Algoritmo ParaNoEjecuta
    Definir x Como Entero
    Escribir "Inicio del algoritmo ParaNoEjecuta"
    // Este bucle no debería ejecutar ninguna iteración
    Para x <- 10 Hasta 5 Con Paso 1 Hacer
        Escribir "Esta línea NO debería aparecer en la consola."
    FinPara
    Escribir "Fin del algoritmo ParaNoEjecuta"
FinAlgoritmo`,
    repeat_until: `Algoritmo AdivinaNumeroSimple
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
    leer_varios: `Algoritmo LeerMultiplesValores
    Definir nombre Como Cadena
    Definir edad Como Entero
    Definir ciudad Como Cadena

    Escribir "Ingresa tu nombre, edad y ciudad, separados por coma o espacio:"
    Leer nombre, edad, ciudad

    Escribir "Te llamas ", nombre, ", tienes ", edad, " años y vives en ", ciudad, "."
FinAlgoritmo`,
    arrays: `Algoritmo EjemploArregloSimple
    Escribir "Ejemplo de Arreglos (a implementar en Fase posterior)"
FinAlgoritmo`,
    mod_example: `Algoritmo ModuloEjemplo
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
    potencia_conversion: `Algoritmo EjemploPotenciaConversion
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

	textoNum <- "123.45" // Se puede cambiar a Leer textoNum
	numConvertido <- ConvertirANumero(textoNum)
	Escribir "Cadena '", textoNum, "' convertida a número: ", numConvertido

	valorLogico <- Verdadero
	Escribir "Valor lógico ", valorLogico, " como texto: ", ConvertirATexto(valorLogico)
FinAlgoritmo`
};

console.log("datosEjemplos.js cargado y Webgoritmo.Datos.exampleCodes actualizado para Fase 4 (Leer).");
