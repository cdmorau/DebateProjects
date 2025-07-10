function getInitialState() {
    return {
        judges: [
            {
                name: "Juez Principal", // Will be updated with translations when available
                role: "principal",
                positions: { ag: 1, ao: 2, bg: 3, bo: 4 },
                activePositions: { ag: true, ao: true, bg: true, bo: true }
            },
            {
                name: "Panelista", // Will be updated with translations when available
                role: "panelista",
                positions: { ag: 1, ao: 2, bg: 3, bo: 4 },
                activePositions: { ag: true, ao: true, bg: true, bo: true }
            }
        ],
        draggedCell: null,
        draggedPosition: null,
        tappedCell: null,
        currentCardIndex: 0
    };
}

const initialState = getInitialState();

function saveStateToLocalStorage(state) {
    try {
        const stateToSave = { judges: state.judges };
        localStorage.setItem('debateAppState', JSON.stringify(stateToSave));
    } catch (e) {
            // Error saving state
    }
}

function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('debateAppState');
        if (savedState === null) {
            return null;
        }
        return JSON.parse(savedState);
    } catch (e) {
            // Error loading state
        return null;
    }
}

const loadedState = loadStateFromLocalStorage();

export const state = {
    ...initialState,
    ...(loadedState && loadedState.judges ? { judges: loadedState.judges } : {})
};

export function updateAndSaveState(updates) {
    Object.assign(state, updates);
    saveStateToLocalStorage(state);
}

export function updateDefaultJudgeNames(translate) {
    // Only update if we have the default judges and translations are available
    if (state.judges.length >= 2 && 
        (state.judges[0].name === "Juez Principal" || state.judges[0].name === "Chair Judge") &&
        (state.judges[1].name === "Panelista" || state.judges[1].name === "Panelist")) {
        
        state.judges[0].name = translate('callManager.defaultPrincipalName');
        state.judges[1].name = translate('callManager.defaultPanelistName');
        saveStateToLocalStorage(state);
    }
} 