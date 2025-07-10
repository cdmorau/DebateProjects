let translations = {};
let currentLang = 'es';
const subscribers = [];

function applyTranslations() {
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        const translation = key.split('.').reduce((obj, key) => obj && obj[key], translations);
        if (translation) {
            element.textContent = translation;
        }
    });
}

export function subscribe(callback) {
    subscribers.push(callback);
}

export function translate(key) {
    return key.split('.').reduce((obj, key) => obj && obj[key], translations) || key;
}

async function setLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('debateAppLang', lang);
    await loadTranslations(lang);
    applyTranslations();
    subscribers.forEach(callback => callback());

    // Update active button
    document.querySelectorAll('.lang-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

async function loadTranslations(lang) {
    try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${lang}.json`);
        }
        translations = await response.json();
            } catch (error) {
            // Error loading translations
        // Fallback to Spanish if the selected language fails
        if (lang !== 'es') {
            await loadTranslations('es');
        }
    }
}

function getBrowserLanguage() {
    const savedLang = localStorage.getItem('debateAppLang');
    if (savedLang) {
        return savedLang;
    }
    const lang = navigator.language || navigator.userLanguage;
    return lang.split('-')[0];
}

export async function init() {
    const lang = getBrowserLanguage();
    currentLang = lang;
    await loadTranslations(lang);
    applyTranslations();

    document.querySelectorAll('.lang-button').forEach(button => {
        button.addEventListener('click', (e) => {
            setLanguage(e.target.dataset.lang);
        });
    });

    // Set initial active button
    document.querySelectorAll('.lang-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
} 