import { state } from '../../common/state.js';
import { translate } from '../../common/i18n.js';

let logic;
let handlers;
let mainFunctions;

export function initCallManagerView(dependencies) {
    logic = dependencies.logic;
    handlers = dependencies.handlers;
    mainFunctions = dependencies.mainFunctions;
}

export const callManagerView = {
    updateVisualization() {
        const judgesGrid = document.getElementById('judges-grid');
        const template = document.getElementById('judge-card-template');
        judgesGrid.innerHTML = '';

        const principalComparisons = logic.calculateComparisons();
        const principalJudge = state.judges.find(j => j.role === 'principal');

        state.judges.forEach(judge => {
            const clone = template.content.cloneNode(true);
            const judgeCard = clone.querySelector('.judge-card');
            
            const nameTextSpan = clone.querySelector('.name-text');
            const roleSpan = clone.querySelector('.judge-role');
            const judgeNameSpan = clone.querySelector('.judge-name');
            const removeButton = clone.querySelector('.remove-judge');
            const positionGrid = clone.querySelector('.position-grid');
            const switchCheckbox = clone.querySelector('.judge-switch input');

            nameTextSpan.textContent = judge.name;
            if (judge.role === 'principal') {
                roleSpan.textContent = translate('roles.principal_short');
            } else if (judge.role === 'trainee') {
                roleSpan.textContent = translate('roles.trainee_short');
            } else {
                roleSpan.textContent = translate('roles.panelista_short');
            }

            judgeNameSpan.addEventListener('click', () => this.editJudgeName(judgeNameSpan, judge.name));
            roleSpan.addEventListener('click', (event) => {
                event.stopPropagation();
                this.editJudgeRole(roleSpan, judge.name, event);
            });

            if (judge.role !== 'principal') {
                removeButton.addEventListener('click', () => mainFunctions.removeJudge(judge.name));
            } else {
                removeButton.disabled = true;
                removeButton.title = translate('tooltips.cannotDeletePrincipal');
                removeButton.classList.add('disabled');
            }

            const roles = [
                { name: 'AG', position: judge.positions.ag },
                { name: 'AO', position: judge.positions.ao },
                { name: 'BG', position: judge.positions.bg },
                { name: 'BO', position: judge.positions.bo }
            ];
            const judgeAllActive = Object.values(judge.activePositions).every(v => v);
            roles.forEach(role => {
                const cell = document.createElement('div');
                cell.className = 'position-cell' + (judgeAllActive ? ` position-${role.position}` : '');
                cell.dataset.role = role.name;
                cell.dataset.position = role.position;
                cell.textContent = translate(`teams.${role.name.toLowerCase()}`);
                
                if (judgeAllActive) {
                    if (logic.isTouchDevice()) {
                        cell.style.cursor = 'pointer';
                        cell.addEventListener('touchstart', handlers.handleCellTap, { passive: false });
                    } else {
                        cell.setAttribute('draggable', 'true');
                        cell.style.cursor = 'move';
                        cell.addEventListener('dragstart', handlers.handleDragStart);
                        cell.addEventListener('dragend', handlers.handleDragEnd);
                        cell.addEventListener('dragover', handlers.handleDragOver);
                        cell.addEventListener('drop', handlers.handleDrop);
                    }
                } else {
                    cell.setAttribute('draggable', 'false');
                    cell.classList.add('position-neutral');
                }
                positionGrid.appendChild(cell);
            });
            
            switchCheckbox.checked = judgeAllActive;
            switchCheckbox.addEventListener('change', (e) => mainFunctions.toggleAllPositions(judge.name, e.target.checked));

            judgesGrid.appendChild(clone);
        });

        this.updateComparisons();
        this.updateResolutionIndicators();
        this.updateCarouselArrows();
        if (window.innerWidth <= 480) {
            state.currentCardIndex = 0;
            this.scrollToCard(0);
        }
    },

    updateComparisons(comparisons = null) {
        if (!comparisons) {
            comparisons = logic.calculateComparisons();
        }
        const comparisonGrid = document.getElementById('comparison-grid');
        if (!comparisonGrid) return;
        comparisonGrid.innerHTML = '';
        const totalJudges = state.judges.length;
        if (totalJudges === 0) return;
    
        const impactScores = logic.analyzeComparisonImpact();
        const orderedComparisons = Object.keys(impactScores);
        const template = document.getElementById('comparison-item-template');
    
        orderedComparisons.forEach(comparison => {
            const data = comparisons[comparison];
            if (!data) return;
    
            const [team1, team2] = comparison.split(' vs ');
            const votesForTeam1 = data.details.filter(d => d.winner === team1).length;
            const votesForTeam2 = data.details.filter(d => d.winner === team2).length;
    
            const clone = template.content.cloneNode(true);
            const comparisonItem = clone.querySelector('.comparison-item');
    
            // Populate header
            clone.querySelector('.team-1-name').textContent = translate(`teams.${team1.toLowerCase()}`);
            clone.querySelector('.votes').textContent = `${votesForTeam1} - ${votesForTeam2}`;
            clone.querySelector('.team-2-name').textContent = translate(`teams.${team2.toLowerCase()}`);
    
            // Minority indicator logic
            const minorityTeam = votesForTeam1 <= votesForTeam2 ? team1 : team2;
            const principalJudge = state.judges.find(j => j.role === 'principal');
            let principalInMinority = false;
            function normalizeName(name) { return name.trim().toLowerCase(); }
            if (principalJudge) {
                const principalVote = data.details.find(d => normalizeName(d.name) === normalizeName(principalJudge.name));
                if (principalVote && principalVote.winner === minorityTeam) {
                    principalInMinority = true;
                }
            }
            const minorityIndicator = clone.querySelector('.minority-indicator');
            if (principalInMinority) {
                minorityIndicator.textContent = translate('callManager.principalInMinority');
                minorityIndicator.classList.add('minority-indicator-active');
            }
    
            // Populate detailed votes
            const votesTeam1Col = clone.querySelector('.votes-column.team-1');
            const votesTeam2Col = clone.querySelector('.votes-column.team-2');
            votesTeam1Col.querySelector('.team-name').textContent = translate(`teams.${team1.toLowerCase()}`);
            votesTeam2Col.querySelector('.team-name').textContent = translate(`teams.${team2.toLowerCase()}`);
    
            const judgesVotes1Container = votesTeam1Col.querySelector('.judges-votes');
            const judgesVotes2Container = votesTeam2Col.querySelector('.judges-votes');
            judgesVotes1Container.innerHTML = '';
            judgesVotes2Container.innerHTML = '';
    
            data.details.forEach(detail => {
                const voteDiv = document.createElement('div');
                voteDiv.className = `judge-vote ${detail.role}`;
                voteDiv.style.marginBottom = '8px';
    
                const infoDiv = document.createElement('div');
                infoDiv.className = 'judge-info';
    
                const nameSpan = document.createElement('span');
                nameSpan.className = 'judge-name';
                nameSpan.textContent = detail.name;
    
                const roleSpan = document.createElement('span');
                roleSpan.className = 'judge-role';
                roleSpan.textContent = translate(`roles.${detail.role}_short`);
    
                infoDiv.appendChild(nameSpan);
                infoDiv.appendChild(roleSpan);
                voteDiv.appendChild(infoDiv);
    
                if (detail.winner === team1) {
                    judgesVotes1Container.appendChild(voteDiv);
                } else {
                    judgesVotes2Container.appendChild(voteDiv);
                }
            });
    
            const status = logic.getAgreementStatus(data);
            comparisonItem.classList.add(status);
            
            const toggleButton = clone.querySelector('.toggle-details');
            toggleButton.addEventListener('click', () => this.toggleVotes(toggleButton));
    
            comparisonGrid.appendChild(clone);
        });
    },

    toggleVotes(button) {
        const comparisonItem = button.closest('.comparison-item');
        const allVotes = comparisonItem.querySelector('.all-votes');
        if (allVotes) {
            const isCollapsed = comparisonItem.classList.contains('collapsed');
            button.classList.toggle('collapsed');
            comparisonItem.classList.toggle('collapsed');
            if (isCollapsed) {
                allVotes.style.display = 'block';
                button.textContent = translate('common.back');
            } else {
                allVotes.style.display = 'none';
                button.textContent = translate('common.info');
            }
        }
    },

    editJudgeName(element, oldName) {
        const roleSpan = element.querySelector('.judge-role');
        const roleText = roleSpan ? roleSpan.textContent : '';
        const currentName = element.textContent.replace(roleText, '').trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'judge-name editing';
        element.replaceWith(input);
        input.focus();
        input.select();
        
        const handleEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                const judge = state.judges.find(j => j.name === oldName);
                if (judge) {
                    judge.name = newName;
                    this.updateVisualization();
                }
            } else {
                const div = document.createElement('div');
                div.className = 'judge-name';
                div.addEventListener('click', () => this.editJudgeName(div, oldName));
                
                const newRoleSpan = document.createElement('span');
                newRoleSpan.className = 'judge-role';
                newRoleSpan.textContent = roleText;
                
                const newNameText = document.createElement('span');
                newNameText.className = 'name-text';
                newNameText.textContent = currentName;

                div.appendChild(newRoleSpan);
                div.appendChild(newNameText);
                input.replaceWith(div);
            }
        };
        
        input.addEventListener('blur', handleEdit);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') input.blur(); });
    },

    editJudgeRole(element, judgeName, event) {
        event.stopPropagation();
        const selector = document.createElement('div');
        selector.className = 'judge-role-selector';
        selector.innerHTML = `
            <div class="role-option">${translate('roles.principal_selector')}</div>
            <div class="role-option">${translate('roles.panelista_selector')}</div>
            <div class="role-option">${translate('roles.trainee_selector')}</div>
        `;
        
        const options = selector.querySelectorAll('.role-option');
        options[0].addEventListener('click', () => mainFunctions.changeJudgeRole(judgeName, 'principal'));
        options[1].addEventListener('click', () => mainFunctions.changeJudgeRole(judgeName, 'panelista'));
        options[2].addEventListener('click', () => mainFunctions.changeJudgeRole(judgeName, 'trainee'));
        
        const rect = element.getBoundingClientRect();
        selector.style.top = `${rect.bottom + window.scrollY}px`;
        selector.style.left = `${rect.left + window.scrollX}px`;
        document.body.appendChild(selector);
        selector.classList.add('visible');
        
        function closeSelector(e) {
            if (!selector.contains(e.target) && e.target !== element) {
                selector.remove();
                document.removeEventListener('click', closeSelector);
            }
        }
        requestAnimationFrame(() => {
            document.addEventListener('click', closeSelector);
        });
    },

    updateResolutionIndicators() {
        const teams = ['AG', 'AO', 'BG', 'BO'];
        const resolvedTeams = teams.filter(team => logic.isPositionResolved(team));
        document.querySelectorAll('.comparison-item').forEach(item => {
            const teamsText = item.querySelector('.comparison-teams').textContent;
            const teams = teamsText.split(' vs ').map(t => t.trim().split(' ')[0]);
            const isResolved = teams.every(team => resolvedTeams.includes(team));
            if (isResolved) {
                item.classList.add('resolved');
            } else {
                item.classList.remove('resolved');
            }
        });
    },

    updateCarouselArrows() {
        const grid = document.getElementById('judges-grid');
        const cards = grid ? grid.querySelectorAll('.judge-card') : [];
        const left = document.getElementById('carousel-left');
        const right = document.getElementById('carousel-right');
        if (window.innerWidth <= 480 && cards.length > 1) {
            if(left) left.classList.remove('hidden');
            if(right) right.classList.remove('hidden');
        } else {
            if(left) left.classList.add('hidden');
            if(right) right.classList.add('hidden');
        }
    },

    scrollToCard(index) {
        const grid = document.getElementById('judges-grid');
        const cards = grid ? grid.querySelectorAll('.judge-card') : [];
        if (cards[index]) {
            cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }
};
