window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = {};

Webgoritmo.Datos.codigosEjemplo = {
    "ejemploRepetir": `Proceso EjemploRepetir
    Definir num Como Entero;
    num <- 0;

    Repetir
        Escribir "El número es: ", num;
        num <- num + 1;
    Hasta Que num > 5;
FinProceso`,
    "ejemploSegun": `Proceso EjemploSegun
    Definir dia Como Entero;
    Escribir "Introduce un número del 1 al 3 para un día de la semana:";
    Leer dia;

    Segun dia Hacer
        Caso 1:
            Escribir "Lunes";
        Caso 2:
            Escribir "Martes";
        Caso 3:
            Escribir "Miércoles";
        De Otro Modo:
            Escribir "Día no válido";
    FinSegun
FinProceso`
};

// Establecer "ejemploRepetir" como el ejemplo por defecto
Webgoritmo.Datos.ejemploPorDefecto = "ejemploRepetir";

console.log("datosEjemplos.js cargado.");
