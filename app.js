// app.js (Punto de Entrada Principal para MVP Fase 2)
// Maneja DOMContentLoaded, define referencias DOM, estado de reseteo, e inicializa el editor y listeners.

document.addEventListener('DOMContentLoaded', function() {
    window.Webgoritmo = window.Webgoritmo || {};
    Webgoritmo.DOM = Webgoritmo.DOM || {};
    // Webgoritmo.UI, Webgoritmo.Interprete, Webgoritmo.Editor, etc., son definidos por sus respectivos archivos.

    // I. REFERENCIAS A ELEMENTOS DEL DOM (MVP)
    Webgoritmo.DOM.editorTextArea = document.getElementById('code-input');
    Webgoritmo.DOM.consolaSalida = document.getElementById('console-output');
    Webgoritmo.DOM.btnEjecutar = document.getElementById('run-code-btn');
    Webgoritmo.DOM.entradaConsola = document.getElementById('console-input');
    Webgoritmo.DOM.btnEnviarEntrada = document.getElementById('send-input-btn');
    Webgoritmo.DOM.consoleInputArea = document.querySelector('.console-input-area');
    // Añadir más refs DOM aquí a medida que se necesiten para otros botones/paneles.

    // Log para depuración inicial
    if (!Webgoritmo.DOM.editorTextArea || !Webgoritmo.DOM.consolaSalida || !Webgoritmo.DOM.btnEjecutar) {
        console.error("app.js: DOMContentLoaded. ERROR al obtener referencias DOM esenciales para el MVP.");
    } else {
        console.log("app.js: DOMContentLoaded. Referencias DOM para MVP asignadas.");
    }

    // FUNCIÓN DE ESTADO GLOBAL
    Webgoritmo.restablecerEstado = function() {
        if (!Webgoritmo.estadoApp) {
            console.error("restablecerEstado: Webgoritmo.estadoApp no está definido.");
            return;
        }
        Webgoritmo.estadoApp.variables = {};
        Webgoritmo.estadoApp.funciones = {};
        Webgoritmo.estadoApp.detenerEjecucion = false;
        Webgoritmo.estadoApp.esperandoEntrada = false;
        // Webgoritmo.estadoApp.ejecucionEnCurso es manejado por el listener de btnEjecutar
        Webgoritmo.estadoApp.variableEntradaActual = '';
        Webgoritmo.estadoApp.indiceLineaActual = 0;
        Webgoritmo.estadoApp.resolverPromesaEntrada = null;
        Webgoritmo.estadoApp.errorEjecucion = null;

        if (Webgoritmo.DOM.entradaConsola) {
            Webgoritmo.DOM.entradaConsola.value = '';
            Webgoritmo.DOM.entradaConsola.disabled = true;
            Webgoritmo.DOM.entradaConsola.readOnly = true;
        }
        if (Webgoritmo.DOM.btnEnviarEntrada) Webgoritmo.DOM.btnEnviarEntrada.disabled = true;

        if (Webgoritmo.DOM.consoleInputArea && Webgoritmo.DOM.consoleInputArea.classList && typeof Webgoritmo.DOM.consoleInputArea.classList.add === 'function') {
             Webgoritmo.DOM.consoleInputArea.classList.add('oculto'); // Asume que .oculto {display:none} está en CSS
        }

        if (Webgoritmo.DOM.consolaSalida) {
            Webgoritmo.DOM.consolaSalida.innerHTML = '<div class="console-line normal placeholder">Bienvenido a Webgoritmo MVP.</div>';
            Webgoritmo.DOM.consolaSalida.scrollTop = Webgoritmo.DOM.consolaSalida.scrollHeight;
        }
        // En el futuro:
        // if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarPanelVariables === "function") Webgoritmo.UI.actualizarPanelVariables();
        // if (Webgoritmo.Editor && typeof Webgoritmo.Editor.actualizarSugerencias === "function" && Webgoritmo.Editor.editorCodigo) Webgoritmo.Editor.actualizarSugerencias();
        console.log("app.js: Estado restablecido.");
    };

    // INICIALIZACIÓN DEL EDITOR
    if (Webgoritmo.Editor && typeof Webgoritmo.Editor.inicializarEditor === "function") {
        console.log("app.js: Llamando a Webgoritmo.Editor.inicializarEditor().");
        Webgoritmo.Editor.inicializarEditor();
    } else {
        console.error("app.js: Webgoritmo.Editor.inicializarEditor no está definido.");
        if (Webgoritmo.DOM.consolaSalida) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'console-line error';
            errorDiv.textContent = '[ERROR CRÍTICO EN APP]: No se pudo encontrar la función para inicializar el editor.';
            Webgoritmo.DOM.consolaSalida.appendChild(errorDiv);
        }
    }

    // EVENT LISTENERS (MVP)
    if (Webgoritmo.DOM.btnEjecutar) {
        Webgoritmo.DOM.btnEjecutar.addEventListener('click', async function() {
            if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI) {
                console.error("Faltan módulos esenciales de Webgoritmo para ejecutar.");
                return;
            }

            if (Webgoritmo.estadoApp.ejecucionEnCurso) { // Botón actúa como "Detener"
                Webgoritmo.estadoApp.detenerEjecucion = true;
                if (Webgoritmo.estadoApp.esperandoEntrada && Webgoritmo.estadoApp.resolverPromesaEntrada) {
                    if(Webgoritmo.DOM.entradaConsola) Webgoritmo.DOM.entradaConsola.disabled = true;
                    if(Webgoritmo.DOM.btnEnviarEntrada) Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
                    Webgoritmo.estadoApp.resolverPromesaEntrada();
                    Webgoritmo.estadoApp.resolverPromesaEntrada = null;
                }
                if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("--- Interrupción solicitada por el usuario ---", "warning");
            } else { // Botón actúa como "Ejecutar"
                Webgoritmo.restablecerEstado();

                Webgoritmo.estadoApp.ejecucionEnCurso = true;
                if (Webgoritmo.DOM.btnEjecutar) { // Chequeo por si acaso el DOM no está listo
                    Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-stop"></i> Detener';
                    Webgoritmo.DOM.btnEjecutar.title = "Detener Ejecución";
                }

                if (typeof Webgoritmo.Interprete.ejecutarPseudocodigo === "function") {
                    try {
                        await Webgoritmo.Interprete.ejecutarPseudocodigo();
                    } catch (e) {
                        console.error("Error no capturado durante ejecutarPseudocodigo:", e);
                        if(Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Error fatal en la ejecución: ${e.message}`, "error");
                    } finally {
                        Webgoritmo.estadoApp.ejecucionEnCurso = false;
                        if (Webgoritmo.DOM.btnEjecutar) {
                            Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
                            Webgoritmo.DOM.btnEjecutar.title = "Ejecutar Código";
                        }
                        // if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarPanelVariables === "function") {
                        //     Webgoritmo.UI.actualizarPanelVariables();
                        // }
                    }
                } else {
                    console.error("app.js: Webgoritmo.Interprete.ejecutarPseudocodigo no está definido.");
                    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("[ERROR]: Función de ejecución no encontrada.", "error");
                    Webgoritmo.estadoApp.ejecucionEnCurso = false;
                    if (Webgoritmo.DOM.btnEjecutar) {
                        Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
                        Webgoritmo.DOM.btnEjecutar.title = "Ejecutar Código";
                    }
                }
            }
        });
    }

    // Estado inicial al cargar la página
    if (typeof Webgoritmo.restablecerEstado === "function") {
        Webgoritmo.restablecerEstado();
    } else {
        console.error("app.js: Webgoritmo.restablecerEstado no está definido al final de DOMContentLoaded.");
    }

    console.log("app.js: Fin de la configuración de DOMContentLoaded (MVP Fase 2 - Paso 4).");
});
