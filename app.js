// app.js
// Punto de entrada principal de la aplicación, manejará DOMContentLoaded y orquestación inicial.

document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que el namespace Webgoritmo exista
    window.Webgoritmo = window.Webgoritmo || {};

    // Crear el sub-namespace para referencias DOM
    Webgoritmo.DOM = Webgoritmo.DOM || {};

    // I. REFERENCIAS A ELEMENTOS DEL DOM (Asignadas a Webgoritmo.DOM)
    // =========================================================================
    Webgoritmo.DOM.salidaConsola = document.getElementById('console-output');
    Webgoritmo.DOM.entradaConsola = document.getElementById('console-input');
    Webgoritmo.DOM.btnEnviarEntrada = document.getElementById('send-input-btn');
    Webgoritmo.DOM.btnEjecutarCodigo = document.getElementById('run-code-btn');
    Webgoritmo.DOM.btnLimpiarConsola = document.getElementById('clear-console-btn');
    Webgoritmo.DOM.btnNuevoCodigo = document.getElementById('new-code-btn');
    Webgoritmo.DOM.btnGuardarCodigo = document.getElementById('save-code-btn');
    Webgoritmo.DOM.btnAbrirCodigo = document.getElementById('open-code-btn');
    Webgoritmo.DOM.inputAbrirCodigo = document.getElementById('open-code-input');

    Webgoritmo.DOM.exampleDropdownToggle = document.getElementById('example-dropdown-toggle');
    Webgoritmo.DOM.exampleDropdownMenu = document.getElementById('example-dropdown-menu');

    Webgoritmo.DOM.listaSugerencias = document.getElementById('suggestion-list');
    Webgoritmo.DOM.suggestionsHeader = document.getElementById('suggestions-header');
    Webgoritmo.DOM.suggestionsContent = document.getElementById('suggestions-content');

    // Referencias para el panel de Variables (si se implementó según planes anteriores)
    Webgoritmo.DOM.variablesHeader = document.getElementById('variables-header');
    Webgoritmo.DOM.variablesContent = document.getElementById('variables-content');
    Webgoritmo.DOM.listaVariablesUI = document.getElementById('variable-list');

    // Referencias para la barra de estado (si se implementó según planes anteriores)
    Webgoritmo.DOM.spanLineaCursor = document.getElementById('cursor-pos-line');
    Webgoritmo.DOM.spanColumnaCursor = document.getElementById('cursor-pos-col');

    Webgoritmo.DOM.panelLateral = document.querySelector('.side-panel');
    Webgoritmo.DOM.btnAlternarPanelLateral = document.getElementById('toggle-side-panel-btn');
    Webgoritmo.DOM.codeInputTextArea = document.getElementById('code-input'); // Importante para CodeMirror
    Webgoritmo.DOM.consoleInputArea = document.querySelector('.console-input-area');

    Webgoritmo.DOM.confirmationModal = document.getElementById('confirmation-modal');
    Webgoritmo.DOM.modalMessage = document.getElementById('modal-message');
    Webgoritmo.DOM.modalConfirmBtn = document.getElementById('modal-confirm-btn');
    Webgoritmo.DOM.modalCancelBtn = document.getElementById('modal-cancel-btn');

    // =========================================================================
    // INICIALIZACIÓN DE OTROS MÓDULOS Y EVENT LISTENERS PRINCIPALES IRÁ AQUÍ EN PASOS POSTERIORES
    // =========================================================================
    console.log("app.js: DOMContentLoaded, referencias DOM asignadas a Webgoritmo.DOM");

    // Ejemplo de cómo se usaría:
    // if (Webgoritmo.DOM.btnEjecutarCodigo) {
    //     console.log("Botón Ejecutar Código encontrado.");
    // }

    // Aquí es donde se llamaría a Webgoritmo.Editor.inicializarEditor(),
    // se definiría Webgoritmo.restablecerEstado(), se añadirían listeners, etc.

}); // Fin DOMContentLoaded
