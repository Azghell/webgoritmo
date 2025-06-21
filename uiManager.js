// uiManager.js
// Contiene funciones que actualizan la UI y manejan interacciones de UI.

// Se asume que las constantes de elementos DOM (ej. salidaConsola) y estadoApp
// son accesibles globalmente (definidas en configGlobal.js y utilidadesDOM.js).
// También se asume que 'editorCodigo' (instancia de CodeMirror) es global o accesible.

function añadirSalida(mensaje, tipo = 'normal') {
    const elementoLinea = document.createElement('div');
    elementoLinea.textContent = mensaje;
    elementoLinea.classList.add('console-line', tipo);
    salidaConsola.appendChild(elementoLinea);
    salidaConsola.scrollTop = salidaConsola.scrollHeight;
}

function añadirAlertaSintaxis(mensaje) {
    const li = document.createElement('li');
    li.className = 'suggestion-item syntax-error';
    li.innerHTML = `<strong>Error de Sintaxis Potencial:</strong><br>${mensaje}`;
    listaSugerencias.appendChild(li);
}

function añadirAdvertenciaSugerencia(mensaje) {
    const li = document.createElement('li');
    li.className = 'suggestion-item warning-item';
    li.innerHTML = `<strong>Advertencia:</strong><br>${mensaje}`;
    listaSugerencias.appendChild(li);
}

function mostrarConfirmacion(message) {
    modalMessage.textContent = message;
    confirmationModal.style.display = 'flex';

    return new Promise(resolve => {
        estadoApp.resolverConfirmacion = resolve;

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

function cargarPlantillaInicial() {
    const plantilla = `Algoritmo MiAlgoritmo
	// Escribe tu código aquí
FinAlgoritmo`;
    if (editorCodigo) { // Asegurarse que editorCodigo esté definido
        editorCodigo.setValue(plantilla);

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

            editorCodigo.setSelection(inicioComentario, finComentario);
            editorCodigo.focus();
            editorCodigo.replaceSelection('');
            editorCodigo.setCursor(lineaComentario, inicioComentario.ch);
        }
    }
}

function alternarPanelLateral() {
    const esMovil = window.innerWidth <= 900;

    if (esMovil) {
        panelLateral.classList.toggle('collapsed-mobile');
        const icono = btnAlternarPanelLateral.querySelector('i');
        if (panelLateral.classList.contains('collapsed-mobile')) {
            icono.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            icono.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    } else {
        panelLateral.classList.toggle('collapsed');
        const icono = btnAlternarPanelLateral.querySelector('i');
        if (panelLateral.classList.contains('collapsed')) {
            icono.classList.replace('fa-chevron-left', 'fa-chevron-right');
        } else {
            icono.classList.replace('fa-chevron-right', 'fa-chevron-left');
        }
    }
    setTimeout(() => {
        if (editorCodigo) editorCodigo.refresh();
    }, 300);
}

function setupCollapsiblePanel(headerElement, contentElement) {
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
            if (editorCodigo) editorCodigo.refresh();
        }, 300);
    });
}
