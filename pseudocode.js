// pseudocode.js (actuando como app.js - Punto de Entrada Principal)
// Responsable de la inicialización general y la orquestación.

// Se asume que configGlobal.js, datosEjemplos.js, evaluadorExpresiones.js,
// motorInterprete.js, modoEditor.js, y uiManager.js ya han sido cargados
// y han poblado el namespace Webgoritmo.

document.addEventListener('DOMContentLoaded', function() {
    window.Webgoritmo = window.Webgoritmo || {};
    Webgoritmo.DOM = Webgoritmo.DOM || {};

    // I. REFERENCIAS A ELEMENTOS DEL DOM
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
    Webgoritmo.DOM.variablesHeader = document.getElementById('variables-header');
    Webgoritmo.DOM.variablesContent = document.getElementById('variables-content');
    Webgoritmo.DOM.listaVariablesUI = document.getElementById('variable-list');
    Webgoritmo.DOM.spanLineaCursor = document.getElementById('cursor-pos-line');
    Webgoritmo.DOM.spanColumnaCursor = document.getElementById('cursor-pos-col');
    Webgoritmo.DOM.panelLateral = document.querySelector('.side-panel');
    Webgoritmo.DOM.btnAlternarPanelLateral = document.getElementById('toggle-side-panel-btn');
    Webgoritmo.DOM.codeInputTextArea = document.getElementById('code-input');
    Webgoritmo.DOM.consoleInputArea = document.querySelector('.console-input-area');
    Webgoritmo.DOM.confirmationModal = document.getElementById('confirmation-modal');
    Webgoritmo.DOM.modalMessage = document.getElementById('modal-message');
    Webgoritmo.DOM.modalConfirmBtn = document.getElementById('modal-confirm-btn');
    Webgoritmo.DOM.modalCancelBtn = document.getElementById('modal-cancel-btn');

    // FUNCIÓN DE ESTADO GLOBAL
    Webgoritmo.restablecerEstado = function() {
        if (!Webgoritmo.estadoApp) {
            console.error("Webgoritmo.estadoApp no está definido.");
            // Intentar inicializarlo si es la primera vez y falta por alguna razón de carga
            if(window.Webgoritmo && !window.Webgoritmo.estadoApp && typeof WebgoritmoConfig !== 'undefined' && typeof WebgoritmoConfig.getDefaultEstadoApp === 'function') {
                 console.warn("Intentando inicializar Webgoritmo.estadoApp tardíamente.");
                 Webgoritmo.estadoApp = WebgoritmoConfig.getDefaultEstadoApp();
            } else if (!Webgoritmo.estadoApp) { // Si sigue sin estar definido
                return;
            }
        }
        Webgoritmo.estadoApp.variables = {};
        Webgoritmo.estadoApp.funciones = {};
        Webgoritmo.estadoApp.colaSalida = [];
        Webgoritmo.estadoApp.colaEntrada = [];
        Webgoritmo.estadoApp.detenerEjecucion = false;
        Webgoritmo.estadoApp.esperandoEntrada = false;
        Webgoritmo.estadoApp.variableEntradaActual = '';
        Webgoritmo.estadoApp.indiceLineaActual = 0;
        Webgoritmo.estadoApp.resolverPromesaEntrada = null;
        Webgoritmo.estadoApp.errorEjecucion = null;
        Webgoritmo.estadoApp.resolverConfirmacion = null;
        Webgoritmo.estadoApp.ejecucionEnCurso = false;

        if (Webgoritmo.DOM.entradaConsola) {
            Webgoritmo.DOM.entradaConsola.value = '';
            Webgoritmo.DOM.entradaConsola.disabled = true;
            Webgoritmo.DOM.entradaConsola.readOnly = true;
        }
        if (Webgoritmo.DOM.btnEnviarEntrada) Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
        if (Webgoritmo.DOM.consoleInputArea && Webgoritmo.DOM.consoleInputArea.classList) {
             Webgoritmo.DOM.consoleInputArea.classList.add('oculto');
        }
        if (Webgoritmo.DOM.salidaConsola) {
            Webgoritmo.DOM.salidaConsola.innerHTML = '<div class="console-line normal">Bienvenido a Webgoritmo.</div>';
            Webgoritmo.DOM.salidaConsola.scrollTop = Webgoritmo.DOM.salidaConsola.scrollHeight;
        }
        if (Webgoritmo.UI && typeof Webgoritmo.UI.actualizarPanelVariables === "function") Webgoritmo.UI.actualizarPanelVariables();
        if (Webgoritmo.Editor && typeof Webgoritmo.Editor.actualizarSugerencias === "function" && Webgoritmo.Editor.editorCodigo) Webgoritmo.Editor.actualizarSugerencias();
        if (Webgoritmo.DOM.exampleDropdownMenu && Webgoritmo.DOM.exampleDropdownMenu.classList.contains('show')) {
            Webgoritmo.DOM.exampleDropdownMenu.classList.remove('show');
            if (Webgoritmo.DOM.exampleDropdownToggle) Webgoritmo.DOM.exampleDropdownToggle.classList.remove('active');
        }
        if (Webgoritmo.DOM.btnEjecutarCodigo) {
            Webgoritmo.DOM.btnEjecutarCodigo.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
            Webgoritmo.DOM.btnEjecutarCodigo.title = "Ejecutar Código (Ctrl+R)";
        }
    };

    // INICIALIZACIÓN DE MÓDULOS Y COMPONENTES UI
    if (Webgoritmo.Editor && typeof Webgoritmo.Editor.inicializarEditor === "function") {
        Webgoritmo.Editor.inicializarEditor();
    } else {
        console.error("Error: Webgoritmo.Editor.inicializarEditor no está definido.");
        if (Webgoritmo.DOM.salidaConsola) Webgoritmo.DOM.salidaConsola.innerHTML = '<div class="console-line error">[ERROR CRÍTICO]: Fallo al inicializar el editor.</div>';
        return;
    }

    if (Webgoritmo.UI && typeof Webgoritmo.UI.setupCollapsiblePanel === "function") {
        if (Webgoritmo.DOM.suggestionsHeader && Webgoritmo.DOM.suggestionsContent) Webgoritmo.UI.setupCollapsiblePanel(Webgoritmo.DOM.suggestionsHeader, Webgoritmo.DOM.suggestionsContent);
        if (Webgoritmo.DOM.variablesHeader && Webgoritmo.DOM.variablesContent) Webgoritmo.UI.setupCollapsiblePanel(Webgoritmo.DOM.variablesHeader, Webgoritmo.DOM.variablesContent);
    }

    if (Webgoritmo.UI && typeof Webgoritmo.UI.inicializarManejoEjemplos === "function") {
        Webgoritmo.UI.inicializarManejoEjemplos();
    }

    // EVENT LISTENERS PRINCIPALES
    if (Webgoritmo.DOM.btnEjecutarCodigo) {
        Webgoritmo.DOM.btnEjecutarCodigo.addEventListener('click', async function() {
            if (Webgoritmo.estadoApp.ejecucionEnCurso) {
                Webgoritmo.estadoApp.detenerEjecucion = true;
                if (Webgoritmo.estadoApp.esperandoEntrada && Webgoritmo.estadoApp.resolverPromesaEntrada) {
                    if(Webgoritmo.DOM.entradaConsola) Webgoritmo.DOM.entradaConsola.disabled = true;
                    if(Webgoritmo.DOM.btnEnviarEntrada) Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
                    Webgoritmo.estadoApp.resolverPromesaEntrada();
                    Webgoritmo.estadoApp.resolverPromesaEntrada = null;
                }
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) { Webgoritmo.UI.añadirSalida("--------------------", 'normal'); Webgoritmo.UI.añadirSalida("Interrupción solicitada...", 'normal');}
            } else {
                Webgoritmo.restablecerEstado();
                if (Webgoritmo.Interprete && typeof Webgoritmo.Interprete.ejecutarPseudocodigo === "function") await Webgoritmo.Interprete.ejecutarPseudocodigo();
                else console.error("Error: Webgoritmo.Interprete.ejecutarPseudocodigo no está definido.");
            }
        });
    }

    if (Webgoritmo.DOM.btnLimpiarConsola) Webgoritmo.DOM.btnLimpiarConsola.addEventListener('click', Webgoritmo.restablecerEstado);

    if (Webgoritmo.DOM.btnNuevoCodigo) {
        Webgoritmo.DOM.btnNuevoCodigo.addEventListener('click', async function() {
            let confirmed = true;
            if (Webgoritmo.UI && typeof Webgoritmo.UI.mostrarConfirmacion === "function") confirmed = await Webgoritmo.UI.mostrarConfirmacion('¿Estás seguro de que quieres crear un nuevo código? Los cambios no guardados se perderán.');
            if (confirmed) {
                if (Webgoritmo.UI && typeof Webgoritmo.UI.cargarPlantillaInicial === "function") Webgoritmo.UI.cargarPlantillaInicial();
                Webgoritmo.restablecerEstado();
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida('> Nuevo archivo de pseudocódigo. ¡Empieza a escribir!', 'normal');
            }
        });
    }

    if (Webgoritmo.DOM.btnGuardarCodigo) {
        Webgoritmo.DOM.btnGuardarCodigo.addEventListener('click', function() {
            if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) {
                const codigo = Webgoritmo.Editor.editorCodigo.getValue();
                const blob = new Blob([codigo], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'pseudocodigo.pcs';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida('> Código guardado como pseudocodigo.pcs', 'normal');
            }
        });
    }

    if (Webgoritmo.DOM.btnAbrirCodigo && Webgoritmo.DOM.inputAbrirCodigo) {
        Webgoritmo.DOM.btnAbrirCodigo.addEventListener('click', () => Webgoritmo.DOM.inputAbrirCodigo.click());
        Webgoritmo.DOM.inputAbrirCodigo.addEventListener('change', function(event) {
            const archivo = event.target.files[0];
            if (archivo) {
                const lector = new FileReader();
                lector.onload = function(e) {
                    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) Webgoritmo.Editor.editorCodigo.setValue(e.target.result);
                    Webgoritmo.restablecerEstado();
                    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`> Archivo '${archivo.name}' cargado.`, 'normal');
                };
                lector.readAsText(archivo);
            }
        });
    }

    if (Webgoritmo.DOM.btnAlternarPanelLateral && Webgoritmo.UI && typeof Webgoritmo.UI.alternarPanelLateral === "function") {
        Webgoritmo.DOM.btnAlternarPanelLateral.addEventListener('click', Webgoritmo.UI.alternarPanelLateral);
    }

    if (Webgoritmo.DOM.entradaConsola && Webgoritmo.DOM.btnEnviarEntrada) {
        const procesarEntradaConsola = async function() {
            if (Webgoritmo.estadoApp.esperandoEntrada) {
                if (Webgoritmo.estadoApp.detenerEjecucion) {
                    if (Webgoritmo.estadoApp.resolverPromesaEntrada) { Webgoritmo.estadoApp.resolverPromesaEntrada(); Webgoritmo.estadoApp.resolverPromesaEntrada = null; }
                    return;
                }
                const valorEntradaRaw = Webgoritmo.DOM.entradaConsola.value;
                Webgoritmo.DOM.entradaConsola.value = '';
                Webgoritmo.DOM.btnEnviarEntrada.disabled = true; Webgoritmo.DOM.entradaConsola.readOnly = true;
                if (Webgoritmo.DOM.consoleInputArea && Webgoritmo.DOM.consoleInputArea.classList) Webgoritmo.DOM.consoleInputArea.classList.add('oculto');
                Webgoritmo.estadoApp.esperandoEntrada = false;
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`> ${valorEntradaRaw}`, 'user-input');
                const valoresEntrada = valorEntradaRaw.split(/[, ]+/).filter(v => v.length > 0);
                const destinos = Webgoritmo.estadoApp.variableEntradaActual;

                if (valoresEntrada.length !== destinos.length) { /* ... error ... */ }
                else {
                    for (let i = 0; i < destinos.length; i++) {
                        if(Webgoritmo.estadoApp.detenerEjecucion) break;
                        const destinoCompleto = destinos[i]; const valorIndividual = valoresEntrada[i];
                        let nombreVarAcceso = destinoCompleto; let esAccesoArreglo = false; let indicesExpr = [];
                        const coincidenciaAccesoArreglo = destinoCompleto.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(.+?)\s*\]$/);
                        if (coincidenciaAccesoArreglo) { /* ... parsear indices ... */ }
                        if (!(nombreVarAcceso in Webgoritmo.estadoApp.variables)) { /* ... error ... */ break;}
                        try {
                            const varMeta = Webgoritmo.estadoApp.variables[nombreVarAcceso]; let valorParseado;
                            if (esAccesoArreglo) {
                                if (!varMeta || varMeta.type !== 'array') throw new Error(`'${nombreVarAcceso}' no es un arreglo.`);
                                if (!varMeta.dimensions || indicesExpr.length !== varMeta.dimensions.length) throw new Error(`Dimensiones incorrectas para '${nombreVarAcceso}'.`);
                                const indicesValue = [];
                                for(let k=0; k < indicesExpr.length; k++) {
                                    let idxVal = Webgoritmo.Expresiones.evaluarExpresion(indicesExpr[k], Webgoritmo.estadoApp.variables);
                                    if (typeof idxVal !== 'number' || !Number.isInteger(idxVal) || idxVal <= 0 || idxVal > varMeta.dimensions[k]) throw new Error(`Índice inválido en dimensión ${k+1}.`);
                                    indicesValue.push(idxVal);
                                }
                                let subArreglo = varMeta.value;
                                for (let k = 0; k < indicesValue.length - 1; k++) subArreglo = subArreglo[indicesValue[k]];
                                let tipoEsperado = varMeta.baseType;
                                if (tipoEsperado === 'desconocido') { tipoEsperado = Webgoritmo.Interprete.inferirTipo(valorIndividual).toLowerCase(); varMeta.baseType = tipoEsperado; }
                                valorParseado = Webgoritmo.Interprete.convertirValorParaAsignacion(valorIndividual, tipoEsperado);
                                subArreglo[indicesValue[indicesValue.length - 1]] = valorParseado;
                            } else {
                                if (!varMeta || varMeta.type === 'array') throw new Error(`'${nombreVarAcceso}' es un arreglo o no existe.`);
                                let tipoEsperado = varMeta.type;
                                if (tipoEsperado === 'desconocido') { tipoEsperado = Webgoritmo.Interprete.inferirTipo(valorIndividual).toLowerCase(); varMeta.type = tipoEsperado; }
                                valorParseado = Webgoritmo.Interprete.convertirValorParaAsignacion(valorIndividual, tipoEsperado);
                                varMeta.value = valorParseado;
                            }
                        } catch (e) { if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`[ERROR de entrada]: ${e.message}`, 'error'); Webgoritmo.estadoApp.detenerEjecucion = true; break; }
                    }
                }
                if (Webgoritmo.estadoApp.resolverPromesaEntrada) { Webgoritmo.estadoApp.resolverPromesaEntrada(); Webgoritmo.estadoApp.resolverPromesaEntrada = null; }
            }
        };
        Webgoritmo.DOM.entradaConsola.addEventListener('keydown', async (event) => { if (event.key === 'Enter') { event.preventDefault(); await procesarEntradaConsola(); }});
        Webgoritmo.DOM.btnEnviarEntrada.addEventListener('click', procesarEntradaConsola);
    }

    if (typeof Webgoritmo.restablecerEstado === "function") Webgoritmo.restablecerEstado();
    if (window.innerWidth <= 900 && Webgoritmo.DOM.panelLateral && Webgoritmo.DOM.btnAlternarPanelLateral) { /* ... toggle inicial panel ... */ }
});
