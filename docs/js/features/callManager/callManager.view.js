import { state, updateAndSaveState } from '../../common/state.js';
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
    isReady() {
        return !!(document.getElementById('judges-grid') && 
                 document.getElementById('judge-card-template') && 
                 document.getElementById('comparison-grid') && 
                 document.getElementById('comparison-item-template'));
    },

    updateVisualization() {
        const judgesGrid = document.getElementById('judges-grid');
        const template = document.getElementById('judge-card-template');
        
        if (!judgesGrid) {
            // Silently return if DOM elements are not ready yet
            // This can happen during component initialization
            return;
        }
        
        if (!template) {
            // Silently return if template is not ready yet
            return;
        }
        
        judgesGrid.innerHTML = '';

        const principalComparisons = logic.calculateComparisons();
        const principalJudge = state.judges.find(j => j.role === 'principal');

        state.judges.forEach(judge => {
            const clone = template.content.cloneNode(true);
            const judgeCard = clone.querySelector('.judge-card');
            judgeCard.setAttribute('data-judge-id', judge.id);
            judgeCard.classList.remove('principal', 'panelista', 'trainee');
            judgeCard.classList.add(judge.role);

            // Avatar circular con inicial, ahora funcional
            let avatar = document.createElement('div');
            avatar.className = 'judge-avatar';
            avatar.textContent = judge.role === 'principal' ? 'C' : (judge.role === 'panelista' ? 'P' : 'T');
            avatar.title = translate('callManager.changeRole');
            avatar.addEventListener('click', (event) => {
                event.stopPropagation();
                this.editJudgeRole(avatar, judge.id, event);
            });
            judgeCard.querySelector('.judge-header').prepend(avatar);

            const nameTextSpan = clone.querySelector('.name-text');
            const roleSpan = clone.querySelector('.judge-role');
            const judgeNameSpan = clone.querySelector('.judge-name');
            const removeButton = clone.querySelector('.remove-judge');
            const positionGrid = clone.querySelector('.position-grid');
            const switchCheckbox = clone.querySelector('.judge-switch input');

            nameTextSpan.textContent = judge.name;
            // Ocultar las letras de rol junto al nombre
            roleSpan.textContent = '';

            judgeNameSpan.addEventListener('click', () => this.editJudgeName(judgeNameSpan, judge.id));
            // Mantén el renderizado del span de rol (roleSpan) pero NO le agregues ningún event listener.
            // El único lugar donde se llama a this.editJudgeRole es en el avatar (círculo superior izquierdo).
            // El resto del renderizado y el objeto callManagerView quedan igual.

            // Botón de eliminar con ícono
            removeButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 7H18M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7M19 7V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V7H19Z" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            if (judge.role !== 'principal') {
                removeButton.disabled = false;
                removeButton.title = translate('callManager.deleteJudge');
                removeButton.classList.remove('disabled');
                removeButton.addEventListener('click', () => mainFunctions.removeJudge(judge.id));
            } else {
                removeButton.disabled = true;
                removeButton.title = translate('tooltips.cannotDeletePrincipal');
                removeButton.classList.add('disabled');
            }

            // Render celdas de posición con label y número en círculo
            positionGrid.innerHTML = '';
            const roles = [
                { name: 'AG', position: judge.positions.ag },
                { name: 'AO', position: judge.positions.ao },
                { name: 'BG', position: judge.positions.bg },
                { name: 'BO', position: judge.positions.bo }
            ];
            const judgeAllActive = Object.values(judge.activePositions).every(v => v);
            roles.forEach(role => {
                const cell = document.createElement('div');
                cell.className = 'position-cell';
                cell.dataset.role = role.name;
                cell.dataset.position = role.position;
                // Label
                const label = document.createElement('div');
                label.className = 'pos-label';
                label.textContent = translate(`teams.${role.name.toLowerCase()}`);
                // Número en círculo
                const number = document.createElement('div');
                number.className = 'pos-number';
                number.textContent = role.position;
                cell.appendChild(label);
                cell.appendChild(number);
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
            switchCheckbox.addEventListener('change', (e) => mainFunctions.toggleAllPositions(judge.id, e.target.checked));

            judgesGrid.appendChild(clone);
        });

        this.updateComparisons();
        this.updateResolutionIndicators();
        this.updateCarouselArrows();
        // Solo hacer scroll automático en la inicialización, no después de cada actualización
        if (window.innerWidth <= 480 && !state.visualizationInitialized) {
            state.currentCardIndex = 0;
            this.scrollToCard(0);
            state.visualizationInitialized = true;
        }
    },

    updateComparisons(comparisons = null) {
        if (!comparisons) {
            comparisons = logic.calculateComparisons();
        }
        // Actualizar todos los grids de comparación (mobile y desktop)
        const comparisonGrids = document.querySelectorAll('.comparison-grid');
        if (!comparisonGrids.length) {
            // Silently return if DOM elements are not ready yet
            return;
        }
        const totalJudges = state.judges.length;
        if (totalJudges === 0) return;
    
        const impactScores = logic.analyzeComparisonImpact();
        const orderedComparisons = Object.keys(impactScores);
        const template = document.getElementById('comparison-item-template');
    
        comparisonGrids.forEach(comparisonGrid => {
            comparisonGrid.innerHTML = '';
            orderedComparisons.forEach(comparison => {
                const data = comparisons[comparison];
                if (!data) return;
    
                const [team1, team2] = comparison.split(' vs ');
                const votesForTeam1 = data.details.filter(d => d.winner === team1).length;
                const votesForTeam2 = data.details.filter(d => d.winner === team2).length;
    
                const clone = template.content.cloneNode(true);
                const comparisonItem = clone.querySelector('.comparison-item');
    
                // Populate header
                const team1Element = clone.querySelector('.team-1-name');
                const team2Element = clone.querySelector('.team-2-name');
                
                // Determinar ganador y perdedor para asignar iconos
                let team1Icon = '🏆'; // Por defecto trofeo
                let team2Icon = '🏆'; // Por defecto trofeo
                
                if (votesForTeam1 > votesForTeam2) {
                    // Team1 gana, Team2 pierde
                    team1Icon = '🏆';
                    team2Icon = '💀';
                } else if (votesForTeam2 > votesForTeam1) {
                    // Team2 gana, Team1 pierde
                    team1Icon = '💀';
                    team2Icon = '🏆';
                } else {
                    // Empate, ambos tienen trofeo
                    team1Icon = '🏆';
                    team2Icon = '🏆';
                }
                
                team1Element.textContent = translate(`teams.${team1.toLowerCase()}`);
                team2Element.textContent = translate(`teams.${team2.toLowerCase()}`);
                
                // Agregar iconos via CSS usando data attributes
                team1Element.setAttribute('data-icon', team1Icon);
                team2Element.setAttribute('data-icon', team2Icon);
                
                clone.querySelector('.votes').textContent = `${votesForTeam1} - ${votesForTeam2}`;
    
                // Minority indicator logic
                let minorityTeam = null;
                let principalInMinority = false;
                if (votesForTeam1 !== votesForTeam2) {
                    minorityTeam = votesForTeam1 < votesForTeam2 ? team1 : team2;
                    const principalJudge = state.judges.find(j => j.role === 'principal');
                    function normalizeName(name) { return name.trim().toLowerCase(); }
                    if (principalJudge) {
                        const principalVote = data.details.find(d => normalizeName(d.name) === normalizeName(principalJudge.name));
                        if (principalVote && principalVote.winner === minorityTeam) {
                            principalInMinority = true;
                        }
                    }
                }
                const minorityIndicator = clone.querySelector('.minority-indicator');
                if (principalInMinority) {
                    // Mostrar solo 'C💀' en mobile
                    if (window.innerWidth <= 768) {
                        minorityIndicator.textContent = 'C💀';
                    } else {
                        minorityIndicator.textContent = translate('callManager.principalInMinority');
                    }
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
        });
        
        // Calcular y actualizar el análisis preliminar
        this.updateVotingResults();
    },

    updateVotingResults() {
        const preliminaryAnalysis = logic.calculatePreliminaryAnalysis();
        
        // Actualizar todas las secciones de resultado de votación (mobile y desktop)
        const votingResultContainers = [
            document.getElementById('current-voting-result-placeholder'),
            document.getElementById('current-voting-result-mobile')
        ];
        
        votingResultContainers.forEach(container => {
            if (container) {
                container.innerHTML = this.renderVotingResults(preliminaryAnalysis);
            }
        });
    },

    renderVotingResults(analysis) {
        if (!analysis || !analysis.teamResults || analysis.teamResults.length === 0) {
            return '<div class="instructions">No hay datos suficientes para mostrar el resultado de votación.</div>';
        }

        let html = '';
        
        // Contenedor principal
        html += '<div class="voting-results-container">';
        
        // Cards de equipos
        html += '<div class="team-results-grid">';
        analysis.teamResults.forEach(teamResult => {
            const positionColor = this.getPositionColor(teamResult.position);
            const hasPosition = !analysis.hasIncoherences && teamResult.position > 0;
            
            html += `
                <div class="team-result-card" style="background: ${positionColor.background}; border-color: ${positionColor.border};">
                    <div class="team-result-header">
                        <div class="team-name">${translate(`teams.${teamResult.team.toLowerCase()}`)}</div>
                        ${hasPosition ? `<div class="position-badge" style="background: ${positionColor.main};">${teamResult.position}</div>` : ''}
                    </div>
                    <div class="team-result-details">
                        ${teamResult.winsAgainst.length > 0 ? `
                            <div class="result-row">
                                <span class="result-label">Victorias:</span>
                                <span class="result-value">${teamResult.winsAgainst.map(team => translate(`teams.${team.toLowerCase()}`)).join(', ')}</span>
                            </div>
                        ` : ''}
                        ${teamResult.lossesAgainst.length > 0 ? `
                            <div class="result-row">
                                <span class="result-label">Derrotas:</span>
                                <span class="result-value">${teamResult.lossesAgainst.map(team => translate(`teams.${team.toLowerCase()}`)).join(', ')}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        // Sección de incoherencias si existen
        if (analysis.hasIncoherences) {
            html += '<div class="incoherences-section">';
            html += '<div class="incoherences-header">';
            html += '<span class="warning-icon">⚠️</span>';
            html += '<span class="incoherences-title">Incoherencias detectadas</span>';
            html += '</div>';
            
            if (analysis.localContradictions.length > 0) {
                html += '<div class="contradictions-section">';
                html += '<div class="section-title">Contradicciones locales:</div>';
                analysis.localContradictions.forEach(contradiction => {
                    html += `<div class="contradiction-item">• ${contradiction.message}</div>`;
                });
                html += '</div>';
            }
            
            if (analysis.cycles.length > 0) {
                html += '<div class="cycles-section">';
                html += '<div class="section-title">Ciclos:</div>';
                analysis.cycles.forEach(cycle => {
                    html += `<div class="cycle-item">• ${cycle.message}</div>`;
                });
                html += '</div>';
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        
        return html;
    },

    getPositionColor(position) {
        switch (position) {
            case 1: return { main: '#27ae60', background: '#eafbe7', border: '#b6e2b3' };
            case 2: return { main: '#3498db', background: '#e3f2fd', border: '#bbdefb' };
            case 3: return { main: '#f39c12', background: '#fff8e1', border: '#ffcc80' };
            case 4: return { main: '#e74c3c', background: '#ffebee', border: '#ffcdd2' };
            default: return { main: '#95a5a6', background: '#f5f5f5', border: '#e0e0e0' };
        }
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

    editJudgeName(element, judgeId) {
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
            const judge = state.judges.find(j => j.id === judgeId);
            if (judge && newName && newName !== currentName) {
                judge.name = newName;
                updateAndSaveState({ judges: state.judges });
            }
            // Siempre actualizar la visualización y salir del modo edición
            this.updateVisualization();
        };
        
        input.addEventListener('blur', handleEdit);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') input.blur(); });
    },

    editJudgeRole(element, judgeId, event) {
        event.stopPropagation();
        const selector = document.createElement('div');
        selector.className = 'judge-role-selector';
        selector.innerHTML = `
            <div class="role-option">${translate('roles.principal_selector')}</div>
            <div class="role-option">${translate('roles.panelista_selector')}</div>
            <div class="role-option">${translate('roles.trainee_selector')}</div>
        `;
        
        const options = selector.querySelectorAll('.role-option');
        options[0].addEventListener('click', () => mainFunctions.changeJudgeRole(judgeId, 'principal'));
        options[1].addEventListener('click', () => mainFunctions.changeJudgeRole(judgeId, 'panelista'));
        options[2].addEventListener('click', () => mainFunctions.changeJudgeRole(judgeId, 'trainee'));
        
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