// uiManager.js
// Contiene funciones que actualizan la UI y manejan interacciones de UI.

window.Webgoritmo = window.Webgoritmo || {};
Webgoritmo.UI = Webgoritmo.UI || {};

Webgoritmo.UI.añadirSalida = function(mensaje, tipo = 'normal') {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.salidaConsola) {
        console.error("Error en añadirSalida: Webgoritmo.DOM.salidaConsola no está definido.");
        return;
    }
    const elementoLinea = document.createElement('div');
    elementoLinea.textContent = mensaje;
    elementoLinea.classList.add('console-line', tipo);
    Webgoritmo.DOM.salidaConsola.appendChild(elementoLinea);
    Webgoritmo.DOM.salidaConsola.scrollTop = Webgoritmo.DOM.salidaConsola.scrollHeight;
};

Webgoritmo.UI.añadirAlertaSintaxis = function(mensaje) {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.listaSugerencias) {
        console.error("Error en añadirAlertaSintaxis: Webgoritmo.DOM.listaSugerencias no está definido.");
        return;
    }
    const li = document.createElement('li');
    li.className = 'suggestion-item syntax-error';
    li.innerHTML = `<strong>Error de Sintaxis Potencial:</strong><br>${mensaje}`;
    Webgoritmo.DOM.listaSugerencias.appendChild(li);
};

Webgoritmo.UI.añadirAdvertenciaSugerencia = function(mensaje) {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.listaSugerencias) {
        console.error("Error en añadirAdvertenciaSugerencia: Webgoritmo.DOM.listaSugerencias no está definido.");
        return;
    }
    const li = document.createElement('li');
    li.className = 'suggestion-item warning-item';
    li.innerHTML = `<strong>Advertencia:</strong><br>${mensaje}`;
    Webgoritmo.DOM.listaSugerencias.appendChild(li);
};

Webgoritmo.UI.mostrarConfirmacion = function(message) {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.modalMessage || !Webgoritmo.DOM.confirmationModal || !Webgoritmo.DOM.modalConfirmBtn || !Webgoritmo.DOM.modalCancelBtn || !Webgoritmo.estadoApp) {
        console.error("Error en mostrarConfirmacion: Faltan elementos DOM o Webgoritmo.estadoApp.");
        return Promise.resolve(false); // Devolver una promesa resuelta para no romper el flujo
    }
    Webgoritmo.DOM.modalMessage.textContent = message;
    Webgoritmo.DOM.confirmationModal.style.display = 'flex';

    return new Promise(resolve => {
        Webgoritmo.estadoApp.resolverConfirmacion = resolve;

        const handleConfirm = () => {
            Webgoritmo.DOM.confirmationModal.style.display = 'none';
            Webgoritmo.DOM.modalConfirmBtn.removeEventListener('click', handleConfirm);
            Webgoritmo.DOM.modalCancelBtn.removeEventListener('click', handleCancel);
            Webgoritmo.estadoApp.resolverConfirmacion = null;
            resolve(true);
        };

        const handleCancel = () => {
            Webgoritmo.DOM.confirmationModal.style.display = 'none';
            Webgoritmo.DOM.modalConfirmBtn.removeEventListener('click', handleConfirm);
            Webgoritmo.DOM.modalCancelBtn.removeEventListener('click', handleCancel);
            Webgoritmo.estadoApp.resolverConfirmacion = null;
            resolve(false);
        };

        Webgoritmo.DOM.modalConfirmBtn.addEventListener('click', handleConfirm);
        Webgoritmo.DOM.modalCancelBtn.addEventListener('click', handleCancel);
    });
};

Webgoritmo.UI.cargarPlantillaInicial = function() {
    const plantilla = `Algoritmo MiAlgoritmo
	// Escribe tu código aquí
FinAlgoritmo`;
    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) {
        Webgoritmo.Editor.editorCodigo.setValue(plantilla);

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
            const finComentario = { line: lineaComentario, ch: lineas[lineaComentario].length };

            Webgoritmo.Editor.editorCodigo.setSelection(inicioComentario, finComentario);
            Webgoritmo.Editor.editorCodigo.focus();
            Webgoritmo.Editor.editorCodigo.replaceSelection('');
            Webgoritmo.Editor.editorCodigo.setCursor(lineaComentario, inicioComentario.ch);
        }
    } else {
        console.error("Error en cargarPlantillaInicial: Webgoritmo.Editor.editorCodigo no está definido.");
    }
};

