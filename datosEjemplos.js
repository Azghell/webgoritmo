// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.exampleCodes = {
    simple_io: `Algoritmo Saludo
	Definir nombre Como Cadena
	Escribir "Por favor, ingresa tu nombre:"
	// Leer nombre // MVP Fase 3 no tiene Leer aún
	nombre <- "Estudiante" // Valor por defecto para prueba
	Escribir "Hola, ", nombre, " ¡Bienvenido a Webgoritmo!"
FinAlgoritmo`,
    if_simple: `Algoritmo EjemploSiSimple // Actualizado para Si
	Definir edad Como Entero
	// Escribir "Ingrese su edad:"
	// Leer edad
	edad <- 20 // Valor por defecto para prueba

	Escribir "Edad ingresada (simulada): ", edad
	Si edad >= 18 Entonces
		Escribir "Usted es mayor de edad."
	FinSi
	Escribir "Evaluación de edad completada."
FinAlgoritmo`,
    if_else: `Algoritmo EjemploSiSino // Actualizado para Si-Sino
	Definir numero Como Entero
	// Escribir "Ingrese un número:"
	// Leer numero
	numero <- -5 // Valor por defecto para prueba

	Escribir "Número ingresado (simulado): ", numero
	Si numero > 0 Entonces
		Escribir "El número es positivo."
	Sino
		Escribir "El número NO es positivo (es cero o negativo)."
	FinSi
FinAlgoritmo`,
    condicional_complejo: `Algoritmo EjemploSiSinoSiSino
	Definir calificacion Como Real
	// Escribir "Ingrese la calificación (0-10):"
	// Leer calificacion
	calificacion <- 8.5 // Valor por defecto para prueba

	Escribir "Calificación (simulada): ", calificacion
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
    segun: `Algoritmo DiaSemana
	Definir dia Como Entero
	// Escribir "Ingresa un numero del 1 al 7 para el dia de la semana:"
	// Leer dia
    dia <- 3 // Valor por defecto para prueba
    Escribir "Día (simulado): ", dia
	Segun dia Hacer
		1: Escribir "Lunes"
		2: Escribir "Martes"
		3: Escribir "Miércoles"
		4: Escribir "Jueves"
		5: Escribir "Viernes"
		6: Escribir "Sábado"
		7: Escribir "Domingo"
		De Otro Modo:
			Escribir "Numero invalido."
	FinSegun
FinAlgoritmo`,
    while_loop: `Algoritmo ContadorMientras
	Definir contador Como Entero
	contador <- 1
	Mientras contador <= 3 Hacer // Reducido para MVP
		Escribir "Contador: ", contador
		contador <- contador + 1
	FinMientras
	Escribir "Fin del contador."
FinAlgoritmo`,
    for_loop: `Algoritmo SumaDeNumeros
	Definir i, suma Como Entero
    // Definir num_max Como Entero // num_max no se usa sin Leer
	suma <- 0
	// Escribir "Hasta que numero quieres sumar (ej: 3):"
	// Leer num_max
    Definir num_max_simulado Como Entero
    num_max_simulado <- 3 // Valor por defecto para prueba

	Para i <- 1 Hasta num_max_simulado Con Paso 1 Hacer
		suma <- suma + i
	FinPara
	Escribir "La suma total hasta ", num_max_simulado, " es: ", suma
FinAlgoritmo`,
    repeat_until: `Algoritmo AdivinaNumeroSimple
	Definir intento Como Entero
	Definir secreto Como Entero
	secreto <- 7 // Valor fijo para prueba MVP
	// secreto <- Aleatorio(1, 10) // Aleatorio no está en evaluarExpresion MVP aún
	Repetir
		Escribir "Adivina el numero (1-10) - Secreto es 7. Ingresa 7 para terminar."
		// Leer intento // Comentado para MVP
        intento <- 7 // Simular entrada correcta para terminar el bucle
		Si intento <> secreto Entonces
			Escribir "Incorrecto, intenta de nuevo."
		FinSi
	Hasta Que intento = secreto
	Escribir "¡Correcto! El numero era ", secreto, "."
FinAlgoritmo`,
    arrays: `Algoritmo EjemploArregloSimple // Arreglos 1D para después de MVP Si
	// Dimension numeros[3] Como Entero // Dimension no en MVP Si aún
	// Definir i, suma Como Entero
	// suma <- 0
	// Para i <- 1 Hasta 3 Con Paso 1 Hacer
	// 	Escribir "Ingrese el numero ", i, ":"
	// 	Leer numeros[i]
	// FinPara
	// Escribir "Los numeros ingresados son:"
	// Para i <- 1 Hasta 3 Con Paso 1 Hacer
	// 	Escribir numeros[i]
	// FinPara
    Escribir "Ejemplo de Arreglos (a implementar)"
FinAlgoritmo`,
    mod_example: `Algoritmo ModuloEjemplo
	Definir N, M, Resultado Como Real
	N <- 10
	M <- 3
	Escribir "Calculando ", N, " MOD ", M
	Si M = 0 Entonces // El evaluador MVP no tiene operadores aún
	    Escribir "Error: No se puede calcular módulo por cero."
	Sino
        Resultado <- N MOD M // MOD no en evaluador MVP
		Escribir "El resto es: ", Resultado
	FinSi
FinAlgoritmo`,
    potencia_conversion: `Algoritmo EjemploPotenciaConversion
	Definir base, exponente, resultado Como Real
	Definir textoNum Como Cadena
	Definir numConvertido Como Real
	Definir valorLogico Como Logico

	base <- 2
	exponente <- 3
	resultado <- base ^ exponente // Exponente se implementará en evaluarExpresion
	Escribir base, " elevado a ", exponente, " es: ", resultado

	textoNum <- "123.45"
	// numConvertido <- ConvertirANumero(textoNum) // Funciones no en evaluador MVP
	// Escribir "Cadena '", textoNum, "' convertida a número: ", numConvertido

	valorLogico <- Verdadero
	// Escribir "Valor lógico ", valorLogico, " como texto: ", ConvertirATexto(valorLogico)
	Escribir "Funciones de conversión y cadena (a implementar)"
FinAlgoritmo`,
    funciones_cadena: `Algoritmo EjemploFuncionesCadena
    Escribir "Ejemplo de Funciones de Cadena (a implementar)"
	// Definir miCadena, sub, mayus, minus Como Cadena
	// Definir long Como Entero
	// miCadena <- "Hola Mundo Feliz!"
	// long <- Longitud(miCadena)
	// ...etc...
FinAlgoritmo`,
    matriz_2d: `Algoritmo EjemploMatriz
    Escribir "Ejemplo de Arreglos 2D (a implementar después de arreglos 1D y Si)"
	// Dimension notas[2,3] Como Entero
	// ...etc...
FinAlgoritmo`,
    rutinas_funciones: `Proceso PrincipalRutinas
    Escribir "Ejemplo de Subrutinas y Funciones (a implementar)"
	// Definir miNumero Como Entero
	// miNumero <- 7
	// SaludarUsuario("Estimado Estudiante")
	// ...etc...
FinProceso
// Subrutina SaludarUsuario(mensaje)
// FinSubrutina
// Funcion resultado = CalcularCuadrado(num)
// FinFuncion
`
};

console.log("datosEjemplos.js cargado y Webgoritmo.Datos.exampleCodes definido/actualizado.");
