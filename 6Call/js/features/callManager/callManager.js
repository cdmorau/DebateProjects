import { state, updateAndSaveState, updateDefaultJudgeNames } from '../../common/state.js';
import { translate, subscribe } from '../../common/i18n.js';
import { callManagerLogic } from './callManager.logic.js';
import { callManagerView, initCallManagerView } from './callManager.view.js';
import { callManagerHandlers, initCallManagerHandlers } from './callManager.handlers.js';

const mainFunctions = {
    addGenericJudge,
    changeJudgeRole,
    toggleAllPositions,
    removeJudge
};

function generateJudgeId() {
    return 'j_' + Math.random().toString(36).substr(2, 9) + Date.now();
}

function addGenericJudge() {
    const newJudge = {
        id: generateJudgeId(),
        name: translate('callManager.newJudgeName'),
        role: "panelista",
        positions: { ag: 1, ao: 2, bg: 3, bo: 4 },
        activePositions: { ag: true, ao: true, bg: true, bo: true }
    };
    updateAndSaveState({ judges: [...state.judges, newJudge] });
    callManagerView.updateVisualization();

    setTimeout(() => {
        const judgeCards = document.querySelectorAll('.judge-card');
        const lastJudgeCard = judgeCards[judgeCards.length - 1];
        if (lastJudgeCard) {
            const nameElement = lastJudgeCard.querySelector('.judge-name');
            if (nameElement) {
                callManagerView.editJudgeName(nameElement, translate('callManager.newJudgeName'));
            }
        }
    }, 100);
    callManagerView.updateCarouselArrows();
}

function init() {
    const addJudgeBtn = document.querySelector('.add-judge-button');
    if (addJudgeBtn) {
        const newAddJudgeBtn = addJudgeBtn.cloneNode(true);
        addJudgeBtn.parentNode.replaceChild(newAddJudgeBtn, addJudgeBtn);
        newAddJudgeBtn.addEventListener('click', addGenericJudge);
    }
    
    // Only update visualization if DOM elements are ready
    if (callManagerView.isReady()) {
        callManagerView.updateVisualization();
        callManagerView.updateCarouselArrows();
    }
}

function changeJudgeRole(judgeId, newRole) {
    const judge = state.judges.find(j => j.id === judgeId);
    if (judge) {
        if (newRole === 'principal') {
            const existingPrincipal = state.judges.find(j => j.role === 'principal' && j.id !== judgeId);
            if (existingPrincipal) {
                alert(translate('alerts.principalExists'));
                return;
            }
        }
        judge.role = newRole;
        updateAndSaveState({ judges: state.judges });
        callManagerView.updateVisualization();
    }
    const selector = document.querySelector('.judge-role-selector');
    if (selector) {
        selector.remove();
    }
}

function toggleAllPositions(judgeId, isActive) {
    const judge = state.judges.find(j => j.id === judgeId);
    if (judge) {
        Object.keys(judge.activePositions).forEach(role => {
            judge.activePositions[role] = isActive;
        });
        updateAndSaveState({ judges: state.judges });
        callManagerView.updateVisualization();
    }
}

function removeJudge(judgeId) {
    const judge = state.judges.find(j => j.id === judgeId);
    if (judge && judge.role === 'principal') {
        alert(translate('alerts.cannotDeletePrincipal'));
        return;
    }
    const updatedJudges = state.judges.filter(j => j.id !== judgeId);
    updateAndSaveState({ judges: updatedJudges });
    callManagerView.updateVisualization();
}

export function initCallManager() {
    initCallManagerView({
        logic: callManagerLogic,
        handlers: callManagerHandlers,
        mainFunctions: mainFunctions
    });
    initCallManagerHandlers({
        view: callManagerView
    });
    
    // Update default judge names with translations
    updateDefaultJudgeNames(translate);
    
    // Ensure all judges have unique IDs and migrate if necessary
    if (state.judges && state.judges.length > 0) {
        let needsUpdate = false;
        const updatedJudges = state.judges.map(judge => {
            if (!judge.id) {
                needsUpdate = true;
                return {
                    ...judge,
                    id: generateJudgeId()
                };
            }
            return judge;
        });
        
        if (needsUpdate) {
            updateAndSaveState({ judges: updatedJudges });
        }
    }
    
    // Only update visualization if DOM elements are ready
    if (callManagerView.isReady()) {
        callManagerView.updateVisualization();
        callManagerView.updateCarouselArrows();
    }

    subscribe(() => {
        callManagerView.updateVisualization();
    });

    if (!state.judges || state.judges.length === 0) {
        // Reset to initial state with translated names
        const defaultJudges = [
            {
                id: generateJudgeId(),
                name: translate('callManager.defaultPrincipalName'),
                role: "principal",
                positions: { ag: 1, ao: 2, bg: 3, bo: 4 },
                activePositions: { ag: true, ao: true, bg: true, bo: true }
            },
            {
                id: generateJudgeId(),
                name: translate('callManager.defaultPanelistName'),
                role: "panelista",
                positions: { ag: 1, ao: 2, bg: 3, bo: 4 },
                activePositions: { ag: true, ao: true, bg: true, bo: true }
            }
        ];
        updateAndSaveState({ judges: defaultJudges });
    }
}

export const callManager = {
    addGenericJudge,
    changeJudgeRole,
    toggleAllPositions,
    removeJudge,
    logic: callManagerLogic,
    view: callManagerView,
    handlers: callManagerHandlers,
    init
};