Webgoritmo.UI.alternarPanelLateral = function() {
    if (!Webgoritmo.DOM || !Webgoritmo.DOM.panelLateral || !Webgoritmo.DOM.btnAlternarPanelLateral) {
        console.error("Error en alternarPanelLateral: Faltan Webgoritmo.DOM.panelLateral o Webgoritmo.DOM.btnAlternarPanelLateral.");
        return;
    }
    const esMovil = window.innerWidth <= 900;
    if (esMovil) {
        Webgoritmo.DOM.panelLateral.classList.toggle('collapsed-mobile');
        const icono = Webgoritmo.DOM.btnAlternarPanelLateral.querySelector('i');
        if (icono) {
            if (Webgoritmo.DOM.panelLateral.classList.contains('collapsed-mobile')) {
                icono.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                icono.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        }
    } else {
        Webgoritmo.DOM.panelLateral.classList.toggle('collapsed');
        const icono = Webgoritmo.DOM.btnAlternarPanelLateral.querySelector('i');
        if (icono) {
            if (Webgoritmo.DOM.panelLateral.classList.contains('collapsed')) {
                icono.classList.replace('fa-chevron-left', 'fa-chevron-right');
            } else {
                icono.classList.replace('fa-chevron-right', 'fa-chevron-left');
            }
        }
    }
    setTimeout(() => {
        if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) Webgoritmo.Editor.editorCodigo.refresh();
    }, 300);
};

Webgoritmo.UI.setupCollapsiblePanel = function(headerElement, contentElement) {
    if (!headerElement || !contentElement) return;

    if (!contentElement.classList.contains('expanded')) {
        contentElement.classList.add('expanded');
    }
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
        setTimeout(() => {
            if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) {
                Webgoritmo.Editor.editorCodigo.refresh();
            }
        }, 300);
    });
};

Webgoritmo.UI.inicializarManejoEjemplos = function() {
    if (Webgoritmo.DOM.exampleDropdownToggle && Webgoritmo.DOM.exampleDropdownMenu) {
        Webgoritmo.DOM.exampleDropdownToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            Webgoritmo.DOM.exampleDropdownMenu.classList.toggle('show');
            this.classList.toggle('active');
            if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) Webgoritmo.Editor.editorCodigo.refresh();
        });

        window.addEventListener('click', function(event) {
            if (Webgoritmo.DOM.exampleDropdownMenu && Webgoritmo.DOM.exampleDropdownToggle &&
                !Webgoritmo.DOM.exampleDropdownMenu.contains(event.target) &&
                !Webgoritmo.DOM.exampleDropdownToggle.contains(event.target) &&
                Webgoritmo.DOM.exampleDropdownMenu.classList.contains('show')) {
                Webgoritmo.DOM.exampleDropdownMenu.classList.remove('show');
                Webgoritmo.DOM.exampleDropdownToggle.classList.remove('active');
            }
        });

        Webgoritmo.DOM.exampleDropdownMenu.addEventListener('click', function(event) {
            const clickedItem = event.target.closest('.example-item');
            if (clickedItem) {
                event.preventDefault();
                const exampleKey = clickedItem.dataset.exampleId;
                if (exampleKey && Webgoritmo.Datos && Webgoritmo.Datos.exampleCodes && Webgoritmo.Datos.exampleCodes[exampleKey]) {
                    if (Webgoritmo.Editor && Webgoritmo.Editor.editorCodigo) Webgoritmo.Editor.editorCodigo.setValue(Webgoritmo.Datos.exampleCodes[exampleKey]);
                    if (typeof Webgoritmo.restablecerEstado === "function") Webgoritmo.restablecerEstado();
                    Webgoritmo.UI.añadirSalida(`> Ejemplo '${clickedItem.textContent.trim()}' cargado.`, 'normal');
                }
                Webgoritmo.DOM.exampleDropdownMenu.classList.remove('show');
                Webgoritmo.DOM.exampleDropdownToggle.classList.remove('active');
            }
        });
    } else {
        console.error("Error en inicializarManejoEjemplos: Faltan elementos DOM para el menú de ejemplos.");
    }
};
