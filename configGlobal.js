// configGlobal.js
// Define el namespace global Webgoritmo y el estado inicial de la aplicación para el MVP.

window.Webgoritmo = window.Webgoritmo || {}; // Asegura que el namespace exista

Webgoritmo.estadoApp = {
    variables: {},              // Almacenará las variables del pseudocódigo
    funciones: {},              // Almacenará las funciones/subprocesos definidos
    detenerEjecucion: false,    // Bandera para detener la ejecución actual
    esperandoEntrada: false,    // Bandera para indicar si se espera un 'Leer'
    ejecucionEnCurso: false,    // Bandera para el estado del botón Ejecutar/Detener
    variableEntradaActual: '',  // Nombre de la variable que espera la entrada de 'Leer'
    lineasCodigo: [],           // Array de líneas de código del editor
    indiceLineaActual: 0,       // Índice de la línea actual en ejecución (para depuración futura)
    resolverPromesaEntrada: null, // Para la operación 'Leer' asíncrona
    promesaEntradaPendiente: null, // Referencia a la promesa de handleLeer para que ejecutarBloque pueda esperarla.
    errorEjecucion: null,       // Almacena mensajes de error de ejecución
    estadoBuclePendiente: null  // Para guardar el estado de un bucle (ej. Mientras) si es interrumpido por un 'Leer'.
    // resolverConfirmacion: null // Se omite para el MVP inicial
};

// Otras configuraciones globales podrían ir aquí en el futuro.
// Por ejemplo:
// Webgoritmo.Config = {
//     MAX_CONSOLE_LINES: 1000,
// };
