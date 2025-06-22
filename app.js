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

    // Nuevas referencias para el selector de ejemplos
    Webgoritmo.DOM.ejemplosSelect = document.getElementById('ejemplos-select');
    Webgoritmo.DOM.btnCargarEjemplo = document.getElementById('cargar-ejemplo-btn');


    // Log para depuración inicial
    let domLogMessage = "app.js: DOMContentLoaded. Refs DOM asignadas: ";
    let refsOk = true;
    const essentialRefs = {
        editorTextArea: Webgoritmo.DOM.editorTextArea,
        consolaSalida: Webgoritmo.DOM.consolaSalida,
        btnEjecutar: Webgoritmo.DOM.btnEjecutar,
        entradaConsola: Webgoritmo.DOM.entradaConsola,
        btnEnviarEntrada: Webgoritmo.DOM.btnEnviarEntrada,
        consoleInputArea: Webgoritmo.DOM.consoleInputArea,
        ejemplosSelect: Webgoritmo.DOM.ejemplosSelect,
        btnCargarEjemplo: Webgoritmo.DOM.btnCargarEjemplo
    };

    for (const key in essentialRefs) {
        if (!essentialRefs[key]) {
            domLogMessage += ` ${key} (FALLO!) `;
            refsOk = false;
        } else {
            domLogMessage += ` ${key} (OK) `;
        }
    }
    if (!refsOk) {
        console.error("app.js: ERROR FATAL al obtener una o más referencias DOM esenciales.");
    }
    console.log(domLogMessage);

    // DEBUG: Loguear el estado de las referencias críticas justo antes de usarlas en la inicialización.
    console.log("APP.JS DEBUG PRE-INIT: Webgoritmo.DOM.consoleInputArea:", Webgoritmo.DOM.consoleInputArea);
    console.log("APP.JS DEBUG PRE-INIT: Webgoritmo.DOM.entradaConsola:", Webgoritmo.DOM.entradaConsola);
    console.log("APP.JS DEBUG PRE-INIT: Webgoritmo.DOM.btnEnviarEntrada:", Webgoritmo.DOM.btnEnviarEntrada);
    console.log("APP.JS DEBUG PRE-INIT: Webgoritmo.DOM.ejemplosSelect:", Webgoritmo.DOM.ejemplosSelect);

    // INICIALIZACIÓN DEL EDITOR (MOVIDO ANTES DE restablecerEstado y poblarSelector)
    // Esto es para asegurar que si alguna UI depende del editor, esté listo.
    if (Webgoritmo.Editor && typeof Webgoritmo.Editor.inicializarEditor === "function") {
        console.log("app.js: Llamando a Webgoritmo.Editor.inicializarEditor() [MOVIDO ARRIBA].");
        Webgoritmo.Editor.inicializarEditor();
    } else {
        console.error("app.js: Webgoritmo.Editor.inicializarEditor no está definida.");
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
             // Pasar Webgoritmo.DOM explícitamente
             Webgoritmo.UI.finalizarEntrada(Webgoritmo.DOM);
         } else {
            // Fallback si la función no existe (aunque no debería pasar si uiManager.js se carga)
            console.warn("Webgoritmo.UI.finalizarEntrada no está definida al llamar desde restablecerEstado. Usando fallback.");
            if (Webgoritmo.DOM && Webgoritmo.DOM.entradaConsola) { Webgoritmo.DOM.entradaConsola.value = ''; Webgoritmo.DOM.entradaConsola.disabled = true; Webgoritmo.DOM.entradaConsola.readOnly = true;}
            if (Webgoritmo.DOM && Webgoritmo.DOM.btnEnviarEntrada) Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
            if (Webgoritmo.DOM && Webgoritmo.DOM.consoleInputArea && Webgoritmo.DOM.consoleInputArea.classList) Webgoritmo.DOM.consoleInputArea.classList.add('oculto');
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

            const resolver = Webgoritmo.estadoApp.resolverPromesaEntrada;
            Webgoritmo.estadoApp.resolverPromesaEntrada = null; // Limpiar antes de resolver

            if (resolver) {
                resolver(); // Resuelve la promesa de handleLeer
            }

            // Después de que la entrada se procesa y la promesa de 'Leer' se resuelve,
            // verificamos si hay un bucle pendiente que necesita reanudarse.
            if (!Webgoritmo.estadoApp.detenerEjecucion && Webgoritmo.estadoApp.estadoBuclePendiente) {
                if (Webgoritmo.Interprete && typeof Webgoritmo.Interprete.reanudarBuclePendiente === 'function') {
                    try {
                        await Webgoritmo.Interprete.reanudarBuclePendiente();
                        // Si reanudarBuclePendiente pauso de nuevo por otro Leer, estadoBuclePendiente se habrá reestablecido.
                        // Si el bucle terminó o hubo error, estadoBuclePendiente será null.
                        // La ejecución del bloque principal (ejecutarBloque) ya está pausada esperando la promesa
                        // de handleLeer. Al resolverse, continuará. Si reanudarBuclePendiente manejó todo el bucle,
                        // el flujo de ejecutarBloque debería avanzar correctamente después del FinMientras.
                        // Esto es complejo. La idea es que reanudarBuclePendiente complete el bucle actual si es posible.
                    } catch (e) {
                        Webgoritmo.estadoApp.errorEjecucion = `Error al reanudar bucle: ${e.message}`;
                        Webgoritmo.estadoApp.detenerEjecucion = true;
                        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEjecucion, 'error');
                    } finally {
                         // Si la ejecución se detuvo o hubo un error durante la reanudación.
                        if (Webgoritmo.estadoApp.detenerEjecucion) {
                            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("--- Ejecución interrumpida durante reanudación de bucle ---", "warning");
                             Webgoritmo.estadoApp.ejecucionEnCurso = false;
                             if (Webgoritmo.DOM.btnEjecutar) {
                                 Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
                                 Webgoritmo.DOM.btnEjecutar.title = "Ejecutar Código";
                             }
                        }
                    }
                } else {
                    console.error("app.js: Webgoritmo.Interprete.reanudarBuclePendiente no definido.");
                }
            }
        };
        Webgoritmo.DOM.entradaConsola.addEventListener('keydown', async (event) => { if (event.key === 'Enter') { event.preventDefault(); await procesarEntradaConsola(); }});
        Webgoritmo.DOM.btnEnviarEntrada.addEventListener('click', procesarEntradaConsola);
        console.log("app.js: Listeners para entrada de consola configurados.");
    }

    // Listener para el botón de cargar ejemplo
    if (Webgoritmo.DOM.btnCargarEjemplo && Webgoritmo.DOM.ejemplosSelect) {
        Webgoritmo.DOM.btnCargarEjemplo.addEventListener('click', function() {
            if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo || !Webgoritmo.Datos || !Webgoritmo.Datos.exampleCodes) {
                console.error("No se puede cargar el ejemplo: Editor o datos no disponibles.");
                return;
            }
            const claveSeleccionada = Webgoritmo.DOM.ejemplosSelect.value;
            if (claveSeleccionada && Webgoritmo.Datos.exampleCodes[claveSeleccionada]) {
                let codigoACargar = Webgoritmo.Datos.exampleCodes[claveSeleccionada];
                // Si la estructura de exampleCodes fuera {titulo, codigo}, se accedería a .codigo
                // codigoACargar = Webgoritmo.Datos.exampleCodes[claveSeleccionada].codigo;
                Webgoritmo.Editor.editorCodigo.setValue(codigoACargar);
                if (Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = ''; // Limpiar consola
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Ejemplo '${claveSeleccionada.replace(/_/g, ' ')}' cargado.`, 'normal');
            } else if (claveSeleccionada) {
                console.warn(`Clave de ejemplo '${claveSeleccionada}' no encontrada en Webgoritmo.Datos.exampleCodes.`);
                 if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Error: Ejemplo '${claveSeleccionada}' no encontrado.`, 'error');
            } else {
                 if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Por favor, seleccione un ejemplo de la lista.", "warning");
            }
        });
        console.log("app.js: Listener para cargar ejemplo configurado.");
    }


    // Estado inicial al cargar la página y poblar UI
    // Estas llamadas se hacen al final para asegurar que todo esté definido.

    // 1. Restablecer el estado de la aplicación (esto llama a Webgoritmo.UI.finalizarEntrada(Webgoritmo.DOM))
    if (typeof Webgoritmo.restablecerEstado === "function") {
        Webgoritmo.restablecerEstado(); // restablecerEstado ahora llama a finalizarEntrada pasándole Webgoritmo.DOM
    } else {
        console.error("app.js: Webgoritmo.restablecerEstado no está definido justo antes de su llamada inicial crítica.");
    }

    // 2. Poblar el selector de ejemplos (pasando Webgoritmo.DOM y Webgoritmo.Datos)
    if (Webgoritmo.UI && typeof Webgoritmo.UI.poblarSelectorEjemplos === "function") {
        Webgoritmo.UI.poblarSelectorEjemplos(Webgoritmo.DOM, Webgoritmo.Datos);
    } else {
        console.error("app.js: Webgoritmo.UI.poblarSelectorEjemplos no está definido justo antes de su llamada inicial crítica.");
    }

    console.log("app.js: Fin de la configuración de DOMContentLoaded. Todas las inicializaciones de UI y estado deberían haberse completado.");
});
