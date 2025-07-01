// datosEjemplos.js
// Contiene el objeto exampleCodes con los ejemplos de pseudocódigo para Webgoritmo.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = Webgoritmo.Datos || {};

Webgoritmo.Datos.codigosEjemplo = {
    salida_literal_f1: `Algoritmo PruebaSalidaLiteral
    Escribir "Hola Mundo desde Webgoritmo!"
    Escribir "Esta es otra línea de texto."
    Escribir "Y una más, con números: 12345"
FinAlgoritmo`,
    variables_basicas_f2: `Algoritmo PruebaVariablesBasicas
    Definir mensaje Como Cadena
    Definir contador Como Entero
    Definir precio Como Real
    Definir activo Como Logico

    mensaje <- "Bienvenido"
    contador <- 10
    precio <- 99.95
    activo <- Verdadero

    Escribir "Mensaje: ", mensaje
    Escribir "Contador: ", contador
    Escribir "Precio: ", precio
    Escribir "Activo: ", activo

    // La siguiente línea está diseñada para fallar en Fase 2 (y aún en Fase 3 sin evaluador completo),
    // ya que el evaluador de expresiones aún no maneja operaciones.
    // contador <- contador + 5
    // Escribir "Contador modificado (espera error o no cambio): ", contador
FinAlgoritmo`,
    entrada_leer_f3: `Algoritmo PruebaLeerBasico
    Definir nombre Como Cadena
    Definir edad Como Entero

    Escribir "Bienvenido. Por favor, ingresa tu nombre:"
    Leer nombre
    Escribir "Hola ", nombre, ". Ahora ingresa tu edad:"
    Leer edad
    Escribir "Gracias, ", nombre, ". Tienes ", edad, " años."

    Definir val1 Como Entero
    Definir val2 Como Cadena
    Escribir "Ingresa un número y luego una palabra (separados por espacio o coma):"
    Leer val1, val2
    Escribir "Número ingresado: ", val1
    Escribir "Palabra ingresada: ", val2
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
    condicional_si_f5: `Algoritmo PruebaSiEntoncesSino
    Definir edad Como Entero
    Definir mensaje Como Cadena

    Escribir "Por favor, ingresa tu edad:"
    Leer edad

    Si edad >= 18 Entonces
        mensaje <- "Eres mayor de edad."
        Escribir "Puedes pasar al club."
        Si edad > 65 Entonces // Si anidado para probar
            Escribir "Y tienes descuento de jubilado!"
        FinSi
    Sino
        mensaje <- "Eres menor de edad."
        Escribir "Lo siento, no puedes pasar."
        Escribir "Vuelve en unos años."
    FinSi

    Escribir mensaje
    Escribir "Verificación de edad completada."
FinAlgoritmo`,
    // Placeholder para futuro ejemplo de arreglos
    arreglos_dimension_f11: `Algoritmo PruebaDimensionBasica
    Dimension temperaturas[3]
    temperaturas[1] <- 18
    temperaturas[2] <- 22
    temperaturas[3] <- temperaturas[1] + 5
    Escribir "Temp 3: ", temperaturas[3]
FinAlgoritmo`
};

console.log("datosEjemplos.js cargado y actualizado con todos los ejemplos hasta Fase 5.");
