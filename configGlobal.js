// configGlobal.js
// Contendrá la definición inicial del namespace Webgoritmo, estadoApp y constantes globales.

window.Webgoritmo = window.Webgoritmo || {};

Webgoritmo.estadoApp = {
    variables: {}, // Almacena variables globales: { nombre: { valor: cualquier, tipo: cadena } }
    funciones: {}, // Almacena funciones definidas: { nombre: { params: [], body: [], lineaInicio: numero } }
    colaSalida: [], // Cola para mensajes de la consola de salida
    colaEntrada: [], // Cola para entradas del usuario (si se precargan o para uso futuro complejo)
    detenerEjecucion: false, // Bandera para detener la ejecución debido a errores o fin de programa
    esperandoEntrada: false, // Bandera para indicar si el intérprete está esperando entrada del usuario
    variableEntradaActual: '', // Nombre de la variable que espera entrada
    lineasCodigo: [], // Array de líneas de código limpias del editor
    indiceLineaActual: 0, // Índice de la línea actual en ejecución
    resolverPromesaEntrada: null, // Función para resolver la promesa de entrada para 'Leer'
    errorEjecucion: null, // Almacena el mensaje de error de ejecución si ocurre uno
    resolverConfirmacion: null, // Para el modal de confirmación personalizado
    ejecucionEnCurso: false // Añadida en un plan conceptual anterior para el botón ejecutar/detener
};

// Otras constantes globales podrían ir aquí si fueran necesarias en múltiples módulos.
// Por ejemplo:
// Webgoritmo.Constantes = {
//     MAX_OUTPUT_LINES: 1000,
// };
