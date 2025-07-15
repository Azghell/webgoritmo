window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.Datos = {};

Webgoritmo.Datos.codigosEjemplo = {
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

console.log("datosEjemplos.js cargado.");
