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
	secreto <- Aleatorio(1, 10) // Usando Aleatorio
	Repetir
		Escribir "Adivina el numero (1-10):"
		Leer intento
		Si intento <> secreto Entonces
			Escribir "Incorrecto, intenta de nuevo."
		FinSi
	Hasta Que intento = secreto
	Escribir "¡Correcto! El numero era ", secreto, "."
FinAlgoritmo`,
    arrays: `Algoritmo EjemploArregloSimple
	Dimension numeros[5] Como Entero
	Definir i, suma Como Entero
	suma <- 0
	Para i <- 1 Hasta 5 Con Paso 1 Hacer
		Escribir "Ingrese el numero ", i, ":"
		Leer numeros[i]
	FinPara
	Escribir "Los numeros ingresados son:"
	Para i <- 1 Hasta 5 Con Paso 1 Hacer
		Escribir "  posicion [", i, "] = ", numeros[i]
		suma <- suma + numeros[i]
	FinPara
	Escribir "El promedio es ", suma / 5
FinAlgoritmo`,
    mod_example: `Algoritmo ModuloEjemplo
	Definir N, M Como Real
	Escribir "Ingrese el numero:"
	Leer N
	Escribir "Ingrese el divisor:"
	Leer M
	Si M = 0 Entonces
	    Escribir "Error: No se puede calcular módulo por cero."
	Sino
	    Si N Mod M = 0 Entonces
		    Escribir M, " es divisor exacto de ", N, "."
	    Sino
		    Escribir "El resto de dividir ", N, " por ", M, " es: ", N Mod M
	    FinSi
    FinSi
FinAlgoritmo`,
    potencia_conversion: `Algoritmo EjemploPotenciaConversion
	Definir base, exponente, resultado Como Real
	Definir textoNum Como Cadena
	Definir numConvertido Como Real
	Definir valorLogico Como Logico

	base <- 2
	exponente <- 3
	resultado <- base ^ exponente
	Escribir base, " elevado a ", exponente, " es: ", resultado

	textoNum <- "123.45"
	numConvertido <- ConvertirANumero(textoNum)
	Escribir "Cadena '", textoNum, "' convertida a número: ", numConvertido
	Escribir "Prueba de tipo número: ", numConvertido + 0.55

	valorLogico <- Verdadero
	Escribir "Valor lógico ", valorLogico, " como texto: ", ConvertirATexto(valorLogico)
	Escribir "Número ", resultado, " como texto: ", ConvertirATexto(resultado)
FinAlgoritmo`,
    funciones_cadena: `Algoritmo EjemploFuncionesCadena
	Definir miCadena, sub, mayus, minus Como Cadena
	Definir long Como Entero

	miCadena <- "Hola Mundo Feliz!"
	long <- Longitud(miCadena)
	Escribir "La cadena es: '", miCadena, "'"
	Escribir "Longitud: ", long

	mayus <- Mayusculas(miCadena)
	Escribir "En mayúsculas: ", mayus

	minus <- Minusculas(mayus)
	Escribir "En minúsculas: ", minus

	sub <- Subcadena(miCadena, 6, 10) // "Mundo"
	Escribir "Subcadena(6,10): '", sub, "'"

	sub <- Subcadena(miCadena, 1, 4) // "Hola"
	Escribir "Subcadena(1,4): '", sub, "'"
FinAlgoritmo`,
    matriz_2d: `Algoritmo EjemploMatriz
	Dimension notas[2,3] Como Entero
	Definir i, j, contador Como Entero

	contador <- 1
	Escribir "Llenando y mostrando la matriz:"
	Para i <- 1 Hasta 2 Hacer
		Para j <- 1 Hasta 3 Hacer
			notas[i,j] <- contador * 10
			Escribir "notas[", i, ",", j, "] = ", notas[i,j]
			contador <- contador + 1
		FinPara
	FinPara

	Escribir "Elemento notas[2,2]: ", notas[2,2]
	Escribir "Intentando escribir la matriz completa (puede variar la visualización):"
	Escribir notas // Para ver cómo se muestra la estructura anidada
FinAlgoritmo`,
    rutinas_funciones: `Proceso PrincipalRutinas
	Definir miNumero Como Entero
	miNumero <- 7

	SaludarUsuario("Estimado Estudiante")

	Definir cuadrado Como Entero
	cuadrado <- CalcularCuadrado(miNumero)
	Escribir "El cuadrado de ", miNumero, " es ", cuadrado
FinProceso

Subrutina SaludarUsuario(mensaje)
	Definir msjFinal Como Cadena
	msjFinal <- Concatenar(mensaje, ", ¡bienvenido a los ejemplos de rutinas!") // Asumiendo Concatenar o cambiar a Escribir con comas
	// Escribir mensaje, ", ¡bienvenido a los ejemplos de rutinas!" // Alternativa si Concatenar no está
	Escribir msjFinal
FinSubrutina

Funcion resultado = CalcularCuadrado(num)
	resultado <- num * num
FinFuncion`
};
