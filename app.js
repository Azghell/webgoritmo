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

        // Llamada a la nueva función helper de app.js para ocultar el área de input
        appOcultarAreaInputConsola();


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

    // Funciones Helper para controlar la UI de Input de Consola (definidas dentro de DOMContentLoaded)
    function appMostrarAreaInputConsola(promptMsg) {
        if (Webgoritmo.DOM.consoleInputArea && Webgoritmo.DOM.entradaConsola && Webgoritmo.DOM.btnEnviarEntrada) {
            if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida && promptMsg) {
                Webgoritmo.UI.añadirSalida(promptMsg, 'input-prompt');
            }
            Webgoritmo.DOM.consoleInputArea.classList.remove('oculto');
            Webgoritmo.DOM.entradaConsola.disabled = false;
            Webgoritmo.DOM.entradaConsola.readOnly = false;
            Webgoritmo.DOM.btnEnviarEntrada.disabled = false;
            requestAnimationFrame(() => {
                if (Webgoritmo.DOM.entradaConsola) Webgoritmo.DOM.entradaConsola.focus();
            });
            console.log("app.js: Área de input de consola MOSTRADA.");
        } else {
            console.error("app.js: Faltan elementos DOM para appMostrarAreaInputConsola.", Webgoritmo.DOM);
        }
    }

    function appOcultarAreaInputConsola() {
        if (Webgoritmo.DOM.consoleInputArea && Webgoritmo.DOM.entradaConsola && Webgoritmo.DOM.btnEnviarEntrada) {
            Webgoritmo.DOM.entradaConsola.value = '';
            Webgoritmo.DOM.entradaConsola.disabled = true;
            Webgoritmo.DOM.entradaConsola.readOnly = true;
            Webgoritmo.DOM.btnEnviarEntrada.disabled = true;
            Webgoritmo.DOM.consoleInputArea.classList.add('oculto');
            console.log("app.js: Área de input de consola OCULTADA.");
        } else {
            // No lanzar error si es al inicio y DOM aún no está 100% listo para estas partes específicas,
            // pero sí loguear si faltan refs críticas.
            if (!Webgoritmo.DOM) console.warn("app.js: Webgoritmo.DOM no disponible para appOcultarAreaInputConsola");
            else {
                if (!Webgoritmo.DOM.consoleInputArea) console.warn("app.js: consoleInputArea no disponible para ocultar");
                if (!Webgoritmo.DOM.entradaConsola) console.warn("app.js: entradaConsola no disponible para ocultar");
                if (!Webgoritmo.DOM.btnEnviarEntrada) console.warn("app.js: btnEnviarEntrada no disponible para ocultar");
            }
        }
    }
    // Fin Funciones Helper

    // EVENT LISTENERS
    if (Webgoritmo.DOM.btnEjecutar) {
        const ejecutarListenerAsync = async function() { // Se define la función listener
            // Logs de depuración para los módulos esenciales
            console.log("APP.JS BTN_EJECUTAR: Verificando módulos...");
            console.log("APP.JS BTN_EJECUTAR: Webgoritmo.estadoApp:", typeof Webgoritmo.estadoApp, Webgoritmo.estadoApp);
            console.log("APP.JS BTN_EJECUTAR: Webgoritmo.Interprete:", typeof Webgoritmo.Interprete, Webgoritmo.Interprete);
            console.log("APP.JS BTN_EJECUTAR: Webgoritmo.UI:", typeof Webgoritmo.UI, Webgoritmo.UI);
            console.log("APP.JS BTN_EJECUTAR: Webgoritmo.Editor:", typeof Webgoritmo.Editor, Webgoritmo.Editor);

            if (!Webgoritmo.estadoApp || !Webgoritmo.Interprete || !Webgoritmo.UI || !Webgoritmo.Editor) {
                console.error("Faltan módulos esenciales de Webgoritmo para ejecutar.");
                if (!Webgoritmo.estadoApp) console.error("APP.JS BTN_EJECUTAR: Webgoritmo.estadoApp FALTA");
                if (!Webgoritmo.Interprete) console.error("APP.JS BTN_EJECUTAR: Webgoritmo.Interprete FALTA");
                if (!Webgoritmo.UI) console.error("APP.JS BTN_EJECUTAR: Webgoritmo.UI FALTA");
                if (!Webgoritmo.Editor) console.error("APP.JS BTN_EJECUTAR: Webgoritmo.Editor FALTA");
                return;
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
                console.log("APP.JS BTN_EJECUTAR: Después de restablecerEstado y cambiar botón.");

                // Obtener el código del editor y guardarlo en el estado
                console.log("APP.JS BTN_EJECUTAR: Verificando Webgoritmo.Editor:", Webgoritmo.Editor);
                if (Webgoritmo.Editor) {
                    console.log("APP.JS BTN_EJECUTAR: Verificando Webgoritmo.Editor.editorCodigo:", Webgoritmo.Editor.editorCodigo);
                }

                if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo && typeof Webgoritmo.Editor.editorCodigo.getValue === 'function') {
                    const codigoCompleto = Webgoritmo.Editor.editorCodigo.getValue();
                    Webgoritmo.estadoApp.lineasCodigo = codigoCompleto.split('\n');
                    console.log(`APP.JS BTN_EJECUTAR: Código obtenido, ${Webgoritmo.estadoApp.lineasCodigo.length} líneas.`);
                } else {
                    console.error("APP.JS BTN_EJECUTAR: Editor o editorCodigo.getValue no disponible para obtener código.");
                    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) {
                        console.error("APP.JS BTN_EJECUTAR: typeof Webgoritmo.Editor.editorCodigo.getValue:", typeof Webgoritmo.Editor.editorCodigo.getValue);
                    }
                    if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
                         Webgoritmo.UI.añadirSalida("[ERROR]: Editor no encontrado o no funcional para leer el código.", "error");
                    } else {
                        console.error("APP.JS BTN_EJECUTAR: Webgoritmo.UI.añadirSalida no disponible para mensaje de error del editor.");
                    }
                    // Webgoritmo.restablecerEstado(); // Ya se hizo antes, y si falla aquí, mejor no limpiar la consola para ver otros errores.
                    // Mantener el estado de ejecucionEnCurso y el botón como si fuera a ejecutar, para evitar bucles si hay reintentos.
                    return;
                }

                console.log("APP.JS BTN_EJECUTAR: Verificando Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal:", typeof Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal);
                if (typeof Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal === "function") {
                    try {
                        // Ahora ejecutarAlgoritmoPrincipal usará Webgoritmo.estadoApp.lineasCodigo
                        await Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal();
                    } catch (e) {
                        console.error("Error no capturado en ejecutarAlgoritmoPrincipal:", e);
                        if(Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Error fatal en ejecución: ${e.message}`, "error");
                    } finally {
                        // La lógica de finally ya está dentro de ejecutarAlgoritmoPrincipal,
                        // por lo que aquí solo necesitamos asegurarnos de que el estado de ejecucionEnCurso
                        // y el botón se manejen si la llamada a ejecutarAlgoritmoPrincipal falla catastróficamente
                        // o si no entra a su propio finally (lo cual no debería ocurrir).
                        // De hecho, ejecutarAlgoritmoPrincipal ya maneja esto.
                        // Webgoritmo.estadoApp.ejecucionEnCurso = false; // Gestionado por el intérprete
                        // if (Webgoritmo.DOM.btnEjecutar) { // Gestionado por el intérprete
                        //     Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
                        //     Webgoritmo.DOM.btnEjecutar.title = "Ejecutar Código";
                        // }
                    }
                } else {
                    console.error("app.js: Webgoritmo.Interprete.ejecutarAlgoritmoPrincipal no definido.");
                    if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("[ERROR]: Motor de ejecución principal no encontrado.", "error");
                    Webgoritmo.estadoApp.ejecucionEnCurso = false; // Asegurar reseteo si la función no existe
                    if (Webgoritmo.DOM.btnEjecutar) {
                         Webgoritmo.DOM.btnEjecutar.innerHTML = '<i class="fas fa-play"></i> Ejecutar';
                         Webgoritmo.DOM.btnEjecutar.title = "Ejecutar Código";
                    }
                }
            }
        }; // Fin de ejecutarListenerAsync

        // Lógica para añadir el listener solo una vez usando una bandera
        if (!Webgoritmo.DOM.btnEjecutar.hasWebgoritmoListener) {
            Webgoritmo.DOM.btnEjecutar.addEventListener('click', ejecutarListenerAsync);
            Webgoritmo.DOM.btnEjecutar.hasWebgoritmoListener = true;
            console.log("APP.JS: Event listener AÑADIDO a btnEjecutar.");
        } else {
            console.warn("APP.JS: Event listener para btnEjecutar YA HABÍA SIDO AÑADIDO. Evitando duplicación.");
        }
    }

    // Listener para la entrada de la consola (actualizado para Leer)
    if (Webgoritmo.DOM.entradaConsola && Webgoritmo.DOM.btnEnviarEntrada) {
        const procesarEntradaConsola = async function() {
            console.log("[app.js procesarEntradaConsola] Iniciando...");

            if (!Webgoritmo.estadoApp.esperandoEntradaUsuario) { // Corregido para usar la nueva propiedad de estadoApp
                console.log("[app.js procesarEntradaConsola] No se esperaba entrada. Saliendo.");
                return;
            }

            if (Webgoritmo.estadoApp.detenerEjecucion) {
                console.log("[app.js procesarEntradaConsola] Ejecución detenida. Ocultando input y resolviendo promesa si existe.");
                appOcultarAreaInputConsola();
                Webgoritmo.estadoApp.esperandoEntradaUsuario = false;
                if (Webgoritmo.estadoApp.resolverPromesaEntrada) {
                    console.log("[app.js procesarEntradaConsola] Resolviendo promesa por detención.");
                    Webgoritmo.estadoApp.resolverPromesaEntrada();
                    Webgoritmo.estadoApp.resolverPromesaEntrada = null;
                }
                return;
            }

            const valorEntradaRaw = Webgoritmo.DOM.entradaConsola.value;
            console.log(`[app.js procesarEntradaConsola] valorEntradaRaw: "${valorEntradaRaw}"`);
            appOcultarAreaInputConsola();
            if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`> ${valorEntradaRaw}`, 'user-input');

            // Usar las nuevas propiedades de estadoApp para las variables destino
            const destinos = Webgoritmo.estadoApp.variablesDestinoEntrada;
            const nombresOriginales = Webgoritmo.estadoApp.nombresOriginalesParaPrompt;
            console.log(`[app.js procesarEntradaConsola] Destinos: ${destinos ? destinos.join(', ') : 'ninguno'}`);

            if (!destinos || destinos.length === 0) {
                console.error("[app.js procesarEntradaConsola] No hay variables destino para la entrada.");
                Webgoritmo.estadoApp.esperandoEntradaUsuario = false;
                const resolverHook = Webgoritmo.estadoApp.resolverPromesaEntrada;
                Webgoritmo.estadoApp.resolverPromesaEntrada = null;
                if (resolverHook) {
                    console.log("[app.js procesarEntradaConsola] Resolviendo promesa (sin destinos).");
                    resolverHook();
                }
                return;
            }

            const valoresEntrada = valorEntradaRaw.split(/[, ]+/).filter(v => v.trim().length > 0);
            console.log(`[app.js procesarEntradaConsola] valoresEntrada parseados: ${JSON.stringify(valoresEntrada)}`);


            if (valoresEntrada.length !== destinos.length) {
                const msgError = `[ERROR DE ENTRADA]: Se esperaban ${destinos.length} valor(es) para (${nombresOriginales.join(', ')}), pero se ingresaron ${valoresEntrada.length}.`;
                if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(msgError, 'error');
                Webgoritmo.estadoApp.errorEnEjecucion = "Error en cantidad de valores de entrada.";
                Webgoritmo.estadoApp.detenerEjecucion = true;
                console.log("[app.js procesarEntradaConsola] Error en cantidad de valores. Estableciendo detenerEjecucion.");
            } else {
                console.log("[app.js procesarEntradaConsola] Procesando asignaciones de entrada...");
                for (let i = 0; i < destinos.length; i++) {
                    if (Webgoritmo.estadoApp.detenerEjecucion) {
                         console.log("[app.js procesarEntradaConsola] Detención solicitada durante asignación de múltiples valores.");
                         break;
                    }
                    const nombreVarLc = destinos[i];
                    const valorIndividualStr = valoresEntrada[i];

                    console.log(`[app.js procesarEntradaConsola] Asignando a: ${nombreVarLc}, valor str: "${valorIndividualStr}"`);

                    if (!Webgoritmo.estadoApp.variablesGlobales || !Webgoritmo.estadoApp.variablesGlobales.hasOwnProperty(nombreVarLc)) { // Usar variablesGlobales
                        Webgoritmo.estadoApp.errorEnEjecucion = `Error: Variable '${nombresOriginales[i]}' no encontrada en ámbito global para 'Leer'.`;
                        Webgoritmo.estadoApp.detenerEjecucion = true;
                        console.log(`[app.js procesarEntradaConsola] Variable ${nombreVarLc} no encontrada. Estableciendo detenerEjecucion.`);
                        break;
                    }
                    const descriptorVar = Webgoritmo.estadoApp.variablesGlobales[nombreVarLc]; // Usar variablesGlobales
                    try {
                        // Usar la utilidad del intérprete para la conversión
                        const valorConvertido = Webgoritmo.Interprete.Utilidades.convertirValorParaTipo(
                            valorIndividualStr,
                            descriptorVar.tipoDeclarado,
                            Webgoritmo.estadoApp.lineaEnEjecucion ? Webgoritmo.estadoApp.lineaEnEjecucion.numero : 'Leer'
                        );
                        descriptorVar.valor = valorConvertido;
                        console.log(`[app.js procesarEntradaConsola] Variable '${descriptorVar.nombreOriginal}' (${nombreVarLc}) <- ${valorConvertido} (tipo declarado: ${descriptorVar.tipoDeclarado})`);
                    } catch (e) {
                        Webgoritmo.estadoApp.errorEnEjecucion = `Error al convertir entrada para '${nombresOriginales[i]}' ('${valorIndividualStr}' -> ${descriptorVar.tipoDeclarado}): ${e.message}`;
                        Webgoritmo.estadoApp.detenerEjecucion = true;
                        if (Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(Webgoritmo.estadoApp.errorEnEjecucion, 'error');
                        console.log(`[app.js procesarEntradaConsola] Error de conversión. Estableciendo detenerEjecucion. Mensaje: ${e.message}`);
                        break;
                    }
                }
            }
            // Webgoritmo.estadoApp.esperandoEntradaUsuario = false; // Se establece en el motor o aquí después de resolver
            // Webgoritmo.estadoApp.variablesDestinoEntrada = []; // Se limpia en el motor si es necesario

            const resolver = Webgoritmo.estadoApp.resolverPromesaEntrada;
            Webgoritmo.estadoApp.resolverPromesaEntrada = null;

            if (resolver) {
                console.log("[app.js procesarEntradaConsola] LLAMANDO A resolver() de la promesa.");
                resolver();
            } else {
                console.error("[app.js procesarEntradaConsola] ERROR: resolverPromesaEntrada era null, no se pudo resolver la promesa del intérprete.");
            }

            // Después de que la entrada se procesa y la promesa de 'Leer' se resuelve,
            // La lógica de reanudarBuclePendiente se eliminará si no se usa.
            // Por ahora, la dejamos comentada o la eliminaremos en una fase posterior de limpieza.
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
            if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo || !Webgoritmo.Datos || !Webgoritmo.Datos.codigosEjemplo) { // CORREGIDO: exampleCodes -> codigosEjemplo
                console.error("No se puede cargar el ejemplo: Editor o datos no disponibles.");
                // Adicionalmente, loguear qué falta específicamente:
                if (!Webgoritmo.Editor || !Webgoritmo.Editor.editorCodigo) console.error("Cargar Ejemplo: Editor no disponible.");
                if (!Webgoritmo.Datos) console.error("Cargar Ejemplo: Webgoritmo.Datos no disponible.");
                else if (!Webgoritmo.Datos.codigosEjemplo) console.error("Cargar Ejemplo: Webgoritmo.Datos.codigosEjemplo no disponible.");
                return;
            }
            const claveSeleccionada = Webgoritmo.DOM.ejemplosSelect.value;
            if (claveSeleccionada && Webgoritmo.Datos.codigosEjemplo[claveSeleccionada]) { // CORREGIDO: exampleCodes -> codigosEjemplo
                let codigoACargar = Webgoritmo.Datos.codigosEjemplo[claveSeleccionada]; // CORREGIDO: exampleCodes -> codigosEjemplo
                // Asumiendo que la estructura es directa: clave: "código"
                // Si fuera clave: {nombreVisible: "...", codigo: "..."} entonces sería .codigo
                Webgoritmo.Editor.editorCodigo.setValue(codigoACargar);
                if (Webgoritmo.DOM.consolaSalida) Webgoritmo.DOM.consolaSalida.innerHTML = ''; // Limpiar consola
                if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) {
                    // Intentar obtener un nombre más amigable si está disponible (como en poblarSelectorEjemplos)
                    const nombreAmigable = Webgoritmo.DOM.ejemplosSelect.options[Webgoritmo.DOM.ejemplosSelect.selectedIndex].text;
                    Webgoritmo.UI.añadirSalida(`Ejemplo '${nombreAmigable}' cargado.`, 'normal');
                }
            } else if (claveSeleccionada) {
                console.warn(`Clave de ejemplo '${claveSeleccionada}' no encontrada en Webgoritmo.Datos.codigosEjemplo.`); // CORREGIDO: exampleCodes -> codigosEjemplo
                 if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida(`Error: Ejemplo '${claveSeleccionada}' no encontrado.`, 'error');
            } else {
                 if (Webgoritmo.UI && Webgoritmo.UI.añadirSalida) Webgoritmo.UI.añadirSalida("Por favor, seleccione un ejemplo de la lista.", "warning");
            }
        });
        console.log("app.js: Listener para cargar ejemplo configurado.");
    }


    // Estado inicial al cargar la página y poblar UI
    // Estas llamadas se hacen al final para asegurar que todo esté definido.

    // 1. Restablecer el estado de la aplicación
    // (restablecerEstado internamente llama a appOcultarAreaInputConsola)
    if (typeof Webgoritmo.restablecerEstado === "function") {
        Webgoritmo.restablecerEstado();
    } else {
        console.error("app.js: Webgoritmo.restablecerEstado no está definido justo antes de su llamada inicial crítica.");
    }

    // 2. Poblar el selector de ejemplos (pasando Webgoritmo.DOM y Webgoritmo.Datos)
    if (Webgoritmo.UI && typeof Webgoritmo.UI.poblarSelectorEjemplos === "function") {
        Webgoritmo.UI.poblarSelectorEjemplos(Webgoritmo.DOM, Webgoritmo.Datos);
    } else {
        console.error("app.js: Webgoritmo.UI.poblarSelectorEjemplos no está definido justo antes de su llamada inicial crítica.");
    }

    // 3. Exponer funciones globales necesarias para otros módulos (como motorInterprete)
    window.WebgoritmoGlobal = window.WebgoritmoGlobal || {};
    window.WebgoritmoGlobal.solicitarEntradaUsuario = appMostrarAreaInputConsola;
    console.log("app.js: Funciones globales (solicitarEntradaUsuario) expuestas.");

    console.log("app.js: Fin de la configuración de DOMContentLoaded. Todas las inicializaciones de UI y estado deberían haberse completado.");
});
