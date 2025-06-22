// app.js (Punto de Entrada Principal para MVP Fase 2, actualizado para Leer)

document.addEventListener('DOMContentLoaded', function() {
    window.Webgoritmo = window.Webgoritmo || {};
    Webgoritmo.DOM = Webgoritmo.DOM || {};

    // I. REFERENCIAS A ELEMENTOS DEL DOM
    Webgoritmo.DOM.editorTextArea = document.getElementById('code-input');
    Webgoritmo.DOM.consolaSalida = document.getElementById('console-output');
    Webgoritmo.DOM.btnEjecutar = document.getElementById('run-code-btn');
    Webgoritmo.DOM.entradaConsola = document.getElementById('console-input');
    Webgoritmo.DOM.btnEnviarEntrada = document.getElementById('send-input-btn');
    Webgoritmo.DOM.consoleInputArea = document.querySelector('.console-input-area');
    // Referencias para otros botones y paneles (se añadirán cuando se implementen esas UIs)
    // Webgoritmo.DOM.btnLimpiarConsola = document.getElementById('clear-console-btn');
    // Webgoritmo.DOM.btnNuevoCodigo = document.getElementById('new-code-btn');
    // ... etc.

    // Log para depuración inicial
    if (!Webgoritmo.DOM.editorTextArea || !Webgoritmo.DOM.consolaSalida || !Webgoritmo.DOM.btnEjecutar) {
        console.error("app.js: ERROR al obtener referencias DOM esenciales.");
    } else {
        console.log("app.js: DOMContentLoaded. Referencias DOM asignadas.");
    }

    // FUNCIÓN DE ESTADO GLOBAL
    Webgoritmo.restablecerEstado = function() {
        if (!Webgoritmo.estadoApp) { console.error("restablecerEstado: Webgoritmo.estadoApp no definido."); return; }

        Object.assign(Webgoritmo.estadoApp, {
            variables: {}, funciones: {}, detenerEjecucion: false,
            esperandoEntrada: false, variableEntradaActual: '', indiceLineaActual: 0,
            resolverPromesaEntrada: null, errorEjecucion: null, ejecucionEnCurso: false
            // resolverConfirmacion: null // Para futuro modal
        });

        if (Webgoritmo.UI && typeof Webgoritmo.UI.finalizarEntrada === "function") {
            Webgoritmo.UI.finalizarEntrada(); // Esto oculta y deshabilita el área de input
        } else { // Fallback si uiManager no está listo o la función no existe
            if (Webgoritmo.DOM.entradaConsola) { Webgoritmo.DOM.entradaConsola.value = ''; Webgoritmo.DOM.entradaConsola.disabled = true; Webgoritmo.DOM.entradaConsola.readOnly = true;}
            if (Webgoritmo.DOM.btnEnviarEntrada) Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
            if (Webgoritmo.DOM.consoleInputArea && Webgoritmo.DOM.consoleInputArea.classList) Webgoritmo.DOM.consoleInputArea.classList.add('oculto');
        }

        if (Webgoritmo.DOM.consolaSalida) {
            Webgoritmo.DOM.consolaSalida.innerHTML = '<div class="console-line normal placeholder">Bienvenido a Webgoritmo.</div>';
            Webgoritmo.DOM.consolaSalida.scrollTop = Webgoritmo.DOM.consolaSalida.scrollHeight;
        }

        if (Webgoritmo.DOM.btnEjecutar) {
            Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-play"></i> Ejecutar'; // Asumiendo FontAwesome
            Webgoritmo.DOM.btnEjecutar.title = "Ejecutar Código";
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
        console.error("app.js: Webgoritmo.Editor.inicializarEditor no está definida.");
    }

    // EVENT LISTENERS
    if (Webgoritmo.DOM.btnEjecutar) {
        Webgoritmo.DOM.btnEjecutar.addEventListener('click', async function() {
            if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Editor) {
                console.error("Faltan módulos esenciales de Webgoritmo para ejecutar."); return;
            }

            if (Webgoritmo.estadoApp.ejecucionEnCurso) {
                Webgoritmo.estadoApp.detenerEjecucion = true;
                if (Webgoritmo.estadoApp.esperandoEntrada && Webgoritmo.estadoApp.resolverPromesaEntrada) {
                    if(Webgoritmo.DOM.entradaConsola) Webgoritmo.DOM.entradaConsola.disabled = true;
                    if(Webgoritmo.DOM.btnEnviarEntrada) Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
                    Webgoritmo.estadoApp.resolverPromesaEntrada();
                    Webgoritmo.estadoApp.resolverPromesaEntrada = null;
                }
                if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("--- Interrupción solicitada ---", "warning");
            } else {
                Webgoritmo.restablecerEstado();
                Webgoritmo.estadoApp.ejecucionEnCurso = true;
                if (Webgoritmo.DOM.btnEjecutar) {
                    Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-stop"></i> Detener';
                    Webgoritmo.DOM.btnEjecutar.title = "Detener Ejecución";
                }

                if (typeof Webgoritmo.Interprete.ejecutarPseudocodigo === "function") {
                    try {
                        await Webgoritmo.Interprete.ejecutarPseudocodigo();
                    } catch (e) {
                        console.error("Error no capturado en ejecutarPseudocodigo:", e);
                        if(Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Error fatal en ejecución: ${e.message}`, "error");
                    } finally {
                        Webgoritmo.estadoApp.ejecucionEnCurso = false;
                        if (Webgoritmo.DOM.btnEjecutar) {
                            Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
                            Webgoritmo.DOM.btnEjecutar.title = "Ejecutar Código";
                        }
                        // if (Webgoritmo.UI.actualizarPanelVariables) Webgoritmo.UI.actualizarPanelVariables();
                    }
                } else {
                    console.error("app.js: Webgoritmo.Interprete.ejecutarPseudocodigo no definido.");
                    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("[ERROR]: Motor de ejecución no encontrado.", "error");
                    Webgoritmo.estadoApp.ejecucionEnCurso = false;
                    if (Webgoritmo.DOM.btnEjecutar) { /* Resetear botón */ }
                }
            }
        });
    }

    // Listener para la entrada de la consola (actualizado para Leer)
    if (Webgoritmo.DOM.entradaConsola && Webgoritmo.DOM.btnEnviarEntrada) {
        const procesarEntradaConsola = async function() {
            if (!Webgoritmo.estadoApp.esperandoEntrada) return;

            if (Webgoritmo.estadoApp.detenerEjecucion) {
                if (Webgoritmo.UI.finalizarEntrada) Webgoritmo.UI.finalizarEntrada();
                Webgoritmo.estadoApp.esperandoEntrada = false;
                if (Webgoritmo.estadoApp.resolverPromesaEntrada) {
                    Webgoritmo.estadoApp.resolverPromesaEntrada(); Webgoritmo.estadoApp.resolverPromesaEntrada = null;
                }
                console.log("app.js: Entrada no procesada por detención.");
                return;
            }

            const valorEntradaRaw = Webgoritmo.DOM.entradaConsola.value;
            if (Webgoritmo.UI.finalizarEntrada) Webgoritmo.UI.finalizarEntrada();
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`> ${valorEntradaRaw}`, 'user-input');

            const destinos = Webgoritmo.estadoApp.variableEntradaActual;
            const valoresEntrada = valorEntradaRaw.split(/[, ]+/).filter(v => v.trim().length > 0);

            if (valoresEntrada.length !== destinos.length) {
                if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ERROR DE ENTRADA]: Se esperaban ${destinos.length} valor(es) para (${destinos.join(', ')}), pero se ingresaron ${valoresEntrada.length}.`, 'error');
                Webgoritmo.estadoApp.errorEjecucion = "Error en cantidad de valores de entrada.";
                Webgoritmo.estadoApp.detenerEjecucion = true;
            } else {
                for (let i = 0; i < destinos.length; i++) {
                    if (Webgoritmo.estadoApp.detenerEjecucion) break;
                    const nombreVar = destinos[i];
                    const valorIndividualStr = valoresEntrada[i];
                    if (!Webgoritmo.estadoApp.variables.hasOwnProperty(nombreVar)) {
                        Webgoritmo.estadoApp.errorEjecucion = `Error: Variable '${nombreVar}' no encontrada para Leer.`;
                        Webgoritmo.estadoApp.detenerEjecucion = true; break;
                    }
                    const varMeta = Webgoritmo.estadoApp.variables[nombreVar];
                    try {
                        const valorConvertido = Webgoritmo.Interprete.convertirValorParaAsignacion(valorIndividualStr, varMeta.type);
                        varMeta.value = valorConvertido;
                        console.log(`app.js: Variable '${nombreVar}' <- '${valorConvertido}' (tipo: ${varMeta.type})`);
                    } catch (e) {
                        Webgoritmo.estadoApp.errorEjecucion = `Error al convertir entrada para '${nombreVar}' ('${valorIndividualStr}' -> ${varMeta.type}): ${e.message}`;
                        Webgoritmo.estadoApp.detenerEjecucion = true;
                        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
                        break;
                    }
                }
            }
            Webgoritmo.estadoApp.esperandoEntrada = false;
            Webgoritmo.estadoApp.variableEntradaActual = '';
            if (Webgoritmo.estadoApp.resolverPromesaEntrada) {
                Webgoritmo.estadoApp.resolverPromesaEntrada(); Webgoritmo.estadoApp.resolverPromesaEntrada = null;
            }
        };
        Webgoritmo.DOM.entradaConsola.addEventListener('keydown', async (event) => { if (event.key === 'Enter') { event.preventDefault(); await procesarEntradaConsola(); }});
        Webgoritmo.DOM.btnEnviarEntrada.addEventListener('click', procesarEntradaConsola);
        console.log("app.js: Listeners para entrada de consola configurados.");
    }

    // Estado inicial al cargar la página
    if (typeof Webgoritmo.restablecerEstado === "function") {
        Webgoritmo.restablecerEstado();
    } else {
        console.error("app.js: Webgoritmo.restablecerEstado no está definido al final de DOMContentLoaded.");
    }
    console.log("app.js: Fin de la configuración de DOMContentLoaded.");
});
