import { athenasRanges, feedbackRanges, panelRanges, wsdcRanges, wsdcReplyRanges, demianRanges, evaRanges, evaPanelistRanges } from '../../common/constants.js';
import { translate } from '../../common/i18n.js';

export const speaksAndFeedsLogic = {
    getAthenasDescription(score) {
        for (const range of athenasRanges) {
            if (score >= range.min && score <= range.max) {
                return translate(`speaks.athenas.${range.key}`);
            }
        }
        return translate('speaks.athenas.prompt');
    },

    getFeedbackDescription(score) {
        if (score === "" || score === null) {
            return "";
        }
        const range = feedbackRanges.find(r => score >= r.min && score <= r.max);
        if (range) {
            return translate(`speaks.feedback.${range.key}`);
        }
        return translate("speaks.feedback.prompt");
    },

    getPanelDescription(score) {
        if (score === "" || score === null) {
            return "";
        }
        const range = panelRanges.find(r => score >= r.min && score <= r.max);
        if (range) {
            return translate(`speaks.panel.${range.key}`);
        }
        return translate("speaks.panel.prompt");
    },

    getWsdcDescription(score) {
        if (score === "" || score === null) {
            return "";
        }
        const range = wsdcRanges.find(r => score >= r.min && score <= r.max);
        if (range) {
            return translate(`speaks.wsdc.${range.key}`);
        }
        return translate("speaks.wsdc.prompt");
    },

    getWsdcReplyDescription(score) {
        if (score === "" || score === null) {
            return "";
        }
        const range = wsdcReplyRanges.find(r => score >= r.min && score <= r.max);
        if (range) {
            return translate(`speaks.wsdcReply.${range.key}`);
        }
        return translate("speaks.wsdcReply.prompt");
    },

    getDemianDescription(score) {
        for (const range of demianRanges) {
            if (score >= range.min && score <= range.max) {
                return translate(`speaks.demian.${range.key}`);
            }
        }
        return translate('speaks.demian.prompt');
    },

    getEvaDescription(score) {
        for (const range of evaRanges) {
            if (score >= range.min && score <= range.max) {
                return translate(`speaks.eva.${range.key}`);
            }
        }
        return translate('speaks.eva.prompt');
    },

    getEvaPanelistDescription(score) {
        for (const range of evaPanelistRanges) {
            if (score >= range.min && score <= range.max) {
                return translate(`speaks.evaPanelist.${range.key}`);
            }
        }
        return translate('speaks.evaPanelist.prompt');
    }
};
