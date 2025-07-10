import { state, updateAndSaveState } from '../../common/state.js';

let view;

export function initCallManagerHandlers(dependencies) {
    view = dependencies.view;
}

export const callManagerHandlers = {
    handleCellTap(e) {
        e.preventDefault();
        const self = this; 
        if (state.tappedCell && state.tappedCell !== self) {
            const sourceCard = state.tappedCell.closest('.judge-card');
            const targetCard = self.closest('.judge-card');
            if (!sourceCard || sourceCard !== targetCard) {
                state.tappedCell.classList.remove('tapped');
                state.tappedCell = null;
                return;
            }
            const tappedPosition = state.tappedCell.getAttribute('data-position');
            const tappedRole = state.tappedCell.getAttribute('data-role');
            const thisPosition = self.getAttribute('data-position');
            const thisRole = self.getAttribute('data-role');
            state.tappedCell.setAttribute('data-position', thisPosition);
            state.tappedCell.setAttribute('class', `position-cell position-${thisPosition}`);
            self.setAttribute('data-position', tappedPosition);
            self.setAttribute('class', `position-cell position-${tappedPosition}`);
            const judgeNameElement = sourceCard.querySelector('.judge-name');
            const roleElement = judgeNameElement.querySelector('.judge-role');
            const roleText = roleElement ? roleElement.textContent : '';
            const judgeName = judgeNameElement.textContent.replace(roleText, '').trim();
            const judge = state.judges.find(j => j.name === judgeName);
            if (judge) {
                judge.positions[tappedRole.toLowerCase()] = parseInt(thisPosition);
                judge.positions[thisRole.toLowerCase()] = parseInt(tappedPosition);
                updateAndSaveState({ judges: state.judges });
                view.updateComparisons();
            }
            state.tappedCell.classList.remove('tapped');
            state.tappedCell = null;
        } else {
            if (state.tappedCell) state.tappedCell.classList.remove('tapped');
            state.tappedCell = self;
            state.tappedCell.classList.add('tapped');
        }
    },

    handleDragStart(e) {
        state.draggedCell = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleDragEnd(e) {
        this.classList.remove('dragging');
        state.draggedCell = null;
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

        this.setAttribute('data-position', draggedPosition);
        this.setAttribute('class', `position-cell position-${draggedPosition}`);
        state.draggedCell.setAttribute('data-position', targetPosition);
        state.draggedCell.setAttribute('class', `position-cell position-${targetPosition}`);

        const judgeNameElement = sourceCard.querySelector('.judge-name');
        const roleElement = judgeNameElement.querySelector('.judge-role');
        const roleText = roleElement ? roleElement.textContent : '';
        const judgeName = judgeNameElement.textContent.replace(roleText, '').trim();
        const judge = state.judges.find(j => j.name === judgeName);
        
        if (judge) {
            judge.positions[targetRole.toLowerCase()] = parseInt(draggedPosition);
            judge.positions[draggedRole.toLowerCase()] = parseInt(targetPosition);
            updateAndSaveState({ judges: state.judges });
            view.updateComparisons();
        }
    }
};
