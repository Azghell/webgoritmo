// utilidadesDOM.js
// Contendrá referencias a elementos del DOM y funciones de utilidad DOM genéricas.

// I. REFERENCIAS A ELEMENTOS DEL DOM (Movido de pseudocode.js)
// =========================================================================
const salidaConsola = document.getElementById('console-output'); // Consola de salida
const entradaConsola = document.getElementById('console-input'); // Campo de entrada de la consola
const btnEnviarEntrada = document.getElementById('send-input-btn'); // Botón para enviar entrada
const btnEjecutarCodigo = document.getElementById('run-code-btn'); // Botón para ejecutar el código
const btnLimpiarConsola = document.getElementById('clear-console-btn'); // Botón para limpiar la consola
const btnNuevoCodigo = document.getElementById('new-code-btn'); // Botón para crear un nuevo archivo
const btnGuardarCodigo = document.getElementById('save-code-btn'); // Botón para guardar el código
const btnAbrirCodigo = document.getElementById('open-code-btn'); // Botón para abrir un archivo
const inputAbrirCodigo = document.getElementById('open-code-input'); // Input de archivo oculto para abrir

// Elementos del menú desplegable de ejemplos (ahora en el panel lateral)
const exampleDropdownToggle = document.getElementById('example-dropdown-toggle'); // Botón/header principal "Ejemplo"
const exampleDropdownMenu = document.getElementById('example-dropdown-menu'); // Menú desplegable en sí

// Paneles del panel lateral (ahora solo Sugerencias)
const listaSugerencias = document.getElementById('suggestion-list'); // Lista de sugerencias
const suggestionsHeader = document.getElementById('suggestions-header'); // Encabezado del panel de sugerencias
const suggestionsContent = document.getElementById('suggestions-content'); // Contenido del panel de sugerencias

const panelLateral = document.querySelector('.side-panel'); // Contenedor del panel lateral
const btnAlternarPanelLateral = document.getElementById('toggle-side-panel-btn'); // Botón para colapsar/expandir el panel lateral
const codeInputTextArea = document.getElementById('code-input'); // Referencia explícita al textarea del editor
const consoleInputArea = document.querySelector('.console-input-area'); // Referencia al área de entrada de la consola

// Elementos del modal de confirmación personalizado
const confirmationModal = document.getElementById('confirmation-modal');
const modalMessage = document.getElementById('modal-message');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

// NOTA: Estas constantes serán globales una vez que este script se cargue en index.html
// antes que los scripts que las usan.
// El listener DOMContentLoaded que envuelve el código original en pseudocode.js
// deberá estar en app.js para asegurar que estos elementos existan cuando se acceden.
