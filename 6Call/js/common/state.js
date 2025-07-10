function getInitialState() {
    return {
        judges: [
            {
                id: 'j_initial_principal_' + Date.now(),
                name: "Juez Principal", // Will be updated with translations when available
                role: "principal",
                positions: { ag: 1, ao: 2, bg: 3, bo: 4 },
                activePositions: { ag: true, ao: true, bg: true, bo: true }
            },
            {
                id: 'j_initial_panelista_' + Date.now(),
                name: "Panelista", // Will be updated with translations when available
                role: "panelista",
                positions: { ag: 1, ao: 2, bg: 3, bo: 4 },
                activePositions: { ag: true, ao: true, bg: true, bo: true }
            }
        ],
        draggedCell: null,
        draggedPosition: null,
        tappedCell: null,
        currentCardIndex: 0,
        visualizationInitialized: false
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

function generateJudgeId() {
    return 'j_' + Math.random().toString(36).substr(2, 9) + Date.now();
}

function migrateJudgesWithoutIds(judges) {
    return judges.map(judge => {
        if (!judge.id) {
            return {
                ...judge,
                id: generateJudgeId()
            };
        }
        return judge;
    });
}

function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('debateAppState');
        if (savedState === null) {
            return null;
        }
        const parsedState = JSON.parse(savedState);
        
        // Migrate judges without IDs
        if (parsedState.judges) {
            parsedState.judges = migrateJudgesWithoutIds(parsedState.judges);
        }
        
        return parsedState;
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

export function resetState() {
    localStorage.removeItem('debateAppState');
    const freshState = getInitialState();
    Object.assign(state, freshState);
    saveStateToLocalStorage(state);
    return state;
}

export function debugState() {
    console.log('Current state:', state);
    console.log('LocalStorage state:', localStorage.getItem('debateAppState'));
    return state;
} 