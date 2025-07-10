import { state } from '../../common/state.js';
import { athenasRanges, feedbackRanges, panelRanges } from '../../common/constants.js';

export const callManagerLogic = {
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    calculateComparisons() {
        const comparisons = {
            'AG vs AO': { votes: 0, details: [] },
            'AG vs BG': { votes: 0, details: [] },
            'AG vs BO': { votes: 0, details: [] },
            'AO vs BG': { votes: 0, details: [] },
            'AO vs BO': { votes: 0, details: [] },
            'BG vs BO': { votes: 0, details: [] }
        };

        state.judges.forEach(judge => {
            if (!Object.values(judge.activePositions).every(v => v)) return;
            const pos = judge.positions;
            const act = judge.activePositions;
            
            if (act.ag && act.ao) {
                if (pos.ag < pos.ao) {
                    comparisons['AG vs AO'].votes++;
                    comparisons['AG vs AO'].details.push({ name: judge.name, role: judge.role, winner: 'AG' });
                } else {
                    comparisons['AG vs AO'].details.push({ name: judge.name, role: judge.role, winner: 'AO' });
                }
            }
            if (act.ag && act.bg) {
                if (pos.ag < pos.bg) {
                    comparisons['AG vs BG'].votes++;
                    comparisons['AG vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'AG' });
                } else {
                    comparisons['AG vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'BG' });
                }
            }
            if (act.ag && act.bo) {
                if (pos.ag < pos.bo) {
                    comparisons['AG vs BO'].votes++;
                    comparisons['AG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'AG' });
                } else {
                    comparisons['AG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BO' });
                }
            }
            if (act.ao && act.bg) {
                if (pos.ao < pos.bg) {
                    comparisons['AO vs BG'].votes++;
                    comparisons['AO vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'AO' });
                } else {
                    comparisons['AO vs BG'].details.push({ name: judge.name, role: judge.role, winner: 'BG' });
                }
            }
            if (act.ao && act.bo) {
                if (pos.ao < pos.bo) {
                    comparisons['AO vs BO'].votes++;
                    comparisons['AO vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'AO' });
                } else {
                    comparisons['AO vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BO' });
                }
            }
            if (act.bg && act.bo) {
                if (pos.bg < pos.bo) {
                    comparisons['BG vs BO'].votes++;
                    comparisons['BG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BG' });
                } else {
                    comparisons['BG vs BO'].details.push({ name: judge.name, role: judge.role, winner: 'BO' });
                }
            }
        });
        return comparisons;
    },

    getAgreementStatus(comparison) {
        const totalJudges = comparison.details.length;
        const [team1, team2] = Object.keys(comparison.details[0] ? { [comparison.details[0].winner]: true } : { AG: true, AO: true });
        const votesForTeam1 = comparison.details.filter(d => d.winner === team1).length;
        const votesForTeam2 = comparison.details.filter(d => d.winner === team2).length;
        if (votesForTeam1 === totalJudges || votesForTeam2 === totalJudges) {
            return 'agreement';
        } else if (votesForTeam1 === votesForTeam2) {
            return 'mixed';
        } else {
            return 'disagreement';
        }
    },

    isPositionResolved(team) {
        const comparisons = this.calculateComparisons();
        const teamComparisons = Object.entries(comparisons).filter(([comparison]) => 
            comparison.includes(team)
        );
        return teamComparisons.every(([comparison, data]) => {
            const [team1, team2] = comparison.split(' vs ');
            const votesForTeam1 = data.details.filter(d => d.winner === team1).length;
            const votesForTeam2 = data.details.filter(d => d.winner === team2).length;
            const totalJudges = data.details.length;
            return votesForTeam1 === totalJudges || votesForTeam2 === totalJudges;
        });
    },

    analyzeComparisonImpact() {
        const comparisons = this.calculateComparisons();
        const impactScores = {};
        Object.entries(comparisons).forEach(([comparison, data]) => {
            const [team1, team2] = comparison.split(' vs ');
            let maxDiffTeam1 = 0;
            let maxDiffTeam2 = 0;
            const activeJudges = state.judges.filter(j => Object.values(j.activePositions).every(v => v));
            activeJudges.forEach(judge => {
                const pos1 = judge.positions[team1.toLowerCase()];
                const pos2 = judge.positions[team2.toLowerCase()];
                const diff = Math.abs(pos1 - pos2);
                if (pos1 < pos2) {
                    maxDiffTeam1 = Math.max(maxDiffTeam1, diff);
                } else {
                    maxDiffTeam2 = Math.max(maxDiffTeam2, diff);
                }
            });
            const score = maxDiffTeam1 + maxDiffTeam2;
            const votesForTeam1 = data.details.filter(d => d.winner === team1).length;
            const votesForTeam2 = data.details.filter(d => d.winner === team2).length;
            const totalJudges = data.details.length;
            if (votesForTeam1 === totalJudges || votesForTeam2 === totalJudges) {
                impactScores[comparison] = { score: 0, maxDiffTeam1, maxDiffTeam2, votesForTeam1, votesForTeam2, voteDiff: Math.abs(votesForTeam1 - votesForTeam2) };
            } else {
                impactScores[comparison] = { score: score, maxDiffTeam1, maxDiffTeam2, votesForTeam1, votesForTeam2, voteDiff: Math.abs(votesForTeam1 - votesForTeam2) };
            }
        });
        const ordered = Object.entries(impactScores)
            .filter(([, d]) => d.score > 0)
            .sort(([, a], [, b]) => b.score - a.score || a.voteDiff - b.voteDiff)
            .map(([k]) => k);
        Object.keys(comparisons).forEach(key => {
            if (!ordered.includes(key)) ordered.push(key);
        });
        const orderedImpactScores = {};
        ordered.forEach(key => { orderedImpactScores[key] = impactScores[key]; });
        return orderedImpactScores;
    }
};
