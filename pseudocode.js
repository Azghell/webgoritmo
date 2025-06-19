// Project: pseudocodeweb
// Author: Pablo Peña
// Version: 1.0.0.0.16
// Date: June 18, 2025

document.addEventListener('DOMContentLoaded', function() {
    // =========================================================================
    // I. REFERENCIAS A ELEMENTOS DEL DOM
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


    // =========================================================================
    // II. GESTIÓN DEL ESTADO DE LA APLICACIÓN
    // =========================================================================
    let estadoApp = {
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
        resolverConfirmacion: null // Para el modal de confirmación personalizado
    };

    // =========================================================================
    // III. FUNCIONES DE UTILIDAD PARA EL INTÉRPRETE Y LA UI
    // =========================================================================

    // Restablece todo el estado de la aplicación (variables, consola, etc.).
    function restablecerEstado() {
        estadoApp.variables = {};
        estadoApp.funciones = {};
        estadoApp.colaSalida = [];
        estadoApp.colaEntrada = [];
        estadoApp.detenerEjecucion = false;
        estadoApp.esperandoEntrada = false;
        estadoApp.variableEntradaActual = '';
        estadoApp.indiceLineaActual = 0; // Restablece el índice de línea al restablecer el estado
        estadoApp.resolverPromesaEntrada = null;
        estadoApp.errorEjecucion = null;
        estadoApp.resolverConfirmacion = null;

        // Limpia el área de entrada pero no la oculta, solo la deshabilita.
        entradaConsola.value = '';
        entradaConsola.disabled = true; // Deshabilita el campo de entrada
        entradaConsola.readOnly = true; // Asegura que la entrada esté en modo solo lectura cuando no se usa
        btnEnviarEntrada.disabled = true; // Deshabilita el botón de enviar

        salidaConsola.innerHTML = '<div class="console-line normal">Bienvenido a Webgoritmo.</div>'; // Limpia y restablece el mensaje de la consola
        salidaConsola.scrollTop = salidaConsola.scrollHeight; // Asegura que el scroll esté al final

        // Actualiza las sugerencias y verificaciones de sintaxis
        actualizarSugerencias();

        // Oculta el menú desplegable de ejemplos si está abierto
        if (exampleDropdownMenu.classList.contains('show')) {
            exampleDropdownMenu.classList.remove('show');
            exampleDropdownToggle.classList.remove('active');
        }
    }

    // Añade un mensaje a la consola de salida y lo muestra.
    function añadirSalida(mensaje, tipo = 'normal') {
        const elementoLinea = document.createElement('div');
        elementoLinea.textContent = mensaje;
        elementoLinea.classList.add('console-line', tipo);
        salidaConsola.appendChild(elementoLinea);
        // Asegura que el scroll esté al final después de añadir nueva salida
        salidaConsola.scrollTop = salidaConsola.scrollHeight;
    }

    // Añade una alerta de sintaxis al panel de sugerencias (estilo de error).
    function añadirAlertaSintaxis(mensaje) {
        const li = document.createElement('li');
        li.className = 'suggestion-item syntax-error'; // Aplica la clase de estilo de error
        li.innerHTML = `<strong>Error de Sintaxis Potencial:</strong><br>${mensaje}`;// Uso de innerHTML para negrita
        listaSugerencias.appendChild(li);
    }

    // Añade una advertencia al panel de sugerencias (estilo de advertencia).
    function añadirAdvertenciaSugerencia(mensaje) {
        const li = document.createElement('li');
        li.className = 'suggestion-item warning-item'; // Aplica la clase de estilo de advertencia (amarillo)
        li.innerHTML = `<strong>Advertencia:</strong><br>${mensaje}`; // Uso de innerHTML para negrita
        listaSugerencias.appendChild(li);
    }

    // Devuelve el valor predeterminado según el tipo PSeint.
    function obtenerValorPorDefecto(tipo) {
        switch (tipo.toLowerCase()) {
            case 'entero': return 0;
            case 'real': return 0.0;
            case 'logico': return false;
            case 'caracter': return ''; // Caracter único
            case 'cadena': return ''; // Cadena de texto
            default: return null;
        }
    }

    // Infiere el tipo de dato de un valor JS a su equivalente PSeint (simplificado).
    function inferirTipo(valor) {
        if (typeof valor === 'number') {
            return Number.isInteger(valor) ? 'Entero' : 'Real';
        }
        if (typeof valor === 'boolean') {
            return 'Logico';
        }
        if (typeof valor === 'string') {
            // Una distinción muy básica: si la longitud es 1, es Caracter; de lo contrario, Cadena.
            return valor.length === 1 ? 'Caracter' : 'Cadena';
        }
        return 'Desconocido'; // Tipo predeterminado si no se puede inferir
    }

    // Función para dividir argumentos en una cadena, manejando comas dentro de cadenas entre comillas.
    function dividirArgumentos(cadenaArgs) {
        const args = [];
        let enCadena = false;
        let buffer = '';
        for (let i = 0; i < cadenaArgs.length; i++) {
            const char = cadenaArgs[i];
            if (char === '"' || char === "'") { // Alterna el estado 'enCadena' en la comilla
                enCadena = !enCadena;
                buffer += char;
            } else if (char === ',' && !enCadena) { // Divide solo si no está dentro de una cadena
                args.push(buffer.trim());
                buffer = '';
            } else {
                buffer += char;
            }
        }
        args.push(buffer.trim()); // Añade el último argumento
        return args;
    }

    // Convierte un valor al tipo PSeint de destino para la validación de asignación.
    function convertirValorParaAsignacion(valor, tipoDestino) {
        tipoDestino = tipoDestino.toLowerCase();

        // Si el valor ya es del tipo de destino o si se puede convertir implícitamente
        // sin pérdida de información (ej. entero a real), lo devuelve tal cual.
        if (inferirTipo(valor).toLowerCase() === tipoDestino ||
            (tipoDestino === 'real' && inferirTipo(valor).toLowerCase() === 'entero')) {
            return valor;
        }

        // Conversiones explícitas para la entrada
        if (typeof valor === 'string') {
            switch (tipoDestino) {
                case 'entero':
                    const intVal = parseInt(valor);
                    if (isNaN(intVal)) throw new Error(`La entrada '${valor}' no es un entero válido.`);
                    return intVal;
                case 'real':
                    const floatVal = parseFloat(valor);
                    if (isNaN(floatVal)) throw new Error(`La entrada '${valor}' no es un número real válido.`);
                    return floatVal;
                case 'logico':
                    const lowerVal = valor.toLowerCase();
                    if (lowerVal === 'verdadero') return true;
                    if (lowerVal === 'falso') return false;
                    throw new Error(`La entrada '${valor}' no es un valor lógico válido ('Verdadero' o 'Falso').`);
                case 'caracter':
                    return valor.length > 0 ? valor.charAt(0) : '';
                case 'cadena':
                    return valor;
            }
        } else if (typeof valor === 'number') {
            if (tipoDestino === 'entero') {
                return Math.trunc(valor);
            }
            // Numeros a cadena
            if (tipoDestino === 'cadena' || tipoDestino === 'caracter') {
                return String(valor);
            }
        } else if (typeof valor === 'boolean') {
            // Booleanos a cadena
            if (tipoDestino === 'cadena') {
                return valor ? 'Verdadero' : 'Falso';
            }
        }

        // Si no se puede convertir o es una incompatibilidad directa
        throw new Error(`Incompatibilidad de tipo: no se puede convertir ${inferirTipo(valor)} a ${tipoDestino}.`);
    }

    /**
     * Muestra un modal de confirmación personalizado y devuelve una promesa que se resuelve con true/false.
     * @param {string} message El mensaje a mostrar en el modal.
     * @returns {Promise<boolean>} Resuelve a true si el usuario confirma, false si cancela.
     */
    function mostrarConfirmacion(message) {
        modalMessage.textContent = message;
        confirmationModal.style.display = 'flex'; // Muestra el modal

        return new Promise(resolve => {
            estadoApp.resolverConfirmacion = resolve; // Guarda la función resolve en el estado

            const handleConfirm = () => {
                confirmationModal.style.display = 'none';
                modalConfirmBtn.removeEventListener('click', handleConfirm);
                modalCancelBtn.removeEventListener('click', handleCancel);
                estadoApp.resolverConfirmacion = null;
                resolve(true);
            };

            const handleCancel = () => {
                confirmationModal.style.display = 'none';
                modalConfirmBtn.removeEventListener('click', handleConfirm);
                modalCancelBtn.removeEventListener('click', handleCancel);
                estadoApp.resolverConfirmacion = null;
                resolve(false);
            };

            modalConfirmBtn.addEventListener('click', handleConfirm);
            modalCancelBtn.addEventListener('click', handleCancel);
        });
    }

    // =========================================================================
    // V. LÓGICA DE EVALUACIÓN DE EXPRESIONES (NÚCLEO DEL INTÉRPRETE)
    // =========================================================================

    // Helper para Aleatorio(min, max)
    function pseudoAleatorio(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Helper para Azar(n)
    function pseudoAzar(n) {
        return Math.floor(Math.random() * n); // Genera entre 0 y n-1
    }

    // Intenta evaluar una expresión PSeint en un valor JavaScript.
    // Soporta literales, variables, operadores aritméticos/lógicos y funciones matemáticas.
    // NOTA: Utiliza `eval()`, lo cual es peligroso en aplicaciones de producción con código no confiable.
    // Para este simulador educativo local, se considera aceptable con esta advertencia.
    function evaluarExpresion(expr, scope) {
        let processedExpr = String(expr).trim();
        const originalExpr = processedExpr;

        // 1. Manejo de literales booleanos de PSeint
        if (processedExpr.toLowerCase() === 'verdadero') return true;
        if (processedExpr.toLowerCase() === 'falso') return false;

        // 2. Manejo de literales de cadena (elimina comillas si existen)
        const coincidenciaCadena = processedExpr.match(/^"(.*)"$|^'(.*)'$/);
        if (coincidenciaCadena) {
            return coincidenciaCadena[1] || coincidenciaCadena[2]; // Devuelve el contenido sin comillas
        }

        // 3. Manejo de literales numéricos
        if (!isNaN(processedExpr) && processedExpr !== '') {
            return parseFloat(processedExpr);
        }

        // 4. Convierte operadores y funciones de PSeint a equivalentes de JavaScript.
        // ESTRATEGIA DE MARCADORES TEMPORALES para evitar conflictos de reemplazo.

        // Reemplazar operadores complejos PSeint con marcadores temporales únicos.
        processedExpr = processedExpr
            .replace(/<\s*>/g, '__PSEINT_NEQ__')   // <> o < >
            .replace(/>\s*=/g, '__PSEINT_GTE__')   // >= o > =
            .replace(/<\s*=/g, '__PSEINT_LTE__');  // <= o < =

        // Reemplazar el operador de igualdad PSeint '=' por '==' de JavaScript.
        processedExpr = processedExpr.replace(/=/g, '==');

        // Reemplazar los marcadores temporales con sus equivalentes finales de JavaScript.
        processedExpr = processedExpr
            .replace(/__PSEINT_NEQ__/g, '!=')
            .replace(/__PSEINT_GTE__/g, '>=')
            .replace(/__PSEINT_LTE__/g, '<=');

        // Luego, operadores lógicos y aritméticos (que no causan el conflicto actual)
        processedExpr = processedExpr
            .replace(/\bY\b/gi, '&&') // Operador lógico AND
            .replace(/\bO\b/gi, '||') // Operador lógico OR
            .replace(/\bNo\b/gi, '!') // Operador lógico NOT
            .replace(/\bMod\b/gi, '%') // Operador Módulo
            .replace(/\bDiv\b/gi, '/'); // Operador de división entera (JS '/' es flotante, aquí una aproximación)


        // Funciones matemáticas de PSeint a equivalentes de `Math` de JavaScript o helpers.
        processedExpr = processedExpr
            .replace(/\bAbs\(([^)]+)\)/gi, 'Math.abs($1)')
            .replace(/\bRC\(([^)]+)\)/gi, 'Math.sqrt($1)')
            // Aleatorio(min, max) con dos argumentos
            .replace(/\bAleatorio\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 'pseudoAleatorio($1, $2)')
            // Aleatorio(N) -> Genera un número entero aleatorio entre 1 y N (inclusive)
            .replace(/\bAleatorio\s*\(\s*(\d+)\s*\)/gi, '(Math.floor(Math.random() * ($1)) + 1)')
            // Azar(N) -> de 0 a N-1
            .replace(/\bAzar\s*\(\s*(\d+)\s*\)/gi, 'pseudoAzar($1)')
            .replace(/\bAZAR\b/gi, 'Math.random()') // AZAR (sin argumentos)
            .replace(/\bRedon\(([^)]+)\)/gi, 'Math.round($1)') // REDONDEAR
            .replace(/\bTrunc\(([^)]+)\)/gi, 'Math.trunc($1)') // TRUNCAR
            .replace(/\bSen\(([^)]+)\)/gi, 'Math.sin($1)')
            .replace(/\bCos\(([^)]+)\)/gi, 'Math.cos($1)')
            .replace(/\bTan\(([^)]+)\)/gi, 'Math.tan($1)')
            .replace(/\bLn\(([^)]+)\)/gi, 'Math.log($1)') // Logaritmo natural
            .replace(/\bExp\(([^)]+)\)/gi, 'Math.exp($1)'); // Exponencial e^x

        // 5. Reemplaza los nombres de variables con sus valores actuales en la expresión.
        // Esto debe ocurrir DESPUÉS de las sustituciones de operadores, ya que los nombres de variables
        // podrían contener partes que coincidan con operadores si se hace al revés.
        let tempProcessedExpr = processedExpr; // Usamos una variable temporal para las sustituciones
        // Obtener nombres de variables en el ámbito con su casing original
        const nombresVarOrdenados = Object.keys(scope).sort((a, b) => b.length - a.length);

        for (const nombreVar of nombresVarOrdenados) {
            // Solo si es un objeto de variable con propiedad 'value'
            if (scope[nombreVar] && typeof scope[nombreVar] === 'object' && scope[nombreVar].hasOwnProperty('value')) {
                // Usar \b para coincidencia de palabra completa. Usar 'g' para que sea case-sensitive
                const regex = new RegExp(`\\b${nombreVar}\\b`, 'g');
                let valorVar = scope[nombreVar].value;

                // Asegurar que los valores se representen correctamente para `eval()`
                if (scope[nombreVar].type === 'array') {
                    valorVar = JSON.stringify(valorVar);
                } else if (typeof valorVar === 'string') {
                    valorVar = `'${valorVar}'`; // Encerrar cadenas entre comillas simples para `eval()`
                } else if (typeof valorVar === 'boolean') {
                    valorVar = String(valorVar); // Convertir booleanos a 'true' o 'false' para `eval()`
                }

                tempProcessedExpr = tempProcessedExpr.replace(regex, valorVar);
            }
        }
        processedExpr = tempProcessedExpr; // Actualiza la expresión final


        try {
            // Evalúa la expresión JavaScript resultante de la conversión.
            // eslint-disable-next-line no-eval
            let resultado = eval(processedExpr);
            return resultado;
        } catch (e) {
            // Captura errores de evaluación de JS y lanza un error más específico.
            throw new Error(`Expresión inválida: "${originalExpr}" (evaluada como "${processedExpr}") -> ${e.message}`);
        }
    }


    // =========================================================================
    // VI. INTÉRPRETE DE PSEUDOCÓDIGO (LÓGICA CENTRAL DE EJECUCIÓN)
    // =========================================================================

    // Función principal para ejecutar el pseudocódigo línea por línea.
    // Es asíncrona para permitir pausas para operaciones como 'Leer'.
    async function ejecutarPseudocodigo() {
        restablecerEstado(); // Limpia el estado antes de cada ejecución
        añadirSalida("--------------------", 'normal');
        añadirSalida("Ejecutando código...", 'normal');
        añadirSalida("--------------------", 'normal');
        estadoApp.detenerEjecucion = false;
        estadoApp.errorEjecucion = null; // Restablece el error de ejecución

        // Obtiene y limpia las líneas de código del editor CodeMirror.
        const codigo = editorCodigo.getValue();
        estadoApp.lineasCodigo = codigo.split('\n'); // No trim aquí, el executeBlock lo hace línea por línea
        estadoApp.indiceLineaActual = 0; // Comienza desde la primera línea

        let enProcesoPrincipal = false; // Bandera para indicar si actualmente está dentro del bloque 'Proceso'/'Algoritmo'
        let enDefinicionFuncion = false; // Bandera para indicar si actualmente se está definiendo una función
        let cuerpoFuncionActual = null; // Referencia al cuerpo de la función actual que se está definiendo

        // Pre-parseo de funciones (solo declaraciones, no ejecución).
        // Esto popula el panel de funciones antes de la ejecución principal.
        for (let i = 0; i < estadoApp.lineasCodigo.length; i++) {
            const linea = estadoApp.lineasCodigo[i];
            const lineaTrimmed = linea.trim(); // No convertir a minúsculas aquí, para capturar el casing original de parámetros
            const lineaMinusculas = lineaTrimmed.toLowerCase(); // Solo para coincidir con keywords

            // Omite comentarios durante el pre-parseo
            if (lineaTrimmed.length === 0 || lineaTrimmed.startsWith('//')) {
                continue;
            }
            if (lineaTrimmed.startsWith('/*')) {
                let indiceFinComentarioBloque = -1;
                for(let j = i; j < estadoApp.lineasCodigo.length; j++) {
                    if (estadoApp.lineasCodigo[j].includes('*/')) {
                        indiceFinComentarioBloque = j;
                        break;
                    }
                }
                if (indiceFinComentarioBloque !== -1) {
                    i = indiceFinComentarioBloque; // Salta al final del comentario de bloque
                } else {
                    // Comentario de bloque no cerrado durante el pre-parseo, registra una advertencia
                    añadirSalida(`[ADVERTENCIA en línea ${i+1}]: Comentario de bloque '/*' no cerrado.`, 'advertencia');
                }
                continue;
            }

            // Regex para capturar nombres de funciones y parámetros con su casing original
            const coincidenciaFuncion = lineaTrimmed.match(/^(Funcion|SubProceso)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*))?\s*\(([^)]*)\)/i);
            if (coincidenciaFuncion) {
                enDefinicionFuncion = true;
                let varRetorno = null;
                let nombreFuncParaAlmacenar = ''; // Nombre de la función para usar como clave (en minúsculas)
                let parametros = [];

                if (coincidenciaFuncion[1].toLowerCase() === 'funcion' && coincidenciaFuncion[3]) {
                    // Sintaxis: Funcion variable_retorno = NombreFuncion(parametros)
                    varRetorno = coincidenciaFuncion[2]; // Variable de retorno (casing original)
                    nombreFuncParaAlmacenar = coincidenciaFuncion[3].toLowerCase(); // Nombre de la función (lowercase para clave)
                    parametros = coincidenciaFuncion[4].split(',').map(p => p.trim()).filter(p => p.length > 0); // Parámetros con casing original
                } else {
                    // Sintaxis: Funcion NombreFuncion(parametros) o SubProceso NombreSubproceso(parametros)
                    nombreFuncParaAlmacenar = coincidenciaFuncion[2].toLowerCase(); // Nombre de la función (lowercase para clave)
                    parametros = coincidenciaFuncion[4].split(',').map(p => p.trim()).filter(p => p.length > 0); // Parámetros con casing original
                }

                estadoApp.funciones[nombreFuncParaAlmacenar] = { returnVar: varRetorno, params: parametros, body: [], lineaInicio: i };
                cuerpoFuncionActual = estadoApp.funciones[nombreFuncParaAlmacenar].body;
            } else if (lineaMinusculas.startsWith('finfuncion') || lineaMinusculas.startsWith('finsubproceso')) {
                enDefinicionFuncion = false;
                cuerpoFuncionActual = null;
            } else if (enDefinicionFuncion && cuerpoFuncionActual) {
                cuerpoFuncionActual.push(linea);
            }
        }
        // No hay actualizarListaFunciones(); porque el panel se eliminó.


        // --- Lógica principal de ejecución del pseudocódigo ---
        let mainBlockLines = [];
        let inMainAlgorithm = false;
        let mainAlgorithmStartLine = 0;
        let foundMainAlgorithmStart = false; // Nueva bandera para asegurar que se encontró el inicio

        for (let i = 0; i < estadoApp.lineasCodigo.length; i++) {
            const linea = estadoApp.lineasCodigo[i].trim();
            const lineaMinusculas = linea.toLowerCase();

            // Omite comentarios durante la ejecución
            if (linea.length === 0 || linea.startsWith('//')) {
                continue;
            }
            if (linea.startsWith('/*')) {
                let indiceFinComentarioBloque = -1;
                for(let j = i; j < estadoApp.lineasCodigo.length; j++) {
                    if (estadoApp.lineasCodigo[j].includes('*/')) {
                        indiceFinComentarioBloque = j;
                        break;
                    }
                }
                if (indiceFinComentarioBloque !== -1) {
                    i = indiceFinComentarioBloque; // Salta al final del comentario de bloque
                }
                continue;
            }

            if (lineaMinusculas.startsWith('proceso') || lineaMinusculas.startsWith('algoritmo')) {
                if (foundMainAlgorithmStart) { // Si ya encontramos uno, es un error
                    añadirSalida(`[ERROR FATAL]: Se encontró más de un bloque 'Proceso' o 'Algoritmo'. Solo se permite uno principal.`, 'error');
                    estadoApp.detenerEjecucion = true;
                    return; // Detiene la ejecución inmediatamente
                }
                inMainAlgorithm = true;
                foundMainAlgorithmStart = true;
                mainAlgorithmStartLine = i;
                continue;
            }
            if (lineaMinusculas.startsWith('finproceso') || lineaMinusculas.startsWith('finalgoritmo')) {
                inMainAlgorithm = false;
                // Si encontramos un FinProceso/FinAlgoritmo pero no encontramos un inicio de proceso válido,
                // o si hay contenido después del FinProceso/FinAlgoritmo que no es comentario
                const remainingLines = estadoApp.lineasCodigo.slice(i + 1).join('').trim();
                const remainingNonComment = remainingLines.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();

                if (!foundMainAlgorithmStart) {
                     añadirSalida(`[ERROR FATAL]: Se encontró 'FinProceso' o 'FinAlgoritmo' sin un 'Proceso' o 'Algoritmo' correspondiente.`, 'error');
                     estadoApp.detenerEjecucion = true;
                     return;
                }
                if (remainingNonComment.length > 0) {
                     añadirSalida(`[ADVERTENCIA]: Contenido después de 'FinProceso' o 'FinAlgoritmo'. Esto podría ser un error de sintaxis.`, 'advertencia');
                }
                break; // Fin del algoritmo principal
            }

            if (inMainAlgorithm) {
                mainBlockLines.push(estadoApp.lineasCodigo[i]);
            }
        }

        // Validación final para el bloque principal
        if (!foundMainAlgorithmStart) {
            añadirSalida(`[ERROR FATAL]: Tu código debe comenzar con 'Proceso' o 'Algoritmo'.`, 'error');
            estadoApp.detenerEjecucion = true;
            return;
        }
        if (inMainAlgorithm) { // Si todavía estamos "enMainAlgorithm" al final del bucle, significa que FinProceso/FinAlgoritmo no se encontró
            añadirSalida(`[ERROR FATAL]: Falta 'FinProceso' o 'FinAlgoritmo' para cerrar el proceso principal.`, 'error');
            estadoApp.detenerEjecucion = true;
            return;
        }

        // **NUEVA VALIDACIÓN**: Verifica si el bloque principal está vacío o solo contiene comentarios/espacios.
        const cleanedMainBlock = mainBlockLines.map(l => l.trim().replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '')).filter(l => l.length > 0);
        if (cleanedMainBlock.length === 0) {
            añadirSalida(`[ERROR]: El bloque principal 'Algoritmo'/'Proceso' está vacío o solo contiene comentarios. No hay código para ejecutar.`, 'error');
            estadoApp.detenerEjecucion = true;
            return;
        }


        // Ejecutar el bloque principal
        await ejecutarBloque(cleanedMainBlock, estadoApp.variables, mainAlgorithmStartLine + 1);

        // Mensaje final de ejecución si no ocurrieron errores ni pausas.
        if (!estadoApp.detenerEjecucion && !estadoApp.esperandoEntrada) {
            añadirSalida("--------------------", 'normal');
            añadirSalida("Ejecución finalizada.", 'normal');
        } else if (estadoApp.errorEjecucion) {
            añadirSalida("--------------------", 'normal');
            añadirSalida("Ejecución detenida debido a un error.", 'error');
        }

        // Forzar la actualización del layout de CodeMirror después de la ejecución.
        if (editorCodigo) {
            editorCodigo.refresh();
        }
    }

    // =========================================================================
    // MODULARIZACIÓN: FUNCIONES DE MANEJO DE INSTRUCCIONES
    // =========================================================================

    /**
     * Maneja la instrucción 'Definir'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     */
    function handleDefinir(linea, ambitoActual, numLineaOriginal) {
        const coincidenciaDefinir = linea.match(/^Definir\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s+Como\s+(Entero|Real|Logico|Caracter|Cadena)/i);
        if (coincidenciaDefinir) {
            const nombresVariables = coincidenciaDefinir[1].split(',').map(s => s.trim()); // Nombres con casing original
            const tipoVariable = coincidenciaDefinir[2].toLowerCase();

            nombresVariables.forEach(nombre => {
                if (ambitoActual.hasOwnProperty(nombre)) {
                    añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: La variable '${nombre}' ya está definida. Sobrescribiendo.`, 'advertencia');
                }
                ambitoActual[nombre] = { value: obtenerValorPorDefecto(tipoVariable), type: tipoVariable };
            });
            // actualizarListaVariables(); // Eliminado, ya no hay panel de variables
            return true;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Dimension'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     */
    function handleDimension(linea, ambitoActual, numLineaOriginal) {
        const coincidenciaDimension = linea.match(/^Dimension\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(\d+)\](?:\s+Como\s+(Entero|Real|Logico|Caracter|Cadena))?/i);
        if (coincidenciaDimension) {
            const nombreArreglo = coincidenciaDimension[1]; // Nombre con casing original
            const tamaño = parseInt(coincidenciaDimension[2]);
            const tipoBase = (coincidenciaDimension[3] || 'desconocido').toLowerCase();

            if (isNaN(tamaño) || tamaño <= 0) {
                throw new Error(`Tamaño de arreglo inválido para '${nombreArreglo}': ${coincidenciaDimension[2]}. El tamaño debe ser un entero positivo.`);
            }

            if (ambitoActual.hasOwnProperty(nombreArreglo)) {
                añadirSalida(`[ADVERTENCIA en línea ${numLineaOriginal}]: El arreglo '${nombreArreglo}' ya está definido. Sobrescribiendo.`, 'advertencia');
            }

            // Los arreglos en PSeInt son base 1, por eso tamaño + 1
            const valoresArreglo = Array(tamaño + 1).fill(obtenerValorPorDefecto(tipoBase));
            ambitoActual[nombreArreglo] = {
                value: valoresArreglo,
                type: 'array',
                baseType: tipoBase,
                size: tamaño
            };
            // actualizarListaVariables(); // Eliminado, ya no hay panel de variables
            return true;
        }
        return false;
    }

    /**
     * Maneja la instrucción de Asignación ('<-').
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     */
    function handleAsignacion(linea, ambitoActual, numLineaOriginal) {
        const coincidenciaAsignacion = linea.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\[.*?\])?)\s*<-\s*(.*)/);
        if (coincidenciaAsignacion) {
            const destinoCompleto = coincidenciaAsignacion[1]; // Puede ser "variable" o "arreglo[indice]", con casing original
            const expresion = coincidenciaAsignacion[2].trim();

            let nombreVarAcceso = destinoCompleto;
            let esAccesoArreglo = false;
            let indiceArregloPSeint = -1;

            const coincidenciaAccesoArreglo = destinoCompleto.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(.*?)\]$/);
            if (coincidenciaAccesoArreglo) {
                nombreVarAcceso = coincidenciaAccesoArreglo[1];
                esAccesoArreglo = true;
                indiceArregloPSeint = evaluarExpresion(coincidenciaAccesoArreglo[2], ambitoActual);
                if (typeof indiceArregloPSeint !== 'number' || !Number.isInteger(indiceArregloPSeint) || indiceArregloPSeint <= 0) {
                    throw new Error(`Índice de arreglo inválido: '${coincidenciaAccesoArreglo[2]}'. Debe ser un entero positivo.`);
                }
            }

            // === VERIFICACIÓN DE EXISTENCIA Y CASO (CASE-SENSITIVE) ===
            if (!(nombreVarAcceso in ambitoActual)) {
                let foundSimilarCaseKey = null;
                for (const key in ambitoActual) {
                    if (key.toLowerCase() === nombreVarAcceso.toLowerCase()) {
                        foundSimilarCaseKey = key;
                        break;
                    }
                }
                if (foundSimilarCaseKey) {
                    añadirAdvertenciaSugerencia(`La variable '${nombreVarAcceso}' no está definida. ¿Quizás quisiste decir '${foundSimilarCaseKey}'? Los nombres de variables son sensibles a mayúsculas y minúsculas.`);
                }
                throw new Error(`La variable o arreglo '${nombreVarAcceso}' no está definida antes de su uso.`);
            }

            let valorEvaluado = evaluarExpresion(expresion, ambitoActual);

            if (esAccesoArreglo) {
                const varArregloMeta = ambitoActual[nombreVarAcceso];
                if (!varArregloMeta || varArregloMeta.type !== 'array') {
                    throw new Error(`No se puede acceder a '${nombreVarAcceso}' con índice: no es un arreglo.`);
                }
                const varArreglo = varArregloMeta.value;
                const tamañoLogicoArreglo = varArregloMeta.size;

                if (indiceArregloPSeint > tamañoLogicoArreglo) {
                    throw new Error(`Índice fuera de límites: '${indiceArregloPSeint}' para el arreglo '${nombreVarAcceso}' de tamaño ${tamañoLogicoArreglo}.`);
                }

                let tipoEsperado = varArregloMeta.baseType;
                if (tipoEsperado === 'desconocido') {
                    tipoEsperado = inferirTipo(valorEvaluado).toLowerCase();
                    if (tipoEsperado === 'desconocido' && valorEvaluado !== null) {
                        throw new Error(`Tipo de valor desconocido para inferir el tipo base del arreglo '${nombreArreglo}'.`);
                    }
                    varArregloMeta.baseType = tipoEsperado;
                    for (let k = 1; k <= tamañoLogicoArreglo; k++) {
                        if (varArreglo[k] === null || varArreglo[k] === undefined) {
                            varArreglo[k] = obtenerValorPorDefecto(tipoEsperado);
                        }
                    }
                }

                let valorConvertido = convertirValorParaAsignacion(valorEvaluado, tipoEsperado);
                varArreglo[indiceArregloPSeint] = valorConvertido;

            } else {
                let variableMeta = ambitoActual[nombreVarAcceso];
                if (!variableMeta) {
                    throw new Error(`Error interno: Metadatos de variable '${nombreVarAcceso}' no encontrados.`);
                }

                let tipoDestino = variableMeta.type;
                if (tipoDestino === 'desconocido') {
                    tipoDestino = inferirTipo(valorEvaluado).toLowerCase();
                    if (tipoDestino === 'desconocido' && valorEvaluado !== null) {
                        throw new Error(`Tipo de valor desconocido para inferir el tipo de la variable '${nombreVarAcceso}'.`);
                    }
                    variableMeta.type = tipoDestino;
                }

                let valorConvertido = convertirValorParaAsignacion(valorEvaluado, tipoDestino);
                variableMeta.value = valorConvertido;
            }

            // actualizarListaVariables(); // Eliminado, ya no hay panel de variables
            return true;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Escribir', 'Imprimir', 'Mostrar'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     */
    function handleEscribir(linea, ambitoActual, numLineaOriginal) {
        // Regex para 'Escribir', 'Imprimir' o 'Mostrar' (case-insensitive)
        const coincidenciaEscribir = linea.match(/^(Escribir|Imprimir|Mostrar)\s+(.*)/i);
        if (coincidenciaEscribir) {
            const cadenaArgs = coincidenciaEscribir[2]; // Captura el resto de la línea después de la palabra clave
            const args = dividirArgumentos(cadenaArgs);

            let partesMensajeSalida = [];
            for (const arg of args) {
                let parteEvaluada;
                // Intentar obtener el valor de una variable con su casing original
                if (ambitoActual.hasOwnProperty(arg) && typeof ambitoActual[arg] === 'object' && ambitoActual[arg] !== null && ambitoActual[arg].hasOwnProperty('value')) {
                    parteEvaluada = ambitoActual[arg].value;
                    if (ambitoActual[arg].type === 'array') {
                        const arrValue = ambitoActual[arg].value;
                        const arrSize = ambitoActual[arg].size;
                        const contenidoArreglo = [];
                        // PSeint arrays are base 1, so iterate from 1 to size
                        for (let k = 1; k <= arrSize; k++) {
                            const val = arrValue[k];
                            if (typeof val === 'boolean') contenidoArreglo.push(val ? 'Verdadero' : 'Falso');
                            else if (val === null || val === undefined) contenidoArreglo.push('nulo');
                            else contenidoArreglo.push(val);
                        }
                        parteEvaluada = `[${contenidoArreglo.join(', ')}]`;
                    }
                } else {
                    parteEvaluada = evaluarExpresion(arg, ambitoActual);
                }

                if (typeof parteEvaluada === 'boolean') {
                    partesMensajeSalida.push(parteEvaluada ? 'Verdadero' : 'Falso');
                } else if (parteEvaluada === undefined || parteEvaluada === null) {
                    partesMensajeSalida.push('nulo');
                } else {
                    partesMensajeSalida.push(parteEvaluada);
                }
            }
            añadirSalida(partesMensajeSalida.join(' '), 'normal');
            return true;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Leer'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     * @returns {Promise<boolean>} Una promesa que se resuelve a `true` si se manejó la instrucción.
     */
    async function handleLeer(linea, ambitoActual, numLineaOriginal) {
        // Regex para 'Leer' (case-insensitive)
        const coincidenciaLeer = linea.match(/^Leer\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)/i); // Permite múltiples variables
        if (coincidenciaLeer) {
            const destinosCompletos = coincidenciaLeer[1].split(',').map(s => s.trim()); // Array de "variable" o "arreglo[indice]"

            // Si hay múltiples variables, pediremos una sola línea de entrada y la dividiremos.
            if (destinosCompletos.length > 1) {
                añadirSalida(`[ADVERTENCIA]: La instrucción 'Leer' con múltiples variables (${destinosCompletos.join(', ')}) espera que los valores se ingresen en una sola línea separados por espacios o comas.`, 'advertencia');
            }

            // consoleInputArea.classList.add('active'); // Ya no se usa la clase active, siempre visible
            entradaConsola.disabled = false;
            entradaConsola.readOnly = false;
            añadirSalida('Escribe tu entrada aquí...', 'input-prompt'); // Mensaje de prompt de entrada

            // Re-añadir focus() y select() con requestAnimationFrame
            requestAnimationFrame(() => {
                entradaConsola.focus();
                entradaConsola.select();
            });

            btnEnviarEntrada.disabled = false;
            estadoApp.esperandoEntrada = true;
            // Almacenar todos los destinos para procesarlos después de la entrada
            estadoApp.variableEntradaActual = destinosCompletos;

            await new Promise(resolve => {
                estadoApp.resolverPromesaEntrada = resolve;
            });
            return true;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Si-Entonces-SinoSi-Sino'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     * @param {Array<string>} lineasBloque Todas las líneas del bloque actual de ejecución.
     * @param {number} currentLineIndex El índice actual en lineasBloque.
     * @returns {Promise<number|false>} El nuevo índice de la línea después de procesar el bloque Si, o `false` si no se manejó.
     */
    async function handleSi(linea, ambitoActual, numLineaOriginal, lineasBloque, currentLineIndex) {
        const siMatch = linea.match(/^Si\s+(.*)\s+Entonces$/i);
        if (siMatch) {
            let condition;
            try {
                condition = evaluarExpresion(siMatch[1], ambitoActual);
            } catch (e) {
                 throw new Error(`Error al evaluar la condición 'Si' ("${siMatch[1]}"). Detalle: ${e.message}`);
            }

            if (typeof condition !== 'boolean') {
                throw new Error(`La condición en 'Si' debe ser un valor lógico (verdadero o falso).`);
            }

            let ifBlock = [];
            let elseIfBlocks = [];
            let elseBlock = [];
            let currentInnerBlock = ifBlock; // Usa un nombre distinto para evitar confusión con ambitoActual

            let j = currentLineIndex + 1; // Empieza a escanear desde la siguiente línea
            let siCount = 1;

            while (j < lineasBloque.length && !estadoApp.detenerEjecucion) {
                let innerLine = lineasBloque[j].trim();
                const innerCommentIndex = innerLine.indexOf('//');
                if (innerCommentIndex !== -1) {
                    innerLine = innerLine.substring(0, innerCommentIndex).trim();
                }

                if (innerLine.startsWith('/*')) {
                    let blockCommentEndIndex = -1;
                    for (let k = j; k < lineasBloque.length; k++) {
                        if (lineasBloque[k].includes('*/')) {
                            blockCommentEndIndex = k;
                            break;
                        }
                    }
                    if (blockCommentEndIndex !== -1) {
                        j = blockCommentEndIndex + 1;
                        continue;
                    } else {
                        throw new Error(`Comentario de bloque '/*' no cerrado dentro de 'Si'.`);
                    }
                }

                if (innerLine.match(/^Si\s+/i)) {
                    siCount++;
                } else if (innerLine.toLowerCase() === 'finsi') {
                    siCount--;
                    if (siCount === 0) break;
                } else if (siCount === 1) { // Only consider SinoSi/Sino at the current Si block level
                    const sinoSiMatch = innerLine.match(/^SinoSi\s+(.*)\s+Entonces$/i);
                    if (sinoSiMatch) {
                        elseIfBlocks.push({ condition: sinoSiMatch[1], body: [] });
                        currentInnerBlock = elseIfBlocks[elseIfBlocks.length - 1].body;
                        j++;
                        continue;
                    } else if (innerLine.toLowerCase() === 'sino') {
                        currentInnerBlock = elseBlock;
                        j++;
                        continue;
                    }
                }

                currentInnerBlock.push(lineasBloque[j]);
                j++;
            }

            if (siCount !== 0) {
                 throw new Error(`Falta 'FinSi' o hay un anidamiento incorrecto para el bloque 'Si'.`);
            }

            if (condition) {
                await ejecutarBloque(ifBlock, ambitoActual, numLineaOriginal);
            } else {
                let ejecutadoSinoSi = false;
                for (const sinoSi of elseIfBlocks) {
                    if (estadoApp.detenerEjecucion) break;
                    try {
                        const condicionSinoSi = evaluarExpresion(sinoSi.condition, ambitoActual);
                        if (typeof condicionSinoSi !== 'boolean') {
                            throw new Error(`La condición 'SinoSi' debe ser lógica.`);
                        }
                        if (condicionSinoSi) {
                            await ejecutarBloque(sinoSi.body, ambitoActual, numLineaOriginal);
                            ejecutadoSinoSi = true;
                            break;
                        }
                    } catch (e) {
                        throw new Error(`Error al evaluar la condición 'SinoSi' ("${sinoSi.condition}"). Detalle: ${e.message}`);
                    }
                }
                if (!ejecutadoSinoSi && elseBlock.length > 0) {
                    await ejecutarBloque(elseBlock, ambitoActual, numLineaOriginal);
                }
            }
            return j;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Para'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     * @param {Array<string>} lineasBloque Todas las líneas del bloque actual de ejecución.
     * @param {number} currentLineIndex El índice actual en lineasBloque.
     * @returns {Promise<number|false>} El nuevo índice de la línea después de procesar el bucle Para, o `false` si no se manejó.
     */
    async function handlePara(linea, ambitoActual, numLineaOriginal, lineasBloque, currentLineIndex) {
        const coincidenciaPara = linea.match(/^Para\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*<-\s*(.*?)\s+Hasta\s+(.*?)(?:\s+Con\s+Paso\s+(.*?))?\s+Hacer$/i);
        if (coincidenciaPara) {
            const nombreVarBucle = coincidenciaPara[1];
            const expresionInicio = coincidenciaPara[2].trim();
            const expresionFin = coincidenciaPara[3].trim();
            const expresionPaso = (coincidenciaPara[4] || '1').trim();

            if (!(nombreVarBucle in ambitoActual)) {
                ambitoActual[nombreVarBucle] = { value: 0, type: 'entero' };
                añadirAdvertenciaSugerencia(`La variable de control de bucle '${nombreVarBucle}' no fue definida. Fue definida implícitamente como Entero.`);
                // actualizarListaVariables(); // Eliminado
            } else if (ambitoActual[nombreVarBucle].type !== 'entero' && ambitoActual[nombreVarBucle].type !== 'real') {
                throw new Error(`La variable de control de bucle '${nombreVarBucle}' debe ser de tipo numérico (Entero o Real).`);
            }

            let valorInicio, valorFin, valorPaso;
            try {
                valorInicio = evaluarExpresion(expresionInicio, ambitoActual);
                valorFin = evaluarExpresion(expresionFin, ambitoActual);
                valorPaso = evaluarExpresion(expresionPaso, ambitoActual);
            } catch (e) {
                throw new Error(`Error al evaluar el rango o paso del bucle 'Para'. Detalle: ${e.message}`);
            }

            if (typeof valorInicio !== 'number' || typeof valorFin !== 'number' || typeof valorPaso !== 'number') {
                 throw new Error(`Los valores de inicio, fin y paso en 'Para' deben ser numéricos.`);
            }
            if (valorPaso === 0) {
                throw new Error(`El 'Paso' en el bucle 'Para' no puede ser cero.`);
            }

            let cuerpoBucle = [];
            let j = currentLineIndex + 1;
            let paraCount = 1;

            while (j < lineasBloque.length && !estadoApp.detenerEjecucion) {
                let innerLine = lineasBloque[j].trim();
                const innerCommentIndex = innerLine.indexOf('//');
                if (innerCommentIndex !== -1) {
                    innerLine = innerLine.substring(0, innerCommentIndex).trim();
                }

                if (innerLine.startsWith('/*')) {
                    let blockCommentEndIndex = -1;
                    for (let k = j; k < lineasBloque.length; k++) {
                        if (lineasBloque[k].includes('*/')) {
                            blockCommentEndIndex = k;
                            break;
                        }
                    }
                    if (blockCommentEndIndex !== -1) {
                        j = blockCommentEndIndex + 1;
                        continue;
                    } else {
                        throw new Error(`Comentario de bloque '/*' no cerrado dentro de 'Para'.`);
                    }
                }

                if (innerLine.match(/^Para\s+/i)) {
                    paraCount++;
                } else if (innerLine.toLowerCase() === 'finpara') {
                    paraCount--;
                    if (paraCount === 0) break;
                }
                cuerpoBucle.push(lineasBloque[j]);
                j++;
            }

            if (paraCount !== 0) {
                throw new Error(`Falta 'FinPara' o hay un anidamiento incorrecto para el bucle 'Para'.`);
            }

            if ((valorPaso > 0 && valorInicio <= valorFin) || (valorPaso < 0 && valorInicio >= valorFin)) {
                for (let k = valorInicio; (valorPaso > 0 ? k <= valorFin : k >= valorFin); k += valorPaso) {
                    if (estadoApp.detenerEjecucion) break;
                    ambitoActual[nombreVarBucle].value = k;
                    // actualizarListaVariables(); // Eliminado
                    await ejecutarBloque(cuerpoBucle, ambitoActual, numLineaOriginal);
                    if (estadoApp.detenerEjecucion) break;
                }
            } else if (valorPaso === 0) {
                throw new Error(`El 'Paso' en el bucle 'Para' no puede ser cero.`);
            }

            return j;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Mientras'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     * @param {Array<string>} lineasBloque Todas las líneas del bloque actual de ejecución.
     * @param {number} currentLineIndex El índice actual en lineasBloque.
     * @returns {Promise<number|false>} El nuevo índice de la línea después de procesar el bucle Mientras, o `false` si no se manejó.
     */
    async function handleMientras(linea, ambitoActual, numLineaOriginal, lineasBloque, currentLineIndex) {
        const mientrasMatch = linea.match(/^Mientras\s+(.*)\s+Hacer$/i);
        if (mientrasMatch) {
            let expresionCondicion = mientrasMatch[1];
            let cuerpoBucle = [];
            let j = currentLineIndex + 1;
            let mientrasCount = 1;

            while (j < lineasBloque.length && !estadoApp.detenerEjecucion) {
                let innerLine = lineasBloque[j].trim();
                const innerCommentIndex = innerLine.indexOf('//');
                if (innerCommentIndex !== -1) {
                    innerLine = innerLine.substring(0, innerCommentIndex).trim();
                }

                if (innerLine.startsWith('/*')) {
                    let blockCommentEndIndex = -1;
                    for (let k = j; k < lineasBloque.length; k++) {
                        if (lineasBloque[k].includes('*/')) {
                            blockCommentEndIndex = k;
                            break;
                        }
                    }
                    if (blockCommentEndIndex !== -1) {
                        j = blockCommentEndIndex + 1;
                        continue;
                    } else {
                        throw new Error(`Comentario de bloque '/*' no cerrado dentro de 'Mientras'.`);
                    }
                }

                if (innerLine.match(/^Mientras\s+/i)) {
                    mientrasCount++;
                } else if (innerLine.toLowerCase() === 'finmientras') {
                    mientrasCount--;
                    if (mientrasCount === 0) break;
                }
                cuerpoBucle.push(lineasBloque[j]);
                j++;
            }

            if (mientrasCount !== 0) {
                throw new Error(`Falta 'FinMientras' o hay un anidamiento incorrecto para el bucle 'Mientras'.`);
            }

            let condicion;
            while (true) {
                if (estadoApp.detenerEjecucion) break;
                try {
                    condicion = evaluarExpresion(expresionCondicion, ambitoActual);
                } catch (e) {
                    throw new Error(`Error al evaluar la condición del bucle 'Mientras'. Detalle: ${e.message}`);
                }

                if (typeof condicion !== 'boolean') {
                    throw new Error(`La condición en 'Mientras' debe ser lógica (verdadero o falso).`);
                }
                if (!condicion) break;

                await ejecutarBloque(cuerpoBucle, ambitoActual, numLineaOriginal);
                if (estadoApp.detenerEjecucion) break;
            }
            return j;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Repetir-Hasta Que'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     * @param {Array<string>} lineasBloque Todas las líneas del bloque actual de ejecución.
     * @param {number} currentLineIndex El índice actual en lineasBloque.
     * @returns {Promise<number|false>} El nuevo índice de la línea después de procesar el bucle Repetir, o `false` si no se manejó.
     */
    async function handleRepetir(linea, ambitoActual, numLineaOriginal, lineasBloque, currentLineIndex) {
        const repetirMatch = linea.match(/^Repetir$/i);
        if (repetirMatch) {
            let cuerpoBucle = [];
            let j = currentLineIndex + 1;
            let repetirCount = 1;
            let expresionHastaQue = null;
            let encontradoHastaQue = false;

            while (j < lineasBloque.length && !estadoApp.detenerEjecucion) {
                let innerLine = lineasBloque[j].trim();
                const innerCommentIndex = innerLine.indexOf('//');
                if (innerCommentIndex !== -1) {
                    innerLine = innerLine.substring(0, innerCommentIndex).trim();
                }

                if (innerLine.startsWith('/*')) {
                    let blockCommentEndIndex = -1;
                    for (let k = j; k < lineasBloque.length; k++) {
                        if (lineasBloque[k].includes('*/')) {
                            blockCommentEndIndex = k;
                            break;
                        }
                    }
                    if (blockCommentEndIndex !== -1) {
                        j = blockCommentEndIndex + 1;
                        continue;
                    } else {
                        throw new Error(`Comentario de bloque '/*' no cerrado dentro de 'Repetir'.`);
                    }
                }

                if (innerLine.match(/^Repetir$/i)) {
                    repetirCount++;
                } else {
                    const hastaQueMatch = innerLine.match(/^Hasta Que\s+(.*)$/i);
                    if (hastaQueMatch) {
                        repetirCount--;
                        if (repetirCount === 0) {
                            expresionHastaQue = hastaQueMatch[1];
                            encontradoHastaQue = true;
                            break;
                        }
                    }
                }
                cuerpoBucle.push(lineasBloque[j]);
                j++;
            }

            if (!encontradoHastaQue || repetirCount !== 0) {
                throw new Error(`Falta 'Hasta Que' o hay un anidamiento incorrecto para el bucle 'Repetir'.`);
            }

            let condicion = false;
            do {
                if (estadoApp.detenerEjecucion) break;
                await ejecutarBloque(cuerpoBucle, ambitoActual, numLineaOriginal);
                if (estadoApp.detenerEjecucion) break;
                try {
                    condicion = evaluarExpresion(expresionHastaQue, ambitoActual);
                } catch (e) {
                    throw new Error(`Error al evaluar la condición 'Hasta Que'. Detalle: ${e.message}`);
                }
                if (typeof condicion !== 'boolean') {
                    throw new Error(`La condición 'Hasta Que' debe ser lógica.`);
                }
            } while (!condicion && !estadoApp.detenerEjecucion);

            return j;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Segun'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     * @param {Array<string>} lineasBloque Todas las líneas del bloque actual de ejecución.
     * @param {number} currentLineIndex El índice actual en lineasBloque.
     * @returns {Promise<number|false>} El nuevo índice de la línea después de procesar el bloque Segun, o `false` si no se manejó.
     */
    async function handleSegun(linea, ambitoActual, numLineaOriginal, lineasBloque, currentLineIndex) {
        const segunMatch = linea.match(/^Segun\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+Hacer$/i);
        if (segunMatch) {
            const controlVarName = segunMatch[1];

            if (!(controlVarName in ambitoActual) || ambitoActual[controlVarName].value === undefined) {
                let foundSimilarCaseKey = null;
                for (const key in ambitoActual) {
                    if (key.toLowerCase() === controlVarName.toLowerCase()) {
                        foundSimilarCaseKey = key;
                        break;
                    }
                }
                if (foundSimilarCaseKey) {
                    añadirAdvertenciaSugerencia(`La variable '${controlVarName}' no está definida. ¿Quizás quisiste decir '${foundSimilarCaseKey}'? Los nombres de variables son sensibles a mayúsculas y minúsculas.`);
                }
                throw new Error(`La variable '${controlVarName}' usada en 'Segun' no está definida.`);
            }
            const controlValue = ambitoActual[controlVarName].value;
            const controlValueType = ambitoActual[controlVarName].type;

            let cases = {};
            let defaultBlock = [];
            let currentCaseBlock = null;
            let inDefaultBlock = false;
            let j = currentLineIndex + 1;
            let segunCount = 1;

            while (j < lineasBloque.length && !estadoApp.detenerEjecucion) {
                const originalInnerLine = lineasBloque[j];
                let innerLine = originalInnerLine.trim();
                const innerCommentIndex = innerLine.indexOf('//');
                if (innerCommentIndex !== -1) {
                    innerLine = innerLine.substring(0, innerCommentIndex).trim();
                }

                if (innerLine.startsWith('/*')) {
                    let blockCommentEndIndex = -1;
                    for (let k = j; k < lineasBloque.length; k++) {
                        if (lineasBloque[k].includes('*/')) {
                            blockCommentEndIndex = k;
                            break;
                        }
                    }
                    if (blockCommentEndIndex !== -1) {
                        j = blockCommentEndIndex + 1;
                        continue;
                    } else {
                        throw new Error(`Comentario de bloque '/*' no cerrado dentro de 'Segun'.`);
                    }
                }

                if (innerLine.match(/^Segun\s+/i)) {
                    segunCount++;
                } else if (innerLine.toLowerCase() === 'finsegun') {
                    segunCount--;
                    if (segunCount === 0) break;
                } else if (segunCount === 1) { // Only consider case/default at the current Segun block level
                    // Regex para capturar valores de caso (cadenas entre comillas o números)
                    const caseMatch = innerLine.match(/^\s*(?:'([^']*)'|"([^"]*)"|([+-]?\d+(?:\.\d+)?))\s*:\s*(.*)$/i);
                    if (caseMatch) {
                        let caseValueRaw;
                        if (caseMatch[1] !== undefined) caseValueRaw = caseMatch[1]; // Single quotes
                        else if (caseMatch[2] !== undefined) caseValueRaw = caseMatch[2]; // Double quotes
                        else if (caseMatch[3] !== undefined) caseValueRaw = caseMatch[3]; // Number
                        else throw new Error(`Valor de caso inválido en 'Segun': '${originalInnerLine}'.`);

                        let caseValueParsed;
                        try {
                            caseValueParsed = convertirValorParaAsignacion(caseValueRaw, controlValueType);
                        } catch (conversionError) {
                            throw new Error(`Incompatibilidad de tipo en el caso '${caseValueRaw}' para la variable '${controlVarName}' (esperado: ${controlValueType}). Detalle: ${conversionError.message}`);
                        }

                        // Use String(parsedValue) as key to handle numbers/booleans consistently for object keys
                        const caseKey = String(caseValueParsed);
                        cases[caseKey] = [];
                        currentCaseBlock = cases[caseKey];
                        inDefaultBlock = false; // Reset default block flag

                        const restOfLine = caseMatch[4].trim();
                        if (restOfLine.length > 0) {
                            currentCaseBlock.push(restOfLine);
                        }
                        j++;
                        continue;
                    } else if (innerLine.toLowerCase() === 'de otro modo:') {
                        currentCaseBlock = defaultBlock;
                        inDefaultBlock = true;
                        j++;
                        continue;
                    }
                }

                if (currentCaseBlock) { // Only push if we're inside a case or default block
                    currentCaseBlock.push(lineasBloque[j]);
                }
                j++;
            }

            if (segunCount !== 0) {
                throw new Error(`Falta 'FinSegun' o hay un anidamiento incorrecto para el bloque 'Segun'.`);
            }

            let executedCase = false;
            // Convert controlValue to string to match object keys (cases are stored as strings)
            const controlValueString = String(controlValue);

            if (cases.hasOwnProperty(controlValueString)) {
                await ejecutarBloque(cases[controlValueString], ambitoActual, numLineaOriginal);
                executedCase = true;
            }

            if (!executedCase && defaultBlock.length > 0) {
                await ejecutarBloque(defaultBlock, ambitoActual, numLineaOriginal);
            }

            return j;
        }
        return false;
    }

    /**
     * Maneja la llamada a una función/subproceso.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal La línea original donde se hizo la llamada.
     * @returns {Promise<boolean>} Una promesa que se resuelve a `true` si se manejó la llamada.
     */
    async function handleLlamadaFuncion(linea, ambitoActual, numLineaOriginal) {
        const coincidenciaLlamadaFuncion = linea.match(/^([a-zA-Z_]\w*)\s*\((.*?)\)$/i);
        // La clave de la función en estadoApp.funciones se almacena en minúsculas.
        if (coincidenciaLlamadaFuncion && estadoApp.funciones.hasOwnProperty(coincidenciaLlamadaFuncion[1].toLowerCase())) {
            const nombreFunc = coincidenciaLlamadaFuncion[1].toLowerCase();
            const cadenaArgsFunc = coincidenciaLlamadaFuncion[2];
            const argsFunc = [];

            if (cadenaArgsFunc.trim() !== '') {
                const partesArgs = cadenaArgsFunc.split(',').map(arg => arg.trim());
                for (const parteArg of partesArgs) {
                    try {
                        // Al evaluar los argumentos para una llamada a función, se usa el casing original del argumento
                        if (ambitoActual.hasOwnProperty(parteArg) && typeof ambitoActual[parteArg] === 'object' && ambitoActual[parteArg] !== null && ambitoActual[parteArg].hasOwnProperty('value')) {
                            argsFunc.push(ambitoActual[parteArg].value);
                        } else {
                            argsFunc.push(evaluarExpresion(parteArg, ambitoActual));
                        }
                    } catch (e) {
                        throw new Error(`Error al evaluar el argumento '${parteArg}' para la función '${nombreFunc}'. Detalle: ${e.message}`);
                    }
                }
            }
            const valorRetornado = await llamarFuncion(nombreFunc, argsFunc, numLineaOriginal); // Pasa numLineaOriginal para la depuración
            // Si la función tiene una variable de retorno, asignarla al ámbito actual.
            if (estadoApp.funciones[nombreFunc].returnVar && !estadoApp.detenerEjecucion) {
                const nombreVarRetorno = estadoApp.funciones[nombreFunc].returnVar;
                 if (!(nombreVarRetorno in ambitoActual)) {
                    throw new Error(`La variable de retorno '${nombreVarRetorno}' de la función '${nombreFunc}' no está definida en este ámbito.`);
                }
                const tipoDestino = ambitoActual[nombreVarRetorno].type;
                const valorConvertido = convertirValorParaAsignacion(valorRetornado, tipoDestino);
                ambitoActual[nombreVarRetorno].value = valorConvertido;
                // actualizarListaVariables(); // Eliminado
            }
            return true;
        }
        return false;
    }

    /**
     * Maneja la instrucción 'Retornar'.
     * @param {string} linea La línea de código completa.
     * @param {object} ambitoActual El ámbito de variables actual.
     * @param {number} numLineaOriginal El número de línea original en el código.
     */
    function handleRetornar(linea, ambitoActual, numLineaOriginal) {
        const coincidenciaRetornar = linea.match(/^Retornar\s+(.*)$/i);
        if (coincidenciaRetornar) {
            const valorRetorno = evaluarExpresion(coincidenciaRetornar[1], ambitoActual);
            ambitoActual._valor_retorno_ = valorRetorno;
            estadoApp.detenerEjecucion = true; // Detiene la ejecución del bloque actual
            return true;
        }
        return false;
    }


    // Función principal de ejecución de bloque (el despachador).
    async function ejecutarBloque(lineasBloque, ambitoActual, desplazamientoLineaOriginal = 0) {
        if (estadoApp.detenerEjecucion) return;

        for (let i = 0; i < lineasBloque.length; i++) {
            if (estadoApp.detenerEjecucion) return;

            const lineaCompleta = lineasBloque[i];
            const numLineaOriginal = desplazamientoLineaOriginal + i + 1;

            let linea = lineaCompleta.trim();

            const indiceComentario = linea.indexOf('//');
            if (indiceComentario !== -1) {
                linea = linea.substring(0, indiceComentario).trim();
            }
            if (linea === '') continue;

            if (linea.startsWith('/*')) {
                let indiceFinComentarioBloque = -1;
                for (let j = i; j < lineasBloque.length; j++) {
                    if (lineasBloque[j].includes('*/')) {
                        indiceFinComentarioBloque = j;
                        break;
                    }
                }
                if (indiceFinComentarioBloque !== -1) {
                    i = indiceFinComentarioBloque;
                } else {
                    añadirSalida(`[ERROR en línea ${numLineaOriginal}]: Comentario de bloque '/*' no cerrado.`, 'error');
                    estadoApp.detenerEjecucion = true;
                    return;
                }
                continue;
            }

            try {
                let handled = false;

                // Intenta manejar la línea con cada función de handler
                // El orden importa: más específicos o que consumen múltiples líneas primero
                if (await handleDefinir(linea, ambitoActual, numLineaOriginal)) handled = true;
                else if (await handleDimension(linea, ambitoActual, numLineaOriginal)) handled = true;
                else if (await handleAsignacion(linea, ambitoActual, numLineaOriginal)) handled = true;
                // Escribir, Imprimir, Mostrar
                else if (await handleEscribir(linea, ambitoActual, numLineaOriginal)) handled = true;
                // Leer (puede ser asíncrono y manejar múltiples variables)
                else if (await handleLeer(linea, ambitoActual, numLineaOriginal)) handled = true;
                // Estructuras de control de flujo
                else if (linea.toLowerCase().startsWith('si ')) {
                    const newIndex = await handleSi(linea, ambitoActual, numLineaOriginal, lineasBloque, i);
                    if (newIndex !== false) {
                        i = newIndex;
                        handled = true;
                    }
                }
                else if (linea.toLowerCase().startsWith('para ')) {
                    const newIndex = await handlePara(linea, ambitoActual, numLineaOriginal, lineasBloque, i);
                    if (newIndex !== false) {
                        i = newIndex;
                        handled = true;
                    }
                }
                else if (linea.toLowerCase().startsWith('mientras ')) {
                    const newIndex = await handleMientras(linea, ambitoActual, numLineaOriginal, lineasBloque, i);
                    if (newIndex !== false) {
                        i = newIndex;
                        handled = true;
                    }
                }
                else if (linea.toLowerCase().startsWith('repetir')) {
                    const newIndex = await handleRepetir(linea, ambitoActual, numLineaOriginal, lineasBloque, i);
                    if (newIndex !== false) {
                        i = newIndex;
                        handled = true;
                    }
                }
                else if (linea.toLowerCase().startsWith('segun ')) {
                    const newIndex = await handleSegun(linea, ambitoActual, numLineaOriginal, lineasBloque, i);
                    if (newIndex !== false) {
                        i = newIndex;
                        handled = true;
                    }
                }
                // Funciones y procedimientos
                else if (await handleRetornar(linea, ambitoActual, numLineaOriginal)) handled = true; // Retornar primero para que detenga la ejecución del bloque
                else if (await handleLlamadaFuncion(linea, ambitoActual, numLineaOriginal)) handled = true; // Llamada a función después de retornar

                // Si ninguna función de manejo reconoció la línea, es un error.
                if (!handled) {
                    throw new Error(`Instrucción no reconocida: '${linea}'`);
                }

            } catch (e) {
                añadirSalida(`[ERROR en línea ${numLineaOriginal}]: ${e.message}`, 'error');
                estadoApp.errorEjecucion = e.message;
                estadoApp.detenerEjecucion = true;
                if (estadoApp.resolverPromesaEntrada) {
                    estadoApp.resolverPromesaEntrada();
                    estadoApp.resolverPromesaEntrada = null;
                }
                return;
            }
        }
    }


    // Función para llamar a una función de PSeint.
    async function llamarFuncion(nombreFunc, args, numLineaLlamada) {
        // Se busca la función por su nombre en minúsculas (clave interna)
        const func = estadoApp.funciones[nombreFunc.toLowerCase()];
        if (!func) {
            añadirSalida(`[ERROR en línea ${numLineaLlamada}]: La función '${nombreFunc}' no está definida.`, 'error');
            estadoApp.detenerEjecucion = true;
            return;
        }

        if (args.length !== func.params.length) {
            añadirSalida(`[ERROR en línea ${numLineaLlamada}]: La función '${nombreFunc}' espera ${func.params.length} argumentos, pero se proporcionaron ${args.length}.`, 'error');
            estadoApp.detenerEjecucion = true;
            return;
        }

        // Crear un nuevo ámbito para la función (variables locales).
        const ambitoFuncion = {};

        // Asignar argumentos a parámetros locales. Los parámetros se almacenan con su casing original.
        for (let k = 0; k < func.params.length; k++) {
            const nombreParam = func.params[k]; // Nombre del parámetro con casing original
            const valorArg = args[k];
            ambitoFuncion[nombreParam] = { value: valorArg, type: inferirTipo(valorArg).toLowerCase() };
        }

        // Ejecutar el cuerpo de la función.
        // Guardar el estado de detenerEjecucion antes de llamar a la función
        const estadoAnteriorDetener = estadoApp.detenerEjecucion;
        estadoApp.detenerEjecucion = false; // Resetear para la ejecución de la función
        await ejecutarBloque(func.body, ambitoFuncion, func.lineaInicio + 1);
        const valorRetornado = ambitoFuncion._valor_retorno_; // Obtener el valor de retorno
        estadoApp.detenerEjecucion = estadoAnteriorDetener || estadoApp.detenerEjecucion; // Restaurar o mantener si la función causó un error

        if (func.returnVar && valorRetornado === undefined) {
            añadirSalida(`[ERROR en la función '${nombreFunc}' (llamada en línea ${numLineaLlamada})]: La función '${nombreFunc}' debe retornar un valor asignado a '${func.returnVar}', pero no lo hizo.`, 'error');
            estadoApp.detenerEjecucion = true;
            return;
        }

        return valorRetornado;
    }


    // =========================================================================
    // VII. MANEJO DE ENTRADA DE USUARIO (PARA LA INSTRUCCIÓN 'Leer')
    // =========================================================================

    // Listener para el campo de entrada de la consola (cuando se presiona Enter).
    entradaConsola.addEventListener('keydown', async function(event) {
        if (event.key === 'Enter' && estadoApp.esperandoEntrada) {
            event.preventDefault();
            const valorEntradaRaw = entradaConsola.value;
            entradaConsola.value = '';
            // No se usa consoleInputArea.classList.remove('active');
            btnEnviarEntrada.disabled = true;
            entradaConsola.readOnly = true;

            estadoApp.esperandoEntrada = false;

            añadirSalida(`> ${valorEntradaRaw}`, 'user-input');

            // Divide la entrada del usuario por comas o espacios para múltiples valores.
            const valoresEntrada = valorEntradaRaw.split(/[, ]+/).filter(v => v.length > 0);

            const destinos = estadoApp.variableEntradaActual; // Array de destinos

            if (valoresEntrada.length !== destinos.length) {
                añadirSalida(`[ERROR de entrada]: Se esperaban ${destinos.length} valores, pero se ingresaron ${valoresEntrada.length}.`, 'error');
                estadoApp.detenerEjecucion = true;
                if (estadoApp.resolverPromesaEntrada) { estadoApp.resolverPromesaEntrada(); estadoApp.resolverPromesaEntrada = null; }
                return;
            }

            for (let i = 0; i < destinos.length; i++) {
                const destinoCompleto = destinos[i];
                const valorIndividual = valoresEntrada[i];

                let nombreVarAcceso = destinoCompleto;
                let esAccesoArreglo = false;
                let indiceArregloPSeint = -1;

                const coincidenciaAccesoArreglo = destinoCompleto.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(.*?)\]$/);
                if (coincidenciaAccesoArreglo) {
                    nombreVarAcceso = coincidenciaAccesoArreglo[1];
                    esAccesoArreglo = true;
                    try {
                        indiceArregloPSeint = evaluarExpresion(coincidenciaAccesoArreglo[2], estadoApp.variables);
                    } catch (e) {
                         añadirSalida(`[ERROR de entrada]: Error al evaluar el índice de arreglo para Leer '${nombreVarAcceso}': ${e.message}`, 'error');
                         estadoApp.detenerEjecucion = true;
                         break; // Exit the loop on error
                    }
                    if (typeof indiceArregloPSeint !== 'number' || !Number.isInteger(indiceArregloPSeint) || indiceArregloPSeint <= 0) {
                        añadirSalida(`[ERROR de entrada]: Índice de arreglo inválido para Leer: '${coincidenciaAccesoArreglo[2]}'. Debe ser un entero positivo.`, 'error');
                        estadoApp.detenerEjecucion = true;
                        break;
                    }
                }

                if (!(nombreVarAcceso in estadoApp.variables)) {
                    let foundSimilarCaseKey = null;
                    for (const key in estadoApp.variables) {
                        if (key.toLowerCase() === nombreVarAcceso.toLowerCase()) {
                            foundSimilarCaseKey = key;
                            break;
                        }
                    }
                    if (foundSimilarCaseKey) {
                        añadirAdvertenciaSugerencia(`La variable '${nombreVarAcceso}' no está definida para 'Leer'. ¿Quizás quisiste decir '${foundSimilarCaseKey}'? Los nombres de variables son sensibles a mayúsculas y minúsculas.`);
                    }
                    añadirSalida(`[ERROR de entrada]: La variable o arreglo '${nombreVarAcceso}' no está definida para 'Leer'.`, 'error');
                    estadoApp.detenerEjecucion = true;
                    break;
                }

                try {
                    let valorParseado;
                    const destinoMeta = estadoApp.variables[nombreVarAcceso];

                    if (esAccesoArreglo) {
                        if (!destinoMeta || destinoMeta.type !== 'array') {
                            throw new Error(`'${nombreVarAcceso}' no es un arreglo.`);
                        }
                        const varArreglo = destinoMeta.value;
                        const tamañoLogicoArreglo = destinoMeta.size;

                        if (indiceArregloPSeint > tamañoLogicoArreglo) {
                            throw new Error(`Índice fuera de límites: '${indiceArregloPSeint}' para el arreglo '${nombreVarAcceso}' de tamaño ${tamañoLogicoArreglo}.`);
                        }
                        let tipoEsperado = destinoMeta.baseType;

                        if (tipoEsperado === 'desconocido') {
                            tipoEsperado = inferirTipo(valorIndividual).toLowerCase();
                            if (tipoEsperado === 'desconocido') {
                                throw new Error(`Tipo de valor de entrada desconocido para inferir el tipo base del arreglo '${nombreVarAcceso}'.`);
                            }
                            destinoMeta.baseType = tipoEsperado;
                            // Initialize other array elements to default if type is newly inferred
                            for (let k = 1; k <= tamañoLogicoArreglo; k++) {
                                if (varArreglo[k] === null || varArreglo[k] === undefined) {
                                    varArreglo[k] = obtenerValorPorDefecto(tipoEsperado);
                                }
                            }
                        }
                        valorParseado = convertirValorParaAsignacion(valorIndividual, tipoEsperado);
                        varArreglo[indiceArregloPSeint] = valorParseado;
                    } else {
                        if (!destinoMeta || destinoMeta.type === 'array') {
                             throw new Error(`'${nombreVarAcceso}' es un arreglo. Accede a sus elementos usando índices (ej. ${nombreVarAcceso}[0]).`);
                        }
                        let tipoEsperado = destinoMeta.type;

                        if (tipoEsperado === 'desconocido') {
                            tipoEsperado = inferirTipo(valorIndividual).toLowerCase();
                            if (tipoEsperado === 'desconocido') {
                                throw new Error(`Tipo de valor de entrada desconocido para inferir el tipo de la variable '${nombreVarAcceso}'.`);
                            }
                            destinoMeta.type = tipoEsperado;
                        }
                        valorParseado = convertirValorParaAsignacion(valorIndividual, tipoEsperado);
                        destinoMeta.value = valorParseado;
                    }
                } catch (e) {
                    añadirSalida(`[ERROR de entrada]: Error al asignar a '${destinoCompleto}': ${e.message}`, 'error');
                    estadoApp.detenerEjecucion = true;
                    break;
                }
            } // Fin del bucle for de destinos

            // actualizarListaVariables(); // Eliminado

            if (estadoApp.resolverPromesaEntrada && !estadoApp.detenerEjecucion) { // Solo resuelve si no hubo error
                estadoApp.resolverPromesaEntrada();
                estadoApp.resolverPromesaEntrada = null;
            } else if (estadoApp.detenerEjecucion) {
                // Si hubo un error durante el procesamiento de entrada, asegúrate de resolver la promesa para no quedar atascado.
                if (estadoApp.resolverPromesaEntrada) {
                    estadoApp.resolverPromesaEntrada();
                    estadoApp.resolverPromesaEntrada = null;
                }
            }
        }
    });

    // También maneja el clic del botón de enviar para la entrada
    btnEnviarEntrada.addEventListener('click', async function() {
        const evento = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        entradaConsola.dispatchEvent(evento);
    });

    // =========================================================================
    // VIII. MANEJADORES DE EVENTOS DE BOTONES
    // =========================================================================

    // Botón Ejecutar Código: Inicia la simulación del pseudocódigo.
    btnEjecutarCodigo.addEventListener('click', async function() {
        // consoleInputArea.classList.remove('active'); // Ya no se usa la clase active
        entradaConsola.value = '';
        btnEnviarEntrada.disabled = true;
        entradaConsola.readOnly = true;
        await ejecutarPseudocodigo();
    });

    // Botón Limpiar Consola: Restablece la consola y el estado de la aplicación.
    btnLimpiarConsola.addEventListener('click', function() {
        restablecerEstado();
    });

    // Botón Nuevo Código: Limpia el código actual y carga una plantilla básica.
    btnNuevoCodigo.addEventListener('click', async function() { // Make async to await confirmation
        const confirmed = await mostrarConfirmacion('¿Estás seguro de que quieres crear un nuevo código? Los cambios no guardados se perderán.');
        if (confirmed) {
            cargarPlantillaInicial();
            restablecerEstado();
            añadirSalida('> Nuevo archivo de pseudocódigo. ¡Empieza a escribir!', 'normal');
        }
    });

    // Botón Guardar Código: Guarda el contenido del editor como un archivo .psc.
    btnGuardarCodigo.addEventListener('click', function() {
        const codigo = editorCodigo.getValue();
        const blob = new Blob([codigo], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pseudocodigo.psc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        añadirSalida('> Código guardado como pseudocodigo.psc', 'normal');
    });

    // Botón Abrir Código: Permite seleccionar y cargar un archivo .psc o .txt.
    btnAbrirCodigo.addEventListener('click', function() {
        inputAbrirCodigo.click();
    });

    // Maneja la selección de archivos después de hacer clic en "Abrir".
    inputAbrirCodigo.addEventListener('change', function(event) {
        const archivo = event.target.files[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = function(e) {
                editorCodigo.setValue(e.target.result);
                restablecerEstado();
                añadirSalida(`> Archivo '${archivo.name}' cargado.`, 'normal');
            };
            lector.readAsText(archivo);
        }
    });

    // =========================================================================
    // IX. GESTIÓN DE EJEMPLOS Y MENÚ DESPLEGABLE (AHORA EN PANEL LATERAL)
    // =========================================================================

    // Ejemplos de pseudocódigo predefinidos
    const exampleCodes = {
        simple_io: `Algoritmo Saludo
	Definir nombre Como Cadena
	Escribir "Por favor, ingresa tu nombre:"
	Leer nombre
	Escribir "Hola, ", nombre, " ¡Bienvenido a Webgoritmo!"
FinAlgoritmo`,
        if_simple: `Algoritmo NumeroPositivo
	Definir num Como Entero
	Escribir "Ingresa un numero:"
	Leer num
	Si num > 0 Entonces
		Escribir "El numero es positivo."
	FinSi
FinAlgoritmo`,
        if_else: `Algoritmo ParOImpar
	Definir num Como Entero
	Escribir "Ingresa un numero:"
	Leer num
	Si (num Mod 2) = 0 Entonces
		Escribir "El numero es par."
	Sino
		Escribir "El numero es impar."
	FinSi
FinAlgoritmo`,
        segun: `Algoritmo DiaSemana
	Definir dia Como Entero
	Escribir "Ingresa un numero del 1 al 7 para el dia de la semana:"
	Leer dia
	Segun dia Hacer
		1: Escribir "Lunes"
		2: Escribir "Martes"
		3: Escribir "Miércoles"
		4: Escribir "Jueves"
		5: Escribir "Viernes"
		6: Escribir "Sábado"
		7: Escribir "Domingo"
		De Otro Modo:
			Escribir "Numero invalido. Por favor, ingresa un numero entre 1 y 7."
	FinSegun
FinAlgoritmo`,
        while_loop: `Algoritmo ContadorMientras
	Definir contador Como Entero
	contador <- 1
	Mientras contador <= 5 Hacer
		Escribir "Contador: ", contador
		contador <- contador + 1
	FinMientras
	Escribir "Fin del contador."
FinAlgoritmo`,
        for_loop: `Algoritmo SumaDeNumeros
	Definir i, suma, num_max Como Entero
	suma <- 0
	Escribir "Hasta que numero quieres sumar (ej: 5):"
	Leer num_max
	Para i <- 1 Hasta num_max Con Paso 1 Hacer
		suma <- suma + i
	FinPara
	Escribir "La suma total es: ", suma
FinAlgoritmo`,
        repeat_until: `Algoritmo AdivinaNumeroSimple
	Definir secreto, intento Como Entero
	secreto <- pseudoAleatorio(1, 10) // Genera un número secreto entre 1 y 10
	Repetir
		Escribir "Adivina el numero (1-10):"
		Leer intento
		Si intento <> secreto Entonces
			Escribir "Incorrecto, intenta de nuevo."
		FinSi
	Hasta Que intento = secreto
	Escribir "¡Correcto! El numero era ", secreto, "."
FinAlgoritmo`,
        arrays: `Algoritmo EjemploArreglo
	// Definicion de un arreglo de 5 enteros
	Dimension numeros[5]
	Definir i, suma Como Entero
	
	suma <- 0
	
	// Leer 5 valores del usuario
	Para i <- 1 Hasta 5 Con Paso 1 Hacer
		Escribir "Ingrese el numero ", i, ":"
		Leer numeros[i]
	FinPara
	
	// Mostrar los valores y calcular la suma
	Escribir "Los numeros ingresados son:"
	Para i <- 1 Hasta 5 Con Paso 1 Hacer
		Escribir "  posicion [", i, "] = ", numeros[i]
		suma <- suma + numeros[i]
	FinPara
	
	// Calcular y mostrar el promedio
	Escribir "El promedio es ", suma / 5
FinAlgoritmo`,
        mod_example: `Algoritmo Modulo
	Definir N Como Real
	Definir M Como Real
	Escribir "Ingrese el numero:"
	Leer N
	Escribir "Ingrese el divisor:"
	Leer M
	Si N MOD M = 0 Entonces
		Escribir M, " es divisor exacto de ", N, "."
	Sino
		Escribir "El resto de dividir ", N, " por ", M, " es: ", N MOD M
	FinSi
FinAlgoritmo`
    };

    // Alternar la visibilidad del menú desplegable de ejemplos (ahora en el panel lateral)
    exampleDropdownToggle.addEventListener('click', function(event) {
        event.stopPropagation(); // Evita que el clic se propague al documento y cierre el menú
        exampleDropdownMenu.classList.toggle('show');
        this.classList.toggle('active'); // Alterna la clase 'active' en el panel-header para girar la flecha
        // Asegúrate de que el contenido del panel lateral se redibuje si es necesario
        if (editorCodigo) editorCodigo.refresh();
    });

    // Cerrar el menú desplegable si se hace clic fuera de él
    window.addEventListener('click', function(event) {
        // Cierra solo si el clic no fue dentro del menú ni en el botón de alternar
        if (!exampleDropdownMenu.contains(event.target) && !exampleDropdownToggle.contains(event.target) && exampleDropdownMenu.classList.contains('show')) {
            exampleDropdownMenu.classList.remove('show');
            exampleDropdownToggle.classList.remove('active');
        }
    });

    // Manejar la selección de ejemplos desde el menú
    exampleDropdownMenu.addEventListener('click', function(event) {
        // Usar event.target.closest para asegurar que el clic es en un <li> con data-example-id
        const clickedItem = event.target.closest('.example-item');
        if (clickedItem) {
            event.preventDefault(); // Previene la navegación si fuera un <a>
            const exampleKey = clickedItem.dataset.exampleId; // Usa data-example-id
            if (exampleKey && exampleCodes[exampleKey]) {
                editorCodigo.setValue(exampleCodes[exampleKey]);
                restablecerEstado();
                añadirSalida(`> Ejemplo '${clickedItem.textContent.trim()}' cargado.`, 'normal');
            }
            exampleDropdownMenu.classList.remove('show'); // Cierra el menú después de la selección
            exampleDropdownToggle.classList.remove('active');
        }
    });


    // =========================================================================
    // X. LÓGICA DEL PANEL LATERAL (COLAPSAR/EXPANDIR)
    // =========================================================================

    // Función para colapsar o expandir el panel lateral principal.
    function alternarPanelLateral() {
        const esMovil = window.innerWidth <= 900;

        if (esMovil) {
            // Comportamiento móvil: alternar la clase 'collapsed-mobile'
            panelLateral.classList.toggle('collapsed-mobile');
            const icono = btnAlternarPanelLateral.querySelector('i'); // Selecciona el icono dentro del botón
            // Cambia el icono de la flecha según el estado del panel.
            if (panelLateral.classList.contains('collapsed-mobile')) {
                icono.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                icono.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        } else {
            // Comportamiento de escritorio: alternar la clase 'collapsed'
            panelLateral.classList.toggle('collapsed');
            const icono = btnAlternarPanelLateral.querySelector('i'); // Selecciona el icono dentro del botón
            // Cambia el icono de la flecha según el estado del panel.
            if (panelLateral.classList.contains('collapsed')) {
                icono.classList.replace('fa-chevron-left', 'fa-chevron-right');
            } else {
                icono.classList.replace('fa-chevron-right', 'fa-chevron-left');
            }
        }
        // Fuerza a CodeMirror a actualizar su layout después de redimensionar el panel
        // para prevenir problemas de visualización.
        setTimeout(() => {
            if (editorCodigo) editorCodigo.refresh(); // Asegura que editorCodigo exista
        }, 300); // Pequeño retraso para permitir que la transición CSS se complete
    }
    // Listener para el botón de alternar el panel lateral.
    btnAlternarPanelLateral.addEventListener('click', alternarPanelLateral);

    // Ajuste inicial para la vista móvil al cargar la página.
    // Si la pantalla es móvil, colapsa el panel lateral por defecto y ajusta el icono.
    if (window.innerWidth <= 900) {
        const icono = btnAlternarPanelLateral.querySelector('i');
        icono.classList.replace('fa-chevron-left', 'fa-chevron-down'); // Establece el icono inicial para móvil
        panelLateral.classList.add('collapsed-mobile'); // Inicia colapsado en móvil
    }

    // Lógica para colapsar/expandir los paneles individuales (Sugerencias, Ejemplos)
    function setupCollapsiblePanel(headerElement, contentElement) {
        if (!headerElement || !contentElement) return; // Salir si los elementos no existen

        // Asegura que el contenido del panel de sugerencias esté expandido por defecto.
        // Si el panel de sugerencias tiene la clase 'expanded', es porque se añadió en HTML
        // Si no está 'expanded' por defecto en HTML, lo expandimos aquí
        if (!contentElement.classList.contains('expanded')) {
            contentElement.classList.add('expanded');
        }
        // Asegura que la flecha apunte hacia abajo si está expandido, o hacia arriba si está colapsado.
        const arrowIcon = headerElement.querySelector('.dropdown-arrow');
        if (arrowIcon) {
            if (contentElement.classList.contains('expanded')) {
                arrowIcon.classList.remove('fa-chevron-right', 'fa-chevron-left', 'fa-chevron-up');
                arrowIcon.classList.add('fa-chevron-down');
            } else {
                arrowIcon.classList.remove('fa-chevron-down', 'fa-chevron-left', 'fa-chevron-right');
                arrowIcon.classList.add('fa-chevron-up');
            }
        }

        headerElement.addEventListener('click', function() {
            contentElement.classList.toggle('expanded');
            if (arrowIcon) {
                if (contentElement.classList.contains('expanded')) {
                    arrowIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                } else {
                    arrowIcon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                }
            }
            // Forzar refresco de CodeMirror si el panel lateral principal está expandido
            // para asegurar que el editor se ajuste si su espacio cambia.
            setTimeout(() => {
                if (editorCodigo) editorCodigo.refresh();
            }, 300);
        });
    }

    // Aplica la lógica de colapsado/expandido a los paneles existentes
    setupCollapsiblePanel(suggestionsHeader, suggestionsContent);
    // El menú de ejemplos ya tiene su propia lógica de toggle en la sección IX, pero el panel-header necesita la flecha
    // Añadimos el listener de click al header del ejemplo para que el toggle de la flecha funcione.
    const exampleHeaderArrow = exampleDropdownToggle.querySelector('.dropdown-arrow');
    if (exampleHeaderArrow) {
        // Inicialmente, si el menú de ejemplos no se muestra, su flecha debe apuntar hacia la derecha (colapsado visualmente)
        // O si ya está configurado para mostrar, hacia abajo.
        if (!exampleDropdownMenu.classList.contains('show')) {
            exampleHeaderArrow.classList.add('fa-chevron-down'); // Por defecto, menú oculto, flecha hacia abajo
        } else {
            exampleHeaderArrow.classList.add('fa-chevron-up');
        }
    }


    // =========================================================================
    // XI. LÓGICA DE SUGERENCIAS Y DETECCIÓN DE SINTAXIS
    // =========================================================================

    // Lista de sugerencias de PSeint con ejemplos de código.
    const sugerencias = [
        { keyword: 'definir', title: 'Definir Variable', tip: 'Declara una variable con un tipo de dato específico (Entero, Real, Logico, Caracter, Cadena).', code: 'Definir [nombre_variable] Como [TipoDato]' },
        { keyword: 'dimension', title: 'Dimensionar Arreglo', tip: 'Declara un arreglo (array) con un tamaño fijo y opcionalmente un tipo base.', code: 'Dimension miArreglo[tamaño] Como TipoDato' },
        { keyword: 'escribir', title: 'Escribir / Mostrar / Imprimir', tip: 'Muestra mensajes de texto o el valor de variables en la consola. Puedes concatenar con comas.', code: 'Escribir "Hola Mundo", miVariable' },
        { keyword: 'leer', title: 'Leer / Entrada', tip: 'Lee un valor desde la entrada del usuario y lo asigna a una variable o elemento de arreglo.', code: 'Leer [nombre_variable]' },
        { keyword: 'si', title: 'Si-Entonces-Sino', tip: 'Ejecuta un bloque de código si una condición es Verdadera, y opcionalmente otro si es Falsa.', code: 'Si condicion Entonces\n\t// Código si Verdadero\nSino\n\t// Código si Falso\nFinSi' },
        { keyword: 'para', title: 'Para-Hasta-Hacer', tip: 'Bucle que se repite un número definido de veces, con un un valor inicial, final y paso.', code: 'Para i <- inicio Hasta fin Con Paso paso Hacer\n\t// Código a repetir\nFinPara' },
        { keyword: 'mientras', title: 'Mientras-Hacer', tip: 'Bucle que se repite mientras una condición booleana sea Verdadera. El código dentro se ejecuta cero o más veces.', code: 'Mientras condicion Hacer\n\t// Código a repetir\nFinMientras' },
        { keyword: 'repetir', title: 'Repetir-Hasta Que', tip: 'Bucle que se ejecuta al menos una vez y se repite hasta que una condición booleana sea Verdadera.', code: 'Repetir\n\t// Código a repetir\nHasta Que condicion' },
        { keyword: 'segun', title: 'Segun-Hacer', tip: 'Estructura de selección múltiple que ejecuta diferentes bloques de código según el valor de una expresión.', code: 'Segun variable Hacer\n\tvalor1:\n\t\t// Código para valor1\n\tvalor2:\n\t\t// Código para valor2\n\tDe Otro Modo:\n\t\t// Código para otros valores\nFinSegun' },
        { keyword: 'funcion', title: 'Funcion / SubProceso', tip: 'Define un bloque de código reutilizable que puede o no retornar un valor. (No ejecutado completamente en este simulador)', code: 'Funcion [resultado] = [nombre_funcion]([parametros])\n\t// Código de la función\nFinFuncion' },
        { keyword: 'proceso', title: 'Proceso / Algoritmo', tip: 'Define el bloque principal donde comienza y termina la ejecución de tu algoritmo.', code: 'Proceso [NombreDelProceso]\n\t// Tu código aquí\nFinProceso' },
        { keyword: '//', title: 'Comentario de una línea', tip: 'Ignora el texto desde // hasta el final de la línea.', code: '// Este es un comentario' },
        { keyword: '/*', title: 'Comentario de múltiples líneas', tip: 'Ignora el texto entre /* y */.', code: '/* Este es\n   un comentario\n   de varias líneas */' }
    ];

    // Actualiza las sugerencias y muestra errores de sintaxis básicos en el panel lateral.
    function actualizarSugerencias() {
        listaSugerencias.innerHTML = ''; // Limpia sugerencias y alertas anteriores
        // Asegúrate de que editorCodigo esté definido antes de usarlo
        if (!editorCodigo) {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.textContent = "Editor no inicializado. Recarga la página.";
            listaSugerencias.appendChild(li);
            return;
        }

        const codigo = editorCodigo.getValue(); // Obtiene todo el código del editor
        const cursor = editorCodigo.getCursor(); // Obtiene la posición actual del cursor
        const contenidoLinea = editorCodigo.getLine(cursor.line); // Contenido de la línea actual
        // Extrae la última palabra antes del cursor para sugerencias contextuales.
        // La regex `([\w\s]+)$` captura cualquier caracter de palabra o espacio hasta el final de la cadena,
        // luego trimStart() asegura que solo se considere la "palabra" real si hay espacios iniciales.
        const textoActualACoincidir = contenidoLinea.substring(0, cursor.ch).match(/([\w\s]+)$/);
        const palabraActual = textoActualACoincidir ? textoActualACoincidir[1].trimStart().toLowerCase() : "";

        let sugerenciasEncontradas = false; // Flag if specific suggestions were found
        let alertasSintaxisEncontradas = false; // Flag if any syntax alert was added

        // ----------------------------------------------------
        // VALIDACIÓN BÁSICA DE SINTAXIS PARA BLOQUES
        // This section checks if opening and closing blocks are balanced, ignoring comments.
        // ----------------------------------------------------

        // Cleans code of comments and old non-standard formats for accurate counting.
        const codigoLimpioParaBalance = codigo
            .replace(/\/\/.*$/gm, '') // Removes single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Removes block comments
            .replace(/^\s*\*\s*.*$/gm, ''); // Removes lines starting with '*' (from old example)


        // Helper function to check the balance of keyword pairs.
        const verificarBalance = (palabraClaveAbrir, palabraClaveCerrar) => {
            const conteoAbrir = (codigoLimpioParaBalance.match(new RegExp(`\\b${palabraClaveAbrir}\\b`, 'gi')) || []).length;
            const conteoCerrar = (codigoLimpioParaBalance.match(new RegExp(`\\b${palabraClaveCerrar}\\b`, 'gi')) || []).length;

            if (conteoAbrir > conteoCerrar) {
                añadirAlertaSintaxis(`Falta '${palabraClaveCerrar}' para cerrar tu '${palabraClaveAbrir}'.`);
                alertasSintaxisEncontradas = true;
            } else if (conteoCerrar > conteoAbrir) {
                añadirAlertaSintaxis(`Hay un '${palabraClaveCerrar}' sin su correspondiente '${palabraClaveAbrir}'.`);
                alertasSintaxisEncontradas = true;
            }
        };

        // Checks for main program blocks.
        const conteoInicioProceso = (codigoLimpioParaBalance.match(/\b(Proceso|Algoritmo)\b/gi) || []).length;
        const conteoFinProceso = (codigoLimpioParaBalance.match(/\b(FinProceso|FinAlgoritmo)\b/gi) || []).length;

        if (codigo.trim().length > 0) { // Only if there's code in the editor
            if (conteoInicioProceso === 0) {
                añadirAlertaSintaxis("Tu código debe comenzar con 'Proceso' o 'Algoritmo'.");
                alertasSintaxisEncontradas = true;
            } else if (conteoInicioProceso > 1) {
                añadirAlertaSintaxis("Demasiados bloques 'Proceso' o 'Algoritmo'. Solo se permite uno principal.");
                alertasSintaxisEncontradas = true;
            } else if (conteoInicioProceso !== conteoFinProceso) {
                añadirAlertaSintaxis("Falta 'FinProceso' o 'FinAlgoritmo' para cerrar el proceso principal.");
                alertasSintaxisEncontradas = true;
            }
        }

        // Checks for other block structures.
        verificarBalance('Si', 'FinSi');
        verificarBalance('Mientras', 'FinMientras');
        verificarBalance('Para', 'FinPara');
        verificarBalance('Segun', 'FinSegun');
        verificarBalance('Funcion', 'FinFuncion');
        verificarBalance('SubProceso', 'FinSubProceso');

        // Special check for 'Repetir-Hasta Que' (it's a unique pair).
        const conteoRepetir = (codigoLimpioParaBalance.match(new RegExp(`\\bRepetir\\b`, 'gi')) || []).length;
        const conteoHastaQue = (codigoLimpioParaBalance.match(new RegExp(`\\bHasta Que\\b`, 'gi')) || []).length;
        if (conteoRepetir !== conteoHastaQue) {
            añadirAlertaSintaxis("Cada 'Repetir' debe tener un 'Hasta Que' correspondiente y viceversa. Revisa tus bucles.");
            alertasSintaxisEncontradas = true;
        }

        // ----------------------------------------------------
        // CONTEXTUAL SUGGESTIONS (BASED ON USER TYPING)
        // ----------------------------------------------------

        if (palabraActual.length > 0) {
            // Filters suggestions that start with the word the user is currently typing.
            const sugerenciasFiltradas = sugerencias.filter(sug => sug.keyword.startsWith(palabraActual));

            if (sugerenciasFiltradas.length > 0) {
                sugerenciasFiltradas.forEach(sug => {
                    const li = document.createElement('li');
                    li.className = 'suggestion-item';
                    // Displays title, tip, and code example of the suggestion.
                    li.innerHTML = `<strong>${sug.title}</strong><br>${sug.tip}<pre>${sug.code}</pre>`;
                    // Add click listener to insert the suggestion.
                    li.addEventListener('click', () => insertarSugerencia(sug.code, palabraActual.length));
                    listaSugerencias.appendChild(li);
                    sugerenciasEncontradas = true;
                });
            }
        }

        // ----------------------------------------------------
        // DEFAULT MESSAGE IF NO SUGGESTIONS OR ERRORS
        // ----------------------------------------------------
        if (!sugerenciasEncontradas && !alertasSintaxisEncontradas) {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.textContent = "Escribe una palabra clave (ej: 'definir', 'si') para ver sugerencias.";
            listaSugerencias.appendChild(li);
        }
    }

    // Inserts the suggested code into the CodeMirror editor.
    function insertarSugerencia(codigoSugerido, charsARemover) {
        // Ensure editorCodigo is initialized before using it
        if (!editorCodigo) {
            añadirSalida(`[ERROR]: El editor de código no está inicializado. No se puede insertar la sugerencia.`, 'error');
            return;
        }
        const cursor = editorCodigo.getCursor(); // Get current cursor position.
        // Calculate the starting position to replace the incomplete word.
        const inicioCaracter = cursor.ch - charsARemover;

        // Replace text in the CodeMirror editor.
        editorCodigo.replaceRange(codigoSugerido, { line: cursor.line, ch: inicioCaracter }, { line: cursor.line, ch: cursor.ch });

        // Move the cursor to the end of the inserted text so the user can continue typing.
        const nuevaPosicionCursor = { line: cursor.line, ch: inicioCaracter + codigoSugerido.length };
        editorCodigo.setCursor(nuevaPosicionCursor);
        editorCodigo.focus(); // Re-focus the editor.

        actualizarSugerencias(); // Re-update suggestions after insertion.
    }

    // New function to load the initial template and position the cursor
    function cargarPlantillaInicial() {
        const plantilla = `Algoritmo MiAlgoritmo
	// Escribe tu código aquí
FinAlgoritmo`;
        editorCodigo.setValue(plantilla);

        // Position the cursor and select the placeholder text
        const lineas = plantilla.split('\n');
        let lineaComentario = -1;

        for (let i = 0; i < lineas.length; i++) {
            const trimmedLine = lineas[i].trim();
            if (trimmedLine.startsWith('//')) {
                lineaComentario = i;
                break;
            }
        }

        if (lineaComentario !== -1) {
            const inicioComentario = { line: lineaComentario, ch: lineas[lineaComentario].indexOf('//') };
            const finComentario = { line: lineaComentario, ch: lineas[lineaComentario].length }; // To the end of the line

            editorCodigo.setSelection(inicioComentario, finComentario); // Selects the entire comment
            editorCodigo.focus(); // Ensure the editor has focus
            editorCodigo.replaceSelection(''); // Deletes the selected text (the placeholder)
            // Position the cursor after '// ' (on the second line, as the placeholder is now gone)
            editorCodigo.setCursor(lineaComentario, inicioComentario.ch);
        }
    }

    // =========================================================================
    // XII. CONFIGURACIÓN INICIAL AL CARGAR LA PÁGINA
    // =========================================================================

    // Define el modo PSeint para CodeMirror, crucial para el resaltado de sintaxis.
    // Movido aquí para asegurar que se defina antes de que CodeMirror.fromTextArea lo use.
    CodeMirror.defineMode("pseint", function() {
        // Palabras clave de PSeint ordenadas por longitud (desc) para priorizar palabras clave multi-palabra
        // (ej. "Hasta Que" antes de "Hasta").
        const palabrasClave = [
            "Proceso", "Algoritmo", "FinProceso", "FinAlgoritmo",
            "Definir", "Como", "Entero", "Real", "Logico", "Caracter", "Cadena", "Dimension",
            "Escribir", "Imprimir", "Mostrar", "Leer", "Si", "Entonces", "Sino", "FinSi", // Añadidas Imprimir y Mostrar
            "Para", "Hasta", "Con", "Paso", "Hacer", "FinPara",
            "Mientras", "FinMientras",
            "Repetir", "Hasta Que", // Palabra clave compuesta
            "Segun", "De Otro Modo", "FinSegun", // Palabra clave compuesta
            "Funcion", "SubProceso", "FinFuncion", "FinSubProceso", "Retornar",
            "Verdadero", "Falso", "No", "Y", "O", "Mod", "Div", // Operadores lógicos y matemáticos
            "Abs", "RC", "Sen", "Cos", "Tan", "Ln", "Exp", "Azar", "Trunc", "Redon", // Funciones matemáticas
            "Longitud", "Subcadena", "Mayusculas", "Minusculas", "ConvertirATexto", "ConvertirANumero", // Funciones de cadena
            "LimpiarPantalla", "EsperarTecla", "Esperar" // Otras funciones incorporadas de PSeint
        ].sort((a, b) => b.length - a.length); // Ordena de más largo a más corto

        // Función para crear una expresión regular que coincida con palabras clave completas.
        function crearRegexPalabraClave(listaPalabras) {
            // Escapa caracteres especiales de regex en palabras clave y reemplaza espacios para la coincidencia de regex
            const palabrasEscapadas = listaPalabras.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s/g, '\\s+'));
            return new RegExp("^((" + palabrasEscapadas.join("|") + ")\\b)", "i");
        }

        const regexPalabrasClavePseudo = crearRegexPalabraClave(palabrasClave);

        return {
            startState: function() {
                return {
                    enComentarioBloque: false // Estado para rastrear si actualmente está dentro de un comentario de bloque
                };
            },
            token: function(stream, state) {
                // 1. Manejo de comentarios de bloque (/* ... */)
                if (state.enComentarioBloque) {
                    if (stream.match("*/")) {
                        state.enComentarioBloque = false;
                        return "comment";
                    }
                    stream.next(); // Consume el caracter
                    return "comment";
                }

                if (stream.match("/*")) {
                    state.enComentarioBloque = true;
                    return "comment";
                }

                // 2. Manejo de comentarios de una sola línea (//)
                if (stream.match("//")) {
                    stream.skipToEnd(); // Salta al final de la línea
                    return "comment";
                }

                // 3. Números (enteros o flotantes)
                if (stream.match(/^\d+(\.\d+)?/)) {
                    return "number";
                }

                // 4. Literales de cadena (comillas dobles o simples)
                if (stream.match(/^"([^"]*)"/)) {
                    return "string";
                }
                if (stream.match(/^'([^']*)'/)) {
                    return "string";
                }

                // 5. Palabras clave (incluidas las palabras clave compuestas como "Hasta Que")
                // Esta verificación es crucial y debe ocurrir ANTES de los identificadores genéricos.
                if (stream.match(regexPalabrasClavePseudo)) {
                    return "keyword";
                }

                // 6. Operadores PSeint (asignación, comparación, aritméticos)
                if (stream.match(/^(<-|<=|>=|==|<>|\+|-|\*|\/|%|\^)/)) {
                    return "operator";
                }

                // 7. Paréntesis, corchetes (para funciones, arreglos)
                if (stream.match(/[(){}[\]]/)) {
                    return "punctuation"; // Usa 'punctuation' para estos
                }

                // 8. Identificadores (nombres de variables, nombres de funciones no incorporadas)
                // Esto debe ser sensible a mayúsculas y minúsculas para coincidir con la nueva lógica.
                if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
                    return "variable"; // Clase genérica para identificadores
                }

                // 9. Espacio en blanco (ignorar)
                if (stream.eatSpace()) {
                    return null;
                }

                // 10. Cualquier otro caracter (avanza para evitar bucles infinitos)
                stream.next();
                return null;
            }
        };
    });


    // Initialise CodeMirror editor in the textarea with id="code-input"
    // Wrapped in a try-catch to capture any initialization errors
    let editorCodigo; // Declare editorCodigo here, but assign it after DOM is ready.
    try {
        editorCodigo = CodeMirror.fromTextArea(codeInputTextArea, { // Use codeInputTextArea directly
            mode: "pseint", // Use our defined PSeint mode
            lineNumbers: true, // Show line numbers
            matchBrackets: true, // Highlight matching brackets
            autofocus: true, // Focus editor on load
            theme: "dracula", // Use Dracula theme (CSS must be linked)
            styleActiveLine: true, // Highlight active line
            foldGutter: true, // Enable code folding
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"] // Show necessary gutters
        });

        // Only attach event listeners and load template if editor initialized successfully
        editorCodigo.on('change', actualizarSugerencias);
        editorCodigo.on('cursorActivity', actualizarSugerencias);
        cargarPlantillaInicial();
    } catch (e) {
        console.error("Error initializing CodeMirror editor:", e);
        añadirSalida(`[ERROR FATAL]: No se pudo inicializar el editor de código. Por favor, recarga la página o revisa la consola del navegador para más detalles.`, 'error');
        // If initialization fails, prevent further operations that rely on editorCodigo
        return;
    }
});
