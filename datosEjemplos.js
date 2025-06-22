// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.exampleCodes = {
    simple_io: `Algoritmo Saludo
	Definir nombre Como Cadena
	Escribir "Por favor, ingresa tu nombre:"
	// Leer nombre // Aún no implementado
	nombre <- "Amigo" // Valor por defecto
	Escribir "Hola, ", nombre, " ¡Bienvenido a Webgoritmo!"
FinAlgoritmo`,
    if_simple: `Algoritmo EjemploSiSimple
	Definir edad Como Entero
	edad <- 20

	Escribir "Edad (simulada): ", edad
	Si edad >= 18 Entonces
		Escribir "Usted es mayor de edad."
	FinSi
	Escribir "Evaluación de edad completada."
FinAlgoritmo`,
    if_else: `Algoritmo EjemploSiSino
	Definir numero Como Entero
	numero <- -5

	Escribir "Número (simulado): ", numero
	Si numero > 0 Entonces
		Escribir "El número es positivo."
	Sino
		Escribir "El número NO es positivo."
	FinSi
FinAlgoritmo`,
    condicional_complejo: `Algoritmo EjemploSiSinoSiSino
	Definir calificacion Como Real
	calificacion <- 7.5 // Prueba la rama SinoSi

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
    operadores_logicos: `Algoritmo PruebaLogicaAvanzada
	Definir a Como Entero
	Definir b Como Logico
	a <- 5
	b <- Falso

	Escribir "Prueba de operadores lógicos:"
	Si a = 5 O b Entonces // Verdadero O Falso -> Verdadero
		Escribir "  Condición (a=5 O b) es Verdadera"
	FinSi

	Si No b Entonces // No Falso -> Verdadero
		Escribir "  Condición (No b) es Verdadera"
	FinSi

	Si a > 10 Y (No b) Entonces // Falso Y Verdadero -> Falso
		Escribir "  Esto NO debería aparecer (a > 10 Y No b)"
	Sino
		Escribir "  Condición (a > 10 Y No b) es Falsa, se ejecuta Sino"
	FinSi
FinAlgoritmo`,
    // Ejemplos existentes que se mantienen (con Leer comentado o simplificados si es necesario)
    segun: `Algoritmo DiaSemana
	Definir dia Como Entero
    dia <- 3
    Escribir "Día (simulado): ", dia
	Segun dia Hacer
		1: Escribir "Lunes"; 2: Escribir "Martes"; 3: Escribir "Miércoles";
		4: Escribir "Jueves"; 5: Escribir "Viernes"; 6: Escribir "Sábado";
		7: Escribir "Domingo";
		De Otro Modo:
			Escribir "Numero invalido.";
	FinSegun
FinAlgoritmo`, // Punto y coma para separar casos en una línea es común en algunos PSeInt
    while_loop: `Algoritmo ContadorMientras
	Definir contador Como Entero
	contador <- 1
	Mientras contador <= 3 Hacer
		Escribir "Contador: ", contador
		contador <- contador + 1
	FinMientras
	Escribir "Fin del contador."
FinAlgoritmo`,
    for_loop: `Algoritmo SumaDeNumeros
	Definir i, suma, num_max_simulado Como Entero
	suma <- 0
    num_max_simulado <- 3
	Para i <- 1 Hasta num_max_simulado Con Paso 1 Hacer
		suma <- suma + i
	FinPara
	Escribir "La suma total hasta ", num_max_simulado, " es: ", suma
FinAlgoritmo`,
    repeat_until: `Algoritmo AdivinaNumeroSimple
	Definir intento Como Entero
	Definir secreto Como Entero
	secreto <- 7
	Repetir
		// Escribir "Adivina el numero (1-10) - Secreto es 7."
		// Leer intento
        intento <- 7 // Simular entrada
		Si intento <> secreto Entonces
			Escribir "Incorrecto."
		FinSi
	Hasta Que intento = secreto
	Escribir "¡Correcto! El numero era ", secreto, "."
FinAlgoritmo`,
    arrays: `Algoritmo EjemploArregloSimple
    Escribir "Ejemplo de Arreglos (a implementar en Fase posterior)"
FinAlgoritmo`,
    mod_example: `Algoritmo ModuloEjemplo
	Definir N, M, Resultado Como Real
	N <- 10
	M <- 3
	Escribir "Calculando ", N, " MOD ", M
	// Si M = 0 Entonces // Aún no hay Si funcional para este ejemplo
	//    Escribir "Error: No se puede calcular módulo por cero."
	// Sino
        Resultado <- N MOD M
	//	Escribir "El resto es: ", Resultado
	// FinSi
    Escribir "Resultado (MOD): ", Resultado // Simplificado
FinAlgoritmo`,
    potencia_conversion: `Algoritmo EjemploPotenciaConversion
	Definir base, exponente, resultado Como Real
	base <- 2
	exponente <- 3
	resultado <- base ^ exponente
	Escribir base, " elevado a ", exponente, " es: ", resultado
	// Funciones de conversión se probarán por separado cuando estén en evaluarExpresion
FinAlgoritmo`
    // funciones_cadena, matriz_2d, rutinas_funciones se pueden añadir cuando se implementen esas características.
};

console.log("datosEjemplos.js cargado y Webgoritmo.Datos.exampleCodes definido/actualizado para Fase 3 (Si).");
