// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo.

const exampleCodes = {
    simple_io: `Algoritmo Saludo
	Definir nombre Como Cadena
	Escribir "Por favor, ingresa tu nombre:"
	Leer nombre
	Escribir "Hola, ", nombre, " ¡Bienvenido a Webgoritmo!"
FinAlgoritmo`,
    if_simple: `Algoritmo NumeroPositivo
	Definir num Como Entero
	Escribir "Ingresa un numero:"
	Leer num
	Si num > 0 Entonces
		Escribir "El numero es positivo."
	FinSi
FinAlgoritmo`,
    if_else: `Algoritmo ParOImpar
	Definir num Como Entero
	Escribir "Ingresa un numero:"
	Leer num
	Si (num Mod 2) = 0 Entonces
		Escribir "El numero es par."
	Sino
		Escribir "El numero es impar."
	FinSi
FinAlgoritmo`,
    segun: `Algoritmo DiaSemana
	Definir dia Como Entero
	Escribir "Ingresa un numero del 1 al 7 para el dia de la semana:"
	Leer dia
	Segun dia Hacer
		1: Escribir "Lunes"
		2: Escribir "Martes"
		3: Escribir "Miércoles"
		4: Escribir "Jueves"
		5: Escribir "Viernes"
		6: Escribir "Sábado"
		7: Escribir "Domingo"
		De Otro Modo:
			Escribir "Numero invalido. Por favor, ingresa un numero entre 1 y 7."
	FinSegun
FinAlgoritmo`,
    while_loop: `Algoritmo ContadorMientras
	Definir contador Como Entero
	contador <- 1
	Mientras contador <= 5 Hacer
		Escribir "Contador: ", contador
		contador <- contador + 1
	FinMientras
	Escribir "Fin del contador."
FinAlgoritmo`,
    for_loop: `Algoritmo SumaDeNumeros
	Definir i, suma, num_max Como Entero
	suma <- 0
	Escribir "Hasta que numero quieres sumar (ej: 5):"
	Leer num_max
	Para i <- 1 Hasta num_max Con Paso 1 Hacer
		suma <- suma + i
	FinPara
	Escribir "La suma total es: ", suma
FinAlgoritmo`,
    repeat_until: `Algoritmo AdivinaNumeroSimple
	Definir secreto, intento Como Entero
	secreto <- pseudoAleatorio(1, 10) // Genera un número secreto entre 1 y 10
	Repetir
		Escribir "Adivina el numero (1-10):"
		Leer intento
		Si intento <> secreto Entonces
			Escribir "Incorrecto, intenta de nuevo."
		FinSi
	Hasta Que intento = secreto
	Escribir "¡Correcto! El numero era ", secreto, "."
FinAlgoritmo`,
    arrays: `Algoritmo EjemploArreglo
	// Definicion de un arreglo de 5 enteros
	Dimension numeros[5]
	Definir i, suma Como Entero

	suma <- 0

	// Leer 5 valores del usuario
	Para i <- 1 Hasta 5 Con Paso 1 Hacer
		Escribir "Ingrese el numero ", i, ":"
		Leer numeros[i]
	FinPara

	// Mostrar los valores y calcular la suma
	Escribir "Los numeros ingresados son:"
	Para i <- 1 Hasta 5 Con Paso 1 Hacer
		Escribir "  posicion [", i, "] = ", numeros[i]
		suma <- suma + numeros[i]
	FinPara

	// Calcular y mostrar el promedio
	Escribir "El promedio es ", suma / 5
FinAlgoritmo`,
    mod_example: `Algoritmo Modulo
	Definir N Como Real
	Definir M Como Real
	Escribir "Ingrese el numero:"
	Leer N
	Escribir "Ingrese el divisor:"
	Leer M
	Si N MOD M = 0 Entonces
		Escribir M, " es divisor exacto de ", N, "."
	Sino
		Escribir "El resto de dividir ", N, " por ", M, " es: ", N MOD M
	FinSi
FinAlgoritmo`
    // Aquí también irían los ejemplos conceptuales que definimos anteriormente:
    // potencia_conversion, funciones_cadena, matriz_2d, rutinas_funciones
    // Por ahora, solo muevo los existentes en pseudocode.js v1.0.0.0.16
};

// Los ejemplos conceptualmente añadidos en planes anteriores, como:
// potencia_conversion, funciones_cadena, matriz_2d, rutinas_funciones
// se añadirían a este objeto también.
// Por ahora, solo se han movido los ejemplos que estaban en la v1.0.0.0.16 de pseudocode.js.
