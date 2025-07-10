import { state, updateAndSaveState } from '../../common/state.js';

let view;

export function initCallManagerHandlers(dependencies) {
    view = dependencies.view;
}

function updatePositionColors() {
    // Actualizar colores basados en posición después del intercambio
    const positionCells = document.querySelectorAll('.position-cell');
    positionCells.forEach(cell => {
        const position = cell.getAttribute('data-position');
        // Remover clases de color anteriores
        cell.classList.remove('pos-1', 'pos-2', 'pos-3', 'pos-4');
        // Agregar nueva clase basada en posición
        cell.classList.add(`pos-${position}`);
    });
}

export const callManagerHandlers = {
    handleCellTap(e) {
        e.preventDefault();
        const self = this; 
        if (state.tappedCell && state.tappedCell !== self) {
            const sourceCard = state.tappedCell.closest('.judge-card');
            const targetCard = self.closest('.judge-card');
            if (!sourceCard || sourceCard !== targetCard) {
                state.tappedCell.classList.remove('cell-tapped');
                state.tappedCell = null;
                return;
            }
            const tappedPosition = state.tappedCell.getAttribute('data-position');
            const tappedRole = state.tappedCell.getAttribute('data-role');
            const thisPosition = self.getAttribute('data-position');
            const thisRole = self.getAttribute('data-role');
            
            // Intercambiar posiciones en DOM
            state.tappedCell.setAttribute('data-position', thisPosition);
            self.setAttribute('data-position', tappedPosition);
            
            // Actualizar números en círculos
            const tappedNumber = state.tappedCell.querySelector('.pos-number');
            const thisNumber = self.querySelector('.pos-number');
            if (tappedNumber) tappedNumber.textContent = thisPosition;
            if (thisNumber) thisNumber.textContent = tappedPosition;

            // Feedback visual: animar ambas celdas
            state.tappedCell.classList.add('cell-swap-animate');
            self.classList.add('cell-swap-animate');

            setTimeout(() => {
                const judgeId = sourceCard.getAttribute('data-judge-id');
                const judge = state.judges.find(j => j.id === judgeId);
                if (judge) {
                    judge.positions[tappedRole.toLowerCase()] = parseInt(thisPosition);
                    judge.positions[thisRole.toLowerCase()] = parseInt(tappedPosition);
                    updateAndSaveState({ judges: state.judges });
                    
                    // Actualizar colores y visualización
                    updatePositionColors();
                    view.updateVisualization();
                }
                state.tappedCell.classList.remove('cell-swap-animate', 'cell-tapped');
                self.classList.remove('cell-swap-animate');
                state.tappedCell = null;
            }, 300);
        } else {
            if (state.tappedCell) {
                state.tappedCell.classList.remove('cell-tapped');
            }
            state.tappedCell = self;
            self.classList.add('cell-tapped');
        }
    },

    handleDragStart(e) {
        state.draggedCell = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleDragEnd(e) {
        this.classList.remove('dragging');
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    handleDrop(e) {
        e.preventDefault();
        if (state.draggedCell === this) return;

        const sourceCard = state.draggedCell.closest('.judge-card');
        const targetCard = this.closest('.judge-card');
        if (!sourceCard || sourceCard !== targetCard) return;

        const targetPosition = this.getAttribute('data-position');
        const targetRole = this.getAttribute('data-role');
        const draggedRole = state.draggedCell.getAttribute('data-role');
        const draggedPosition = state.draggedCell.getAttribute('data-position');

        // Intercambiar posiciones en DOM
        this.setAttribute('data-position', draggedPosition);
        state.draggedCell.setAttribute('data-position', targetPosition);
        
        // Actualizar números en círculos
        const targetNumber = this.querySelector('.pos-number');
        const draggedNumber = state.draggedCell.querySelector('.pos-number');
        if (targetNumber) targetNumber.textContent = draggedPosition;
        if (draggedNumber) draggedNumber.textContent = targetPosition;

        const judgeId = sourceCard.getAttribute('data-judge-id');
        const judge = state.judges.find(j => j.id === judgeId);
        
        if (judge) {
            judge.positions[targetRole.toLowerCase()] = parseInt(draggedPosition);
            judge.positions[draggedRole.toLowerCase()] = parseInt(targetPosition);
            updateAndSaveState({ judges: state.judges });
            
            // Actualizar colores y visualización
            updatePositionColors();
            view.updateVisualization();
        }
    },

    swapJudges(judgeId1, judgeId2) {
        const judge1Index = state.judges.findIndex(j => j.id === judgeId1);
        const judge2Index = state.judges.findIndex(j => j.id === judgeId2);
        
        if (judge1Index !== -1 && judge2Index !== -1) {
            const updatedJudges = [...state.judges];
            [updatedJudges[judge1Index], updatedJudges[judge2Index]] = [updatedJudges[judge2Index], updatedJudges[judge1Index]];
            updateAndSaveState({ judges: updatedJudges });
            view.updateVisualization();
        }
    }
};
